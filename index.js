/* global.window = global;
global.self = global;
global.location = new URL('https://tokens.cryptopolys.com/');
global.regeneratorRuntime = {}; */
// global.btoa = require('btoa');
// global.Blob = require('node-blob');
// global.XMLHttpRequest = require('xhr2');

const fetch = require('node-fetch');

// const Web3 = require('./web3.min.js');
const Web3 = require('web3');
const address = require('./address.js');
const abi = require('./abi.js');

const infuraProjectId = `4fb939301ec543a0969f3019d74f80c2`;

const web3 = new Web3(
  // Replace YOUR-PROJECT-ID with a Project ID from your Infura Dashboard
  new Web3.providers.HttpProvider(`https://rinkeby.infura.io/v3/${infuraProjectId}`)
);

const contract = new web3.eth.Contract(abi, address);
/* const id = 0x1;
contract.methods.getMetadata(id, 'hash').call().then(console.log); */

exports.handler = async event => {
  console.log('got req', event.pathParameters.id);
  if (event.pathParameters.id) {
    // let {id} = event.spec;
    let {id} = event.pathParameters;
    id = parseInt(id, 10);

    if (!isNaN(id)) {
      console.log('get hash 1', id);
      const hash = await contract.methods.getMetadata(id, 'hash').call();
      console.log('get hash 2', id, hash);

      if (hash) {
        const proxyRes = await fetch(`https://api.cryptopolys.com/metadata${hash}`);
        if (proxyRes.ok) {
          const j = await proxyRes.json();
          const {objectName, dataHash, screenshotHash} = j;

          return {
            statusCode: 200,
            headers: {
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              name: objectName,
              description: `Token: ${objectName}`,
              image: `https://api.cryptopolys.com/data${dataHash}.glb`,
              attributes: {
                screenshotUrl: `https://api.cryptopolys.com/data${screenshotHash}.gif`,
              },
            }, null, 2),
          };
        } else {
          const blob = await proxyRes.blob();
          return {
            status: proxyRes.status,
            body: blob,
          };
        }
      } else {
        return {
          statusCode: 404,
          body: 'no such id',
        };
      }
    } else {
      return {
        statusCode: 404,
        body: 'not found',
      };
    }
  } else {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
      },
      body: 'no spec: ' + JSON.stringify(event),
    };
  }
};
