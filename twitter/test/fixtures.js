const HOLIDAYS_BY_DAY = {
  '2017-11-20': [
    {
      "date": "2017-11-20",
      "name": "Anna tietokoneellesi nimi -päivä",
      "url": "http://www.daysoftheyear.com/days/name-your-pc-day/"
    },
    {
      "date": "2017-11-20",
      "name": "Järjettömyyspäivä",
      "url": "http://holidayinsights.com/moreholidays/November/absurdityday.htm"
    },
    {
      "date": "2017-11-20",
      "name": "Kauneuspäivä",
      "url": "http://holidayinsights.com/moreholidays/November/beautifulday.htm"
    }
  ],
  '2017-11-21': [
    {
      "date": "2017-11-21",
      "name": "Maailman tervehdyspäivä",
      "url": "https://en.wikipedia.org/wiki/World_Hello_Day"
    },
    {
      "date": "2017-11-21",
      "name": "Väärän tunnustuksen päivä",
      "url": "http://holidayinsights.com/moreholidays/November/falseconfessionday.htm"
    },
    {
      "date": "2017-11-21",
      "name": "Maailman kalatalouspäivä",
      "url": "http://www.gdrc.org/doyourbit/21_11-fisheries-day.html"
    }
  ],
  '2017-11-22': [
    {
      "date": "2017-11-22",
      "name": "Mene ajelulle -päivä",
      "url": "http://www.daysoftheyear.com/days/go-for-a-ride-day/"
    },
    {
      "date": "2017-11-22",
      "name": "Perusta oma maa -päivä",
      "url": "http://wheresmytower.wordpress.com/2012/11/22/national-start-your-own-country-day/"
    }
  ],
  '2017-11-23': [
    {
      "date": "2017-11-23",
      "name": "Fibonaccin päivä",
      "url": "http://www.daysoftheyear.com/days/fibonacci-day/"
    }
  ],
  '2017-11-24': [
    {
      "date": "2017-11-24",
      "name": "Eipä kestä -päivä",
      "url": "http://holidayinsights.com/moreholidays/November/yourewelcomeday.htm"
    },
    {
      "date": "2017-11-24",
      "name": "Hammaslankapäivä",
      "url": "http://www.daysoftheyear.com/days/flossing-day/"
    },
    {
      "date": "2017-11-24",
      "name": "Juhli ainutlaatuista kykyäsi -päivä",
      "url": "http://www.daysoftheyear.com/days/celebrate-your-unique-talent-day/"
    },
    {
      "date": "2017-11-24",
      "name": "Juice-päivä",
      "url": "https://www.facebook.com/events/521073444895927/"
    },
    {
      "date": "2017-11-24",
      "name": "Musta perjantai",
      "url": "https://en.wikipedia.org/wiki/Black_Friday_%28shopping%29"
    }
  ],
  '2017-11-25': [
    {
      "date": "2017-11-25",
      "name": "Jouluhankintojen tekemisen muistutuspäivä",
      "url": "http://www.daysoftheyear.com/days/shopping-reminder-day/"
    }
  ],
  '2017-11-26': []
};

const WEEKLY_SUMMARY_MESSAGE_FIXTURE = {
  "Records": [
    {
      "EventVersion": "1.0",
      "EventSubscriptionArn": "arn:aws:sns:EXAMPLE",
      "EventSource": "aws:sns",
      "Sns": {
        "SignatureVersion": "1",
        "Timestamp": "1970-01-01T00:00:00.000Z",
        "Signature": "EXAMPLE",
        "SigningCertUrl": "EXAMPLE",
        "MessageId": "95df01b4-ee98-5cb9-9903-4c221d41eb5e",
        "Message": JSON.stringify(HOLIDAYS_BY_DAY),
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
        "TopicArn": "arn:aws:sns:aq-north-1:123456789012:WeeklyHolidays",
        "Subject": "TestInvoke"
      }
    }
  ]
};

const SINGLE_MESSAGE_FIXTURE = {
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

const UNKNOWN_TOPIC_MESSAGE_FIXTURE = {
  "Records": [
    {
      "EventVersion": "1.0",
      "EventSubscriptionArn": "arn:aws:sns:EXAMPLE",
      "EventSource": "aws:sns",
      "Sns": {
        "SignatureVersion": "1",
        "Timestamp": "1970-01-01T00:00:00.000Z",
        "Signature": "EXAMPLE",
        "SigningCertUrl": "EXAMPLE",
        "MessageId": "95df01b4-ee98-5cb9-9903-4c221d41eb5e",
        "Message": "Hello from SNS!",
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
        "TopicArn": "arn:aws:sns:EXAMPLE",
        "Subject": "TestInvoke"
      }
    }
  ]
};

module.exports = {
  WEEKLY_SUMMARY_MESSAGE_FIXTURE,
  SINGLE_MESSAGE_FIXTURE,
  UNKNOWN_TOPIC_MESSAGE_FIXTURE
};