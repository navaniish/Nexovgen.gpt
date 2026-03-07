/**
 * BaseNode
 * 
 * Every node type in Nexov-Bridge (Slack, Gmail, OpenAI, etc.) 
 * must extend this class to ensure a consistent execution interface.
 */
export class BaseNode {
    constructor(id, type, config) {
        this.id = id;
        this.type = type;
        this.config = config || {};
    }

    /**
     * Main execution logic for the node.
     * @param {Object} input - Data coming from the previous node or trigger.
     * @returns {Promise<Object>} - The output data to be passed to the next node.
     */
    async execute(input) {
        throw new Error(`Node type ${this.type} must implement execute()`);
    }

    /**
     * Returns metadata about the node for the UI.
     */
    getMetadata() {
        return {
            id: this.id,
            type: this.type,
            config: this.config
        };
    }
}

/**
 * NodeRegistry
 * 
 * Central hub for discovering and instantiating available node types.
 */
class Registry {
    constructor() {
        this.nodes = new Map();
    }

    /**
     * Register a new node type plugin.
     * @param {string} type - Unique identifier for the node type (e.g., 'slack.sendMessage')
     * @param {Class} nodeClass - The class extending BaseNode
     */
    register(type, nodeClass) {
        this.nodes.set(type, nodeClass);
        console.log(`[NodeRegistry] Registered: ${type}`);
    }

    /**
     * Create an instance of a registered node.
     * @param {string} type 
     * @param {string} id 
     * @param {Object} config 
     */
    createNode(type, id, config) {
        const NodeClass = this.nodes.get(type);
        if (!NodeClass) {
            throw new Error(`[NodeRegistry] Node type ${type} not found.`);
        }
        return new NodeClass(id, type, config);
    }

    /**
     * List all available node types.
     */
    listAvailableTypes() {
        return Array.from(this.nodes.keys());
    }
}

export const NodeRegistry = new Registry();
