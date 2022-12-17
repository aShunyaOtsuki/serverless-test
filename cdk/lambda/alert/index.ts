import { APIGatewayProxyEventV2 } from "aws-lambda";
import { DynamoDB, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { SQS, SendMessageCommand } from "@aws-sdk/client-sqs";

const dynamodbClient = new DynamoDB({});
export interface IUserTable {
  getItem: (id: string) => Promise<UserRecord>;
}
type UserRecord = {
  id: string;
  mailAddress: string;
  isNotifyAlert: boolean;
};

class UserDynamoDBTable implements IUserTable {
  async getItem(id: string) {
    const getItemCommand = new GetItemCommand({
      TableName: process.env.USER_DYNAMO_DB_TABLE_NAMES,
      Key: marshall({ id }),
    });
    const record = await dynamodbClient.send(getItemCommand);
    if (record.Item == null) {
      throw new Error("no-item");
    }
    return unmarshall(record.Item) as UserRecord;
  }
}
const UserTable = (): IUserTable => new UserDynamoDBTable();

const sqsClient = new SQS({});
export interface INotifyClient {
  notifyMessage: (message: NotifyMessage) => Promise<void>;
}
export type NotifyMessage = {
  mailAddress: string;
  content: string;
};

class NotifyMessageSQS implements INotifyClient {
  async notifyMessage(message: NotifyMessage) {
    const sendMessageCommand = new SendMessageCommand({
      QueueUrl: process.env.QUEUE_URL,
      MessageBody: JSON.stringify(message),
    });
    await sqsClient.send(sendMessageCommand);
    return;
  }
}
const NotifyClient = () => new NotifyMessageSQS();

export const main = async (
  userId: string,
  client: { userTable: IUserTable; notifyClient: INotifyClient }
): Promise<void> => {
  const { userTable, notifyClient } = client;

  // NOTE: レコードのフラグによって、特定の機能を実行する。今回のアプリケーションの主な機能。
  const userRecord = await userTable.getItem(userId);
  if (userRecord.isNotifyAlert) {
    await notifyClient.notifyMessage({
      mailAddress: userRecord.mailAddress,
      content: "alert",
    });
  }
};

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<string> => {
  console.log(event);
  try {
    const userTable = UserTable();
    const notifyClient = NotifyClient();

    const userId = event.rawPath.replace("/", "");
    await main(userId, { userTable, notifyClient });
    return "SUCCESS";
  } catch (e) {
    console.error(e);
    return "ERROR";
  }
};
