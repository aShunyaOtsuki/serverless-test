import { DynamoDB, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

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
export const UserTable = (): IUserTable => new UserDynamoDBTable();
