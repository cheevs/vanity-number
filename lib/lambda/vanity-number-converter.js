const { getStockTickers } = require('./stock-ticker-service');
const { saveVanityNumber } = require('./vanity-number-data');
const { getListOfWords } = require('./dictionary');

const phoneNumberToTextMap = {
  0: ['0'],
  1: ['1'],
  2: ['a', 'b', 'c'],
  3: ['d', 'e', 'f'],
  4: ['g', 'h', 'i'],
  5: ['j', 'k', 'l'],
  6: ['m', 'n', 'o'],
  7: ['p', 'q', 'r', 's'],
  8: ['t', 'u', 'v'],
  9: ['w', 'x', 'y', 'z'],
};

// TODO: look at options for optimization
// https://www.geeksforgeeks.org/find-possible-words-phone-digits/
// todo: rename convertPhoneNumberToVanity or something better
const convert = async (phoneNumber) => {
  const startTime = Date.now();
  console.log('phone number convert', phoneNumber);

  const vanityNumbers = await createVanityNumbers(phoneNumber);
  console.log('vanityNumber count', vanityNumbers.length);

  const sortedVanityNumbers = sortVanityNumbers(vanityNumbers);

  const saveResult = await saveVanityNumber(phoneNumber, sortedVanityNumbers.slice(0, 5));
  console.log(saveResult);

  console.log('Total exection time', Date.now() - startTime);
  console.log(sortedVanityNumbers.slice(0, 5));
  return sortedVanityNumbers;
};

const createVanityNumbers = async (phoneNumber) => {
  const phoneSubstring = phoneNumber.substring(phoneNumber.length - 10, phoneNumber.length);
  const characters = phoneSubstring.split('');
  const words = await getListOfWords();

  const chunkedData = getChunkedData(characters);

  const processedChunks = await processChunks(chunkedData, phoneSubstring, words);

  return deduplicateData(processedChunks);
};
/*
Process the phone number characters into separate arrays of size 5.
This will allow for asynchronous processing of each array individually.
Example
input:
[
  '7', '7', '3', '2',
  '7', '2', '5', '3',
  '7', '4'
]
output:
[
  [ '7', '7', '3', '2', '7' ],
  [ '7', '3', '2', '7', '2' ],
  [ '3', '2', '7', '2', '5' ],
  [ '2', '7', '2', '5', '3' ],
  [ '7', '2', '5', '3', '7' ],
  [ '2', '5', '3', '7', '4' ]
]
 */
const getChunkedData = (characters) => {
  const chunkResult = [];
  for (let i = 0; i < characters.length - 4; i++) {
    chunkResult.push(characters.slice(i, i + 5));
  }
  return chunkResult;
};

/*
This function will take all the chunks of data and process asynchronously.
Example
input:
[
  [ '7', '7', '3', '2', '7' ],
  [ '7', '3', '2', '7', '2' ],
  [ '3', '2', '7', '2', '5' ],
  [ '2', '7', '2', '5', '3' ],
  [ '7', '2', '5', '3', '7' ],
  [ '2', '5', '3', '7', '4' ]
]

output:
[
  {
    callerNumber: '7732725374',
    vanityMatch: 'PFC',
    vanityNumber: '7-PFC-2725374',
    ...
  }
  ...
]
 */
const processChunks = async (chunks, phoneSubstring, words) => {
  const promises = chunks.map(async (chunk) => permutateString(phoneSubstring, chunk, chunk.length, 0, '', words, []));

  return (await Promise.all(promises)).flat();
};

// todo: simplify this method
const permutateString = async (phoneNumber, numbers, length, numberIndex, string, words, foundWords) => {
  if (length === numberIndex) {
    const wordMatch = words.find((word) => string.includes(word));
    if (wordMatch) {
      const hasTickerBeenSeen = foundWords.find((word) => word === wordMatch);
      if (hasTickerBeenSeen) {
        return [];
      }
      foundWords.push(wordMatch);
      const wordIndex = string.indexOf(wordMatch);
      const partialNumberMatch = numbers
        .slice(wordIndex, wordIndex + wordMatch.length)
        .reduce((accumulator, item) => (accumulator + item), '');
      const formattedWordMatch = wordIndex === 0 ? `${wordMatch}-` : `-${wordMatch}-`;
      return [{
        callerNumber: phoneNumber,
        numbers,
        wordIndex: phoneNumber.indexOf(partialNumberMatch),
        wordLength: wordMatch.length,
        partialNumbersSlice: numbers.slice(wordIndex, wordIndex + wordMatch.length),
        partialNumberMatch,
        vanityMatch: wordMatch,

        generatedWord: string,
        // todo: handle leading dash; ternary for the start of the string??
        vanityNumber: phoneNumber.replace(partialNumberMatch, formattedWordMatch),
        word: wordMatch,
      }];
    }
    return [];
  }

  const stringList = [];

  for (let i = 0; i < phoneNumberToTextMap[numbers[numberIndex]].length; i++) {
    const stringCopy = `${string}${phoneNumberToTextMap[numbers[numberIndex]][i]}`;
    // eslint-disable-next-line no-await-in-loop
    stringList.push(...await permutateString(phoneNumber, numbers, length, numberIndex + 1, stringCopy, words, foundWords));
  }
  return stringList;
};

const deduplicateData = (processedChunks) => processedChunks.reduce((accumulator, vanityNumber) => {
  const hasDuplicate = accumulator.find((item) => item.vanityMatch === vanityNumber.vanityMatch);
  if (!hasDuplicate) {
    accumulator.push(vanityNumber);
    return accumulator;
  }
  return accumulator;
}, []);

const sortVanityNumbers = (vanityNumbers) => {
  const compare = (first, second) => {
    if (first.word.length > second.word.length) {
      return -1;
    }
    if (first.word.length === second.word.length) {
      if (first.wordIndex > second.wordIndex) {
        return -1;
      }
    }

    return 1;
  };
  return vanityNumbers.sort(compare);
};

module.exports = { convert };
