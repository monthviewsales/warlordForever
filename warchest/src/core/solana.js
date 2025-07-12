/**
 * @module core/solana
 * @see README.md#rpc--api
 */

// import RPC and keypair signer utilities from kit
const { createKeyPairSignerFromBytes } = require('@solana/kit');
const nacl = require('tweetnacl');
const EventBus = require('./eventBus');
const chalk = require('chalk').default;
const debugMode = process.env.DEBUG_MODE === 'true';
const keychain = require('./keychain');
const errorHandler = require('./errorHandler');
const { Client } = require('@solana-tracker/data-api');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();  // Global instance for efficiency
const inquirer = require('inquirer');
const bs58 = require('bs58');

// initialize Data API client
const dataApiClient = new Client({ apiKey: process.env.SOLANA_API_KEY });

/**
 * Create a new Solana wallet.
 * @returns {Promise<{publicKey: string, keychainRef: string}>}
 */
async function createWallet(name) {
  try {
    // generate raw Ed25519 keypair
    const rawKeyPair = nacl.sign.keyPair();
    // wrap as a Kit signer to obtain address
    const signer = await createKeyPairSignerFromBytes(rawKeyPair.secretKey);
    const publicKey = signer.address;
    // serialize private key bytes to hex
    const privateKeyHex = Buffer.from(rawKeyPair.secretKey).toString('hex');
    // save to keychain
    await keychain.saveKey(name, privateKeyHex);
    return { publicKey, keychainRef: name };
  } catch (err) {
    errorHandler(err);
    throw err;
  }
}

/**
 * Import a wallet from base58 private key.
 * @param {string} name - Name for the wallet.
 * @param {string} privateKeyBase58 - Base58-encoded private key.
 * @returns {Promise<{publicKey: string, keychainRef: string}>}
 */
async function importWallet(name, privateKeyBase58) {
  try {
    if (debugMode) console.log(chalk.blue('[Debug] solana: Starting importWallet for name:'), name);  // ADD THIS
    // Decode base58 to bytes (full 64-byte Ed25519 secret key)
    const fullKeyBytes = bs58.decode(privateKeyBase58);
    const secretKeyBytes = fullKeyBytes.slice(0, 32);
    if (debugMode) console.log(chalk.blue('[Debug] solana: Decoded key bytes length:'), fullKeyBytes.length);  // ADD THIS
    if (fullKeyBytes.length !== 64) {
      throw new Error('Invalid private key length—should be 64 bytes!');
    }

    // Validate by creating signer (will throw if bogus)
    if (debugMode) console.log(chalk.blue('[Debug] solana: Creating signer...'));  // ADD THIS
    const signer = await createKeyPairSignerFromBytes(fullKeyBytes);
    const publicKey = signer.address;
    if (debugMode) console.log(chalk.blue('[Debug] solana: Derived publicKey:'), publicKey);  // ADD THIS

    // Hex the secret key for keychain storage (matches createWallet)
    const privateKeyHex = Buffer.from(fullKeyBytes).toString('hex');
    if (debugMode) console.log(chalk.blue('[Debug] solana: Hexed key for keychain...'));  // ADD THIS

    // Save to keychain
    if (debugMode) console.log(chalk.blue('[Debug] solana: Saving to keychain...'));  // ADD THIS
    await keychain.saveKey(name, privateKeyHex);

    console.log(chalk.yellow('Importing this key... if it\'s from a sketchy airdrop, don\'t blame me! 😎'));
    return { publicKey, keychainRef: name };
  } catch (err) {
    if (debugMode) console.log(chalk.blue('[Debug] solana: importWallet error:'), err.stack);  // ADD THIS FOR STACK
    errorHandler(err);
    throw err;
  }
}

const fs = require('fs');
const path = require('path');

/**
 * Import a wallet from various input formats: base58 string, hex string, or a JSON file path.
 * @param {string} name - Name to save the wallet under.
 * @param {string} input - Private key as base58, hex, or JSON file path.
 * @returns {Promise<{publicKey: string, keychainRef: string}>}
 */
async function importWalletFlexible(name, input) {
  try {
    let privateKeyBytes;

    if (input.endsWith('.json') && fs.existsSync(input)) {
      const fileContent = JSON.parse(fs.readFileSync(path.resolve(input), 'utf8'));
      if (!Array.isArray(fileContent)) {
        throw new Error('Invalid JSON keypair format: expected array of numbers.');
      }
      privateKeyBytes = Uint8Array.from(fileContent);
    } else if (/^[0-9a-f]{128}$/i.test(input)) {
      // Looks like a 64-byte hex string
      privateKeyBytes = Buffer.from(input, 'hex');
    } else {
      // Try base58 decode
      privateKeyBytes = bs58.decode(input);
    }

    if (privateKeyBytes.length !== 64) {
      throw new Error('Invalid private key: expected 64 bytes after decoding.');
    }

    const base58Key = bs58.encode(
      new Uint8Array([
        ...privateKeyBytes.slice(0, 32),
        ...privateKeyBytes.slice(32)
      ])
    );
    return await importWallet(name, base58Key);
  } catch (err) {
    errorHandler(err);
    throw err;
  }
}

/**
 * Retrieve the private key for a given public key.
 * @param {string} publicKey - Public key of the wallet.
 * @returns {Promise<string>}
 */
async function getPrivateKey(publicKey) {
  try {
    return await keychain.getKey(publicKey);
  } catch (err) {
    errorHandler(err);
    throw err;
  }
}


/**
 * Scan token accounts for a wallet.
 * @param {string} publicKey - Public key of the wallet.
 */
async function scanAccounts(publicKey) {
  EventBus.emit('solana.scan.start', { publicKey });
  try {
    if (debugMode) console.log(chalk.blue('[Debug] Calling getWallet:'), publicKey);
    const data = await dataApiClient.getWallet(publicKey);
    if (debugMode) console.log(chalk.blue('[Debug] getWallet response:'), JSON.stringify(data, null, 2));
    // Persist scan and related data
    const walletRecord = await prisma.wallet.findUnique({ where: { publicKey } });
    if (!walletRecord) {
      throw new Error(`Wallet not found in DB: ${publicKey}`);
    }
    const walletId = walletRecord.id;

    // 1. Upsert token metadata
    for (const tokenObj of data.tokens) {
      // Add null-check for tokenObj.token
      if (!tokenObj.token || !tokenObj.token.mint) {
        if (debugMode) console.log(chalk.yellow('[Debug] Skipping invalid token object'));
        continue;  // Skip bad data to avoid crashes
      }
      await prisma.token.upsert({
        where: { mint: tokenObj.token.mint },
        create: {
          mint: tokenObj.token.mint,
          name: tokenObj.token.name,
          symbol: tokenObj.token.symbol,
          uri: tokenObj.token.uri || null,
          decimals: tokenObj.token.decimals,
          image: tokenObj.token.image || null,
          // any other Token fields…
        },
        update: {
          name: tokenObj.token.name,
          symbol: tokenObj.token.symbol,
          uri: tokenObj.token.uri || null,
          decimals: tokenObj.token.decimals,
          image: tokenObj.token.image || null,
          // etc.
        },
      });

      // 2. Upsert pools
      for (const pool of tokenObj.pools || []) {  // Handle empty pools array
        // Null-check pool fields
        if (!pool.poolId || !pool.tokenAddress) {
          if (debugMode) console.log(chalk.yellow('[Debug] Skipping invalid pool'));
          continue;
        }
        await prisma.pool.upsert({
          where: { poolId: pool.poolId },
          create: {
            poolId: pool.poolId,
            tokenMint: pool.tokenAddress,
            market: pool.market,
            liquidityQuote: pool.liquidity.quote,
            liquidityUsd: pool.liquidity.usd,
            priceQuote: pool.price.quote,
            priceUsd: pool.price.usd,
            tokenSupply: pool.tokenSupply,
            lpBurn: pool.lpBurn,
            marketCapQuote: pool.marketCap.quote,
            marketCapUsd: pool.marketCap.usd,
            quoteToken: pool.quoteToken,
            decimals: pool.decimals,
            deployer: pool.deployer || null,
            lastUpdated: new Date(pool.lastUpdated),
            createdAt: pool.createdAt ? new Date(pool.createdAt) : null,
            token: {
              connect: {
                mint: pool.tokenAddress
              }
            },
            freezeAuthority: pool.security?.freezeAuthority || null,
            mintAuthority: pool.security?.mintAuthority || null,
          },
          update: {
            liquidityQuote: pool.liquidity.quote,
            liquidityUsd: pool.liquidity.usd,
            priceQuote: pool.price.quote,
            priceUsd: pool.price.usd,
            tokenSupply: pool.tokenSupply,
            lpBurn: pool.lpBurn,
            marketCapQuote: pool.marketCap.quote,
            marketCapUsd: pool.marketCap.usd,
            deployer: pool.deployer || null,
            lastUpdated: new Date(pool.lastUpdated),
            freezeAuthority: pool.security?.freezeAuthority || null,
            mintAuthority: pool.security?.mintAuthority || null,
          },
        });
      }

      // 3. Upsert balance
      const balanceRecord = await prisma.balance.upsert({
        where: { walletId_tokenMint: { walletId, tokenMint: tokenObj.token.mint } },
        create: {
          walletId,
          tokenMint: tokenObj.token.mint,
          amount: tokenObj.balance,
          value: tokenObj.value,
          holders: tokenObj.holders,
          buys: tokenObj.buys,
          sells: tokenObj.sells,
          txns: tokenObj.txns,
        },
        update: {
          amount: tokenObj.balance,
          value: tokenObj.value,
          holders: tokenObj.holders,
          buys: tokenObj.buys,
          sells: tokenObj.sells,
          txns: tokenObj.txns,
        },
      });

      // 4. Upsert price events
      for (const [interval, ev] of Object.entries(tokenObj.events || {})) {  // Handle empty events
        await prisma.priceEvent.upsert({
          where: {
            balanceId_intervalLabel: {
              balanceId: balanceRecord.id,
              intervalLabel: interval,
            },
          },
          create: {
            balanceId: balanceRecord.id,
            intervalLabel: interval,
            pctChange: ev.priceChangePercentage,
          },
          update: {
            pctChange: ev.priceChangePercentage,
          },
        });
      }

      // 5. Upsert risk profile
      await prisma.riskProfile.upsert({
        where: { balanceId: balanceRecord.id },
        create: {
          balanceId: balanceRecord.id,
          rugged: tokenObj.risk.rugged,
          risksJson: tokenObj.risk.risks,
          score: tokenObj.risk.score,
          jupiterVerified: tokenObj.risk.jupiterVerified,
        },
        update: {
          rugged: tokenObj.risk.rugged,
          risksJson: tokenObj.risk.risks,
          score: tokenObj.risk.score,
          jupiterVerified: tokenObj.risk.jupiterVerified,
        },
      });
    }

    // Extract detailed token holdings
    const tokens = data.tokens.map(item => ({
      mint: item.token?.mint || 'unknown',  // Fallback for mint
      symbol: item.token?.symbol || 'N/A',
      name: item.token?.name || item.token?.symbol || 'Unknown',
      balance: item.balance,
      value: item.value,
      pools: item.pools,
      events: item.events,
      risk: item.risk,
      buys: item.buys,
      sells: item.sells,
      txns: item.txns,
      holders: item.holders
    }));
    EventBus.emit('solana.scan.complete', { publicKey, tokens });
    return tokens;
  } catch (err) {
    errorHandler(err);
    throw err;
  }
}

/**
 * Calculate P&L for a wallet.
 * @param {string} publicKey - Public key of the wallet.
 * @returns {Promise<Object>} Full P&L data including tokens and summary.
 */
async function calculatePnl(publicKey) {
  EventBus.emit('solana.pnl.start', { publicKey });
  try {
    if (debugMode) console.log(chalk.blue('[Debug] Calling getWalletPnL:'), publicKey);
    const data = await dataApiClient.getWalletPnL(publicKey, true, true, false);
    if (debugMode) console.log(chalk.blue('[Debug] getWalletPnL response:'), JSON.stringify(data, null, 2));
    // Persist PnL snapshot
    const walletRecord = await prisma.wallet.findUnique({ where: { publicKey } });
    if (!walletRecord) {
      throw new Error(`Wallet not found in DB: ${publicKey}`);
    }
    const pnlScan = await prisma.pnlScan.create({
      data: {
        walletId: walletRecord.id,
        realized: data.summary.realized,
        unrealized: data.summary.unrealized,
        total: data.summary.total,
        totalInvested: data.summary.totalInvested,
        averageBuyAmount: data.summary.averageBuyAmount,
        totalWins: data.summary.totalWins,
        totalLosses: data.summary.totalLosses,
        winPercentage: data.summary.winPercentage,
        lossPercentage: data.summary.lossPercentage,
        pnlTokens: {
          create: Object.entries(data.tokens).map(([tokenMint, tok]) => ({  // Fixed: Use Object.entries for object
            tokenMint,
            holding: tok.holding,
            held: tok.held,
            sold: tok.sold,
            realized: tok.realized,
            unrealized: tok.unrealized,
            total: tok.total,
            totalSold: tok.total_sold,
            totalInvested: tok.total_invested,
            averageBuyAmount: tok.average_buy_amount,
            currentValue: tok.current_value,
            costBasis: tok.cost_basis,
          }))
        }
      }
    });
    EventBus.emit('solana.pnl.complete', {
      publicKey,
      summary: data.summary,
      tokens: data.tokens
    });
    return data;
  } catch (err) {
    errorHandler(err);
    throw err;
  }
}

module.exports = {
  createWallet,
  importWallet,
  importWalletFlexible,
  getPrivateKey,
  scanAccounts,
  calculatePnl
};

