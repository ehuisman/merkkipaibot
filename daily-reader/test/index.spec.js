const { handler } = require('../index');
const AWS = require('aws-sdk-mock');
const sinon = require('sinon');
const expect = require('chai').expect;

const EVENT_FIXTURE = {
  "version": "0",
  "id": "89d1a02d-5ec7-412e-82f5-13505f849b41",
  "detail-type": "Scheduled Event",
  "source": "aws.events",
  "account": "123456789012",
  "time": "2016-12-30T18:44:49Z",
  "region": "us-east-1",
  "resources": [
    "arn:aws:events:us-east-1:123456789012:rule/SampleRule"
  ],
  "detail": {}
};

const HOLIDAYS_FIXTURE = [{
  date: "2016-12-30",
  name:"Pekonip\u00e4iv\u00e4",
  url:"http:\/\/www.daysoftheyear.com\/days\/bacon-day\/"
}];

const BUCKET_NAME_FIXTURE = 'cache-bucket';
const TOPIC_ARN_FIXTURE = 'arn:aws:sns:aq-north-1:123456789012:WeeklyHolidays';

const mockEnv = () => {
  process.env.S3_HOLIDAYS_BY_DAY_BUCKET = BUCKET_NAME_FIXTURE;
  process.env.SNS_HOLIDAYS_TOPIC = TOPIC_ARN_FIXTURE;

};

const mockAws = (getObjectSpy, publishSpy) => {
  AWS.mock('S3', 'getObject', getObjectSpy);
  AWS.mock('SNS', 'publish', publishSpy)
};

describe('Daily Reader', () => {
  const getObjectSpy = sinon.stub();
  const publishSpy = sinon.stub();

  beforeEach(() => {
    getObjectSpy.yields(null, { Body: new Buffer(JSON.stringify(HOLIDAYS_FIXTURE)) });
    publishSpy.yields();
    mockEnv();
    mockAws(getObjectSpy, publishSpy);
  });

  afterEach(() => {
    getObjectSpy.reset();
    publishSpy.reset();
  });

  it('reads holidays of event\'s date from S3', () =>
    handler(EVENT_FIXTURE).then(() =>
      expect(getObjectSpy.calledWithMatch({
        Key: EVENT_FIXTURE.time.substr(0, 10)
      })).to.equal(true)
    )
  );

  it('reads the holidays from the correct bucket', () =>
    handler(EVENT_FIXTURE).then(() =>
      expect(getObjectSpy.calledWithMatch({
        Bucket: BUCKET_NAME_FIXTURE
      })).to.equal(true)
    )
  );

  it('publishes the holidays to SNS', () =>
    handler(EVENT_FIXTURE).then(() =>
      expect(publishSpy.calledOnce).to.equal(true)
    )
  );

  it('publishes the holidays to the correct SNS topic', () =>
    handler(EVENT_FIXTURE).then(() =>
      expect(publishSpy.calledWithMatch({
        TopicArn: TOPIC_ARN_FIXTURE
      })).to.equal(true)
    )
  );

  it('publishes the holidays as JSON', () =>
    handler(EVENT_FIXTURE).then(() =>
      expect(JSON.parse(publishSpy.firstCall.args[0].Message)).to.eql(HOLIDAYS_FIXTURE[0])
    )
  );
});