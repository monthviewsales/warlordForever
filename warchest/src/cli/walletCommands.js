/**
 * @module cli/walletCommands
 * @see README.md#usage
 */

import ora from 'ora';
import chalk from 'chalk';
import inquirer from 'inquirer';
import EventBus from '../core/eventBus.js';
import {
  addWallet,
  importWalletFlexible,
  listWallets,
  calculatePnl,
  resyncWallet, 
  scanWallet
} from '../core/warchest.js';
const debugMode = process.env.DEBUG_MODE === 'true';

/**
 * Register wallet commands to the CLI.
 * @param {import('commander').Command} program - The commander program instance.
 */
function registerWalletCommands(program) {
  const walletCmd = program
    .command('wallet')
    .description('Manage wallets');

  walletCmd
    .command('add <name>')
    .description('Add a new wallet by name')
    .action(async (name) => {
      const spinner = ora(`Adding wallet ${name}`).start();
      try {
        const walletRecord = await addWallet(name);
        spinner.succeed(chalk.green(`Wallet added: ${walletRecord.publicKey}`));
        EventBus.emit('wallet.add', { name: walletRecord.name, publicKey: walletRecord.publicKey });
      } catch (error) {
        spinner.fail(chalk.red(error.message));
      }
    });

  walletCmd
    .command('list')
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
  
  walletCmd
    .command('import <name>')
    .description('Import a wallet from private key')
    .action(async (name) => {
      // ... inside .action(async (name) => { ...
      const spinner = ora(`Importing wallet ${name}`).start();
      try {
        if (debugMode) console.log(chalk.blue('[Debug] CLI: Starting import action for:'), name);  // ADD THIS

        // Secure prompt for private key (no echo)
        if (debugMode) console.log(chalk.blue('[Debug] CLI: Prompting for key...'));  // ADD THIS
        const { rawKeyInput } = await inquirer.prompt([
          {
            type: 'password',  // Masks input
            name: 'rawKeyInput',
            message: 'Paste your private key (base58, hex, or path to .json):',
            validate: (input) => input ? true : 'Key required, bro!'
          }
        ]);
        if (debugMode) console.log(chalk.blue('[Debug] CLI: Got key input (length:'), rawKeyInput.length, ')');  // ADD THIS (length only, no key!)

        if (debugMode) console.log(chalk.blue('[Debug] CLI: Calling warchest importWalletFlexible...'));  // ADD THIS
        const walletRecord = await importWalletFlexible(name, rawKeyInput);
        if (debugMode) console.log(chalk.blue('[Debug] CLI: Import done, pubkey:'), walletRecord.publicKey);  // ADD THIS

        spinner.succeed(chalk.green(`Wallet imported: ${walletRecord.publicKey}`));
        EventBus.emit('wallet.import', { name: walletRecord.name, publicKey: walletRecord.publicKey });
      } catch (error) {
        if (debugMode) console.log(chalk.blue('[Debug] CLI: Import action error:'), error.stack);  // ADD THIS
        spinner.fail(chalk.red(error.message));
      }
    });

  walletCmd
    .command('resync <name>')
    .description('Resynchronize a wallet')
    .action(async (name) => {
      const spinner = ora(`Resyncing wallet ${name}`).start();
      try {
        const tokens = await resyncWallet(name);
        spinner.succeed(chalk.green(`Wallet resynced: ${name}`));
        console.log(chalk.bold('\nResync Summary:'));
        console.table(tokens.map(t => ({
          Mint: t.mint,
          Symbol: t.symbol,
          Balance: t.balance,
          Value: t.value,
        })));
        EventBus.emit('wallet.resync', { name });
      } catch (error) {
        spinner.fail(chalk.red(error.message));
      }
    });

  walletCmd
    .command('scan <pubkey>')
    .description('Scan a wallet by public key')
    .action(async (pubkey) => {
      const spinner = ora(`Scanning wallet ${pubkey}`).start();
      try {
        const tokens = await scanWallet(pubkey);
        spinner.succeed(chalk.green(`Wallet scanned: ${pubkey}`));
        console.log(chalk.bold('\nScan Summary:'));
        console.table(tokens.map(t => ({
          Mint: t.mint,
          Symbol: t.symbol,
          Balance: t.balance,
          Value: t.value,
        })));
        EventBus.emit('wallet.scan', { publicKey: pubkey });
      } catch (error) {
        spinner.fail(chalk.red(error.message));
      }
    });

  walletCmd
    .command('pnl <name>')
    .description('Calculate P&L for a wallet')
    .action(async (name) => {
      const spinner = ora(`Calculating P&L for ${name}`).start();
      try {
        const data = await calculatePnl(name);
        spinner.succeed(chalk.green(`P&L for ${name}`));

        // Summary table
        console.log(chalk.bold('\nSummary:'));
        console.table([{
          'Realized': data.summary.realized,
          'Unrealized': data.summary.unrealized,
          'Total': data.summary.total,
          'Total Invested': data.summary.totalInvested,
          'Average Buy Amount': data.summary.averageBuyAmount,
          'Total Wins': data.summary.totalWins,
          'Total Losses': data.summary.totalLosses,
          'Win %': data.summary.winPercentage,
          'Loss %': data.summary.lossPercentage,
        }]);

        // Per-token breakdown
        console.log(chalk.bold('\nTokens:'));
        Object.entries(data.tokens).forEach(([mint, tok]) => {
          console.log(chalk.underline(mint));
          console.table([{
            'Holding': tok.holding,
            'Held': tok.held,
            'Sold': tok.sold,
            'Realized': tok.realized,
            'Unrealized': tok.unrealized,
            'Total': tok.total,
            'Total Sold': tok.total_sold,
            'Total Invested': tok.total_invested,
            'Avg Buy Amt': tok.average_buy_amount,
            'Current Value': tok.current_value,
            'Cost Basis': tok.cost_basis,
          }]);
        });

        EventBus.emit('wallet.pnl', { name, summary: data.summary, tokens: data.tokens });
      } catch (error) {
        spinner.fail(chalk.red(error.message));
      }
    });
}

export default registerWalletCommands;