const { convert } = require('./vanity-number-converter');

exports.handler = async (event) => {
  console.log(JSON.stringify(event));
  // todo: validate only phone calls
  const phoneNumber = event.Details.ContactData.CustomerEndpoint.Address;
  console.log('phone number', phoneNumber);
  const result = await convert(phoneNumber);
  const voiceFormatted = result
    .slice(0, 3)
    .map((x) => {
      const phoneNumberSplit = x.vanityNumber.split('').join(' ');
      return `A match was found for the word ${x.word} creating the vanity number ${phoneNumberSplit}`;
    });
  // TODO: handle if there are no matches
  const response = {
    statusCode: 200,
    body: JSON.stringify(`The vanity number results are: ${voiceFormatted.join(', ')}`),
  };
  return response;
};
