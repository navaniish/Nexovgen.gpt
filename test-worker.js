import { Worker } from './server/services/worker.js';
import dotenv from 'dotenv';
dotenv.config();

const testWorkflow = {
    name: 'Test AI to Slack Workflow',
    nodes: [
        { id: 'n1', type: 'openai', config: { prompt: 'Write a 3-word catchy slogan for an AI company.' } },
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
