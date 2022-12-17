import { APIGatewayProxyEventV2 } from "aws-lambda";
import { IUserTable, UserTable } from "common/UserTable";
import { INotifyClient, NotifyClient } from "common/NotifyClient";

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
