const { Construct, CfnParameter } = require('@aws-cdk/core');
const {
  AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId, PhysicalResourceIdReference,
} = require('@aws-cdk/custom-resources');
const { PolicyStatement, Effect } = require('@aws-cdk/aws-iam');

class AwsConnectContactFlow extends Construct {
  constructor(scope, id, props) {
    super(scope, id);

    // todo: test how this will work with another account
    const awsConnectInstanceId = new CfnParameter(this, 'AwsConnectInstanceId', {
      type: 'String',
      description: 'The AWS Connect instance identifier that will be used to deploy the vanity number generator contact flow.',
    });

    // overriding logical id for simplicity since this cloudformation parameter will be consumer facing
    awsConnectInstanceId.overrideLogicalId('AwsConnectInstanceId');

    new AwsConnectLambda(this, 'AwsConnectVanityNumberLambda', {
      functionArn: props.vanityGeneratorFunction.functionArn,
      awsConnectInstanceArn: awsConnectInstanceId.valueAsString,
    });

    const vanityNumberContactFlowContent = {
      Version: '2019-10-30',
      StartAction: '48b4027f-feec-4633-b4a2-997b9673657a',
      Metadata: {
        entryPointPosition: { x: 33, y: 78 },
        snapToGrid: false,
        ActionMetadata: {
          'd1529f08-3441-413a-b02c-edd95d57655a': { position: { x: 715, y: 90 }, useDynamic: false, ContactFlow: { id: 'arn:aws:connect:us-east-1:686151311692:instance/283d6dde-ab63-4385-adca-a167f089d751/contact-flow/959f07f9-f366-4f8c-a775-fd1b4b70469a', text: 'Sample Lambda integration' } }, '8e2911fe-a1cd-421b-92bb-7b605ec7c072': { position: { x: 1420, y: 130 } }, '0e8fa08e-d71d-4080-89eb-bd6e01a2565f': { position: { x: 1097, y: 326 }, useDynamic: false }, 'b79c4e7a-550c-43d2-b33b-68097d5eb006': { position: { x: 1087, y: 554 }, useDynamic: false }, '48b4027f-feec-4633-b4a2-997b9673657a': { position: { x: 351, y: 108 }, useDynamic: false }, '081c44f7-e755-4f8e-bef7-b36f17653f43': { position: { x: 708, y: 334 }, dynamicMetadata: {}, useDynamic: false },
        },
      },
      Actions: [{
        Identifier: 'd1529f08-3441-413a-b02c-edd95d57655a', Parameters: { ContactFlowId: 'arn:aws:connect:us-east-1:686151311692:instance/283d6dde-ab63-4385-adca-a167f089d751/contact-flow/959f07f9-f366-4f8c-a775-fd1b4b70469a' }, Transitions: { NextAction: '8e2911fe-a1cd-421b-92bb-7b605ec7c072', Errors: [{ NextAction: '8e2911fe-a1cd-421b-92bb-7b605ec7c072', ErrorType: 'NoMatchingError' }], Conditions: [] }, Type: 'TransferToFlow',
      }, {
        Identifier: '8e2911fe-a1cd-421b-92bb-7b605ec7c072', Type: 'DisconnectParticipant', Parameters: {}, Transitions: {},
      }, {
        Identifier: '0e8fa08e-d71d-4080-89eb-bd6e01a2565f', Parameters: { Text: 'lambda was invoke successfully. with response $.External.body' }, Transitions: { NextAction: '8e2911fe-a1cd-421b-92bb-7b605ec7c072', Errors: [], Conditions: [] }, Type: 'MessageParticipant',
      }, {
        Identifier: 'b79c4e7a-550c-43d2-b33b-68097d5eb006', Parameters: { Text: 'The lambda invocation failed' }, Transitions: { NextAction: '8e2911fe-a1cd-421b-92bb-7b605ec7c072', Errors: [], Conditions: [] }, Type: 'MessageParticipant',
      }, {
        Identifier: '48b4027f-feec-4633-b4a2-997b9673657a', Parameters: { Text: 'Testing Update 2' }, Transitions: { NextAction: '081c44f7-e755-4f8e-bef7-b36f17653f43', Errors: [], Conditions: [] }, Type: 'MessageParticipant',
      }, {
        Identifier: '081c44f7-e755-4f8e-bef7-b36f17653f43', Parameters: { LambdaFunctionARN: 'arn:aws:lambda:us-east-1:686151311692:function:VanityNumberStack-VanityNumberGenerator99656640-1D6KJPYKJ97EJ', InvocationTimeLimitSeconds: '8' }, Transitions: { NextAction: '0e8fa08e-d71d-4080-89eb-bd6e01a2565f', Errors: [{ NextAction: 'b79c4e7a-550c-43d2-b33b-68097d5eb006', ErrorType: 'NoMatchingError' }], Conditions: [] }, Type: 'InvokeLambdaFunction',
      }],
    };

    new AwsCustomResource(this, 'VanityContactFlow5', {
      resourceType: 'Custom::AwsConnectContactFlow',
      policy: AwsCustomResourcePolicy.fromStatements([
        // todo: never do this in production; need to dig into the CloudTrail logs to check which api calls were failing
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            '*',
          ],
          resources: ['*'],
        }),
      ]),
      onCreate: {
        physicalResourceId: PhysicalResourceId.fromResponse('ContactFlowId'),
        service: 'Connect',
        action: 'createContactFlow',
        parameters: {
          InstanceId: awsConnectInstanceId.valueAsString,
          Name: 'TestingFromCDK5',
          Type: 'CONTACT_FLOW',
          Description: 'Testing create from aws cdk',
          Content: JSON.stringify(vanityNumberContactFlowContent),
        },
      },
      onUpdate: {
        physicalResourceId: new PhysicalResourceIdReference().toJSON().toString(),
        service: 'Connect',
        action: 'updateContactFlowContent',
        parameters: {
          ContactFlowId: new PhysicalResourceIdReference().toJSON().toString(),
          InstanceId: awsConnectInstanceId.valueAsString,
          Content: JSON.stringify(vanityNumberContactFlowContent),
        },
      },
      // delete is not supported for contact flows https://docs.aws.amazon.com/connect/latest/adminguide/create-contact-flow.html
    });
  }
}

class AwsConnectLambda extends AwsCustomResource {
  constructor(scope, id, props) {
    super(scope, id, {
      resourceType: 'Custom::AwsConnectLambda',
      policy: AwsCustomResourcePolicy.fromStatements([
        /* new PolicyStatement({
          actions: [
            "connect:associateLambdaFunction",
            "connect:disassociateLambdaFunction"
          ],
          resources: [ props.awsConnectInstanceArn]
        }) */
        // todo: never do this in production; need to dig into the CloudTrail logs to check which api calls were failing
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            '*',
          ],
          resources: ['*'],
        }),
      ]),
      onCreate: {
        physicalResourceId: props.awsConnectInstanceArn,
        service: 'Connect',
        action: 'associateLambdaFunction',
        parameters: {
          FunctionArn: props.functionArn,
          InstanceId: props.awsConnectInstanceArn,
        },
      },
      // todo: update? probably not since not supported by the aws connect api
      // todo: add the onDelete with the disassociate api
    });
  }
}

module.exports = { AwsConnectContactFlow };
