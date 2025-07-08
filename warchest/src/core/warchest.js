/**
 * @module core/warchest
 * @see README.md#usage
 */

const { PrismaClient } = require('@prisma/client');
const Solana = require('./solana');
const Keychain = require('./keychain');
const EventBus = require('./eventBus');
const errorHandler = require('./errorHandler');

const prisma = new PrismaClient();

/**
 * Add a new wallet.
 * @param {string} name - Name of the wallet.
 * @returns {Promise<object>} The created wallet record.
 */
async function addWallet(name) {
  try {
    const { publicKey, keychainRef } = await Solana.createWallet();
    const privateKey = await Solana.getPrivateKey(publicKey);
    await Keychain.saveKey(keychainRef, privateKey);
    const wallet = await prisma.wallet.create({
      data: { name, publicKey, keychainRef }
    });
    EventBus.emit('wallet.add', { name, publicKey });
    return wallet;
  } catch (error) {
    errorHandler(error);
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
    errorHandler(error);
  }
}

/**
 * Resync wallet data.
 * @param {string} name - Name of the wallet.
 */
async function resyncWallet(name) {
  try {
    const wallet = await prisma.wallet.findUnique({ where: { name } });
    if (!wallet) throw new Error('Wallet not found');
    await Solana.syncWallet(wallet.publicKey);
    EventBus.emit('wallet.resync', { name });
  } catch (error) {
    errorHandler(error);
  }
}

/**
 * Scan wallet balances.
 * @param {string} publicKey - Public key of the wallet.
 */
async function scanWallet(publicKey) {
  try {
    await Solana.scanAccounts(publicKey);
    EventBus.emit('wallet.scan', { publicKey });
  } catch (error) {
    errorHandler(error);
  }
}

/**
 * Calculate P&L for a wallet.
 * @param {string} name - Name of the wallet.
 * @returns {Promise<number>} The P&L value.
 */
async function calculatePnl(name) {
  try {
    const wallet = await prisma.wallet.findUnique({ where: { name } });
    if (!wallet) throw new Error('Wallet not found');
    const pnl = await Solana.calculatePnl(wallet.publicKey);
    EventBus.emit('wallet.pnl', { name, pnl });
    return pnl;
  } catch (error) {
    errorHandler(error);
  }
}

module.exports = {
  addWallet,
  listWallets,
  resyncWallet,
  scanWallet,
  calculatePnl
};