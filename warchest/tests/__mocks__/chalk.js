/**
 * Manual mock for chalk to avoid ESM import issues in tests.
 */
const chalk = {
  red: (msg) => msg,
  green: (msg) => msg,
  cyan: (msg) => msg,
  bold: (msg) => msg,
  underline: (msg) => msg,
};
module.exports = { default: chalk };