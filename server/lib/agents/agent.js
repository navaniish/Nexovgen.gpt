import { orchestrator } from '../orchestrator.js';

/**
 * Base Agent Class
 * 
 * Provides basic scaffolding for specialized AI agents within the OS.
 */
export class Agent {
    constructor(id, name, persona, options = {}) {
        this.id = id;
        this.name = name;
        this.persona = persona;
        this.options = options;
        this.tools = options.tools || []; // List of tool keys this agent can use
    }

    /**
     * Internal method to execute a task using the Orchestrator
     * @param {string} prompt - The task/message for the agent
     * @param {Object} context - Optional history or metadata
     */
    async execute(prompt, context = {}) {
        console.log(`[Agent:${this.id}] Executing: ${prompt.substring(0, 50)}...`);

        const messages = context.history || [];
        messages.push({ role: 'user', content: prompt });

        try {
            const response = await orchestrator.routeAndExecute(
                this.options.taskType || 'strategy',
                messages,
                context.systemPrompt || this.persona,
                this.options.preferredModel
            );

            return {
                agentId: this.id,
                response,
                timestamp: new Date().toISOString()
            };
        } catch (err) {
            console.error(`[Agent:${this.id}] Execution Failed:`, err.message);
            throw err;
        }
    }

    /**
     * Memory Retrieval (Stub for phase 2)
     */
    async recall(query) {
        // This will interface with the memory.js service
        return [];
    }
}
