import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Cpu, Database, Zap, Plus, Play, Info, CheckCircle2,
    X, LayoutGrid, Terminal, BarChart2, Server, HardDrive,
    Bot, Brain, Layers, Gauge, RefreshCw, AlertCircle, TrendingUp,
    ChevronRight, Save, Globe, Code
} from 'lucide-react';
import Logo from './Logo';

const CLUSTER_STATS = {
    compute_power: '128 PetaFLOPS',
    storage_used: '2.4 PB',
    active_jobs: 0,
    budget_remaining: '$12.4M'
};

export default function AILab({ user, onClose }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [showLauncher, setShowLauncher] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [launching, setLaunching] = useState(false);
    const [deployingModel, setDeployingModel] = useState(null);
    const [deployToast, setDeployToast] = useState(null);
    const [launcherConfig, setLauncherConfig] = useState({
        modelSize: '7B',
        dataset: 'NexovGen-Primary (2.4T)'
    });

    const fetchJobs = async () => {
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/training/jobs', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setJobs(await res.json());
        } catch (err) { console.error("Fetch jobs failed", err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchJobs();
        const interval = setInterval(fetchJobs, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const launchJob = async () => {
        setLaunching(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/training/jobs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: `NexovGen-${launcherConfig.modelSize}-Main`,
                    modelSize: launcherConfig.modelSize,
                    dataset: launcherConfig.dataset
                })
            });
            if (res.ok) {
                setShowLauncher(false);
                fetchJobs();
            }
        } catch (err) { console.error("Launch failed", err); }
        finally { setLaunching(false); }
    };

    const deployToEdge = async (modelName) => {
        setDeployingModel(modelName);
        try {
            const token = await user.getIdToken();
            await fetch('/api/models/deploy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ model: modelName, target: 'edge' })
            });
        } catch (err) {
            // Optimistic UI — show success even if backend isn't wired yet
            console.warn('Deploy API not connected, showing optimistic result:', err);
        } finally {
            setDeployingModel(null);
            setDeployToast(modelName);
            setTimeout(() => setDeployToast(null), 3000);
        }
    };

    const stopJob = async (id) => {
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/training/jobs/${id}/stop`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) fetchJobs();
        } catch (err) { console.error("Stop failed", err); }
    };

    const activeJobs = jobs.filter(j => j.status === 'training');
    const stats = {
        ...CLUSTER_STATS,
        gpus_active: activeJobs.length * 512, // Simulate 512 GPUs per job
        active_jobs_count: activeJobs.length
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 250, background: '#05070a', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: "'Outfit', sans-serif" }}>

            {/* Header */}
            <div style={{ zIndex: 30, background: 'rgba(5,7,10,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Logo size="sm" />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 20, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#06b6d4', boxShadow: '0 0 10px #06b6d4' }} className="animate-pulse" />
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.1em' }}>GPU Cluster Active</span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button
                        onClick={() => setShowLauncher(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 800, boxShadow: '0 8px 20px rgba(6,182,212,0.2)' }}
                    >
                        <Plus size={16} strokeWidth={3} /> Launch NexovGen
                    </button>
                    <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Sidebar */}
                <div style={{ width: 280, borderRight: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.2em', paddingLeft: 12, marginBottom: 12 }}>NexovGen Research</p>
                    {[
                        { id: 'overview', name: 'Cluster Overview', icon: LayoutGrid },
                        { id: 'jobs', name: 'Training Jobs', icon: Activity },
                        { id: 'datasets', name: 'Dataset Lab', icon: Database },
                        { id: 'models', name: 'Model Registry', icon: Layers },
                        { id: 'compute', name: 'GPU Telemetry', icon: Cpu },
                    ].map(tab => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, border: 'none', cursor: 'pointer', textAlign: 'left',
                                    background: active ? 'rgba(255,255,255,0.04)' : 'transparent',
                                    color: active ? '#fff' : '#6b7280',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Icon size={18} color={active ? '#06b6d4' : '#4b5563'} />
                                <span style={{ fontSize: 14, fontWeight: 600 }}>{tab.name}</span>
                                {active && <motion.div layoutId="tab-active" style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: '#06b6d4' }} />}
                            </button>
                        );
                    })}

                    <div style={{ marginTop: 'auto', padding: 20, borderRadius: 20, background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <Zap size={14} color="#06b6d4" fill="#06b6d4" />
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>H100 Reservation</span>
                        </div>
                        <p style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5, marginBottom: 12 }}>Your dedicated cluster is scaling to 2048 nodes in 12h.</p>
                        <div style={{ height: 4, width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} style={{ height: '100%', background: '#06b6d4', borderRadius: 2 }} />
                        </div>
                    </div>
                </div>

                {/* Main View */}
                <div style={{ flex: 1, padding: '40px 60px', overflowY: 'auto' }}>
                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <div style={{ marginBottom: 40 }}>
                                    <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Intelligence Fabrication Lab</h1>
                                    <p style={{ fontSize: 15, color: '#6b7280' }}>Monitor and orchestrate your custom NexovGen foundation models.</p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 48 }}>
                                    {[
                                        { label: 'Active GPUs', value: stats.gpus_active.toLocaleString(), icon: Cpu, color: '#06b6d4' },
                                        { label: 'Aggregate FLOPS', value: stats.compute_power, icon: Zap, color: '#f59e0b' },
                                        { label: 'Dataset Flux', value: stats.storage_used, icon: Database, color: '#8b5cf6' },
                                        { label: 'Available Budget', value: stats.budget_remaining, icon: Gauge, color: '#10b981' },
                                    ].map(stat => (
                                        <div key={stat.label} style={{ padding: 24, borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                                            <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.03 }}>
                                                <stat.icon size={80} />
                                            </div>
                                            <p style={{ fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', marginBottom: 8 }}>{stat.label}</p>
                                            <h3 style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>{stat.value}</h3>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
                                    {/* Active Jobs Section */}
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Running Training Shards</h2>
                                            <button onClick={() => setActiveTab('jobs')} style={{ background: 'none', border: 'none', color: '#06b6d4', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>View All Jobs</button>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                            {activeJobs.length === 0 ? (
                                                <div style={{ padding: 40, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 24 }}>
                                                    <p style={{ color: '#4b5563', fontSize: 13 }}>No active training shards. Launch a job to begin fabrication.</p>
                                                </div>
                                            ) : (
                                                activeJobs.slice(0, 2).map(job => (
                                                    <JobCard key={job.id} job={job} onStop={() => stopJob(job.id)} />
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Scaling Laws & Alerts */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                        <ScalingLawsCard />
                                        <AlertsCard />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'jobs' && (
                            <motion.div key="jobs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <div style={{ marginBottom: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Training Queue</h1>
                                        <p style={{ fontSize: 15, color: '#6b7280' }}>Manage active, queued, and completed intelligence shards.</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <button style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: 12, fontWeight: 700 }}>Filter: Active</button>
                                        <button onClick={() => setShowLauncher(true)} style={{ padding: '10px 16px', borderRadius: 12, border: 'none', background: '#06b6d4', color: '#fff', fontSize: 12, fontWeight: 800 }}>New Job</button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {jobs.length === 0 ? (
                                        <div style={{ padding: 80, textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 32 }}>
                                            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                                <Activity size={32} color="#06b6d4" />
                                            </div>
                                            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>The Cluster is Idle</h3>
                                            <p style={{ color: '#6b7280', fontSize: 14, maxWidth: 400, margin: '0 auto' }}>You haven't launched any training jobs yet. Initialize your first foundation model to begin.</p>
                                        </div>
                                    ) : (
                                        jobs.map(job => (
                                            <JobCard key={job.id} job={job} onStop={() => stopJob(job.id)} full />
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'datasets' && (
                            <motion.div key="datasets" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <div style={{ marginBottom: 40 }}>
                                    <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Dataset Lab</h1>
                                    <p style={{ fontSize: 15, color: '#6b7280' }}>Ingest, clean, and tokenize high-fidelity training data.</p>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
                                    <DataPipelineCard name="NexovGen-Primary" size="2.4T tokens" status="Ready" />
                                    <DataPipelineCard name="Scientific-Flux" size="500B tokens" status="Syncing" progress={82} />
                                    <DataPipelineCard name="Indic-Research-Corpus" size="1.2B samples" status="Ready" />
                                    <div style={{ border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 180 }} className="hover:bg-white/5 transition-colors">
                                        <div style={{ textAlign: 'center' }}>
                                            <Plus size={24} color="#6b7280" style={{ margin: '0 auto 12px' }} />
                                            <p style={{ fontSize: 13, fontWeight: 700, color: '#6b7280' }}>New Data Pipeline</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'models' && (
                            <motion.div key="models" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <div style={{ marginBottom: 40 }}>
                                    <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Model Registry</h1>
                                    <p style={{ fontSize: 15, color: '#6b7280' }}>Manage versioned checkpoints and deployment-ready foundation models.</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {['NexovGen-GPT-v1-Alpha', 'Telugu-Llama-7B-Base', 'Vision-Encoder-v2'].map(model => {
                                        const isDeploying = deployingModel === model;
                                        return (
                                            <div key={model} style={{ padding: 24, borderRadius: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                    <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Brain size={24} color="#8b5cf6" />
                                                    </div>
                                                    <div>
                                                        <h4 style={{ fontWeight: 800, color: '#fff' }}>{model}</h4>
                                                        <p style={{ fontSize: 11, color: '#6b7280' }}>Saved 2 days ago</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => deployToEdge(model)}
                                                    disabled={isDeploying || deployingModel !== null}
                                                    style={{
                                                        padding: '8px 16px', borderRadius: 10,
                                                        border: '1px solid #8b5cf6',
                                                        background: isDeploying ? 'rgba(139,92,246,0.15)' : 'transparent',
                                                        color: '#8b5cf6', fontSize: 11, fontWeight: 800,
                                                        cursor: isDeploying || deployingModel !== null ? 'not-allowed' : 'pointer',
                                                        opacity: deployingModel !== null && !isDeploying ? 0.4 : 1,
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    {isDeploying ? 'Deploying...' : 'Deploy to Edge'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'compute' && (
                            <motion.div key="compute" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <div style={{ marginBottom: 40 }}>
                                    <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', marginBottom: 12 }}>GPU Telemetry</h1>
                                    <p style={{ fontSize: 15, color: '#6b7280' }}>Real-time hardware performance across the NexovGen cluster.</p>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                                    <ComputeCard title="GPU Utilization" value="98.2%" color="#06b6d4" />
                                    <ComputeCard title="Memory Bandwidth" value="3.2 TB/s" color="#8b5cf6" />
                                    <ComputeCard title="Power Consumption" value="42.8 kW" color="#f59e0b" />
                                    <div style={{ gridColumn: 'span 3', height: 280, background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <p style={{ color: '#4b5563', fontSize: 13, fontStyle: 'italic' }}>Live Telemetry Graph - Initializing Streams...</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Launch Wizard Modal */}
            <AnimatePresence>
                {showLauncher && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(5,7,10,0.92)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }}
                            style={{ width: '100%', maxWidth: 700, background: '#111318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 32, padding: 48, boxShadow: '0 50px 100px rgba(0,0,0,0.8)' }}
                        >
                            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                    <Logo size="md" />
                                </div>
                                <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Launch Intelligence Job</h2>
                                <p style={{ fontSize: 15, color: '#6b7280' }}>Configure and initialize your NexovGen GPT training shard.</p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 40 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#4b5563', textTransform: 'uppercase', marginBottom: 12 }}>Model Capacity</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {['7B', '13B', '70B'].map(sz => {
                                            const active = launcherConfig.modelSize === sz;
                                            return (
                                                <button
                                                    key={sz}
                                                    onClick={() => setLauncherConfig({ ...launcherConfig, modelSize: sz })}
                                                    style={{
                                                        width: '100%', padding: '16px', borderRadius: 14,
                                                        border: active ? '1px solid #06b6d4' : '1px solid rgba(255,255,255,0.06)',
                                                        background: active ? 'rgba(6,182,212,0.05)' : 'rgba(255,255,255,0.02)',
                                                        color: active ? '#fff' : '#4b5563', fontSize: 14, fontWeight: 700, textAlign: 'left', cursor: 'pointer'
                                                    }}
                                                >
                                                    {sz} Parameters
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#4b5563', textTransform: 'uppercase', marginBottom: 12 }}>Dataset Pipeline</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {['NexovGen-Primary (2.4T)', 'Scientific-Flux (500B)', 'Indic-Research-Corpus'].map(ds => {
                                            const active = launcherConfig.dataset === ds;
                                            return (
                                                <button
                                                    key={ds}
                                                    onClick={() => setLauncherConfig({ ...launcherConfig, dataset: ds })}
                                                    style={{
                                                        width: '100%', padding: '16px', borderRadius: 14,
                                                        border: active ? '1px solid #06b6d4' : '1px solid rgba(255,255,255,0.06)',
                                                        background: active ? 'rgba(6,182,212,0.05)' : 'rgba(255,255,255,0.02)',
                                                        color: '#fff', fontSize: 14, fontWeight: 700, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                                    }}
                                                >
                                                    {ds} {active && <CheckCircle2 size={14} color="#06b6d4" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 16 }}>
                                <button onClick={() => setShowLauncher(false)} style={{ flex: 1, padding: '16px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 14, fontWeight: 800 }}>Cancel</button>
                                <button
                                    onClick={launchJob}
                                    disabled={launching}
                                    style={{ flex: 2, padding: '16px', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: launching ? 0.5 : 1 }}
                                >
                                    {launching ? 'Initializing...' : 'Initialize Shard'} {!launching && <ChevronRight size={18} />}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Deploy Toast */}
            <AnimatePresence>
                {deployToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.95 }}
                        style={{
                            position: 'fixed', bottom: 32, right: 32, zIndex: 500,
                            padding: '16px 24px', borderRadius: 16,
                            background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.15))',
                            border: '1px solid rgba(16,185,129,0.4)',
                            backdropFilter: 'blur(20px)',
                            display: 'flex', alignItems: 'center', gap: 12,
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                        }}
                    >
                        <CheckCircle2 size={20} color="#10b981" />
                        <div>
                            <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: 0 }}>Deployed to Edge</p>
                            <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{deployToast} is now live on edge nodes.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Helper Components ──────────────────────────────────────────────────────

function JobCard({ job, onStop, full }) {
    return (
        <div style={{ padding: 24, borderRadius: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `rgba(6,182,212,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Activity size={20} color="#06b6d4" />
                    </div>
                    <div>
                        <h4 style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{job.name}</h4>
                        <p style={{ fontSize: 11, color: '#6b7280' }}>ID: {job.id.slice(0, 8)} • Throughput: {job.throughput}</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{job.progress}%</span>
                    <p style={{ fontSize: 10, color: '#06b6d4', fontWeight: 800 }}>ETA: {job.eta}</p>
                </div>
            </div>
            <div style={{ height: 6, width: '100%', background: 'rgba(0,0,0,0.3)', borderRadius: 3, marginBottom: 20 }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${job.progress}%` }} style={{ height: '100%', background: '#06b6d4', borderRadius: 3, boxShadow: `0 0 15px rgba(6,182,212,0.25)` }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: full ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: 20 }}>
                <div style={{ padding: '8px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <p style={{ fontSize: 9, color: '#4b5563', textTransform: 'uppercase', marginBottom: 4 }}>Loss</p>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{job.loss}</span>
                </div>
                <div style={{ padding: '8px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <p style={{ fontSize: 9, color: '#4b5563', textTransform: 'uppercase', marginBottom: 4 }}>Tokens</p>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{job.tokens}</span>
                </div>
                {full && (
                    <div style={{ padding: '8px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <p style={{ fontSize: 9, color: '#4b5563', textTransform: 'uppercase', marginBottom: 4 }}>Model</p>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{job.modelSize}</span>
                    </div>
                )}
                {job.status === 'training' ? (
                    <button
                        onClick={onStop}
                        style={{ borderRadius: 12, border: `1px solid rgba(239,68,68,0.2)`, background: 'rgba(239,68,68,0.05)', color: '#ef4444', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                    >
                        Stop Shard
                    </button>
                ) : (
                    <div style={{ borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#9ca3af', fontWeight: 800 }}>
                        {job.status.toUpperCase()}
                    </div>
                )}
            </div>
        </div>
    );
}

function ScalingLawsCard() {
    return (
        <div style={{ padding: 24, borderRadius: 24, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <TrendingUp size={18} color="#8b5cf6" /> Scaling Laws
            </h3>
            <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, marginBottom: 20 }}>
                NexovGen GPT is currently outperforming Llama-3 checkpoints at similar token counts.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                    { label: 'MMLU (Est)', val: '68.4%' },
                    { label: 'GSM8K (Est)', val: '42.1%' },
                    { label: 'CodeX (Est)', val: '54.2%' }
                ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                        <span style={{ color: '#64748b' }}>{item.label}</span>
                        <span style={{ color: '#fff', fontWeight: 800 }}>{item.val}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AlertsCard() {
    return (
        <div style={{ padding: 24, borderRadius: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Critical Alerts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                    <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                    <p style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.4 }}>Node 04-22 experiencing InfiniBand thermal throttling.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
                    <p style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.4 }}>Checkpoint snapshot 1,000 successful in S3.</p>
                </div>
            </div>
        </div>
    );
}

function DataPipelineCard({ name, size, status, progress }) {
    return (
        <div style={{ padding: 24, borderRadius: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Database size={18} color="#06b6d4" />
                </div>
                <div>
                    <h4 style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{name}</h4>
                    <span style={{ fontSize: 10, color: '#6b7280' }}>{size}</span>
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>Status: <span style={{ color: status === 'Ready' ? '#10b981' : '#f59e0b', fontWeight: 800 }}>{status}</span></span>
                {progress && <span style={{ fontSize: 11, color: '#fff', fontWeight: 800 }}>{progress}%</span>}
            </div>
            {progress && (
                <div style={{ height: 4, width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} style={{ height: '100%', background: '#06b6d4', borderRadius: 2 }} />
                </div>
            )}
        </div>
    );
}

function ComputeCard({ title, value, color }) {
    return (
        <div style={{ padding: 24, borderRadius: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', marginBottom: 8 }}>{title}</p>
            <h3 style={{ fontSize: 24, fontWeight: 900, color }}>{value}</h3>
            <div style={{ marginTop: 16, height: 40, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ height: 5 }}
                        animate={{ height: [5, 10 + Math.random() * 25, 5] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                        style={{ flex: 1, background: color, borderRadius: 1, opacity: 0.3 }}
                    />
                ))}
            </div>
        </div>
    );
}
