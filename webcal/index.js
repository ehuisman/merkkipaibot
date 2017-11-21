const axios = require('axios');
const { DateTime, Interval, Duration } = require('luxon');
const AWS = require('aws-sdk');
const env = require('env-var');

const createWebCalUrl = (id, startYear, endYear) =>
  `https://www.webcal.fi/cal.php?id=${id}&format=json&start_year=${startYear}&end_year=${endYear}&tz=Europe%2FHelsinki`;

const fetchCalendars = (startYear, endYear) => Promise.all([
  axios.get(createWebCalUrl(31, startYear, endYear)),
  axios.get(createWebCalUrl(34, startYear, endYear))
]);

const fetch = (event) => {
  const topicArn = env.get('SNS_WEEKLY_HOLIDAYS_TOPIC').required().asString();
  const cacheBucket = env.get('S3_HOLIDAYS_BY_DAY_BUCKET').required().asString();
  const sns = new AWS.SNS();
  const s3 = new AWS.S3();

  const nextWeek = Interval.after(DateTime.fromISO(event.time).plus({ weeks: 1 }).startOf('week'), Duration.fromObject({ weeks: 1 }));

  return fetchCalendars(nextWeek.start.year, nextWeek.end.year)
    .then(responses =>
      Promise.resolve(responses.reduce((data, response) =>
        data.concat(response.data), [])
      )
    )
    .then(data =>
      Promise.resolve(data.filter(holiday =>
        nextWeek.contains(DateTime.fromISO(holiday.date)))
      )
    )
    .then(holidays =>
      Promise.resolve(holidays.reduce(
        (byDay, holiday) => {
          byDay[holiday.date].push(holiday);
          return byDay;
        },
        nextWeek.divideEqually(7)
          .map(day => day.start.toISODate())
          .map(date => ({ [date]: []}))
          .reduce((memo, value) => Object.assign(memo, value), {})
      ))
    )
    .then(holidaysByDate =>
      Object.keys(holidaysByDate).map(date =>
        s3.putObject({
          Bucket: cacheBucket,
          Key: date,
          Body: JSON.stringify(holidaysByDate[date]),
          ContentType: 'application/json'
        }).promise()
      ).concat([
        sns.publish({
          Message: JSON.stringify(holidaysByDate),
          TopicArn: topicArn
        }).promise()
      ])
    );
};

exports.handler = fetch;