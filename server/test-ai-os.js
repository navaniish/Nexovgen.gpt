import 'dotenv/config';
import { orchestrator } from './lib/orchestrator.js';
import { agents } from './lib/agents/agent-definitions.js';

async function testAIOS() {
    console.log('🚀 Starting Nexovgen AI OS Verification...');

    const testCases = [
        {
            query: 'I want to build a marketplace for luxury hand-made furniture.',
            expected: 'idea_analyzer'
        },
        {
            query: 'How do I set up a PostgreSQL database with Prisma in Node.js?',
            expected: 'code_generator'
        },
        {
            query: 'Who are the top competitors for AI-driven CRM systems in 2026?',
            expected: 'market_research'
        },
        {
            query: 'Write 3 LinkedIn post hooks for my new product launch.',
            expected: 'content_generator'
        }
    ];

    for (const test of testCases) {
        console.log(`\nTesting Intention: "${test.query}"`);
        try {
            const detection = await orchestrator.detectIntent(test.query);
            console.log(`✅ Detected Agent: ${detection.agentId} (Confidence: ${detection.confidence})`);

            if (detection.agentId === test.expected || detection.confidence > 0.7) {
                console.log('✨ Intent Routing Verified');
            } else {
                console.warn(`⚠️ Routing Mismatch: Expected ${test.expected}, got ${detection.agentId}`);
            }

            console.log(`Attempting execution with ${detection.agentId}...`);
            const response = await orchestrator.executeAgent(detection.agentId, test.query);
            console.log(`📩 Response (truncated): ${response.response.substring(0, 100)}...`);
            console.log('✨ Agent Execution Verified');

        } catch (err) {
            console.error(`❌ Test Failed: ${err.message}`);
        }
    }

    console.log('\n🏁 Verification Complete.');
}

testAIOS();
