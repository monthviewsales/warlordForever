/**
 * @module core/errorHandler
 * @see README.md#error-handling
 */

const chalk = require('chalk').default;
const debugMode = process.env.DEBUG_MODE === 'true';

/**
 * Handle errors by logging and exiting.
 * @param {Error} error - The error to handle.
 */
async function handleError(error) {
  if (debugMode) {
    console.error(chalk.red('[Debug]'), error);
  }
  console.error(chalk.red('[Error]'), error.message);
  process.exit(1);
}

module.exports = handleError;