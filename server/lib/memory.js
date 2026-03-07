import admin from 'firebase-admin';

/**
 * Memory Service
 * 
 * Interacts with Firestore to provide long-term state and context for the AI OS.
 */
class MemoryService {
    constructor() {
        // Assume Firebase is initialized in index.js
        this.db = null;
    }

    getDb() {
        if (!this.db) {
            this.db = admin.firestore();
        }
        return this.db;
    }

    /**
     * Stores a user intent and routing decision
     */
    async storeIntent(userId, content, routing) {
        try {
            const db = this.getDb();
            await db.collection('intents').add({
                userId,
                content,
                agentId: routing.agentId,
                confidence: routing.confidence,
                isMultiStep: routing.isMultiStep,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        } catch (err) {
            console.error('[Memory] storeIntent error:', err.message);
        }
    }

    /**
     * Logs an agent action for future audit/recall
     */
    async logAction(userId, agentId, action, output) {
        try {
            const db = this.getDb();
            await db.collection('execution_logs').add({
                userId,
                agentId,
                action,
                outputSummary: typeof output === 'string' ? output.substring(0, 500) : 'Complex object',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        } catch (err) {
            console.error('[Memory] logAction error:', err.message);
        }
    }

    /**
     * Retrieves relevant context for a user
     */
    async retrieveContext(userId, limit = 5) {
        try {
            const db = this.getDb();
            const snap = await db.collection('execution_logs')
                .where('userId', '==', userId)
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();

            return snap.docs.map(doc => doc.data());
        } catch (err) {
            console.error('[Memory] retrieveContext error:', err.message);
            return [];
        }
    }
}

export const memory = new MemoryService();
