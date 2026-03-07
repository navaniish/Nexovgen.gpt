import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AIAvatar — A premium, high-fidelity "Cyber-Core" visualizer.
 * 
 * @param {string} mode - 'idle', 'listening', 'thinking', 'speaking'
 * @param {string} color - The accent color of the current mentor
 * @param {number} amplitude - Voice amplitude (0-1) for lip-sync style animations
 */
export default function AIAvatar({ mode = 'idle', color = '#06b6d4', amplitude = 0 }) {

    // Create variations of the color for gradients
    const glowColor = useMemo(() => `${color}88`, [color]);
    const coreColor = useMemo(() => color, [color]);

    // Ring configurations
    const rings = [
        { size: 280, duration: 15, delay: 0, opacity: 0.1 },
        { size: 220, duration: 10, delay: -2, opacity: 0.15 },
        { size: 160, duration: 8, delay: -5, opacity: 0.2 },
        { size: 100, duration: 5, delay: -1, opacity: 0.3 },
    ];

    return (
        <div className="relative flex items-center justify-center w-[400px] h-[400px]">
            {/* Background Radial Glow */}
            <motion.div
                animate={{
                    scale: mode === 'listening' ? [1, 1.1, 1] : 1,
                    opacity: mode === 'idle' ? 0.3 : 0.6,
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full blur-[100px]"
                style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` }}
            />

            {/* Rotating Neural Rings */}
            {rings.map((ring, i) => (
                <motion.div
                    key={i}
                    animate={{
                        rotate: i % 2 === 0 ? 360 : -360,
                        scale: mode === 'listening' ? [1, 1.05, 1] : mode === 'speaking' ? 1 + amplitude * 0.1 : 1,
                    }}
                    transition={{
                        rotate: { duration: ring.duration, repeat: Infinity, ease: "linear", delay: ring.delay },
                        scale: { duration: 0.1 }
                    }}
                    className="absolute rounded-full border border-dashed"
                    style={{
                        width: ring.size,
                        height: ring.size,
                        borderColor: color,
                        opacity: ring.opacity,
                        borderWidth: '1px',
                        boxShadow: mode !== 'idle' ? `0 0 20px ${glowColor}` : 'none'
                    }}
                />
            ))}

            {/* Central Core */}
            <div className="relative flex items-center justify-center">
                {/* Outer Core Glow */}
                <motion.div
                    animate={{
                        scale: mode === 'thinking' ? [1, 1.2, 1] : mode === 'speaking' ? 1 + amplitude * 0.4 : 1,
                        opacity: mode === 'idle' ? 0.4 : 0.8,
                        boxShadow: [
                            `0 0 40px ${glowColor}`,
                            `0 0 70px ${glowColor}`,
                            `0 0 40px ${glowColor}`
                        ]
                    }}
                    transition={{
                        duration: mode === 'thinking' ? 1.5 : 0.1,
                        repeat: mode === 'thinking' ? Infinity : 0
                    }}
                    className="absolute w-24 h-24 rounded-full"
                    style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }}
                />

                {/* Inner Solid Core */}
                <motion.div
                    animate={{
                        scale: mode === 'speaking' ? 1 + amplitude * 0.2 : 1,
                    }}
                    className="relative w-12 h-12 rounded-full border-2 border-white/20 backdrop-blur-md flex items-center justify-center"
                    style={{
                        background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                        boxShadow: `inset 0 0 10px rgba(255,255,255,0.5), 0 0 30px ${color}`
                    }}
                >
                    {/* Neural Activity Particles */}
                    <AnimatePresence>
                        {mode !== 'idle' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 overflow-hidden rounded-full"
                            >
                                {[...Array(6)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{
                                            x: [Math.random() * 40 - 20, Math.random() * 40 - 20],
                                            y: [Math.random() * 40 - 20, Math.random() * 40 - 20],
                                            opacity: [0, 1, 0],
                                        }}
                                        transition={{
                                            duration: 1 + Math.random(),
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                        className="absolute w-1 h-1 bg-white rounded-full"
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Mode Indicator Text (Subtle) */}
            <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute bottom-[-60px] text-[10px] font-bold uppercase tracking-[0.5em] text-white/40"
            >
                {mode === 'listening' ? 'System Listening...' : mode === 'thinking' ? 'Processing Intelligence...' : mode === 'speaking' ? 'Synthesizing Output...' : 'Core Standby'}
            </motion.div>
        </div>
    );
}
