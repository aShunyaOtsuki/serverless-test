import {
  main,
  IUserTable,
  INotifyClient,
  NotifyMessage,
} from "../../../lambda/alert";

const fn = jest.fn();

const dummyUserRecords = [
  { id: "test1", mailAddress: "test1-mailAddress", isAlertNotify: true },
  { id: "test2", mailAddress: "test2-mailAddress", isAlertNotify: false },
];
const dummyUserDB: IUserTable = {
  getItem: async (id: string) => {
    return dummyUserRecords.find((record) => record.id === id)!;
  },
};
const dummyNotify: INotifyClient = {
  notifyMessage: async (message: NotifyMessage) => {
    fn(message);
  },
};

describe("alert api", () => {
  beforeEach(() => {
    fn.mockReset();
  });
  test.each([
    ["test1", 1],
    ["test2", 0],
  ])("norify alert", async (userId, expected) => {
    await main(userId, { userTable: dummyUserDB, notifyClient: dummyNotify });
    expect(fn).toBeCalledTimes(expected);
  });
});
