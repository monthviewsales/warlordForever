const { Command } = require('commander');
const registerWalletCommands = require('../../src/cli/walletCommands');

describe('CLI wallet commands', () => {
  let program;

  beforeEach(() => {
    program = new Command();
    jest.spyOn(program, 'command').mockReturnValue({
      description: jest.fn().mockReturnThis(),
      action: jest.fn().mockReturnThis()
    });
    registerWalletCommands(program);
  });

  test('registers wallet commands', () => {
    expect(program.command).toHaveBeenCalledWith('wallet add <name>');
    expect(program.command).toHaveBeenCalledWith('wallet list');
    expect(program.command).toHaveBeenCalledWith('wallet resync <name>');
    expect(program.command).toHaveBeenCalledWith('wallet scan <pubkey>');
    expect(program.command).toHaveBeenCalledWith('wallet pnl <name>');
  });
});