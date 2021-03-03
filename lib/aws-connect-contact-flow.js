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
        entryPointPosition: { x: 15, y: 76 },
        snapToGrid: false,
        ActionMetadata: {
          '0e8fa08e-d71d-4080-89eb-bd6e01a2565f': { position: { x: 869, y: 79 }, useDynamic: false }, '48b4027f-feec-4633-b4a2-997b9673657a': { position: { x: 234, y: 80 }, useDynamic: false }, '8e2911fe-a1cd-421b-92bb-7b605ec7c072': { position: { x: 1808, y: 317 } }, '081c44f7-e755-4f8e-bef7-b36f17653f43': { position: { x: 555, y: 79 }, dynamicMetadata: {}, useDynamic: false }, '85a564a4-eca5-44b9-84a1-cd59555544c1': { position: { x: 1180, y: 81 }, conditionMetadata: [{ id: '2f162193-b35f-4566-8a67-e791920c061a', value: '1' }], useDynamic: false }, 'b79c4e7a-550c-43d2-b33b-68097d5eb006': { position: { x: 866, y: 397 }, useDynamic: false },
        },
      },
      Actions: [{
        Identifier: '0e8fa08e-d71d-4080-89eb-bd6e01a2565f', Parameters: { Text: '$.External.body' }, Transitions: { NextAction: '85a564a4-eca5-44b9-84a1-cd59555544c1', Errors: [], Conditions: [] }, Type: 'MessageParticipant',
      }, {
        Identifier: '48b4027f-feec-4633-b4a2-997b9673657a', Parameters: { Text: 'Greetings! This is the vanity number hotline. This call will use a dictionary to partially match your number to generate a new vanity number' }, Transitions: { NextAction: '081c44f7-e755-4f8e-bef7-b36f17653f43', Errors: [], Conditions: [] }, Type: 'MessageParticipant',
      }, {
        Identifier: '8e2911fe-a1cd-421b-92bb-7b605ec7c072', Type: 'DisconnectParticipant', Parameters: {}, Transitions: {},
      }, {
        Identifier: '081c44f7-e755-4f8e-bef7-b36f17653f43', Parameters: { LambdaFunctionARN: props.vanityGeneratorFunction.functionArn, InvocationTimeLimitSeconds: '8' }, Transitions: { NextAction: '0e8fa08e-d71d-4080-89eb-bd6e01a2565f', Errors: [{ NextAction: 'b79c4e7a-550c-43d2-b33b-68097d5eb006', ErrorType: 'NoMatchingError' }], Conditions: [] }, Type: 'InvokeLambdaFunction',
      }, {
        Identifier: '85a564a4-eca5-44b9-84a1-cd59555544c1', Parameters: { Text: 'Press 1 to hear the results again, otherwise the call has ended.', StoreInput: 'False', InputTimeLimitSeconds: '10' }, Transitions: { NextAction: '0e8fa08e-d71d-4080-89eb-bd6e01a2565f', Errors: [{ NextAction: 'b79c4e7a-550c-43d2-b33b-68097d5eb006', ErrorType: 'NoMatchingError' }, { NextAction: '0e8fa08e-d71d-4080-89eb-bd6e01a2565f', ErrorType: 'NoMatchingCondition' }, { NextAction: '8e2911fe-a1cd-421b-92bb-7b605ec7c072', ErrorType: 'InputTimeLimitExceeded' }], Conditions: [{ NextAction: '0e8fa08e-d71d-4080-89eb-bd6e01a2565f', Condition: { Operator: 'Equals', Operands: ['1'] } }] }, Type: 'GetParticipantInput',
      }, {
        Identifier: 'b79c4e7a-550c-43d2-b33b-68097d5eb006', Parameters: { Text: 'There was an error generating the vanity number' }, Transitions: { NextAction: '8e2911fe-a1cd-421b-92bb-7b605ec7c072', Errors: [], Conditions: [] }, Type: 'MessageParticipant',
      }],
    };

    new AwsCustomResource(this, 'VanityNumberContactFlow', {
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
          Name: 'VanityNumberContactFlow',
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
    });
  }
}

module.exports = { AwsConnectContactFlow };
