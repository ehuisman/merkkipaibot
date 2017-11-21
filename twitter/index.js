const Twit = require('twit');
const env = require('env-var');
const moment = require('moment');
moment.locale('fi');

const makeSingleHolidayTweet = holiday => ({
  status: `Tänään on ${moment(holiday.date).format('dddd, D. MMMM')}ta, ${holiday.name}.${holiday.url ? `

Lisätietoja: ${holiday.url}` : '' }`
});

const makeDay = (date, holidays) =>
  `\n${moment(date).format('dd D.M.')} ${holidays.length > 0 ?
    `${holidays.sort((first, second) =>
      first.length - second.length)[0]}${holidays.length > 1 ?
      ` +${holidays.length - 1}` :
      ''}` :
    '–'}`;

const makeSummaryTweet = holidaysByDay => ({
  status: Object.keys(holidaysByDay).reduce((result, date) => result.concat(makeDay(date, holidaysByDay[date].map(holiday => holiday.name))), 'Alkavan viikon merkkipäivät\n')
});

const makeTweet = function (topic, message) {
  switch (topic) {
    case 'Holidays':
      return makeSingleHolidayTweet(message);
    case 'WeeklyHolidays':
      return makeSummaryTweet(message);
    default:
      throw new Error(`Could not route topic ${topic}`);
  }
};

const topicOf = function (event) {
  const arn = event.Records[0].Sns.TopicArn;
  return arn.substr(arn.lastIndexOf(':') + 1);
};

const handler = (event) => {
  const twitter = new Twit({
    consumer_key: env.get('TWITTER_CONSUMER_KEY').required().asString(),
    consumer_secret: env.get('TWITTER_CONSUMER_SECRET').required().asString(),
    access_token: env.get('TWITTER_ACCESS_TOKEN').required().asString(),
    access_token_secret: env.get('TWITTER_ACCESS_TOKEN_SECRET').required().asString()
  });
  try {
    return twitter.post('statuses/update', makeTweet(topicOf(event), JSON.parse(event.Records[0].Sns.Message)));
  } catch (err) {
    return Promise.reject(err);
  }
};

exports.handler = handler;
