/**
 * @module core/warchest
 * @see README.md#usage
 */

const { PrismaClient } = require('@prisma/client');
const Solana = require('./solana');
const Keychain = require('./keychain');
const EventBus = require('./eventBus');
const handleError = require('./errorHandler');
const prisma = new PrismaClient();  // Global for consistency


/**
 * Add a new wallet.
 * @param {string} name - Name of the wallet.
 * @returns {Promise<object>} The created wallet record.
 */
async function addWallet(name) {
  try {
    const { publicKey, keychainRef } = await Solana.createWallet(name);
    const wallet = await prisma.wallet.create({ data: { name, publicKey, keychainRef } });
    EventBus.emit('wallet.add', { name, publicKey });
    return wallet;
  } catch (error) {
    handleError(error);
    throw error;  // Propagate for CLI spinners
  }
}

/**
 * List all wallets.
 * @returns {Promise<Array<object>>} Array of wallet records.
 */
async function listWallets() {
  try {
    return await prisma.wallet.findMany();
  } catch (error) {
    handleError(error);
    throw error;
  }
}

/**
 * Resync wallet data by scanning accounts and persisting results.
 * @param {string} name - Name of the wallet.
 * @returns {Promise<Array<object>>} Token summaries from the scan.
 */
async function resyncWallet(name) {
  try {
    const wallet = await prisma.wallet.findUnique({ where: { name } });
    if (!wallet) throw new Error('Wallet not found');
    const tokens = await Solana.scanAccounts(wallet.publicKey);
    EventBus.emit('wallet.resync', { name });
    return tokens;
  } catch (error) {
    handleError(error);
    throw error;
  }
}

/**
 * Import an existing wallet.
 * @param {string} name - Name of the wallet.
 * @param {string} privateKeyBase58 - Base58-encoded private key.
 * @returns {Promise<object>} The imported wallet record.
 */
async function importWallet(name, privateKeyBase58) {
  try {
    if (debugMode) console.log(chalk.blue('[Debug] warchest: Starting importWallet for name:'), name);  // ADD THIS
    const { publicKey, keychainRef } = await Solana.importWallet(name, privateKeyBase58);
    if (debugMode) console.log(chalk.blue('[Debug] warchest: Got pubkey from solana:'), publicKey);  // ADD THIS
    const wallet = await prisma.wallet.create({ data: { name, publicKey, keychainRef } });
    if (debugMode) console.log(chalk.blue('[Debug] warchest: DB create done for:'), wallet.publicKey);  // ADD THIS
    EventBus.emit('wallet.import', { name, publicKey });
    return wallet;
  } catch (error) {
    if (debugMode) console.log(chalk.blue('[Debug] warchest: importWallet error:'), error.stack);  // ADD THIS FOR STACK
    handleError(error);
    throw error;
  }
}

/**
 * Scan wallet balances and persist results.
 * @param {string} publicKey - Public key of the wallet.
 * @returns {Promise<Array<object>>} Token summaries from the scan.
 */
async function scanWallet(publicKey) {
  try {
    const tokens = await Solana.scanAccounts(publicKey);
    EventBus.emit('wallet.scan', { publicKey });
    return tokens;
  } catch (error) {
    handleError(error);
    throw error;
  }
}

/**
 * Calculate P&L for a wallet and persist snapshot.
 * @param {string} name - Name of the wallet.
 * @returns {Promise<object>} The P&L data including summary and tokens.
 */
async function calculatePnl(name) {
  try {
    const wallet = await prisma.wallet.findUnique({ where: { name } });
    if (!wallet) throw new Error('Wallet not found');
    const pnl = await Solana.calculatePnl(wallet.publicKey);
    EventBus.emit('wallet.pnl', { name, pnl });
    return pnl;
  } catch (error) {
    handleError(error);
    throw error;
  }
}

module.exports = {
  addWallet,
  importWallet,
  listWallets,
  resyncWallet,
  scanWallet,
  calculatePnl
};