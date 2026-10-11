const { setupStrapi, cleanupStrapi, publicApi, tokenApi } = require('./helpers/strapi');

beforeAll(setupStrapi);
afterAll(cleanupStrapi);

describe('public role (no token)', () => {
  test.each(['/api/hero', '/api/products', '/api/categories', '/api/posts', '/api/store'])(
    'GET %s is readable',
    async (url) => {
      const res = await publicApi().get(url);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
    }
  );

  test.each([
    '/api/orders',
    '/api/donations',
    '/api/contact-messages',
    '/api/prayer-requests',
    '/api/booking-requests',
    '/api/newsletter-subscribers',
    '/api/notification-settings',
  ])('GET %s is forbidden', async (url) => {
    const res = await publicApi().get(url);
    expect(res.status).toBe(403);
  });

  test.each([
    ['/api/contact-messages', { name: 'A', email: 'a@example.com', message: 'hi' }],
    ['/api/orders', { email: 'a@example.com', orderStatus: 'paid' }],
    ['/api/newsletter-subscribers', { email: 'a@example.com' }],
  ])('POST %s is forbidden', async (url, data) => {
    const res = await publicApi().post(url).send({ data });
    expect(res.status).toBe(403);
  });

  test('PUT and DELETE on a product are forbidden', async () => {
    const list = await publicApi().get('/api/products');
    expect(list.status).toBe(200);
    expect(list.body.data.length).toBeGreaterThan(0); // seeded by bootstrap
    const { documentId } = list.body.data[0];

    const put = await publicApi().put(`/api/products/${documentId}`).send({ data: { title: 'pwned' } });
    expect(put.status).toBe(403);

    const del = await publicApi().delete(`/api/products/${documentId}`);
    expect(del.status).toBe(403);

    const after = await publicApi().get(`/api/products/${documentId}`);
    expect(after.status).toBe(200);
    expect(after.body.data.title).not.toBe('pwned');
  });
});

test('an invalid bearer token is rejected with 401', async () => {
  const res = await tokenApi('not-a-real-token').get('/api/products');
  expect(res.status).toBe(401);
});
