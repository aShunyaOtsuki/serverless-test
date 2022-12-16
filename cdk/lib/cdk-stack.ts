import * as cdk from "aws-cdk-lib";
import { CfnOutput } from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export class CdkStack extends cdk.Stack {
  // テスト対象の機能
  alertLambda: lambda.Function;
  alertApi: lambda.FunctionUrl;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.alertLambda = new lambda.Function(this, "alertLambda", {
      code: lambda.Code.fromAsset("lambda/alert"),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_16_X,
    });
    this.alertApi = this.alertLambda.addFunctionUrl();
    new CfnOutput(this, "alertUrl", {
      value: this.alertApi.url,
    });
  }
}
