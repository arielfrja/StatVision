import { PubSub } from '@google-cloud/pubsub';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const pubSubClient = new PubSub({ projectId: process.env.GCP_PROJECT_ID });

async function createResources() {
    const resources = [
        { topic: 'video-upload-events', sub: 'video-upload-events-sub' },
        { topic: 'chunk-analysis', sub: 'chunk-analysis-sub' },
        { topic: 'video-analysis-results', sub: 'video-analysis-results-sub' },
    ];

    for (const res of resources) {
        const topicName = process.env[res.topic.toUpperCase().replace(/-/g, '_') + '_TOPIC_NAME'] || res.topic;
        const subName = process.env[res.topic.toUpperCase().replace(/-/g, '_') + '_SUBSCRIPTION_NAME'] || res.sub;

        try {
            const [topic] = await pubSubClient.createTopic(topicName);
            console.log(`Topic ${topic.name} created.`);
        } catch (err: any) {
            if (err.code === 6) {
                console.log(`Topic ${topicName} already exists.`);
            } else {
                console.error(`Error creating topic ${topicName}:`, err);
            }
        }

        try {
            const [subscription] = await pubSubClient.topic(topicName).createSubscription(subName);
            console.log(`Subscription ${subscription.name} created.`);
        } catch (err: any) {
            if (err.code === 6) {
                console.log(`Subscription ${subName} already exists.`);
            } else {
                console.error(`Error creating subscription ${subName}:`, err);
            }
        }
    }
}

createResources().catch(console.error);
