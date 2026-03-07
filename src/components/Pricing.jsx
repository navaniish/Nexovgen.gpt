import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Zap, Star, Rocket, Building2, ArrowRight, Sparkles, Code2, Users } from 'lucide-react';
import Logo from './Logo';


const TIERS = [
    {
        id: 'free',
        name: 'Free',
        tag: 'Get Started',
        icon: Zap,
        color: '#9ca3af',
        priceInr: 0,
        priceUsd: 0,
        tokens: '100K tokens/mo',
        description: 'Perfect for students and early explorers to get a feel for AI OS.',
        cta: 'Start for Free',
        highlight: false,
        features: [
            { label: '100K tokens / month', included: true },
            { label: '20 Messages / day', included: true },
            { label: '1 AI Mentor (Basic)', included: true },
            { label: '1 Active Project', included: true },
            { label: 'Community Support', included: true },
            { label: 'AI Agents', included: false },
            { label: 'API Access', included: false },
            { label: 'Automation Flows', included: false },
        ]
    },
    {
        id: 'starter',
        name: 'Starter',
        tag: 'Education',
        icon: Rocket,
        color: '#10b981',
        priceInr: 499,
        priceUsd: 6,
        tokens: '500K tokens/mo',
        description: 'Aggressive pricing for ambitious students and beginners.',
        cta: 'Upgrade to Starter',
        highlight: false,
        features: [
            { label: '500K tokens / month', included: true },
            { label: 'Unlimited Basic Chat', included: true },
            { label: 'All 5 AI Mentors', included: true },
            { label: '3 Active Projects', included: true },
            { label: '5 Workflow Runs / mo', included: true },
            { label: 'AI Agents', included: false },
            { label: 'API Access', included: false },
        ]
    },
    {
        id: 'pro',
        name: 'Pro',
        tag: 'Best Value',
        icon: Star,
        color: '#06b6d4',
        priceInr: 999,
        priceUsd: 12,
        tokens: '2M tokens/mo',
        description: 'The sweet spot for freelancers and power users.',
        cta: 'Get Pro Access',
        highlight: true,
        features: [
            { label: '2M tokens / month', included: true },
            { label: '3 Active AI Agents', included: true },
            { label: 'Unlimited Projects', included: true },
            { label: 'Advanced Tools', included: true },
            { label: 'Priority Support', included: true },
            { label: 'Beta Features', included: true },
        ]
    },
    {
        id: 'creator',
        name: 'Creator',
        tag: 'Visual AI',
        icon: Sparkles,
        color: '#ec4899',
        priceInr: 1999,
        priceUsd: 24,
        tokens: '5M tokens/mo',
        description: 'For influencers and creators needing heavy AI media.',
        cta: 'Start Creating',
        highlight: false,
        features: [
            { label: '5M tokens / month', included: true },
            { label: 'High-res Image Gen', included: true },
            { label: 'AI Video Gen (Basic)', included: true },
            { label: 'Custom Branding', included: true },
            { label: 'Social Auto-post', included: true },
        ]
    },
    {
        id: 'developer',
        name: 'Developer',
        tag: 'Build with Us',
        icon: Code2,
        color: '#8b5cf6',
        priceInr: 2999,
        priceUsd: 36,
        tokens: '10M tokens/mo',
        description: 'Full stack AI infrastructure for SaaS founders.',
        cta: 'Start Coding',
        highlight: false,
        features: [
            { label: '10M tokens / month', included: true },
            { label: 'Full API Access', included: true },
            { label: 'Agent Webhooks', included: true },
            { label: 'Custom AI Models', included: true },
            { label: 'Dev Console', included: true },
        ]
    },
    {
        id: 'team',
        name: 'Team',
        tag: 'Scale Fast',
        icon: Users,
        color: '#6366f1',
        priceInr: 7999,
        priceUsd: 99,
        tokens: '50M tokens/mo',
        description: 'Collaborative AI workspace for small teams.',
        cta: 'Create Team',
        highlight: false,
        features: [
            { label: '5 Seats Included', included: true },
            { label: 'Shared Knowledge Base', included: true },
            { label: 'Shared Workflows', included: true },
            { label: 'Admin Dashboard', included: true },
            { label: 'SSO (Google/MSFT)', included: true },
        ]
    },
    {
        id: 'enterprise',
        name: 'Elite',
        tag: 'Max Power',
        icon: Building2,
        color: '#f59e0b',
        priceInr: null,
        priceUsd: null,
        tokens: 'Unlimited',
        description: 'Custom infrastructure for heavy enterprise loads.',
        cta: 'Contact Sales',
        highlight: false,
        features: [
            { label: 'Unlimited tokens', included: true },
            { label: 'Private Deployment', included: true },
            { label: 'Dedicated Account Manager', included: true },
            { label: 'SLA 99.99%', included: true },
            { label: 'White Labeling', included: true },
        ]
    }
];

const FEATURE_TABLE = [
    { label: 'Monthly Tokens', values: ['100K', '500K', '2M', '5M', '10M', '50M', 'Custom'] },
    { label: 'AI Mentors', values: ['Basic', 'All 5', 'All 5', 'All 5', 'All 5', 'All 5', 'Custom'] },
    { label: 'Active Projects', values: ['1', '3', 'Unlimited', 'Unlimited', 'Unlimited', 'Unlimited', 'Unlimited'] },
    { label: 'AI Agents', values: ['—', '—', '3', '10', '20', 'Unlimited', 'Custom'] },
    { label: 'API Access', values: [false, false, false, false, true, true, true] },
    { label: 'Integrations', values: ['Basic', 'Basic', 'Standard', 'Premium', 'Developer', 'Team', 'Custom'] },
    { label: 'Team Seats', values: ['1', '1', '1', '1', '1', '5+', 'Custom'] },
    { label: 'Support', values: ['Community', 'Email', 'Priority', 'Priority', 'Dev Support', 'Dedicated', 'Dedicated AM'] },
];


function FeatureValue({ val }) {
    if (val === true) return <Check style={{ width: 16, height: 16, color: '#10b981', margin: '0 auto' }} />;
    if (val === false) return <X style={{ width: 14, height: 14, color: '#374151', margin: '0 auto' }} />;
    return <span style={{ fontSize: 12, color: '#9ca3af' }}>{val}</span>;
}

export default function Pricing({ onClose, currentPlanId = 'free', onSelectPlan }) {
    const [currency, setCurrency] = useState('INR'); // 'INR' or 'USD'
    const [activeTable, setActiveTable] = useState(false);

    const handleSelect = (tier) => {
        if (tier.id === 'enterprise') {
            window.location.href = 'mailto:nexovgen.contact@zohomail.in';
            return;
        }

        if (tier.id !== 'free') {
            const price = currency === 'INR' ? tier.priceInr : tier.priceUsd;
            // Open Razorpay with dynamic amount
            window.open(`https://razorpay.me/@NEXOVGEN/${price}`, '_blank');
        }

        if (onSelectPlan) {
            onSelectPlan(tier);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#0a0c10', overflowY: 'auto', fontFamily: "'Outfit', sans-serif" }}>

            {/* Header */}
            <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(10,12,16,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Logo size="sm" />
                    <span style={{ fontWeight: 800, fontSize: 13, color: '#06b6d4', letterSpacing: '0.1em', textTransform: 'uppercase', marginLeft: -5, opacity: 0.8 }}>| Pricing</span>
                </div>
                <button onClick={onClose} style={{ padding: '7px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#9ca3af', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
                    ← Back to App
                </button>
            </div>

            <div style={{ maxWidth: 1120, margin: '0 auto', padding: '48px 24px 80px' }}>

                {/* Hero */}
                <div style={{ textAlign: 'center', marginBottom: 48 }}>
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 20, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', marginBottom: 20 }}>
                        <Sparkles style={{ width: 12, height: 12, color: '#06b6d4' }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.15em' }}>India-First AI Ecosystem</span>
                    </motion.div>
                    <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                        style={{ fontSize: 'clamp(28px,5vw,52px)', fontWeight: 900, color: '#fff', margin: '0 0 14px', lineHeight: 1.1 }}>
                        Choose Your<br />
                        <span style={{ background: 'linear-gradient(90deg,#06b6d4,#8b5cf6,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Nexovgen GPT Plan</span>
                    </motion.h1>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                        style={{ fontSize: 16, color: '#6b7280', maxWidth: 500, margin: '0 auto 32px' }}>
                        From students to enterprises, we have the right intelligence layer for your growth.
                    </motion.p>

                    {/* Currency Toggle */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '6px 8px', marginBottom: 32 }}>
                        <button onClick={() => setCurrency('INR')}
                            style={{ padding: '8px 22px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: "'Outfit',sans-serif", transition: 'all 0.2s', background: currency === 'INR' ? '#fff' : 'transparent', color: currency === 'INR' ? '#0a0c10' : '#6b7280' }}>
                            ₹ INR
                        </button>
                        <button onClick={() => setCurrency('USD')}
                            style={{ padding: '8px 22px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: "'Outfit',sans-serif", transition: 'all 0.2s', background: currency === 'USD' ? '#fff' : 'transparent', color: currency === 'USD' ? '#0a0c10' : '#6b7280' }}>
                            $ USD
                        </button>
                    </div>

                    {/* Student Banner */}
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                        style={{ maxWidth: 640, margin: '0 auto 40px', padding: '16px 24px', borderRadius: 16, border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Star style={{ width: 20, height: 20, color: '#10b981' }} />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: 0 }}>University Program</p>
                            <p style={{ fontSize: 12, color: '#10b981', margin: 0, fontWeight: 600 }}>Get 50% OFF on all plans with a valid student ID.</p>
                        </div>
                    </motion.div>
                </div>

                {/* Tier Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 60 }}>
                    {TIERS.map((tier, i) => {
                        const TIcon = tier.icon;
                        const isCurrent = currentPlanId === tier.id;
                        const price = currency === 'INR' ? tier.priceInr : tier.priceUsd;
                        const symbol = currency === 'INR' ? '₹' : '$';

                        return (
                            <motion.div key={tier.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                style={{ position: 'relative', borderRadius: 20, padding: tier.highlight ? '28px 24px' : '24px', border: isCurrent ? `2px solid ${tier.color}` : tier.highlight ? `1px solid ${tier.color}40` : '1px solid rgba(255,255,255,0.07)', background: tier.highlight ? `linear-gradient(160deg, ${tier.color}10, rgba(10,12,16,0.8))` : 'rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', boxShadow: tier.highlight ? `0 0 60px ${tier.color}15` : 'none' }}>

                                {isCurrent && (
                                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: tier.color, padding: '4px 16px', borderRadius: 20, fontSize: 10, fontWeight: 800, color: '#0a0c10', textTransform: 'uppercase', letterSpacing: '0.15em', whiteSpace: 'nowrap' }}>
                                        Current Plan
                                    </div>
                                )}

                                {!isCurrent && tier.highlight && (
                                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(90deg, ${tier.color}, #8b5cf6)`, padding: '4px 16px', borderRadius: 20, fontSize: 10, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.15em', whiteSpace: 'nowrap' }}>
                                        ★ Most Popular
                                    </div>
                                )}

                                {/* Tier tag */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <span style={{ fontSize: 9, fontWeight: 800, color: tier.color, textTransform: 'uppercase', letterSpacing: '0.15em', background: `${tier.color}18`, padding: '3px 10px', borderRadius: 6 }}>{tier.tag}</span>
                                    <div style={{ width: 34, height: 34, borderRadius: 10, background: `${tier.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <TIcon style={{ width: 16, height: 16, color: tier.color }} />
                                    </div>
                                </div>

                                {/* Name */}
                                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>{tier.name}</h2>
                                <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 20px', lineHeight: 1.5, minHeight: 36 }}>{tier.description}</p>

                                {/* Price */}
                                <div style={{ marginBottom: 24 }}>
                                    {price !== null ? (
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                                            <span style={{ fontSize: 42, fontWeight: 900, color: '#fff' }}>
                                                {symbol}{price}
                                            </span>
                                            <span style={{ fontSize: 13, color: '#6b7280' }}>/mo</span>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                                            <span style={{ fontSize: 42, fontWeight: 900, color: tier.color }}>Custom</span>
                                        </div>
                                    )}
                                </div>

                                {/* Token badge */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 20 }}>
                                    <Zap style={{ width: 12, height: 12, color: tier.color }} />
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af' }}>{tier.tokens}</span>
                                </div>

                                {/* Features */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                                    {tier.features.map(f => (
                                        <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {f.included
                                                ? <Check style={{ width: 14, height: 14, color: '#10b981', flexShrink: 0 }} />
                                                : <X style={{ width: 12, height: 12, color: '#2d3748', flexShrink: 0 }} />}
                                            <span style={{ fontSize: 12, color: f.included ? '#d1d5db' : '#374151' }}>{f.label}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* CTA */}
                                <button
                                    onClick={() => handleSelect(tier)}
                                    disabled={isCurrent}
                                    style={{ width: '100%', padding: '13px', borderRadius: 12, border: isCurrent ? '1px solid rgba(255,255,255,0.1)' : tier.highlight ? 'none' : `1px solid ${tier.color}30`, cursor: isCurrent ? 'default' : 'pointer', fontSize: 13, fontWeight: 700, fontFamily: "'Outfit',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all 0.2s', background: isCurrent ? 'rgba(255,255,255,0.05)' : tier.highlight ? `linear-gradient(135deg, ${tier.color}, #8b5cf6)` : `${tier.color}12`, color: isCurrent ? '#4b5563' : tier.highlight ? '#fff' : tier.color }}
                                    onMouseEnter={e => { if (!tier.highlight && !isCurrent) { e.currentTarget.style.background = `${tier.color}22`; } }}
                                    onMouseLeave={e => { if (!tier.highlight && !isCurrent) { e.currentTarget.style.background = `${tier.color}12`; } }}>
                                    {isCurrent ? 'Current' : tier.cta}
                                    {!isCurrent && <ArrowRight style={{ width: 14, height: 14 }} />}
                                </button>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Feature Comparison Table */}
                <div style={{ marginBottom: 60 }}>
                    <button onClick={() => setActiveTable(t => !t)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto 24px', padding: '10px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#9ca3af', fontFamily: "'Outfit',sans-serif" }}>
                        {activeTable ? 'Hide' : 'Show'} Full Feature Comparison
                    </button>

                    <AnimatePresence>
                        {activeTable && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                                <div style={{ overflowX: 'auto', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                                                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Feature</th>
                                                {TIERS.map(t => (
                                                    <th key={t.id} style={{ padding: '14px 20px', textAlign: 'center', fontSize: 13, fontWeight: 800, color: t.color, whiteSpace: 'nowrap' }}>{t.name}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {FEATURE_TABLE.map((row, i) => (
                                                <tr key={row.label} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                                                    <td style={{ padding: '11px 20px', fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>{row.label}</td>
                                                    {row.values.map((val, vi) => (
                                                        <td key={vi} style={{ padding: '11px 20px', textAlign: 'center' }}>
                                                            <FeatureValue val={val} />
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Revenue Transparency ─────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    style={{ marginBottom: 60, borderRadius: 24, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}
                >
                    {/* Top gradient accent */}
                    <div style={{ height: 3, background: 'linear-gradient(90deg, #06b6d4 50%, #8b5cf6 50%)' }} />

                    <div style={{ padding: '40px 40px 36px' }}>
                        {/* Heading */}
                        <div style={{ textAlign: 'center', marginBottom: 36 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 14 }}>
                                <span style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Transparent by Design</span>
                            </div>
                            <h2 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: '0 0 10px' }}>Where Your Money Goes</h2>
                            <p style={{ fontSize: 14, color: '#6b7280', margin: 0, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
                                Every rupee you pay is split equally. Half directly powers your AI experience — the other half builds the future of NexovGen.
                            </p>
                        </div>

                        {/* Animated split bar */}
                        <div style={{ maxWidth: 600, margin: '0 auto 36px', position: 'relative' }}>
                            <div style={{ display: 'flex', height: 14, borderRadius: 99, overflow: 'hidden', background: 'rgba(255,255,255,0.04)' }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: '50%' }} transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
                                    style={{ background: 'linear-gradient(90deg, #06b6d4, #0891b2)', borderRadius: '99px 0 0 99px' }} />
                                <motion.div initial={{ width: 0 }} animate={{ width: '50%' }} transition={{ duration: 1.2, ease: 'easeOut', delay: 0.6 }}
                                    style={{ background: 'linear-gradient(90deg, #7c3aed, #8b5cf6)', borderRadius: '0 99px 99px 0' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#06b6d4' }}>50% → AI Upgradation</span>
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#8b5cf6' }}>50% → NexovGen</span>
                            </div>
                        </div>

                        {/* Two panels */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            {/* Left — AI Upgradation */}
                            <div style={{ padding: 28, borderRadius: 18, background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.04 }}>
                                    <Zap size={100} />
                                </div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 14, background: 'rgba(6,182,212,0.12)', marginBottom: 16 }}>
                                    <Zap style={{ width: 22, height: 22, color: '#06b6d4' }} />
                                </div>
                                <h3 style={{ fontSize: 17, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>
                                    AI Upgradation <span style={{ fontSize: 13, color: '#06b6d4', fontWeight: 700 }}>50%</span>
                                </h3>
                                <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 18px', lineHeight: 1.6 }}>
                                    Directly reinvested into AI token quotas, model API costs, and infrastructure upgrades — so your AI gets smarter over time.
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {[
                                        'GPT-4o & Gemini API tokens',
                                        'Claude & open-source models',
                                        'GPU inference infrastructure',
                                        'Context window upgrades',
                                        'Higher rate limits for you',
                                    ].map(item => (
                                        <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#06b6d4', flexShrink: 0 }} />
                                            <span style={{ fontSize: 12, color: '#9ca3af' }}>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right — NexovGen */}
                            <div style={{ padding: 28, borderRadius: 18, background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.04 }}>
                                    <Rocket size={100} />
                                </div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 14, background: 'rgba(139,92,246,0.12)', marginBottom: 16 }}>
                                    <Rocket style={{ width: 22, height: 22, color: '#8b5cf6' }} />
                                </div>
                                <h3 style={{ fontSize: 17, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>
                                    NexovGen Growth <span style={{ fontSize: 13, color: '#8b5cf6', fontWeight: 700 }}>50%</span>
                                </h3>
                                <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 18px', lineHeight: 1.6 }}>
                                    Funds the platform, product, and team — building India's most ambitious AI OS from the ground up.
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {[
                                        'Platform development & R&D',
                                        'NexovGen custom model training',
                                        'Core team & operations',
                                        'Security & compliance',
                                        'New features & product growth',
                                    ].map(item => (
                                        <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#8b5cf6', flexShrink: 0 }} />
                                            <span style={{ fontSize: 12, color: '#9ca3af' }}>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Trust line */}
                        <p style={{ textAlign: 'center', fontSize: 11, color: '#374151', marginTop: 28, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            No investor lock-in · Revenue-funded · You power our growth
                        </p>
                    </div>
                </motion.div>

                {/* Enterprise CTA */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    style={{ borderRadius: 20, padding: '40px 32px', border: '1px solid rgba(245,158,11,0.2)', background: 'linear-gradient(135deg,rgba(245,158,11,0.06),rgba(139,92,246,0.06))', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#f59e0b,#8b5cf6,#06b6d4)' }} />
                    <Building2 style={{ width: 36, height: 36, color: '#f59e0b', margin: '0 auto 16px' }} />
                    <h2 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: '0 0 10px' }}>Need Enterprise?</h2>
                    <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.6 }}>
                        Dedicated infrastructure, custom fine-tuned models, white labeling, on-premise deployment, and a dedicated account manager. Let's build something custom.
                    </p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => window.location.href = 'mailto:nexovgen.contact@zohomail.in'}
                            style={{ padding: '12px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, color: '#0a0c10', fontFamily: "'Outfit',sans-serif", display: 'flex', alignItems: 'center', gap: 7 }}>
                            Contact Sales <ArrowRight style={{ width: 14, height: 14 }} />
                        </button>
                        <button
                            onClick={() => window.location.href = 'mailto:nexovgen.contact@zohomail.in'}
                            style={{ padding: '12px 28px', borderRadius: 12, background: 'transparent', border: '1px solid rgba(245,158,11,0.3)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#f59e0b', fontFamily: "'Outfit',sans-serif" }}>
                            Book a Demo
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginTop: 28 }}>
                        {['SOC2 Compliant', 'GDPR Ready', 'HIPAA Compatible', 'White Label', 'On-Premise'].map(badge => (
                            <div key={badge} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Check style={{ width: 12, height: 12, color: '#10b981' }} />
                                <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{badge}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* FAQ footer note */}
                <p style={{ textAlign: 'center', fontSize: 11, color: '#374151', marginTop: 40, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                    All plans include a 14-day free trial · No credit card required · Cancel anytime
                </p>
                <div style={{ textAlign: 'center', marginTop: 32 }}>
                    <a href="mailto:nexovgen.contact@zohomail.in" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#06b6d4'}
                        onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}>
                        Contact Support: nexovgen.contact@zohomail.in
                    </a>
                </div>
            </div>
        </div>
    );
}
