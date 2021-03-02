const { getStockTickers } = require('./stock-ticker-service');
const { saveVanityNumber } = require('./vanity-number-data');

const phoneNumberToTextMap = {
  0: ['0'],
  1: ['1'],
  2: ['A', 'B', 'C'],
  3: ['D', 'E', 'F'],
  4: ['G', 'H', 'I'],
  5: ['J', 'K', 'L'],
  6: ['M', 'N', 'O'],
  7: ['P', 'Q', 'R', 'S'],
  8: ['T', 'U', 'V'],
  9: ['W', 'X', 'Y', 'Z'],
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
  return sortedVanityNumbers;
};

const createVanityNumbers = async (phoneNumber) => {
  const phoneSubstring = phoneNumber.substring(phoneNumber.length - 10, phoneNumber.length);
  const characters = phoneSubstring.split('');
  const tickers = await getStockTickers();

  const chunkedData = getChunkedData(characters);

  const processedChunks = await processChunks(chunkedData, phoneSubstring, tickers);

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
const processChunks = async (chunks, phoneSubstring, tickers) => {
  const promises = chunks.map(async (chunk) => permutateString(phoneSubstring, chunk, chunk.length, 0, '', tickers, []));

  return (await Promise.all(promises)).flat();
};

// todo: simplify this method
const permutateString = async (phoneNumber, numbers, length, numberIndex, string, tickers, foundTickers) => {
  if (length === numberIndex) {
    const tickerMatch = tickers.find((ticker) => string.includes(ticker.Symbol));
    // const foundTicker = vanityNumbers.find(number => number.ticker.Symbol === tickerMatch.Symbol);
    if (tickerMatch) {
      const hasTickerBeenSeen = foundTickers.find((ticker) => ticker.Symbol === tickerMatch.Symbol);
      if (hasTickerBeenSeen) {
        return [];
      }
      foundTickers.push(tickerMatch);
      const partialNumberMatch = numbers
        .slice(string.indexOf(tickerMatch.Symbol), tickerMatch.Symbol.length)
        .reduce((accumulator, item) => (accumulator + item), '');
      return [{
        callerNumber: phoneNumber,
        vanityMatch: tickerMatch.Symbol,
        // todo: handle leading dash; ternary for the start of the string??
        vanityNumber: phoneNumber.replace(partialNumberMatch, `-${tickerMatch.Symbol}-`),
        ticker: tickerMatch,
      }];
    }
    return [];
  }

  const stringList = [];

  for (let i = 0; i < phoneNumberToTextMap[numbers[numberIndex]].length; i++) {
    const stringCopy = `${string}${phoneNumberToTextMap[numbers[numberIndex]][i]}`;
    // eslint-disable-next-line no-await-in-loop
    stringList.push(...await permutateString(phoneNumber, numbers, length, numberIndex + 1, stringCopy, tickers, foundTickers));
  }
  return stringList;
};

const deduplicateData = (processedChunks) => processedChunks.reduce((accumulator, vanityNumber) => {
  const hasDuplicate = accumulator.find((item) => item.ticker.Symbol === vanityNumber.ticker.Symbol);
  if (!hasDuplicate) {
    accumulator.push(vanityNumber);
    return accumulator;
  }
  return accumulator;
}, []);

const sortVanityNumbers = (vanityNumbers) => {
  const compare = (first, second) => {
    if (first.ticker.Symbol.length > second.ticker.Symbol.length) {
      return -1;
    }
    if (first.ticker.Symbol.length === second.ticker.Symbol.length) {
      if (parseFloat(first.ticker['Market Cap']) > parseFloat(second.ticker['Market Cap'])) {
        return -1;
      }
    }
    return 1;
  };
  return vanityNumbers.sort(compare);
};

module.exports = { convert };
