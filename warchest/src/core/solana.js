/**
 * @module core/solana
 * @see README.md#rpc--api
 */

// import RPC and keypair signer utilities from kit
const { createSolanaRpc, createKeyPairSignerFromBytes } = require('@solana/kit');
const nacl = require('tweetnacl');
const EventBus = require('./eventBus');
const keychain = require('./keychain');
const errorHandler = require('./errorHandler');
const { Client } = require('@solana-tracker/data-api');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const LAMPORTS_PER_SOL = 1e9;

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
 * Sync wallet accounts from the network.
 * @param {string} publicKey - Public key of the wallet.
 */
async function syncWallet(publicKey) {
  EventBus.emit('solana.sync.start', { publicKey });
  try {
    const rpc = createSolanaRpc(process.env.SOLANA_RPC_URL);
    const lamports = await rpc.getBalance(publicKey).send();
    const solBalance = lamports / LAMPORTS_PER_SOL;
    EventBus.emit('solana.sync.complete', {
      publicKey,
      balances: { sol: solBalance }
    });
    return { sol: solBalance };
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
    const data = await dataApiClient.getWallet(publicKey);
    // Persist scan and related data
    const walletRecord = await prisma.wallet.findUnique({ where: { publicKey } });
    if (!walletRecord) {
      throw new Error(`Wallet not found in DB: ${publicKey}`);
    }
    const walletId = walletRecord.id;

    // 1. Upsert token metadata
    for (const tokenObj of data.tokens) {
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
      for (const pool of tokenObj.pools) {
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
      for (const [interval, ev] of Object.entries(tokenObj.events)) {
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
      mint: item.token.mint,
      symbol: item.token.symbol,
      name: item.token.name || item.token.symbol,
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
    const data = await dataApiClient.getWalletPnL(publicKey, true, true, false);
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
          create: data.tokens.map(tok => ({
            tokenMint: tok.token,
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
  getPrivateKey,
  syncWallet,
  scanAccounts,
  calculatePnl
};