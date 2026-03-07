import 'dotenv/config';
import { orchestrator } from './server/lib/orchestrator.js';

async function runResearchFlow() {
    console.log('\n🚀 --- STARTING SAAS RESEARCH FLOW --- 🚀');

    const idea = 'Nexovgen: An AI-powered Autonomous OS for founders that converts ideas into automated execution using specialized agent swarms and workflow orchestration.';

    console.log('\n[Phase 1]: Triggering Idea Analyzer Agent...');
    try {
        const analysis = await orchestrator.executeAgent('idea_analyzer', `Analyze this SaaS idea in depth: ${idea}. Focus on SWOT and Feasibility.`);
        console.log('✅ Analysis Received:');
        console.log(analysis.response);
    } catch (err) {
        console.error('❌ Idea Analysis Failed:', err.message);
    }

    console.log('\n[Phase 2]: Triggering Market Research AI (Reddit/Community Exploration)...');
    try {
        const research = await orchestrator.executeAgent('market_research', `Simulate a search on Reddit (r/startups, r/SaaS) for pain points this product solves: ${idea}. Give me 3 simulated threads with subreddits.`);
        console.log('✅ Market Research Received:');
        console.log(research.response);
    } catch (err) {
        console.error('❌ Market Research Failed:', err.message);
    }

    console.log('\n🏁 --- RESEARCH FLOW COMPLETE --- 🏁');
}

runResearchFlow();
