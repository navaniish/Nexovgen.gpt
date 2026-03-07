import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, LayoutTemplate, Command as CommandIcon, Star } from 'lucide-react';

export default function CommandOverlay({ visible, cursorPosition, mentors, templates, onSelect }) {
    const [activeIndex, setActiveIndex] = useState(0);

    const items = [
        ...mentors.map(m => ({ id: `mentor-${m.id}`, type: 'mentor', label: m.name, sub: m.role, icon: m.icon, color: m.color, data: m })),
        ...templates.map(t => ({ id: `template-${t.id}`, type: 'template', label: t.name, sub: t.description, icon: LayoutTemplate, color: '#8b5cf6', data: t }))
    ].slice(0, 8); // Keep it compact

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!visible) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(prev => (prev + 1) % items.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prev => (prev - 1 + items.length) % items.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                onSelect(items[activeIndex]);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [visible, activeIndex, items]);

    if (!visible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 12px)',
                    left: 0,
                    width: '100%',
                    maxWidth: 320,
                    background: '#111318',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16,
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    padding: 8,
                    zIndex: 100,
                    overflow: 'hidden'
                }}
            >
                <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <CommandIcon size={12} color="#4b5563" />
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Quick Shortcuts</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {items.map((item, idx) => {
                        const Icon = item.icon;
                        const active = idx === activeIndex;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onSelect(item)}
                                onMouseEnter={() => setActiveIndex(idx)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '10px 12px',
                                    borderRadius: 10,
                                    border: 'none',
                                    background: active ? 'rgba(255,255,255,0.05)' : 'transparent',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Icon size={14} color={item.color} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: active ? '#fff' : '#9ca3af', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</p>
                                    <p style={{ fontSize: 9, color: '#4b5563', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.sub}</p>
                                </div>
                                {active && <Star size={10} color={item.color} fill={item.color} />}
                            </button>
                        );
                    })}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
