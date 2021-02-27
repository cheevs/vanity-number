const { expect, matchTemplate, MatchStyle } = require('@aws-cdk/assert');
const cdk = require('@aws-cdk/core');
const VanityNumber = require('../lib/vanity-number-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new VanityNumber.VanityNumberStack(app, 'MyTestStack');
    // THEN
    expect(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
