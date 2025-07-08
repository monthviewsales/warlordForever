/**
 * @module cli/walletCommands
 * @see README.md#usage
 */

const ora = require('ora');
const chalk = require('chalk');
const EventBus = require('../core/eventBus');
const {
  addWallet,
  listWallets,
  resyncWallet,
  scanWallet,
  calculatePnl
} = require('../core/warchest');

/**
 * Register wallet commands to the CLI.
 * @param {import('commander').Command} program - The commander program instance.
 */
function registerWalletCommands(program) {
  program
    .command('wallet add <name>')
    .description('Add a new wallet by name')
    .action(async (name) => {
      const spinner = ora(`Adding wallet ${name}`).start();
      try {
        const wallet = await addWallet(name);
        spinner.succeed(chalk.green(`Wallet added: ${wallet.publicKey}`));
        EventBus.emit('wallet.add', { name: wallet.name, publicKey: wallet.publicKey });
      } catch (error) {
        spinner.fail(chalk.red(error.message));
      }
    });

  program
    .command('wallet list')
    .description('List all wallets')
    .action(async () => {
      const spinner = ora('Listing wallets').start();
      try {
        const wallets = await listWallets();
        spinner.stop();
        wallets.forEach((w) => {
          console.log(chalk.cyan(`${w.name}: ${w.publicKey}`));
        });
        EventBus.emit('wallet.list', wallets);
      } catch (error) {
        spinner.fail(chalk.red(error.message));
      }
    });

  program
    .command('wallet resync <name>')
    .description('Resynchronize a wallet')
    .action(async (name) => {
      const spinner = ora(`Resyncing wallet ${name}`).start();
      try {
        await resyncWallet(name);
        spinner.succeed(chalk.green(`Wallet resynced: ${name}`));
        EventBus.emit('wallet.resync', { name });
      } catch (error) {
        spinner.fail(chalk.red(error.message));
      }
    });

  program
    .command('wallet scan <pubkey>')
    .description('Scan a wallet by public key')
    .action(async (pubkey) => {
      const spinner = ora(`Scanning wallet ${pubkey}`).start();
      try {
        await scanWallet(pubkey);
        spinner.succeed(chalk.green(`Wallet scanned: ${pubkey}`));
        EventBus.emit('wallet.scan', { publicKey: pubkey });
      } catch (error) {
        spinner.fail(chalk.red(error.message));
      }
    });

  program
    .command('wallet pnl <name>')
    .description('Calculate P&L for a wallet')
    .action(async (name) => {
      const spinner = ora(`Calculating P&L for ${name}`).start();
      try {
        const pnl = await calculatePnl(name);
        spinner.succeed(chalk.green(`P&L for ${name}: ${pnl}`));
        EventBus.emit('wallet.pnl', { name, pnl });
      } catch (error) {
        spinner.fail(chalk.red(error.message));
      }
    });
}

module.exports = registerWalletCommands;