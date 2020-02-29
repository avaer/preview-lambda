global.window = global;
global.self = global;
global.location = new URL('https://tokens.cryptopolys.com/');
global.regeneratorRuntime = {};
// global.btoa = require('btoa');
// global.Blob = require('node-blob');
// global.XMLHttpRequest = require('xhr2');

const Web3 = require('./web3.min.js');
// const Web3 = require('web3');
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

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
});
async function handleRequest(request) {
  const {pathname} = new URL(request.url);
  const match = pathname.match(/^\/([0-9]+)$/);
  const id = parseInt(match[1], 10);
  if (!isNaN(id)) {
    const hash = await contract.methods.getMetadata(id, 'hash').call();

    if (hash) {
      const proxyRes = await fetch(`https://api.cryptopolys.com/metadata${hash}`);
      if (proxyRes.ok) {
        const j = await proxyRes.json();
        const {objectName, dataHash, screenshotHash} = j;

        return new Response(JSON.stringify({
          "name": objectName,
          "description": `Token: ${objectName}`,
          "image": `https://api.cryptopolys.com/data${dataHash}`,
          "attributes": {
            // name: objectName,
            screenshotHash,
          },
        }, null, 2), {
          headers: {
            'content-type': 'application/json',
          },
        });
      } else {
        return proxyRes;
      }
    } else {
      return new Response('not such id', {
        // headers: { 'content-type': 'text/plain' },
      });
    }
  } else {
    return new Response('not found', {
      // headers: { 'content-type': 'text/plain' },
    });
  }
}