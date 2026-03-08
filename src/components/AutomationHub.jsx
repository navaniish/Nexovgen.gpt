import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Zap, Users, BarChart2, AlertTriangle, CheckCircle, Clock,
    Flame, Thermometer, Snowflake, Send, RefreshCw, ChevronDown,
    Mail, Brain, TrendingUp, Shield, Eye, ChevronRight, User,
    Building2, Briefcase, MessageSquare, Globe, ArrowRight, Check,
    AlertCircle, Target, Activity, Layout
} from 'lucide-react';
import BlueprintCanvas from './BlueprintCanvas';

// ─── Constants ────────────────────────────────────────────────────────────────
const TIER_CONFIG = {
    HOT: {
        label: 'HOT',
        color: '#ef4444',
        bg: 'rgba(239,68,68,0.08)',
        border: 'rgba(239,68,68,0.25)',
        glow: 'rgba(239,68,68,0.3)',
        Icon: Flame,
    },
    WARM: {
        label: 'WARM',
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.08)',
        border: 'rgba(245,158,11,0.25)',
        glow: 'rgba(245,158,11,0.3)',
        Icon: Thermometer,
    },
    COLD: {
        label: 'COLD',
        color: '#06b6d4',
        bg: 'rgba(6,182,212,0.08)',
        border: 'rgba(6,182,212,0.25)',
        glow: 'rgba(6,182,212,0.3)',
        Icon: Snowflake,
    },
};

const TABS = [
    { id: 'blueprints', label: 'Workflow Editor', Icon: Layout },
    { id: 'pipeline', label: 'Pipeline', Icon: Target },
    { id: 'reports', label: 'Reports', Icon: BarChart2 },
    { id: 'review', label: 'Review Queue', Icon: AlertTriangle },
];

const INDUSTRIES = ['SaaS', 'FinTech', 'HealthTech', 'EdTech', 'E-Commerce', 'Logistics', 'Marketing', 'HR Tech', 'LegalTech', 'Other'];
const COMPANY_SIZES = ['1–10', '11–50', '51–200', '201–500', '500+'];
const SOURCES = ['Website Form', 'Landing Page', 'Demo Request', 'Email Inquiry', 'Referral', 'LinkedIn', 'Cold Outreach'];

// ─── Helper Components ────────────────────────────────────────────────────────

function TierBadge({ tier, size = 'sm' }) {
    const cfg = TIER_CONFIG[tier] || TIER_CONFIG.COLD;
    const { Icon } = cfg;
    const pad = size === 'lg' ? '6px 14px' : '3px 10px';
    const fs = size === 'lg' ? '13px' : '10px';
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            borderRadius: 20, padding: pad, color: cfg.color,
            fontSize: fs, fontWeight: 800, letterSpacing: '0.08em',
            textTransform: 'uppercase',
        }}>
            <Icon style={{ width: size === 'lg' ? 14 : 10, height: size === 'lg' ? 14 : 10 }} />
            {tier}
        </span>
    );
}

function ConfidenceBar({ value }) {
    const pct = Math.round((value || 0) * 100);
    const color = pct >= 80 ? '#10b981' : pct >= 65 ? '#f59e0b' : '#ef4444';
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI Confidence</span>
                <span style={{ fontSize: 11, fontWeight: 700, color }}>{pct}%</span>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ height: '100%', background: color, borderRadius: 10 }}
                />
            </div>
        </div>
    );
}

function ScoreRing({ score }) {
    const cfg = score > 80 ? TIER_CONFIG.HOT : score >= 50 ? TIER_CONFIG.WARM : TIER_CONFIG.COLD;
    return (
        <div style={{
            width: 80, height: 80, borderRadius: '50%',
            border: `3px solid ${cfg.color}`,
            boxShadow: `0 0 20px ${cfg.glow}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: cfg.bg, flexShrink: 0,
        }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: cfg.color, lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: 8, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>score</span>
        </div>
    );
}

function LeadCard({ lead }) {
    const cfg = TIER_CONFIG[lead.tier] || TIER_CONFIG.COLD;
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                borderRadius: 12, padding: '12px 14px',
                marginBottom: 8,
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0 }}>
                        {lead.firstName || ''} {lead.lastName || ''}
                    </p>
                    <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>{lead.company}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: cfg.color }}>{lead.score}</span>
                    <p style={{ fontSize: 9, color: '#4b5563', margin: 0 }}>pts</p>
                </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {lead.persona && (
                    <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {lead.persona}
                    </span>
                )}
                {lead.intent && (
                    <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.06)' }}>
                        Intent: {lead.intent}
                    </span>
                )}
                {lead.industry && (
                    <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {lead.industry}
                    </span>
                )}
            </div>
        </motion.div>
    );
}

function StatCard({ label, value, sub, color = '#06b6d4', Icon, isMobile }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '18px 20px', flex: isMobile ? '0 0 160px' : '1 1 140px',
            scrollSnapAlign: isMobile ? 'center' : 'none'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>{label}</span>
                {Icon && <Icon style={{ width: 14, height: 14, color }} />}
            </div>
            <p style={{ fontSize: isMobile ? 28 : 32, fontWeight: 900, color, margin: '0 0 2px', lineHeight: 1 }}>{value}</p>
            {sub && <p style={{ fontSize: 10, color: '#6b7280', margin: 0 }}>{sub}</p>}
        </div>
    );
}

// ─── Tab: Score Lead ──────────────────────────────────────────────────────────
function ScoreLeadTab({ user }) {
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '', company: '',
        jobTitle: '', companySize: '', industry: '', message: '', source: ''
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);
    const [savingPipeline, setSavingPipeline] = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const scoreLeadHandler = async () => {
        if (!form.email || !form.company) { setError('Email and company name are required.'); return; }
        setLoading(true); setError(''); setResult(null); setSaved(false);
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/automation/score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Scoring failed');
            setResult(data);
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    };

    const addToPipeline = async () => {
        if (!result) return;
        setSavingPipeline(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/automation/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...form, ...result }),
            });
            const data = await res.json();
            if (!res.ok && res.status !== 409) throw new Error(data.error);
            setSaved(true);
        } catch (e) { setError(e.message); }
        finally { setSavingPipeline(false); }
    };

    const inputStyle = {
        width: '100%', background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
        padding: '10px 12px', color: '#fff', fontSize: 13, outline: 'none',
        boxSizing: 'border-box',
    };
    const labelStyle = { fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 5 };

    return (
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 20, height: '100%', overflow: 'hidden' }}>
            {/* Left: Form */}
            <div style={{ flex: isMobile ? 'none' : '0 0 340px', overflowY: isMobile ? 'visible' : 'auto', paddingRight: isMobile ? 0 : 4, maxHeight: isMobile ? 'none' : '100%' }}>
                <p style={{ fontSize: 11, color: '#4b5563', marginBottom: 16 }}>Fill in lead details to get an AI qualification score, persona classification, and personalized email.</p>

                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>First Name</label>
                        <input style={inputStyle} placeholder="Sarah" value={form.firstName} onChange={e => set('firstName', e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Last Name</label>
                        <input style={inputStyle} placeholder="Kim" value={form.lastName} onChange={e => set('lastName', e.target.value)} />
                    </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Email *</label>
                    <input style={inputStyle} placeholder="sarah@techwave.io" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Company *</label>
                    <input style={inputStyle} placeholder="TechWave Inc." value={form.company} onChange={e => set('company', e.target.value)} />
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Job Title</label>
                    <input style={inputStyle} placeholder="VP of Operations" value={form.jobTitle} onChange={e => set('jobTitle', e.target.value)} />
                </div>

                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Company Size</label>
                        <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.companySize} onChange={e => set('companySize', e.target.value)}>
                            <option value="">Select...</option>
                            {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Industry</label>
                        <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.industry} onChange={e => set('industry', e.target.value)}>
                            <option value="">Select...</option>
                            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Source</label>
                    <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.source} onChange={e => set('source', e.target.value)}>
                        <option value="">Select...</option>
                        {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Message / Notes</label>
                    <textarea
                        style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                        placeholder="We need to automate our onboarding by Q2. Budget is approved..."
                        value={form.message}
                        onChange={e => set('message', e.target.value)}
                    />
                </div>

                {error && (
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 12px', marginBottom: 12, color: '#fca5a5', fontSize: 12 }}>
                        {error}
                    </div>
                )}

                <button
                    onClick={scoreLeadHandler}
                    disabled={loading}
                    style={{
                        width: '100%', padding: '12px', borderRadius: 10,
                        background: loading ? 'rgba(79,142,247,0.3)' : 'linear-gradient(135deg, #4F8EF7, #7c3aed)',
                        border: 'none', color: '#fff', fontSize: 13, fontWeight: 700,
                        cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 8, transition: 'all 0.2s',
                    }}
                >
                    {loading ? <><RefreshCw style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> Scoring Lead...</> : <><Brain style={{ width: 14, height: 14 }} /> Score Lead with AI</>}
                </button>
            </div>

            {/* Right: Result */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <AnimatePresence>
                    {result ? (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                            {/* Score + Tier Header */}
                            <div style={{
                                background: 'rgba(255,255,255,0.03)', border: `1px solid ${(TIER_CONFIG[result.tier] || TIER_CONFIG.COLD).border}`,
                                borderRadius: 14, padding: 20, marginBottom: 12,
                                boxShadow: `0 0 30px ${(TIER_CONFIG[result.tier] || TIER_CONFIG.COLD).glow}`,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                                    <ScoreRing score={result.score} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                            <TierBadge tier={result.tier} size="lg" />
                                            {result.confidence < 0.65 && (
                                                <span style={{ fontSize: 9, padding: '3px 8px', borderRadius: 20, background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', fontWeight: 700 }}>
                                                    ⚠ FLAGGED FOR REVIEW
                                                </span>
                                            )}
                                        </div>
                                        <ConfidenceBar value={result.confidence} />
                                    </div>
                                </div>

                                {/* Signal Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                                    {[
                                        { label: 'Intent', value: result.intent },
                                        { label: 'Urgency', value: result.urgency },
                                        { label: 'Persona', value: result.persona },
                                        { label: 'Budget Prob.', value: result.budget_probability ? `${Math.round(result.budget_probability * 100)}%` : '—' },
                                        { label: 'Action', value: result.recommended_action?.split('+')?.[0] || '—' },
                                    ].map(({ label, value }) => (
                                        <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px' }}>
                                            <p style={{ fontSize: 9, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 3px' }}>{label}</p>
                                            <p style={{ fontSize: 11, fontWeight: 700, color: '#e5e7eb', margin: 0 }}>{value || '—'}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* AI Reasoning */}
                                <div style={{ background: 'rgba(79,142,247,0.06)', border: '1px solid rgba(79,142,247,0.12)', borderRadius: 10, padding: '10px 12px' }}>
                                    <p style={{ fontSize: 9, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px', fontWeight: 700 }}>AI Reasoning</p>
                                    <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, lineHeight: 1.5 }}>{result.reasoning}</p>
                                </div>

                                {/* Pain Points */}
                                {result.pain_points?.length > 0 && (
                                    <div style={{ marginTop: 10 }}>
                                        <p style={{ fontSize: 9, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px', fontWeight: 700 }}>Detected Pain Points</p>
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                            {result.pain_points.map((p, i) => (
                                                <span key={i} style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.15)' }}>
                                                    {p}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Personalized Email Preview */}
                            {result.emailPreview && (
                                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 18, marginBottom: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                        <Mail style={{ width: 14, height: 14, color: '#4F8EF7' }} />
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Personalized Email Preview</span>
                                    </div>
                                    <p style={{ fontSize: 11, color: '#4b5563', margin: '0 0 4px' }}>Subject:</p>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb', margin: '0 0 12px' }}>{result.emailPreview.subject}</p>
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                                        <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{result.emailPreview.body}</p>
                                    </div>
                                </div>
                            )}

                            {/* Add to Pipeline CTA */}
                            <button
                                onClick={addToPipeline}
                                disabled={savingPipeline || saved}
                                style={{
                                    width: '100%', padding: '12px', borderRadius: 10,
                                    background: saved ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                                    border: saved ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.1)',
                                    color: saved ? '#34d399' : '#9ca3af', fontSize: 13, fontWeight: 700,
                                    cursor: saved ? 'default' : 'pointer', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: 8,
                                }}
                            >
                                {saved ? <><Check style={{ width: 14, height: 14 }} /> Added to Pipeline</> : savingPipeline ? <>Processing...</> : <><ArrowRight style={{ width: 14, height: 14 }} /> Submit to Pipeline</>}
                            </button>
                        </motion.div>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#374151', gap: 12 }}>
                            <Brain style={{ width: 40, height: 40, opacity: 0.3 }} />
                            <p style={{ fontSize: 13, margin: 0, textAlign: 'center' }}>Fill in lead details and click<br /><strong style={{ color: '#4F8EF7' }}>Score Lead with AI</strong> to see results</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ─── Tab: Pipeline ────────────────────────────────────────────────────────────
function PipelineTab({ user }) {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLeads = useCallback(async () => {
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/automation/leads', { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setLeads(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [user]);

    useEffect(() => { fetchLeads(); }, [fetchLeads]);

    const byTier = (tier) => leads.filter(l => l.tier === tier);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#374151' }}>
            <RefreshCw style={{ animation: 'spin 1s linear infinite', width: 20, height: 20 }} />
        </div>
    );

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <p style={{ fontSize: 11, color: '#4b5563', margin: 0 }}>{leads.length} leads in pipeline</p>
                <button onClick={fetchLeads} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                    <RefreshCw style={{ width: 11, height: 11 }} /> Refresh
                </button>
            </div>

            {leads.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#374151', gap: 10 }}>
                    <Target style={{ width: 36, height: 36, opacity: 0.3 }} />
                    <p style={{ fontSize: 13, margin: 0 }}>No leads yet — score a lead to populate the pipeline</p>
                </div>
            ) : (
                <div style={{
                    flex: 1,
                    overflowY: isMobile ? 'visible' : 'auto',
                    display: isMobile ? 'flex' : 'grid',
                    flexDirection: isMobile ? 'column' : 'row',
                    gridTemplateColumns: isMobile ? 'none' : 'repeat(3, 1fr)',
                    gap: 14
                }}>
                    {['HOT', 'WARM', 'COLD'].map(tier => {
                        const cfg = TIER_CONFIG[tier];
                        const tierLeads = byTier(tier);
                        return (
                            <div key={tier} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${cfg.border}`, borderRadius: 14, padding: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <TierBadge tier={tier} />
                                    <span style={{ fontSize: 18, fontWeight: 900, color: cfg.color }}>{tierLeads.length}</span>
                                </div>
                                <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 340px)' }}>
                                    {tierLeads.length === 0 ? (
                                        <p style={{ fontSize: 11, color: '#374151', textAlign: 'center', padding: '20px 0' }}>No {tier.toLowerCase()} leads</p>
                                    ) : (
                                        tierLeads.map(lead => <LeadCard key={lead.id} lead={lead} />)
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Tab: Reports ─────────────────────────────────────────────────────────────
function ReportsTab({ user }) {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const token = await user.getIdToken();
                const res = await fetch('/api/automation/report', { headers: { Authorization: `Bearer ${token}` } });
                if (res.ok) setReport(await res.json());
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        })();
    }, [user]);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#374151' }}>
            <RefreshCw style={{ animation: 'spin 1s linear infinite', width: 20, height: 20 }} />
        </div>
    );

    if (!report || report.total === 0) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#374151', gap: 12 }}>
            <BarChart2 style={{ width: 40, height: 40, opacity: 0.3 }} />
            <p style={{ fontSize: 13, margin: 0, textAlign: 'center' }}>No pipeline data yet.<br />Score and submit leads to generate reports.</p>
        </div>
    );

    const hotPct = report.total > 0 ? Math.round((report.hot / report.total) * 100) : 0;
    const warmPct = report.total > 0 ? Math.round((report.warm / report.total) * 100) : 0;
    const coldPct = report.total > 0 ? Math.round((report.cold / report.total) * 100) : 0;

    return (
        <div style={{ overflowY: 'auto', height: '100%' }}>
            {/* KPI Row */}
            <div style={{
                display: 'flex',
                gap: 10,
                overflowX: isMobile ? 'auto' : 'visible',
                paddingBottom: isMobile ? 12 : 0,
                marginBottom: 18,
                scrollSnapType: isMobile ? 'x mandatory' : 'none',
                scrollbarWidth: 'none'
            }}>
                <StatCard label="Total Leads" value={report.total} sub="in pipeline" color="#4F8EF7" Icon={Users} isMobile={isMobile} />
                <StatCard label="Avg Score" value={report.avgScore} sub="out of 100" color="#f59e0b" Icon={TrendingUp} isMobile={isMobile} />
                <StatCard label="AI Confidence" value={`${Math.round(report.avgConfidence * 100)}%`} sub="average accuracy" color="#10b981" Icon={Brain} isMobile={isMobile} />
                <StatCard label="Review Queue" value={report.reviewPending} sub="needs human review" color="#ef4444" Icon={AlertTriangle} isMobile={isMobile} />
            </div>

            {/* Tier Distribution */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 18, marginBottom: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 14px' }}>Lead Tier Distribution</p>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    {[['HOT', report.hot, hotPct], ['WARM', report.warm, warmPct], ['COLD', report.cold, coldPct]].map(([tier, count, pct]) => {
                        const cfg = TIER_CONFIG[tier];
                        return (
                            <div key={tier} style={{ flex: 1, textAlign: 'center' }}>
                                <p style={{ fontSize: 28, fontWeight: 900, color: cfg.color, margin: '0 0 2px' }}>{count}</p>
                                <TierBadge tier={tier} />
                                <p style={{ fontSize: 10, color: '#4b5563', margin: '4px 0 0' }}>{pct}%</p>
                            </div>
                        );
                    })}
                </div>
                {/* Stacked Bar */}
                <div style={{ height: 8, borderRadius: 10, overflow: 'hidden', display: 'flex', gap: 2 }}>
                    {hotPct > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${hotPct}%` }} transition={{ duration: 0.8 }} style={{ background: '#ef4444', height: '100%', borderRadius: 10 }} />}
                    {warmPct > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${warmPct}%` }} transition={{ duration: 0.8, delay: 0.1 }} style={{ background: '#f59e0b', height: '100%', borderRadius: 10 }} />}
                    {coldPct > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${coldPct}%` }} transition={{ duration: 0.8, delay: 0.2 }} style={{ background: '#06b6d4', height: '100%', borderRadius: 10 }} />}
                </div>
            </div>

            {/* Recent Activity */}
            {report.leads?.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 18 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>Recent Activity</p>
                    {report.leads.map((lead, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < report.leads.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                            <div>
                                <p style={{ fontSize: 12, fontWeight: 600, color: '#e5e7eb', margin: 0 }}>{lead.company || 'Unknown Company'}</p>
                                <p style={{ fontSize: 10, color: '#4b5563', margin: 0 }}>{lead.jobTitle || lead.email || ''}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <TierBadge tier={lead.tier || 'COLD'} />
                                <p style={{ fontSize: 10, color: '#374151', margin: '3px 0 0' }}>Score: {lead.score}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Tab: Review Queue ────────────────────────────────────────────────────────
function ReviewQueueTab({ user }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resolving, setResolving] = useState({});

    const fetchQueue = useCallback(async () => {
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/automation/review', { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setItems(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [user]);

    useEffect(() => { fetchQueue(); }, [fetchQueue]);

    const resolve = async (id, action, overrideTier) => {
        setResolving(r => ({ ...r, [id]: true }));
        try {
            const token = await user.getIdToken();
            await fetch(`/api/automation/review/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ action, overrideTier }),
            });
            setItems(prev => prev.filter(i => i.id !== id));
        } catch (e) { console.error(e); }
        finally { setResolving(r => ({ ...r, [id]: false })); }
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#374151' }}>
            <RefreshCw style={{ animation: 'spin 1s linear infinite', width: 20, height: 20 }} />
        </div>
    );

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 11, color: '#4b5563', margin: 0 }}>
                        Leads where AI confidence &lt; 65% are flagged here for manual review before automation fires.
                    </p>
                </div>
                <button onClick={fetchQueue} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <RefreshCw style={{ width: 11, height: 11 }} />
                </button>
            </div>

            {items.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#374151', gap: 10 }}>
                    <CheckCircle style={{ width: 36, height: 36, color: '#10b981', opacity: 0.5 }} />
                    <p style={{ fontSize: 13, margin: 0 }}>Review queue is clear — all leads processed</p>
                </div>
            ) : (
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {items.map(item => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            style={{
                                background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)',
                                borderRadius: 12, padding: 16, marginBottom: 10,
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0 }}>{item.company}</p>
                                    <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>{item.firstName} {item.lastName} · {item.jobTitle}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <TierBadge tier={item.tier || 'COLD'} />
                                    <p style={{ fontSize: 10, color: '#6b7280', margin: '4px 0 0' }}>Score: {item.score} · Confidence: {Math.round((item.confidence || 0) * 100)}%</p>
                                </div>
                            </div>
                            <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 12px', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                                <strong>AI Reasoning:</strong> {item.reasoning}
                            </p>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    onClick={() => resolve(item.id, 'approve')}
                                    disabled={resolving[item.id]}
                                    style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                >
                                    ✓ Approve AI Decision
                                </button>
                                {['HOT', 'WARM', 'COLD'].filter(t => t !== item.tier).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => resolve(item.id, 'override', t)}
                                        disabled={resolving[item.id]}
                                        style={{
                                            padding: '8px 12px', borderRadius: 8,
                                            background: TIER_CONFIG[t].bg, border: `1px solid ${TIER_CONFIG[t].border}`,
                                            color: TIER_CONFIG[t].color, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                        }}
                                    >
                                        → {t}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main AutomationHub Component ─────────────────────────────────────────────
export default function AutomationHub({ onClose, user }) {
    const [activeTab, setActiveTab] = useState('blueprints');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 800);

    useEffect(() => {
        const h = () => setIsMobile(window.innerWidth < 800);
        window.addEventListener('resize', h);
        return () => window.removeEventListener('resize', h);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed', inset: 0, zIndex: 200,
                background: 'rgba(5,7,10,0.92)', backdropFilter: 'blur(16px)',
                display: 'flex', flexDirection: 'column',
                fontFamily: "'Outfit', sans-serif",
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'linear-gradient(135deg, rgba(79,142,247,0.2), rgba(124,58,237,0.2))',
                        border: '1px solid rgba(79,142,247,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Zap style={{ width: 18, height: 18, color: '#4F8EF7' }} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: 0 }}>Automation Hub</h2>
                        <p style={{ fontSize: 10, color: '#374151', margin: 0, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Nexovgen AI Workflow Engine</p>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    gap: 4,
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 10,
                    padding: 4,
                    overflowX: isMobile ? 'auto' : 'visible',
                    maxWidth: isMobile ? 'calc(100vw - 120px)' : 'none',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}>
                    <style>{`
                        div::-webkit-scrollbar { display: none; }
                    `}</style>
                    {TABS.map(({ id, label, Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: isMobile ? '7px 16px' : '7px 14px', borderRadius: 8, border: 'none',
                                background: activeTab === id ? 'rgba(79,142,247,0.15)' : 'none',
                                color: activeTab === id ? '#4F8EF7' : '#4b5563',
                                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                transition: 'all 0.15s',
                                borderBottom: activeTab === id ? '2px solid #4F8EF7' : '2px solid transparent',
                                whiteSpace: 'nowrap', flexShrink: 0
                            }}
                        >
                            <Icon style={{ width: 13, height: 13 }} />
                            {label}
                        </button>
                    ))}
                </div>

                <button
                    onClick={onClose}
                    style={{
                        width: 34, height: 34, borderRadius: 9, border: 'none',
                        background: 'rgba(255,255,255,0.05)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280',
                    }}
                >
                    <X style={{ width: 16, height: 16 }} />
                </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflow: 'hidden', padding: '20px 24px' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        style={{ height: '100%' }}
                    >
                        {activeTab === 'blueprints' && <BlueprintCanvas user={user} />}
                        {activeTab === 'pipeline' && <PipelineTab user={user} />}
                        {activeTab === 'reports' && <ReportsTab user={user} />}
                        {activeTab === 'review' && <ReviewQueueTab user={user} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
