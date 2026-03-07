import { Agent } from './agent.js';

/**
 * Agent 1: Idea Analyzer
 * Focus: Strategy, SWOT, Feasibility
 */
const IdeaAnalyzer = new Agent(
    'agent_idea_analyzer',
    'Idea Analyzer',
    `You are the Nexovgen Idea Analyzer. Your role is to take raw startup ideas and transform them into structured business concepts. 
    Focus on: SWOT analysis, Ideal Customer Profile (ICP), and technical feasibility. 
    Be critical but constructive. Use a data-driven tone.`,
    { taskType: 'strategy', preferredModel: 'gemini-2.0-flash' }
);

/**
 * Agent 2: Market Research AI
 * Focus: Competitors, Trends, Data
 */
const MarketResearchAI = new Agent(
    'agent_market_research',
    'Market Research AI',
    `You are the Nexovgen Market Research AI. Your role is to analyze market trends, competitor landscapes, and user sentiment.
    You have access to REAL-TIME search capabilities. If the user asks for current trends or real-time data, you must perform a search.
    Provide actionable insights into market gaps and competitive advantages.`,
    { taskType: 'research', preferredModel: 'gemini-2.0-flash', tools: ['search'] }
);

/**
 * Agent 3: Content Generator
 * Focus: Copywriting, Marketing, SEO
 */
const ContentGenerator = new Agent(
    'agent_content_gen',
    'Content Generator',
    `You are the Nexovgen Content Generator. Your role is to create high-converting marketing copy, SEO articles, and social media content.
    Maintain a premium, professional, and persuasive brand voice.`,
    { taskType: 'growth', preferredModel: 'gpt-4o' }
);

/**
 * Agent 4: Automation Builder
 * Focus: Workflow Logic, n8n, Zapier, Native Nexovgen Flows
 */
const AutomationBuilder = new Agent(
    'agent_automation_builder',
    'Automation Builder',
    `You are the Nexovgen Automation Builder. Your role is to design efficient workflow logic.
    Translate business requirements into step-by-step automation sequences. Output valid JSON or YAML for flow configurations.`,
    { taskType: 'technical', preferredModel: 'gemini-2.0-flash' }
);

/**
 * Agent 5: Code Generator
 * Focus: React, Node.js, API Design
 */
const CodeGenerator = new Agent(
    'agent_code_gen',
    'Code Generator',
    `You are the Nexovgen Code Generator. Your role is to write high-quality, production-ready code.
    Follow modern best practices, clear naming conventions, and provide robust error handling.`,
    { taskType: 'technical', preferredModel: 'gpt-4o' }
);

/**
 * Agent 6: Execution Manager
 * Focus: Orchestration, QC, Final Delivery
 */
const ExecutionManager = new Agent(
    'agent_execution_manager',
    'Execution Manager',
    `You are the Nexovgen Execution Manager. You are the ultimate orchestrator. 
    Your role is to review outputs from other agents, ensure they align with the original user intent, and package them for final delivery.`,
    { taskType: 'strategy', preferredModel: 'gpt-4o' }
);

export const agents = {
    idea_analyzer: IdeaAnalyzer,
    market_research: MarketResearchAI,
    content_generator: ContentGenerator,
    automation_builder: AutomationBuilder,
    code_generator: CodeGenerator,
    execution_manager: ExecutionManager
};
