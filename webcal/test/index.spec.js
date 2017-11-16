const nock = require('nock');
const expect = require('chai').expect;
const AWS = require('aws-sdk-mock');
const sinon = require('sinon');
const range = require('lodash.range');
const DateTime = require('luxon').DateTime;
const sillyname = require('sillyname');

const handler = require('../index').handler;

const TOPIC_ARN_FIXTURE = 'arn:aws:sns:aq-north-1:123456789012:Holidays';

let createQuery = id => ({
  id: id,
  format: 'json',
  start_year: 'current_year',
  end_year: 'current_year',
  tz: 'Europe/Helsinki'
});

const FUNNY_HOLIDAYS_QUERY = createQuery(31);
const LITTLE_KNOWN_HOLIDAYS_QUERY = createQuery(34);

const generateHoliday = (day) => ({
  date: DateTime.local(2017, 1, (day % 5) + 1).toISODate(),
  name: sillyname() + ' -p\u00e4iv\u00e4',
  url: `http://${sillyname.randomNoun()}.example`
});

let generateHolidaysFixture = function () {
  return range(10).map(i => generateHoliday(i));
};
const FUNNY_HOLIDAYS_FIXTURE = generateHolidaysFixture();
const LITTLE_KNOWN_HOLIDAYS_FIXTURE = generateHolidaysFixture();

const generateEventFixture = () => ({ time: DateTime.utc(2017, 1, 1, 11).toISO() });

const mockServer = () => {
  nock('https://www.webcal.fi')
    .get('/cal.php')
    .query(FUNNY_HOLIDAYS_QUERY)
    .reply(200, JSON.stringify(FUNNY_HOLIDAYS_FIXTURE));
  nock('https://www.webcal.fi')
    .get('/cal.php')
    .query(LITTLE_KNOWN_HOLIDAYS_QUERY)
    .reply(200, JSON.stringify(LITTLE_KNOWN_HOLIDAYS_FIXTURE));
};

const mockAws = (publishSpy) => {
  AWS.mock('SNS', 'publish', publishSpy)
};

const mockEnvironment = () => {
  process.env.SNS_HOLIDAYS_TOPIC = TOPIC_ARN_FIXTURE;
};

const messageMatcher = (fixture, index) => ({ Message: JSON.stringify(fixture[index]) });

describe('handler', () => {
  const publishSpy = sinon.stub();

  beforeEach(() => {
    publishSpy.yields();

    mockServer();
    mockAws(publishSpy);
    mockEnvironment();
  });

  it('fetches funny and little known holidays from webcal.fi', () => handler({})
    .then(() => expect(nock.isDone(), 'All requests should be done').to.equal(true))
  );

  it('publishes the correct number of holidays to SNS', () => handler(generateEventFixture())
    .then(() => expect(publishSpy.callCount === 4, 'Should have added sent messages to the topic').to.equal(true))
  );

  it('publishes the first funny holiday of the day to SNS', () => handler(generateEventFixture())
    .then(() => {
      return expect(publishSpy.calledWithMatch(messageMatcher(FUNNY_HOLIDAYS_FIXTURE, 0)), 'Should have sent first message to the topic').to.equal(true)
    })
  );

  it('publishes the second funny holiday of the day to SNS', () => handler(generateEventFixture())
    .then(() => {
      return expect(publishSpy.calledWithMatch(messageMatcher(FUNNY_HOLIDAYS_FIXTURE, 5)), 'Should have sent second message to the topic').to.equal(true)
    })
  );

  it('publishes the first little known holiday of the day to SNS', () => handler(generateEventFixture())
    .then(() => {
      return expect(publishSpy.calledWithMatch(messageMatcher(LITTLE_KNOWN_HOLIDAYS_FIXTURE, 0)), 'Should have sent first message to the topic').to.equal(true)
    })
  );

  it('publishes the first little known holiday of the day to SNS', () => handler(generateEventFixture())
    .then(() => {
      return expect(publishSpy.calledWithMatch(messageMatcher(LITTLE_KNOWN_HOLIDAYS_FIXTURE, 5)), 'Should have sent second message to the topic').to.equal(true)
    })
  );

  it('adds all the holidays to the correct queue', () => handler(generateEventFixture())
    .then(() => expect(publishSpy.alwaysCalledWithMatch({ TopicArn: TOPIC_ARN_FIXTURE })).to.equal(true))
  );
});
