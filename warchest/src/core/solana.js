/**
 * @module core/solana
 * @see README.md#rpc--api
 */

// import RPC and keypair signer utilities from kit
const { createSolanaRpc, createKeyPairSignerFromBytes } = require('@solana/kit');
const nacl = require('tweetnacl');
const EventBus = require('./eventBus');
const keychain = require('./keychain');
const errorHandler = require('./errorHandler');
const { Client } = require('@solana-tracker/data-api');
const LAMPORTS_PER_SOL = 1e9;

// initialize Data API client
const dataApiClient = new Client({ apiKey: process.env.SOLANA_API_KEY });

/**
 * Create a new Solana wallet.
 * @returns {Promise<{publicKey: string, keychainRef: string}>}
 */
async function createWallet(name) {
  try {
    // generate raw Ed25519 keypair
    const rawKeyPair = nacl.sign.keyPair();
    // wrap as a Kit signer to obtain address
    const signer = await createKeyPairSignerFromBytes(rawKeyPair.secretKey);
    const publicKey = signer.address;
    // serialize private key bytes to hex
    const privateKeyHex = Buffer.from(rawKeyPair.secretKey).toString('hex');
    // save to keychain
    await keychain.saveKey(name, privateKeyHex);
    return { publicKey, keychainRef: name };
  } catch (err) {
    errorHandler(err);
    throw err;
  }
}

/**
 * Retrieve the private key for a given public key.
 * @param {string} publicKey - Public key of the wallet.
 * @returns {Promise<string>}
 */
async function getPrivateKey(publicKey) {
  try {
    return await keychain.getKey(publicKey);
  } catch (err) {
    errorHandler(err);
    throw err;
  }
}

/**
 * Sync wallet accounts from the network.
 * @param {string} publicKey - Public key of the wallet.
 */
async function syncWallet(publicKey) {
  EventBus.emit('solana.sync.start', { publicKey });
  try {
    const rpc = createSolanaRpc(process.env.SOLANA_RPC_URL);
    const lamports = await rpc.getBalance(publicKey).send();
    const solBalance = lamports / LAMPORTS_PER_SOL;
    EventBus.emit('solana.sync.complete', {
      publicKey,
      balances: { sol: solBalance }
    });
    return { sol: solBalance };
  } catch (err) {
    errorHandler(err);
    throw err;
  }
}

/**
 * Scan token accounts for a wallet.
 * @param {string} publicKey - Public key of the wallet.
 */
async function scanAccounts(publicKey) {
  EventBus.emit('solana.scan.start', { publicKey });
  try {
    const accounts = await dataApiClient.getWallet(publicKey);
    EventBus.emit('solana.scan.complete', {
      publicKey,
      accounts
    });
    return accounts;
  } catch (err) {
    errorHandler(err);
    throw err;
  }
}

/**
 * Calculate P&L for a wallet.
 * @param {string} publicKey - Public key of the wallet.
 * @returns {Promise<Object>} Full P&L data including tokens and summary.
 */
async function calculatePnl(publicKey) {
  EventBus.emit('solana.pnl.start', { publicKey });
  try {
    const data = await dataApiClient.getWalletPnL(publicKey, true, true, false);
    EventBus.emit('solana.pnl.complete', {
      publicKey,
      summary: data.summary,
      tokens: data.tokens
    });
    return data;
  } catch (err) {
    errorHandler(err);
    throw err;
  }
}

module.exports = {
  createWallet,
  getPrivateKey,
  syncWallet,
  scanAccounts,
  calculatePnl
};