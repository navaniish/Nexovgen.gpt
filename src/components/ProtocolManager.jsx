import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Plus, Trash2, CheckCircle2 } from 'lucide-react';

const ProtocolManager = ({ goals, setGoals, onClose }) => {
    const [newGoalLabel, setNewGoalLabel] = useState('');
    const [newGoalProgress, setNewGoalProgress] = useState(0);

    const handleAddGoal = (e) => {
        e.preventDefault();
        if (!newGoalLabel.trim()) return;

        const colors = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];
        const newGoal = {
            id: Date.now(),
            label: newGoalLabel,
            progress: Math.min(100, Math.max(0, newGoalProgress)),
            color: colors[goals.length % colors.length]
        };

        setGoals([...goals, newGoal]);
        setNewGoalLabel('');
        setNewGoalProgress(0);
    };

    const handleDeleteGoal = (id) => {
        setGoals(goals.filter(goal => goal.id !== id));
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
            <div className="circuit-bg opacity-10 pointer-events-none" />

            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-lg glass border border-white/10 rounded-[2.5rem] p-8 lg:p-10 relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold tracking-widest uppercase mb-1">Milestone Tracker</h2>
                        <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-[0.3em]">Startup Build Progress</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Add New Protocol Form */}
                <form onSubmit={handleAddGoal} className="mb-10 space-y-4">
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest ml-1">New Objective Name</label>
                        <div className="relative group">
                            <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                            <input
                                type="text"
                                value={newGoalLabel}
                                onChange={(e) => setNewGoalLabel(e.target.value)}
                                placeholder="E.g., Master Quantum Mechanics"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest ml-1">Initial Progress %</label>
                            <input
                                type="number"
                                value={newGoalProgress}
                                onChange={(e) => setNewGoalProgress(parseInt(e.target.value) || 0)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-3.5 bg-cyan-600/20 border border-cyan-500/30 rounded-xl text-cyan-400 font-bold uppercase tracking-widest text-xs hover:bg-cyan-600/30 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Initialize
                        </button>
                    </div>
                </form>

                {/* Active Protocols List */}
                <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Active Neural Threads</p>
                    {goals.map(goal => (
                        <div key={goal.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                                    <Target className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white uppercase tracking-wider">{goal.label}</p>
                                    <p className="text-[10px] text-gray-500 font-mono">{goal.progress}% Optimized</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteGoal(goal.id)}
                                className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {goals.length === 0 && (
                        <div className="text-center py-8 border-2 border-dashed border-white/5 rounded-3xl">
                            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold font-mono">No Active Protocols Detected</p>
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex justify-center">
                    <p className="text-[8px] text-gray-700 font-bold uppercase tracking-[0.5em]">System Integrity Secured • NEXOVGEN CORE</p>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ProtocolManager;
