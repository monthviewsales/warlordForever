const solana = require('../../src/core/solana');

describe('core solana', () => {
  test('createWallet returns dummy data', async () => {
    const result = await solana.createWallet();
    expect(result).toHaveProperty('publicKey');
    expect(result).toHaveProperty('keychainRef');
  });
});