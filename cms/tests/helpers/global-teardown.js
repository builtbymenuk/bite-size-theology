const { removeTestDb } = require('./global-setup');

module.exports = async () => {
  removeTestDb();
};
