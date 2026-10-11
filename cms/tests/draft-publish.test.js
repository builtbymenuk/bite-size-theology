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

// Strapi 5 lets any role with find/findOne on a draft-and-publish type pass `?status=draft`, and
// the public role has both on posts. The post router (src/api/post/routes/post.ts) forces
// `published` for anonymous callers; this pins that, while a token still sees drafts.
test('anonymous `?status=draft` cannot read unpublished posts; a token still can', async () => {
  const title = `Secret draft ${Date.now()}`;
  const created = await api.post('/api/posts').query({ status: 'draft' }).send({ data: { title } });
  expect(created.status).toBe(201);
  const { documentId } = created.body.data;

  const list = await publicApi().get('/api/posts').query({ status: 'draft' });
  expect(list.status).toBe(200);
  expect(list.body.data.some((p) => p.title === title)).toBe(false);

  const one = await publicApi().get(`/api/posts/${documentId}`).query({ status: 'draft' });
  expect(one.status).toBe(404);

  // The server-side token (what the website uses) is unaffected.
  const viaToken = await api.get(`/api/posts/${documentId}`).query({ status: 'draft' });
  expect(viaToken.status).toBe(200);
  expect(viaToken.body.data.title).toBe(title);
});
