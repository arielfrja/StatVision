import { CloudTasksClient } from '@google-cloud/tasks';
import dotenv from 'dotenv';
import path from 'path';

const client = new CloudTasksClient();

async function triggerOrchestration() {
    const projectId = 'statsvision-477017';
    const location = 'us-central1';
    const queue = 'orchestrate-queue';
    const url = 'https://statvision-worker-test-chsbu3g4oa-uc.a.run.app/api/orchestrate-game';
    const serviceAccountEmail = '515511056475-compute@developer.gserviceaccount.com';

    const gameId = 'cd41e7da-4743-46e8-b0d4-1788b71bf619';
    const gcsUri = 'gs://statvision-uploads-test/videos/cd41e7da-4743-46e8-b0d4-1788b71bf619/demo.webm';
    const userId = 'arielfrja@gmail.com';

    const parent = client.queuePath(projectId, location, queue);
    const payload = { gameId, filePath: gcsUri, userId };
    
    const task = {
        httpRequest: {
            httpMethod: 'POST' as const,
            url,
            headers: { 'Content-Type': 'application/json' },
            body: Buffer.from(JSON.stringify(payload)).toString('base64'),
            oidcToken: {
                serviceAccountEmail,
            },
        },
    };

    console.log('Sending task...');
    const [response] = await client.createTask({ parent, task });
    console.log(`Created task ${response.name}`);
}

triggerOrchestration().catch(console.error);
