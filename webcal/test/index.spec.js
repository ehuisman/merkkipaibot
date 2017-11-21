const nock = require('nock');
const expect = require('chai').expect;
const AWS = require('aws-sdk-mock');
const sinon = require('sinon');
const range = require('lodash.range');
const isEqual = require('lodash.isequal');
const DateTime = require('luxon').DateTime;
const sillyname = require('sillyname');

const handler = require('../index').handler;

const TOPIC_ARN_FIXTURE = 'arn:aws:sns:aq-north-1:123456789012:WeeklyHolidays';
const BUCKET_NAME_FIXTURE = 'cache-bucket';

const createQueryMatcher = (id, startYear, endYear) => ({
  id: id,
  format: 'json',
  start_year: startYear || 2017,
  end_year: endYear || 2017,
  tz: 'Europe/Helsinki'
});

const generateHoliday = (fromDate, index) => ({
  date: fromDate.plus({ days: (index % 14) + 1 }).toISODate(),
  name: sillyname() + ' -p\u00e4iv\u00e4',
  url: `http://${sillyname.randomNoun()}.example`
});

const generateHolidaysFixture = function (startDate) {
  return range(28).map(i => generateHoliday(startDate, i));
};

const generateEventFixture = (dateTime) => ({ time: dateTime.toISO() });

const mockWebCalFi = (funnyQueryMatcher, littleKnownQueryMatcher, funnyHolidaysResponse, littleKnownHolidaysResponse) => {
  nock('https://www.webcal.fi')
    .get('/cal.php')
    .query(funnyQueryMatcher)
    .reply(200, JSON.stringify(funnyHolidaysResponse));

  nock('https://www.webcal.fi')
    .get('/cal.php')
    .query(littleKnownQueryMatcher)
    .reply(200, JSON.stringify(littleKnownHolidaysResponse));
};

const mockAws = (publishSpy, putObjectSpy) => {
  AWS.mock('SNS', 'publish', publishSpy);
  AWS.mock('S3', 'putObject', putObjectSpy);
};

const mockEnvironment = () => {
  process.env.SNS_WEEKLY_HOLIDAYS_TOPIC = TOPIC_ARN_FIXTURE;
  process.env.S3_HOLIDAYS_BY_DAY_BUCKET = BUCKET_NAME_FIXTURE;
};

const isoDateStringFor = function (START_DATE_FIXTURE, i) {
  return START_DATE_FIXTURE.plus({ weeks: 1 }).startOf('week').plus({ days: i }).toISODate();
};

describe('handler', () => {
  const publishSpy = sinon.stub();
  const putObjectSpy = sinon.stub();

  beforeEach(() => {
    publishSpy.yields();
    putObjectSpy.yields();

    mockAws(publishSpy, putObjectSpy);
    mockEnvironment();
  });

  const START_DATE_FIXTURE = DateTime.local(2017, 11, 15);
  const EVENT_FIXTURE = generateEventFixture(START_DATE_FIXTURE);

  const assertSnsMessage = () =>
    expect(publishSpy.calledWithMatch(snsMessage =>
      isEqual(Object.keys(JSON.parse(snsMessage.Message)), range(7).map(i => isoDateStringFor(START_DATE_FIXTURE, i))) &&
      snsMessage.TopicArn === TOPIC_ARN_FIXTURE
    )).to.equal(true);

  const assertPutObject = () =>
    Promise.all(range(7).map(i =>
      expect(putObjectSpy.calledWithMatch({ Key: isoDateStringFor(START_DATE_FIXTURE, i) })).to.equal(true))
    );

  describe('when the whole week is inside one year', () => {
    const FUNNY_HOLIDAYS_FIXTURE = generateHolidaysFixture(START_DATE_FIXTURE);
    const LITTLE_KNOWN_HOLIDAYS_FIXTURE = generateHolidaysFixture(START_DATE_FIXTURE);

    beforeEach(() => {
      mockWebCalFi(createQueryMatcher(31), createQueryMatcher(34), FUNNY_HOLIDAYS_FIXTURE, LITTLE_KNOWN_HOLIDAYS_FIXTURE);
    });

    it('fetches funny and little known holidays for current year', () =>
      handler(EVENT_FIXTURE)
        .then(() => expect(nock.isDone()).to.equal(true))
    );

    it('uses date as the key when storing the holidays to S3', () =>
      handler(EVENT_FIXTURE).then(assertPutObject)
    );

    it('publishes the holidays of the next week to SNS', () =>
      handler(EVENT_FIXTURE).then(() =>
        expect(publishSpy.calledWithMatch(snsMessage =>
          isEqual(Object.keys(JSON.parse(snsMessage.Message)), range(7).map(i => isoDateStringFor(START_DATE_FIXTURE, i))) &&
          snsMessage.TopicArn === TOPIC_ARN_FIXTURE
        )).to.equal(true)
      )
    );
  });

  describe('when part of the week is within the next year', () => {
    const START_DATE_FIXTURE = DateTime.local(2018, 12, 30);
    const FUNNY_HOLIDAYS_FIXTURE = generateHolidaysFixture(START_DATE_FIXTURE);
    const LITTLE_KNOWN_HOLIDAYS_FIXTURE = generateHolidaysFixture(START_DATE_FIXTURE);

    beforeEach(() => {
      mockWebCalFi(createQueryMatcher(31, 2018, 2019), createQueryMatcher(34, 2018, 2019), FUNNY_HOLIDAYS_FIXTURE, LITTLE_KNOWN_HOLIDAYS_FIXTURE);
    });

    it('fetches funny and little known holidays for current year', () =>
      handler({ time: START_DATE_FIXTURE.toISODate() }).then(() => expect(nock.isDone()).to.equal(true))
    );
  });

  describe('when a day has no holidays', () => {
    beforeEach(() => {
      mockWebCalFi(createQueryMatcher(31), createQueryMatcher(34), [], []);
    });

    it('publishes the day with an empty array to SNS', () =>
      handler(EVENT_FIXTURE).then(assertSnsMessage)
    );

    it('stores an empty array for the day in S3', () =>
      handler(EVENT_FIXTURE).then(assertPutObject)
    )
  });
});
