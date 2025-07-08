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