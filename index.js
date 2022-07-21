"use strict";
import fetch from 'node-fetch';


/* GLOBALS */
const CHAINS = {}; // fetched dynamically
const TESTNETS = {}; // fetched dynamically
const STATS = {
  "chain_count": null, // calculated dynamically
  "testnet_count": null // calculated dynamically
};
const GITHUB_APIS = {
  "chain_registry": "https://api.github.com/repos/cosmos/chain-registry/git/trees/master",
  "testnets": null // fetched dynamically
}
const FUNCTIONS = {
  "init": async function () { },
  "scan_github_chains": async function () { }, // used to initialize CHAINS
  "scan_github_testnets": async function () { }, // used to initialize TESTNETS
  "update_all_chain_metadata": async function () { }, // gets chain.json for all CHAINS.
  "update_all_testnet_metadata": async function () { }, // gets chain.json for all TESTNETS.
  "filter_by_json": function (options = {}) { } // used to get
};

FUNCTIONS.scan_github_chains = async function () {
  console.log('\x1b[33m%s\x1b[0m', `...Retrieving chain list from ${GITHUB_APIS.chain_registry}`);
  await fetch(GITHUB_APIS.chain_registry)
    .then((res) => res.json())
    .then((json) => {
      let chain_count = 0;
      json.tree.forEach((item, i) => {
        if (item.path == ".github") return; // ignore .github folder
        if (item.type == "tree") {
          if (item.path == "testnets") {
            GITHUB_APIS.testnets = item.url; // save the github api REST url for the testnets
          } else {
            if (CHAINS[item.path] == null) { // instantiate object key
              CHAINS[item.path] = {};
            }
            chain_count++;
            CHAINS[item.path].chain_json_url = `https://raw.githubusercontent.com/cosmos/chain-registry/master/${item.path}/chain.json`;
          }
        }
      });
      STATS.chain_count = chain_count;
    });
  console.log('\x1b[34m%s\x1b[0m', `...Chain list updated. Total chains: ${STATS.chain_count}`);
};
FUNCTIONS.scan_github_testnets = async function () {
  console.log('\x1b[33m%s\x1b[0m', `...Retrieving testnet list from ${GITHUB_APIS.testnets}`);
  await fetch(GITHUB_APIS.testnets)
    .then((res) => res.json())
    .then((json) => {
      let testnet_count = 0;
      json.tree.forEach((item, i) => {
        if (item.type == "tree") {
          // instantiate object key
          if (TESTNETS[item.path] == null) {
            TESTNETS[item.path] = {};
          }
          testnet_count++;
          TESTNETS[item.path].chain_json_url = `https://raw.githubusercontent.com/cosmos/chain-registry/master/testnets/${item.path}/chain.json`;
        }
        if (item.path == "testnets") {
          FUNCTIONS.scan_github_testnets(item.url);
        }
      });
      STATS.testnet_count = testnet_count;
    });
  console.log('\x1b[34m%s\x1b[0m', `...Testnet list updated. Total testnets: ${STATS.testnet_count}`);
};
FUNCTIONS.update_all_chain_metadata = async function () {
  let count_processed = 0;
  await Promise.all(Object.keys(CHAINS).map(async (chainName) => {
    await fetch(CHAINS[chainName].chain_json_url)
      .then((res) => res.json())
      .then((json) => {
        CHAINS[chainName].chain_json = json;
        count_processed++
      });
  }));
  console.log('\x1b[34m%s\x1b[0m', `...chain.json files loaded: ${count_processed}/${STATS.chain_count}`);
};
FUNCTIONS.update_all_testnet_metadata = async function () {
  let count_processed = 0;
  await Promise.all(Object.keys(TESTNETS).map(async (chainName) => {
    await fetch(TESTNETS[chainName].chain_json_url)
      .then((res) => res.json())
      .then((json) => {
        TESTNETS[chainName].chain_json = json;
        count_processed++
      });
  }));
  console.log('\x1b[34m%s\x1b[0m', `...chain.json files loaded: ${count_processed}/${STATS.testnet_count}`);
};

/*
EXAMPLE USAGE:

  CHAIN_REGISTRY.search({
    "filter_fields": ["chain_name", "pretty_name", "chain_id", "bech32_prefix", "slip44", "slip44", "apis.rest"], // empty = no filter
    "search": {
      "chain_name": "akash" // or ["akash","sentinel"]
    }
  });

 */
var query = function (options = {
  "filter_fields": [], // empty = no filter
  "search": {}
}) {
  let resultset = [];
  let chains_searched_unfiltered = {};

  // SEARCH:
  for (const [reg_folder_name, chain] of Object.entries(CHAINS)) {
    let doInclude = true;
    // look for key value in the chain...
    for (const [search_key, search_values] of Object.entries(options.search)) {
      let isMatch = false;
      for (const [key, data] of Object.entries(chain.chain_json)) {
        if (!Array.isArray(search_values)) {
          search_values = [search_values];
        }
        search_values.forEach((search_value, i) => {
          if (key == search_key && data == search_value) {
            isMatch = true;
          }
        });
      }
      if (!isMatch) {
        doInclude = false;
      }
    }
    if (doInclude) {
      chains_searched_unfiltered[reg_folder_name] = chain;
    }
  }

  // FILTER FIELDS

  // iterate all chains
  for (const [reg_folder_name, chain] of Object.entries(chains_searched_unfiltered)) {
    let filtered_chain = {};
    // iterate every chain_json
    // if there aren't any filter fields, just push all...

    if (options.filter_fields.length == 0) {
      resultset.push(filtered_chain);
    } else {
      // filter the fields
      for (const [key, data] of Object.entries(chain.chain_json)) {
        options.filter_fields.forEach((key_name, i) => {
          if (key == key_name) {
            filtered_chain[key] = data;
          }
        });
      } // loop filter fields
    } // end if..else
    resultset.push(filtered_chain);
  } // loop all chains

  console.log(resultset);
  return resultset;
};


var init = async function () {
  console.log();
  console.log('\x1b[33m%s\x1b[0m', `## Syncronizing Chain Registry:`);
  await FUNCTIONS.scan_github_chains(); // populate CHAIN_REGISTRY.CHAINS object with a keys for each subfolder in cosmos/chain-registry.
  await FUNCTIONS.update_all_chain_metadata(); // get chain.json for each chain
  await FUNCTIONS.scan_github_testnets(); // populate CHAIN_REGISTRY.TESTNETS object with a key for each subfolder in cosmos/chain-registry/testnets.
  await FUNCTIONS.update_all_testnet_metadata(); // get chain.json for each testnet
};


export default CHAIN_REGISTRY = {
  "_chains": CHAINS,
  "_testnets": TESTNETS,
  "_stats": STATS,
  "_github_apis": GITHUB_APIS,
  "_functions": FUNCTIONS,
  "init": init,
  "query": query
};