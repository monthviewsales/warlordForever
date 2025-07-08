#!/usr/bin/env node
const { program } = require('commander');
require('dotenv').config();
const registerWalletCommands = require('./cli/walletCommands');

program
  .name('warchest')
  .description('CLI wallet manager for warlordForever')
  .version('1.0.0');

registerWalletCommands(program);

program.parse(process.argv);