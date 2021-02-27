#!/usr/bin/env node

const cdk = require('@aws-cdk/core');
const { VanityNumberStack } = require('../lib/vanity-number-stack');

const app = new cdk.App();
new VanityNumberStack(app, 'VanityNumberStack');
