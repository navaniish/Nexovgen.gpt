import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Send, Menu, X, LogOut, Clock, ChevronRight, Home, MessageSquare, BookOpen,
    FileText, Settings, BarChart2, Star, Layers, User,
    Brain, Cpu, FlaskConical, TrendingUp, Zap, Database, Puzzle, Code2,
    FolderOpen, HardDrive, Bot, CreditCard, HelpCircle, Bell, ShieldCheck,
    Users, Package, Lightbulb, LayoutTemplate, LayoutGrid,
    Search, Copy, Check, Sparkles, Mic, Square, Command as CommandIcon, Trash2,
    Plus, ChevronDown, Volume2, VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged,
    signOut
} from 'firebase/auth';
import { auth, googleProvider } from './lib/firebase';
import Pricing from './components/Pricing';
import Logo from './components/Logo';
import Templates from './components/Templates';
import Auth from './components/Auth';
import SettingsPanel from './components/Settings';
import SearchHero from './components/SearchHero';
import SearchBar from './components/SearchBar';
import CommandOverlay from './components/CommandOverlay';
import NeuralCanvas from './components/NeuralCanvas';
import HexBackground from './components/HexBackground';
import AILab from './components/AILab';
import AutomationHub from './components/AutomationHub';

import { db, collection, getDocs, query, where, doc, getDoc, updateDoc, setDoc } from './lib/firebase';
import { getOrchestratedResponse, getVoiceResponse } from './lib/openai';

import FaceToFace from './components/FaceToFace';
import { applyAppearance, watchSystemTheme } from './lib/appearance';
import { useAppearance } from './lib/AppearanceContext';
import { useLanguage } from './lib/LanguageContext';
import { useWakeWord } from './hooks/useWakeWord';


const INITIAL_TEMPLATES = [
    {
        id: 't1',
        name: 'Startup MVP Blueprint',
        description: 'Generates a full technical and business roadmap for any startup idea.',
        type: 'workflow',
        author: 'NexovGen AI',
        uses: 1240,
        tags: ['Startup', 'Business'],
        content: "You are the AI Founder Mentor. I need a blueprint for my startup: {{StartupName}}. The industry is {{Industry}} and the goal is {{Goal}}.\n\nProvide:\n1. Tech stack recommendation.\n2. 30-day roadmap.\n3. Monetization strategy.",
    },
    {
        id: 't2',
        name: 'React Component Architect',
        description: 'High-performance React components with Tailwind and Framer Motion.',
        type: 'prompt',
        author: 'Engineering Dept',
        uses: 850,
        tags: ['React', 'Frontend'],
        content: "Draft a React component called {{ComponentName}}. Use Tailwind for styling. Feature: {{Feature}}. Ensure it's responsive and includes Framer Motion animations.",
    },
    {
        id: 't3',
        name: 'Deep RAG Optimizer',
        description: 'Optimizes RAG pipelines for better retrieval and lower latency.',
        type: 'agent',
        author: 'AI Research',
        uses: 420,
        tags: ['AI', 'Infrastructure'],
        content: "Analyze this RAG architecture: {{Architecture}}. Suggest improvements for chunking strategy and embedding model selection.",
    }
];


// ─── 6 Autonomous Agents ──────────────────────────────────────────────────────
const MENTORS = [
    {
        id: 'idea_analyzer', name: 'Idea Analyzer', icon: Brain,
        color: '#06b6d4', role: 'Validation & Refinement', mode: '🚀 Strategy Mode',
        tagline: 'SWOT · ICP · Feasibility',
        quickActions: ['Analyze my business idea', 'Identify my target audience', 'Generate a SWOT analysis'],
        greeting: (n) => `🧠 **Idea Analyzer online.** Hello ${n}!\n\nI'm specialized in taking raw ideas and turning them into battle-ready business blueprints.\n\n*What idea are we validating today?*`,
        prompt: `You are the Nexovgen Idea Analyzer. Your role is to take raw startup ideas and transform them into structured business concepts. Focus on SWOT, ICP, and feasibility.`
    },
    {
        id: 'market_research', name: 'Market Research AI', icon: FlaskConical,
        color: '#10b981', role: 'Real-time Market Context', mode: '🔍 Research Mode',
        tagline: 'Competitors · Trends · Data',
        quickActions: ['Find my top 3 competitors', 'Analyze industry trends', 'What are the current market gaps?'],
        greeting: (n) => `🔍 **Market Research AI online.** Data is ready, ${n}.\n\nI scrape and analyze real-time market signals to give you a competitive edge.\n\n*What industry are we digging into?*`,
        prompt: `You are the Nexovgen Market Research AI. Your role is to analyze market trends, competitor landscapes, and user sentiment.`
    },
    {
        id: 'content_generator', name: 'Content Generator', icon: TrendingUp,
        color: '#f59e0b', role: 'Multi-channel Marketing', mode: '📈 Growth Mode',
        tagline: 'Copy · SEO · Social',
        quickActions: ['Write a LinkedIn post hook', 'Draft an SEO article outline', 'Create a cold email script'],
        greeting: (n) => `📈 **Content Generator online.** Let's get loud, ${n}.\n\nI create high-converting copy, marketing strategies, and content funnels.\n\n*What channel are we conquering?*`,
        prompt: `You are the Nexovgen Content Generator. Your role is to create high-converting marketing copy, SEO articles, and social media content.`
    },
    {
        id: 'automation_builder', name: 'Automation Builder', icon: Zap,
        color: '#ec4899', role: 'Workflow Orchestration', mode: '⚡ Automation Mode',
        tagline: 'Logic · API · Workflow',
        quickActions: ['Design a lead nurture flow', 'Connect Notion to my app', 'Automate my Slack notifications'],
        greeting: (n) => `⚡ **Automation Builder online.** System check complete, ${n}.\n\nI design logic-driven workflows to eliminate manual work and connect your stack.\n\n*What workflow are we automating?*`,
        prompt: `You are the Nexovgen Automation Builder. Your role is to design efficient workflow logic and connect APIs.`
    },
    {
        id: 'code_generator', name: 'Code Generator', icon: Cpu,
        color: '#8b5cf6', role: 'Technical Implementation', mode: '💻 Dev Mode',
        tagline: 'React · Node · API',
        quickActions: ['Scaffold a React component', 'Build a database schema', 'Explain this API error'],
        greeting: (n) => `💻 **Code Generator online.** Terminal ready, ${n}.\n\nI write production-grade code, design schemas, and build scalable backends.\n\n*What are we coding?*`,
        prompt: `You are the Nexovgen Code Generator. Your role is to write high-quality, production-ready code.`
    },
    {
        id: 'execution_manager', name: 'Execution Manager', icon: Check,
        color: '#6366f1', role: 'Quality & Orchestration', mode: '🎯 OS Mode',
        tagline: 'QC · Delivery · Status',
        quickActions: ['Review project progress', 'Check agent status', 'Finalize my output'],
        greeting: (n) => `🎯 **Execution Manager online.** Monitoring all systems, ${n}.\n\nI orchestrate the other agents and ensure every output matches your requirements.\n\n*How can I help you manage the OS?*`,
        prompt: `You are the Nexovgen Execution Manager. Your role is to orchestrate agents, validate outputs, and manage delivery.`
    }
];

// ─── Code Block ───────────────────────────────────────────────────────────────
function CodeBlock({ children, language }) {
    const [copied, setCopied] = useState(false);
    const copy = () => { navigator.clipboard.writeText(String(children).replace(/\n$/, '')); setCopied(true); setTimeout(() => setCopied(false), 2000); };
    return (
        <div className="my-4 rounded-xl overflow-hidden border border-white/10">
            <div className="flex items-center justify-between px-4 py-2 bg-white/5">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{language}</span>
                <button onClick={copy} className="p-1 hover:bg-white/10 rounded">
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
                </button>
            </div>
            <SyntaxHighlighter style={atomDark} language={language} PreTag="div" className="!m-0 !rounded-none !text-sm">
                {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
        </div>
    );
}

// ─── Typewriter Hook ──────────────────────────────────────────────────────────
function useTypewriter(text, speed = 8, enabled = true) {
    const [displayed, setDisplayed] = useState('');
    const [done, setDone] = useState(false);
    const idxRef = useRef(0);
    const rafRef = useRef(null);
    const lastTimeRef = useRef(0);

    useEffect(() => {
        if (!enabled) {
            setDisplayed(text);
            setDone(true);
            return;
        }
        // Reset when text changes
        idxRef.current = 0;
        setDisplayed('');
        setDone(false);

        const CHARS_PER_FRAME = speed; // characters revealed per animation frame

        const tick = (timestamp) => {
            if (timestamp - lastTimeRef.current < 16) {
                rafRef.current = requestAnimationFrame(tick);
                return;
            }
            lastTimeRef.current = timestamp;

            idxRef.current = Math.min(idxRef.current + CHARS_PER_FRAME, text.length);
            setDisplayed(text.slice(0, idxRef.current));

            if (idxRef.current < text.length) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                setDone(true);
            }
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [text, enabled]);

    return { displayed, done };
}

// ─── Typed Assistant Message ───────────────────────────────────────────────────
function TypedMessage({ content, isLatest, mentorColor, CodeBlock, remarkGfm }) {
    const { displayed, done } = useTypewriter(content, 12, isLatest);
    const text = isLatest ? displayed : content;

    return (
        <div className="prose prose-invert max-w-none text-sm" style={{ position: 'relative' }}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({ inline, className, children }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match
                            ? <CodeBlock language={match[1]}>{children}</CodeBlock>
                            : <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.85em', color: mentorColor }}>{children}</code>;
                    },
                    h2: ({ children }) => <h2 style={{ fontSize: '15px', fontWeight: 700, color: mentorColor, margin: '14px 0 6px' }}>{children}</h2>,
                    h3: ({ children }) => <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#fff', margin: '10px 0 4px' }}>{children}</h3>,
                    p: ({ children }) => <p style={{ margin: '0 0 8px' }}>{children}</p>,
                    ul: ({ children }) => <ul style={{ paddingLeft: '18px', margin: '6px 0' }}>{children}</ul>,
                    ol: ({ children }) => <ol style={{ paddingLeft: '18px', margin: '6px 0' }}>{children}</ol>,
                    table: ({ children }) => <div style={{ overflowX: 'auto', margin: '10px 0' }}><table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px' }}>{children}</table></div>,
                    th: ({ children }) => <th style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>{children}</th>,
                    td: ({ children }) => <td style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '5px 10px', color: '#9ca3af' }}>{children}</td>,
                }}
            >
                {text}
            </ReactMarkdown>
            {isLatest && !done && (
                <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.7, repeat: Infinity }}
                    style={{
                        display: 'inline-block',
                        width: '2px',
                        height: '1em',
                        background: mentorColor,
                        marginLeft: '2px',
                        verticalAlign: 'text-bottom',
                        borderRadius: '1px',
                    }}
                />
            )}
        </div>
    );
}

// ─── Sidebar Helpers ──────────────────────────────────────────────────────────
function SidebarSection({ label, children }) {
    return (
        <div style={{ marginBottom: '20px' }}>
            <p style={{
                fontSize: '9px', fontWeight: 700, color: '#2d3748',
                textTransform: 'uppercase', letterSpacing: '0.2em',
                padding: '0 10px 8px', margin: 0
            }}>{label}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {children}
            </div>
        </div>
    );
}

function SidebarItem({ icon: Icon, label, sub, onClick }) {
    return (
        <button onClick={onClick} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
            padding: '7px 10px', borderRadius: '9px', background: 'none',
            border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s'
        }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
            <div style={{
                width: '28px', height: '28px', borderRadius: '7px',
                background: 'rgba(255,255,255,0.05)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
                <Icon style={{ width: '13px', height: '13px', color: '#6b7280' }} />
            </div>
            <div>
                <p style={{ fontSize: '12px', fontWeight: 500, color: '#9ca3af', margin: 0 }}>{label}</p>
                {sub && <p style={{ fontSize: '9px', color: '#374151', margin: 0 }}>{sub}</p>}
            </div>
        </button>
    );
}



// ─── All Chats Panel ──────────────────────────────────────────────────────────

function AllChatsPanel({ history, groupedHistory, onSelect, onDelete, onClose }) {
    const [search, setSearch] = React.useState('');

    const filtered = React.useMemo(() => {
        if (!search.trim()) return groupedHistory;
        const q = search.toLowerCase();
        const result = {};
        Object.entries(groupedHistory).forEach(([label, items]) => {
            const matched = items.filter(item =>
                item.messages?.some(m => m.content?.toLowerCase().includes(q))
            );
            if (matched.length) result[label] = matched;
        });
        return result;
    }, [search, groupedHistory]);

    const totalCount = history.length;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed', inset: 0, zIndex: 260,
                background: 'rgba(5,7,10,0.97)', backdropFilter: 'blur(20px)',
                fontFamily: "'Outfit', sans-serif", display: 'flex', flexDirection: 'column',
            }}
        >
            {/* Header */}
            <div style={{
                padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(0,0,0,0.3)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0 }}>All Chats</h1>
                        <p style={{ fontSize: 12, color: '#4b5563', margin: 0, marginTop: 2 }}>
                            {totalCount} conversation{totalCount !== 1 ? 's' : ''} saved
                        </p>
                    </div>
                </div>
                {/* Search */}
                <div style={{
                    flex: 1, maxWidth: 400, margin: '0 32px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12, padding: '8px 14px',
                }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search conversations…"
                        autoFocus
                        style={{
                            flex: 1, background: 'none', border: 'none', outline: 'none',
                            color: '#fff', fontSize: 13, fontFamily: "'Outfit', sans-serif",
                        }}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', padding: 0, display: 'flex' }}>
                            <X size={14} />
                        </button>
                    )}
                </div>
                <button
                    onClick={onClose}
                    style={{
                        width: 40, height: 40, borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.04)',
                        color: '#9ca3af', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <X size={18} />
                </button>
            </div>

            {/* Chat grid */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px 32px' }}>
                {Object.keys(filtered).length === 0 ? (
                    <div style={{ textAlign: 'center', paddingTop: 80 }}>
                        <p style={{ fontSize: 15, color: '#374151', fontWeight: 600 }}>
                            {search ? 'No chats match your search.' : 'No chat history yet.'}
                        </p>
                    </div>
                ) : (
                    Object.entries(filtered).map(([label, items]) => (
                        <div key={label} style={{ marginBottom: 40 }}>
                            <p style={{
                                fontSize: 10, fontWeight: 800, color: '#374151',
                                textTransform: 'uppercase', letterSpacing: '0.18em',
                                marginBottom: 14,
                            }}>{label}</p>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: 12,
                            }}>
                                {items.map(item => {
                                    const firstMsg = item.messages?.[0]?.content || 'Chat session';
                                    const msgCount = item.messages?.length || 0;
                                    const preview = firstMsg.slice(0, 120);
                                    return (
                                        <motion.div
                                            key={item.id}
                                            whileHover={{ y: -3, borderColor: 'rgba(79,142,247,0.35)' }}
                                            onClick={() => onSelect(item)}
                                            style={{
                                                padding: '18px 20px', borderRadius: 16, cursor: 'pointer',
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.07)',
                                                transition: 'all 0.2s', position: 'relative',
                                            }}
                                        >
                                            {/* Message count badge */}
                                            <div style={{
                                                position: 'absolute', top: 14, right: 14,
                                                display: 'flex', alignItems: 'center', gap: 6,
                                            }}>
                                                <span style={{
                                                    fontSize: 9, fontWeight: 800, color: '#374151',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    padding: '2px 7px', borderRadius: 6,
                                                }}>
                                                    {msgCount} msg{msgCount !== 1 ? 's' : ''}
                                                </span>
                                                <button
                                                    onClick={e => { e.stopPropagation(); onDelete(e, item.id); }}
                                                    style={{
                                                        background: 'none', border: 'none', cursor: 'pointer',
                                                        color: '#374151', padding: '2px', display: 'flex',
                                                        transition: 'color 0.15s',
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                                    onMouseLeave={e => e.currentTarget.style.color = '#374151'}
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>

                                            {/* Preview */}
                                            <p style={{
                                                fontSize: 13, fontWeight: 600, color: '#d1d5db',
                                                margin: '0 0 6px', paddingRight: 60,
                                                overflow: 'hidden', display: '-webkit-box',
                                                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                            }}>
                                                {preview}{firstMsg.length > 120 ? '…' : ''}
                                            </p>
                                            <p style={{ fontSize: 11, color: '#4b5563', margin: 0, fontWeight: 500 }}>
                                                Click to continue →
                                            </p>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </motion.div>
    );
}


// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
    const { appearance } = useAppearance();
    const { lang, setLang, LANGUAGES, LANGUAGE_GROUPS } = useLanguage();
    const [user, setUser] = useState(null);
    const [checking, setChecking] = useState(true);
    const [mentor, setMentor] = useState(MENTORS[0]);
    const [messages, setMessages] = useState([]);
    const [history, setHistory] = useState([]);
    const [input, setInput] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [loading, setLoading] = useState(false);
    const [showMentorPicker, setShowMentorPicker] = useState(false);
    const [showPricing, setShowPricing] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [templates, setTemplates] = useState(INITIAL_TEMPLATES);
    const [templateToApply, setTemplateToApply] = useState(null);
    const [templateVars, setTemplateVars] = useState({});
    const [isListening, setIsListening] = useState(false);
    const [showCommands, setShowCommands] = useState(false);
    const [userPlan, setUserPlan] = useState({ id: 'free', name: 'Free' });
    const [showSettings, setShowSettings] = useState(false);
    const [showFaceMode, setShowFaceMode] = useState(false);
    const [wakeTriggered, setWakeTriggered] = useState(false);
    const [showAILab, setShowAILab] = useState(false);
    const [showAutomationHub, setShowAutomationHub] = useState(false);
    const [showAllChats, setShowAllChats] = useState(false);
    const [isSwarmLoop, setIsSwarmLoop] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [chatMode, setChatMode] = useState('Planning');
    const [chatModel, setChatModel] = useState('Gemini 2.0 Flash');
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [isAutoSpeakEnabled, setIsAutoSpeakEnabled] = useState(false);
    const [showLangPicker, setShowLangPicker] = useState(false);
    const [settings, setSettings] = useState(() => {
        try { return { wakeWordEnabled: true, ...JSON.parse(localStorage.getItem('nxv_settings') || '{}') }; }
        catch { return { wakeWordEnabled: true }; }
    });

    const endRef = useRef(null);
    const inputAreaRef = useRef(null);
    const fileInputRef = useRef(null);
    const recognitionRef = useRef(null);
    const isFirstLoad = useRef(true);
    const synthRef = useRef(window.speechSynthesis);

    // Derived / alias
    const accentColor = appearance.accentColor || '#4F8EF7';
    const sidebarOpen = isSidebarOpen;
    const setSidebarOpen = setIsSidebarOpen;

    const handleWake = useCallback(() => {
        setWakeTriggered(true);
        setShowFaceMode(true);
    }, []);

    const { wakeActive, status, restart } = useWakeWord({
        enabled: !!user && !showFaceMode && !isListening && settings.wakeWordEnabled,
        onWake: handleWake,
        lang: lang?.code || 'en-US',
    });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        let resolved = false;
        const timeout = setTimeout(() => { if (!resolved) { resolved = true; setChecking(false); } }, 4000);
        const unsub = onAuthStateChanged(auth, async u => {
            if (!resolved) { resolved = true; clearTimeout(timeout); }
            setUser(u);
            if (u) {
                try {
                    const snap = await getDoc(doc(db, 'users', u.uid));
                    if (snap.exists() && snap.data().plan) setUserPlan(snap.data().plan);
                    else await setDoc(doc(db, 'users', u.uid), { plan: { id: 'free', name: 'Free' } }, { merge: true });
                } catch (err) { console.error('Plan Error:', err); }
            }
            setChecking(false);
        });
        return () => { unsub(); clearTimeout(timeout); };
    }, []);

    useEffect(() => {
        const h = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowSearch(true); } };
        window.addEventListener('keydown', h);
        const l = () => { window.speechSynthesis.getVoices(); };
        if (window.speechSynthesis.onvoiceschanged !== undefined) window.speechSynthesis.onvoiceschanged = l;
        l();
        return () => { window.removeEventListener('keydown', h); if (window.speechSynthesis.onvoiceschanged !== undefined) window.speechSynthesis.onvoiceschanged = null; };
    }, []);

    useEffect(() => {
        const h = (e) => { if (activeDropdown && !e.target.closest('.dropdown-container')) setActiveDropdown(null); };
        window.addEventListener('mousedown', h);
        return () => window.removeEventListener('mousedown', h);
    }, [activeDropdown]);

    useEffect(() => { if (user) fetchUserTemplates(); }, [user?.uid]);
    useEffect(() => { if (user) { setMessages([]); fetchHistory(); } }, [user?.uid]);

    useEffect(() => {
        if (!user) return;
        if (!isFirstLoad.current) setMessages([{ role: 'assistant', content: mentor.greeting(user.displayName || 'User') }]);
        isFirstLoad.current = false;
    }, [mentor.id]);

    useEffect(() => {
        if (inputAreaRef.current) {
            inputAreaRef.current.style.height = 'auto';
            inputAreaRef.current.style.height = `${Math.min(inputAreaRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const fetchHistory = async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/chats', { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setHistory(await res.json());
        } catch { /* silent */ }
    };

    const fetchUserTemplates = async () => {
        if (!user) return;
        try {
            const q = query(collection(db, 'templates'), where('userId', '==', user.uid));
            const querySnapshot = await getDocs(q);
            const userTemplates = querySnapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                author: 'Me'
            }));
            setTemplates([...INITIAL_TEMPLATES, ...userTemplates]);
        } catch (error) {
            console.error("Error fetching templates:", error);
        }
    };


    // Voice Input Logic
    const toggleVoice = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            // Unlock speech synthesis on first interaction for strict browsers
            const silent = new SpeechSynthesisUtterance("");
            silent.volume = 0;
            window.speechSynthesis.speak(silent);

            setIsListening(true);
            setIsAutoSpeakEnabled(true);
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                alert("Your browser does not support Speech Recognition.");
                setIsListening(false);
                return;
            }
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = lang.code; // ← use selected language

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(prev => prev + (prev.length > 0 ? ' ' : '') + transcript);
                setIsListening(false);
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
            recognition.start();
        }
    };

    const speak = (text) => {
        if (!text || !window.speechSynthesis) return;

        // Basic cleanup for speech (remove markdown)
        const cleanText = text.replace(/[*#_]/g, '').replace(/\[.*?\]\(.*?\)/g, '').replace(/`{1,3}[\s\S]*?`{1,3}/g, '');

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = lang.code; // ← use selected language

        const setVoiceAndSpeak = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                // Try to find a voice matching the selected language code
                const langCode = lang.code;
                const preferredVoice =
                    voices.find(v => v.lang === langCode && v.name.includes('Google')) ||
                    voices.find(v => v.lang === langCode) ||
                    voices.find(v => v.lang.startsWith(langCode.split('-')[0])) ||
                    voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
                    voices[0];
                if (preferredVoice) utterance.voice = preferredVoice;

                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                window.speechSynthesis.speak(utterance);
            } else {
                setTimeout(setVoiceAndSpeak, 100);
            }
        };

        setVoiceAndSpeak();
    };


    const handleFileUpload = (e) => {

        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Filter for images and PDFs only
        const validFiles = files.filter(file =>
            file.type.startsWith('image/') || file.type === 'application/pdf'
        );

        if (validFiles.length < files.length) {
            alert("Only images and PDFs are allowed.");
        }

        if (validFiles.length === 0) return;

        const newAttachments = validFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: file.size,
            type: file.type,
            file: file
        }));

        setAttachments(prev => [...prev, ...newAttachments]);
        e.target.value = '';
    };

    const removeAttachment = (id) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInput(val);

        // Detect Commands
        if (val.startsWith('/')) {
            setShowCommands(true);
            if (val === '/swarm') {
                setIsSwarmLoop(true);
                setInput('');
                setShowCommands(false);
                setMessages(prev => [...prev, { role: 'assistant', content: '🎯 **Swarm Mode Activated:** Nexovgen will now run every prompt through the full 6-agent sequential loop (Idea → Research → Content → Automation → Code → Results).' }]);
            }
            if (val === '/exit') {
                setIsSwarmLoop(false);
                setInput('');
                setShowCommands(false);
                setMessages(prev => [...prev, { role: 'assistant', content: 'Standard single-agent mode restored.' }]);
            }
        } else {
            setShowCommands(false);
        }

        // Auto-expand textarea
        if (inputAreaRef.current) {
            inputAreaRef.current.style.height = 'auto';
            inputAreaRef.current.style.height = `${Math.min(inputAreaRef.current.scrollHeight, 200)}px`;
        }
    };

    const handleCommandSelect = (item) => {
        if (item.type === 'mentor') setMentor(item.data);
        if (item.type === 'template') {
            setTemplateToApply(item.data);
            setTemplateVars({});
        }
        setInput('');
        setShowCommands(false);
    };

    const handlePlanSelect = async (tier) => {
        if (!user) return;
        const newPlan = { id: tier.id, name: tier.name };
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { plan: newPlan });
            setUserPlan(newPlan);
            setShowPricing(false);
            const systemMsg = `🚀 **Plan Upgraded:** You are now on the **${tier.name}** plan. Your limits have been updated.`;
            setMessages(prev => [...prev, { role: 'assistant', content: systemMsg }]);
        } catch (err) {
            console.error('Error updating plan:', err);
        }
    };

    const send = async (text) => {
        const t = text || input;
        if (!t.trim() && attachments.length === 0 || loading) return;
        const userMsg = { role: 'user', content: t, attachments: attachments };
        const newMsgs = [...messages, userMsg];
        setMessages(newMsgs);
        setInput('');
        setAttachments([]); // Reset attachments
        setLoading(true);
        try {
            const content = await getOrchestratedResponse(newMsgs.slice(-8), mentor.id, chatMode, chatModel, lang, isSwarmLoop);

            const assistantMsg = { role: 'assistant', content: content };
            setMessages(prev => [...prev, assistantMsg]);

            // Auto-speak if enabled
            if (isAutoSpeakEnabled) {
                speak(content);
            }

            fetchHistory();
        } catch (error) {
            console.error("Chat error:", error);
            const isQuota = error.message.toLowerCase().includes('quota') || error.message.includes('429');
            const errMsg = isQuota
                ? '⚠️ **AI Quota exceeded.** All available intelligence providers are currently capped. Please check your billing dashboard.'
                : `⚠️ **Intelligence Layer Error.** ${error.message}\n\n*Check the console for detailed error traces.*`;

            setMessages(prev => [...prev, { role: 'assistant', content: errMsg, error: true }]);
        } finally { setLoading(false); }
    };





    const deleteChat = async (e, chatId) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this chat?')) return;

        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/chats/${chatId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setHistory(prev => prev.filter(c => c.id !== chatId));
                // If we are currently viewing this chat, clear messages
                // We'll check if the current messages match the deleted chat's messages
                // or just clear if the history item we just deleted was the "active" one.
                // Since we don't have an explicit 'activeChatId', we can compare.
                fetchHistory();
            } else {
                alert('Failed to delete chat');
            }
        } catch (error) {
            console.error('Delete chat error:', error);
        }
    };


    const logout = () => signOut(auth).then(() => setUser(null));

    // Loading
    if (checking) return (
        <div style={{ fontFamily: "'Outfit', sans-serif" }} className="min-h-screen bg-[#05070a] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <Brain className="w-7 h-7 text-cyan-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-cyan-500 font-bold uppercase tracking-[0.4em]">Loading NEXOVGEN...</p>
            </div>
        </div>
    );

    if (!user) return <Auth onAuth={setUser} />;

    const userName = user.displayName || user.email?.split('@')[0] || 'User';
    const Icon = mentor.icon;
    const isHome = messages.length === 0;
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

    // Group history by date
    const groupedHistory = history.reduce((acc, item) => {
        const ts = item.timestamp?.seconds ? new Date(item.timestamp.seconds * 1000) : new Date();
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        const label = ts >= today ? 'Today' : ts >= yesterday ? 'Yesterday' : ts > new Date(today - 7 * 86400000) ? 'This Week' : 'Earlier';
        if (!acc[label]) acc[label] = [];
        acc[label].push(item);
        return acc;
    }, {});

    return (
        <>
            <HexBackground />

            {/* Settings Modal */}
            <AnimatePresence>
                {showSettings && (
                    <SettingsPanel user={user} onClose={() => setShowSettings(false)} />
                )}
            </AnimatePresence>

            {/* Pricing Modal */}
            <AnimatePresence>
                {showPricing && (
                    <Pricing
                        onClose={() => setShowPricing(false)}
                        currentPlanId={userPlan.id}
                        onSelectPlan={handlePlanSelect}
                    />
                )}
            </AnimatePresence>
            {showTemplates && <Templates
                user={user}
                onClose={() => setShowTemplates(false)}
                onTemplatesChange={fetchUserTemplates}
                templates={templates}
                onApply={(t) => {
                    setTemplateToApply(t);
                    setTemplateVars({});
                    setShowTemplates(false);
                }}
            />}

            <SearchBar
                isOpen={showSearch}
                onClose={() => setShowSearch(false)}
                history={history}
                templates={templates}
                onSelectChat={(chat) => {
                    setMessages(chat?.messages || []);
                    setShowSearch(false);
                }}
                onSelectTemplate={(t) => {
                    if (t) {
                        setTemplateToApply(t);
                        setTemplateVars({});
                    } else {
                        setShowTemplates(true);
                    }
                    setShowSearch(false);
                }}
                setShowPricing={setShowPricing}
                logout={logout}
            />

            <AnimatePresence>
                {showFaceMode && (
                    <FaceToFace
                        isOpen={showFaceMode}
                        onClose={() => { setShowFaceMode(false); setWakeTriggered(false); }}
                        mentor={mentor}
                        userName={userName}
                        lang={lang}
                        autoListen={wakeTriggered}
                        onMentorChange={(pid) => {
                            const found = MENTORS.find(m => m.id === pid);
                            if (found) setMentor(found);
                        }}
                        onSendMessage={async (text) => {
                            const userMsg = { role: 'user', content: text };
                            const newMsgs = [...messages, userMsg];
                            setMessages(newMsgs);
                            // Use voice-optimized endpoint for concise, TTS-friendly responses
                            const content = await getVoiceResponse(newMsgs.slice(-6), mentor.id, chatModel, lang);
                            setMessages(prev => [...prev, { role: 'assistant', content: content }]);
                            fetchHistory();
                            return content;
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Template Variable Modal */}
            <AnimatePresence>
                {templateToApply && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(10,12,16,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                            style={{ width: '100%', maxWidth: 500, background: '#111318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 32, boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}
                        >
                            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 8 }}>{templateToApply.name}</h2>
                            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Fill in the variables to initialize this blueprint.</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                                {[...new Set(templateToApply.content.match(/\{\{(.*?)\}\}/g) || [])].map(match => {
                                    const varName = match.replace('{{', '').replace('}}', '');
                                    return (
                                        <div key={match}>
                                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: 8 }}>{varName}</label>
                                            <input
                                                type="text"
                                                placeholder={`Enter values for ${varName}...`}
                                                value={templateVars[varName] || ''}
                                                onChange={e => setTemplateVars({ ...templateVars, [varName]: e.target.value })}
                                                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none' }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button
                                    onClick={() => setTemplateToApply(null)}
                                    style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        let finalPrompt = templateToApply.content;
                                        Object.entries(templateVars).forEach(([key, val]) => {
                                            finalPrompt = finalPrompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
                                        });
                                        send(finalPrompt);
                                        setTemplateToApply(null);
                                    }}
                                    style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 800 }}
                                >
                                    Initialize Execution
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>



            <div style={{ fontFamily: "'Outfit', sans-serif", display: 'flex', height: '100vh', width: '100%', background: 'transparent', color: '#fff', overflow: showPricing ? 'visible' : 'hidden', position: 'relative' }}>
                {/* ── GLOBAL BACKGROUND ── */}

                {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <>
                            {/* Mobile overlay */}
                            <div onClick={() => setSidebarOpen(false)}
                                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40, display: window.innerWidth > 1024 ? 'none' : 'block' }} />

                            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
                                transition={{ type: 'spring', damping: 26, stiffness: 200 }}
                                style={{
                                    width: isMobile ? '80%' : '220px', minWidth: isMobile ? 'unset' : '220px',
                                    maxWidth: '280px', height: '100%', display: 'flex', flexDirection: 'column',
                                    background: 'rgba(8,12,22,0.78)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                                    borderRight: '1px solid rgba(255,255,255,0.07)',
                                    position: isMobile ? 'fixed' : 'relative', zIndex: 50,
                                }}>

                                {/* Logo & Home Link */}
                                <div style={{ padding: '16px 14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <div
                                        onClick={() => setMessages([])}
                                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                        className="hover:opacity-80 transition-opacity"
                                    >
                                        <Logo size="sm" />
                                    </div>
                                    <button onClick={() => setSidebarOpen(false)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', padding: '2px', display: window.innerWidth <= 1024 ? 'block' : 'none' }}>
                                        <X style={{ width: '14px', height: '14px' }} />
                                    </button>
                                </div>

                                {/* Search */}
                                <div style={{ padding: '0 10px 10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '9px', padding: '7px 10px' }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                                        <span style={{ fontSize: '12px', color: '#374151' }}>Search chats</span>
                                        <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#2d3748', fontWeight: 700 }}>⌘K</span>
                                    </div>
                                </div>

                                {/* Primary Nav */}
                                <div style={{ padding: '0 10px' }}>
                                    {[
                                        { icon: Home, label: 'Home', action: () => { setMessages([]); if (isMobile) setIsSidebarOpen(false); } },
                                        { icon: Sparkles, label: 'Mentors', action: () => { setShowMentorPicker(true); if (isMobile) setIsSidebarOpen(false); } },
                                        { icon: Mic, label: 'Face to Face', action: () => { setShowFaceMode(true); if (isMobile) setIsSidebarOpen(false); } },
                                        { icon: Zap, label: 'Automation Hub', action: () => { setShowAutomationHub(true); if (isMobile) setIsSidebarOpen(false); } },
                                        { icon: FlaskConical, label: 'AI Research Lab', action: () => { setShowAILab(true); if (isMobile) setIsSidebarOpen(false); } },
                                        { icon: LayoutGrid, label: 'All Chats', action: () => { setShowAllChats(true); if (isMobile) setIsSidebarOpen(false); } },
                                        { icon: Search, label: 'Search', action: () => { setShowSearch(true); if (isMobile) setIsSidebarOpen(false); } },
                                        { icon: LayoutTemplate, label: 'Templates', action: () => { setShowTemplates(true); if (isMobile) setIsSidebarOpen(false); } },
                                        { icon: CreditCard, label: 'Pricing', action: () => { setShowPricing(true); if (isMobile) setIsSidebarOpen(false); } },
                                        { icon: Settings, label: 'Appearance', action: () => { setShowSettings(true); if (isMobile) setIsSidebarOpen(false); } },
                                    ].map(({ icon: NavIcon, label, action }) => (
                                        <button key={label} onClick={action}
                                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: '1px', transition: 'background 0.15s' }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.background = accentColor + '18';
                                                e.currentTarget.querySelector('.nav-icon').style.color = accentColor;
                                                e.currentTarget.querySelector('.nav-label').style.color = accentColor;
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = 'none';
                                                e.currentTarget.querySelector('.nav-icon').style.color = '#6b7280';
                                                e.currentTarget.querySelector('.nav-label').style.color = '#9ca3af';
                                            }}>
                                            <NavIcon className="nav-icon" style={{ width: '15px', height: '15px', color: '#6b7280', transition: 'color 0.15s' }} />
                                            <span className="nav-label" style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 500, transition: 'color 0.15s' }}>{label}</span>
                                        </button>
                                    ))}
                                </div>

                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '8px 14px' }} />

                                {/* Chat History — date grouped */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
                                    {Object.entries(groupedHistory).map(([label, items]) => (
                                        <div key={label} style={{ marginBottom: '12px' }}>
                                            <p style={{ fontSize: '10px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '4px 10px 6px', margin: 0 }}>{label}</p>
                                            {items.slice(0, 5).map(item => (
                                                <div key={item.id} style={{ position: 'relative' }} className="group">
                                                    <button onClick={() => setMessages(item.messages || [])}
                                                        style={{ width: '100%', display: 'block', padding: '6px 10px', borderRadius: '7px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: '1px' }}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                                        <span style={{ fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', paddingRight: '20px' }}>
                                                            {item.messages?.[0]?.content?.slice(0, 38) || 'Chat session'}...
                                                        </span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => deleteChat(e, item.id)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                        style={{
                                                            position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                                                            background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                                                            color: '#4b5563', zIndex: 10
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                                        onMouseLeave={e => e.currentTarget.style.color = '#4b5563'}
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                    {history.length === 0 && (
                                        <p style={{ fontSize: '11px', color: '#2d3748', textAlign: 'center', padding: '20px 10px' }}>No chat history yet</p>
                                    )}
                                </div>

                                {/* User card */}
                                <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#0891b2,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
                                            {userName.charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: '12px', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</p>
                                            <p style={{ fontSize: '9px', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{userPlan.name}</p>
                                        </div>
                                        <button onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', padding: '4px' }}
                                            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                            onMouseLeave={e => e.currentTarget.style.color = '#4b5563'}>
                                            <LogOut style={{ width: '14px', height: '14px' }} />
                                        </button>
                                    </div>
                                </div>
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>

                {/* ── MAIN ──────────────────────────────────────────────────────── */}
                <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', overflow: 'hidden' }}>

                    {/* Top bar — isolation:isolate + translateZ(0) prevents backdrop-filter repaint flicker */}
                    <div style={{
                        height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                        background: 'rgba(10,12,16,0.8)', backdropFilter: 'blur(20px)',
                        flexShrink: 0, isolation: 'isolate', transform: 'translateZ(0)',
                        willChange: 'transform'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {!sidebarOpen && (
                                <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '4px' }}>
                                    <Menu style={{ width: '18px', height: '18px' }} />
                                </button>
                            )}

                            {/* Fixed width container for indicator to prevent layout vibration/shifts */}
                            <div style={{ width: wakeActive ? 'auto' : '0px', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {wakeActive && (
                                    <div
                                        onClick={() => restart()}
                                        title={`NexovGen Voice is: ${status === 'listening' ? 'Active' : status}. Click to restart or Say "Hey Nexo" to start.`}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}
                                    >
                                        <motion.div
                                            animate={{
                                                scale: status === 'listening' ? [1, 1.4, 1] : 1,
                                                opacity: status === 'listening' ? [0.8, 0.3, 0.8] : 0.5
                                            }}
                                            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                                            style={{
                                                width: 6, height: 6, borderRadius: '50%',
                                                background: status === 'listening' ? '#00f2ff' : status === 'blocked' ? '#f87171' : '#6b7280',
                                                boxShadow: status === 'listening' ? '0 0 10px #00f2ff' : 'none'
                                            }}
                                        />
                                        <span style={{ fontSize: '10px', color: status === 'listening' ? '#00f2ff' : status === 'blocked' ? '#f87171' : '#9ca3af', fontWeight: 600, letterSpacing: '0.05em' }}>
                                            {status === 'listening' ? 'LISTENING' : status === 'blocked' ? 'MIC BLOCKED' : 'VOICE IDLE'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mentor chip */}
                        <button onClick={() => setShowMentorPicker(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', cursor: 'pointer', font: "600 12px 'Outfit',sans-serif", color: '#9ca3af' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: mentor.color }} />
                            {mentor.name}
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                        </button>

                        <div style={{ width: '100px' }} />
                    </div>

                    {/* ── HOME SCREEN = SearchHero dashboard ── */}
                    {isHome ? (
                        <SearchHero
                            lang={lang}
                            setIsListening={setIsListening}
                            onSearch={(q) => { setInput(q); setTimeout(() => send(q), 80); }}
                        />
                    ) : (
                        /* ── CHAT SCREEN ── */
                        <>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
                                <div style={{ maxWidth: '680px', margin: '0 auto' }}>
                                    {messages.map((msg, i) => (
                                        <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                            style={{ display: 'flex', gap: '10px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', marginBottom: '16px' }}>
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '12px', fontWeight: 700,
                                                background: msg.role === 'user' ? mentor.color : `${mentor.color}18`,
                                                border: msg.role === 'user' ? 'none' : `1px solid ${mentor.color}25`,
                                                color: msg.role === 'user' ? '#05070a' : mentor.color
                                            }}>
                                                {msg.role === 'user' ? userName.charAt(0).toUpperCase() : <Icon style={{ width: '14px', height: '14px' }} />}
                                            </div>
                                            <div style={{
                                                maxWidth: '82%', padding: '11px 15px', borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px', fontSize: '13px', lineHeight: 1.65,
                                                background: msg.role === 'user' ? mentor.color : 'rgba(255,255,255,0.05)',
                                                border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                                                color: msg.role === 'user' ? '#05070a' : '#d1d5db'
                                            }}>
                                                {msg.role === 'user' ? (
                                                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                                                ) : (
                                                    <TypedMessage
                                                        key={i}
                                                        content={msg.content}
                                                        isLatest={i === messages.length - 1 && !loading}
                                                        mentorColor={mentor.color}
                                                        CodeBlock={CodeBlock}
                                                        remarkGfm={remarkGfm}
                                                    />
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                    {loading && (
                                        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${mentor.color}18`, border: `1px solid ${mentor.color}25` }}>
                                                <Icon style={{ width: '14px', height: '14px', color: mentor.color }} />
                                            </div>
                                            <div style={{ padding: '11px 16px', borderRadius: '4px 16px 16px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                {[0, 0.15, 0.3].map((d, i) => (
                                                    <motion.div key={i} animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: d }}
                                                        style={{ width: '6px', height: '6px', borderRadius: '50%', background: mentor.color }} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div ref={endRef} />
                                </div>
                            </div>

                            {/* Chat input */}
                            <div style={{ padding: '12px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                                <div style={{ maxWidth: '680px', margin: '0 auto', position: 'relative' }}>
                                    <CommandOverlay
                                        visible={showCommands}
                                        mentors={MENTORS}
                                        templates={templates}
                                        onSelect={handleCommandSelect}
                                    />
                                    <div style={{
                                        display: 'flex', flexDirection: 'column', gap: '12px',
                                        background: 'rgba(255,255,255,0.05)',
                                        backdropFilter: 'blur(16px)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '20px',
                                        padding: '12px 14px',
                                        boxShadow: isFocused ? `0 0 20px ${mentor.color}25` : 'none',
                                        transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                                        position: 'relative'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                            <textarea
                                                ref={inputAreaRef}
                                                value={input}
                                                onChange={handleInputChange}
                                                onFocus={() => setIsFocused(true)}
                                                onBlur={() => setIsFocused(false)}
                                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                                                placeholder="Ask anything, @ to mention, / for workflows"
                                                rows={1}
                                                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '14px', resize: 'none', minHeight: '36px', maxHeight: '160px', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}
                                            />
                                            {attachments.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                                                    {attachments.map(att => (
                                                        <motion.div
                                                            key={att.id}
                                                            initial={{ opacity: 0, scale: 0.9 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                                background: 'rgba(255,255,255,0.08)', borderRadius: '12px',
                                                                padding: '4px 10px', fontSize: '12px', color: '#cbd5e1',
                                                                border: '1px solid rgba(255,255,255,0.1)'
                                                            }}
                                                        >
                                                            <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</span>
                                                            <button
                                                                onClick={() => removeAttachment(att.id)}
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#94a3b8', display: 'flex' }}
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            )}
                                            {input && (
                                                <motion.button
                                                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                                    onClick={() => setInput('')}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#64748b', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                                                    onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
                                                    onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                                                >
                                                    <X size={16} />
                                                </motion.button>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleFileUpload}
                                                    accept="image/*,application/pdf"
                                                    multiple
                                                    style={{ display: 'none' }}
                                                />
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => fileInputRef.current?.click()}
                                                    style={{
                                                        width: '30px',
                                                        height: '30px',
                                                        borderRadius: '10px',
                                                        border: '1px solid rgba(255,255,255,0.05)',
                                                        background: 'rgba(255,255,255,0.05)',
                                                        color: attachments.length > 0 ? '#fff' : '#94a3b8',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        position: 'relative'
                                                    }}>
                                                    <motion.div
                                                        whileHover={{ scale: 1.2, rotate: 90 }}
                                                        animate={attachments.length > 0 ? {
                                                            scale: [1, 1.2, 1],
                                                            rotate: [0, 90, 0],
                                                            filter: [
                                                                `drop-shadow(0 0 0px ${mentor.color}00)`,
                                                                `drop-shadow(0 0 8px ${mentor.color}80)`,
                                                                `drop-shadow(0 0 0px ${mentor.color}00)`
                                                            ]
                                                        } : {}}
                                                        transition={{
                                                            duration: 2,
                                                            repeat: Infinity,
                                                            ease: "easeInOut"
                                                        }}
                                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        <Plus size={18} />
                                                    </motion.div>
                                                    {attachments.length > 0 && (
                                                        <motion.div
                                                            layoutId="plus-dot"
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: mentor.color, border: '2px solid #0f172a' }}
                                                        />
                                                    )}
                                                </motion.button>

                                                <div className="dropdown-container" style={{ position: 'relative' }}>
                                                    <motion.button
                                                        whileHover={{ background: 'rgba(255,255,255,0.08)', y: -1 }}
                                                        whileTap={{ y: 0 }}
                                                        onClick={() => setActiveDropdown(activeDropdown === 'mode' ? null : 'mode')}
                                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.03)', color: '#cbd5e1', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                                                    >
                                                        <Brain size={14} style={{ color: mentor.color }} />
                                                        {chatMode}
                                                        <ChevronDown size={14} style={{ color: '#64748b', transform: activeDropdown === 'mode' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                                    </motion.button>

                                                    <AnimatePresence>
                                                        {activeDropdown === 'mode' && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                style={{ position: 'absolute', bottom: 'calc(100% + 12px)', left: 0, minWidth: '160px', background: 'rgba(15,20,30,0.95)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '6px', zIndex: 100, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                                                            >
                                                                {['Planning', 'Coding', 'Creative', 'Technical'].map(m => (
                                                                    <button
                                                                        key={m}
                                                                        onClick={() => { setChatMode(m); setActiveDropdown(null); }}
                                                                        style={{
                                                                            width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: 'none', background: chatMode === m ? 'rgba(255,255,255,0.06)' : 'transparent', color: chatMode === m ? '#fff' : '#94a3b8', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                                                                        }}
                                                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                                                        onMouseLeave={e => e.currentTarget.style.background = chatMode === m ? 'rgba(255,255,255,0.06)' : 'transparent'}
                                                                    >
                                                                        {m}
                                                                    </button>
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>

                                                <div className="dropdown-container" style={{ position: 'relative' }}>
                                                    <motion.button
                                                        whileHover={{ background: 'rgba(255,255,255,0.08)', y: -1 }}
                                                        whileTap={{ y: 0 }}
                                                        onClick={() => setActiveDropdown(activeDropdown === 'model' ? null : 'model')}
                                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.03)', color: '#cbd5e1', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                                                    >
                                                        <Zap size={14} style={{ color: '#f59e0b' }} />
                                                        {chatModel}
                                                        <ChevronDown size={14} style={{ color: '#64748b', transform: activeDropdown === 'model' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                                    </motion.button>

                                                    <AnimatePresence>
                                                        {activeDropdown === 'model' && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                style={{ position: 'absolute', bottom: 'calc(100% + 12px)', left: 0, minWidth: '180px', background: 'rgba(15,20,30,0.95)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '6px', zIndex: 100, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                                                            >
                                                                {[
                                                                    { name: 'Gemini 3 Flash', icon: Zap, color: '#f59e0b' },
                                                                    { name: 'Gemini 1.5 Pro', icon: Cpu, color: '#3b82f6' },
                                                                    { name: 'Claude 3.5', icon: Sparkles, color: '#8b5cf6' },
                                                                    { name: 'GPT-4o', icon: Brain, color: '#10b981' },
                                                                    { name: 'Ollama (Local)', icon: Bot, color: '#4F8EF7' }
                                                                ].map(m => (
                                                                    <button
                                                                        key={m.name}
                                                                        onClick={() => { setChatModel(m.name); setActiveDropdown(null); }}
                                                                        style={{
                                                                            width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: 'none', background: chatModel === m.name ? 'rgba(255,255,255,0.06)' : 'transparent', color: chatModel === m.name ? '#fff' : '#94a3b8', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                                                                        }}
                                                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                                                        onMouseLeave={e => e.currentTarget.style.background = chatModel === m.name ? 'rgba(255,255,255,0.06)' : 'transparent'}
                                                                    >
                                                                        <m.icon size={14} style={{ color: m.color }} />
                                                                        {m.name}
                                                                    </button>
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>

                                                {/* ── Language Picker ── */}
                                                <div className="dropdown-container" style={{ position: 'relative' }}>
                                                    <motion.button
                                                        whileHover={{ background: 'rgba(255,255,255,0.08)', y: -1 }}
                                                        whileTap={{ y: 0 }}
                                                        onClick={() => setActiveDropdown(activeDropdown === 'lang' ? null : 'lang')}
                                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', background: lang.id !== 'en' ? 'rgba(79,142,247,0.08)' : 'rgba(255,255,255,0.03)', color: lang.id !== 'en' ? '#4F8EF7' : '#cbd5e1', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                                                    >
                                                        <span style={{ fontSize: '15px' }}>{lang.flag}</span>
                                                        {lang.label}
                                                        <ChevronDown size={14} style={{ color: '#64748b', transform: activeDropdown === 'lang' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                                    </motion.button>

                                                    <AnimatePresence>
                                                        {activeDropdown === 'lang' && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                style={{ position: 'absolute', bottom: 'calc(100% + 12px)', left: 0, minWidth: '240px', maxHeight: '420px', overflowY: 'auto', background: 'rgba(15,20,30,0.97)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '6px', zIndex: 100, boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}
                                                            >
                                                                {Object.entries(LANGUAGE_GROUPS).map(([groupName, langs]) => (
                                                                    <div key={groupName}>
                                                                        <p style={{ fontSize: '8px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.14em', padding: '8px 12px 3px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 2 }}>{groupName}</p>
                                                                        {langs.map(l => (
                                                                            <button
                                                                                key={l.id}
                                                                                onClick={() => { setLang(l); setActiveDropdown(null); }}
                                                                                style={{
                                                                                    width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', borderRadius: '8px', border: 'none',
                                                                                    background: lang.id === l.id ? 'rgba(79,142,247,0.12)' : 'transparent',
                                                                                    color: lang.id === l.id ? '#4F8EF7' : '#94a3b8',
                                                                                    fontSize: '12px', fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s'
                                                                                }}
                                                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                                                                onMouseLeave={e => e.currentTarget.style.background = lang.id === l.id ? 'rgba(79,142,247,0.12)' : 'transparent'}
                                                                            >
                                                                                <span style={{ fontSize: '14px', flexShrink: 0 }}>{l.flag}</span>
                                                                                <span style={{ flex: 1 }}>{l.label}</span>
                                                                                {lang.id === l.id && <span style={{ fontSize: '11px', color: '#4F8EF7' }}>✓</span>}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>

                                            </div>


                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <motion.button
                                                    whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.08)' }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => {
                                                        const newState = !isAutoSpeakEnabled;
                                                        setIsAutoSpeakEnabled(newState);
                                                        if (!newState) synthRef.current.cancel();
                                                    }}
                                                    style={{
                                                        width: '36px', height: '36px', borderRadius: '12px',
                                                        background: isAutoSpeakEnabled ? `${mentor.color}15` : 'rgba(255,255,255,0.03)',
                                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                                                        border: isAutoSpeakEnabled ? `1px solid ${mentor.color}40` : '1px solid transparent'
                                                    }}
                                                    title={isAutoSpeakEnabled ? "Disable Auto-Speak" : "Enable Auto-Speak"}
                                                >
                                                    {isAutoSpeakEnabled ? (
                                                        <Volume2 style={{ width: 16, height: 16, color: mentor.color }} />
                                                    ) : (
                                                        <VolumeX style={{ width: 16, height: 16, color: '#64748b' }} />
                                                    )}
                                                </motion.button>

                                                <motion.button
                                                    whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.08)' }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={toggleVoice}
                                                    style={{
                                                        width: '36px', height: '36px', borderRadius: '12px', background: isListening ? `${mentor.color}15` : 'rgba(255,255,255,0.03)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                                                        border: isListening ? `1px solid ${mentor.color}40` : '1px solid transparent',
                                                    }}
                                                >
                                                    <Mic style={{ width: 16, height: 16, color: isListening ? mentor.color : '#64748b' }} className={isListening ? 'animate-pulse' : ''} />
                                                </motion.button>

                                                {isSwarmLoop && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="px-2 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-1.5"
                                                    >
                                                        <Layers size={10} className="text-cyan-400" />
                                                        <span className="text-[10px] font-bold text-cyan-400 tracking-wider">SWARM</span>
                                                    </motion.div>
                                                )}

                                                <motion.button
                                                    whileHover={(input.trim() || loading) ? { scale: 1.05, filter: 'brightness(1.1)' } : {}}
                                                    whileTap={(input.trim() || loading) ? { scale: 0.95 } : {}}
                                                    onClick={() => loading ? setLoading(false) : send()}
                                                    disabled={(!input.trim() && !loading)}
                                                    style={{
                                                        width: '36px', height: '36px', borderRadius: '12px', border: 'none',
                                                        cursor: (input.trim() || loading) ? 'pointer' : 'default',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                        background: (input.trim() || loading) ? mentor.color : 'rgba(255,255,255,0.03)',
                                                        boxShadow: (input.trim() || loading) ? `0 0 15px ${mentor.color}40` : 'none',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    {loading ? <Square style={{ width: '12px', height: '12px', color: '#05070a' }} fill="#05070a" /> : <Send style={{ width: '16px', height: '16px', color: input.trim() ? '#05070a' : '#4b5563' }} />}
                                                </motion.button>
                                            </div>
                                        </div>

                                        {input.length > 0 && (
                                            <div style={{ position: 'absolute', right: 12, bottom: -20, fontSize: 9, color: '#4b5563', fontWeight: 700, letterSpacing: '0.05em' }}>
                                                {input.length} CHARS
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </main>

                {/* ── MENTOR PICKER MODAL ─────────────────────────────────────── */}
                <AnimatePresence>
                    {showMentorPicker && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                            onClick={() => setShowMentorPicker(false)}>
                            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
                                onClick={e => e.stopPropagation()}
                                style={{ width: '100%', maxWidth: '860px', background: '#111318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,#06b6d4,#8b5cf6,#ec4899)' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                    <div>
                                        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px' }}>Choose Your Mentor</h2>
                                        <p style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>NEXOVGEN 5-Mentor AI University</p>
                                    </div>
                                    <button onClick={() => setShowMentorPicker(false)}
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', cursor: 'pointer', padding: '6px', color: '#9ca3af' }}>
                                        <X style={{ width: '16px', height: '16px' }} />
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                                    {MENTORS.map(m => {
                                        const MIcon = m.icon;
                                        const active = mentor.id === m.id;
                                        return (
                                            <motion.button key={m.id} whileHover={{ y: -4 }}
                                                onClick={() => { setMentor(m); setShowMentorPicker(false); }}
                                                style={{ padding: '18px 14px', borderRadius: '14px', border: `1px solid ${active ? m.color + '50' : 'rgba(255,255,255,0.07)'}`, background: active ? `${m.color}12` : 'rgba(255,255,255,0.03)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                                                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${m.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                                                    <MIcon style={{ width: '18px', height: '18px', color: m.color }} />
                                                </div>
                                                <p style={{ fontSize: '9px', fontWeight: 700, color: m.color, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>{m.mode}</p>
                                                <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>{m.name}</p>
                                                <p style={{ fontSize: '10px', color: '#6b7280', margin: 0, lineHeight: 1.4 }}>{m.tagline}</p>
                                                {active && <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: m.color }} />
                                                    <span style={{ fontSize: '9px', fontWeight: 700, color: m.color, textTransform: 'uppercase' }}>Active</span>
                                                </div>}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {showSettings && (
                        <SettingsPanel
                            user={user}
                            onClose={() => {
                                setShowSettings(false);
                                // Refresh settings from localStorage when modal closes
                                setSettings(prev => {
                                    try { return { ...prev, ...JSON.parse(localStorage.getItem('nxv_settings') || '{}') }; }
                                    catch { return prev; }
                                });
                            }}
                        />
                    )}

                </AnimatePresence>

                {showAILab && (
                    <AILab
                        user={user}
                        onClose={() => setShowAILab(false)}
                    />
                )}

                {showAutomationHub && (
                    <AutomationHub
                        user={user}
                        onClose={() => setShowAutomationHub(false)}
                    />
                )}

                {showAllChats && (
                    <AllChatsPanel
                        history={history}
                        groupedHistory={groupedHistory}
                        onSelect={(chat) => {
                            setMessages(chat.messages || []);
                            setShowAllChats(false);
                        }}
                        onDelete={(e, id) => { deleteChat(e, id); }}
                        onClose={() => setShowAllChats(false)}
                    />
                )}
            </div>
        </>
    );
}

