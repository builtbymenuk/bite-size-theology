/** Jest config for the Strapi integration suite (see tests/helpers/strapi.js). */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/\\.tmp/', '/\\.cache/', '/\\.strapi/'],
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/\\.strapi/'],
  globalSetup: '<rootDir>/tests/helpers/global-setup.js',
  globalTeardown: '<rootDir>/tests/helpers/global-teardown.js',
  testTimeout: 60000,
};
