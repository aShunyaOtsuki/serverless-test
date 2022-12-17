import { UserTable, UserRecord } from "common/UserTable";

const testRecord = (record: UserRecord) => {
  return (
    record.id === "test-id" &&
    record.isNotifyAlert === true &&
    record.mailAddress === "test-mailAddress"
  );
};

export const handler = async () => {
  const userTable = UserTable();
  const record = await userTable.getItem("test-id");
  const isSuccess = testRecord(record);
  return isSuccess ? "Success" : "Failure";
};
