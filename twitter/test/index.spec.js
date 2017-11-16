const handler = require('../index').handler;
const nock = require('nock');
const expect = require('chai').expect;

const MESSAGE_FIXTURE = {"date":"2017-11-15","name":"Siivoa jääkaappisi -päivä","url":"http://www.daysoftheyear.com/days/clean-your-refrigerator-day/"};

const mockTwitterApi = () => {
  nock('https://api.twitter.com')
    .post('/1.1/statuses/update.json')
    .query(query => query.status.indexOf('15.11.') > -1)
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