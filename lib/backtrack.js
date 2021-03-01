const { getStockTickers } = require("./lambda/stock-ticker-service");
const phoneNumber = "7732725374"
const phoneNumberToTextMap = {
  0: ["0"],
  1: ["1"],
  2: ["ABC"],
  3: ["DEF"],
  4: ["GHI"],
  5: ["JKL"],
  6: ["MNO"],
  7: ["PQRS"],
  8: ["TUV"],
  9: ["WXYZ"]
}

//TODO: look at options for optimization
// https://www.geeksforgeeks.org/find-possible-words-phone-digits/
const convert = async () => {
  const startTime = Date.now();
  console.log("start time", startTime);
  const characters = phoneNumber.split('');
  console.log(characters)
  const mapped = characters.map((char => phoneNumberToTextMap[char]))
  console.log(mapped);
  const startTicker = Date.now();
  console.log("start ticker", startTicker);
  const tickers = await getStockTickers();
  console.log("end ticker", Date.now() - startTicker);

  const results = backtrack(0, "", characters, tickers, [], []);

  const vanityNumbers = results;

  console.log("vanityNumber count", vanityNumbers.length);

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

  const sortedVanityNumbers = vanityNumbers.sort(compare);

  //console.log(sortedVanityNumbers);

  console.log("end time", Date.now() - startTime);
}

const backtrack = (index, currentString, phoneNumber, tickers, foundTickers, result) => {
  if(currentString.length === phoneNumber.length) {
    const tickerMatch = tickers.find(ticker => currentString.includes(ticker.Symbol));
    //const foundTicker = vanityNumbers.find(number => number.ticker.Symbol === tickerMatch.Symbol);
    if(tickerMatch) {
      //console.log("found")
      const hasTickerBeenSeen = foundTickers.find(ticker => ticker.Symbol === tickerMatch.Symbol);
      if(hasTickerBeenSeen) {
        return [];
      }
      foundTickers.push(tickerMatch);
      return result.push({
        vanityNumber: currentString,
        ticker: tickerMatch
      });
    }
  }

  for(let char of phoneNumberToTextMap[phoneNumber[index]]) {
    backtrack(index + 1, currentString + char, result)
  }
}
const permutateString = (numbers, length, numberIndex, string, tickers, foundTickers) => {
  if(length === numberIndex) {
    const tickerMatch = tickers.find(ticker => string.includes(ticker.Symbol));
    //const foundTicker = vanityNumbers.find(number => number.ticker.Symbol === tickerMatch.Symbol);
    if(tickerMatch) {
      //console.log("found")
      const hasTickerBeenSeen = foundTickers.find(ticker => ticker.Symbol === tickerMatch.Symbol);
      if(hasTickerBeenSeen) {
        return [];
      }
      foundTickers.push(tickerMatch);
      return [{
        vanityNumber: string,
        ticker: tickerMatch
      }];
    }
    //console.log("not found")
    return [];
  }

  const stringList = [];

  for(let i = 0; i < phoneNumberToTextMap[numbers[numberIndex]].length; i++) {
    const stringCopy = `${string}${phoneNumberToTextMap[numbers[numberIndex]][i]}`;
    stringList.push(...permutateString(numbers, length, numberIndex + 1, stringCopy, tickers, foundTickers))
  }
  return stringList;
}

convert()