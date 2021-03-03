const AWS = require('aws-sdk');

const getListOfWords = async () => {
  const s3 = new AWS.S3();
  const params = {
    Bucket: process.env.WORDS_BUCKET,
    Key: process.env.WORDS_FILE,
  };
  const data = await s3.getObject(params).promise();
  return JSON.parse(data.Body.toString());
};

module.exports = { getListOfWords };
