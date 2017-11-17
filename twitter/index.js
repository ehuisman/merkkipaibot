const Twit = require('twit');
const env = require('env-var');
const moment = require('moment');
moment.locale('fi');

let makeTweet = function (event) {
  return { status: `Tänään on ${moment(event.date).format('dddd, D. MMMM')}ta, ${event.name}.${event.url ? `\n\nLisätietoja: ${event.url}` : '' }` };
};

const handler = (event) => {
  const twitter = new Twit({
    consumer_key: env.get('TWITTER_CONSUMER_KEY').required().asString(),
    consumer_secret: env.get('TWITTER_CONSUMER_SECRET').required().asString(),
    access_token: env.get('TWITTER_ACCESS_TOKEN').required().asString(),
    access_token_secret: env.get('TWITTER_ACCESS_TOKEN_SECRET').required().asString()
  });
  return twitter.post('statuses/update', makeTweet(JSON.parse(event.Records[0].Sns.Message)));
};

exports.handler = handler;
