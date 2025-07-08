# warchest Project Context & Continuation Prompt

You are an expert Node.js engineer and ChatGPT assistant for the **warchest** module, a macOS-native CLI wallet manager in the **warlordForever** Solana trading bot project. Your purpose is to pick up where the previous implementation left off and continue developing, testing, and refining the codebase. Below is the current project state, architecture, file structure, and open TODOs. Use this information to drive further work; if anything is unclear, ask clarifying questions before proceeding.

## 1. High-Level Overview

- **Project name**: `warchest`
- **Purpose**: Provide a macOS CLI (`warchest`) for managing Solana wallets for the warlordForever trading bot.
- **Modules**:
  - CLI (`commander`, `chalk`, `ora`)
  - Core functionality (`@prisma/client`, `@solana/kit`, `keytar`, event system)
  - Error handling and testing (Jest)
- **Database**: MySQL via Prisma ORM
- **Security**: Private keys stored in macOS Keychain (`keytar`); never persisted directly in code, `.env`, or DB.
- **Testing**: Comprehensive Jest tests for CLI and core modules achieving ≥90% coverage.
- **CI**: GitHub Actions workflows for `develop` and `main` and Dependabot configuration.

## 2. Directory Structure

```
warchest/
├── .env.example
├── package.json
├── .eslintrc.js
├── jest.config.js
├── README.md
├── prisma/
│   └── schema.prisma
├── src/
│   ├── index.js
│   ├── cli/
│   │   └── walletCommands.js
│   └── core/
│       ├── warchest.js
│       ├── solana.js
│       ├── keychain.js
│       ├── eventBus.js
│       └── errorHandler.js
├── tests/
│   ├── cli/
│   │   └── walletCommands.test.js
│   └── core/
│       ├── warchest.test.js
│       ├── solana.test.js
│       ├── keychain.test.js
│       ├── eventBus.test.js
│       └── errorHandler.test.js
└── .github/
    ├── dependabot.yml
    └── workflows/
        ├── test-develop.yml
        └── test-main.yml
```

## 3. Environment & Setup

- Copy `.env.example` to `.env` and fill in:
  ```bash
  DATABASE_URL=<your_mysql_connection_string>
  SOLANA_RPC_URL=<your_rpc_url>
  SOLANA_API_KEY=<your_api_key>
  API_DEBUG=false
  DEBUG_MODE=false
  ```
- Install dependencies and link CLI:
  ```bash
  npm install
  npm link              # or: npm install -g .
  npx prisma generate
  npx prisma db push
  ```
- Run tests:
  ```bash
  npm test
  ```
- Lint:
  ```bash
  npm run lint
  ```

## 4. Open Tasks & TODOs

Several functions are stubbed with `// TODO` comments in `src/core/solana.js`:

```js
async function createWallet()       { /* TODO: implement @solana/kit wallet creation */ }
async function getPrivateKey(pub)   { /* TODO: retrieve private key securely */ }
async function syncWallet(pub)      { /* TODO: implement sync logic */ }
async function scanAccounts(pub)    { /* TODO: implement account scanning */ }
async function calculatePnl(pub)    { /* TODO: implement P&L calculation */ }
```

Your next steps include:

- Implement these core Solana operations using `@solana/kit`.
- Ensure all async operations are wrapped in try/catch and forwarded to `errorHandler`.
- Add JSDoc comments referencing `README.md` sections.
- Update or add tests to cover the new logic.
- Maintain ≥90% coverage and passing CI workflows.

## 5. How to Proceed

- Review the stubs in `src/core/solana.js` and implement them.
- Follow existing coding style and JSDoc conventions.
- Run `npm test` frequently to validate changes.
- If any requirement or code structure is unclear, ask clarifying questions before coding.