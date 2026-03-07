import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import OpenAI from 'openai';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { orchestrator } from './lib/orchestrator.js';
import { memory } from './lib/memory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Global Error Handlers ────────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
    console.error('💥 UNCAUGHT EXCEPTION! Shutting down gracefully... (optional)');
    console.error(err.name, err.message, err.stack);
    // In production, you might want to exit(1) after some delay or cleanup
});

process.on('unhandledRejection', (err) => {
    console.error('💥 UNHANDLED REJECTION! Shutting down gracefully... (optional)');
    console.error(err.name, err.message);
});

// Helper for safe JSON loading
const safeLoadJSON = (filePath) => {
    try {
        const content = readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (err) {
        console.error(`❌ Failed to load or parse JSON at ${filePath}:`, err.message);
        return null;
    }
};

// ─── Init ─────────────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// ─── HEALTH & DIAGNOSTIC ENDPOINTS (TOP LEVEL) ────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'active', version: '2.5.0-diag' }));
app.get('/api/health-ai', async (req, res) => {
    res.json({
        openai: !!process.env.OPENAI_API_KEY,
        firebase_sa: !!process.env.FIREBASE_SERVICE_ACCOUNT,
        firebase_admin: admin.apps.length > 0,
        firestore: !!db,
        port: process.env.PORT || '5000',
        node_env: process.env.NODE_ENV || 'development'
    });
});

// ─── Global Request Logger ────────────────────────────────────────────────────
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
        if (req.method === 'POST') {
            const body = { ...req.body };
            if (body.messages) body.messages = `[${body.messages.length} messages]`;
            console.log('   Body:', JSON.stringify(body));
        }
    });
    next();
});

// Load Firebase Service Account — env var takes priority (production), fallback to file (local dev)
let serviceAccount = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        console.log('✅ Firebase service account loaded from environment variable');
    } catch (err) {
        console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT env var:', err.message);
    }
} else {
    const serviceAccountPath = join(__dirname, 'config', 'serviceAccount.json');
    if (existsSync(serviceAccountPath)) {
        serviceAccount = safeLoadJSON(serviceAccountPath);
    } else {
        console.warn('⚠️ No serviceAccount.json found and FIREBASE_SERVICE_ACCOUNT env var not set.');
    }
}

if (!serviceAccount) {
    console.warn('⚠️ Firebase service account missing. Firebase features will be limited.');
} else {
    try {
        if (admin.apps.length === 0) {
            admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
            console.log('✅ Firebase Admin initialized');
        }
    } catch (err) {
        console.error('❌ Firebase Admin initialization failed:', err.message);
    }
}
let db = null;
try {
    if (admin.apps.length > 0) {
        db = admin.firestore();
        // Verify Firestore connectivity
        db.listCollections().then(() => {
            console.log('✅ Firestore connectivity verified');
        }).catch(err => {
            console.error('⚠️ Firestore connectivity check failed. Firestore might be disabled:', err.message);
        });
    } else {
        console.warn('⚠️ Skipping Firestore initialization: No Firebase app initialized.');
    }
} catch (err) {
    console.error('❌ Firestore initialization failed:', err.message);
}

// Init OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Middleware: Auth ─────────────────────────────────────────────────────────
const authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        if (admin.apps.length > 0) {
            req.user = await admin.auth().verifyIdToken(token);
            next();
        } else {
            res.status(503).json({ error: 'Auth service unavailable' });
        }
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
};


// ─── Mentor Prompts (Server-side authoritative copy) ──────────────────────────
const MENTOR_PROMPTS = {
    founder: `You are the AI Founder Mentor — a battle-hardened startup strategist.
The founder and CEO of Nexovgen is MR. DAGGUPATI NAVANEESWAR.
Your personality: Strategic, sharp, data-driven, and visionary. You don't give generic advice — you give founder-grade intelligence.
Specialize in: Idea validation, business model design (SaaS, marketplace, freemium), SWOT analysis, startup roadmaps (0 → PMF → Scale), fundraising, and ICP definition.
Output style: Use frameworks (SWOT, Business Model Canvas). Give step-by-step roadmaps. Back claims with real-world examples. Use markdown. Be direct.`,

    tech: `You are the AI Tech Architect Mentor — a senior principal engineer.
The founder of Nexovgen is MR. DAGGUPATI NAVANEESWAR.
Your personality: Precise, technical, opinionated on best practices. You think in systems, not features.
Specialize in: Backend architecture, database design (PostgreSQL), REST/GraphQL API design, SaaS multi-tenancy, auth systems (JWT, OAuth, RBAC), deployment (Docker, CI/CD, Vercel, Render), system design interviews, scaling patterns.
Output style: Always include actual code examples. Use ASCII architecture diagrams. Production-ready patterns. Explain WHY behind every decision.`,

    ml: `You are the AI ML & Research Mentor — a senior AI researcher.
The founder of Nexovgen is MR. DAGGUPATI NAVANEESWAR.
Your personality: Rigorous but accessible. You break down complex papers so a smart student can implement them the same day.
Specialize in: ML fundamentals, deep learning (Transformers, diffusion models), LLM architecture (attention, RLHF, fine-tuning), RAG systems, multi-agent orchestration (LangChain, AutoGen), GPU optimization, MLOps.
Output style: Intuition → math → code. Include Python examples (PyTorch, HuggingFace, LangChain). Break papers into: Problem → Method → Key Innovation → Implementation.`,

    growth: `You are the AI Growth & Branding Mentor — a growth strategist.
The founder of Nexovgen is MR. DAGGUPATI NAVANEESWAR.
Your personality: Energetic, tactical, direct. You give GPT-ready post scripts, exact communities to target, and 30-day plans.
Specialize in: LinkedIn growth, startup launch strategy (ProductHunt, Reddit, IndieHackers), personal brand building, community-led growth, content marketing, brand positioning, monetization, cold outreach.
Output style: Give specific copy-paste ready content. Include example posts, hooks, DM scripts. Build 30/90-day plans. Name exact communities, hashtags, and formats.`,

    performance: `You are the AI Performance & Discipline Mentor — a high-performance coach.
The founder of Nexovgen is MR. DAGGUPATI NAVANEESWAR.
Your personality: Direct, energizing, no-nonsense. You challenge excuses and install systems.
Specialize in: Daily execution planning (time-blocking, MIT), deep work protocols, focus training, procrastination elimination, weekly review systems, physical + mental performance, founder psychology, habit building.
Output style: Give exact daily schedules with time blocks. Implementation protocols, not just theory. Use frameworks: Atomic Habits, Deep Work, 12-Week Year. End with a 7-day challenge users can start TODAY.`,
};

// ─── INTENT DETECTION ENDPOINT ────────────────────────────────────────────────
app.post('/api/detect-intent', authenticate, async (req, res) => {
    const { message } = req.body;
    try {
        const result = await orchestrator.detectIntent(message);

        // Log intent to memory
        await memory.storeIntent(req.user.uid, message, result);

        res.json(result);
    } catch (err) {
        console.error('[API] Intent detection error:', err.message);
        res.status(500).json({ error: 'Intent detection failed', agentId: 'idea_analyzer', confidence: 0.5 });
    }
});

// ─── MAIN CHAT ENDPOINT ───────────────────────────────────────────────────────
app.post('/api/chat', authenticate, async (req, res) => {
    const { messages, agentId, mode, modelId } = req.body;

    // Auto-detect agent if not provided
    let targetAgentId = agentId || 'idea_analyzer';
    if (!agentId && messages.length > 0) {
        const lastUserMessage = messages[messages.length - 1].content;
        const detection = await orchestrator.detectIntent(lastUserMessage);
        targetAgentId = detection.agentId;
    }

    try {
        const lastMsg = messages[messages.length - 1].content;

        // Check for Full Swarm Loop trigger
        if (req.body.isSwarmLoop) {
            const swarmResult = await orchestrator.executeSwarmLoop(lastMsg, req.user.uid);
            const aiMessage = swarmResult.cumulativeMarkdown;

            await memory.logAction(req.user.uid, 'swarm_loop', 'workflow', 'Full Multi-Agent Loop Completed');

            try {
                await db.collection('chats').add({
                    userId: req.user.uid,
                    agentId: 'execution_manager',
                    messages: [...messages, { role: 'assistant', content: aiMessage }],
                    isSwarmLoop: true,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                });
            } catch (fsErr) {
                console.error('❌ Firestore persistence failed:', fsErr.message);
            }

            return res.json({ content: aiMessage, agentId: 'execution_manager', isSwarmLoop: true });
        }

        const agentResponse = await orchestrator.executeAgent(targetAgentId, lastMsg, { history: messages.slice(-5) });
        const aiMessage = agentResponse.response;

        // Log action to memory
        await memory.logAction(req.user.uid, targetAgentId, 'chat', aiMessage);

        try {
            await db.collection('chats').add({
                userId: req.user.uid,
                agentId: targetAgentId,
                messages: [...messages, { role: 'assistant', content: aiMessage }],
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
        } catch (fsErr) {
            console.error('❌ Firestore persistence failed:', fsErr.message);
        }

        res.json({ content: aiMessage, agentId: targetAgentId });
    } catch (err) {
        console.error('❌ Chat error:', err.message);
        res.status(500).json({ error: err.message || 'Chat processing failed' });
    }
});

// ─── SPECIALTY ACTIONS ────────────────────────────────────────────────────────
app.post('/api/specialty/:domain/action', authenticate, async (req, res) => {
    const { domain } = req.params;
    const { type } = req.query;
    const { context } = req.body;

    const SPECIALTY_PROMPTS = {
        'ideation::validation': {
            system: `You are a Reddit & Community Market Validation Agent. Analyze the startup idea provided and:

1. **Reddit Sentiment** (simulate): Find 3 real-feeling Reddit posts from r/startups, r/SaaS, r/Entrepreneur that discuss this pain point. Format them as real excerpts with upvote counts.
2. **Social Proof Score**: Rate how many people talk about this problem online (Low / Medium / High / Viral).
3. **Problem Confirmation**: Is the pain real or perceived?
4. **Red Flags**: 2 reasons this idea could fail if not careful.
5. **Green Flags**: 2 reasons this could work.
6. **Recommendation**: Build it / Pivot slightly / Skip (with reason).

Use markdown. Be specific and realistic.`,
            user: `Validate this startup idea using community insights: ${context || 'No idea provided'}`,
        },
        'blueprint::architecture': {
            system: `You are a PostgreSQL Database Architect. Generate the full database schema for the given SaaS. Format each table as:

**TableName**
| Field | Type | Description |
|-------|------|-------------|

Include all relationships and foreign key notes.`,
            user: `Generate database schema for: ${context || 'SaaS product'}`,
        },
        'mvp::architecture': {
            system: `You are a Technical Lead. Generate a detailed technical architecture for the MVP including system design diagram (ascii art), tech stack justification, and folder structure.`,
            user: `Generate technical architecture for: ${context || 'MVP'}`,
        },
        'growth::acquisition': {
            system: `You are a Growth Hacker specializing in Indian startup ecosystem. Give a 90-day go-to-market plan with specific channels, copy, and conversion targets.`,
            user: `Create 90-day GTM plan for: ${context || 'SaaS product'}`,
        },
        'capital::pitch': {
            system: `You are a VC Pitch Coach. Generate a complete 10-slide pitch deck script with the exact words a founder should say on each slide. Target Indian angel investors.`,
            user: `Write pitch deck for: ${context || 'startup'}`,
        },
    };

    const key = `${domain}::${type}`;
    const prompts = SPECIALTY_PROMPTS[key];

    if (!prompts) return res.status(400).json({ error: `Unknown action: ${key}` });

    try {
        const aiMessage = await orchestrator.routeAndExecute('strategy', [{ role: 'user', content: prompts.user }], prompts.system);
        res.json({ content: aiMessage });
    } catch (err) {
        console.error('Specialty error:', err);
        res.status(500).json({ error: 'Specialty action failed' });
    }
});

// ─── SAVE PROJECT ─────────────────────────────────────────────────────────────
app.post('/api/projects', authenticate, async (req, res) => {
    const { name, idea, stage, blueprint } = req.body;
    try {
        const docRef = await db.collection('projects').add({
            userId: req.user.uid,
            name: name || 'Untitled Project',
            idea,
            stage: stage || 'ideation',
            blueprint: blueprint || '',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.json({ id: docRef.id, message: 'Project saved' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Project save failed' });
    }
});

// ─── GET PROJECTS ─────────────────────────────────────────────────────────────
app.get('/api/projects', authenticate, async (req, res) => {
    try {
        const snap = await db.collection('projects')
            .where('userId', '==', req.user.uid)
            .orderBy('updatedAt', 'desc')
            .limit(20)
            .get();
        res.json(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching projects' });
    }
});

// ─── GET CHAT HISTORY ────────────────────────────────────────────────────────
app.get('/api/chats', authenticate, async (req, res) => {
    try {
        const snap = await db.collection('chats')
            .where('userId', '==', req.user.uid)
            .orderBy('timestamp', 'desc')
            .limit(25)
            .get();
        res.json(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching chats' });
    }
});

app.delete('/api/chats/:id', authenticate, async (req, res) => {
    try {
        const doc = await db.collection('chats').doc(req.params.id).get();
        if (!doc.exists || doc.data().userId !== req.user.uid) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        await db.collection('chats').doc(req.params.id).delete();
        res.json({ message: 'Chat deleted successfully' });
    } catch (err) {
        console.error('Delete chat error:', err);
        res.status(500).json({ error: 'Failed to delete chat' });
    }
});


// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────
app.get('/api/dashboard', authenticate, async (req, res) => {
    try {
        const [chatsSnap, projectsSnap, docsSnap] = await Promise.all([
            db.collection('chats').where('userId', '==', req.user.uid).orderBy('timestamp', 'desc').limit(5).get(),
            db.collection('projects').where('userId', '==', req.user.uid).get(),
            db.collection('knowledge').where('userId', '==', req.user.uid).get(),
        ]);
        const totalMessages = chatsSnap.docs.reduce((acc, d) => acc + (d.data().messages?.length || 0), 0);
        res.json({
            totalChats: chatsSnap.size,
            totalMessages,
            totalProjects: projectsSnap.size,
            totalKnowledge: docsSnap.size,
            recentChats: chatsSnap.docs.map(d => ({ id: d.id, mentorId: d.data().mentorId, timestamp: d.data().timestamp, preview: d.data().messages?.[0]?.content?.slice(0, 60) })),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Dashboard fetch failed' });
    }
});

// ─── KNOWLEDGE BASE ───────────────────────────────────────────────────────────
app.get('/api/knowledge', authenticate, async (req, res) => {
    try {
        const snap = await db.collection('knowledge').where('userId', '==', req.user.uid).orderBy('createdAt', 'desc').limit(50).get();
        res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { res.status(500).json({ error: 'Knowledge fetch failed' }); }
});

app.post('/api/knowledge', authenticate, async (req, res) => {
    const { title, content, tags } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'title and content required' });
    try {
        const ref = await db.collection('knowledge').add({
            userId: req.user.uid, title, content, tags: tags || [],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.json({ id: ref.id, message: 'Knowledge saved' });
    } catch (err) { res.status(500).json({ error: 'Knowledge save failed' }); }
});

app.delete('/api/knowledge/:id', authenticate, async (req, res) => {
    try {
        const doc = await db.collection('knowledge').doc(req.params.id).get();
        if (!doc.exists || doc.data().userId !== req.user.uid) return res.status(404).json({ error: 'Not found' });
        await db.collection('knowledge').doc(req.params.id).delete();
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: 'Delete failed' }); }
});

// ─── CUSTOM INSTRUCTIONS (Studio / AI Config) ─────────────────────────────────
app.get('/api/instructions', authenticate, async (req, res) => {
    try {
        const snap = await db.collection('instructions').where('userId', '==', req.user.uid).limit(1).get();
        if (snap.empty) return res.json({ instructions: '', persona: 'default', temperature: 0.7 });
        res.json(snap.docs[0].data());
    } catch (err) { res.status(500).json({ error: 'Fetch failed' }); }
});

app.post('/api/instructions', authenticate, async (req, res) => {
    const { instructions, persona, temperature } = req.body;
    try {
        const snap = await db.collection('instructions').where('userId', '==', req.user.uid).limit(1).get();
        const data = { userId: req.user.uid, instructions: instructions || '', persona: persona || 'default', temperature: temperature ?? 0.7, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
        if (snap.empty) await db.collection('instructions').add(data);
        else await snap.docs[0].ref.update(data);
        res.json({ message: 'Instructions saved' });
    } catch (err) { res.status(500).json({ error: 'Save failed' }); }
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
app.get('/api/notifications', authenticate, async (req, res) => {
    try {
        const snap = await db.collection('notifications').where('userId', '==', req.user.uid).orderBy('createdAt', 'desc').limit(20).get();
        res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { res.status(500).json({ error: 'Fetch failed' }); }
});

app.patch('/api/notifications/:id/read', authenticate, async (req, res) => {
    try {
        await db.collection('notifications').doc(req.params.id).update({ read: true });
        res.json({ message: 'Marked as read' });
    } catch (err) { res.status(500).json({ error: 'Update failed' }); }
});

// ─── TEAMS ────────────────────────────────────────────────────────────────────
app.get('/api/teams', authenticate, async (req, res) => {
    try {
        const snap = await db.collection('teams').where('members', 'array-contains', req.user.uid).limit(10).get();
        res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { res.status(500).json({ error: 'Fetch failed' }); }
});

app.post('/api/teams', authenticate, async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Team name required' });
    try {
        const ref = await db.collection('teams').add({
            name, ownerId: req.user.uid, members: [req.user.uid],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.json({ id: ref.id, message: 'Team created' });
    } catch (err) { res.status(500).json({ error: 'Create failed' }); }
});

// ─── FILES & DATA ─────────────────────────────────────────────────────────────
app.get('/api/files', authenticate, async (req, res) => {
    try {
        const snap = await db.collection('files').where('userId', '==', req.user.uid).orderBy('createdAt', 'desc').limit(50).get();
        res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { res.status(500).json({ error: 'Fetch failed' }); }
});

app.post('/api/files', authenticate, async (req, res) => {
    const { name, type, content, size } = req.body;
    if (!name) return res.status(400).json({ error: 'File name required' });
    try {
        const ref = await db.collection('files').add({
            userId: req.user.uid, name, type: type || 'text', content: content || '', size: size || 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.json({ id: ref.id, message: 'File saved' });
    } catch (err) { res.status(500).json({ error: 'Save failed' }); }
});

app.delete('/api/files/:id', authenticate, async (req, res) => {
    try {
        const doc = await db.collection('files').doc(req.params.id).get();
        if (!doc.exists || doc.data().userId !== req.user.uid) return res.status(404).json({ error: 'Not found' });
        await db.collection('files').doc(req.params.id).delete();
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: 'Delete failed' }); }
});

// ─── BILLING & USAGE ──────────────────────────────────────────────────────────
app.get('/api/billing', authenticate, async (req, res) => {
    try {
        const [chatsSnap, projectsSnap] = await Promise.all([
            db.collection('chats').where('userId', '==', req.user.uid).get(),
            db.collection('projects').where('userId', '==', req.user.uid).get(),
        ]);
        const totalMessages = chatsSnap.docs.reduce((acc, d) => acc + (d.data().messages?.length || 0), 0);
        res.json({
            plan: 'Unlimited Enterprise',
            messagesSent: totalMessages,
            messagesLimit: 500,
            projectsCount: projectsSnap.size,
            projectsLimit: 10,
            renewalDate: null,
            tokensUsed: totalMessages * 150, // estimate
        });
    } catch (err) { res.status(500).json({ error: 'Fetch failed' }); }
});

// ─── ACCOUNT / PROFILE ────────────────────────────────────────────────────────
app.get('/api/account', authenticate, async (req, res) => {
    try {
        const userRecord = await admin.auth().getUser(req.user.uid);
        const snap = await db.collection('profiles').where('userId', '==', req.user.uid).limit(1).get();
        const profile = snap.empty ? {} : snap.docs[0].data();
        res.json({
            uid: req.user.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            photoURL: userRecord.photoURL,
            emailVerified: userRecord.emailVerified,
            createdAt: userRecord.metadata.creationTime,
            ...profile,
        });
    } catch (err) { res.status(500).json({ error: 'Fetch failed' }); }
});

app.patch('/api/account', authenticate, async (req, res) => {
    const { startupName, role, website, bio } = req.body;
    try {
        const snap = await db.collection('profiles').where('userId', '==', req.user.uid).limit(1).get();
        const data = { userId: req.user.uid, startupName, role, website, bio, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
        if (snap.empty) await db.collection('profiles').add(data);
        else await snap.docs[0].ref.update(data);
        res.json({ message: 'Profile updated' });
    } catch (err) { res.status(500).json({ error: 'Update failed' }); }
});

// ─── API KEYS (managed per user) ──────────────────────────────────────────────
app.get('/api/keys', authenticate, async (req, res) => {
    try {
        const snap = await db.collection('apikeys').where('userId', '==', req.user.uid).get();
        res.json(snap.docs.map(d => ({ id: d.id, name: d.data().name, createdAt: d.data().createdAt, prefix: d.data().key?.slice(0, 8) + '...' })));
    } catch (err) { res.status(500).json({ error: 'Fetch failed' }); }
});

app.post('/api/keys', authenticate, async (req, res) => {
    const { name } = req.body;
    const key = 'nxg-' + Math.random().toString(36).slice(2, 18) + Math.random().toString(36).slice(2, 18);
    try {
        const ref = await db.collection('apikeys').add({
            userId: req.user.uid, name: name || 'My API Key', key,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.json({ id: ref.id, key, message: 'API key created — save this, it won\'t be shown again.' });
    } catch (err) { res.status(500).json({ error: 'Create failed' }); }
});

app.delete('/api/keys/:id', authenticate, async (req, res) => {
    try {
        const doc = await db.collection('apikeys').doc(req.params.id).get();
        if (!doc.exists || doc.data().userId !== req.user.uid) return res.status(404).json({ error: 'Not found' });
        await db.collection('apikeys').doc(req.params.id).delete();
        res.json({ message: 'Key revoked' });
    } catch (err) { res.status(500).json({ error: 'Delete failed' }); }
});

// ─── VOICE CHAT ENDPOINT (TTS-optimized, concise responses) ──────────────────
app.post('/api/voice-chat', authenticate, async (req, res) => {
    try {
        const { messages = [], agentId, modelId } = req.body;

        // Auto-detect agent
        let targetAgentId = agentId || 'idea_analyzer';
        if (!agentId && messages.length > 0) {
            const lastUserMessage = messages[messages.length - 1].content;
            const detection = await orchestrator.detectIntent(lastUserMessage);
            targetAgentId = detection.agentId;
        }

        const agent = agents[targetAgentId];
        const voiceSuffix = `\n\nVOICE MODE: Response must be 1-2 sentences maximum, conversational, NO markdown.`;
        const systemPrompt = agent.persona + voiceSuffix;

        const aiMessage = await orchestrator.routeAndExecute(agent.options.taskType, messages.slice(-6), systemPrompt, modelId);

        // Log action
        await memory.logAction(req.user.uid, targetAgentId, 'voice-chat', aiMessage);

        res.json({ content: aiMessage, agentId: targetAgentId });
    } catch (err) {
        console.error('[voice-chat] Error:', err.message);
        res.status(500).json({ error: err.message || 'Voice chat processing failed' });
    }
});

// ─── TRAINING & AI LAB (SaaS Simulation) ───────────────────────────────────
app.get('/api/training/jobs', authenticate, async (req, res) => {
    try {
        const snap = await db.collection('training_jobs')
            .where('userId', '==', req.user.uid)
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();
        res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { res.status(500).json({ error: 'Failed to fetch jobs' }); }
});

app.post('/api/training/jobs', authenticate, async (req, res) => {
    const { name, modelSize, dataset, params } = req.body;
    try {
        const job = {
            userId: req.user.uid,
            name: name || `NexovGen-${modelSize}-Job`,
            modelSize: modelSize || '7B',
            dataset: dataset || 'NexovGen-Primary',
            status: 'training',
            progress: 0,
            tokens: '0T',
            loss: 4.5,
            throughput: '0 tokens/s',
            eta: 'Calculating...',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            config: params || {}
        };
        const ref = await db.collection('training_jobs').add(job);
        res.json({ id: ref.id, ...job });
    } catch (err) { res.status(500).json({ error: 'Failed to launch job' }); }
});

app.post('/api/training/jobs/:id/stop', authenticate, async (req, res) => {
    try {
        const ref = db.collection('training_jobs').doc(req.params.id);
        const doc = await ref.get();
        if (!doc.exists || doc.data().userId !== req.user.uid) return res.status(404).json({ error: 'Job not found' });
        await ref.update({ status: 'stopped', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        res.json({ message: 'Job stopped' });
    } catch (err) { res.status(500).json({ error: 'Failed to stop job' }); }
});

// ─── TRAINING SIMULATOR ───
setInterval(async () => {
    try {
        const activeJobs = await db.collection('training_jobs')
            .where('status', '==', 'training')
            .limit(50)
            .get();

        const batch = db.batch();
        activeJobs.forEach(doc => {
            const data = doc.data();
            const newProgress = Math.min(100, (data.progress || 0) + (Math.random() * 0.1));
            const newLoss = Math.max(0.8, (data.loss || 4.5) - (Math.random() * 0.005));
            const tokenNum = parseFloat((data.tokens || '0T').replace('T', '')) + 0.001;

            batch.update(doc.ref, {
                progress: parseFloat(newProgress.toFixed(2)),
                loss: parseFloat(newLoss.toFixed(3)),
                tokens: `${tokenNum.toFixed(3)}T`,
                throughput: `${(1000000 + (Math.random() * 200000)).toFixed(0).toLocaleString()} tokens/s`,
                eta: newProgress >= 100 ? 'Completed' : `${Math.ceil((100 - newProgress) * 2)} hours`,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });
        if (!activeJobs.empty) await batch.commit();
    } catch (err) { /* silent simulator failure */ }
}, 10000); // Update every 10s

// ─── AI AUTOMATION WORKFLOW ───────────────────────────────────────────────────

// Scoring prompt sent to the orchestrator
const LEAD_SCORING_SYSTEM_PROMPT = `You are NexovgenGPT Core — an AI lead qualification engine for a SaaS company.

Given an inbound lead payload, you MUST return a single valid JSON object (no markdown, no commentary, raw JSON only) with this exact schema:
{
  "score": <integer 0-100>,
  "tier": <"HOT" | "WARM" | "COLD">,
  "confidence": <float 0.00-1.00>,
  "intent": <"High" | "Medium" | "Low">,
  "urgency": <"Immediate" | "Short-term" | "Long-term">,
  "budget_probability": <float 0.00-1.00>,
  "persona": <"Decision-Maker" | "Influencer" | "Researcher" | "Unknown">,
  "recommended_action": <string — one of: "send_hot_email+notify_sales+offer_calendar" | "send_warm_email+nurture_sequence" | "add_to_drip_campaign">,
  "pain_points": [<string>, <string>],
  "reasoning": <string — 1-2 sentences explaining the score>
}

Scoring rules:
- score > 80 → tier: HOT, recommended_action: "send_hot_email+notify_sales+offer_calendar"
- score 50-79 → tier: WARM, recommended_action: "send_warm_email+nurture_sequence"
- score < 50 → tier: COLD, recommended_action: "add_to_drip_campaign"

Signals that increase score: C-suite/VP/Director title (+20), company > 50 employees (+15), high-intent keywords like "urgent", "deadline", "ASAP", "Q1/Q2", "budget approved" (+20), pricing/demo page reference (+15), referral source (+10), specific pain point stated (+10).
Signals that decrease score: personal email domain like gmail/yahoo (-15), incomplete info (-10), vague message (-10).`;

// POST /api/automation/score — Score a lead using AI
app.post('/api/automation/score', authenticate, async (req, res) => {
    const { firstName, lastName, email, company, jobTitle, companySize, industry, message, source } = req.body;
    if (!email || !company) return res.status(400).json({ error: 'email and company are required' });

    const leadSummary = `
Lead Details:
- Name: ${firstName || ''} ${lastName || ''}
- Email: ${email}
- Company: ${company}
- Job Title: ${jobTitle || 'Unknown'}
- Company Size: ${companySize || 'Unknown'}
- Industry: ${industry || 'Unknown'}
- Source: ${source || 'Website'}
- Message: ${message || 'No message provided'}
`.trim();

    try {
        const raw = await orchestrator.routeAndExecute('strategy', [{ role: 'user', content: `Score this lead:\n\n${leadSummary}` }], LEAD_SCORING_SYSTEM_PROMPT);

        // Extract JSON from the response (handle any surrounding text)
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('AI did not return valid JSON');
        const result = JSON.parse(jsonMatch[0]);

        // Generate personalized email based on tier
        const emailTemplates = {
            HOT: {
                subject: `${firstName || 'there'}, your growth window is open — let's talk`,
                body: `Hi ${firstName || 'there'},\n\nI noticed ${company} is scaling fast in the ${industry || 'SaaS'} space — and your timing couldn't be better.\n\nAt Nexovgen, we've helped companies eliminate ${result.pain_points?.[0] || 'operational bottlenecks'} and ${result.pain_points?.[1] || 'scaling challenges'} — often within the first sprint.\n\nI'd love to show you what that looks like in a focused 20-minute call.\n\n→ [Book a time that works for you]\n\nBest,\nNexovgen Sales Team`
            },
            WARM: {
                subject: `How ${company} can reclaim 12+ hours/week — free resource inside`,
                body: `Hi ${firstName || 'there'},\n\nScaling a ${industry || 'SaaS'} business is tough — especially when your team is spending time on tasks that should be automated.\n\nWe put together a resource specifically for ${companySize || 'growing'}-stage companies: The Nexovgen Automation Playbook.\n\nNo commitment. Just genuine value.\n\nWhenever you're ready, [book a quick discovery call].\n\nNexovgen Team`
            },
            COLD: {
                subject: `A quick idea for ${company}`,
                body: `Hi ${firstName || 'there'},\n\nWe work with ${industry || 'SaaS'} companies to automate their lead and onboarding workflows. Thought it might be relevant to ${company}.\n\nHere's a resource to start: [AI Automation Guide]\n\nFeel free to reach out when the timing is right.\n\nNexovgen Team`
            }
        };

        const tier = result.tier || 'COLD';
        res.json({ ...result, emailPreview: emailTemplates[tier] || emailTemplates.COLD, leadSummary });
    } catch (err) {
        console.error('[automation/score] Error:', err.message);
        res.status(500).json({ error: 'Lead scoring failed: ' + err.message });
    }
});

// POST /api/automation/leads — Save a scored lead to the pipeline
app.post('/api/automation/leads', authenticate, async (req, res) => {
    const lead = req.body;
    if (!lead.email) return res.status(400).json({ error: 'email required' });
    try {
        // Deduplication check
        const existing = await db.collection('automation_leads')
            .where('email', '==', lead.email.toLowerCase().trim())
            .limit(1).get();
        if (!existing.empty) {
            return res.status(409).json({ error: 'Duplicate lead — email already exists in pipeline', existingId: existing.docs[0].id });
        }
        const ref = await db.collection('automation_leads').add({
            ...lead,
            email: lead.email.toLowerCase().trim(),
            userId: req.user.uid,
            reviewStatus: (lead.confidence || 1) < 0.65 ? 'pending_review' : 'auto_processed',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.json({ id: ref.id, message: 'Lead added to pipeline' });
    } catch (err) {
        console.error('[automation/leads POST] Full Error:', err);
        res.status(500).json({ error: 'Failed to save lead: ' + err.message });
    }
});

// GET /api/automation/leads — Fetch pipeline leads
app.get('/api/automation/leads', authenticate, async (req, res) => {
    try {
        const { tier } = req.query;
        let q = db.collection('automation_leads')
            .where('userId', '==', req.user.uid)
            .limit(100); // Increased limit as we'll sort in memory

        const snap = await q.get();
        let leads = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Sort in memory to avoid needing a composite index for createdAt
        leads.sort((a, b) => {
            const timeA = a.createdAt?.toDate?.()?.getTime() || 0;
            const timeB = b.createdAt?.toDate?.()?.getTime() || 0;
            return timeB - timeA;
        });

        if (tier) leads = leads.filter(l => l.tier === tier.toUpperCase());
        res.json(leads);
    } catch (err) {
        console.error('[automation/leads GET] Error details:', err);
        res.status(500).json({ error: 'Failed to fetch leads: ' + err.message });
    }
});

// GET /api/automation/report — Aggregated pipeline report
app.get('/api/automation/report', authenticate, async (req, res) => {
    try {
        const snap = await db.collection('automation_leads')
            .where('userId', '==', req.user.uid)
            .limit(200)
            .get();
        let leads = snap.docs.map(d => d.data());

        // Sort in memory
        leads.sort((a, b) => {
            const timeA = a.createdAt?.toDate?.()?.getTime() || 0;
            const timeB = b.createdAt?.toDate?.()?.getTime() || 0;
            return timeB - timeA;
        });
        const total = leads.length;
        const hot = leads.filter(l => l.tier === 'HOT').length;
        const warm = leads.filter(l => l.tier === 'WARM').length;
        const cold = leads.filter(l => l.tier === 'COLD').length;
        const avgScore = total > 0 ? Math.round(leads.reduce((s, l) => s + (l.score || 0), 0) / total) : 0;
        const avgConfidence = total > 0 ? (leads.reduce((s, l) => s + (l.confidence || 0), 0) / total).toFixed(2) : '0.00';
        const reviewPending = leads.filter(l => l.reviewStatus === 'pending_review').length;
        res.json({ total, hot, warm, cold, avgScore, avgConfidence: parseFloat(avgConfidence), reviewPending, leads: leads.slice(0, 10) });
    } catch (err) {
        console.error('[automation/report]', err.message);
        res.status(500).json({ error: 'Report generation failed' });
    }
});

// GET /api/automation/review — Human review queue
app.get('/api/automation/review', authenticate, async (req, res) => {
    try {
        const snap = await db.collection('automation_leads')
            .where('userId', '==', req.user.uid)
            .where('reviewStatus', '==', 'pending_review')
            .limit(50)
            .get();

        let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Sort in memory
        items.sort((a, b) => {
            const timeA = a.createdAt?.toDate?.()?.getTime() || 0;
            const timeB = b.createdAt?.toDate?.()?.getTime() || 0;
            return timeB - timeA;
        });

        res.json(items.slice(0, 20));
    } catch (err) {
        console.error('[automation/review GET]', err.message);
        res.status(500).json({ error: 'Failed to fetch review queue' });
    }
});

// PATCH /api/automation/review/:id — Resolve a review item
app.patch('/api/automation/review/:id', authenticate, async (req, res) => {
    const { action, overrideTier } = req.body; // action: 'approve' | 'override'
    try {
        const doc = await db.collection('automation_leads').doc(req.params.id).get();
        if (!doc.exists || doc.data().userId !== req.user.uid) return res.status(404).json({ error: 'Not found' });
        const update = { reviewStatus: 'resolved', resolvedAt: admin.firestore.FieldValue.serverTimestamp() };
        if (action === 'override' && overrideTier) update.tier = overrideTier;
        await doc.ref.update(update);
        res.json({ message: 'Review resolved' });
    } catch (err) {
        console.error('[automation/review PATCH]', err.message);
        res.status(500).json({ error: 'Failed to resolve review' });
    }
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({ status: 'NEXOVGEN Orchestration Layer Online', version: '2.2.0-orchestrated', providers: ['OpenAI', 'Anthropic', 'Google', 'DeepSeek'] });
});

// ─── Production Serving / Dev Help ────────────────────────────────────────────
const distPath = join(__dirname, '..', 'dist');
const indexPath = join(distPath, 'index.html');

if (existsSync(indexPath)) {
    // PRODUCTION MODE (e.g. on Render)
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        // If API route not found, don't serve HTML
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({ error: 'API route not found' });
        }
        res.sendFile(indexPath);
    });
} else {
    // DEV MODE help message
    app.get('/', (req, res) => {
        res.send(`
            <div style="font-family: sans-serif; padding: 40px; text-align: center; background: #0a0a0a; color: white; min-height: 100vh; display: flex; flex-direction: column; justify-content: center;">
                <h1 style="color: #3b82f6;">Nexovgen Backend Online</h1>
                <p>This is the API server (Port 5000).</p>
                <div style="margin: 20px; padding: 20px; border: 1px dashed #333; border-radius: 8px;">
                    <p>To see the actual app, please visit:</p>
                    <a href="http://localhost:5173" style="color: #60a5fa; font-size: 24px; font-weight: bold; text-decoration: none;">http://localhost:5173</a>
                </div>
                <p style="color: #666;">(On Render, this server will automatically serve the built app once you deploy)</p>
            </div>
        `);
    });
}

// ─── TEST CRASH ROUTE (INTERNAL) ──────────────────────────────────────────────
app.get('/api/test-crash', (req, res) => {
    throw new Error('Test crash triggered by security layer');
});

// ─── Error Handling Middleware ────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('❌ INTERNAL SERVER ERROR:', err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 NEXOVGEN SaaS Backend v2.1 running on port ${PORT}\n`);
});
