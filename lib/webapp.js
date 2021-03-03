const {
  Construct, Aws, Fn, Duration, CfnOutput,
} = require('@aws-cdk/core');
const { Bucket } = require('@aws-cdk/aws-s3');

const { BucketDeployment, Source } = require('@aws-cdk/aws-s3-deployment');
const {
  OriginAccessIdentity, CloudFrontWebDistribution, CloudFrontAllowedMethods, CloudFrontAllowedCachedMethods,
} = require('@aws-cdk/aws-cloudfront');
const { RestApi, EndpointType, LambdaIntegration } = require('@aws-cdk/aws-apigateway');
const { Function, Runtime, InlineCode } = require('@aws-cdk/aws-lambda');
const path = require('path');

class VanityNumberWebapp extends Construct {
  constructor(scope, id, props) {
    super(scope, id);

    const getVanityNumbers = new Function(this, 'GetVanityNumbers', {
      functionName: 'GetVanityNumber',
      handler: 'index.handler',
      runtime: Runtime.NODEJS_12_X,
      code: new InlineCode(`
      const AWS = require("aws-sdk");
      exports.handler = async (event) => {
          var dynamoClient = new AWS.DynamoDB.DocumentClient();
        var params = {
          TableName: "${props.vanityNumberTable.tableName}", 
          Select: "ALL_ATTRIBUTES"
        };
      
        const result = await dynamoClient.scan(params).promise();
        
        const response = {
            statusCode: 200,
            body: JSON.stringify(result.Items),
        };
        return response;
      };`),
      timeout: Duration.minutes(1),
    });

    props.vanityNumberTable.grantReadData(getVanityNumbers);

    const vanityNumberApi = new RestApi(this, 'VanityNumberApi', {
      restApiName: 'VanityNumberApi',
      endpointConfiguration: {
        types: [EndpointType.REGIONAL],
      },
      deployOptions: {
        stageName: 'v1',
      },
    });

    vanityNumberApi.root
      .addResource('vanityNumbers')
      .addMethod('GET', new LambdaIntegration(getVanityNumbers));

    const s3BucketSource = new Bucket(this, 'VanityNumberStaticContent', {
      bucketName: `${Aws.ACCOUNT_ID}-vanity-number-webapp`,
    });

    // Create an origin ID that the S3 bucket can authorize for access to the bucket
    const originAccessIdentity = new OriginAccessIdentity(this, 'OriginAccessIdentity', {
      comment: `Id used for accessing bucket: ${s3BucketSource.bucketName}`,
    });

    // Grant CloudFront Origin ID access to the bucket
    s3BucketSource.grantRead(originAccessIdentity);

    const distribution = new CloudFrontWebDistribution(this, 'VanityNumberCloudFront', {
      defaultRootObject: 'index.html',
      originConfigs: [
        // APIGW for API
        {
          customOriginSource: {
            domainName: Fn.select(2, Fn.split('/', vanityNumberApi.url)),
            originKeepaliveTimeout: Duration.seconds(30),
          },
          behaviors: [
            {
              allowedMethods: CloudFrontAllowedMethods.ALL,
              cachedMethods: CloudFrontAllowedCachedMethods.GET_HEAD_OPTIONS,
              pathPattern: `/${vanityNumberApi.deploymentStage.stageName}/*`,
              forwardedValues: {
                queryString: true,
                headers: ['Accept', 'Referer', 'Authorization', 'Content-Type', 'Charset'],
              },
            },
          ],
        },
        // S3 for static content
        {
          s3OriginSource: { s3BucketSource, originAccessIdentity },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
    });

    new BucketDeployment(this, 'UiDeployment', {
      sources: [Source.asset(path.join(__dirname, '../build'))],
      destinationBucket: s3BucketSource,
      distribution,
    });

    new CfnOutput(this, 'VanityWebAppUrl', {
      exportName: 'VanityWebAppUrl',
      value: `https://${distribution.distributionDomainName}`,
    }).overrideLogicalId('VanityWebAppUrl'); // overriding to use in documentation
  }
}

module.exports = { VanityNumberWebapp };
