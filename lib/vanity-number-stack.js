const { Stack, Construct, StackProps, Duration, RemovalPolicy} = require('@aws-cdk/core');
const { NodejsFunction } = require("@aws-cdk/aws-lambda-nodejs");
const { Bucket } = require("@aws-cdk/aws-s3");
const { BucketDeployment, Source } = require("@aws-cdk/aws-s3-deployment");
const { Table, AttributeType, BillingMode,  } = require("@aws-cdk/aws-dynamodb");
const { AwsConnectContactFlow } = require("./aws-connect-contact-flow");
const path = require("path");

class VanityNumberStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const vanityNumberTable = new Table(this, 'VanityNumberTable', {
      partitionKey: { name: 'callerNumber', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST, //todo: not cost optimized for production
      removalPolicy: RemovalPolicy.DESTROY //todo: not ideal for production
    });

    //not optimized for production
    const newYorkStockExchangeData = new Bucket(this, "NewYorkStockExchangeData", {
      bucketName: "new-york-stock-exchange-data",
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const stockExchangeFile = "nasdaq_screener_1614379797039.csv";
    //experimental construct
    new BucketDeployment(this, 'DeployStockExchangeData', {
      sources: [Source.asset('./lib/lambda/', { exclude: ['**', `!${stockExchangeFile}`] })],
      destinationBucket: newYorkStockExchangeData,
    });

    //todo: add to docs: NodeJsFunction is experimental therefore should be avoided for production.
    // NodeJsFunction provides a higher level construct to handle all the dependencies and bundling
    // The code that defines your stack goes here
    //todo: function name
    const vanityGeneratorFunction = new NodejsFunction(this, 'VanityNumberGenerator', {
      entry: `${__dirname}/lambda/vanity-number-handler.js`,
      timeout: Duration.minutes(1),
      //todo: need to figure out optimal memory setting; manual binary search (half splitting alg)
      memorySize: 10240,
      environment: {
        STOCK_EXCHANGE_FILE: stockExchangeFile,
        STOCK_EXCHANGE_BUCKET: newYorkStockExchangeData.bucketName,
        VANITY_NUMBER_TABLE_NAME: vanityNumberTable.tableName
      }
      //handler: 'vanity-number-handler.handler',
      //code: Code.fromAsset(path.join(__dirname, 'lambda')),
    });

    newYorkStockExchangeData.grantRead(vanityGeneratorFunction);
    vanityNumberTable.grantReadWriteData(vanityGeneratorFunction);

    new AwsConnectContactFlow(this, "VanityNumberContactFlow", {
      vanityGeneratorFunction
    })
  }
}

module.exports = { VanityNumberStack }
