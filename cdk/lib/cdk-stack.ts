import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class CdkStack extends cdk.Stack {
  // DB
  userTable: dynamodb.Table;
  mailHistoryTable: dynamodb.Table;
  // テスト対象の機能
  alertLambda: lambda.Function;
  alertLambdaUrl: lambda.FunctionUrl;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.userTable = new dynamodb.Table(this, "userTable", {
      tableName: "user",
      partitionKey: {
        name: "userId",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });
    this.mailHistoryTable = new dynamodb.Table(this, "mailHistoryTable", {
      tableName: "mailHistory",
      partitionKey: {
        name: "mailAddress",
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
    this.alertLambdaUrl = this.alertLambda.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE, // FIXME: 簡易的に設定している。
    });
    new cdk.CfnOutput(this, "alertUrlOutput", {
      value: this.alertLambdaUrl.url,
    });
  }
}
