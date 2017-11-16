const axios = require('axios');
const DateTime = require('luxon').DateTime;
const AWS = require('aws-sdk');
const env = require('env-var');

const createWebCalUrl = s => `https://www.webcal.fi/cal.php?id=${s}&format=json&start_year=current_year&end_year=current_year&tz=Europe%2FHelsinki`;
const FUNNY_HOLIDAYS_URL = createWebCalUrl(31);
const LITTLE_KNOWN_HOLIDAYS_URL = createWebCalUrl(34);

const fetchFunnyHolidays = () => Promise.all([
  axios.get(FUNNY_HOLIDAYS_URL),
  axios.get(LITTLE_KNOWN_HOLIDAYS_URL)
]);

const fetch = (event) => {
  const topicArn = env.get('SNS_HOLIDAYS_TOPIC').required().asString();
  const sns = new AWS.SNS();
  return fetchFunnyHolidays()
    .then(responses =>
      Promise.resolve(responses.reduce((data, response) =>
        data.concat(response.data), [])
      )
    )
    .then(data =>
      Promise.resolve(data.filter(holiday =>
        DateTime.fromISO(holiday.date).hasSame(DateTime.fromISO(event.time), 'day'))
      )
    )
    .then(holidays =>
      Promise.all(holidays.map((holiday) =>
        sns.publish({
          Message: JSON.stringify(holiday),
          TopicArn: topicArn
        }).promise()
      ))
    );
};

exports.handler = fetch;