```markdown
# warchest

macOS-native CLI wallet manager for Solana trading bot project warlordForever. Securely manages wallets using macOS Keychain, integrates with Solana RPC and Data API for scanning balances and calculating PnL, and persists data to MySQL via Prisma.

## Features

- Create new Solana wallets with secure Keychain storage.
- List, resync, scan, and calculate PnL for wallets.
- Event-driven architecture for extensibility.
- Debug logging for API calls and critical operations.
- Prisma ORM for database interactions (MySQL).
- Integration with Solana Tracker Data API for wallet data and PnL.
- Robust error handling with skips for invalid API data to prevent crashes.

## Installation

```bash
# Clone the repo and navigate to warchest
git clone https://github.com/monthviewsales/warlordForever.git
cd warlordForever/warchest

# Install dependencies and link the CLI globally (required for running `warchest` directly)
npm install
npm link       # or: npm install -g .
cp .env.example .env

# Generate Prisma client and push schema to the database
npx prisma generate
npx prisma db push
```

## Configuration

Edit `.env` to set your environment variables:

```
DATABASE_URL=<your_mysql_connection_string>  # e.g., mysql://user:pass@localhost:3306/warlord
SOLANA_RPC_URL=<your_rpc_url>                # e.g., https://rpc-mainnet.solanatracker.io/?api_key=your_key
SOLANA_API_KEY=<your_api_key>                # Solana Tracker Data API key
API_DEBUG=false                              # Log RPC/API calls and responses (formerly DEBUG_MODE for API)
DEBUG_MODE=false                             # Log extra debug info (e.g., skipped data, full responses, stack traces)
```

## Database Setup

Ensure you have a MySQL database running and the connection string set in `DATABASE_URL`. The Prisma schema defines models for wallets, tokens, pools, balances, price events, risk profiles, trades, and PnL snapshots/scans.

Run these commands to set up or update the DB:

```bash
npx prisma generate  # Generate Prisma client (run after any schema changes)
npx prisma db push   # Push schema to DB (creates/updates tables)
```

If you encounter schema-related errors (e.g., unknown fields like `tokenMint`), re-run these commands to regenerate the client. For schema details, see `prisma/schema.prisma`.

## Usage

Run commands via the CLI:

```bash
# If linked globally:
warchest wallet add <name>          # Create and add a new wallet
warchest wallet list                # List all wallets
warchest wallet resync <name>       # Resync wallet data (scan and persist)
warchest wallet scan <publicKey>    # Scan token accounts for a public key
warchest wallet pnl <name>          # Calculate and display PnL for a wallet

# Or via npx without global link:
npx warchest wallet list
```

### Command Details

- **add <name>**: Generates a new Solana keypair, stores the private key securely in Keychain, and saves the wallet record to the DB.
- **list**: Lists all stored wallets with names and public keys.
- **resync <name>**: Fetches and persists latest token balances, pools, events, and risks for the wallet via Data API. Handles invalid data gracefully (skips and logs).
- **scan <publicKey>**: Scans token accounts and returns/persists balances (used internally by resync). Null-checks for API edge cases.
- **pnl <name>**: Calculates Profit & Loss using Data API, persists a snapshot, and displays summary/tables. Fixed mapping for object-based tokens.

## Events

The CLI emits events via an EventEmitter for integration/extensibility:

| Event Name          | Description                                | Payload                                      |
|---------------------|--------------------------------------------|----------------------------------------------|
| wallet.add          | Emitted when a wallet is added             | `{ name: string, publicKey: string }`        |
| wallet.list         | Emitted when wallets are listed            | `Array<{ name: string, publicKey: string }>` |
| wallet.resync       | Emitted when a wallet is resynced          | `{ name: string }`                           |
| wallet.scan         | Emitted when a wallet is scanned           | `{ publicKey: string }`                      |
| wallet.pnl          | Emitted when PnL is calculated             | `{ name: string, summary: object, tokens: object }` |
| solana.scan.start   | Emitted at start of scan                   | `{ publicKey: string }`                      |
| solana.scan.complete| Emitted on scan completion                 | `{ publicKey: string, tokens: array }`       |
| solana.pnl.start    | Emitted at start of PnL calc               | `{ publicKey: string }`                      |
| solana.pnl.complete | Emitted on PnL completion                  | `{ publicKey: string, summary: object, tokens: object }` |

Listen to events like:

```javascript
const EventBus = require('./core/eventBus');
EventBus.on('wallet.pnl', (data) => console.log('PnL updated:', data));
```

## Debugging

- **API_DEBUG=true**: Logs full API calls and responses (e.g., getWallet data).
- **DEBUG_MODE=true**: Logs extra info like skipped invalid data, full stacks on errors.

Errors are logged with chalk coloring and propagate to CLI spinners for feedback. No forced exits—commands fail gracefully.

Common fixes:
- **Unknown argument errors (e.g., `tokenMint`)**: Run `npx prisma generate` and `npx prisma db push` to sync schema/client.
- **token.mint undefined**: API data issue—debug mode logs skips; ensure valid wallet with tokens.
- **Prisma connection errors**: Verify `DATABASE_URL` and MySQL running.

## Testing

Run tests with Jest:

```bash
npm test
```

Add tests in `tests/` mirroring src structure. Aim for >90% coverage (mocks for Prisma, API, Keychain).

## Git Branch Workflow

- `main` is the protected release branch.
- `develop` mirrors `main`; feature branches should branch off `develop`.
- After merging into `develop`, tests run and then open a PR to `main`.
- On PR to `main`, tests run before merge.

## Troubleshooting

- **token.mint undefined**: Handled with skips and logs—check API response in debug; may occur for SOL or edge cases.
- **Prisma errors (e.g., unknown fields)**: Re-run `prisma generate` and `db push`; verify schema matches code.
- **Keychain issues**: macOS only; ensure app has Keychain access in System Settings > Privacy & Security.
- **API crashes**: Verify SOLANA_API_KEY; check rate limits or invalid wallet pubkey.
- **No tokens/PnL data**: Test with a wallet holding tokens; enable debug for raw API output.

For issues, open a GitHub issue with debug logs/stack traces.

## Roadmap

- Strategy assignment integration (auto-bucket coins to configs).
- Budget enforcement per wallet/strategy.
- On-chain RPC for balances to reduce API costs.
- Web dashboard for visualizations.

Contributions welcome—let's conquer Solana! 🚀
```