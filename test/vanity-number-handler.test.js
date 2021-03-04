const { handler } = require('../lib/lambda/vanity-number-handler');
const { convert } = require('../lib/lambda/vanity-number-converter');

jest.mock('../lib/lambda/vanity-number-converter');

test('should return a voice formated vanity numbers', async () => {
  // .Details.ContactData.CustomerEndpoint.Address
  convert.mockResolvedValue([{
    callerNumber: '7732725374', partialNumberMatch: '7732', vanityMatch: 'psec', vanityNumber: 'psec-725374', word: 'psec',
  }, {
    callerNumber: '7732725374', partialNumberMatch: '7732', vanityMatch: 'spec', vanityNumber: 'spec-725374', word: 'spec',
  }, {
    callerNumber: '7732725374', partialNumberMatch: '773', vanityMatch: 'ppd', vanityNumber: 'ppd-2725374', word: 'ppd',
  }, {
    callerNumber: '7732725374', partialNumberMatch: '327', vanityMatch: 'dap', vanityNumber: '77-dap-25374', word: 'dap',
  }]);

  const result = await handler({
    Details: {
      ContactData: {
        CustomerEndpoint: {
          Address: '7732725374',
        },
      },
    },
  });

  expect(result).toStrictEqual({ body: '"The vanity number results are: A match was found for the word psec creating the vanity number p s e c - 7 2 5 3 7 4, A match was found for the word spec creating the vanity number s p e c - 7 2 5 3 7 4, A match was found for the word ppd creating the vanity number p p d - 2 7 2 5 3 7 4"', statusCode: 200 });
});
