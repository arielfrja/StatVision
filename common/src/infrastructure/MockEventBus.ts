import { Message, SubscriptionOptions } from '@google-cloud/pubsub';
import { IEventBus } from '../core/interfaces/IEventBus';
import { ILogger } from '../core/interfaces/ILogger';

export class MockEventBus implements IEventBus {
    private handlers: Map<string, ((data: any, originalMessage: Message) => Promise<void>)[]> = new Map();

    constructor(private logger?: ILogger) {
        if (this.logger) {
            this.logger.info('[MockEventBus] Initialized');
        }
    }

    async publish(topic: string, message: any): Promise<void> {
        if (this.logger) {
            this.logger.info(`[MockEventBus] Publishing to ${topic}: `, message);
        }
        
        // In a real mock we might want to trigger handlers, 
        // but for now we just log to avoid ECONNREFUSED.
    }

    async subscribe(subscriptionName: string, handler: (data: any, originalMessage: Message) => Promise<void>, options?: SubscriptionOptions): Promise<void> {
        if (this.logger) {
            this.logger.info(`[MockEventBus] Subscribed to ${subscriptionName}`);
        }
        
        if (!this.handlers.has(subscriptionName)) {
            this.handlers.set(subscriptionName, []);
        }
        this.handlers.get(subscriptionName)?.push(handler);
    }
}
