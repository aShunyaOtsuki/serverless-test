import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaEventSource from "aws-cdk-lib/aws-lambda-event-sources";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";

export class CdkStack extends cdk.Stack {
  // DB
  userTable: dynamodb.Table;
  mailHistoryTable: dynamodb.Table;
  // テスト対象の機能
  notifyQueue: sqs.Queue;
  notifyLambda: lambda.Function;
  alertLambda: lambda.Function;
  alertLambdaUrl: lambda.FunctionUrl;
  // DB接続のテスト
  testDBLambda: lambda.Function;
  testDBLambdaUrl: lambda.FunctionUrl;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.userTable = new dynamodb.Table(this, "userTable", {
      tableName: "user",
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });
    this.mailHistoryTable = new dynamodb.Table(this, "mailHistoryTable", {
      tableName: "mailHistory",
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "sendAt",
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });
    const tableNames = {
      USER_DYNAMO_DB_TABLE_NAMES: this.userTable.tableName,
      MAIL_HISTORY_DYNAMO_DB_TABLE_NAMES: this.mailHistoryTable.tableName,
    };

    this.notifyQueue = new sqs.Queue(this, "notifyQueue");
    // FIXME: notifyLambdaはdummy実装
    this.notifyLambda = new lambda.Function(this, "notifyLambda", {
      functionName: "notify",
      code: lambda.Code.fromAsset("lambda/notify"),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_16_X,
    });
    this.notifyLambda.addEventSource(
      new lambdaEventSource.SqsEventSource(this.notifyQueue)
    );

    const packagesLayer = new lambda.LayerVersion(this, "packagesLayer", {
      layerVersionName: "packages",
      code: lambda.Code.fromAsset("layer"),
      compatibleRuntimes: [lambda.Runtime.NODEJS_16_X],
    });
    this.alertLambda = new lambda.Function(this, "alertLambda", {
      functionName: "alert",
      code: lambda.Code.fromAsset("lambda/alert"),
      handler: "index.handler",
      environment: {
        ...tableNames,
        QUEUE_URL: this.notifyQueue.queueUrl,
      },
      runtime: lambda.Runtime.NODEJS_16_X,
      layers: [packagesLayer],
    });
    this.alertLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["dynamodb:GetItem"],
        resources: [this.userTable.tableArn],
      })
    );
    this.alertLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["sqs:SendMessage"],
        resources: [this.notifyQueue.queueArn],
      })
    );
    this.alertLambdaUrl = this.alertLambda.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE, // FIXME: 簡易的に設定している。
    });
    new cdk.CfnOutput(this, "alertUrlOutput", {
      value: this.alertLambdaUrl.url,
    });

    this.testDBLambda = new lambda.Function(this, "testDBLambda", {
      functionName: "testDB",
      code: lambda.Code.fromAsset("lambda/testHandler"),
      handler: "db.handler",
      environment: {
        ...tableNames,
      },
      runtime: lambda.Runtime.NODEJS_16_X,
      layers: [packagesLayer],
    });
    this.testDBLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["dynamodb:GetItem"],
        resources: [this.userTable.tableArn],
      })
    );
    this.testDBLambdaUrl = this.testDBLambda.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE, // FIXME: 簡易的に設定している。
    });
    new cdk.CfnOutput(this, "testDBLambdaUrlOutput", {
      value: this.testDBLambdaUrl.url,
    });
  }
}
