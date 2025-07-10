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

  test('resyncWallet returns tokens and emits event', async () => {
    const solana = require('../../src/core/solana');
    solana.scanAccounts.mockResolvedValue([{ mint: 'M1', symbol: 'S1', balance: 1, value: 2 }]);
    const tokens = await warchest.resyncWallet('name');
    expect(tokens).toEqual([{ mint: 'M1', symbol: 'S1', balance: 1, value: 2 }]);
    expect(eventBus.emit).toHaveBeenCalledWith('wallet.resync', { name: 'name' });
  });

  test('scanWallet returns tokens and emits event', async () => {
    const solana = require('../../src/core/solana');
    solana.scanAccounts.mockResolvedValue([{ mint: 'M2', symbol: 'S2', balance: 3, value: 4 }]);
    const tokens = await warchest.scanWallet('pubkey');
    expect(tokens).toEqual([{ mint: 'M2', symbol: 'S2', balance: 3, value: 4 }]);
    expect(eventBus.emit).toHaveBeenCalledWith('wallet.scan', { publicKey: 'pubkey' });
  });

  test('calculatePnl returns data and emits event', async () => {
    const solana = require('../../src/core/solana');
    const pnlData = { summary: { total: 100 }, tokens: [] };
    solana.calculatePnl.mockResolvedValue(pnlData);
    const data = await warchest.calculatePnl('name');
    expect(data).toBe(pnlData);
    expect(eventBus.emit).toHaveBeenCalledWith('wallet.pnl', { name: 'name', pnl: pnlData });
  });
});