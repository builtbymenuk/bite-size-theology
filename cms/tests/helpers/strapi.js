/**
 * Strapi test harness (Strapi 5). Follows https://docs.strapi.io/cms/testing: a real Strapi
 * instance per test file, driven with Supertest against strapi.server.httpServer. Because this
 * is a TypeScript project, the code is compiled once by compileStrapi() in global-setup.js and
 * loaded from dist/ via createStrapi({ appDir, distDir }) — no port is opened (Supertest binds
 * an ephemeral one per request) and the database is the throwaway cms/.tmp/test.db.
 */
const path = require('path');
const { APP_DIR, TEST_DB_PATH, applyTestEnv } = require('./env');

const request = require('supertest');

const DIST_DIR = path.join(APP_DIR, 'dist');

let instance;

function assertTestDatabase(strapi) {
  const filename = strapi.config.get('database.connection.connection.filename');
  if (path.resolve(filename) !== path.resolve(TEST_DB_PATH)) {
    throw new Error(`Refusing to run tests against ${filename} (expected ${TEST_DB_PATH})`);
  }
}

async function setupStrapi() {
  if (instance) return instance;
  applyTestEnv();
  // The DB file is shared by every test file in one run (global-setup/teardown delete it), so
  // schema sync + the bootstrap seed happen once and later files boot faster.

  const { createStrapi } = require('@strapi/strapi');
  const strapi = createStrapi({ appDir: APP_DIR, distDir: DIST_DIR, autoReload: false });
  assertTestDatabase(strapi);
  strapi.log.level = process.env.TEST_LOG_LEVEL || 'error';

  await strapi.load();
  // load() registers routes but does not mount them; listen() normally does. Mount without
  // listening so Supertest can drive the http server on an ephemeral port.
  strapi.server.mount();

  instance = strapi;
  return instance;
}

async function cleanupStrapi() {
  if (!instance) return;
  const strapi = instance;
  instance = undefined;
  await strapi.destroy(); // closes the http server and the DB connection
}

/** Supertest request builder with no credentials (the users-permissions PUBLIC role). */
function publicApi() {
  return request(instance.server.httpServer);
}

/** Supertest agent that sends `Authorization: Bearer <token>` on every request. */
function tokenApi(token) {
  return request.agent(instance.server.httpServer).set('Authorization', `Bearer ${token}`);
}

/** Create a full-access content-API token via the admin api-token service; returns the key. */
async function createFullAccessToken(name = `jest-${Date.now()}`) {
  const token = await instance.service('admin::api-token').create({
    name,
    description: 'Created by the Jest suite',
    type: 'full-access',
    kind: 'content-api',
    lifespan: null,
  });
  return token.accessKey;
}

module.exports = {
  APP_DIR,
  DIST_DIR,
  setupStrapi,
  cleanupStrapi,
  publicApi,
  tokenApi,
  createFullAccessToken,
};
