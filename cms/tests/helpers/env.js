/**
 * Test environment. Must be required before anything from @strapi/* — Strapi's configuration
 * module runs dotenv at require time. Values are forced (not defaulted) so a stray shell
 * variable can never point the suite at the real database.
 */
const path = require('path');

const APP_DIR = path.resolve(__dirname, '..', '..');
const TEST_DB_RELATIVE = '.tmp/test.db';
const TEST_DB_PATH = path.join(APP_DIR, TEST_DB_RELATIVE);

const TEST_ENV = {
  NODE_ENV: 'test',
  APP_KEYS: 'testKeyOne,testKeyTwo',
  API_TOKEN_SALT: 'test-api-token-salt',
  ADMIN_JWT_SECRET: 'test-admin-jwt-secret',
  TRANSFER_TOKEN_SALT: 'test-transfer-token-salt',
  JWT_SECRET: 'test-jwt-secret',
  ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef',
  DATABASE_CLIENT: 'sqlite',
  // Relative to cms/: config/database.ts does path.join(__dirname, '..', '..', filename).
  DATABASE_FILENAME: TEST_DB_RELATIVE,
  HOST: '127.0.0.1',
  PORT: '0',
  STRAPI_TELEMETRY_DISABLED: 'true',
  STRAPI_DISABLE_CRON: 'true',
  // dotenv in @strapi/core loads ENV_PATH (default ./.env). Point it at the dummy file so the
  // real cms/.env is never read.
  ENV_PATH: path.join(APP_DIR, '.env.test.example'),
};

function applyTestEnv() {
  Object.assign(process.env, TEST_ENV);
}

applyTestEnv();

module.exports = { APP_DIR, TEST_DB_PATH, TEST_ENV, applyTestEnv };
