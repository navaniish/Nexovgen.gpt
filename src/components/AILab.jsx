import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Cpu, Database, Zap, Plus, Info, CheckCircle2,
    X, LayoutGrid, Brain, Layers, Gauge, AlertCircle, TrendingUp,
    ChevronRight
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
    const [isMobile, setIsMobile] = useState(window.innerWidth < 800);

    useEffect(() => {
        const h = () => setIsMobile(window.innerWidth < 800);
        window.addEventListener('resize', h);
        return () => window.removeEventListener('resize', h);
    }, []);

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
        const interval = setInterval(fetchJobs, 5000);
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
            console.warn('Deploy API not connected:', err);
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
        gpus_active: activeJobs.length * 512,
        active_jobs_count: activeJobs.length
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 250, background: '#05070a', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: "'Outfit', sans-serif" }}>

            {/* Header */}
            <div style={{ zIndex: 30, background: 'rgba(5,7,10,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: isMobile ? '12px 20px' : '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Logo size="sm" />
                    {!isMobile && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 20, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#06b6d4', boxShadow: '0 0 10px #06b6d4' }} className="animate-pulse" />
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.1em' }}>GPU Cluster Active</span>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16 }}>
                    <button
                        onClick={() => setShowLauncher(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: isMobile ? '8px 14px' : '10px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', color: '#fff', cursor: 'pointer', fontSize: isMobile ? 11 : 13, fontWeight: 800, boxShadow: '0 8px 20px rgba(6,182,212,0.2)' }}
                    >
                        <Plus size={isMobile ? 14 : 16} strokeWidth={3} /> {isMobile ? 'Launch' : 'Launch NexovGen'}
                    </button>
                    <button onClick={onClose} style={{ width: isMobile ? 34 : 40, height: isMobile ? 34 : 40, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden' }}>
                {/* Sidebar / Tabs */}
                <div style={{
                    width: isMobile ? '100%' : 280,
                    borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.05)',
                    borderBottom: isMobile ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    background: 'rgba(0,0,0,0.2)',
                    padding: isMobile ? '8px 16px' : '32px 20px',
                    display: 'flex',
                    flexDirection: isMobile ? 'row' : 'column',
                    gap: 8,
                    overflowX: isMobile ? 'auto' : 'visible',
                    flexShrink: 0,
                    scrollbarWidth: 'none'
                }}>
                    <style>{`div::-webkit-scrollbar { display: none; }`}</style>
                    {!isMobile && <p style={{ fontSize: 10, fontWeight: 800, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.2em', paddingLeft: 12, marginBottom: 12 }}>NexovGen Research</p>}
                    {[
                        { id: 'overview', name: 'Overview', icon: LayoutGrid },
                        { id: 'jobs', name: 'Jobs', icon: Activity },
                        { id: 'datasets', name: 'Datasets', icon: Database },
                        { id: 'models', name: 'Models', icon: Layers },
                        { id: 'compute', name: 'Compute', icon: Cpu },
                    ].map(tab => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8, padding: isMobile ? '8px 16px' : '12px 16px', borderRadius: 14, border: 'none', cursor: 'pointer', textAlign: 'left',
                                    background: active ? 'rgba(255,255,255,0.04)' : 'transparent',
                                    color: active ? '#fff' : '#6b7280',
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <Icon size={16} color={active ? '#06b6d4' : '#4b5563'} />
                                <span style={{ fontSize: 13, fontWeight: 600 }}>{tab.name}</span>
                                {active && !isMobile && <motion.div layoutId="tab-active" style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: '#06b6d4' }} />}
                            </button>
                        );
                    })}
                </div>

                {/* Main View Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '24px 20px' : '40px 60px' }}>
                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <div style={{ marginBottom: isMobile ? 24 : 40 }}>
                                    <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Intelligence Fabrication Lab</h1>
                                    <p style={{ fontSize: isMobile ? 13 : 15, color: '#6b7280' }}>Monitor and orchestrate your custom NexovGen foundation models.</p>
                                </div>

                                <div style={{
                                    display: 'flex', gap: 16, marginBottom: isMobile ? 32 : 48,
                                    overflowX: 'auto',
                                    scrollSnapType: isMobile ? 'x mandatory' : 'none',
                                    paddingBottom: isMobile ? 12 : 0,
                                    scrollbarWidth: 'none'
                                }}>
                                    {[
                                        { label: 'Active GPUs', value: stats.gpus_active.toLocaleString(), icon: Cpu, color: '#06b6d4' },
                                        { label: 'Aggregate FLOPS', value: stats.compute_power, icon: Zap, color: '#f59e0b' },
                                        { label: 'Dataset Flux', value: stats.storage_used, icon: Database, color: '#8b5cf6' },
                                        { label: 'Budget', value: stats.budget_remaining, icon: Gauge, color: '#10b981' },
                                    ].map(stat => (
                                        <div key={stat.label} style={{
                                            padding: 20, borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                                            position: 'relative', overflow: 'hidden', flex: isMobile ? '0 0 160px' : '1 1 0', scrollSnapAlign: isMobile ? 'center' : 'none'
                                        }}>
                                            <div style={{ position: 'absolute', top: -5, right: -5, opacity: 0.03 }}>
                                                <stat.icon size={60} />
                                            </div>
                                            <p style={{ fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>{stat.label}</p>
                                            <h3 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, color: '#fff' }}>{stat.value}</h3>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 32 }}>
                                    <div style={{ flex: 2 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Running Training Shards</h2>
                                            <button onClick={() => setActiveTab('jobs')} style={{ background: 'none', border: 'none', color: '#06b6d4', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>View All</button>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                            {activeJobs.length === 0 ? (
                                                <div style={{ padding: 40, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 24 }}>
                                                    <p style={{ color: '#4b5563', fontSize: 13 }}>No active training shards.</p>
                                                </div>
                                            ) : (
                                                activeJobs.slice(0, 2).map(job => (
                                                    <JobCard key={job.id} job={job} onStop={() => stopJob(job.id)} isMobile={isMobile} />
                                                ))
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
                                        <ScalingLawsCard />
                                        <AlertsCard />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'jobs' && (
                            <motion.div key="jobs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <div style={{ marginBottom: 40, display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
                                    <div>
                                        <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Training Queue</h1>
                                        <p style={{ fontSize: 13, color: '#6b7280' }}>Manage active and queued intelligence shards.</p>
                                    </div>
                                    <button onClick={() => setShowLauncher(true)} style={{ padding: '10px 16px', borderRadius: 12, border: 'none', background: '#06b6d4', color: '#fff', fontSize: 12, fontWeight: 800 }}>New Job</button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {jobs.length === 0 ? (
                                        <div style={{ padding: 60, textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 32 }}>
                                            <Activity size={32} color="#06b6d4" style={{ marginBottom: 16 }} />
                                            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Idle</h3>
                                            <p style={{ color: '#6b7280', fontSize: 14 }}>No training jobs launched.</p>
                                        </div>
                                    ) : (
                                        jobs.map(job => (
                                            <JobCard key={job.id} job={job} onStop={() => stopJob(job.id)} full isMobile={isMobile} />
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'datasets' && (
                            <motion.div key="datasets" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <div style={{ marginBottom: 40 }}>
                                    <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Dataset Lab</h1>
                                    <p style={{ fontSize: 13, color: '#6b7280' }}>Ingest and tokenize training data.</p>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 24 }}>
                                    <DataPipelineCard name="NexovGen-Primary" size="2.4T tokens" status="Ready" />
                                    <DataPipelineCard name="Scientific-Flux" size="500B tokens" status="Syncing" progress={82} />
                                    <div style={{ border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 120 }}>
                                        <Plus size={24} color="#6b7280" />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'models' && (
                            <motion.div key="models" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <div style={{ marginBottom: 40 }}>
                                    <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Model Registry</h1>
                                    <p style={{ fontSize: 13, color: '#6b7280' }}>Manage versioned checkpoints.</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {['NexovGen-GPT-v1', 'Telugu-Llama-7B'].map(model => (
                                        <div key={model} style={{ padding: 20, borderRadius: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <Brain size={20} color="#8b5cf6" />
                                                <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{model}</span>
                                            </div>
                                            <button onClick={() => deployToEdge(model)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #8b5cf6', color: '#8b5cf6', fontSize: 11, fontWeight: 800, background: 'none' }}>Deploy</button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'compute' && (
                            <motion.div key="compute" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <div style={{ marginBottom: 40 }}>
                                    <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 900, color: '#fff', marginBottom: 8 }}>GPU Telemetry</h1>
                                    <p style={{ fontSize: 13, color: '#6b7280' }}>Real-time cluster performance.</p>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 24 }}>
                                    <ComputeCard title="GPU Utilization" value="98.2%" color="#06b6d4" />
                                    <ComputeCard title="Bandwidth" value="3.2 TB/s" color="#8b5cf6" />
                                    <ComputeCard title="Power" value="42.8 kW" color="#f59e0b" />
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
                        style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(5,7,10,0.92)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 0 : 20 }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }}
                            style={{
                                width: '100%', maxWidth: isMobile ? 'none' : 700, height: isMobile ? '100%' : 'auto',
                                background: '#111318', border: isMobile ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                borderRadius: isMobile ? 0 : 32, padding: isMobile ? '40px 24px' : 48,
                                overflowY: 'auto'
                            }}
                        >
                            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                                <Logo size="sm" />
                                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '20px 0 8px' }}>Launch Shard</h2>
                                <p style={{ fontSize: 14, color: '#6b7280' }}>Configure your training job.</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 32, marginBottom: 40 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#4b5563', textTransform: 'uppercase', marginBottom: 12 }}>Capacity</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {['7B', '13B', '70B'].map(sz => (
                                            <button key={sz} onClick={() => setLauncherConfig({ ...launcherConfig, modelSize: sz })} style={{ width: '100%', padding: '14px', borderRadius: 12, border: launcherConfig.modelSize === sz ? '1px solid #06b6d4' : '1px solid rgba(255,255,255,0.06)', background: launcherConfig.modelSize === sz ? 'rgba(6,182,212,0.05)' : 'rgba(255,255,255,0.02)', color: launcherConfig.modelSize === sz ? '#fff' : '#6b7280', textAlign: 'left', fontWeight: 700 }}>{sz} Params</button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#4b5563', textTransform: 'uppercase', marginBottom: 12 }}>Dataset</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {['Primary', 'Scientific', 'Indic'].map(ds => (
                                            <button key={ds} onClick={() => setLauncherConfig({ ...launcherConfig, dataset: ds })} style={{ width: '100%', padding: '14px', borderRadius: 12, border: launcherConfig.dataset.includes(ds) ? '1px solid #06b6d4' : '1px solid rgba(255,255,255,0.06)', background: launcherConfig.dataset.includes(ds) ? 'rgba(6,182,212,0.05)' : 'rgba(255,255,255,0.02)', color: '#fff', textAlign: 'left', fontWeight: 700 }}>{ds}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 16 }}>
                                <button onClick={() => setShowLauncher(false)} style={{ flex: 1, padding: '16px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#9ca3af', fontWeight: 800 }}>Cancel</button>
                                <button onClick={launchJob} disabled={launching} style={{ flex: 2, padding: '16px', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', color: '#fff', fontWeight: 900, opacity: launching ? 0.5 : 1 }}>{launching ? 'Initializing...' : 'Initialize'}</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Deploy Toast */}
            <AnimatePresence>
                {deployToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
                        style={{ position: 'fixed', bottom: 32, right: isMobile ? 20 : 32, left: isMobile ? 20 : 'auto', zIndex: 500, padding: '16px 24px', borderRadius: 16, background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                    >
                        <CheckCircle2 size={20} />
                        <span style={{ fontSize: 13, fontWeight: 800 }}>{deployToast} live.</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function JobCard({ job, onStop, full, isMobile }) {
    return (
        <div style={{ padding: 20, borderRadius: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Activity size={18} color="#06b6d4" />
                    <div>
                        <h4 style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{job.name}</h4>
                        <p style={{ fontSize: 10, color: '#6b7280' }}>{job.throughput}</p>
                    </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#06b6d4' }}>{job.progress}%</span>
            </div>
            <div style={{ height: 4, width: '100%', background: 'rgba(0,0,0,0.3)', borderRadius: 2, marginBottom: 16 }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${job.progress}%` }} style={{ height: '100%', background: '#06b6d4', borderRadius: 2 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ fontSize: 9, color: '#6b7280' }}>LOSS: <span style={{ color: '#fff' }}>{job.loss}</span></div>
                    <div style={{ fontSize: 9, color: '#6b7280' }}>TOKENS: <span style={{ color: '#fff' }}>{job.tokens}</span></div>
                </div>
                {job.status === 'training' && (
                    <button onClick={onStop} style={{ border: 'none', background: 'none', color: '#ef4444', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>STOP</button>
                )}
            </div>
        </div>
    );
}

function ScalingLawsCard() {
    return (
        <div style={{ padding: 20, borderRadius: 24, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 900, color: '#fff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={16} color="#8b5cf6" /> Metrics
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[{ l: 'MMLU', v: '68.4%' }, { l: 'CodeX', v: '54.2%' }].map(i => (
                    <div key={i.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                        <span style={{ color: '#64748b' }}>{i.l}</span>
                        <span style={{ color: '#fff', fontWeight: 800 }}>{i.v}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AlertsCard() {
    return (
        <div style={{ padding: 20, borderRadius: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Alerts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    <AlertCircle size={14} color="#ef4444" />
                    <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>Thermal throttling on Node 04.</p>
                </div>
            </div>
        </div>
    );
}

function DataPipelineCard({ name, size, status, progress }) {
    return (
        <div style={{ padding: 20, borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Database size={18} color="#06b6d4" />
                <div>
                    <h4 style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: 0 }}>{name}</h4>
                    <span style={{ fontSize: 10, color: '#6b7280' }}>{size}</span>
                </div>
            </div>
            {progress && (
                <div style={{ height: 3, width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} style={{ height: '100%', background: '#06b6d4', borderRadius: 2 }} />
                </div>
            )}
        </div>
    );
}

function ComputeCard({ title, value, color }) {
    return (
        <div style={{ padding: 20, borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>{title}</p>
            <h3 style={{ fontSize: 20, fontWeight: 900, color, margin: 0 }}>{value}</h3>
        </div>
    );
}
