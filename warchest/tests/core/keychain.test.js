const keychain = require('../../src/core/keychain');
const keytar = require('keytar');
jest.mock('keytar');

describe('core keychain', () => {
  test('saveKey and getKey use keytar', async () => {
    keytar.setPassword.mockResolvedValue();
    keytar.getPassword.mockResolvedValue('priv');
    await keychain.saveKey('ref', 'priv');
    expect(keytar.setPassword).toHaveBeenCalledWith('warchest', 'ref', 'priv');
    const priv = await keychain.getKey('ref');
    expect(priv).toBe('priv');
  });
});