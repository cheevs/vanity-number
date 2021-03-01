const { Construct, CfnParameter } = require("@aws-cdk/core");
const { AwsCustomResource, AwsCustomResourcePolicy } = require("@aws-cdk/custom-resources");
const { PolicyStatement, Effect } = require("@aws-cdk/aws-iam");

class AwsConnectContactFlow extends Construct {
  constructor(scope, id, props) {
    super(scope, id);

    const awsConnectInstanceId = new CfnParameter(this, "AwsConnectInstanceId", {
      type: "String",
      description: "The AWS Connect instance identifier that will be used to deploy the vanity number generator contact flow."
    });

    //overriding logical id for simplicity since this cloudformation parameter will be consumer facing
    awsConnectInstanceId.overrideLogicalId("AwsConnectInstanceId");

    new AwsConnectLambda(this, "AwsConnectVanityNumberLambda", {
      functionArn: props.vanityGeneratorFunction.functionArn,
      awsConnectInstanceArn: awsConnectInstanceId.valueAsString
    })
  }
}

class AwsConnectLambda extends AwsCustomResource {
  constructor(scope, id, props) {
    super(scope, id, {
      resourceType: "Custom::AwsConnectLambda",
      policy: AwsCustomResourcePolicy.fromStatements([
        /*new PolicyStatement({
          actions: [
            "connect:associateLambdaFunction",
            "connect:disassociateLambdaFunction"
          ],
          resources: [ props.awsConnectInstanceArn]
        })*/
        //todo: never do this in production; need to dig into the CloudTrail logs to check which api calls were failing
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            "*"
          ],
          resources: ["*"]
        })
      ]),
      onCreate: {
        physicalResourceId: props.awsConnectInstanceArn,
        service: "Connect",
        action: "associateLambdaFunction",
        parameters: {
          FunctionArn: props.functionArn,
          InstanceId: props.awsConnectInstanceArn
        }
      }
      //todo: update? probably not since not supported by the aws connect api
      //todo: add the onDelete with the disassociate api
    });
  }
}

module.exports = { AwsConnectContactFlow };
