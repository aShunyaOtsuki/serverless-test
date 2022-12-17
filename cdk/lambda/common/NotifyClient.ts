import { SQS, SendMessageCommand } from "@aws-sdk/client-sqs";

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
export const NotifyClient = () => new NotifyMessageSQS();
