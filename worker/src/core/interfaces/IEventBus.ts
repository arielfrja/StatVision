import { Message, SubscriptionOptions } from '@google-cloud/pubsub';

export interface IEventBus {
    publish(topic: string, message: any): Promise<void>;
    subscribe(subscriptionName: string, handler: (data: any, originalMessage: Message) => Promise<void>, options?: SubscriptionOptions): Promise<void>;
}
