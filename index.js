// globalThis.window = globalThis;
// globalThis.self = globalThis;

// const Discord = require('./discord.12.0.1.min.js');
const Discord = require('discord.js');

function parseQuery(queryString) {
    var query = {};
    var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return query;
}

const discordConfig = {
  // clientId: '684141574808272937',
  // clientSecret: 'b_6lvdbXZGbT3Ruw8VSfQpBIQedTrZZl',
  token: 'Njg0MTQxNTc0ODA4MjcyOTM3.Xl17oQ.6pixWLMAFR9Gkpd5HtZ8XfB1miM',
  channelId: '684167488963215364',
};
const client = new Discord.Client();
const readyPromise = client.login(discordConfig.token)
  .then(() => client.channels.fetch(discordConfig.channelId));

client.on('error', err => {
  console.warn(err.stack);
});

exports.handler = async event => {
  const channel = await readyPromise;
  // const {pathname, search} = new URL(request.url);
  console.log('got event', event);
  let {queryStringParameters: {t}, body, isBase64Encoded} = event;
  if (isBase64Encoded) {
    body = Buffer.from(body, 'base64');
  }
  if (t === 'postMessage') {
    await channel.send(body);
    /* if (typeof data.text === 'string') {
      channel.send(data.text);
    } else if (typeof data.attachment === 'string') {
      const filename = data.attachment;
      if (discordAttachmentBuffer) {
        channel.send(new Discord.Attachment(discordAttachmentBuffer, filename));
        discordAttachmentBuffer = null;
      } else {
        // console.log('prepare for attachment', data.attachment);
        discordAttachmentSpec = {
          channel,
          filename,
        };
      } */

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
      },
      body: 'ok',
    };
  } else {
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
      },
      body: 'path not found',
    };
  }
}
