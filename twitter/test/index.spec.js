const handler = require('../index').handler;
const nock = require('nock');
const expect = require('chai').expect;
const { SINGLE_MESSAGE_FIXTURE, WEEKLY_SUMMARY_MESSAGE_FIXTURE, UNKNOWN_TOPIC_MESSAGE_FIXTURE } = require('./fixtures');

const mockTwitterApi = (queryMatcher) => {
  nock('https://api.twitter.com')
    .post('/1.1/statuses/update.json')
    .query(queryMatcher)
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
    setupEnvironment();
  });

  const assertNockIsDone = () =>
    expect(nock.isDone(), `Twitter API was not invoked with correct parameters, ${nock.pendingMocks()}`)
      .to.equal(true);

  describe('when invoked with a single holiday', () => {
    beforeEach(() => {
      mockTwitterApi(query =>
        query.status.indexOf('keskiviikko, 15. marraskuuta') > -1 &&
        query.status.indexOf('http://www.daysoftheyear.com/days/clean-your-refrigerator-day') > -1
      );
    });

    it('sends a tweet', () =>
      handler(SINGLE_MESSAGE_FIXTURE).then(assertNockIsDone)
    );
  });

  describe('when invoked with a weekly summary', () => {
    beforeEach(() => {
      mockTwitterApi(({ status }) =>
        status.indexOf('Alkavan viikon') > -1 &&
        status.indexOf('\nma 20.11. Kauneuspäivä +2') > -1 &&
        status.indexOf('\nti 21.11. Maailman tervehdyspäivä +2') > -1 &&
        status.indexOf('\nke 22.11. Mene ajelulle -päivä +1') > -1 &&
        status.indexOf('\nto 23.11. Fibonaccin päivä') > -1 &&
        status.indexOf('\npe 24.11. Juice-päivä +4') > -1 &&
        status.indexOf('\nla 25.11. Jouluhankintojen tekemisen muistutuspäivä') > -1 &&
        status.indexOf('\nsu 26.11. –') > -1
      );
    });

    it('sends a tweet', () =>
      handler(WEEKLY_SUMMARY_MESSAGE_FIXTURE).then(assertNockIsDone)
    );
  });

  describe('when invoked from an unknown topic', () => {
    it('throws an error', () =>
      handler(UNKNOWN_TOPIC_MESSAGE_FIXTURE).then(() => expect.fail()).catch(err => expect(err).to.be.an('error'))
    );
  });
});
