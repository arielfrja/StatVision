import { PubSub, Message, SubscriptionOptions } from '@google-cloud/pubsub';
import { IEventBus } from '../../core/interfaces/IEventBus';
import logger from '../../config/logger';

export class PubSubEventBus implements IEventBus {
    private pubSubClient: PubSub;

    constructor(projectId?: string) {
        this.pubSubClient = new PubSub({ projectId: projectId || process.env.GCP_PROJECT_ID });
    }

    async publish(topicName: string, message: any): Promise<void> {
        const dataBuffer = Buffer.from(JSON.stringify(message));
        try {
            const messageId = await this.pubSubClient.topic(topicName).publishMessage({ data: dataBuffer });
            logger.info(`[PubSubEventBus] Published message ${messageId} to topic ${topicName}`);
        } catch (error) {
            logger.error(`[PubSubEventBus] Error publishing to topic ${topicName}:`, error);
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
                logger.error(`[PubSubEventBus] Error handling message ${message.id} from subscription ${subscriptionName}:`, error);
                // We don't nack automatically here, let the handler decide via originalMessage if needed
                // But for safety in our current architecture, if it's a parsing error, we should probably ack or let it expire.
            }
        });

        subscription.on('error', (error) => {
            logger.error(`[PubSubEventBus] Subscription ${subscriptionName} error:`, error);
        });

        logger.info(`[PubSubEventBus] Subscribed to ${subscriptionName}`);
    }
}
