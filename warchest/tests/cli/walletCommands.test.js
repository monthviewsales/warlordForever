const { Command } = require('commander');
const registerWalletCommands = require('../../src/cli/walletCommands');

describe('CLI wallet commands', () => {
  let program;

  let walletCmd;
  beforeEach(() => {
    program = new Command();
    walletCmd = {
      command: jest.fn().mockReturnThis(),
      description: jest.fn().mockReturnThis(),
      action: jest.fn().mockReturnThis()
    };
    jest.spyOn(program, 'command').mockReturnValue(walletCmd);
    registerWalletCommands(program);
  });

  test('registers wallet commands', () => {
    expect(program.command).toHaveBeenCalledWith('wallet');
    expect(walletCmd.command).toHaveBeenCalledWith('add <name>');
    expect(walletCmd.command).toHaveBeenCalledWith('list');
    expect(walletCmd.command).toHaveBeenCalledWith('resync <name>');
    expect(walletCmd.command).toHaveBeenCalledWith('scan <pubkey>');
    expect(walletCmd.command).toHaveBeenCalledWith('pnl <name>');
  });
});

const warchestCore = require('../../src/core/warchest');

describe('CLI wallet summary output', () => {
  let program;
  beforeEach(() => {
    program = new Command();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'table').mockImplementation(() => {});
    registerWalletCommands(program);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('scan command prints summary table', async () => {
    warchestCore.scanWallet = jest.fn().mockResolvedValue([
      { mint: 'M1', symbol: 'S1', balance: 5, value: 10 }
    ]);
    await program.parseAsync(['wallet', 'scan', 'pubkey'], { from: 'user' });
    expect(warchestCore.scanWallet).toHaveBeenCalledWith('pubkey');
    expect(console.table).toHaveBeenCalledWith([
      { Mint: 'M1', Symbol: 'S1', Balance: 5, Value: 10 }
    ]);
  });

  test('resync command prints summary table', async () => {
    warchestCore.resyncWallet = jest.fn().mockResolvedValue([
      { mint: 'M2', symbol: 'S2', balance: 7, value: 14 }
    ]);
    await program.parseAsync(['wallet', 'resync', 'name'], { from: 'user' });
    expect(warchestCore.resyncWallet).toHaveBeenCalledWith('name');
    expect(console.table).toHaveBeenCalledWith([
      { Mint: 'M2', Symbol: 'S2', Balance: 7, Value: 14 }
    ]);
  });
});