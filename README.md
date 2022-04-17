# chain-registry-reader

node.js library to cache and query the cosmos chain-registry

### Installation

```bash
npm i cosmos-chain-registry-reader
```

### Setup

```js
const CHAIN_REGISTRY = require('cosmos-chain-registry-reader');
```

### Usage

```js
// fetch the chain-registry asynchronously. Call again to refresh
await CHAIN_REGISTRY.init();  

// query the cached registry, optionally filter fields and values
CHAIN_REGISTRY.query({
  "filter_fields": ["chain_name", "pretty_name", "chain_id", "bech32_prefix", "slip44", "apis.rest"],
  "search": {
    "chain_name": ["akash","sentinel"]
  }
});
```
