import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, ShieldAlert, ShieldCheck, Activity, Globe,
    Cpu, Zap, Lock, Eye, AlertCircle, Scan, Terminal
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, sub, color, pulse }) => (
    <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: '16px 20px',
        position: 'relative',
        overflow: 'hidden'
    }}>
        {pulse && (
            <motion.div
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(circle at 10% 10%, ${color}10, transparent)`,
                }}
            />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: `${color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <Icon size={16} color={color} />
            </div>
            <div>
                <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{value}</p>
                {sub && <p style={{ margin: '2px 0 0', fontSize: 9, color: `${color}cc`, fontWeight: 700, textTransform: 'uppercase' }}>{sub}</p>}
            </div>
        </div>
    </div>
);

const SecurityMonitor = () => {
    const [scanActive, setScanActive] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(timer);
    }, []);

    const data = {
        activeMonitors: 16,
        totalTrackedIps: 16,
        attackDistribution: {
            bruteForce: 0,
            ddos: 0,
            scanning: 17
        },
        systemLoad: "Low",
        engine: "Isolation Forest v2"
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 20 }}>
            {/* Header / Engine Status */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', borderRadius: 20,
                background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.08), transparent)',
                border: '1px solid rgba(6, 182, 212, 0.15)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ position: 'relative' }}>
                        <Scan size={24} color="#06b6d4" className="animate-pulse" />
                        <motion.div
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid #06b6d4' }}
                        />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Security Engine: {data.engine}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                            <span style={{ fontSize: 10, color: '#06b6d4', fontWeight: 800 }}>ACTIVE INTEGRITY CHECK</span>
                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#06b6d4' }} />
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontMono: 'true' }}>{currentTime}</span>
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 10, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: 20, fontWeight: 800, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        LOAD: {data.systemLoad}
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <StatCard
                    icon={Activity}
                    label="Active Nodes"
                    value={data.activeMonitors}
                    sub="Real-time Monitors"
                    color="#06b6d4"
                    pulse
                />
                <StatCard
                    icon={Globe}
                    label="Tracked IPs"
                    value={data.totalTrackedIps}
                    sub="Unique Sources"
                    color="#8b5cf6"
                />
            </div>

            {/* Attack Distribution */}
            <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                padding: 24
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <ShieldAlert size={16} color="#f59e0b" />
                    <h5 style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Neural Threat Distribution</h5>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <ThreatLevel label="Scanning / Recon" count={data.attackDistribution.scanning} color="#06b6d4" total={20} />
                    <ThreatLevel label="Brute Force" count={data.attackDistribution.bruteForce} color="#f87171" total={20} />
                    <ThreatLevel label="DDoS Vectors" count={data.attackDistribution.ddos} color="#ec4899" total={20} />
                </div>
            </div>

            {/* Neural Log Preview */}
            <div style={{
                background: '#000',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: '12px 16px',
                fontFamily: 'monospace'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Terminal size={12} color="#4b5563" />
                    <span style={{ fontSize: 10, color: '#4b5563', fontWeight: 700 }}>ISOLATION_FOREST_LOGS</span>
                </div>
                <div style={{ fontSize: 11, color: '#06b6d4', lineHeight: 1.6, opacity: 0.8 }}>
                    <p style={{ margin: 0 }}>[SYSTEM] Initializing weight matrices... OK</p>
                    <p style={{ margin: 0 }}>[CORE] Anomaly detection threshold set to 0.85</p>
                    <p style={{ margin: 0 }}>[SYNC] Tracking {data.totalTrackedIps} autonomous ingress packets</p>
                    <motion.p
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        style={{ margin: 0 }}
                    >
                        _ listening for neural anomalies...
                    </motion.p>
                </div>
            </div>
        </div>
    );
};

const ThreatLevel = ({ label, count, color, total }) => (
    <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: color }}>{count} Detected</span>
        </div>
        <div style={{ height: 6, width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden' }}>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(count / total) * 100}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                style={{ height: '100%', background: color, boxShadow: `0 0 10px ${color}80` }}
            />
        </div>
    </div>
);

export default SecurityMonitor;
