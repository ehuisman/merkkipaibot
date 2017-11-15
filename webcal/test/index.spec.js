const nock = require('nock');
const expect = require('chai').expect;
const AWS = require('aws-sdk-mock');
const sinon = require('sinon');
const range = require('lodash.range');
const DateTime = require('luxon').DateTime;
const sillyname = require('sillyname');

const handler = require('../index').handler;

const QUEUE_URL_FIXTURE = 'http://sqs.eu-central-1.amazonaws.example/123456789012/HolidayQueue';

const generateHoliday = (day) => ({
  date: DateTime.local(2017, 1, (day % 5) + 1).toISODate(),
  name: sillyname() + ' -p\u00e4iv\u00e4',
  url: `http://${sillyname.randomNoun()}.example`
});

const generateResponseBodyFixture = () => JSON.stringify(range(10).map(i => generateHoliday(i)));

const generateEventFixture = () => ({ time: DateTime.utc(2017, 1, 1, 11).toISO() });

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
  process.env.HOLIDAY_QUEUE_URL = QUEUE_URL_FIXTURE;
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

  it('adds holidays of current day to SQS', () => handler(generateEventFixture())
    .then(() => expect(sendMessageSpy.calledTwice, 'Should have added to messages to the queue').to.equal(true))
  );

  it('adds the holidays to the correct queue', () => handler(generateEventFixture())
    .then(() => expect(sendMessageSpy.alwaysCalledWithMatch({ QueueUrl: QUEUE_URL_FIXTURE })).to.equal(true))
  );

  it('adds the holidays to the queue with increasing delay', () => handler(generateEventFixture())
    .then(() => expect(sendMessageSpy.secondCall.args[0].DelaySeconds).to.be.greaterThan(sendMessageSpy.firstCall.args[0].DelaySeconds))
  );
});
