const axios = require('axios');
const DateTime = require('luxon').DateTime;
const AWS = require('aws-sdk');
const env = require('env-var');

const FUNNY_HOLIDAYS_URL = 'https://www.webcal.fi/cal.php?id=31&format=json&start_year=current_year&end_year=current_year&tz=Europe%2FHelsinki';

const fetchFunnyHolidays = () => {
  return axios.get(FUNNY_HOLIDAYS_URL);
};

const fetch = (event) => {
  const topicArn = env.get('SNS_HOLIDAYS_TOPIC').required().asString();
  const sns = new AWS.SNS();
  return fetchFunnyHolidays()
    .then(response => Promise.resolve(response.data
      .filter(holiday => DateTime.fromISO(holiday.date).hasSame(DateTime.fromISO(event.time), 'day')))
    )
    .then(holidays => {
      return Promise.all(holidays.map((holiday) => {
        return sns.publish({
          Message: JSON.stringify(holiday),
          TopicArn: topicArn
        }).promise();
      }));
    });
};

exports.handler = fetch;