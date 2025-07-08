# warchest

macOS-native CLI wallet manager for Solana trading bot project warlordForever.

## Installation

```bash
# Install dependencies and link the CLI globally (required for running `warchest` directly)
npm install
npm link       # or: npm install -g .
cp .env.example .env

# Generate Prisma client and push schema to the database
npx prisma generate
npx prisma db push
```

## Configuration

Edit `.env` to set:

```
DATABASE_URL=<your_mysql_connection_string>
SOLANA_RPC_URL=<your_rpc_url>
SOLANA_API_KEY=<your_api_key>
API_DEBUG=false   # log RPC call & response
DEBUG_MODE=false  # log extra critical info
```

## Database Setup

Ensure you have a MySQL database available and the connection string is set in the `DATABASE_URL` variable of your `.env`. Then generate the Prisma client and push the schema to your database:

```bash
npx prisma generate
npx prisma db push
```

## Usage

```bash
# if you linked the CLI:
warchest wallet add <name>
warchest wallet list
warchest wallet resync <name>
warchest wallet scan <publicKey>
warchest wallet pnl <name>

# or via npx without global link:
npx warchest wallet list
```

## Events

| Event Name    | Description                                | Payload                                  |
|---------------|--------------------------------------------|------------------------------------------|
| wallet.add    | Emitted when a wallet is added             | `{ name: string, publicKey: string }`    |
| wallet.list   | Emitted when wallets are listed            | `Array<{ name: string, publicKey: string }>` |
| wallet.resync | Emitted when a wallet is resynced          | `{ name: string }`                     |
| wallet.scan   | Emitted when a wallet is scanned           | `{ publicKey: string }`                |
| wallet.pnl    | Emitted when P&L is calculated for a wallet| `{ name: string, pnl: number }`        |

## Debugging

- To log RPC calls and responses: set `API_DEBUG=true`
- To log extra critical info: set `DEBUG_MODE=true`

## Testing

```bash
npm test
```

## Git Branch Workflow

- `main` is the protected release branch.
- `develop` mirrors `main`; feature branches should branch off `develop`.
- After merging into `develop`, tests run and then open a PR to `main`.
- On PR to `main`, tests run before merge.