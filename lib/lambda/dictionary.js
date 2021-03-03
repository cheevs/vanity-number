const fs = require('fs');
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

const writeOfDictionaryDefinitions = () => {
  const array = fs.readFileSync('/Users/req89251/SandboxProjects/vanity-number/dictionary-definitions.json').toString();
  const parsed = JSON.parse(array);
  console.log(Object.keys(parsed).length);

  const result = [];
  for (const [key, value] of Object.entries(parsed)) {
    console.log(`${key}: ${value}`);
    if (key.length <= 5 && key.length > 1) {
      result.push({ word: key, definition: value });
    }
  }

  console.log(result.length);
  fs.writeFile('dictionary-definitions-formated.json', JSON.stringify(result), (err) => {
    if (err) return console.log(err);
    console.log('Hello World > helloworld.txt');
  });
};

module.exports = { getListOfWords, writeOfDictionaryDefinitions };
