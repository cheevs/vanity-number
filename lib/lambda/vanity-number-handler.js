const { convert } = require("./vanity-number-converter");

exports.handler = async (event) => {
  console.log(JSON.stringify(event));
  const phoneNumber = event.Details.ContactData.CustomerEndpoint.Address;
  console.log("phone number", phoneNumber);
  const result = await convert(phoneNumber);
  // TODO implement
  const response = {
    statusCode: 200,
    body: JSON.stringify(`Hello from Lambda! ${result.slice(0,3).map(x => x.vanityNumber.split('').join(" ")).join(", ")}`),
  };
  return response;
};