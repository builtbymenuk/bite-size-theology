const path = require('path');
const { DIST_DIR, setupStrapi, cleanupStrapi } = require('./helpers/strapi');

// The compiled src/index.ts that Strapi itself loaded (createStrapi reads from dist/).
const app = require(path.join(DIST_DIR, 'src', 'index.js')).default;

let strapi;

beforeAll(async () => {
  strapi = await setupStrapi();
});
afterAll(cleanupStrapi);

const singleTypeUids = () =>
  Object.values(strapi.contentTypes)
    .filter((ct) => ct.uid.startsWith('api::') && ct.kind === 'singleType')
    .map((ct) => ct.uid);

async function snapshot() {
  const publicRole = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });
  const permissions = await strapi.db
    .query('plugin::users-permissions.permission')
    .findMany({ where: { role: publicRole.id }, select: ['action'] });

  const rows = {};
  for (const uid of singleTypeUids()) rows[uid] = await strapi.db.query(uid).count();

  const counts = {};
  for (const uid of ['api::product.product', 'api::category.category']) {
    counts[uid] = await strapi.db.query(uid).count();
  }
  return { actions: permissions.map((p) => p.action).sort(), rows, counts };
}

test('public role gets read access to exactly the intended types', async () => {
  const { actions } = await snapshot();
  const apiActions = actions.filter((a) => a.startsWith('api::'));
  // 21 single types x find + 4 public collections x (find, findOne)
  expect(apiActions).toHaveLength(21 + 4 * 2);
  for (const a of apiActions) expect(a).toMatch(/\.(find|findOne)$/);
  for (const forbidden of ['order', 'donation', 'contact-message', 'prayer-request', 'booking-request',
    'newsletter-subscriber', 'notification-settings']) {
    expect(apiActions.some((a) => a.startsWith(`api::${forbidden}.`))).toBe(false);
  }
});

test('bootstrap seeded every public single type', async () => {
  const { rows, actions } = await snapshot();
  const publicSingles = actions
    .filter((a) => a.startsWith('api::') && a.endsWith('.find'))
    .map((a) => a.slice(0, -'.find'.length))
    .filter((uid) => uid in rows);
  expect(publicSingles).toHaveLength(21);
  for (const uid of publicSingles) expect([uid, rows[uid]]).toEqual([uid, 1]);
});

test('running bootstrap again changes nothing (idempotent)', async () => {
  const first = await snapshot();
  await app.bootstrap({ strapi });
  await app.bootstrap({ strapi });
  expect(await snapshot()).toEqual(first);
});
