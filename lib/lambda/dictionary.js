const fs = require('fs');

const getListOfWords = () => {
  const array = fs.readFileSync('/Users/req89251/SandboxProjects/vanity-number/words.json').toString();
  const parsed = JSON.parse(array);
  console.log(parsed.length);
  return parsed;
};

module.exports = { getListOfWords };
