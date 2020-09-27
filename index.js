const path = require('path');
const stream = require('stream');
const fs = require('fs');
const url = require('url');
const querystring = require('querystring');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const zlib = require('zlib');
const child_process = require('child_process');

const chromium = require('chrome-aws-lambda');

// const bip32 = require('./bip32.js');
// const bip39 = require('./bip39.js');
// const ethUtil = require('./ethereumjs-util.js');

const PORT = parseInt(process.env.PORT, 10) || 80;

/* const bucketNames = {
  content: 'content.exokit.org',
  channels: 'channels.exokit.org',
  rooms: 'rooms.exokit.org',
  worlds: 'worlds.exokit.org',
  packages: 'packages.exokit.org',
  users: 'users.exokit.org',
  scenes: 'scenes.exokit.org',
};
const tableName = 'users';
const channels = {};
const gridChannels = {};
const webaverseChannels = {};
const webaverseTmpChannels = {};

const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
const codeTestRegex = /^[0-9]{6}$/;
function _randomString() {
  return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
}
function _jsonParse(s) {
  try {
    return JSON.parse(s);
  } catch(err) {
    return null;
  }
}
function _getParcelKey(x, y) {
  return [x, y].join(':');
}
function _getKey(x, z) {
  return [Math.floor(x/PARCEL_SIZE), Math.floor(z/PARCEL_SIZE)];
}
function _getKeyFromBindingUrl(u) {
  const match = u.match(/^\/\?c=(-?[0-9\.]+),(-?[0-9\.]+)$/);
  if (match) {
    const x = parseFloat(match[1]);
    const z = parseFloat(match[2]);
    if (isFinite(x) && isFinite(z)) {
      return _getKey(x, z);
    } else {
      return [];
    }
  } else {
    return [];
  }
} */

const _makePromise = () => {
  let accept, reject;
  const p = new Promise((a, r) => {
    accept = a;
    reject = r;
  });
  p.accept = accept;
  p.reject = reject;
  return p;
};

const _warn = err => {
  console.warn('uncaught: ' + err.stack);
};
process.on('uncaughtException', _warn);
process.on('unhandledRejection', _warn);

let browser;
const serverPromise = _makePromise();
let cbIndex = 0;
const cbs = {};

(async () => {
browser = await chromium.puppeteer.launch({
  args: chromium.args,
  defaultViewport: chromium.defaultViewport,
  executablePath: await chromium.executablePath,
  headless: chromium.headless,
  // ignoreHTTPSErrors: true,
});

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  if (req.method === 'OPTIONS') {
    res.end();
  } else if (req.method === 'POST') {
    const match = req.url.match(/^\/([0-9]+)/);
    console.log('callback server 1', req.url, !!match);
    if (match) {
      const index = parseInt(match[1], 10);
      const cb = cbs[index];
      console.log('callback server 2', req.url, index, !!cb);
      if (cb) {
        delete cbs[index];
        cb({req, res});
      } else {
        res.statusCode = 404;
        res.end();
      }
    } else {
      res.statusCode = 404;
      res.end();
    }
  } else {
    res.statusCode = 404;
    res.end();
  }
});
server.on('error', serverPromise.reject.bind(serverPromise));
server.listen(8000, serverPromise.accept.bind(serverPromise));
})();

exports.handler = async event => {
  await serverPromise;

  // const {pathname, search} = new URL(request.url);
  console.log('got event', event);
  let {queryStringParameters, body, isBase64Encoded} = event;
  queryStringParameters = queryStringParameters || {};
  if (isBase64Encoded) {
    body = Buffer.from(body, 'base64').toString('utf8');
  }

  const {hash, ext, type} = queryStringParameters;
  if (hash && ext && type) {
    const p = _makePromise()
    const index = ++cbIndex;
    cbs[index] = p.accept.bind(p);

    const page = await browser.newPage();
    page.on('console', e => {
      console.log(e);
    });
    page.on('error', err => {
      console.log(err);
    });
    page.on('pageerror', err => {
      console.log(err);
    });
    console.log('load 1', hash, ext, type);
    await page.goto(`https://app.webaverse.com/screenshot.html?hash=${hash}&ext=${ext}&type=${type}&dst=http://127.0.0.1:8000/` + index);
    // const result = await page.title();
    console.log('load 2');

    const {req, res} = await p;
    console.log('load 3', req);

    const b = await new Promise((accept, reject) => {
      const bs = [];
      req.on('data', d => {
        bs.push(d);
      });
      req.on('end', () => {
        const b = Buffer.concat(bs);
        accept(b);
        res.end();
      });
    });

    console.log('load 4', b.length);

    page.close();

    console.log('load 5', b.length);

    return {
      // statusCode: 404,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
      },
      body: b.toString('base64'),
      isBase64Encoded: true,
    };
  } else {
    return {
      statusCode: 404,
    };
  }
};