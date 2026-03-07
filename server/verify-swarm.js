import 'dotenv/config';
import { orchestrator } from './lib/orchestrator.js';

async function verifySwarmLoop() {
    console.log('\n🐝 --- VERIFYING AUTONOMOUS SWARM LOOP --- 🐝');

    const prompt = "I want to build a real-time SaaS for localized grocery delivery using AI agents.";

    console.log(`\n[Test]: Triggering Swarm Loop for project: "${prompt}"`);
    console.log('[Note]: This will call all 6 agents sequentially. This may take a moment...\n');

    try {
        const startTime = Date.now();
        const result = await orchestrator.executeSwarmLoop(prompt, 'test_user_swarm');
        const duration = (Date.now() - startTime) / 1000;

        console.log(`\n✅ --- SWARM LOOP COMPLETED IN ${duration.toFixed(1)}s ---`);
        console.log('\n--- FINAL SYNTHESIS (Execution Manager) ---');
        console.log(result.finalSynthesis);

        console.log('\n--- SWARM TRACE ---');
        result.fullTrace.forEach((step, i) => {
            console.log(`${i + 1}. ${step.agentId}: [Response Length: ${step.response.length}]`);
        });

        if (result.fullTrace.length === 6) {
            console.log('\n✨ SUCCESS: All 6 agents participated in the loop.');
        } else {
            console.warn(`\n⚠️ WARNING: Only ${result.fullTrace.length} agents participated.`);
        }

    } catch (err) {
        console.error('\n❌ SWARM VERIFICATION FAILED:', err.message);
        if (err.stack) console.error(err.stack);
    }
}

verifySwarmLoop();
