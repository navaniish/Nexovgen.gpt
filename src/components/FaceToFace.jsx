/**
 * FaceToFace — Full-screen immersive voice assistant.
 *
 * Key Chrome fixes:
 *  1. TTS unlock: silent utterance played on user click to unlock AudioContext
 *  2. Chrome TTS pause bug: keep-alive interval calling speechSynthesis.resume()
 *  3. All callbacks stored in refs — no stale closure issues
 *  4. Recognition errors all handled with auto-restart
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Brain, Cpu, Zap, Clock, ChevronRight } from 'lucide-react';
import ParticleSphere from './ParticleSphere';

/* ── Unlock TTS (call on user gesture) ── */
function unlockTTS() {
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance('');
    u.volume = 0;
    window.speechSynthesis.speak(u);
}

/* ─── Background canvas ─────────────────────────────────────────────────────── */
function FaceBackground({ mode, amplitude, color }) {
    const canvasRef = useRef(null);
    const stRef = useRef({ mode, amplitude, color });
    useEffect(() => { stRef.current = { mode, amplitude, color }; }, [mode, amplitude, color]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let raf;
        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        resize();
        window.addEventListener('resize', resize);

        const hexRgb = (hex) => {
            const h = (hex || '#06b6d4').replace('#', '');
            return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
        };

        const COUNT = 65;
        const pts = Array.from({ length: COUNT }, () => ({
            x: Math.random(), y: Math.random(),
            vx: (Math.random() - 0.5) * 0.0003, vy: (Math.random() - 0.5) * 0.0003,
            r: 1.2 + Math.random() * 1.6, ph: Math.random() * Math.PI * 2
        }));
        let t = 0;

        const draw = () => {
            const W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2;
            const { mode: m, amplitude: amp, color: col } = stRef.current;
            const [r, g, b] = hexRgb(col);
            const sp = m === 'listening' ? 2.2 : m === 'thinking' ? 1.6 : m === 'speaking' ? 1.4 + amp * 1.8 : 0.6;
            t += 0.016;

            ctx.clearRect(0, 0, W, H);
            const bg = ctx.createRadialGradient(cx, cy * 0.9, 0, cx, cy, Math.max(W, H) * 0.85);
            const bA = m === 'idle' ? 0.04 : m === 'speaking' ? 0.06 + amp * 0.06 : 0.06;
            bg.addColorStop(0, `rgba(${r},${g},${b},${bA.toFixed(3)})`);
            bg.addColorStop(0.5, 'rgba(4,6,18,0.92)');
            bg.addColorStop(1, 'rgba(2,3,10,0.98)');
            ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

            [{ x: 0.18, y: 0.18 }, { x: 0.82, y: 0.75 }, { x: 0.08, y: 0.78 }, { x: 0.9, y: 0.2 }].forEach(({ x, y }, vi) => {
                const p = Math.sin(t * 0.5 + vi * 1.6) * 0.5 + 0.5;
                const gI = (m === 'speaking' ? 0.12 + amp * 0.15 : 0.05) * (0.6 + p * 0.4);
                const gr = ctx.createRadialGradient(x * W, y * H, 0, x * W, y * H, Math.min(W, H) * (0.22 + p * 0.06));
                gr.addColorStop(0, `rgba(${r},${g},${b},${gI.toFixed(3)})`);
                gr.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = gr;
                ctx.beginPath(); ctx.arc(x * W, y * H, Math.min(W, H) * 0.32, 0, Math.PI * 2); ctx.fill();
            });

            const cd = Math.min(W, H) * 0.17;
            pts.forEach((p, i) => {
                p.ph += 0.025 * sp; p.x = (p.x + p.vx * sp + 1) % 1; p.y = (p.y + p.vy * sp + 1) % 1;
                const px = p.x * W, py = p.y * H;
                const pf = 0.7 + Math.sin(p.ph) * 0.3;
                const bA2 = m === 'idle' ? 0.28 : m === 'speaking' ? 0.45 + amp * 0.4 : 0.45;
                ctx.beginPath(); ctx.arc(px, py, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r},${g},${b},${(bA2 * pf).toFixed(3)})`; ctx.fill();
                for (let j = i + 1; j < pts.length; j++) {
                    const o = pts[j];
                    const dist = Math.hypot((p.x - o.x) * W, (p.y - o.y) * H);
                    if (dist < cd) {
                        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(o.x * W, o.y * H);
                        ctx.strokeStyle = `rgba(${r},${g},${b},${((1 - dist / cd) * 0.15).toFixed(3)})`; ctx.lineWidth = 0.5; ctx.stroke();
                    }
                }
            });

            const vig = ctx.createRadialGradient(cx, cy, H * 0.15, cx, cy, H * 0.9);
            vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,0.72)');
            ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
            raf = requestAnimationFrame(draw);
        };
        raf = requestAnimationFrame(draw);
        return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
    }, []);

    return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

/* ─── Waveform bars ──────────────────────────────────────────────────────────── */
function Waveform({ amplitude, color, active }) {
    const N = 20;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 40, opacity: active ? 1 : 0.1, transition: 'opacity 0.4s' }}>
            {Array.from({ length: N }).map((_, i) => {
                const c = N / 2, d = Math.abs(i - c) / c;
                const h = active ? 5 + amplitude * 28 * (1 - d * 0.55) : 3;
                return (
                    <motion.div key={i}
                        animate={active ? { height: [`${h}px`, `${h + Math.random() * amplitude * 14}px`, `${h}px`] } : { height: '3px' }}
                        transition={active ? { duration: 0.28 + Math.random() * 0.14, repeat: Infinity, repeatType: 'reverse', delay: (i / N) * 0.09 } : { duration: 0.3 }}
                        style={{ width: 3, borderRadius: 3, background: active ? `linear-gradient(to top,${color}70,${color})` : 'rgba(255,255,255,0.1)', minHeight: '3px' }}
                    />
                );
            })}
        </div>
    );
}

/* ─── Personality Modes ─────────────────────────────────────────────────────── */
const PERSONALITY_MODES = [
    { id: 'founder', label: 'Founder', icon: Brain, color: '#06b6d4', desc: 'Business & Strategy' },
    { id: 'tech', label: 'Cyber', icon: Cpu, color: '#8b5cf6', desc: 'Tech & Code' },
    { id: 'performance', label: 'Mentor', icon: Zap, color: '#ec4899', desc: 'Growth & Focus' },
];

/* ─── History Item ─────────────────────────────────────────────────────────── */
function CommandHistoryPanel({ history, color, onClose, onDelete, onClearAll }) {
    return (
        <motion.div initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 260, background: 'rgba(5,7,14,0.95)', backdropFilter: 'blur(24px)', borderLeft: '1px solid rgba(255,255,255,0.07)', zIndex: 20, display: 'flex', flexDirection: 'column', padding: '58px 0 20px' }}>
            {/* Header */}
            <div style={{ padding: '0 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={11} color={color} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Session History</span>
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {history.length > 0 && (
                        <button onClick={onClearAll} title="Clear all"
                            style={{ fontSize: 9, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '2px 7px', cursor: 'pointer', letterSpacing: '0.06em' }}>
                            CLEAR ALL
                        </button>
                    )}
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.22)', padding: 4 }}><X size={12} /></button>
                </div>
            </div>
            {/* Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                {history.length === 0
                    ? <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)', textAlign: 'center', padding: '18px 14px', fontStyle: 'italic' }}>No commands yet</p>
                    : history.slice().reverse().map((item, i) => {
                        const realIdx = history.length - 1 - i; // index in original array
                        return (
                            <div key={i}
                                style={{ padding: '7px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'flex-start', gap: 6, position: 'relative' }}
                                onMouseEnter={e => e.currentTarget.querySelector('.del-btn').style.opacity = '1'}
                                onMouseLeave={e => e.currentTarget.querySelector('.del-btn').style.opacity = '0'}>
                                <ChevronRight size={9} color={color} style={{ marginTop: 3, flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: '0 0 3px', lineHeight: 1.45, paddingRight: 16 }}>{item.text}</p>
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{item.time}</span>
                                        {item.confidence != null && (
                                            <span style={{ fontSize: 9, fontWeight: 700, color: item.confidence >= 0.85 ? '#10b981' : item.confidence >= 0.65 ? '#f59e0b' : '#ef4444', background: item.confidence >= 0.85 ? '#10b98118' : '#f59e0b18', padding: '1px 5px', borderRadius: 4 }}>
                                                {Math.round(item.confidence * 100)}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {/* Per-item delete button */}
                                <button className="del-btn" onClick={() => onDelete(realIdx)}
                                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', opacity: 0, transition: 'opacity 0.15s', fontSize: 13, lineHeight: 1, padding: '2px 4px' }}
                                    title="Delete">
                                    ×
                                </button>
                            </div>
                        );
                    })
                }
            </div>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   FaceToFace — Main Component
═══════════════════════════════════════════════════════════════════════════════ */
export default function FaceToFace({ isOpen, onClose, mentor, userName, onSendMessage, lang, autoListen = false, onMentorChange }) {

    const [mode, setMode] = useState('idle');           // idle | listening | thinking | speaking
    const [transcript, setTranscript] = useState('');
    const [aiText, setAiText] = useState('');
    const [confidence, setConfidence] = useState(null);
    const [amplitude, setAmplitude] = useState(0);
    const [showHistory, setShowHistory] = useState(false);
    const [micBlocked, setMicBlocked] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [activePersonality, setActivePersonality] = useState(mentor?.id || 'founder');
    const [cmdHistory, setCmdHistory] = useState(() => {
        try { return JSON.parse(sessionStorage.getItem('nexo_cmd_history') || '[]'); } catch { return []; }
    });

    // ── Refs — all callbacks stored here to avoid stale closures ──
    const recognitionRef = useRef(null);
    const ampTimerRef = useRef(null);
    const keepAliveRef = useRef(null);
    const ttsUnlockedRef = useRef(false);
    const cachedVoicesRef = useRef([]);   // pre-loaded voice list
    const isOpenRef = useRef(isOpen);
    const langRef = useRef(lang?.code || 'en-US');
    const onSendRef = useRef(onSendMessage);
    const modeRef = useRef('idle');
    const intentionalStopRef = useRef(false);  // true when WE call abort() — prevents auto-restart
    const restartTimerRef = useRef(null);       // debounces restart attempts

    // Sync refs
    useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
    useEffect(() => { langRef.current = lang?.code || 'en-US'; }, [lang]);
    useEffect(() => { onSendRef.current = onSendMessage; }, [onSendMessage]);
    useEffect(() => { modeRef.current = mode; }, [mode]);
    useEffect(() => { if (mentor?.id) setActivePersonality(mentor.id); }, [mentor?.id]);
    useEffect(() => { sessionStorage.setItem('nexo_cmd_history', JSON.stringify(cmdHistory.slice(-20))); }, [cmdHistory]);

    const personality = PERSONALITY_MODES.find(p => p.id === activePersonality) || PERSONALITY_MODES[0];
    const accentColor = personality.color;

    // ── Unlock TTS — call on any user gesture ──
    const ensureTTSUnlocked = () => {
        if (ttsUnlockedRef.current) return;
        unlockTTS();
        ttsUnlockedRef.current = true;
    };

    // ── Stop recognition ──
    const stopRec = (intentional = true) => {
        intentionalStopRef.current = intentional;
        clearTimeout(restartTimerRef.current);
        if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch (_) { }
            recognitionRef.current = null;
        }
    };

    // ── Start ONE recognition session — no auto-restart loops ──
    const startRec = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { setMicBlocked(true); setErrorMsg('Speech recognition not supported. Use Chrome.'); return; }
        if (recognitionRef.current) return; // already running

        // Delay acquisition to ensure clean hand-off from wake word listener
        setTimeout(() => {
            if (!isOpenRef.current) return;
            const rec = new SR();
            rec.continuous = false;      // one shot — simpler, more reliable
            rec.interimResults = true;
            rec.lang = langRef.current;
            recognitionRef.current = rec;

            let finalFired = false;

            rec.onstart = () => {
                console.log('[Nexo] 🎤 Mic started');
                setMode('listening');
                setErrorMsg('');
            };

            rec.onresult = (e) => {
                if (finalFired) return;
                let interim = '', final = '', conf = null;
                for (let i = e.resultIndex; i < e.results.length; i++) {
                    if (e.results[i].isFinal) { final = e.results[i][0].transcript; conf = e.results[i][0].confidence; }
                    else interim += e.results[i][0].transcript;
                }
                if (interim || final) setTranscript(final || interim);
                if (final) {
                    finalFired = true;
                    setConfidence(conf);
                    // mark intentional so onend doesn't try to restart
                    intentionalStopRef.current = true;
                    recognitionRef.current = null;
                    try { rec.stop(); } catch (_) { }
                    handleCommand(final, conf);
                }
            };

            rec.onerror = (e) => {
                // Only log — let onend handle everything else
                console.warn('[Nexo] SpeechRec error:', e.error);
                if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
                    setMicBlocked(true);
                    setErrorMsg('Microphone blocked. Click 🔒 in address bar → Allow mic.');
                    setMode('idle');
                    recognitionRef.current = null;
                }
            };

            rec.onend = () => {
                recognitionRef.current = null;
                if (intentionalStopRef.current) {
                    intentionalStopRef.current = false;
                    return; // command captured — handleCommand already running
                }
                if (finalFired) return;
                // Session ended without result — go idle, NO auto-restart (prevents flicker)
                if (modeRef.current === 'listening') setMode('idle');
            };

            try { rec.start(); }
            catch (err) {
                console.error('[Nexo] rec.start() failed:', err.message);
                recognitionRef.current = null;
            }
        }, 200);
    };

    // ── Handle voice command ──
    const handleCommand = async (text, conf) => {
        if (!text?.trim()) return;
        const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setCmdHistory(prev => [...prev.slice(-19), { text: text.trim(), time: ts, confidence: conf }]);
        setMode('thinking');
        setTranscript(text);
        try {
            console.log('[Nexo] Sending to AI:', text);
            const response = await onSendRef.current(text);
            console.log('[Nexo] AI responded:', response?.slice(0, 80));
            if (response) speakText(response);
            else {
                setMode('idle');
                setTranscript('');
                if (isOpenRef.current) setTimeout(startRec, 600);
            }
        } catch (err) {
            console.error('[Nexo] AI error details:', err);
            const msg = err.message || 'Unknown error';
            setErrorMsg(`AI Error: ${msg.slice(0, 50)}`);
            setMode('idle');
            setTranscript('');
            if (isOpenRef.current) setTimeout(startRec, 2000);
        }
    };

    // ── Speak text using TTS ──
    const speakText = (text) => {
        if (!window.speechSynthesis) { setMode('idle'); setTimeout(startRec, 600); return; }

        const clean = text
            .replace(/```[\s\S]*?```/g, 'code block.')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/#{1,6}\s+/g, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/^[-*+]\s+/gm, '')
            .replace(/^\d+\.\s+/gm, '')
            .replace(/\n{2,}/g, '. ').replace(/\n/g, ' ')
            .trim().slice(0, 600);

        console.log('[Nexo] speakText called, length:', clean.length);

        const utt = new SpeechSynthesisUtterance(clean);
        utt.volume = 1.0;
        utt.rate = 1.0;
        utt.pitch = 1.0;
        utt.lang = langRef.current;

        // Pick a female voice — priority order
        const cached = cachedVoicesRef.current;
        if (cached && cached.length > 0) {
            const lc = langRef.current;
            const langBase = lc.split('-')[0]; // e.g. 'en'

            // Known female voice name keywords (Windows + Chrome + macOS)
            const isFemale = (v) => /female|zira|jenny|aria|emma|sara|samantha|natasha|fiona|victoria|hazel|moira/i.test(v.name);
            const isMale = (v) => /male|david|mark|james|george|daniel|alex|bruce/i.test(v.name);

            const voice =
                // 1. Exact lang match + Google + female name
                cached.find(v => v.lang === lc && v.name.includes('Google') && isFemale(v)) ||
                // 2. "Google UK English Female" — best female Google voice
                cached.find(v => v.name === 'Google UK English Female') ||
                // 3. Exact lang match + female name
                cached.find(v => v.lang === lc && isFemale(v)) ||
                // 4. Lang base match + female
                cached.find(v => v.lang.startsWith(langBase) && isFemale(v)) ||
                // 5. Any English female
                cached.find(v => v.lang.startsWith('en') && isFemale(v)) ||
                // 6. Anything NOT explicitly male (avoid male fallback)
                cached.find(v => v.lang.startsWith('en') && !isMale(v)) ||
                // 7. Final fallback — any voice
                cached[0];

            if (voice) { utt.voice = voice; console.log('[Nexo] 🎙️ Voice:', voice.name, voice.lang); }
        }

        // Chrome TTS pause-bug keepAlive
        clearInterval(keepAliveRef.current);
        keepAliveRef.current = setInterval(() => {
            if (window.speechSynthesis.paused) window.speechSynthesis.resume();
        }, 4000);

        utt.onstart = () => {
            console.log('[Nexo] TTS started ✓');
            setMode('speaking'); setAiText(text); setTranscript('');
            clearInterval(ampTimerRef.current);
            ampTimerRef.current = setInterval(() => {
                setAmplitude(window.speechSynthesis.speaking ? 0.2 + Math.random() * 0.8 : 0);
            }, 80);
        };

        utt.onend = () => {
            console.log('[Nexo] TTS ended');
            clearInterval(keepAliveRef.current); clearInterval(ampTimerRef.current);
            setAmplitude(0); setMode('idle'); setAiText(''); setConfidence(null);
            if (isOpenRef.current) setTimeout(startRec, 400);
        };

        utt.onerror = (e) => {
            console.warn('[Nexo] TTS error:', e.error);
            clearInterval(keepAliveRef.current); clearInterval(ampTimerRef.current);
            setAmplitude(0); setMode('idle');
            if (isOpenRef.current) setTimeout(startRec, 600);
        };

        // Simple reliable pattern: cancel → resume → speak
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
        window.speechSynthesis.speak(utt);
        console.log('[Nexo] speak() called, pending:', window.speechSynthesis.pending);
    };

    // ── Open / close lifecycle ──
    useEffect(() => {
        if (isOpen) {
            setMode('idle');
            setTranscript('');
            setAiText('');
            setConfidence(null);
            setErrorMsg('');
            setMicBlocked(false);
            ttsUnlockedRef.current = false;

            const loadVoices = () => {
                const v = window.speechSynthesis?.getVoices() || [];
                if (v.length > 0) {
                    cachedVoicesRef.current = v;
                } else {
                    window.speechSynthesis.onvoiceschanged = () => {
                        cachedVoicesRef.current = window.speechSynthesis.getVoices();
                        window.speechSynthesis.onvoiceschanged = null;
                    };
                }
            };
            loadVoices();
            unlockTTS();
            ttsUnlockedRef.current = true;

            const t = setTimeout(() => {
                if (isOpenRef.current) startRec();
            }, autoListen ? 80 : 500);

            return () => {
                clearTimeout(t);
                stopRec(true);
                window.speechSynthesis?.cancel();
                clearInterval(ampTimerRef.current);
                clearInterval(keepAliveRef.current);
                clearInterval(restartTimerRef.current);
            };
        }
    }, [isOpen, autoListen]);

    // ── Keyboard shortcuts ──
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.code === 'Escape') { onClose(); }
            if (e.code === 'Space') {
                e.preventDefault();
                ensureTTSUnlocked();
                modeRef.current === 'listening' ? stopRec() : startRec();
            }
            if (e.code === 'KeyH') setShowHistory(p => !p);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen]);

    // ── Handle personality switch ──
    const switchPersonality = (pid) => {
        setActivePersonality(pid);
        onMentorChange?.(pid);
    };

    // ── Mic button click ──
    const onMicClick = () => {
        ensureTTSUnlocked();
        if (modeRef.current === 'listening') {
            stopRec();
            setMode('idle');
        } else if (modeRef.current === 'idle') {
            startRec();
        }
    };

    if (!isOpen) return null;

    const modeLabel = { idle: 'Tap mic or say "Hey Nexo"', listening: 'Listening…', thinking: 'Processing…', speaking: 'Speaking…' };
    const modeDot = { idle: 'rgba(255,255,255,0.2)', listening: '#ef4444', thinking: '#f59e0b', speaking: accentColor };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#030508', fontFamily: "'Outfit','Inter',sans-serif", overflow: 'hidden' }}>

            <FaceBackground mode={mode} amplitude={amplitude} color={accentColor} />

            {/* History panel */}
            <AnimatePresence>
                {showHistory && <CommandHistoryPanel
                    history={cmdHistory}
                    color={accentColor}
                    onClose={() => setShowHistory(false)}
                    onDelete={(idx) => setCmdHistory(prev => prev.filter((_, i) => i !== idx))}
                    onClearAll={() => {
                        setCmdHistory([]);
                        sessionStorage.removeItem('nexo_cmd_history');
                    }}
                />}
            </AnimatePresence>

            {/* ── TOP BAR ── */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px' }}>
                {/* Brand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <motion.div
                        animate={{ boxShadow: [`0 0 8px ${accentColor}40`, `0 0 20px ${accentColor}70`, `0 0 8px ${accentColor}40`] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                        style={{ width: 34, height: 34, borderRadius: 10, background: `${accentColor}18`, border: `1px solid ${accentColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Brain size={16} color={accentColor} />
                    </motion.div>
                    <div>
                        <p style={{ fontSize: 14, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '0.04em' }}>NEXO <span style={{ color: accentColor }}>AI</span></p>
                        <p style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', margin: 0 }}>{personality.desc}</p>
                    </div>
                </div>

                {/* Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <motion.div
                        animate={{ scale: mode === 'listening' ? [1, 1.5, 1] : mode === 'speaking' ? [1, 1.3, 1] : 1, opacity: mode === 'idle' ? 0.3 : 1 }}
                        transition={{ repeat: Infinity, duration: 1.0 }}
                        style={{ width: 7, height: 7, borderRadius: '50%', background: modeDot[mode] }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: modeDot[mode], letterSpacing: '0.14em', textTransform: 'uppercase' }}>{modeLabel[mode]}</span>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setShowHistory(p => !p)}
                        style={{ width: 34, height: 34, borderRadius: 10, background: showHistory ? `${accentColor}18` : 'rgba(255,255,255,0.05)', border: `1px solid ${showHistory ? accentColor + '44' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: showHistory ? accentColor : 'rgba(255,255,255,0.35)' }}>
                        <Clock size={14} />
                    </button>
                    <button onClick={onClose}
                        style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.35)' }}>
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* ── CENTER CONTENT ── */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 5, width: '100%' }}>

                {/* ParticleSphere */}
                <motion.div
                    animate={{ scale: mode === 'speaking' ? 1 + amplitude * 0.05 : mode === 'listening' ? 1.04 : 1 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 18 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <ParticleSphere mode={mode} amplitude={amplitude} color={accentColor} size={260} />
                    <div style={{ width: 140, height: 14, marginTop: -8, background: `radial-gradient(ellipse,${accentColor}25 0%,transparent 75%)`, filter: 'blur(6px)' }} />
                </motion.div>

                {/* Waveform (below sphere, speaking only) */}
                <div style={{ marginTop: 2 }}>
                    <Waveform amplitude={amplitude} color={accentColor} active={mode === 'speaking'} />
                </div>

                {/* Error message */}
                {errorMsg && (
                    <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        style={{ fontSize: 11, color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '6px 14px', margin: '6px 0 0', maxWidth: 380, textAlign: 'center' }}>
                        ⚠ {errorMsg}
                    </motion.p>
                )}

                {/* Transcript */}
                <div style={{ textAlign: 'center', marginTop: 10, minHeight: 54, width: '100%', maxWidth: 480, padding: '0 28px' }}>
                    <AnimatePresence mode="wait">
                        {transcript ? (
                            <motion.div key="t" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                                <p style={{ fontSize: 17, fontWeight: 600, color: 'rgba(255,255,255,0.88)', lineHeight: 1.5, margin: '0 0 6px' }}>"{transcript}"</p>
                                {confidence != null && (
                                    <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, color: confidence >= 0.85 ? '#10b981' : confidence >= 0.65 ? '#f59e0b' : '#ef4444', background: 'rgba(255,255,255,0.06)', letterSpacing: '0.04em' }}>
                                        {Math.round(confidence * 100)}% confident
                                    </span>
                                )}
                            </motion.div>
                        ) : (
                            <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', margin: 0, letterSpacing: '0.02em' }}>
                                {micBlocked ? '🔒 Microphone access denied' : modeLabel[mode]}
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>

                {/* AI response removed from center — shown in right panel below */}
            </div>

            {/* ── RIGHT SIDE — AI Response Panel ── */}
            <AnimatePresence>
                {aiText && (
                    <motion.div
                        initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                        style={{
                            position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
                            width: 220, zIndex: 8,
                            background: `linear-gradient(135deg,${accentColor}0d,rgba(5,7,14,0.9))`,
                            border: `1px solid ${accentColor}28`, borderRadius: 18,
                            padding: '14px 16px', backdropFilter: 'blur(16px)',
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                            <motion.div
                                animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 1.1 }}
                                style={{ width: 5, height: 5, borderRadius: '50%', background: accentColor, flexShrink: 0 }} />
                            <span style={{ fontSize: 8, fontWeight: 700, color: accentColor, letterSpacing: '0.16em', textTransform: 'uppercase' }}>NEXO Speaking</span>
                        </div>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.65, margin: 0 }}>
                            {aiText.slice(0, 240)}{aiText.length > 240 ? '…' : ''}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── BOTTOM BAR ── */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '0 28px 32px' }}>

                {/* Personality buttons */}
                <div style={{ display: 'flex', gap: 10 }}>
                    {PERSONALITY_MODES.map(pm => {
                        const Icon = pm.icon;
                        const active = activePersonality === pm.id;
                        return (
                            <motion.button key={pm.id} whileTap={{ scale: 0.9 }}
                                onClick={() => switchPersonality(pm.id)}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, background: active ? `${pm.color}1a` : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? pm.color + '50' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer', boxShadow: active ? `0 0 12px ${pm.color}22` : 'none', transition: 'all 0.2s' }}>
                                <Icon size={11} color={active ? pm.color : 'rgba(255,255,255,0.28)'} />
                                <span style={{ fontSize: 10, fontWeight: 700, color: active ? pm.color : 'rgba(255,255,255,0.28)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{pm.label}</span>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Mic button */}
                <motion.button whileTap={{ scale: 0.88 }} onClick={onMicClick}
                    style={{ width: 68, height: 68, borderRadius: '50%', background: mode === 'listening' ? 'rgba(239,68,68,0.18)' : `${accentColor}14`, border: mode === 'listening' ? '1.5px solid rgba(239,68,68,0.5)' : `1.5px solid ${accentColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: mode === 'listening' ? '0 0 32px rgba(239,68,68,0.28)' : `0 0 20px ${accentColor}18`, position: 'relative' }}>
                    {mode === 'listening' && (
                        <>
                            <motion.div animate={{ scale: [1, 1.75], opacity: [0.45, 0] }} transition={{ duration: 1.1, repeat: Infinity }}
                                style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '1.5px solid rgba(239,68,68,0.4)', pointerEvents: 'none' }} />
                            <motion.div animate={{ scale: [1, 1.4], opacity: [0.3, 0] }} transition={{ duration: 1.1, repeat: Infinity, delay: 0.4 }}
                                style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '1.5px solid rgba(239,68,68,0.2)', pointerEvents: 'none' }} />
                        </>
                    )}
                    {mode === 'listening'
                        ? <motion.div animate={{ scale: [1, 1.18, 1] }} transition={{ repeat: Infinity, duration: 1.1 }}><Mic size={26} color="#ef4444" /></motion.div>
                        : micBlocked ? <MicOff size={24} color="#ef444488" /> : <Mic size={24} color={`${accentColor}bb`} />
                    }
                </motion.button>

                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.14)', margin: 0, letterSpacing: '0.08em', textAlign: 'center' }}>
                    SPACE to toggle mic · H for history · ESC to close
                </p>
            </div>
        </motion.div>
    );
}
