import { PubSub } from '@google-cloud/pubsub';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, './api/.env') });

const pubSubClient = new PubSub({ projectId: 'statvision-local' });

async function retrigger() {
    const topicName = 'video-upload-events';
    const message = {
        gameId: 'b6f4cee7-7538-40c8-9fd0-6e6bc86ddec8',
        filePath: '/data/data/com.termux/files/home/data/development/StatVision/uploads/1778999692949-demo.webm',
        userId: 'd931b9a6-6792-492b-a695-1ea2d9f1bb12'
    };

    const dataBuffer = Buffer.from(JSON.stringify(message));
    try {
        const messageId = await pubSubClient.topic(topicName).publishMessage({ data: dataBuffer });
        console.log(`Message ${messageId} published.`);
    } catch (error: any) {
        console.error(`Received error while publishing: ${error.message}`);
    }
}

retrigger();
