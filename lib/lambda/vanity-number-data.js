const AWS = require('aws-sdk');

const saveVanityNumber = async (callerNumber, vanityNumbers) => {
  const documentClient = new AWS.DynamoDB.DocumentClient();
  return documentClient.put({
    TableName: process.env.VANITY_NUMBER_TABLE_NAME,
    Item: {
      callerNumber,
      vanityNumbers,
    },
  }).promise();
};

module.exports = { saveVanityNumber };
