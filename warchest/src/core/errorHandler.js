/**
 * @module core/errorHandler
 * @see README.md#error-handling
 */

const chalk = require('chalk').default;
const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const debugMode = process.env.DEBUG_MODE === 'true';

const sentErrors = new Set();

function shouldSendToAI(error) {
  const msg = error.message || "";
  const key = msg + "::" + (error.stack || "");
  if (sentErrors.has(key)) return false;
  sentErrors.add(key);

  return (
    msg.includes("custom program error") ||
    msg.includes("Transaction simulation failed") ||
    msg.includes("missing required signature") ||
    msg.includes("account not found") ||
    msg.includes("insufficient funds") ||
    msg.includes("Instruction") ||
    msg.includes("ProgramError")
  );
}

/**
 * Handle errors by logging (no exit—propagate).
 * @param {Error} error - The error to handle.
 */
function handleError(error) {  // Sync now, since no async
  if (debugMode && shouldSendToAI(error)) {
    console.error(chalk.red('[Debug]'), error.stack);  // Added stack for better debug
    try {
      (async () => {
        const response = await openai.responses.create({
          prompt: {
            id: "pmpt_686e87b4810c8190b2ad1ad22885ea7001694adfdee57cce",
            version: "5"
          },
          input: {
            errorMessage: error.message,
            stack: error.stack
          }
        });
        console.warn(chalk.yellow('[AI Debug]'), response.content || 'No AI explanation returned.');
      })();
    } catch (aiErr) {
      console.warn(chalk.yellow('[AI Debug Error]'), aiErr.message);
    }
  }
  console.error(chalk.red('[Error]'), error.message);
  // No process.exit—throw in callers if fatal
}

module.exports = handleError;