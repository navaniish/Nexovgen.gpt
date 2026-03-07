import { BaseNode } from '../../lib/node-registry.js';
import OpenAI from 'openai';

export class OpenAINode extends BaseNode {
    async execute(input) {
        console.log(`[OpenAINode] Executing with input:`, input);

        const apiKey = process.env.OPENAI_API_KEY; // In production, this would come from AuthVault
        if (!apiKey) throw new Error('OpenAI API Key not configured');

        const openai = new OpenAI({ apiKey });

        const prompt = this.config.prompt || 'Summarize this data: {{input}}';
        const interpolatedPrompt = prompt.replace('{{input}}', JSON.stringify(input));

        try {
            const completion = await openai.chat.completions.create({
                model: this.config.model || 'gpt-4o',
                messages: [{ role: 'user', content: interpolatedPrompt }],
                temperature: this.config.temperature ?? 0.7,
            });

            const content = completion.choices[0].message.content;
            return {
                result: content,
                raw: completion
            };
        } catch (err) {
            console.error('[OpenAINode] Error:', err.message);
            throw err;
        }
    }
}
