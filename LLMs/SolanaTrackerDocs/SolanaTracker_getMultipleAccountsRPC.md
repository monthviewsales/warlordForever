[Solana RPC](https://docs.solanatracker.io/solana-rpc)/Methods

# [getMultipleAccounts RPC Method](https://docs.solanatracker.io/solana-rpc/methods/getMultipleAccounts\#getmultipleaccounts-rpc-method)

## [Description](https://docs.solanatracker.io/solana-rpc/methods/getMultipleAccounts\#description)

Returns the account information for a list of Pubkeys.

## [Parameters](https://docs.solanatracker.io/solana-rpc/methods/getMultipleAccounts\#parameters)

1. `array` (string, optional) - An array of Pubkeys to query encoded as base-58 strings (up to a maximum of 100)
2. `object` (array) - The configuration object with the following fields:
   - `commitment` (string, optional) - The level of commitment required for the query. The options include:
     - `finalized` \- The node will query the most recent block confirmed by the supermajority of the cluster as having reached maximum lockout, meaning the cluster has recognized this block as finalized
     - `confirmed` \- The node will query the most recent block that has been voted on by the supermajority of the cluster
     - `processed` \- The node will query its most recent block. Note that the block may not be complete
   - `encoding` (string, optional) - (default: json) The encoding format for account data. It can be one of base58 (slow), base64, base64+zstd or jsonParsed
   - `dataSlice` (string, optional) - The returned account data using the provided offset: 'usize' and length: 'usize' fields; only available for base58, base64, or base64+zstd encodings
   - `minContextSlot` (integer, optional) - The minimum slot at which the request can be evaluated

## [Returns](https://docs.solanatracker.io/solana-rpc/methods/getMultipleAccounts\#returns)

Returns null if the account doesn't exist, otherwise RpcResponse JSON object with the following fields:

- `context` \- An object that contains metadata about the current state of the Solana network at the time the request was processed
  - `apiVersion` \- The version of the Solana RPC API to use
  - `slot` \- The current slot in the Solana cluster during which the transactions are processed and new blocks are added to the blockchain
- `value` \- An object that contains information about the requested account
  - `data` \- The data associated with the account, either as encoded binary data or JSON format `{'program': 'state'}`, depending on encoding parameter
  - `executable` \- A boolean value indicating whether the account holds a program and is therefore restricted to read-only access
  - `lamports` \- The quantity of lamports allocated to this account as u64 (64-bit unsigned integer)
  - `owner` \- The base-58 encoded public key of the program to which this account has been assigned
  - `rentEpoch` \- The epoch, represented as a 64-bit unsigned integer (u64), at which this account will next be due for rent
  - `space` \- The amount of storage space required to store the token account

## [Code Examples](https://docs.solanatracker.io/solana-rpc/methods/getMultipleAccounts\#code-examples)

Example using Node.js and @solana\kit
```
import { createSolanaRpc, address } from "@solana\kit";
 
(async () => {
  const solanaRpc = createSolanaRpc("https://rpc-mainnet.solanatracker.io/?api_key=YOUR_API_KEY_HERE");
  
  const publicKey1 = address("vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg");
  const publicKey2 = address("4fYNw3dojWmQ4dXtSGE9epjRGy9pFSx62YypT7avPYvA");
 
  try {
    const accountsInfo = await solanaRpc.getMultipleAccounts([publicKey1, publicKey2]).send();
    console.log(accountsInfo);
  } catch (error) {
    console.error("Error fetching multiple accounts info:", error);
  }
})();
```

```

```

[getMinimumBalanceForRentExemption\\
\\
Returns minimum balance required to make account rent exempt.](https://docs.solanatracker.io/solana-rpc/methods/getMinimumBalanceForRentExemption) [getParsedBlock\\
\\
Returns identity and transaction information about a confirmed block in the ledger.](https://docs.solanatracker.io/solana-rpc/methods/getParsedBlock)

### On this page

[getMultipleAccounts RPC Method](https://docs.solanatracker.io/solana-rpc/methods/getMultipleAccounts#getmultipleaccounts-rpc-method) [Description](https://docs.solanatracker.io/solana-rpc/methods/getMultipleAccounts#description) [Parameters](https://docs.solanatracker.io/solana-rpc/methods/getMultipleAccounts#parameters) [Returns](https://docs.solanatracker.io/solana-rpc/methods/getMultipleAccounts#returns) [Code Examples](https://docs.solanatracker.io/solana-rpc/methods/getMultipleAccounts#code-examples)