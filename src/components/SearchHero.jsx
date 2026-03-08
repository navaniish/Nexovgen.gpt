import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─────────────────────────────────────────────────────────────────
   NEURAL TUNNEL CANVAS
   - Perspective convergence lines
   - Electric blue + neon purple data streams
   - Floating particle field
   - Cinematic depth-of-field bloom
───────────────────────────────────────────────────────────────── */
function TunnelCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let raf, t = 0;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // ── Perspective grid lines ──
        const H_LINES = 14, V_LINES = 14;

        // ── Data stream particles ──
        const STREAMS = Array.from({ length: 60 }, () => ({
            angle: Math.random() * Math.PI * 2,
            dist: Math.random(),          // 0=center, 1=edge
            speed: 0.0008 + Math.random() * 0.0016,
            hue: Math.random() < 0.6 ? 217 : 275,
            alpha: 0.4 + Math.random() * 0.5,
            len: 0.06 + Math.random() * 0.12,
            width: 0.6 + Math.random() * 1.4,
        }));

        // ── Ambient particles ──
        const DOTS = Array.from({ length: 180 }, () => ({
            x: Math.random(),
            y: Math.random(),
            r: 0.3 + Math.random() * 1.2,
            vx: (Math.random() - 0.5) * 0.0002,
            vy: (Math.random() - 0.5) * 0.0002,
            alpha: 0.2 + Math.random() * 0.6,
            hue: Math.random() < 0.65 ? 214 : 272,
        }));

        const draw = () => {
            const W = canvas.width, H = canvas.height;
            const cx = W / 2, cy = H / 2;
            t += 1 / 60;

            ctx.clearRect(0, 0, W, H);

            // ── Background ──
            const bg = ctx.createRadialGradient(cx, cy * 0.85, 0, cx, cy, Math.max(W, H) * 0.9);
            bg.addColorStop(0, 'rgba(6,10,28,1)');
            bg.addColorStop(0.45, 'rgba(4,7,20,1)');
            bg.addColorStop(1, 'rgba(1,2,8,1)');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, W, H);

            // ── Perspective tunnel grid ──
            const VANISH_X = cx, VANISH_Y = cy * 0.88;
            const SPREAD = Math.max(W, H) * 1.5;
            const ANIM_SHIFT = (t * 0.04) % 1;

            // Horizontal rails (top half)
            for (let i = 0; i <= H_LINES; i++) {
                const frac = (i / H_LINES + ANIM_SHIFT) % 1;
                // perspective maps frac → y position (non-linear)
                const depth = Math.pow(frac, 2.2);
                const alpha = frac * 0.18;
                const yTop = VANISH_Y + (0 - VANISH_Y) * (1 - depth) + depth * (H * 0.05);
                const yBot = VANISH_Y + (H - VANISH_Y) * (1 - depth) + depth * H;

                ctx.beginPath();
                ctx.moveTo(cx - SPREAD * depth, yTop);
                ctx.lineTo(cx + SPREAD * depth, yBot);
                const lg = ctx.createLinearGradient(cx - SPREAD * depth, 0, cx + SPREAD * depth, 0);
                lg.addColorStop(0, `rgba(30,80,220,0)`);
                lg.addColorStop(0.3, `rgba(40,100,255,${alpha})`);
                lg.addColorStop(0.5, `rgba(80,140,255,${alpha * 1.4})`);
                lg.addColorStop(0.7, `rgba(40,100,255,${alpha})`);
                lg.addColorStop(1, `rgba(30,80,220,0)`);
                ctx.strokeStyle = lg;
                ctx.lineWidth = 0.5 + depth * 0.8;
                ctx.stroke();
            }

            // Vertical rails (converging)
            const V_SPREAD_W = W * 1.2;
            const V_SPREAD_H = H * 1.1;
            for (let i = 0; i <= V_LINES; i++) {
                const frac = i / V_LINES;
                const offset = (frac - 0.5) * V_SPREAD_W;
                const alpha = 0.06 + Math.abs(frac - 0.5) * 0.05;
                ctx.beginPath();
                ctx.moveTo(VANISH_X, VANISH_Y);
                ctx.lineTo(VANISH_X + offset, V_SPREAD_H);
                const lg2 = ctx.createLinearGradient(VANISH_X, VANISH_Y, VANISH_X + offset, V_SPREAD_H);
                lg2.addColorStop(0, `rgba(100,140,255,0)`);
                lg2.addColorStop(0.4, `rgba(60,120,255,${alpha})`);
                lg2.addColorStop(1, `rgba(30,60,180,${alpha * 0.5})`);
                ctx.strokeStyle = lg2;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }

            // ── Center bloom glow ──
            const bloom = ctx.createRadialGradient(cx, VANISH_Y, 0, cx, VANISH_Y, Math.min(W, H) * 0.45);
            bloom.addColorStop(0, 'rgba(60,120,255,0.18)');
            bloom.addColorStop(0.35, 'rgba(100,60,220,0.08)');
            bloom.addColorStop(0.7, 'rgba(80,30,180,0.03)');
            bloom.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = bloom;
            ctx.beginPath();
            ctx.arc(cx, VANISH_Y, Math.min(W, H) * 0.45, 0, Math.PI * 2);
            ctx.fill();

            // ── Data stream streaks (flying toward viewer) ──
            STREAMS.forEach(s => {
                s.dist = (s.dist + s.speed) % 1;
                const depth = Math.pow(s.dist, 1.8);
                const maxR = Math.min(W, H) * 0.85 * depth;
                const hx = VANISH_X + Math.cos(s.angle) * maxR;
                const hy = VANISH_Y + Math.sin(s.angle) * maxR;
                const tailR = Math.max(0, maxR - Math.min(W, H) * s.len * depth);
                const tx = VANISH_X + Math.cos(s.angle) * tailR;
                const ty = VANISH_Y + Math.sin(s.angle) * tailR;
                const lg = ctx.createLinearGradient(tx, ty, hx, hy);
                const a = s.alpha * depth;
                lg.addColorStop(0, `hsla(${s.hue},90%,65%,0)`);
                lg.addColorStop(1, `hsla(${s.hue},90%,72%,${a})`);
                ctx.strokeStyle = lg;
                ctx.lineWidth = s.width * (0.3 + depth * 0.7);
                ctx.beginPath();
                ctx.moveTo(tx, ty);
                ctx.lineTo(hx, hy);
                ctx.stroke();
            });

            // ── Ambient dots ──
            DOTS.forEach(d => {
                d.x = (d.x + d.vx + 1) % 1;
                d.y = (d.y + d.vy + 1) % 1;
                ctx.beginPath();
                ctx.arc(d.x * W, d.y * H, d.r, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${d.hue},80%,72%,${d.alpha})`;
                ctx.fill();
            });

            // ── Bottom floor reflection ──
            const floor = ctx.createLinearGradient(0, H * 0.7, 0, H);
            floor.addColorStop(0, 'rgba(30,80,200,0)');
            floor.addColorStop(0.6, 'rgba(30,80,200,0.06)');
            floor.addColorStop(1, 'rgba(10,30,100,0.14)');
            ctx.fillStyle = floor;
            ctx.fillRect(0, H * 0.7, W, H * 0.3);

            // ── Vignette ──
            const vig = ctx.createRadialGradient(cx, cy, H * 0.22, cx, cy, H * 0.95);
            vig.addColorStop(0, 'rgba(0,0,0,0)');
            vig.addColorStop(1, 'rgba(0,0,0,0.72)');
            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, W, H);

            raf = requestAnimationFrame(draw);
        };

        draw();
        return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
    }, []);

    return (
        <canvas ref={canvasRef} style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            display: 'block', pointerEvents: 'none',
        }} />
    );
}

/* ─────────────────────────────────────────────────────────────────
   TYPING PLACEHOLDER
───────────────────────────────────────────────────────────────── */
const PLACEHOLDERS = [
    'Ask Gen-AI anything…',
    'Explain quantum computing simply…',
    'Write a startup pitch for my idea…',
    'Analyze this market trend…',
    'Design a growth hacking strategy…',
    'Summarise this research paper…',
];

function useTyping() {
    const [text, setText] = useState('');
    const [pIdx, setPIdx] = useState(0);
    const [charIdx, setCharIdx] = useState(0);
    const [del, setDel] = useState(false);

    useEffect(() => {
        const cur = PLACEHOLDERS[pIdx];
        const ms = del ? 30 : 55;
        const tid = setTimeout(() => {
            if (!del) {
                if (charIdx < cur.length) { setText(cur.slice(0, charIdx + 1)); setCharIdx(c => c + 1); }
                else setTimeout(() => setDel(true), 1800);
            } else {
                if (charIdx > 0) { setText(cur.slice(0, charIdx - 1)); setCharIdx(c => c - 1); }
                else { setDel(false); setPIdx(i => (i + 1) % PLACEHOLDERS.length); }
            }
        }, ms);
        return () => clearTimeout(tid);
    }, [charIdx, del, pIdx]);

    return text;
}

/* ─────────────────────────────────────────────────────────────────
   EMBLEM SVG LOGO
───────────────────────────────────────────────────────────────── */
function Emblem({ size = 82 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <defs>
                <radialGradient id="eG" cx="50%" cy="40%" r="60%">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="55%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#a78bfa" />
                </radialGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>
            {/* Shield */}
            <path d="M50 8 L88 24 L88 54 Q88 78 50 92 Q12 78 12 54 L12 24 Z"
                fill="url(#eG)" opacity="0.15" />
            <path d="M50 8 L88 24 L88 54 Q88 78 50 92 Q12 78 12 54 L12 24 Z"
                stroke="url(#eG)" strokeWidth="2" fill="none" filter="url(#glow)" />
            {/* Wings */}
            <path d="M12 38 Q0 32 2 22 Q10 28 12 38Z" fill="url(#eG)" opacity="0.7" />
            <path d="M88 38 Q100 32 98 22 Q90 28 88 38Z" fill="url(#eG)" opacity="0.7" />
            {/* Book lines */}
            <rect x="34" y="38" width="32" height="22" rx="2" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" filter="url(#glow)" />
            <line x1="50" y1="38" x2="50" y2="60" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" />
            <line x1="38" y1="44" x2="47" y2="44" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
            <line x1="38" y1="48" x2="47" y2="48" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
            <line x1="38" y1="52" x2="47" y2="52" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
            <line x1="53" y1="44" x2="62" y2="44" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
            <line x1="53" y1="48" x2="62" y2="48" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
            <line x1="53" y1="52" x2="62" y2="52" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
            {/* AI spark */}
            <circle cx="50" cy="28" r="4" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" filter="url(#glow)" />
            <line x1="50" y1="22" x2="50" y2="18" stroke="rgba(160,180,255,0.8)" strokeWidth="1.2" />
            <line x1="56" y1="24" x2="59" y2="21" stroke="rgba(160,180,255,0.8)" strokeWidth="1.2" />
            <line x1="44" y1="24" x2="41" y2="21" stroke="rgba(160,180,255,0.8)" strokeWidth="1.2" />
        </svg>
    );
}

/* ─────────────────────────────────────────────────────────────────
   FEATURE ICON CARD — hover via direct DOM mutation, no React re-render
───────────────────────────────────────────────────────────────── */
function FeatureCard({ icon: Icon, label, color, delay }) {
    const cardRef = useRef(null);
    const iconBoxRef = useRef(null);

    const onEnter = useCallback(() => {
        if (!cardRef.current) return;
        const s = cardRef.current.style;
        s.background = 'rgba(255,255,255,0.07)';
        s.border = `1px solid ${color}50`;
        s.boxShadow = `0 8px 40px ${color}22`;
        s.transform = 'translateY(-6px) scale(1.04)';
        if (iconBoxRef.current) iconBoxRef.current.style.boxShadow = `0 0 24px ${color}40`;
    }, [color]);

    const onLeave = useCallback(() => {
        if (!cardRef.current) return;
        const s = cardRef.current.style;
        s.background = 'rgba(255,255,255,0.03)';
        s.border = '1px solid rgba(255,255,255,0.07)';
        s.boxShadow = 'none';
        s.transform = 'translateY(0) scale(1)';
        if (iconBoxRef.current) iconBoxRef.current.style.boxShadow = `0 0 12px ${color}18`;
    }, [color]);

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 24, scale: 0.86 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                padding: '22px 16px', borderRadius: 20, cursor: 'default',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
                boxShadow: 'none',
                transform: 'translateY(0) scale(1)',
                transition: 'all 0.22s cubic-bezier(0.22,1,0.36,1)',
                minWidth: 120,
            }}
        >
            {/* Rotating ring + icon */}
            <div style={{ position: 'relative', width: 58, height: 58 }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
                    style={{
                        position: 'absolute', inset: -5, borderRadius: '50%',
                        border: `1.5px dashed ${color}55`,
                    }}
                />
                <div ref={iconBoxRef} style={{
                    width: 58, height: 58, borderRadius: '50%',
                    background: `${color}18`, border: `1px solid ${color}38`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 12px ${color}18`,
                    transition: 'box-shadow 0.22s',
                }}>
                    <Icon size={24} color={color} strokeWidth={1.6} />
                </div>
            </div>
            <span style={{
                fontSize: 12, fontWeight: 700, color: '#CBD5E1',
                letterSpacing: '0.04em', textAlign: 'center',
            }}>{label}</span>
        </motion.div>
    );
}

/* ─────────────────────────────────────────────────────────────────
   ICON SVGS (inline, no external lib needed for the specific look)
───────────────────────────────────────────────────────────────── */
const BrainIcon = ({ size, color, strokeWidth }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
        <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
        <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" /><path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
        <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" /><path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
        <path d="M19.938 10.5a4 4 0 0 1 .585.396" /><path d="M6 18a4 4 0 0 1-1.967-.516" />
        <path d="M19.967 17.484A4 4 0 0 1 18 18" />
    </svg>
);
const RobotIcon = ({ size, color, strokeWidth }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="12" cy="5" r="2" /><path d="M12 7v4" />
        <line x1="8" y1="16" x2="8" y2="16" strokeWidth="3" /><line x1="16" y1="16" x2="16" y2="16" strokeWidth="3" />
        <path d="M6 11V9a6 6 0 0 1 12 0v2" />
    </svg>
);
const CloudIcon = ({ size, color, strokeWidth }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
);
const ScanIcon = ({ size, color, strokeWidth }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" />
        <path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
        <circle cx="12" cy="12" r="3" /><path d="M12 9v-2" /><path d="M12 17v-2" />
        <path d="M9 12H7" /><path d="M17 12h-2" />
    </svg>
);
const MicIcon = ({ size = 20, color = '#6b7280' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" />
    </svg>
);

/* ─────────────────────────────────────────────────────────────────
   HOLOGRAPHIC PANEL
───────────────────────────────────────────────────────────────── */
function HoloPanelLeft() {
    return (
        <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0, y: [0, -14, 0] }}
            transition={{ opacity: { delay: 1.4, duration: 0.7 }, y: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
            style={{
                position: 'absolute', left: '3%', top: '18%',
                width: 148, display: window.innerWidth < 1024 ? 'none' : 'flex', flexDirection: 'column', gap: 8,
                pointerEvents: 'none',
            }}
        >
            {/* Mini stat card */}
            {[{ label: 'Models Active', val: '12', color: '#4F8EF7' },
            { label: 'Queries / sec', val: '3.8K', color: '#a78bfa' },
            { label: 'Accuracy', val: '99.2%', color: '#34d399' }].map((s, i) => (
                <motion.div key={s.label}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.6 + i * 0.15 }}
                    style={{
                        background: 'rgba(10,20,50,0.55)', border: `1px solid ${s.color}28`,
                        borderRadius: 12, padding: '10px 14px', backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                    }}>
                    <div style={{ fontSize: 9, color: s.color, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#E2E8F0', lineHeight: 1 }}>{s.val}</div>
                    {/* Mini bar */}
                    <div style={{ marginTop: 7, height: 2, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                        <motion.div
                            animate={{ width: ['30%', '100%', '60%', '85%', '30%'] }}
                            transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${s.color}, ${s.color}88)` }}
                        />
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}

function HoloPanelRight() {
    return (
        <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
            transition={{ opacity: { delay: 1.5, duration: 0.7 }, y: { duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 } }}
            style={{
                position: 'absolute', right: '3%', top: '22%',
                width: 148, display: window.innerWidth < 1024 ? 'none' : 'flex', flexDirection: 'column', gap: 8,
                pointerEvents: 'none',
            }}
        >
            {[{ label: 'Knowledge Base', val: '4.2B', color: '#f472b6' },
            { label: 'Context Window', val: '128K', color: '#fbbf24' },
            { label: 'Uptime', val: '99.9%', color: '#34d399' }].map((s, i) => (
                <motion.div key={s.label}
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.7 + i * 0.15 }}
                    style={{
                        background: 'rgba(10,20,50,0.55)', border: `1px solid ${s.color}28`,
                        borderRadius: 12, padding: '10px 14px', backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                    }}>
                    <div style={{ fontSize: 9, color: s.color, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#E2E8F0', lineHeight: 1 }}>{s.val}</div>
                    <div style={{ marginTop: 7, height: 2, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                        <motion.div
                            animate={{ width: ['80%', '45%', '90%', '60%', '80%'] }}
                            transition={{ duration: 3.5 + i * 0.8, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${s.color}, ${s.color}88)` }}
                        />
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}

/* ─────────────────────────────────────────────────────────────────
   MAIN HERO COMPONENT
───────────────────────────────────────────────────────────────── */
const FEATURES = [
    { icon: BrainIcon, label: 'AI Intelligence', color: '#4F8EF7' },
    { icon: RobotIcon, label: 'Automation', color: '#a78bfa' },
    { icon: CloudIcon, label: 'Data Processing', color: '#34d399' },
    { icon: ScanIcon, label: 'Deep Scan', color: '#f472b6' },
];

export default function SearchHero({ onSearch, lang, setIsListening }) {
    const [query, setQuery] = useState('');
    const [micActive, setMicActive] = useState(false);
    const [ripple, setRipple] = useState(false);
    const [mouse, setMouse] = useState({ x: 0, y: 0 });
    const [searchFocus, setSearchFocus] = useState(false);
    const placeholder = useTyping();
    const inputRef = useRef(null);

    const handleMouseMove = useCallback(e => {
        setMouse({
            x: (e.clientX / window.innerWidth - 0.5) * 2,
            y: (e.clientY / window.innerHeight - 0.5) * 2,
        });
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [handleMouseMove]);

    const handleSearch = () => {
        if (!query.trim()) return;
        setRipple(true);
        setTimeout(() => setRipple(false), 600);
        onSearch?.(query);
    };

    const recognitionRef = useRef(null);
    const isRecognitionActive = useRef(false);

    const toggleMic = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }

        if (micActive) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                isRecognitionActive.current = false;
            }
            setMicActive(false);
            setIsListening?.(false);
            return;
        }

        try {
            const r = new SR();
            r.continuous = false;
            // Use the BCP-47 lang code from props, fallback to en-US
            r.lang = lang?.code || 'en-US';
            r.interimResults = false;

            r.onstart = () => {
                setMicActive(true);
                setIsListening?.(true);
                isRecognitionActive.current = true;
            };

            r.onresult = ev => {
                const transcript = ev.results[0][0].transcript;
                if (transcript) {
                    setQuery(transcript);
                    // Proactively trigger search
                    setTimeout(() => {
                        onSearch?.(transcript);
                    }, 500);
                }
            };

            r.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                setMicActive(false);
                setIsListening?.(false);
                isRecognitionActive.current = false;
            };

            r.onend = () => {
                setMicActive(false);
                setIsListening?.(false);
                isRecognitionActive.current = false;
            };

            recognitionRef.current = r;
            // Delay start to allow background wake word listener to release mic
            setTimeout(() => {
                try { r.start(); } catch (err) { console.error("Mic start failed:", err); }
            }, 150);
        } catch (err) {
            console.error("Failed to start speech recognition:", err);
            setMicActive(false);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current && isRecognitionActive.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    return (
        <div
            onMouseMove={handleMouseMove}
            style={{
                position: 'relative', width: '100%', height: '100%', minHeight: '100vh',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', overflow: 'hidden',
                fontFamily: "'Inter', 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
                background: 'transparent',
            }}
        >
            {/* ── CANVAS ── */}
            <TunnelCanvas />

            {/* ── HOLOGRAPHIC SIDE PANELS ── */}
            <HoloPanelLeft />
            <HoloPanelRight />

            {/* ── PARALLAX CONTENT WRAPPER ── */}
            <div style={{
                position: 'relative', zIndex: 10,
                width: '100%', maxWidth: 720,
                padding: '0 28px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                transform: `translate(${mouse.x * -5}px, ${mouse.y * -3.5}px)`,
                transition: 'transform 0.14s cubic-bezier(0.22,1,0.36,1)',
            }}>


                {/* ── HEADLINE ── */}
                <motion.h1
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        fontSize: 'clamp(38px, 7.5vw, 76px)', fontWeight: 900,
                        textAlign: 'center', lineHeight: 1.04,
                        margin: '0 0 14px', letterSpacing: '-0.035em',
                        color: '#F8FAFC',
                        textShadow: '0 0 60px rgba(99,150,255,0.25)',
                    }}
                >
                    NexoVGen{' '}
                    <span style={{
                        background: 'linear-gradient(135deg, #60a5fa 0%, #818cf8 45%, #c084fc 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        filter: 'drop-shadow(0 0 28px rgba(96,165,250,0.55))',
                    }}>
                        GPT
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: 0.68, duration: 0.6 }}
                    style={{
                        fontSize: 'clamp(14px, 2.2vw, 17px)', color: '#64748B',
                        textAlign: 'center', margin: '0 0 46px', lineHeight: 1.65, maxWidth: 500,
                    }}
                >
                    Nex AGen GPT Search — the future of intelligence-driven discovery.
                    <br />Ask anything. Know everything.
                </motion.p>

                {/* ── SEARCH BAR ── */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.93, y: 18 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
                    style={{ width: '100%', marginBottom: 44, position: 'relative' }}
                >
                    {/* Glow halo behind bar */}
                    <motion.div
                        animate={{ opacity: searchFocus ? 1 : 0.55 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            position: 'absolute', inset: -3, borderRadius: 26,
                            background: 'linear-gradient(135deg, rgba(59,130,246,0.32), rgba(139,92,246,0.22))',
                            filter: 'blur(18px)', zIndex: 0,
                        }}
                    />

                    {/* Bar */}
                    <div style={{
                        position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center',
                        background: 'rgba(8,14,32,0.75)', backdropFilter: 'blur(44px)',
                        WebkitBackdropFilter: 'blur(44px)',
                        border: searchFocus
                            ? '1px solid rgba(99,150,255,0.5)'
                            : '1px solid rgba(99,150,255,0.18)',
                        borderRadius: 22, overflow: 'hidden',
                        boxShadow: searchFocus
                            ? '0 8px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,150,255,0.12)'
                            : '0 8px 40px rgba(0,0,0,0.4)',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}>
                        {/* Mic button */}
                        <button
                            onClick={toggleMic}
                            style={{
                                padding: '0 18px 0 22px', background: 'none', border: 'none',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0,
                            }}
                        >
                            <motion.div
                                animate={micActive ? { scale: [1, 1.25, 1], opacity: [1, 0.65, 1] } : {}}
                                transition={{ duration: 0.7, repeat: Infinity }}
                            >
                                <MicIcon size={21} color={micActive ? '#f472b6' : '#4B5A72'} />
                            </motion.div>
                        </button>

                        {/* Input + placeholder */}
                        <div style={{ flex: 1, position: 'relative', height: 68 }}>
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                onFocus={() => setSearchFocus(true)}
                                onBlur={() => setSearchFocus(false)}
                                style={{
                                    width: '100%', height: '100%', background: 'none',
                                    border: 'none', outline: 'none', color: '#F1F5F9',
                                    fontSize: 17, fontWeight: 400, fontFamily: 'inherit', padding: 0,
                                }}
                            />
                            {!query && (
                                <div style={{
                                    position: 'absolute', top: '50%', left: 0,
                                    transform: 'translateY(-50%)',
                                    fontSize: 17, color: '#2D3D55',
                                    pointerEvents: 'none', whiteSpace: 'nowrap',
                                }}>
                                    {placeholder}
                                    <motion.span
                                        animate={{ opacity: [1, 0] }}
                                        transition={{ duration: 0.75, repeat: Infinity }}
                                        style={{
                                            display: 'inline-block', width: 2, height: 19,
                                            background: '#4F8EF7', marginLeft: 2,
                                            verticalAlign: 'middle',
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* G (search) button */}
                        <div style={{ padding: '10px 12px 10px 6px', flexShrink: 0 }}>
                            <motion.button
                                onClick={handleSearch}
                                whileHover={{ scale: 1.06 }}
                                whileTap={{ scale: 0.94 }}
                                style={{
                                    position: 'relative', width: 50, height: 50, borderRadius: '50%',
                                    border: 'none', cursor: 'pointer',
                                    background: 'linear-gradient(135deg, #2563EB 0%, #7c3aed 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 24px rgba(59,130,246,0.45)',
                                    overflow: 'hidden',
                                    fontSize: 20, fontWeight: 900, color: '#fff',
                                    fontFamily: "'Georgia', serif",
                                    letterSpacing: '0',
                                }}
                            >
                                {ripple && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0.7 }} animate={{ scale: 4, opacity: 0 }}
                                        transition={{ duration: 0.5 }}
                                        style={{
                                            position: 'absolute', top: '50%', left: '50%',
                                            transform: 'translate(-50%,-50%)',
                                            width: 50, height: 50, borderRadius: '50%',
                                            background: 'rgba(255,255,255,0.4)', pointerEvents: 'none',
                                        }}
                                    />
                                )}
                                G
                            </motion.button>
                        </div>
                    </div>

                    {/* Voice wave */}
                    <AnimatePresence>
                        {micActive && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                                style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 4, marginTop: 14, height: 32 }}
                            >
                                {Array.from({ length: 14 }).map((_, i) => (
                                    <motion.div key={i}
                                        animate={{ height: [6, Math.random() * 28 + 6, 6] }}
                                        transition={{ duration: 0.35 + Math.random() * 0.35, repeat: Infinity, delay: i * 0.05, ease: 'easeInOut' }}
                                        style={{ width: 3, borderRadius: 4, background: '#f472b6', minHeight: 4 }}
                                    />
                                ))}
                                <span style={{ marginLeft: 12, fontSize: 11, color: '#f472b6', alignSelf: 'center', fontWeight: 600 }}>
                                    Listening…
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* ── FEATURE ICONS ── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: window.innerWidth < 640 ? 'repeat(2,1fr)' : 'repeat(4,1fr)',
                    gap: window.innerWidth < 640 ? 10 : 14, width: '100%',
                }}>
                    {FEATURES.map((f, i) => (
                        <FeatureCard key={f.label} {...f} delay={1.05 + i * 0.1} />
                    ))}
                </div>

                {/* Bottom caption */}
                <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: 1.6 }}
                    style={{
                        marginTop: 34, fontSize: 10, color: '#1E293B',
                        letterSpacing: '0.08em', textAlign: 'center', fontWeight: 700,
                        textTransform: 'uppercase',
                    }}
                >
                    Powered by GPT-4o · Claude · Gemini · DeepSeek · Multi-model synthesis
                </motion.p>
            </div>
        </div>
    );
}
