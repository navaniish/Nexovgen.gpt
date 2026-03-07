import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lock, Mail, Globe, AlertCircle, Eye, EyeOff, Fingerprint, ChevronRight
} from 'lucide-react';

import {
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    auth,
    googleProvider,
    signInAnonymously
} from '../lib/firebase';
import Logo from './Logo';
import HexBackground from './HexBackground';

/* ─────────────────────────────────────────────
    DESIGN TOKENS & CONSTANTS
───────────────────────────────────────────── */
const T = {
    blue: '#4F8EF7',
    purple: '#A855F7',
    bg: '#05070A',
    cardBg: 'rgba(13, 17, 25, 0.7)',
    border: 'rgba(255, 255, 255, 0.08)',
    textMain: '#FFFFFF',
    textSub: '#94A3B8',
    gradient: 'linear-gradient(135deg, #4F8EF7 0%, #A855F7 100%)',
};

const Header = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <motion.nav
            className={`nxv-nav ${scrolled ? 'nxv-nav-scrolled' : ''}`}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6 }}
        >
            <div className="nxv-nav-content">
                <Logo size="sm" />
                <div className="nxv-nav-actions">
                    <button className="nxv-nav-btn-primary" onClick={() => {
                        const target = document.getElementById('nxv-auth-card');
                        target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}>
                        Initialize Access <ChevronRight size={14} style={{ marginLeft: 4 }} />
                    </button>
                </div>
            </div>
        </motion.nav>
    );
};

/* ─────────────────────────────────────────────
    MAIN AUTH PAGE COMPONENT
───────────────────────────────────────────── */
const Auth = ({ onAuth }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form inputs
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await signInWithPopup(auth, googleProvider);
            if (onAuth) onAuth(result.user);
        } catch (err) {
            console.error("Google Auth Error:", err);
            const errorCode = err.code || 'unknown';
            if (errorCode === 'auth/popup-closed-by-user') {
                setError('');
            } else {
                setError(`Google authentication failed: ${errorCode}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAnonymousLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await signInAnonymously(auth);
            if (onAuth) onAuth(result.user);
        } catch (err) {
            console.error("Anonymous Auth Error:", err);
            setError(`Nexus Guest access failed: ${err.code}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                const result = await signInWithEmailAndPassword(auth, email, password);
                if (onAuth) onAuth(result.user);
            } else {
                const result = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(result.user, { displayName: name });
                if (onAuth) onAuth(result.user);
            }
        } catch (err) {
            console.error("Auth Error:", err);
            const errorCode = err.code || 'unknown';
            setError(`Authentication failed: ${errorCode}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="nxv-auth-container">
            <HexBackground />

            <div style={{ position: 'relative', zIndex: 10 }}>
                <Header />

                <section className="nxv-snap-section">
                    <div className="nxv-modal-content" id="nxv-auth-card">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="nxv-card"
                        >
                            <div className="nxv-card-header">
                                <div className="flex justify-center mb-6">
                                    <div style={{
                                        width: 64,
                                        height: 64,
                                        position: 'relative',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        {/* Hex glow */}
                                        <div style={{
                                            position: 'absolute',
                                            inset: 0,
                                            background: 'radial-gradient(circle, rgba(79,142,247,0.25) 0%, transparent 70%)',
                                            filter: 'blur(8px)',
                                        }} />
                                        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            {/* Outer hexagon */}
                                            <path d="M30 4L54 17.5V43.5L30 57L6 43.5V17.5L30 4Z" stroke="rgba(79,142,247,0.4)" strokeWidth="1" fill="rgba(79,142,247,0.04)" />
                                            {/* Inner hexagon */}
                                            <path d="M30 12L48 22V42L30 52L12 42V22L30 12Z" stroke="rgba(79,142,247,0.2)" strokeWidth="0.5" fill="none" />
                                            {/* Center hexagon (filled) */}
                                            <path d="M30 20L42 27V41L30 48L18 41V27L30 20Z" fill="rgba(79,142,247,0.1)" stroke="rgba(100,180,255,0.6)" strokeWidth="1" />
                                            {/* Core glowing nodes */}
                                            <circle cx="30" cy="30" r="3" fill="#4F8EF7" filter="url(#glow)" />
                                            <circle cx="30" cy="20" r="1.5" fill="#4F8EF7" opacity="0.8" />
                                            <circle cx="42" cy="27" r="1.5" fill="#A855F7" opacity="0.8" />
                                            <circle cx="42" cy="41" r="1.5" fill="#4F8EF7" opacity="0.8" />
                                            <circle cx="30" cy="48" r="1.5" fill="#A855F7" opacity="0.8" />
                                            <circle cx="18" cy="41" r="1.5" fill="#4F8EF7" opacity="0.8" />
                                            <circle cx="18" cy="27" r="1.5" fill="#A855F7" opacity="0.8" />
                                            {/* Connection lines */}
                                            <line x1="30" y1="30" x2="30" y2="20" stroke="rgba(79,142,247,0.4)" strokeWidth="0.5" />
                                            <line x1="30" y1="30" x2="42" y2="27" stroke="rgba(168,85,247,0.4)" strokeWidth="0.5" />
                                            <line x1="30" y1="30" x2="42" y2="41" stroke="rgba(79,142,247,0.4)" strokeWidth="0.5" />
                                            <line x1="30" y1="30" x2="30" y2="48" stroke="rgba(168,85,247,0.4)" strokeWidth="0.5" />
                                            <line x1="30" y1="30" x2="18" y2="41" stroke="rgba(79,142,247,0.4)" strokeWidth="0.5" />
                                            <line x1="30" y1="30" x2="18" y2="27" stroke="rgba(168,85,247,0.4)" strokeWidth="0.5" />
                                            <defs>
                                                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                                    <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                                                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                                </filter>
                                            </defs>
                                        </svg>
                                    </div>
                                </div>
                                <h2 className="nxv-card-title">NEXOVGEN AI</h2>
                                <p className="nxv-card-subtitle">FUTURE-PROOF INTELLIGENCE LAYER</p>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="nxv-err"
                                >
                                    <AlertCircle size={18} />
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            <form className="nxv-form" onSubmit={handleSubmit}>
                                {!isLogin && (
                                    <div className="nxv-input-group">
                                        <label className="nxv-label">Identity Core Name</label>
                                        <div className="nxv-input-wrapper">
                                            <Fingerprint className="nxv-input-icon" size={18} />
                                            <input
                                                type="text"
                                                placeholder="John Doe"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="nxv-input"
                                                required={!isLogin}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="nxv-input-group">
                                    <label className="nxv-label">Identity Core Email</label>
                                    <div className="nxv-input-wrapper">
                                        <Mail className="nxv-input-icon" size={18} />
                                        <input
                                            type="email"
                                            placeholder="user@nexovgen.ai"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="nxv-input"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="nxv-input-group">
                                    <div className="flex justify-between items-center">
                                        <label className="nxv-label">Security Access</label>
                                        {isLogin && (
                                            <button type="button" className="text-[10px] text-blue-400 font-bold tracking-wider hover:underline uppercase mb-2">
                                                Reset Token?
                                            </button>
                                        )}
                                    </div>
                                    <div className="nxv-input-wrapper">
                                        <Lock className="nxv-input-icon" size={18} />
                                        <input
                                            type={showPass ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="nxv-input"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="nxv-pass-toggle"
                                            onClick={() => setShowPass(!showPass)}
                                        >
                                            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" className="nxv-submit-btn" disabled={loading}>
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Synchronizing...
                                        </span>
                                    ) : isLogin ? 'Initialize Session' : 'Provision Account'}
                                </button>
                            </form>

                            <div className="nxv-divider">OR CONNECT VIA</div>

                            <div className="nxv-social-grid">
                                <button onClick={handleGoogleLogin} type="button" className="nxv-social-btn" disabled={loading}>
                                    <Globe size={18} className="text-blue-400" />
                                    <span>Google Portal</span>
                                </button>
                                <button onClick={handleAnonymousLogin} type="button" className="nxv-social-btn" disabled={loading}>
                                    <Fingerprint size={18} className="text-purple-400" />
                                    <span>Nexus Guest</span>
                                </button>
                            </div>

                            <p className="nxv-switch-text">
                                {isLogin ? "Node not registered?" : "Already part of the network?"}
                                <button
                                    type="button"
                                    className="nxv-link-btn"
                                    style={{ marginLeft: '8px' }}
                                    onClick={() => setIsLogin(!isLogin)}
                                >
                                    {isLogin ? 'Register Hub' : 'Initialize Login'}
                                </button>
                            </p>
                        </motion.div>
                    </div>
                </section>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap');

            .nxv-auth-container {
                background: transparent;
                color: #fff;
                font-family: 'Outfit', sans-serif;
                min-height: 100vh;
                position: relative;
                overflow-x: hidden;
            }

            .nxv-nav {
                position: fixed;
                top: 0; left: 0; right: 0;
                height: 80px;
                z-index: 1000;
                transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .nxv-nav-scrolled {
                background: rgba(8, 12, 22, 0.8);
                backdrop-filter: blur(20px);
                border-bottom: 1px solid rgba(255,255,255,0.05);
            }
            .nxv-nav-content {
                max-width: 1400px;
                margin: 0 auto;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 40px;
            }
            .nxv-nav-btn-primary {
                background: rgba(79, 142, 247, 0.1);
                border: 1px solid rgba(79, 142, 247, 0.2);
                color: #4F8EF7;
                font-weight: 700;
                font-size: 13px;
                height: 40px;
                padding: 0 20px;
                border-radius: 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                transition: all 0.3s;
            }
            .nxv-nav-btn-primary:hover {
                background: rgba(79, 142, 247, 0.2);
                transform: translateY(-1px);
            }

            .nxv-snap-section {
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 100px 20px 60px;
            }

            .nxv-card {
                background: rgba(13, 17, 25, 0.7);
                backdrop-filter: blur(40px);
                -webkit-backdrop-filter: blur(40px);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 32px;
                padding: 48px;
                width: 100%;
                max-width: 480px;
                box-shadow: 0 40px 100px rgba(0,0,0,0.6);
            }
            .nxv-card-header { text-align: center; margin-bottom: 40px; }
            .nxv-card-title { 
                font-size: 28px; 
                font-weight: 800; 
                letter-spacing: 0.15em; 
                margin-bottom: 8px;
                background: linear-gradient(to right, #fff, #94a3b8);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            .nxv-card-subtitle { 
                color: #4F8EF7; 
                font-size: 11px; 
                font-weight: 800; 
                letter-spacing: 0.3em;
                text-transform: uppercase;
                opacity: 0.8;
            }

            .nxv-form { display: flex; flex-direction: column; gap: 24px; }
            .nxv-input-group { display: flex; flex-direction: column; gap: 8px; }
            .nxv-label {
                font-size: 11px;
                font-weight: 700;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                padding-left: 4px;
            }
            .nxv-input-wrapper { position: relative; }
            .nxv-input-icon {
                position: absolute;
                left: 18px;
                top: 50%;
                transform: translateY(-50%);
                color: #4F8EF7;
                opacity: 0.5;
            }
            .nxv-input {
                width: 100%;
                height: 56px;
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 16px;
                padding: 0 52px;
                color: #fff;
                font-size: 15px;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .nxv-input:focus {
                background: rgba(255, 255, 255, 0.05);
                border-color: rgba(79, 142, 247, 0.4);
                outline: none;
                box-shadow: 0 0 0 4px rgba(79, 142, 247, 0.1);
            }
            .nxv-pass-toggle {
                position: absolute;
                right: 18px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                color: #64748b;
                cursor: pointer;
                display: flex;
                align-items: center;
                transition: color 0.2s;
            }
            .nxv-pass-toggle:hover { color: #fff; }

            .nxv-submit-btn {
                width: 100%;
                height: 56px;
                background: linear-gradient(135deg, #4F8EF7, #2D5AF0);
                color: #fff;
                border: none;
                border-radius: 16px;
                font-weight: 700;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.3s;
                margin-top: 8px;
                box-shadow: 0 10px 20px rgba(79, 142, 247, 0.2);
            }
            .nxv-submit-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 15px 30px rgba(79, 142, 247, 0.3);
            }
            .nxv-submit-btn:disabled {
                opacity: 0.7;
                cursor: not-allowed;
            }

            .nxv-divider {
                display: flex;
                align-items: center;
                margin: 32px 0;
                color: #334155;
                font-size: 9px;
                font-weight: 800;
                letter-spacing: 0.3em;
            }
            .nxv-divider::before, .nxv-divider::after {
                content: '';
                flex: 1;
                height: 1px;
                background: rgba(255, 255, 255, 0.05);
            }
            .nxv-divider::before { margin-right: 16px; }
            .nxv-divider::after { margin-left: 16px; }

            .nxv-social-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .nxv-social-btn {
                height: 52px;
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 16px;
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }
            .nxv-social-btn:hover:not(:disabled) {
                background: rgba(255,255,255,0.06);
                border-color: rgba(255,255,255,0.2);
            }

            .nxv-switch-text {
                margin-top: 32px;
                text-align: center;
                color: #64748b;
                font-size: 14px;
            }
            .nxv-link-btn {
                background: none;
                border: none;
                color: #4F8EF7;
                font-weight: 700;
                cursor: pointer;
                padding: 0;
                transition: color 0.2s;
            }
            .nxv-link-btn:hover { color: #fff; }

            .nxv-err {
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.2);
                border-radius: 12px;
                padding: 12px 16px;
                color: #f87171;
                font-size: 13px;
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 24px;
            }
            `
            }} />
        </div>
    );
};

export default Auth;
