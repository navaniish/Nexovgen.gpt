import { NodeRegistry } from '../lib/node-registry.js';
import { OpenAINode } from './nodes/openai-node.js';
import { SlackNode } from './nodes/slack-node.js';
import { NotionNode } from './nodes/notion-node.js';
import { GithubNode } from './nodes/github-node.js';
import { SearchNode } from './nodes/search-node.js';

// Register built-in nodes
NodeRegistry.register('openai', OpenAINode);
NodeRegistry.register('slack', SlackNode);
NodeRegistry.register('notion', NotionNode);
NodeRegistry.register('github', GithubNode);
NodeRegistry.register('search', SearchNode);

/**
 * Worker
 * 
 * Orchestrates the execution of a workflow.
 */
export class Worker {
    /**
     * Execute a workflow definition
     * @param {Object} workflow - The JSON definition of the workflow (nodes & edges)
     * @param {Object} triggerInput - The initial data from the trigger
     */
    static async executeWorkflow(workflow, triggerInput) {
        const { nodes, edges } = workflow;
        console.log(`[Worker] Starting execution for workflow: ${workflow.name || 'Untitled'}`);

        // State to keep track of outputs from each node
        const nodeOutputs = { [nodes[0].id]: triggerInput };
        const executionLog = [];

        // Simple sequential execution for now
        // TODO: Implement Directed Acyclic Graph (DAG) traversal for branching
        let currentNode = nodes[0];

        while (currentNode) {
            const nodeInstance = NodeRegistry.createNode(currentNode.type, currentNode.id, currentNode.config);

            try {
                const startTime = Date.now();
                const output = await nodeInstance.execute(nodeOutputs[currentNode.id]);
                const duration = Date.now() - startTime;

                nodeOutputs[currentNode.id] = output;
                executionLog.push({
                    nodeId: currentNode.id,
                    type: currentNode.type,
                    status: 'success',
                    output,
                    duration
                });

                // Find next node based on edges
                const edge = edges.find(e => e.source === currentNode.id);
                if (edge) {
                    currentNode = nodes.find(n => n.id === edge.target);
                    // Pass current output to next node's input
                    nodeOutputs[currentNode.id] = output;
                } else {
                    currentNode = null;
                }
            } catch (err) {
                console.error(`[Worker] Failed at node ${currentNode.id}:`, err.message);
                executionLog.push({
                    nodeId: currentNode.id,
                    type: currentNode.type,
                    status: 'error',
                    error: err.message
                });
                break; // Stop execution on error
            }
        }

        console.log(`[Worker] Workflow execution finished.`);
        return {
            status: executionLog.some(l => l.status === 'error') ? 'failed' : 'completed',
            trace: executionLog
        };
    }
}
