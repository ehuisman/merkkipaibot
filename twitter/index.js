const Twit = require('twit');
const env = require('env-var');
const DateTime = require('luxon').DateTime;

let makeTweet = function (event) {
  return { status: `Tänään on ${DateTime.fromISO(event.date).toFormat('d.M.')}, ${event.name}.` };
};

const handler = (event) => {
  const twitter = new Twit({
    consumer_key: env.get('HOLIDAYS_TWITTER_CONSUMER_KEY').required().asString(),
    consumer_secret: env.get('HOLIDAYS_TWITTER_CONSUMER_SECRET').required().asString(),
    access_token: env.get('HOLIDAYS_TWITTER_ACCESS_TOKEN').required().asString(),
    access_token_secret: env.get('HOLIDAYS_TWITTER_ACCESS_TOKEN_SECRET').required().asString()
  });

  return twitter.post('statuses/update', makeTweet(event))
};

exports.handler = handler;