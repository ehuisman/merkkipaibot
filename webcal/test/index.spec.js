const nock = require('nock');
const expect = require('chai').expect;
const AWS = require('aws-sdk-mock');
const sinon = require('sinon');

const handler = require('../index').handler;

const generateResponseBodyFixture = function () {
  return '[{"date":"2017-01-01","name":"Avantouintip\u00e4iv\u00e4","url":"http:\\/\\/www.daysoftheyear.com\\/days\\/polar-bear-swim-day\\/"}]';
};

const mockServer = () => {
  nock('https://www.webcal.fi')
    .get('/cal.php')
    .query(true)
    .reply(200, generateResponseBodyFixture());
};

const mockAws = (sendMessageSpy) => {
  AWS.mock('SQS', 'sendMessage', sendMessageSpy)
};

const mockEnvironment = () => {
  process.env.HOLIDAY_QUEUE_URL = 'http://sqs.eu-central-1.amazonaws.example/123456789012/HolidayQueue';
};

describe('handler', () => {
  const sendMessageSpy = sinon.stub();

  beforeEach(() => {
    sendMessageSpy.yields();

    mockServer();
    mockAws(sendMessageSpy);
    mockEnvironment();
  });

  it('fetches funny holidays from webcal.fi', () => handler({})
    .then(() => expect(nock.isDone(), 'All requests should be done').to.equal(true))
  );

  it('adds events to SQS', () => handler({"time": "2017-01-01T11:00:00Z"})
    .then(() => expect(sendMessageSpy.called).to.equal(true))
  );
});