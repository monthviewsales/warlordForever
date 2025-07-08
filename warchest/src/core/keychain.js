/**
 * @module core/keychain
 * @see README.md#key-security
 */

const keytar = require('keytar');

const SERVICE = 'warchest';

/**
 * Save private key to macOS Keychain.
 * @param {string} keychainRef - Reference label for the key.
 * @param {string} privateKey - Private key to save.
 */
async function saveKey(keychainRef, privateKey) {
  await keytar.setPassword(SERVICE, keychainRef, privateKey);
}

/**
 * Retrieve private key from macOS Keychain.
 * @param {string} keychainRef - Reference label for the key.
 * @returns {Promise<string>}
 */
async function getKey(keychainRef) {
  return keytar.getPassword(SERVICE, keychainRef);
}

module.exports = {
  saveKey,
  getKey
};