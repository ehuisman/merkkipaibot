const handler = require('../index').handler;
const nock = require('nock');
const expect = require('chai').expect;

const MESSAGE_FIXTURE = {
  "Records": [
    {
      "EventVersion": "1.0",
      "EventSubscriptionArn": "arn:aws:sns:aq-north-1:123456789012:Holidays",
      "EventSource": "aws:sns",
      "Sns": {
        "SignatureVersion": "1",
        "Timestamp": "1970-01-01T00:00:00.000Z",
        "Signature": "EXAMPLE",
        "SigningCertUrl": "EXAMPLE",
        "MessageId": "95df01b4-ee98-5cb9-9903-4c221d41eb5e",
        "Message": "{\"date\":\"2017-11-15\",\"name\":\"Siivoa jääkaappisi -päivä\",\"url\":\"http://www.daysoftheyear.com/days/clean-your-refrigerator-day/\"}",
        "MessageAttributes": {
          "Test": {
            "Type": "String",
            "Value": "TestString"
          },
          "TestBinary": {
            "Type": "Binary",
            "Value": "TestBinary"
          }
        },
        "Type": "Notification",
        "UnsubscribeUrl": "EXAMPLE",
        "TopicArn": "arn:aws:sns:aq-north-1:123456789012:Holidays",
        "Subject": "TestInvoke"
      }
    }
  ]
};

const mockTwitterApi = () => {
  nock('https://api.twitter.com')
    .post('/1.1/statuses/update.json')
    .query(query => query.status.indexOf('15.11. ') > -1)
    .reply(200, {});
};

const setupEnvironment = () => {
  process.env.TWITTER_CONSUMER_KEY = 'key';
  process.env.TWITTER_CONSUMER_SECRET = 'secret';
  process.env.TWITTER_ACCESS_TOKEN = 'token';
  process.env.TWITTER_ACCESS_TOKEN_SECRET = 'token_secret';
};

describe('Twitter client', () => {
  beforeEach(() => {
    mockTwitterApi();
    setupEnvironment();
  });

  it('sends a tweet', () => handler(MESSAGE_FIXTURE)
    .then(() => expect(nock.isDone()).to.equal(true))
  );
});
