import { APIGatewayProxyEventV2 } from "aws-lambda";
import { DynamoDB, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const dynamodbClient = new DynamoDB({});
interface IUserTable {
  getItem: (id: string) => Promise<UserRecord>;
}
type UserRecord = {
  id: string;
  mailAddress: string;
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

export const handler = async (event: APIGatewayProxyEventV2) => {
  console.log(event);
  const userTable = UserTable();
  const userRecord = await userTable.getItem("test-id");
  console.log(userRecord);
};
