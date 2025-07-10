/**
 * @module core/errorHandler
 * @see README.md#error-handling
 */

const chalk = require('chalk').default;
const debugMode = process.env.DEBUG_MODE === 'true';

/**
 * Handle errors by logging (no exit—propagate).
 * @param {Error} error - The error to handle.
 */
function handleError(error) {  // Sync now, since no async
  if (debugMode) {
    console.error(chalk.red('[Debug]'), error.stack);  // Added stack for better debug
  }
  console.error(chalk.red('[Error]'), error.message);
  // No process.exit—throw in callers if fatal
}

module.exports = handleError;