const env = require('env-var');
const { DateTime } = require('luxon');
const AWS = require('aws-sdk');

const createGetRequest = (bucketName, key) => ({
  Bucket: bucketName,
  Key: key
});

const handler = (event) => {
  const bucketName = env.get('S3_HOLIDAYS_BY_DAY_BUCKET').required().asString();
  const topicArn = env.get('SNS_HOLIDAYS_TOPIC').required().asString();
  const dateString = DateTime.fromISO(event.time).toISODate();

  const s3 = new AWS.S3();
  const sns = new AWS.SNS();

  return s3.getObject(createGetRequest(bucketName, dateString)).promise()
    .then(data => Promise.resolve(JSON.parse(data.Body)))
    .catch(err => Promise.resolve([]))
    .then(holidays =>
      Promise.all(holidays.map(holiday =>
        sns.publish({
          Message: JSON.stringify(holiday),
          TopicArn: topicArn
        }).promise()
      ))
    );
};

module.exports = {
  handler
};