# cosmos-chain-registry-reader

node.js module to cache and query the cosmos chain-registry

### Installation

```bash
npm i cosmos-chain-registry-reader
```

### Setup

```js
import { CHAIN_REGISTRY } from "cosmos-chain-registry-reader";
```

### Usage

```js
// fetch the chain-registry asynchronously. Call again to refresh
await CHAIN_REGISTRY.load();  

// query the cached registry, optionally filter fields and values
CHAIN_REGISTRY.query({
  "filter_fields": ["chain_name", "pretty_name", "chain_id", "bech32_prefix", "slip44", "apis.rest"],
  "search": {
    "chain_name": ["akash","sentinel"]
  }
});
```
### Important information:

This module makes use of the github api. Please note the rate limiting:

"For unauthenticated requests, the rate limit allows for up to 60 requests per hour. Unauthenticated requests are associated with the originating IP address, and not the person making requests."

[https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting)
