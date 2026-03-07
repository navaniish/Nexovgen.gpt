import { Worker } from './services/worker.js';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Explicitly load .env from the server directory
dotenv.config({ path: join(__dirname, '.env') });

const testWorkflow = {
    name: 'Test AI to Slack Workflow',
    nodes: [
        { id: 'n1', type: 'openai', config: { prompt: 'Write a 3-word catchy slogan for a high-end AI company.' } },
        { id: 'n2', type: 'slack', config: { channel: '#general', message: 'New Slogan: {{input.result}}' } }
    ],
    edges: [
        { source: 'n1', target: 'n2' }
    ]
};

async function runTest() {
    console.log('--- STARTING ENGINE TEST ---');
    try {
        const result = await Worker.executeWorkflow(testWorkflow, { initial: 'data' });
        console.log('--- TEST RESULT ---');
        console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('--- TEST FAILED ---');
        console.error(err);
    }
}

runTest();
