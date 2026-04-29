import { EventEmitter } from 'events';
import { IEventBus } from './core/interfaces/IEventBus';

/**
 * A local implementation of IEventBus using Node.js EventEmitter.
 * Useful for local development and testing without GCP Pub/Sub.
 * Uses a singleton pattern to share events between different services in the same process group (if they share the same common instance).
 */
export class LocalEventEmitterBus implements IEventBus {
    private static instance: LocalEventEmitterBus;
    private emitter: EventEmitter;

    private constructor() {
        this.emitter = new EventEmitter();
        // Increase max listeners for many subscriptions
        this.emitter.setMaxListeners(50);
    }

    public static getInstance(): LocalEventEmitterBus {
        if (!LocalEventEmitterBus.instance) {
            LocalEventEmitterBus.instance = new LocalEventEmitterBus();
        }
        return LocalEventEmitterBus.instance;
    }

    async publish(topic: string, message: any): Promise<void> {
        console.log(`[LocalEventBus] Publishing to ${topic}`);
        // Defer emission to simulate async nature of Pub/Sub
        setImmediate(() => {
            this.emitter.emit(topic, message);
        });
    }

    async subscribe(subscriptionName: string, handler: (data: any, originalMessage: any) => Promise<void>, options?: any): Promise<void> {
        console.log(`[LocalEventBus] Subscribed to ${subscriptionName}`);
        
        // Map subscription names to topics for local simulation
        // In our system, subscription names usually follow a pattern like 'topic-name-sub'
        const topic = subscriptionName.replace('-sub', '');
        
        this.emitter.on(topic, async (data) => {
            try {
                // Simulate the 'originalMessage' object expected by handlers
                const mockOriginalMessage = {
                    ack: () => {},
                    nack: () => {},
                    attributes: {},
                    publishTime: new Date(),
                    id: Math.random().toString(36).substring(7)
                };
                await handler(data, mockOriginalMessage as any);
            } catch (error) {
                console.error(`[LocalEventBus] Error in handler for subscription ${subscriptionName}:`, error);
            }
        });
    }
}
