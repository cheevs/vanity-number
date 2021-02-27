const fs = require('fs')
const neatCsv = require('neat-csv');


const getStockTickers = async () => {
  let csvData = fs.readFileSync('/Users/req89251/SandboxProjects/vanity-number/nasdaq_screener_1614379797039.csv')
  return neatCsv(csvData);
}

module.exports = { getStockTickers };