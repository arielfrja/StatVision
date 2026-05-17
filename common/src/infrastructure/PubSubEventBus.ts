import { PubSub, Message, SubscriptionOptions } from '@google-cloud/pubsub';
import { IEventBus } from '../core/interfaces/IEventBus';
import { ILogger } from '../core/interfaces/ILogger';

/**
 * An implementation of IEventBus using Google Cloud Pub/Sub.
 * Supports running against the local emulator if PUBSUB_EMULATOR_HOST is set.
 */
export class PubSubEventBus implements IEventBus {
    private pubSubClient: PubSub;
    private logger?: ILogger;

    constructor(logger?: ILogger, projectId?: string) {
        this.pubSubClient = new PubSub({ 
            projectId: projectId || process.env.GCP_PROJECT_ID || 'statvision-local' 
        });
        this.logger = logger;
    }

    private logInfo(message: string, ...meta: any[]): void {
        if (this.logger) {
            this.logger.info(message, ...meta);
        } else {
            console.log(message, ...meta);
        }
    }

    private logError(message: string, ...meta: any[]): void {
        if (this.logger) {
            this.logger.error(message, ...meta);
        } else {
            console.error(message, ...meta);
        }
    }

    async publish(topicName: string, message: any): Promise<void> {
        const dataBuffer = Buffer.from(JSON.stringify(message));
        try {
            const messageId = await this.pubSubClient.topic(topicName).publishMessage({ data: dataBuffer });
            this.logInfo(`[PubSubEventBus] Published message ${messageId} to topic ${topicName}`);
        } catch (error) {
            this.logError(`[PubSubEventBus] Error publishing to topic ${topicName}:`, error);
            throw error;
        }
    }

    async subscribe(subscriptionName: string, handler: (message: any, originalMessage: Message) => Promise<void>, options?: SubscriptionOptions): Promise<void> {
        const subscription = this.pubSubClient.subscription(subscriptionName, options);

        subscription.on('message', async (message: Message) => {
            try {
                const parsedData = JSON.parse(message.data.toString());
                await handler(parsedData, message);
            } catch (error) {
                this.logError(`[PubSubEventBus] Error handling message ${message.id} from subscription ${subscriptionName}:`, error);
            }
        });

        subscription.on('error', (error) => {
            this.logError(`[PubSubEventBus] Subscription ${subscriptionName} error:`, error);
        });

        this.logInfo(`[PubSubEventBus] Subscribed to ${subscriptionName}`);
    }
}
