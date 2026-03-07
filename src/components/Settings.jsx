import React, { useState, useEffect, useCallback } from 'react';
import {
    X, User, Palette, Bell, Shield, Keyboard, Brain,
    ChevronRight, Moon, Sun, Monitor, Check, Save,
    Globe, Sliders, Zap, Key, Trash2, Download, Upload,
    Eye, EyeOff, ToggleLeft, ToggleRight, AlertTriangle,
    BookOpen, Volume2, VolumeX, RotateCcw, ShieldAlert,
    Activity, Scan, Terminal, Mic, Radio, Ear
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateProfile, deleteUser } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAppearance } from '../lib/AppearanceContext';
import SecurityMonitor from './SecurityMonitor';

/* ─── DEFAULTS ─── */
const DEFAULT_SETTINGS = {
    // Appearance
    theme: 'dark',
    accentColor: '#4F8EF7',
    fontSize: 'medium',
    reducedMotion: false,
    // AI
    defaultMentor: 'founder',
    responseStyle: 'detailed',
    streamingEnabled: true,
    maxTokens: 2048,
    language: 'en',
    // Notifications
    sessionSummary: true,
    productUpdates: false,
    weeklyDigest: true,
    soundEnabled: false,
    // Privacy
    chatHistory: true,
    analytics: false,
    // Keyboard
    shortcuts: true,
    // Voice
    wakeWordEnabled: true,
    voiceSensitivity: 0.5,
};

/* ─── HELPERS ─── */
function loadSettings() {
    try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('nxv_settings') || '{}') }; }
    catch { return DEFAULT_SETTINGS; }
}
function saveSettings(s) { localStorage.setItem('nxv_settings', JSON.stringify(s)); }

/* ─── NAV SECTIONS ─── */
const SECTIONS = [
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'appearance', icon: Palette, label: 'Appearance' },
    { id: 'ai', icon: Brain, label: 'AI & Models' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'privacy', icon: Shield, label: 'Privacy & Data' },
    { id: 'security', icon: ShieldAlert, label: 'Security & Integrity' },
    { id: 'shortcuts', icon: Keyboard, label: 'Shortcuts' },
    { id: 'voice', icon: Mic, label: 'Voice & Wake Word' },
];

const ACCENT_COLORS = [
    { label: 'Blue', value: '#4F8EF7' },
    { label: 'Cyan', value: '#06b6d4' },
    { label: 'Violet', value: '#8b5cf6' },
    { label: 'Pink', value: '#ec4899' },
    { label: 'Amber', value: '#f59e0b' },
    { label: 'Emerald', value: '#10b981' },
];

const FONT_SIZES = ['small', 'medium', 'large'];
const RESPONSE_STYLES = [
    { value: 'concise', label: 'Concise', desc: 'Short, direct answers' },
    { value: 'balanced', label: 'Balanced', desc: 'Clear with context' },
    { value: 'detailed', label: 'Detailed', desc: 'Thorough explanations' },
];

const SHORTCUTS = [
    { keys: ['⌘', 'K'], action: 'Universal search' },
    { keys: ['⌘', 'Enter'], action: 'Send message' },
    { keys: ['/'], action: 'Command palette' },
    { keys: ['⌘', '\\'], action: 'Toggle sidebar' },
    { keys: ['⌘', 'N'], action: 'New chat' },
    { keys: ['Esc'], action: 'Close modal / Cancel' },
];

/* ═══════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════ */
export default function Settings({ user, onClose }) {
    const { appearance, setAppearance } = useAppearance();
    const [activeSection, setActiveSection] = useState('profile');
    const [settings, setSettings] = useState(loadSettings);
    const [saved, setSaved] = useState(false);
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileMsg, setProfileMsg] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteInput, setDeleteInput] = useState('');

    // For appearance keys: write to context (which auto-saves + applies CSS vars)
    // For all other keys: write to local settings state
    const APPEARANCE_KEYS = ['theme', 'accentColor', 'fontSize', 'reducedMotion'];
    const update = (key, val) => {
        if (APPEARANCE_KEYS.includes(key)) {
            setAppearance({ ...appearance, [key]: val });
            // Also keep local settings in sync for the save-bar
            setSettings(prev => ({ ...prev, [key]: val }));
        } else {
            setSettings(prev => {
                const next = { ...prev, [key]: val };
                localStorage.setItem('nxv_settings', JSON.stringify(next));
                return next;
            });
        }
    };

    // Sync appearance values into local settings on mount
    useEffect(() => {
        setSettings(prev => ({ ...prev, ...appearance }));
    }, []);


    const handleSave = () => {
        saveSettings(settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        try {
            await updateProfile(auth.currentUser, { displayName });
            setProfileMsg('Profile updated!');
        } catch (e) {
            setProfileMsg('Error: ' + e.message);
        } finally {
            setSavingProfile(false);
            setTimeout(() => setProfileMsg(''), 3000);
        }
    };

    const handleExportData = () => {
        const data = JSON.stringify({ settings, exportedAt: new Date().toISOString() }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'nexovgen-settings.json'; a.click();
        URL.revokeObjectURL(url);
    };

    const handleResetSettings = () => {
        setSettings(DEFAULT_SETTINGS);
        saveSettings(DEFAULT_SETTINGS);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    // Keyboard: Esc to close
    useEffect(() => {
        const h = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose]);

    const isDark = appearance.theme !== 'light' && !(appearance.theme === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches);
    const tok = {
        bg: isDark ? '#0a0c10' : '#F0F4FF',
        card: isDark ? '#111318' : '#FFFFFF',
        border: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
        text: isDark ? '#F1F5F9' : '#0F172A',
        sub: isDark ? '#6B7280' : '#475569',
        dim: isDark ? '#374151' : '#94A3B8',
        accent: appearance.accentColor || '#4F8EF7',
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
                position: 'fixed', inset: 0, zIndex: 500,
                background: 'rgba(5,7,10,0.88)', backdropFilter: 'blur(20px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '24px', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif",
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
                style={{
                    width: '100%', maxWidth: '820px', height: '80vh', maxHeight: '640px',
                    background: tok.card, border: `1px solid ${tok.border}`,
                    borderRadius: '20px', display: 'flex', overflow: 'hidden',
                    boxShadow: '0 40px 100px rgba(0,0,0,0.7)',
                }}
            >
                {/* ── LEFT NAV ── */}
                <div style={{
                    width: '200px', flexShrink: 0, borderRight: `1px solid ${tok.border}`,
                    display: 'flex', flexDirection: 'column', padding: '8px',
                    background: 'rgba(0,0,0,0.25)',
                }}>
                    {/* Header */}
                    <div style={{ padding: '12px 8px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: `${tok.accent}18`, border: `1px solid ${tok.accent}30`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <BookOpen size={15} color={tok.accent} />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: tok.text }}>Settings</p>
                            <p style={{ margin: 0, fontSize: 9, color: tok.sub, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Nexovgen.AI</p>
                        </div>
                    </div>

                    {/* Nav */}
                    <nav style={{ flex: 1 }}>
                        {SECTIONS.map(({ id, icon: Icon, label }) => (
                            <button key={id} onClick={() => setActiveSection(id)}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '9px 10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                    background: activeSection === id ? `${tok.accent}15` : 'none',
                                    color: activeSection === id ? tok.accent : tok.sub,
                                    textAlign: 'left', marginBottom: '2px', transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => { if (activeSection !== id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                                onMouseLeave={e => { if (activeSection !== id) e.currentTarget.style.background = 'none'; }}
                            >
                                <Icon size={15} />
                                <span style={{ fontSize: 13, fontWeight: activeSection === id ? 600 : 400 }}>{label}</span>
                            </button>
                        ))}
                    </nav>

                    {/* Version */}
                    <p style={{ margin: '8px', fontSize: 10, color: tok.dim }}>v2.0 · Nexovgen Intelligence Layer</p>
                </div>

                {/* ── RIGHT CONTENT ── */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    {/* Top bar */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '18px 24px', borderBottom: `1px solid ${tok.border}`,
                        flexShrink: 0,
                    }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: tok.text }}>
                                {SECTIONS.find(s => s.id === activeSection)?.label}
                            </h2>
                            <p style={{ margin: '2px 0 0', fontSize: 12, color: tok.sub }}>
                                Manage your {SECTIONS.find(s => s.id === activeSection)?.label.toLowerCase()} preferences
                            </p>
                        </div>
                        <button onClick={onClose}
                            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: tok.sub, display: 'flex', alignItems: 'center' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Scrollable body */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                        <AnimatePresence mode="wait">
                            <motion.div key={activeSection}
                                initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                            >

                                {/* ── PROFILE ── */}
                                {activeSection === 'profile' && (<>
                                    <Card tok={tok}>
                                        {/* Avatar */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
                                            <div style={{
                                                width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
                                                background: `linear-gradient(135deg, ${tok.accent}, #8b5cf6)`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 24, fontWeight: 700, color: '#fff',
                                                boxShadow: `0 0 32px ${tok.accent}30`,
                                            }}>
                                                {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: tok.text }}>{user?.displayName || 'User'}</p>
                                                <p style={{ margin: '4px 0 0', fontSize: 12, color: tok.sub }}>{user?.email}</p>
                                                <span style={{ display: 'inline-block', marginTop: 6, fontSize: 10, fontWeight: 700, color: tok.accent, background: `${tok.accent}15`, padding: '2px 8px', borderRadius: 20, letterSpacing: '0.08em', textTransform: 'uppercase' }}>PRO EDITION</span>
                                            </div>
                                        </div>
                                        <FieldLabel tok={tok}>Display Name</FieldLabel>
                                        <input
                                            value={displayName} onChange={e => setDisplayName(e.target.value)}
                                            style={inputStyle(tok)}
                                            placeholder="Your display name"
                                        />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
                                            <ActionBtn tok={tok} accent onClick={handleSaveProfile} disabled={savingProfile}>
                                                {savingProfile ? 'Saving…' : 'Save Profile'}
                                            </ActionBtn>
                                            {profileMsg && <span style={{ fontSize: 12, color: profileMsg.startsWith('Error') ? '#f87171' : '#34d399' }}>{profileMsg}</span>}
                                        </div>
                                    </Card>

                                    <Card tok={tok} title="Account Management">
                                        <Row label="Export all your data" sub="Download settings & preferences as JSON">
                                            <ActionBtn tok={tok} onClick={handleExportData} small>
                                                <Download size={13} /> Export
                                            </ActionBtn>
                                        </Row>
                                        <Divider tok={tok} />
                                        <Row label="Delete account" sub="Permanently remove all data — this cannot be undone">
                                            <ActionBtn tok={tok} danger small onClick={() => setShowDeleteConfirm(true)}>
                                                <Trash2 size={13} /> Delete
                                            </ActionBtn>
                                        </Row>
                                    </Card>

                                    {/* Delete confirm */}
                                    <AnimatePresence>
                                        {showDeleteConfirm && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                                <Card tok={tok} style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
                                                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16 }}>
                                                        <AlertTriangle size={16} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
                                                        <p style={{ margin: 0, fontSize: 13, color: '#f87171', lineHeight: 1.5 }}>
                                                            Type <strong>DELETE</strong> to confirm permanent account deletion. This action cannot be undone.
                                                        </p>
                                                    </div>
                                                    <input value={deleteInput} onChange={e => setDeleteInput(e.target.value)}
                                                        style={{ ...inputStyle(tok), borderColor: 'rgba(239,68,68,0.3)', marginBottom: 12 }}
                                                        placeholder="Type DELETE" />
                                                    <div style={{ display: 'flex', gap: 10 }}>
                                                        <ActionBtn tok={tok} small onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}>Cancel</ActionBtn>
                                                        <ActionBtn tok={tok} danger small disabled={deleteInput !== 'DELETE'}
                                                            onClick={async () => { try { await deleteUser(auth.currentUser); } catch (e) { alert(e.message); } }}>
                                                            Confirm Delete
                                                        </ActionBtn>
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </>)}

                                {/* ── APPEARANCE ── */}
                                {activeSection === 'appearance' && (<>
                                    <Card tok={tok} title="Theme">
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                                            {[['dark', <Moon size={18} />, 'Dark'], ['light', <Sun size={18} />, 'Light  '], ['system', <Monitor size={18} />, 'System']].map(([val, icon, lbl]) => (
                                                <button key={val} onClick={() => update('theme', val)}
                                                    style={{
                                                        padding: '14px 10px', borderRadius: 12, cursor: 'pointer', border: `1px solid`,
                                                        borderColor: appearance.theme === val ? tok.accent : tok.border,
                                                        background: appearance.theme === val ? `${tok.accent}12` : 'rgba(255,255,255,0.02)',
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                                                        color: appearance.theme === val ? tok.accent : tok.sub, transition: 'all 0.15s',
                                                    }}>
                                                    {icon}
                                                    <span style={{ fontSize: 12, fontWeight: 600 }}>{lbl}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </Card>

                                    <Card tok={tok} title="Accent Color">
                                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                            {ACCENT_COLORS.map(({ label, value }) => (
                                                <button key={value} onClick={() => update('accentColor', value)}
                                                    title={label}
                                                    style={{
                                                        width: 36, height: 36, borderRadius: '50%', background: value, border: 'none', cursor: 'pointer',
                                                        outline: appearance.accentColor === value ? `3px solid ${value}` : '3px solid transparent',
                                                        outlineOffset: 3, transition: 'outline 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                    {appearance.accentColor === value && <Check size={14} color="#fff" />}
                                                </button>
                                            ))}
                                        </div>
                                    </Card>

                                    <Card tok={tok} title="Font Size">
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            {FONT_SIZES.map(f => (
                                                <button key={f} onClick={() => update('fontSize', f)}
                                                    style={{
                                                        flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', border: `1px solid`,
                                                        borderColor: appearance.fontSize === f ? tok.accent : tok.border,
                                                        background: appearance.fontSize === f ? `${tok.accent}12` : 'rgba(255,255,255,0.02)',
                                                        color: appearance.fontSize === f ? tok.accent : tok.sub,
                                                        fontSize: f === 'small' ? 11 : f === 'medium' ? 13 : 15, fontWeight: 600,
                                                        textTransform: 'capitalize', transition: 'all 0.15s',
                                                    }}>
                                                    {f}
                                                </button>
                                            ))}
                                        </div>
                                    </Card>

                                    <Card tok={tok} title="Motion">
                                        <ToggleRow tok={tok} label="Reduce motion" sub="Minimize animations for accessibility"
                                            checked={appearance.reducedMotion} onChange={v => update('reducedMotion', v)} />
                                    </Card>

                                    {/* ── LIVE APPEARANCE STRIP ── */}
                                    <div style={{
                                        padding: '16px 20px', borderRadius: 14,
                                        background: 'var(--bg-card, rgba(255,255,255,0.03))',
                                        border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    }}>
                                        <div>
                                            <p style={{ margin: 0, fontSize: 'var(--font-size-base,15px)', fontWeight: 700, color: 'var(--text-primary,#F1F5F9)' }}>Live Appearance</p>
                                            <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-secondary,#64748B)' }}>Changes apply instantly across the app</p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: settings.accentColor, boxShadow: `0 0 12px ${settings.accentColor}70` }} />
                                            <span style={{ fontSize: 11, color: 'var(--text-secondary,#64748B)', fontWeight: 600, textTransform: 'capitalize' }}>
                                                {settings.theme} · {settings.fontSize}
                                            </span>
                                            <span style={{
                                                fontSize: 10, fontWeight: 700, color: settings.accentColor,
                                                background: settings.accentColor + '18',
                                                border: `1px solid ${settings.accentColor}30`,
                                                padding: '3px 8px', borderRadius: 20,
                                            }}>● LIVE</span>
                                        </div>
                                    </div>

                                    {/* ── SAMPLE TEXT AT SELECTED SIZE ── */}
                                    <div style={{
                                        padding: '16px 20px', borderRadius: 14,
                                        background: 'var(--bg-input, rgba(255,255,255,0.04))',
                                        border: '1px solid var(--border-color)',
                                    }}>
                                        <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Typography Sample</p>
                                        <p style={{ margin: 0, fontSize: 'var(--font-size-base,15px)', color: 'var(--text-primary,#F1F5F9)', lineHeight: 1.6 }}>
                                            NexoVGen GPT — next-generation intelligence at your fingertips.
                                        </p>
                                    </div>
                                </>)}

                                {/* ── AI & MODELS ── */}
                                {activeSection === 'ai' && (<>
                                    <Card tok={tok} title="Response Style">
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {RESPONSE_STYLES.map(({ value, label, desc }) => (
                                                <button key={value} onClick={() => update('responseStyle', value)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        padding: '12px 14px', borderRadius: 12, cursor: 'pointer', border: `1px solid`,
                                                        borderColor: settings.responseStyle === value ? tok.accent : tok.border,
                                                        background: settings.responseStyle === value ? `${tok.accent}10` : 'rgba(255,255,255,0.02)',
                                                        transition: 'all 0.15s', textAlign: 'left',
                                                    }}>
                                                    <div>
                                                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: settings.responseStyle === value ? tok.accent : tok.text }}>{label}</p>
                                                        <p style={{ margin: 0, fontSize: 11, color: tok.sub }}>{desc}</p>
                                                    </div>
                                                    {settings.responseStyle === value && <Check size={16} color={tok.accent} />}
                                                </button>
                                            ))}
                                        </div>
                                    </Card>

                                    <Card tok={tok} title="Context Window">
                                        <p style={{ margin: '0 0 12px', fontSize: 12, color: tok.sub }}>Max tokens per response: <strong style={{ color: tok.text }}>{settings.maxTokens}</strong></p>
                                        <input type="range" min={512} max={4096} step={256} value={settings.maxTokens}
                                            onChange={e => update('maxTokens', Number(e.target.value))}
                                            style={{ width: '100%', accentColor: tok.accent, cursor: 'pointer' }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: tok.dim, marginTop: 4 }}>
                                            <span>512</span><span>4096</span>
                                        </div>
                                    </Card>

                                    <Card tok={tok} title="Advanced">
                                        <ToggleRow tok={tok} label="Streaming responses" sub="See responses as they're generated"
                                            checked={settings.streamingEnabled} onChange={v => update('streamingEnabled', v)} />
                                        <Divider tok={tok} />
                                        <div>
                                            <FieldLabel tok={tok}>Response Language</FieldLabel>
                                            <select value={settings.language} onChange={e => update('language', e.target.value)}
                                                style={{ ...inputStyle(tok), cursor: 'pointer' }}>
                                                <option value="en">English</option>
                                                <option value="es">Spanish</option>
                                                <option value="fr">French</option>
                                                <option value="de">German</option>
                                                <option value="ja">Japanese</option>
                                                <option value="zh">Chinese</option>
                                                <option value="ar">Arabic</option>
                                                <option value="hi">Hindi</option>
                                            </select>
                                        </div>
                                    </Card>
                                </>)}

                                {/* ── NOTIFICATIONS ── */}
                                {activeSection === 'notifications' && (<>
                                    <Card tok={tok} title="Email Notifications">
                                        <ToggleRow tok={tok} label="Weekly digest" sub="Summary of your AI activity" checked={settings.weeklyDigest} onChange={v => update('weeklyDigest', v)} />
                                        <Divider tok={tok} />
                                        <ToggleRow tok={tok} label="Product updates" sub="New features and announcements" checked={settings.productUpdates} onChange={v => update('productUpdates', v)} />
                                        <Divider tok={tok} />
                                        <ToggleRow tok={tok} label="Session summaries" sub="AI recap after each chat" checked={settings.sessionSummary} onChange={v => update('sessionSummary', v)} />
                                    </Card>
                                    <Card tok={tok} title="In-App">
                                        <ToggleRow tok={tok} label="Sound effects" sub="Subtle audio on send/receive"
                                            checked={settings.soundEnabled} onChange={v => update('soundEnabled', v)}
                                            icon={settings.soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />} />
                                    </Card>
                                </>)}

                                {/* ── PRIVACY ── */}
                                {activeSection === 'privacy' && (<>
                                    <Card tok={tok} title="Data & Privacy">
                                        <ToggleRow tok={tok} label="Save chat history" sub="Store conversations for future reference" checked={settings.chatHistory} onChange={v => update('chatHistory', v)} />
                                        <Divider tok={tok} />
                                        <ToggleRow tok={tok} label="Usage analytics" sub="Help improve Nexovgen with anonymous usage data" checked={settings.analytics} onChange={v => update('analytics', v)} />
                                    </Card>
                                    <Card tok={tok} title="Data Controls">
                                        <Row label="Reset all settings" sub="Restore all preferences to defaults">
                                            <ActionBtn tok={tok} small onClick={handleResetSettings}>
                                                <RotateCcw size={13} /> Reset
                                            </ActionBtn>
                                        </Row>
                                        <Divider tok={tok} />
                                        <Row label="Clear chat history" sub="Delete all stored conversations">
                                            <ActionBtn tok={tok} danger small onClick={() => {
                                                if (window.confirm('Clear all chat history? This cannot be undone.')) {
                                                    localStorage.removeItem('nxv_history');
                                                }
                                            }}>
                                                <Trash2 size={13} /> Clear
                                            </ActionBtn>
                                        </Row>
                                    </Card>
                                </>)}

                                {/* ── SHORTCUTS ── */}
                                {activeSection === 'shortcuts' && (
                                    <Card tok={tok} title="Keyboard Shortcuts">
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                            {SHORTCUTS.map(({ keys, action }, i) => (
                                                <div key={action}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                                                        <span style={{ fontSize: 13, color: tok.text }}>{action}</span>
                                                        <div style={{ display: 'flex', gap: 4 }}>
                                                            {keys.map(k => (
                                                                <kbd key={k} style={{
                                                                    padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                                                                    fontFamily: 'monospace', color: tok.sub,
                                                                    background: 'rgba(255,255,255,0.06)', border: `1px solid ${tok.border}`,
                                                                }}>
                                                                    {k}
                                                                </kbd>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {i < SHORTCUTS.length - 1 && <Divider tok={tok} />}
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}

                                {/* ── SECURITY & INTEGRITY ── */}
                                {activeSection === 'security' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <SecurityMonitor />
                                    </div>
                                )}

                                {/* ── VOICE & WAKE WORD ── */}
                                {activeSection === 'voice' && (<>
                                    <Card tok={tok} title="Voice Controls">
                                        <ToggleRow tok={tok} label="Enable 'Hey Nexo' Wake Word" sub="Listen for voice commands in the background"
                                            checked={settings.wakeWordEnabled} onChange={v => update('wakeWordEnabled', v)}
                                            icon={<Ear size={14} />} />
                                        <Divider tok={tok} />
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div>
                                                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: tok.text }}>Microphone Status</p>
                                                <p style={{ margin: 0, fontSize: 11, color: tok.sub }}>Real-time hardware status</p>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{
                                                    width: 8, height: 8, borderRadius: '50%',
                                                    background: settings.wakeWordEnabled ? '#10b981' : '#ef4444',
                                                    boxShadow: settings.wakeWordEnabled ? '0 0 10px #10b981' : 'none'
                                                }} />
                                                <span style={{ fontSize: 11, fontWeight: 700, color: settings.wakeWordEnabled ? '#10b981' : '#ef4444', textTransform: 'uppercase' }}>
                                                    {settings.wakeWordEnabled ? 'Armed & Listening' : 'Disabled'}
                                                </span>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card tok={tok} title="Handoff Sensitivity">
                                        <p style={{ margin: '0 0 12px', fontSize: 12, color: tok.sub }}>Handoff speed: <strong style={{ color: tok.text }}>{settings.voiceSensitivity > 0.7 ? 'Instant' : settings.voiceSensitivity > 0.3 ? 'Balanced' : 'Smooth'}</strong></p>
                                        <input type="range" min={0} max={1} step={0.1} value={settings.voiceSensitivity}
                                            onChange={e => update('voiceSensitivity', Number(e.target.value))}
                                            style={{ width: '100%', accentColor: tok.accent, cursor: 'pointer' }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: tok.dim, marginTop: 4 }}>
                                            <span>Precise</span><span>Fast</span>
                                        </div>
                                    </Card>

                                    <div style={{
                                        padding: '16px', borderRadius: 12, background: 'rgba(239,68,68,0.05)',
                                        border: '1px solid rgba(239,68,68,0.1)', display: 'flex', gap: 12
                                    }}>
                                        <AlertTriangle size={18} color="#f87171" style={{ flexShrink: 0 }} />
                                        <p style={{ margin: 0, fontSize: 12, color: '#f87171', lineHeight: 1.5 }}>
                                            <strong>Privacy Note:</strong> Background listening is processed locally on your device. Audio is never recorded or sent to the cloud until a wake word is detected.
                                        </p>
                                    </div>
                                </>)}

                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* ── FOOTER SAVE BAR ── */}
                    {activeSection !== 'shortcuts' && activeSection !== 'profile' && (
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12,
                            padding: '14px 24px', borderTop: `1px solid ${tok.border}`, flexShrink: 0,
                        }}>
                            <AnimatePresence>
                                {saved && (
                                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        style={{ fontSize: 12, color: '#34d399', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Check size={13} /> Saved
                                    </motion.span>
                                )}
                            </AnimatePresence>
                            <button onClick={handleSave}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                                    background: `linear-gradient(135deg, ${tok.accent}, #3B73D8)`,
                                    color: '#fff', fontSize: 12, fontWeight: 700,
                                    boxShadow: `0 4px 16px ${tok.accent}30`,
                                }}>
                                <Save size={13} /> Save Changes
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div >
    );
}

/* ─── SUB-COMPONENTS ─── */
function Card({ tok, title, children, style = {} }) {
    return (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${tok.border}`, borderRadius: 14, padding: '20px', ...style }}>
            {title && <h3 style={{ margin: '0 0 16px', fontSize: 12, fontWeight: 700, color: tok.sub, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</h3>}
            {children}
        </div>
    );
}

function FieldLabel({ tok, children }) {
    return <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: tok.sub, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{children}</label>;
}

function ToggleRow({ tok, label, sub, checked, onChange, icon }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {icon && <span style={{ color: tok.sub }}>{icon}</span>}
                <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: tok.text }}>{label}</p>
                    {sub && <p style={{ margin: 0, fontSize: 11, color: tok.sub }}>{sub}</p>}
                </div>
            </div>
            <button onClick={() => onChange(!checked)}
                style={{
                    width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', flexShrink: 0,
                    background: checked ? tok.accent : 'rgba(255,255,255,0.1)',
                    position: 'relative', transition: 'background 0.2s',
                }}>
                <div style={{
                    position: 'absolute', top: 3, left: checked ? 21 : 3,
                    width: 16, height: 16, borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }} />
            </button>
        </div>
    );
}

function Row({ label, sub, children }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#F1F5F9' }}>{label}</p>
                {sub && <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>{sub}</p>}
            </div>
            {children}
        </div>
    );
}

function ActionBtn({ tok, children, onClick, accent, danger, small, disabled }) {
    return (
        <button onClick={onClick} disabled={disabled}
            style={{
                display: 'flex', alignItems: 'center', gap: 6, cursor: disabled ? 'not-allowed' : 'pointer',
                padding: small ? '7px 14px' : '10px 20px', borderRadius: 10, border: `1px solid`,
                fontSize: small ? 11 : 13, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.15s',
                borderColor: danger ? 'rgba(239,68,68,0.3)' : accent ? tok.accent : 'rgba(255,255,255,0.1)',
                background: accent ? `linear-gradient(135deg,${tok.accent},#3B73D8)` : danger ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
                color: accent ? '#fff' : danger ? '#f87171' : '#9CA3AF',
                opacity: disabled ? 0.5 : 1,
            }}>
            {children}
        </button>
    );
}

function Divider({ tok }) {
    return <div style={{ height: 1, background: tok.border, margin: '12px 0' }} />;
}

function inputStyle(tok) {
    return {
        width: '100%', padding: '11px 14px', borderRadius: 10,
        background: 'rgba(255,255,255,0.04)', border: `1px solid ${tok.border}`,
        color: tok.text, fontSize: 13, fontFamily: 'inherit', outline: 'none',
        transition: 'border-color 0.18s',
    };
}
