import { BaseNode } from '../../lib/node-registry.js';

export class SlackNode extends BaseNode {
    async execute(input) {
        console.log(`[SlackNode] Sending message to channel: ${this.config.channel}`);

        const message = this.config.message || 'Workflow Update: {{input}}';
        const interpolatedMessage = message.replace('{{input}}', JSON.stringify(input));

        // Mocking the actual Slack API call for now
        // In production: use @slack/web-api and tokens from AuthVault
        console.log(`[Slack_MOCK_API] POST -> https://slack.com/api/chat.postMessage:`, {
            channel: this.config.channel,
            text: interpolatedMessage
        });

        return {
            status: 'success',
            deliveredAt: new Date().toISOString(),
            messageSummary: interpolatedMessage.slice(0, 50) + '...'
        };
    }
}
