const {
  setupStrapi,
  cleanupStrapi,
  publicApi,
  tokenApi,
  createFullAccessToken,
} = require('./helpers/strapi');

let api;

beforeAll(async () => {
  await setupStrapi();
  api = tokenApi(await createFullAccessToken());
});
afterAll(cleanupStrapi);

const publicTitles = async (query = {}) => {
  const res = await publicApi().get('/api/posts').query({ 'pagination[pageSize]': 100, ...query });
  expect(res.status).toBe(200);
  return res.body.data.map((p) => p.title);
};

test('a draft post stays private until it is published', async () => {
  const title = `Draft post ${Date.now()}`;

  // Strapi 5 REST: `?status=draft` on create saves a draft without publishing.
  const created = await api.post('/api/posts').query({ status: 'draft' }).send({ data: { title } });
  expect(created.status).toBe(201);
  expect(created.body.data.publishedAt).toBeNull();
  const { documentId } = created.body.data;

  expect(await publicTitles()).not.toContain(title);
  expect((await publicApi().get(`/api/posts/${documentId}`)).status).toBe(404);

  // Publishing over REST = updating with ?status=published.
  const published = await api
    .put(`/api/posts/${documentId}`)
    .query({ status: 'published' })
    .send({ data: { title } });
  expect(published.status).toBe(200);
  expect(published.body.data.publishedAt).not.toBeNull();

  expect(await publicTitles()).toContain(title);
  const one = await publicApi().get(`/api/posts/${documentId}`);
  expect(one.status).toBe(200);
  expect(one.body.data.title).toBe(title);
});

// FINDING (Strapi 5 default behaviour, not fixed here): any role holding `find`/`findOne` on a
// draft-and-publish type can pass `?status=draft` and read unpublished content. The PUBLIC role
// has find+findOne on posts, so drafts are readable by anyone. This test pins the CURRENT
// behaviour so the leak is visible; once a fix lands (e.g. a route middleware on api::post.post
// that forces status=published for unauthenticated requests), flip the expectations to `false`.
test('KNOWN LEAK: public `?status=draft` exposes unpublished posts', async () => {
  const title = `Secret draft ${Date.now()}`;
  const created = await api.post('/api/posts').query({ status: 'draft' }).send({ data: { title } });
  expect(created.status).toBe(201);
  const { documentId } = created.body.data;

  // Without the parameter the draft is hidden...
  expect(await publicTitles()).not.toContain(title);
  expect((await publicApi().get(`/api/posts/${documentId}`)).status).toBe(404);

  // ...but asking for drafts returns it to an anonymous caller.
  const list = await publicApi().get('/api/posts').query({ status: 'draft' });
  const one = await publicApi().get(`/api/posts/${documentId}`).query({ status: 'draft' });
  expect(list.status).toBe(200);
  expect(one.status).toBe(200);
  const listLeaks = list.body.data.some((p) => p.title === title);
  const oneLeaks = one.body.data?.title === title;
  expect({ listLeaks, oneLeaks }).toEqual({ listLeaks: true, oneLeaks: true });
});
