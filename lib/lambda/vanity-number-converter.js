const { getStockTickers } = require("./stock-ticker-service");
const { saveVanityNumber } = require("./vanity-number-data");
//const phoneNumber = "+17732725374"
const phoneNumberToTextMap = {
  0: ["0"],
  1: ["1"],
  2: ["A", "B", "C"],
  3: ["D", "E", "F"],
  4: ["G", "H", "I"],
  5: ["J", "K", "L"],
  6: ["M", "N", "O"],
  7: ["P", "Q", "R", "S"],
  8: ["T", "U", "V"],
  9: ["W", "X", "Y", "Z"]
}

//TODO: look at options for optimization
// https://www.geeksforgeeks.org/find-possible-words-phone-digits/
//todo: rename convertPhoneNumberToVanity or something better
const convert = async (phoneNumber) => {
  const startTime = Date.now();
  console.log("start time", startTime);
  console.log("phone number convert", phoneNumber)
  //take last 10 of the phone number
  const phoneSubstring = phoneNumber.substring(phoneNumber.length - 10, phoneNumber.length);
  const characters = phoneSubstring.split('');
  console.log(characters);
  const startTicker = Date.now();
  console.log("start ticker", startTicker);
  const tickers = await getStockTickers();
  console.log("end ticker", Date.now() - startTicker);

  const startPermutate = Date.now();
  console.log("start permutate", startPermutate);
  const chunkResult = [];
  for(let i = 0; i < characters.length - 4; i++) {
    chunkResult.push(characters.slice(i, i + 5))
  }
  console.log(chunkResult);

  //process chunks asynchronously
  const promises = chunkResult.map(async (chunk) => permutateString(phoneSubstring, chunk, chunk.length, 0, "", tickers, []))

  const flattened = (await Promise.all(promises)).flat();
  const results = flattened.reduce((accumulator, vanityNumber) => {
    const hasDuplicate = accumulator.find(item => item.ticker.Symbol === vanityNumber.ticker.Symbol)
    if(!hasDuplicate) {
      accumulator.push(vanityNumber);
      return accumulator;
    }
    return accumulator;
  }, []);

  //const results = await permutateString(parts, parts.length, 0, "", tickers, []);

  console.log("end permutate", Date.now() - startPermutate);

  const vanityNumbers = results;

  console.log("vanityNumber count", vanityNumbers.length);

  // Sort by the largest stock ticker first, then market cap
  const compare = (first, second) => {
    if(first.ticker.Symbol.length > second.ticker.Symbol.length) {
      return -1;
    }
    if(first.ticker.Symbol.length === second.ticker.Symbol.length) {
      if(parseFloat(first.ticker["Market Cap"]) > parseFloat(second.ticker["Market Cap"])) {
        return -1;
      }
    }
    return 1;
  }

  const startSort = Date.now();
  console.log("start sort", startSort);
  const sortedVanityNumbers = vanityNumbers.sort(compare);
  console.log("end sort", Date.now() - startSort);

  const saveResult = await saveVanityNumber(phoneNumber, sortedVanityNumbers.slice(0, 5));
  console.log(saveResult)

  console.log("end time", Date.now() - startTime);
  return sortedVanityNumbers;
}
const permutateString = async (phoneNumber, numbers, length, numberIndex, string, tickers, foundTickers) => {
  if(length === numberIndex) {
    const tickerMatch = tickers.find(ticker => string.includes(ticker.Symbol));
    //const foundTicker = vanityNumbers.find(number => number.ticker.Symbol === tickerMatch.Symbol);
    if(tickerMatch) {
      const hasTickerBeenSeen = foundTickers.find(ticker => ticker.Symbol === tickerMatch.Symbol);
      if(hasTickerBeenSeen) {
        return [];
      }
      foundTickers.push(tickerMatch);
      const partialNumberMatch = numbers.slice(string.indexOf(tickerMatch.Symbol), tickerMatch.Symbol.length).reduce((accumulator, item) => (accumulator + item), "");
      return [{
        callerNumber: phoneNumber,
        vanityMatch: tickerMatch.Symbol,
        vanityNumber: phoneNumber.replace(partialNumberMatch, `-${tickerMatch.Symbol}-`),
        ticker: tickerMatch,
      }];
    }
    return [];
  }

  const stringList = [];

  for(let i = 0; i < phoneNumberToTextMap[numbers[numberIndex]].length; i++) {
    const stringCopy = `${string}${phoneNumberToTextMap[numbers[numberIndex]][i]}`;
    stringList.push(...await permutateString(phoneNumber, numbers, length, numberIndex + 1, stringCopy, tickers, foundTickers))
  }
  return stringList;
}

module.exports = { convert };