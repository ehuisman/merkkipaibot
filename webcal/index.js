const axios = require('axios');
const DateTime = require('luxon').DateTime;
const AWS = require('aws-sdk');
const env = require('env-var');

const FUNNY_HOLIDAYS_URL = 'https://www.webcal.fi/cal.php?id=31&format=json&start_year=current_year&end_year=current_year&tz=Europe%2FHelsinki';
const DELAY_BETWEEN_MESSAGES = 30;

const fetchFunnyHolidays = () => {
  return axios.get(FUNNY_HOLIDAYS_URL);
};

const fetch = (event) => {
  const queueUrl = env.get('HOLIDAY_QUEUE_URL').required().asUrlString();
  const sqs = new AWS.SQS();
  return fetchFunnyHolidays()
    .then(response => Promise.resolve(response.data
      .filter(holiday => DateTime.fromISO(holiday.date).hasSame(DateTime.fromISO(event.time), 'day')))
    )
    .then(holidays => {
      return Promise.all(holidays.map((holiday, index) => {
        return sqs.sendMessage({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify(holiday),
          DelaySeconds: index * DELAY_BETWEEN_MESSAGES
        }).promise()
      }));
    });
};

exports.handler = fetch;