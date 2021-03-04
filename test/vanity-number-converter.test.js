/*
7732725374	psec	psec-725374
7732725374	spec	spec-725374
7732725374	clep	77327-clep-4
7732725374	dap	77-dap-25374
7732725374	ppd	ppd-2725374
 */
const { convert } = require('../lib/lambda/vanity-number-converter');
const { saveVanityNumber } = require('../lib/lambda/vanity-number-data');
const { getListOfWords } = require('../lib/lambda/dictionary');

jest.mock('../lib/lambda/vanity-number-data');
jest.mock('../lib/lambda/dictionary');

test('should return the generated vanity words', async () => {
  getListOfWords.mockResolvedValue([
    'never',
    'gonna',
    'give',
    'you',
    'up',
    'never',
    'gonna',
    'let',
    'you',
    'down',
    'never',
    'gonna',
    'run',
    'around',
    'and',
    'desert',
    'you',
    'ppd',
    'dap',
    'psec',
    'spec',
  ]);

  saveVanityNumber.mockResolvedValue('success');
  const result = await convert('+17732725374');
  return expect(result).toStrictEqual([{
    callerNumber: '7732725374', partialNumberMatch: '7732', vanityMatch: 'psec', vanityNumber: 'psec-725374', word: 'psec',
  }, {
    callerNumber: '7732725374', partialNumberMatch: '7732', vanityMatch: 'spec', vanityNumber: 'spec-725374', word: 'spec',
  }, {
    callerNumber: '7732725374', partialNumberMatch: '773', vanityMatch: 'ppd', vanityNumber: 'ppd-2725374', word: 'ppd',
  }, {
    callerNumber: '7732725374', partialNumberMatch: '327', vanityMatch: 'dap', vanityNumber: '77-dap-25374', word: 'dap',
  }]);
});
