import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class CdkStack extends cdk.Stack {
  // DB
  userDB: dynamodb.Table;
  mailHistoryDB: dynamodb.Table;
  // テスト対象の機能
  alertLambda: lambda.Function;
  alertApi: lambda.FunctionUrl;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.userDB = new dynamodb.Table(this, "userDB", {
      tableName: "userDB",
      partitionKey: {
        name: "userId",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });
    this.mailHistoryDB = new dynamodb.Table(this, "mailHistoryDB", {
      tableName: "mailHistoryDB",
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

    this.alertLambda = new lambda.Function(this, "alertLambda", {
      functionName: "alertLambda",
      code: lambda.Code.fromAsset("lambda/alert"),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_16_X,
    });
    this.alertApi = this.alertLambda.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE, // FIXME: 簡易的に設定している。
    });
    new cdk.CfnOutput(this, "alertUrlOutput", {
      value: this.alertApi.url,
    });
  }
}
