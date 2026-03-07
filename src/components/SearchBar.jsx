import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MessageSquare, LayoutTemplate, Command, Clock, ArrowRight, Zap, Lock } from 'lucide-react';
import useSearch from '../hooks/useSearch';

const Highlighter = ({ text, query }) => {
    if (!query.trim()) return <span>{text}</span>;
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const escapedWords = words.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');
    const parts = text.split(regex);
    return (
        <span>
            {parts.map((part, i) =>
                words.includes(part.toLowerCase()) ?
                    <span key={i} style={{ color: '#06b6d4', background: 'rgba(6,182,212,0.1)', borderRadius: 2, padding: '0 2px' }}>{part}</span> :
                    <span key={i}>{part}</span>
            )}
        </span>
    );
};

export default function SearchBar({ isOpen, onClose, history, templates, onSelectChat, onSelectTemplate, setShowPricing, logout }) {
    const { query, setQuery, results } = useSearch(history, templates);
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeCategory, setActiveCategory] = useState('all');
    const [recentSearches, setRecentSearches] = useState([]);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef(null);

    // Load recent searches
    useEffect(() => {
        const saved = localStorage.getItem('recent_searches');
        if (saved) setRecentSearches(JSON.parse(saved));
    }, []);

    // Flat list logic
    const flatResults = useMemo(() => {
        const trimmedQuery = query.trim();

        if (activeCategory === 'all' && !trimmedQuery) {
            return recentSearches.map(q => ({ id: `recent-${q}`, title: q, searchType: 'recent' }));
        }

        const categoryResults = [];
        if (activeCategory === 'all' || activeCategory === 'actions') {
            categoryResults.push(...results.actions);
        }
        if (activeCategory === 'all' || activeCategory === 'chats') {
            categoryResults.push(...results.chats);
        }
        if (activeCategory === 'all' || activeCategory === 'templates') {
            categoryResults.push(...results.templates);
        }

        // If no query, we might want to limit the number of items shown per category
        if (!trimmedQuery) {
            // For categories other than 'all', show all items in that category (up to a limit if needed)
            return categoryResults;
        }

        return categoryResults;
    }, [query, results, activeCategory, recentSearches]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setActiveIndex(0);
            setQuery('');
        }
    }, [isOpen]);

    // Handle Keyboard Nav
    useEffect(() => {
        const handleKeys = (e) => {
            if (!isOpen) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(prev => (prev + 1) % (flatResults.length || 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prev => (prev - 1 + flatResults.length) % (flatResults.length || 1));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                handleAction(flatResults[activeIndex]);
            } else if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [isOpen, flatResults, activeIndex]);

    const handleAction = (item) => {
        if (!item) return;

        // Save to recent
        if (query.trim() && !item.searchType === 'recent') {
            const updatedRecents = [query.trim(), ...recentSearches.filter(q => q !== query.trim())].slice(0, 5);
            setRecentSearches(updatedRecents);
            localStorage.setItem('recent_searches', JSON.stringify(updatedRecents));
        }

        if (item.searchType === 'recent') {
            setQuery(item.title);
            return;
        }

        if (item.searchType === 'chat') onSelectChat(item);
        if (item.searchType === 'template') onSelectTemplate(item);
        if (item.searchType === 'action') {
            // Handle internal commands
            if (item.command === '/new') onSelectChat({ messages: [] });
            if (item.command === '/auth') logout(); // Redirect to auth by logging out (or logic for login screen)
            if (item.command === '/pricing') setShowPricing(true);
            if (item.command === '/templates') onSelectTemplate(null);
        }
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(10,12,16,0.8)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '10vh 20px' }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                        style={{
                            width: '100%',
                            maxWidth: 680,
                            background: 'rgba(17, 19, 24, 0.85)',
                            backdropFilter: 'blur(32px) saturate(180%)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 28,
                            boxShadow: '0 50px 120px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.05)',
                            overflow: 'hidden',
                            position: 'relative'
                        }}
                        className="border-beam-container"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Border Beam Effect */}
                        <div className="border-beam" />

                        {/* Premium Glow Decor */}
                        <div style={{ position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)', width: 300, height: 100, background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', opacity: 0.15, filter: 'blur(80px)', borderRadius: '50%', pointerEvents: 'none', zIndex: -1 }} />

                        {/* Shimmer Background */}
                        <div className="shimmer-bg" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.4, zIndex: -1 }} />
                        {/* Search Input Area */}
                        <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 20, position: 'relative', zIndex: 1, background: isFocused ? 'rgba(6,182,212,0.03)' : 'transparent', transition: 'background 0.3s' }}>
                            <motion.div
                                animate={isFocused ? { scale: 1.1, filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.4))' } : { scale: 1 }}
                                style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Search style={{ width: 22, height: 22, color: '#06b6d4' }} />
                            </motion.div>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search everything in NexovGen..."
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 18, fontWeight: 500, fontFamily: "'Outfit', sans-serif" }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}>
                                <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em' }}>ESC</span>
                            </div>
                        </div>

                        {/* Filter Tabs & Content */}
                        <div style={{ display: 'flex', height: 420 }}>
                            {/* Left Side: Categories */}
                            <div style={{ width: 170, borderRight: '1px solid rgba(255,255,255,0.06)', padding: 16, display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(255,255,255,0.02)', position: 'relative' }}>
                                <p style={{ fontSize: 9, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, paddingLeft: 8 }}>Categories</p>
                                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {[
                                        { id: 'all', label: 'Everything', icon: Zap, color: '#06b6d4' },
                                        { id: 'actions', label: 'Actions', icon: Command, color: '#10b981' },
                                        { id: 'chats', label: 'Chats', icon: MessageSquare, color: '#3b82f6' },
                                        { id: 'templates', label: 'Templates', icon: LayoutTemplate, color: '#8b5cf6' },
                                    ].map(cat => (
                                        <motion.button
                                            key={cat.id}
                                            whileHover={{ x: 4 }}
                                            onClick={() => setActiveCategory(cat.id)}
                                            style={{
                                                width: '100%',
                                                padding: '12px 14px',
                                                borderRadius: 14,
                                                border: 'none',
                                                background: 'transparent',
                                                color: activeCategory === cat.id ? cat.color : '#94a3b8',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                fontSize: 13,
                                                fontWeight: 600,
                                                fontFamily: "'Outfit', sans-serif",
                                                position: 'relative',
                                                zIndex: 1
                                            }}
                                        >
                                            {activeCategory === cat.id && (
                                                <motion.div
                                                    layoutId="cat-indicator"
                                                    style={{ position: 'absolute', inset: 0, background: `${cat.color}15`, borderRadius: 14, zIndex: -1 }}
                                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                                />
                                            )}
                                            <cat.icon size={16} />
                                            {cat.label}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Right Side: Results */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
                                {flatResults.length > 0 ? (
                                    <motion.div
                                        layout
                                        style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                                    >
                                        <AnimatePresence mode="popLayout">
                                            {flatResults.map((item, idx) => {
                                                const isActive = idx === activeIndex;
                                                let Icon = Search;
                                                let iconColor = '#6b7280';
                                                let iconBg = 'rgba(255,255,255,0.03)';

                                                if (item.searchType === 'chat') { Icon = MessageSquare; iconColor = '#06b6d4'; iconBg = 'rgba(6,182,212,0.1)'; }
                                                if (item.searchType === 'template') { Icon = LayoutTemplate; iconColor = '#8b5cf6'; iconBg = 'rgba(139,92,246,0.1)'; }
                                                if (item.searchType === 'action') {
                                                    Icon = item.iconType === 'chat' ? MessageSquare : item.iconType === 'lock' ? Lock : item.iconType === 'zap' ? Zap : LayoutTemplate;
                                                    iconColor = '#10b981'; iconBg = 'rgba(16,185,129,0.1)';
                                                }
                                                if (item.searchType === 'recent') { Icon = Clock; }

                                                return (
                                                    <motion.button
                                                        key={item.id}
                                                        layout
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.98 }}
                                                        whileHover={{ x: 4, background: 'rgba(255,255,255,0.06)' }}
                                                        onMouseEnter={() => setActiveIndex(idx)}
                                                        onClick={() => handleAction(item)}
                                                        style={{ width: '100%', padding: '14px 18px', borderRadius: 16, border: 'none', background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.2s', boxShadow: isActive ? '0 4px 20px rgba(0,0,0,0.2)' : 'none' }}
                                                    >
                                                        <div style={{ width: 40, height: 40, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${iconColor}20` }}>
                                                            <Icon size={18} color={iconColor} />
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <p style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                <Highlighter text={item.title} query={query} />
                                                            </p>
                                                            {item.subtitle && (
                                                                <p style={{ fontSize: 12, color: '#64748b', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.01em' }}>
                                                                    <Highlighter text={item.subtitle} query={query} />
                                                                </p>
                                                            )}
                                                        </div>
                                                        {isActive && (
                                                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                                                                <ArrowRight size={16} color="#06b6d4" />
                                                            </motion.div>
                                                        )}
                                                    </motion.button>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </motion.div>
                                ) : (
                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5, textAlign: 'center', padding: 40 }}>
                                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                            <Search size={24} color="#374151" />
                                        </div>
                                        <p style={{ fontSize: 13, color: '#fff', fontWeight: 600, margin: '0 0 4px' }}>No results found</p>
                                        <p style={{ fontSize: 11, color: '#4b5563' }}>Try searching for a different keyword or category.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer / Shortcuts */}
                        <div style={{ padding: '12px 24px', background: 'rgba(0,0,0,0.1)', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 9, color: '#6b7280', fontWeight: 800 }}>ENTER</div>
                                <span style={{ fontSize: 10, color: '#4b5563', fontWeight: 600 }}>to select</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ display: 'flex', gap: 3 }}>
                                    <div style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 9, color: '#6b7280', fontWeight: 800 }}>↑</div>
                                    <div style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 9, color: '#6b7280', fontWeight: 800 }}>↓</div>
                                </div>
                                <span style={{ fontSize: 10, color: '#4b5563', fontWeight: 600 }}>to navigate</span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
