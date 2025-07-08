/**
 * @module core/errorHandler
 * @see README.md#error-handling
 */

const chalk = require('chalk').default;

/**
 * Handle errors by logging and exiting.
 * @param {Error} error - The error to handle.
 */
async function handleError(error) {
  console.error(chalk.red('[Error]'), error.message);
  process.exit(1);
}

module.exports = handleError;