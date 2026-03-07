import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Plus, Sparkles, Layout, Code, Zap, Bot,
    X, ChevronRight, Copy, Save, Share2, Filter,
    Trash2, Edit3, Play, Box, Globe, Lock
} from 'lucide-react';
import Logo from './Logo';
import { db, collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc } from '../lib/firebase';

const CATEGORIES = [
    { id: 'all', name: 'All Templates', icon: Globe },
    { id: 'prompts', name: 'Prompts', icon: Code },
    { id: 'workflows', name: 'Workflows', icon: Zap },
    { id: 'agents', name: 'Agents', icon: Bot },
    { id: 'my', name: 'My', icon: Lock },
];



export default function Templates({ user, onClose, onApply, templates = [], onTemplatesChange }) {
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showBuilder, setShowBuilder] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [loading, setLoading] = useState(false);

    // Builder State
    const [builderData, setBuilderData] = useState({
        name: '',
        description: '',
        type: 'prompt',
        content: '',
        tags: '',
    });

    const filteredTemplates = templates.filter(t => {
        // Fix category mismatch: prompts -> prompt, workflows -> workflow, agents -> agent
        const categoryMap = {
            'prompts': 'prompt',
            'workflows': 'workflow',
            'agents': 'agent'
        };
        const targetType = categoryMap[activeCategory] || activeCategory;

        const matchesCategory = activeCategory === 'all' ||
            t.type === targetType ||
            (activeCategory === 'my' && t.author === 'Me');

        const lowSearch = searchQuery.toLowerCase();
        const matchesSearch = t.name.toLowerCase().includes(lowSearch) ||
            t.description.toLowerCase().includes(lowSearch) ||
            t.tags.some(tag => tag.toLowerCase().includes(lowSearch));

        return matchesCategory && matchesSearch;
    });

    const handleCreate = () => {
        setEditingTemplate(null);
        setBuilderData({ name: '', description: '', type: 'prompt', content: '', tags: '' });
        setShowBuilder(true);
    };

    const handleEdit = (template) => {
        setEditingTemplate(template);
        setBuilderData({ ...template, tags: template.tags.join(', ') });
        setShowBuilder(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this template?")) return;
        try {
            await deleteDoc(doc(db, 'templates', id));
            if (onTemplatesChange) onTemplatesChange();
        } catch (error) {
            console.error("Error deleting template:", error);
        }
    };

    const handleSave = async () => {
        if (!builderData.name || !builderData.content) return;
        setLoading(true);

        const templatePayload = {
            name: builderData.name,
            description: builderData.description,
            type: builderData.type,
            content: builderData.content,
            tags: builderData.tags.split(',').map(t => t.trim()).filter(Boolean),
            userId: user.uid,
            updatedAt: new Date().toISOString()
        };

        try {
            if (editingTemplate && editingTemplate.author === 'Me') {
                await updateDoc(doc(db, 'templates', editingTemplate.id), templatePayload);
            } else {
                await addDoc(collection(db, 'templates'), templatePayload);
            }
            if (onTemplatesChange) onTemplatesChange();
            setShowBuilder(false);
        } catch (error) {
            console.error("Error saving template:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#0a0c10', overflowY: 'auto', display: 'flex', flexDirection: 'column', fontFamily: "'Outfit', sans-serif" }}>

            {/* Header */}
            <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(10,12,16,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Logo size="sm" />
                    <span style={{ fontWeight: 800, fontSize: 13, color: '#06b6d4', letterSpacing: '0.1em', textTransform: 'uppercase', marginLeft: -5, opacity: 0.8 }}>| Template Hub</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={handleCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                        <Plus style={{ width: 14, height: 14 }} /> Create Template
                    </button>
                    <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#9ca3af', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
                        Close
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Sidebar Navigation */}
                <div style={{ width: 260, borderRight: '1px solid rgba(255,255,255,0.06)', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ position: 'relative', marginBottom: 20 }}>
                        <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#4b5563' }} />
                        <input
                            type="text"
                            placeholder="Search library..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px 10px 34px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}
                        />
                    </div>
                    {CATEGORIES.map(cat => {
                        const CIcon = cat.icon;
                        const isSelected = activeCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left',
                                    background: isSelected ? 'rgba(6,182,212,0.1)' : 'transparent',
                                    color: isSelected ? '#06b6d4' : '#6b7280',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <CIcon style={{ width: 16, height: 16 }} />
                                <span style={{ fontSize: 13, fontWeight: 600 }}>{cat.name}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Main Content Area */}
                <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
                    <div style={{ marginBottom: 32 }}>
                        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>Template Gallery</h1>
                        <p style={{ fontSize: 14, color: '#6b7280' }}>Deploy production-ready AI blueprints for startups, engineering, and research.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                        {filteredTemplates.map(template => (
                            <motion.div
                                key={template.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        {template.type === 'workflow' ? <Zap size={10} /> : template.type === 'agent' ? <Bot size={10} /> : <Code size={10} />}
                                        {template.type}
                                    </div>
                                    <span style={{ fontSize: 10, color: '#4b5563', fontWeight: 600 }}>{template.uses.toLocaleString()} uses</span>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>{template.name}</h3>
                                    <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5, height: 36, overflow: 'hidden' }}>{template.description}</p>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {template.tags.map(tag => (
                                        <span key={tag} style={{ fontSize: 9, fontWeight: 700, color: '#06b6d4', padding: '2px 8px', borderRadius: 4, background: 'rgba(6,182,212,0.08)' }}>#{tag}</span>
                                    ))}
                                </div>
                                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <button
                                        onClick={() => onApply(template)}
                                        style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'rgba(6,182,212,0.1)', color: '#06b6d4', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                    >
                                        Use Template <Play size={12} fill="currentColor" />
                                    </button>
                                    {template.author === 'Me' && (
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button
                                                onClick={() => handleEdit(template)}
                                                style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(template.id)}
                                                style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid rgba(239,68,68,0.1)', background: 'rgba(239,68,68,0.05)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Template Builder Modal */}
            <AnimatePresence>
                {showBuilder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(10,12,16,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            style={{ width: '100%', maxWidth: 840, height: '90vh', background: '#111318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}
                        >
                            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Box style={{ width: 18, height: 18, color: '#8b5cf6' }} />
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{editingTemplate ? 'Edit Template' : 'Template Builder'}</h2>
                                        <p style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>Design reusable AI logic</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowBuilder(false)} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.05)', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <X size={16} />
                                </button>
                            </div>

                            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                                {/* Editor Form */}
                                <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: 8 }}>Template Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Code Auditor"
                                                    value={builderData.name}
                                                    onChange={e => setBuilderData({ ...builderData, name: e.target.value })}
                                                    style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: 8 }}>Type</label>
                                                <select
                                                    value={builderData.type}
                                                    onChange={e => setBuilderData({ ...builderData, type: e.target.value })}
                                                    style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none' }}
                                                >
                                                    <option value="prompt">Simple Prompt</option>
                                                    <option value="workflow">Multi-step Workflow</option>
                                                    <option value="agent">Autonomous Agent</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: 8 }}>Short Description</label>
                                            <input
                                                type="text"
                                                placeholder="Explain what this template accomplishes..."
                                                value={builderData.description}
                                                onChange={e => setBuilderData({ ...builderData, description: e.target.value })}
                                                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none' }}
                                            />
                                        </div>

                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                                <label style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase' }}>Instruction Set (System/Base Prompt)</label>
                                                <span style={{ fontSize: 10, color: '#06b6d4', fontWeight: 600 }}>Use {"{{"}VariableName{"}}"} for dynamic inputs</span>
                                            </div>
                                            <textarea
                                                rows={10}
                                                placeholder="Enter system instructions. e.g. You are a senior engineer. Help me code {{Language}} application..."
                                                value={builderData.content}
                                                onChange={e => setBuilderData({ ...builderData, content: e.target.value })}
                                                style={{ width: '100%', padding: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'monospace', resize: 'vertical' }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: 8 }}>Tags (comma separated)</label>
                                            <input
                                                type="text"
                                                placeholder="React, Architecture, Startup..."
                                                value={builderData.tags}
                                                onChange={e => setBuilderData({ ...builderData, tags: e.target.value })}
                                                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Preview / Variables Panel */}
                                <div style={{ width: 280, borderLeft: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.1)', padding: 24, display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ fontSize: 11, fontWeight: 800, color: '#fff', textTransform: 'uppercase', marginBottom: 16 }}>Live Variable Check</h3>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {/* Simple regex to detect {{var}} */}
                                        {[...new Set(builderData.content.match(/\{\{(.*?)\}\}/g) || [])].map(match => {
                                            const varName = match.replace('{{', '').replace('}}', '');
                                            return (
                                                <div key={match} style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#06b6d4' }} />
                                                    <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{varName}</span>
                                                </div>
                                            );
                                        })}
                                        {[...new Set(builderData.content.match(/\{\{(.*?)\}\}/g) || [])].length === 0 && (
                                            <p style={{ fontSize: 11, color: '#4b5563', fontStyle: 'italic' }}>No dynamic variables detected.</p>
                                        )}
                                    </div>
                                    <div style={{ marginTop: 'auto', paddingTop: 20 }}>
                                        <button
                                            onClick={handleSave}
                                            disabled={loading}
                                            style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: loading ? '#1f2937' : '#fff', color: loading ? '#6b7280' : '#0a0c10', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                        >
                                            <Save size={16} /> {loading ? 'Saving...' : (editingTemplate ? 'Update Changes' : 'Publish Template')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
