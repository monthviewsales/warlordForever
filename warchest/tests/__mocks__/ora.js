/**
 * Manual mock for ora to avoid ESM import issues in tests.
 */
module.exports = {
  default: () => {
    const spinner = {
      start: () => spinner,
      succeed: () => {},
      fail: () => {},
      stop: () => {},
    };
    return spinner;
  },
};