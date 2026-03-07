import 'dotenv/config';
import { orchestrator } from './lib/orchestrator.js';

async function verifyRealTimeResearch() {
    console.log('\n🔍 --- VERIFYING REAL-TIME RESEARCH CAPABILITY --- 🔍');

    const query = "What are the trending pain points for SaaS founders in March 2026? Give me real-time signals.";

    console.log(`\n[Test]: Sending query to Market Research AI: "${query}"`);

    try {
        const result = await orchestrator.executeAgent('market_research', query);

        console.log('\n✅ --- AGENT RESPONSE RECEIVED ---');
        console.log(result.response);

        if (result.response.toLowerCase().includes('reddit') || result.response.toLowerCase().includes('signals')) {
            console.log('\n✨ SUCCESS: Agent appears to be using real-time search data.');
        } else {
            console.warn('\n⚠️ WARNING: Agent response did not explicitly mention real-time signals.');
        }

    } catch (err) {
        console.error('\n❌ VERIFICATION FAILED:', err.message);
        if (err.stack) console.error(err.stack);
    }
}

verifyRealTimeResearch();
