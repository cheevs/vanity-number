const {
  Stack, Duration, RemovalPolicy, Aws,
} = require('@aws-cdk/core');
const { Bucket } = require('@aws-cdk/aws-s3');
const { BucketDeployment, Source } = require('@aws-cdk/aws-s3-deployment');
const { Table, AttributeType, BillingMode } = require('@aws-cdk/aws-dynamodb');
const { Asset } = require('@aws-cdk/aws-s3-assets');
const { S3Code, Function, Runtime } = require('@aws-cdk/aws-lambda');
const path = require('path');
const { AwsConnectContactFlow } = require('./aws-connect-contact-flow');
const { VanityNumberWebapp } = require('./webapp');

class VanityNumberStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const asset = new Asset(this, 'LambdaAssets', {
      path: path.join(__dirname, '../build/lambda'),
    });

    const lambdaCode = new S3Code(asset.bucket, asset.s3ObjectKey);

    const vanityNumberTable = new Table(this, 'VanityNumberTable', {
      tableName: 'VanityNumberTable',
      partitionKey: { name: 'callerNumber', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST, // todo: not cost optimized for production
      removalPolicy: RemovalPolicy.DESTROY, // todo: not ideal for production
    });

    const wordsBucket = new Bucket(this, 'WordsBucket', {
      // bucket names are globally unique
      bucketName: `words-bucket-${Aws.ACCOUNT_ID}`,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    const wordsFile = 'words.json';
    // experimental construct
    new BucketDeployment(this, 'WordData', {
      sources: [Source.asset('./lib/lambda/', { exclude: ['**', `!${wordsFile}`] })],
      destinationBucket: wordsBucket,
    });

    // todo: function name
    const vanityGeneratorFunction = new Function(this, 'VanityNumberGenerator', {
      functionName: 'VanityNumberGenerator',
      handler: 'vanity-number-handler.handler',
      runtime: Runtime.NODEJS_12_X,
      code: lambdaCode,
      timeout: Duration.minutes(1),
      // todo: need to figure out optimal memory setting; manual binary search (half splitting alg)
      memorySize: 10240,
      environment: {
        VANITY_NUMBER_TABLE_NAME: vanityNumberTable.tableName,
        WORDS_BUCKET: wordsBucket.bucketName,
        WORDS_FILE: wordsFile,
      },
    });

    wordsBucket.grantRead(vanityGeneratorFunction);
    vanityNumberTable.grantReadWriteData(vanityGeneratorFunction);

    new AwsConnectContactFlow(this, 'VanityNumberContactFlow', {
      vanityGeneratorFunction,
    });

    new VanityNumberWebapp(this, 'VanityNumberWebapp', { lambdaCode, vanityNumberTable });
  }
}

module.exports = { VanityNumberStack };
