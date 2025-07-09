jest.mock('@prisma/client');
jest.mock('../../src/core/solana');
jest.mock('../../src/core/keychain');

const { PrismaClient } = require('@prisma/client');
const warchest = require('../../src/core/warchest');
const eventBus = require('../../src/core/eventBus');
jest.spyOn(eventBus, 'emit');

describe('core warchest', () => {
  let prismaMock;

  beforeAll(() => {
    prismaMock = {
      wallet: {
        create: jest.fn().mockResolvedValue({ name: 'name', publicKey: 'pk' }),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue({ publicKey: 'pk' })
      }
    };
    PrismaClient.mockImplementation(() => prismaMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('addWallet emits event and returns wallet', async () => {
    const solana = require('../../src/core/solana');
    solana.createWallet.mockResolvedValue({ publicKey: 'pk', keychainRef: 'ref' });
    solana.getPrivateKey.mockResolvedValue('priv');
    const result = await warchest.addWallet('name');
    expect(result.publicKey).toBe('pk');
    expect(eventBus.emit).toHaveBeenCalledWith('wallet.add', { name: 'name', publicKey: 'pk' });
  });
});