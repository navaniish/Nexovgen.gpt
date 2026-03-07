import OpenAI from 'openai';
import { agents } from './agents/agent-definitions.js';

class AIOrchestrator {
    constructor() {
        this.providers = {
            openai: process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null,
            anthropic: process.env.ANTHROPIC_API_KEY ? { apiKey: process.env.ANTHROPIC_API_KEY } : null,
            gemini: (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) ? {
                apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
            } : null,
            deepseek: process.env.DEEPSEEK_API_KEY ? { apiKey: process.env.DEEPSEEK_API_KEY } : null,
            gateway: process.env.LLM_GATEWAY_KEY ? new OpenAI({
                apiKey: process.env.LLM_GATEWAY_KEY,
                baseURL: process.env.LLM_GATEWAY_URL || 'https://api.llmgateway.io/v1/'
            }) : null,
            ollama: process.env.OLLAMA_API_KEY ? new OpenAI({
                apiKey: process.env.OLLAMA_API_KEY,
                baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1'
            }) : null,
        };

        this.routingRules = {
            strategy: process.env.LLM_GATEWAY_KEY ? 'gateway' : (process.env.GEMINI_API_KEY ? 'gemini' : 'openai'),
            technical: process.env.LLM_GATEWAY_KEY ? 'gateway' : (process.env.GEMINI_API_KEY ? 'gemini' : 'openai'),
            research: process.env.LLM_GATEWAY_KEY ? 'gateway' : (process.env.GEMINI_API_KEY ? 'gemini' : 'openai'),
            growth: 'openai',
            product: 'openai',
        };
    }

    async detectIntent(message) {
        try {
            const systemPrompt = `You are the primary Nexovgen.gpt Intent Router. 
Given the user's message, classify the requirement and route it to the most appropriate specialized Agent.

Agent IDs: 
- "idea_analyzer": Startup validation, business strategy, monetization, scaling.
- "market_research": Competitor analysis, industry trends, data research.
- "content_generator": Marketing copy, email, social media, blogs.
- "automation_builder": Designing workflows, logic, connecting APIs.
- "code_generator": Full-stack development, debugging, architecture.
- "execution_manager": Project management, status, quality control.

Return ONLY a JSON object: { "agentId": "<agent_id>", "confidence": <0-1>, "isMultiStep": <bool> }`;

            const preferredIntentProvider = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) ? 'gemini' : 'openai';
            console.log(`[Orchestrator] Detecting intent using: ${preferredIntentProvider}`);

            let raw;
            if (preferredIntentProvider === 'gemini') {
                raw = await this.executeGemini([{ role: 'user', content: message }], systemPrompt);
            } else {
                raw = await this.executeOpenAI([{ role: 'user', content: message }], systemPrompt);
            }
            const data = JSON.parse(raw.replace(/```json?|```/g, '').trim());
            return data;
        } catch (err) {
            console.error('[Orchestrator] Intent Detection Error:', err.message);
            return { agentId: 'idea_analyzer', confidence: 0.5, isMultiStep: false };
        }
    }

    /**
     * Executes a specialized agent task
     * @param {string} agentId 
     * @param {string} prompt 
     * @param {Object} context 
     */
    async executeAgent(agentId, prompt, context = {}) {
        const agent = agents[agentId];
        if (!agent) throw new Error(`Agent ${agentId} not found in definitions.`);

        // If the agent has a search tool and the query requires real-time data
        if (agent.tools.includes('search')) {
            console.log(`[Orchestrator] Agent ${agentId} is using the Search tool...`);
            try {
                const { NodeRegistry } = await import('./node-registry.js');
                const searchNode = NodeRegistry.createNode('search', `tool_search_${Date.now()}`, {});
                const realTimeData = await searchNode.execute({ query: prompt, focus: 'SaaS' });

                // Inject real-time data into the prompt for the agent
                prompt = `REAL-TIME MARKET DATA:\n${JSON.stringify(realTimeData.data, null, 2)}\n\nUSER REQUEST: ${prompt}`;
            } catch (err) {
                console.warn(`[Orchestrator] Tool execution failed for ${agentId}:`, err.message);
            }
        }

        return await agent.execute(prompt, context);
    }

    /**
     * Executes the full Autonomous Swarm Loop
     * Order: Idea -> Research -> Content -> Automation -> Code -> Execution Manager
     */
    async executeSwarmLoop(initialPrompt, userId) {
        console.log(`[Orchestrator] Starting Full Swarm Loop for user: ${userId}`);
        const sequence = [
            'idea_analyzer',
            'market_research',
            'content_generator',
            'automation_builder',
            'code_generator',
            'execution_manager'
        ];

        let cumulativeContext = `Original User Intent: ${initialPrompt}\n\n`;
        let results = [];

        for (const agentId of sequence) {
            console.log(`[Swarm Loop] Transitioning to: ${agentId}`);
            const agentPrompt = `Current Context:\n${cumulativeContext}\n\nTask: Perform your specialized role based on the context above. Deliver a high-quality contribution.`;

            const result = await this.executeAgent(agentId, agentPrompt, { history: [] });
            results.push({ agentId, response: result.response });

            cumulativeContext += `--- ${agents[agentId].name} Output ---\n${result.response}\n\n`;
        }

        return {
            finalSynthesis: results[results.length - 1].response,
            fullTrace: results,
            cumulativeMarkdown: cumulativeContext
        };
    }

    async routeAndExecute(taskType, messages, systemPrompt, modelOverride) {
        console.log(`[DEBUG] Orchestrator: routeAndExecute called for task: ${taskType}, modelOverride: ${modelOverride}`);
        let preferredProvider = this.routingRules[taskType] || 'gemini';

        if (modelOverride) {
            const low = modelOverride.toLowerCase();
            if (low.includes('gateway')) preferredProvider = 'gateway';
            else if (low.includes('gemini')) preferredProvider = 'gemini';
            else if (low.includes('claude')) preferredProvider = 'anthropic';
            else if (low.includes('gpt')) preferredProvider = 'openai';
            else if (low.includes('ollama')) preferredProvider = 'ollama';
        }

        const providersToTry = [preferredProvider, 'gemini', 'gateway', 'openai', 'anthropic', 'ollama'];
        const uniqueProviders = [...new Set(providersToTry)];

        let lastError = null;

        for (const provider of uniqueProviders) {
            if (!this.providers[provider]) continue;

            try {
                console.log(`[DEBUG] Attempting ${taskType} with ${provider}...`);
                const options = modelOverride ? { model: modelOverride } : {};
                let result;
                switch (provider) {
                    case 'openai': result = await this.executeOpenAI(messages, systemPrompt, options); break;
                    case 'deepseek': result = await this.executeDeepSeek(messages, systemPrompt); break;
                    case 'anthropic': result = await this.executeClaude(messages, systemPrompt, options); break;
                    case 'gemini': result = await this.executeGemini(messages, systemPrompt, options); break;
                    case 'gateway': result = await this.executeGateway(messages, systemPrompt, options); break;
                    case 'ollama': result = await this.executeOllama(messages, systemPrompt, options); break;
                }
                if (result) {
                    console.log(`[DEBUG] Got successful response from ${provider}`);
                    return result;
                }
            } catch (err) {
                lastError = err;
                console.warn(`[DEBUG] Provider ${provider} failed:`, err.message);
                // Continue to next provider
            }
        }

        if (lastError) throw lastError;
        throw new Error('All AI providers failed');
    }

    async executeOpenAI(messages, systemPrompt, options = {}) {
        try {
            let model = 'gpt-4o-mini';
            if (options.model?.includes('GPT-4o')) model = 'gpt-4o';
            else if (options.model?.toLowerCase().includes('gpt-4o')) model = 'gpt-4o';

            const completion = await this.providers.openai.chat.completions.create({
                model: model,
                messages: [{ role: 'system', content: systemPrompt }, ...messages],
                temperature: options.temperature ?? 0.7,
                max_tokens: options.max_tokens ?? 2000,
            });
            return completion.choices[0].message.content;
        } catch (err) {
            console.error('[Orchestrator] OpenAI Error:', err.message);
            throw err;
        }
    }

    async executeGateway(messages, systemPrompt, options = {}) {
        try {
            console.log('[Orchestrator] Executing with LLM Gateway (auto)...');
            const completion = await this.providers.gateway.chat.completions.create({
                model: "auto",
                messages: [{ role: 'system', content: systemPrompt }, ...messages],
                temperature: options.temperature ?? 0.7,
                max_tokens: options.max_tokens ?? 2000,
                free_models_only: true, // As requested in user snippet
            });
            return completion.choices[0].message.content;
        } catch (err) {
            console.error('[Orchestrator] Gateway Error:', err.message);
            throw err;
        }
    }

    async executeOllama(messages, systemPrompt, options = {}) {
        try {
            console.log('[Orchestrator] Executing with Ollama...');
            const model = options.model || 'llama3';
            const completion = await this.providers.ollama.chat.completions.create({
                model: model,
                messages: [{ role: 'system', content: systemPrompt }, ...messages],
                temperature: options.temperature ?? 0.7,
                max_tokens: options.max_tokens ?? 2000,
            });
            return completion.choices[0].message.content;
        } catch (err) {
            console.error('[Orchestrator] Ollama Error:', err.message);
            throw err;
        }
    }

    async executeDeepSeek(messages, systemPrompt) {
        const dsClient = new OpenAI({
            apiKey: this.providers.deepseek.apiKey,
            baseURL: 'https://api.deepseek.com',
        });
        const completion = await dsClient.chat.completions.create({
            model: 'deepseek-chat',
            messages: [{ role: 'system', content: systemPrompt }, ...messages],
            temperature: 0.1,
        });
        return completion.choices[0].message.content;
    }

    async executeClaude(messages, systemPrompt, options = {}) {
        let model = 'claude-3-5-sonnet-20240620';
        if (options.model?.includes('Claude 3.5')) model = 'claude-3-5-sonnet-20240620';

        // In the future, we can map options.model to specific Claude versions
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': this.providers.anthropic.apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                max_tokens: 2000,
                system: systemPrompt,
                messages: messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
            })
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(`Claude Error: ${response.status} - ${JSON.stringify(errData)}`);
        }
        const data = await response.json();
        return data.content[0].text;
    }

    async executeGemini(messages, systemPrompt, options = {}) {
        let model = 'gemini-flash-latest';
        if (options.model?.includes('Gemini 1.5 Pro')) model = 'gemini-pro-latest';
        if (options.model?.includes('Gemini 1.5 Flash')) model = 'gemini-flash-latest';
        if (options.model?.includes('Gemini 3 Flash')) model = 'gemini-3-flash-preview';
        if (options.model?.includes('Gemini 2.0')) model = 'gemini-2.0-flash';
        if (options.model?.includes('Gemini 2.5')) model = 'gemini-2.5-flash';

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.providers.gemini.apiKey}`;
        console.log('[Orchestrator] Hitting Gemini URL:', url.replace(this.providers.gemini.apiKey, 'REDACTED'));
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: 'user', parts: [{ text: systemPrompt }] },
                    ...messages.map(m => ({
                        role: m.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: m.content }]
                    }))
                ]
            })
        });
        if (!response.ok) {
            const errData = await response.json();
            const error = new Error(`Gemini Error: ${response.status} - ${JSON.stringify(errData)}`);
            error.status = response.status;
            throw error;
        }
        const data = await response.json();
        if (!data.candidates || data.candidates.length === 0) throw new Error('Gemini No Response');
        return data.candidates[0].content.parts[0].text;
    }

    async synthesizeStrategicOutput(userContext) {
        console.log('[Orchestrator] Synthesizing strategic output...');

        // Define internal synthesis prompt
        const synthesisPrompt = `You are Nexovgen GPT Synthesis Engine.
        Synthesize the founder request into the standard structure:
        # EXECUTIVE SUMMARY
        # STRATEGIC ANALYSIS
        # MARKET INTELLIGENCE
        # TECHNICAL ARCHITECTURE
        # PRODUCT & GTM
        # RISKS & MITIGATION
        # 30-60-90 DAY ACTION PLAN
        # TOP 3 IMMEDIATE MOVES`;

        // In a real multi-model scenario, we'd parallelize calls here.
        // For now, we use gpt-4o as the master synthesizer.
        return await this.executeOpenAI([{ role: 'user', content: userContext }], synthesisPrompt);
    }
}

export const orchestrator = new AIOrchestrator();
