/**
 * Runs once before the suite: compile the TypeScript project to dist/ with Strapi's own
 * compileStrapi() (what `strapi develop`/`strapi build` use), and start from an empty test DB.
 */
const fs = require('fs');
const { APP_DIR, TEST_DB_PATH } = require('./env');

const removeTestDb = () => {
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    fs.rmSync(TEST_DB_PATH + suffix, { force: true });
  }
};

module.exports = async () => {
  removeTestDb();
  const { compileStrapi } = require('@strapi/strapi');
  await compileStrapi({ appDir: APP_DIR });
};

module.exports.removeTestDb = removeTestDb;
