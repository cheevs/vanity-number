const AWS = require("aws-sdk");
const csv = require("csvtojson");
//const test = require("./nasdaq_screener_1614379797039.csv");


const getStockTickers = async () => {
  const s3 = new AWS.S3();
  const params = {
    Bucket: process.env.STOCK_EXCHANGE_BUCKET,
    Key: process.env.STOCK_EXCHANGE_FILE
  };
  const stream = s3.getObject(params).createReadStream();
  return csv().fromStream(stream);
}

module.exports = { getStockTickers };