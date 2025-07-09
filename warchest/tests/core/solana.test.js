jest.mock('tweetnacl', () => ({
  sign: { keyPair: () => ({ secretKey: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]) }) }
}));
jest.mock('@solana/kit', () => ({
  createKeyPairSignerFromBytes: jest.fn(async () => ({ address: 'dummyPubKey' }))
}));
jest.mock('../../src/core/keychain', () => ({ saveKey: jest.fn(), getKey: jest.fn() }));
const solana = require('../../src/core/solana');

describe('core solana', () => {
  test('createWallet returns expected publicKey and keychainRef', async () => {
    const result = await solana.createWallet('testKey');
    expect(result).toEqual({ publicKey: 'dummyPubKey', keychainRef: 'testKey' });
    const keychain = require('../../src/core/keychain');
    expect(keychain.saveKey).toHaveBeenCalledWith('testKey', expect.any(String));
  });
});