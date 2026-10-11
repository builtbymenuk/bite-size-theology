const {
  setupStrapi,
  cleanupStrapi,
  tokenApi,
  createFullAccessToken,
} = require('./helpers/strapi');

let api;
const uniq = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

beforeAll(async () => {
  await setupStrapi();
  api = tokenApi(await createFullAccessToken());
});
afterAll(cleanupStrapi);

const expectValidationError = (res) => {
  expect(res.status).toBe(400);
  expect(res.body.error).toMatchObject({ status: 400 });
};

describe('contact-message', () => {
  test('create returns 201 and the entry can be read back', async () => {
    const data = { name: 'Jest', email: 'jest@example.com', message: `hello ${uniq()}` };
    const created = await api.post('/api/contact-messages').send({ data });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ ...data, handled: false });

    const read = await api.get(`/api/contact-messages/${created.body.data.documentId}`);
    expect(read.status).toBe(200);
    expect(read.body.data).toMatchObject(data);
  });

  test('a missing required field is a 400', async () => {
    const res = await api
      .post('/api/contact-messages')
      .send({ data: { name: 'Jest', email: 'jest@example.com' } });
    expectValidationError(res);
  });
});

test('booking-request requires organization (400 without it)', async () => {
  const res = await api
    .post('/api/booking-requests')
    .send({ data: { name: 'Jest', email: 'jest@example.com', message: 'hi' } });
  expectValidationError(res);
});

test('a duplicate newsletter-subscriber email is a 400', async () => {
  const email = `sub-${uniq()}@example.com`;
  const first = await api.post('/api/newsletter-subscribers').send({ data: { email } });
  expect(first.status).toBe(201);
  expect(first.body.data.subscriptionStatus).toBe('pending');

  const dup = await api.post('/api/newsletter-subscribers').send({ data: { email } });
  expectValidationError(dup);
});

describe('order uniqueness (backs the payment idempotency in the Next.js app)', () => {
  test.each(['paypalOrderId', 'stripeSessionId'])('a duplicate %s is a 400', async (field) => {
    const data = { email: 'buyer@example.com', orderStatus: 'paid', [field]: `id-${uniq()}` };
    const first = await api.post('/api/orders').send({ data });
    expect(first.status).toBe(201);

    const dup = await api.post('/api/orders').send({ data: { ...data, email: 'other@example.com' } });
    expectValidationError(dup);

    const list = await api.get('/api/orders').query({ filters: { [field]: { $eq: data[field] } } });
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
  });

  test.each(['paypalOrderId', 'stripeSessionId'])('a duplicate donation %s is a 400', async (field) => {
    const data = { amount: 10, currency: 'USD', [field]: `don-${uniq()}` };
    expect((await api.post('/api/donations').send({ data })).status).toBe(201);
    expectValidationError(await api.post('/api/donations').send({ data }));
  });

  test('an invalid orderStatus enum value is a 400', async () => {
    const res = await api.post('/api/orders').send({ data: { orderStatus: 'shipped' } });
    expectValidationError(res);
  });
});

describe('strictParams', () => {
  test('an unknown body field is a 400', async () => {
    const res = await api
      .post('/api/prayer-requests')
      .send({ data: { request: 'pray', notAField: true } });
    expectValidationError(res);
  });

  test('an unknown query parameter is a 400', async () => {
    const res = await api.get('/api/orders').query({ bogus: '1' });
    expectValidationError(res);
  });
});

test('GET a nonexistent order documentId is a 404', async () => {
  const res = await api.get('/api/orders/doesnotexist0000000000000');
  expect(res.status).toBe(404);
});

test('pagination[pageSize] is capped at maxLimit (100)', async () => {
  const res = await api.get('/api/products').query({ 'pagination[pageSize]': 1000 });
  expect(res.status).toBe(200);
  expect(res.body.meta.pagination.pageSize).toBe(100);
});

test('prayer-request update + delete round trip', async () => {
  const created = await api
    .post('/api/prayer-requests')
    .send({ data: { request: `pray ${uniq()}`, urgent: true } });
  expect(created.status).toBe(201);
  expect(created.body.data.handled).toBe(false);
  const { documentId } = created.body.data;

  const updated = await api.put(`/api/prayer-requests/${documentId}`).send({ data: { handled: true } });
  expect(updated.status).toBe(200);
  expect(updated.body.data).toMatchObject({ documentId, handled: true, urgent: true });

  const deleted = await api.delete(`/api/prayer-requests/${documentId}`);
  expect(deleted.status).toBe(204);

  expect((await api.get(`/api/prayer-requests/${documentId}`)).status).toBe(404);
});
