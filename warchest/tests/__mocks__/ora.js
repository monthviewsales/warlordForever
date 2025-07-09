/**
 * Manual mock for ora to avoid ESM import issues in tests.
 */
module.exports = {
  default: () => ({
    start: () => {},
    succeed: () => {},
    fail: () => {},
    stop: () => {},
  }),
};