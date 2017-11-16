const nock = require('nock');
const expect = require('chai').expect;
const AWS = require('aws-sdk-mock');
const sinon = require('sinon');
const range = require('lodash.range');
const DateTime = require('luxon').DateTime;
const sillyname = require('sillyname');

const handler = require('../index').handler;

const TOPIC_ARN_FIXTURE = 'arn:aws:sns:aq-north-1:123456789012:Holidays';

const generateHoliday = (day) => ({
  date: DateTime.local(2017, 1, (day % 5) + 1).toISODate(),
  name: sillyname() + ' -p\u00e4iv\u00e4',
  url: `http://${sillyname.randomNoun()}.example`
});

const HOLIDAYS_FIXTURE = range(10).map(i => generateHoliday(i));

const generateEventFixture = () => ({ time: DateTime.utc(2017, 1, 1, 11).toISO() });

const mockServer = () => {
  nock('https://www.webcal.fi')
    .get('/cal.php')
    .query(true)
    .reply(200, JSON.stringify(HOLIDAYS_FIXTURE));
};

const mockAws = (publishSpy) => {
  AWS.mock('SNS', 'publish', publishSpy)
};

const mockEnvironment = () => {
  process.env.SNS_HOLIDAYS_TOPIC = TOPIC_ARN_FIXTURE;
};

const messageMatcher = (index) => ({ Message: JSON.stringify(HOLIDAYS_FIXTURE[index]) });

describe('handler', () => {
  const publishSpy = sinon.stub();

  beforeEach(() => {
    publishSpy.yields();

    mockServer();
    mockAws(publishSpy);
    mockEnvironment();
  });

  it('fetches funny holidays from webcal.fi', () => handler({})
    .then(() => expect(nock.isDone(), 'All requests should be done').to.equal(true))
  );

  it('adds correct number of holidays to SNS', () => handler(generateEventFixture())
    .then(() => expect(publishSpy.calledTwice, 'Should have added sent messages to the topic').to.equal(true))
  );

  it('adds first holiday of the day to SNS', () => handler(generateEventFixture())
    .then(() => {
      return expect(publishSpy.calledWithMatch(messageMatcher(0)), 'Should have sent first message to the topic').to.equal(true)
    })
  );

  it('adds second holiday of the day to SNS', () => handler(generateEventFixture())
    .then(() => {
      return expect(publishSpy.calledWithMatch(messageMatcher(5)), 'Should have sent second message to the topic').to.equal(true)
    })
  );

  it('adds the holidays to the correct queue', () => handler(generateEventFixture())
    .then(() => expect(publishSpy.alwaysCalledWithMatch({ TopicArn: TOPIC_ARN_FIXTURE })).to.equal(true))
  );
});
