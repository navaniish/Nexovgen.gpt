import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import {
    Zap, Brain, GitBranch, Send, Play, Settings, Plus,
    MousePointer2, Move, Layers, Database, Mail, Bell,
    ChevronRight, ChevronDown, Trash2, Save, X
} from 'lucide-react';

// --- Default Blueprint Data ---
const INITIAL_NODES = [
    { id: 'node_1', type: 'trigger', x: 100, y: 300, label: 'Inbound Lead', status: 'idle', data: { source: 'Website' } },
    { id: 'node_2', type: 'ai', x: 400, y: 300, label: 'Nexovgen AI Core', status: 'idle', data: { model: 'gpt-4o', task: 'scoring' } },
    { id: 'node_3', type: 'condition', x: 700, y: 300, label: 'Lead Tier?', status: 'idle', data: { property: 'tier' } },
    { id: 'node_4', type: 'action', x: 1000, y: 150, label: 'Hot Sequence', status: 'idle', data: { action: 'email', template: 'sales_hot' } },
    { id: 'node_5', type: 'action', x: 1000, y: 300, label: 'Nurture Campaign', status: 'idle', data: { action: 'drip', template: 'marketing_warm' } },
    { id: 'node_6', type: 'action', x: 1000, y: 450, label: 'Add to CRM', status: 'idle', data: { action: 'sync', target: 'Salesforce' } },
];

const INITIAL_EDGES = [
    { id: 'e1-2', from: 'node_1', to: 'node_2' },
    { id: 'e2-3', from: 'node_2', to: 'node_3' },
    { id: 'e3-4', from: 'node_3', to: 'node_4', label: 'HOT' },
    { id: 'e3-5', from: 'node_3', to: 'node_5', label: 'WARM' },
    { id: 'e3-6', from: 'node_3', to: 'node_6', label: 'COLD' },
];

const NODE_TYPES = {
    trigger: { color: '#10b981', icon: Zap, bg: 'rgba(16,185,129,0.1)' },
    ai: { color: '#8b5cf6', icon: Brain, bg: 'rgba(139,92,246,0.1)' },
    condition: { color: '#f59e0b', icon: GitBranch, bg: 'rgba(245,158,11,0.1)' },
    action: { color: '#3b82f6', icon: Send, bg: 'rgba(59,130,246,0.1)' },
};

// --- Sub-component: Animated Connection ---
function Connection({ id, fromNode, toNode, label, onDelete }) {
    if (!fromNode || !toNode) return null;

    // Start coordinates (right center of fromNode)
    const x1 = fromNode.x + 180;
    const y1 = fromNode.y + 35;
    // End coordinates (left center of toNode)
    const x2 = toNode.x;
    const y2 = toNode.y + 35;

    // Bezier curve handle points
    const cp1x = x1 + (x2 - x1) * 0.5;
    const cp2x = x1 + (x2 - x1) * 0.5;

    const path = `M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`;

    return (
        <g>
            {/* Background Path (Glow) */}
            <path
                d={path}
                fill="none"
                stroke="rgba(79, 142, 247, 0.15)"
                strokeWidth="4"
                strokeLinecap="round"
            />
            {/* Main Path */}
            <path
                d={path}
                fill="none"
                stroke="rgba(79, 142, 247, 0.4)"
                strokeWidth="1.5"
                strokeDasharray="5,5"
            >
                <animate
                    attributeName="stroke-dashoffset"
                    from="100"
                    to="0"
                    dur="3s"
                    repeatCount="indefinite"
                />
            </path>
            {/* Edge Label or Delete Button */}
            {(label || onDelete) && (
                <foreignObject x={(x1 + x2) / 2 - 25} y={(y1 + y2) / 2 - 12} width="50" height="24">
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4
                    }}>
                        {label && (
                            <div style={{
                                background: 'rgba(15, 23, 42, 0.8)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 4,
                                fontSize: 9,
                                fontWeight: 800,
                                color: '#94a3b8',
                                padding: '0 6px',
                                height: 18,
                                lineHeight: '18px',
                                backdropFilter: 'blur(4px)',
                                textTransform: 'uppercase'
                            }}>
                                {label}
                            </div>
                        )}
                        {onDelete && (
                            <motion.button
                                whileHover={{ scale: 1.1, background: '#ef4444', color: '#fff' }}
                                onClick={(e) => { e.stopPropagation(); onDelete(id); }}
                                style={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: '50%',
                                    background: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#64748b',
                                    fontSize: 10,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    padding: 0
                                }}
                            >
                                <X size={10} />
                            </motion.button>
                        )}
                    </div>
                </foreignObject>
            )}
        </g>
    );
}

// --- Sub-component: Workflow Node ---
function WorkflowNode({ node, onDrag, isSelected, onClick, onConnectStart, onConnectEnd, isConnecting }) {
    const type = NODE_TYPES[node.type] || NODE_TYPES.action;
    const Icon = type.icon;

    return (
        <motion.div
            drag
            dragMomentum={false}
            onDrag={(e, info) => onDrag(node.id, node.x + info.delta.x, node.y + info.delta.y)}
            onClick={(e) => { e.stopPropagation(); onClick(node); }}
            style={{
                position: 'absolute',
                left: node.x,
                top: node.y,
                width: 180,
                zIndex: isSelected ? 100 : 1,
                cursor: 'grab'
            }}
            whileHover={{ scale: 1.02 }}
            whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
        >
            <div style={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: `1px solid ${node.status === 'processing' ? '#4F8EF7' : (isSelected ? type.color : 'rgba(255,255,255,0.08)')}`,
                borderRadius: 12,
                boxShadow: node.status === 'processing'
                    ? `0 0 30px #4F8EF755, 0 0 10px #4F8EF788`
                    : (isSelected ? `0 0 20px ${type.color}44` : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'),
                overflow: 'hidden',
                backdropFilter: 'blur(10px)',
                position: 'relative'
            }}>
                {node.status === 'processing' && (
                    <motion.div
                        layoutId="node-glow"
                        style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: 12,
                            border: '2px solid #4F8EF7',
                            zIndex: -1
                        }}
                        animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.02, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                )}
                <div style={{
                    padding: '10px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: type.bg
                }}>
                    <div style={{
                        width: 24, height: 24, borderRadius: 6,
                        background: 'rgba(0,0,0,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Icon style={{ width: 14, height: 14, color: type.color }} />
                    </div>
                    <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{node.label}</p>
                        <p style={{ fontSize: 9, color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{node.type}</p>
                    </div>
                </div>
                <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                        <div style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: node.status === 'success' ? '#10b981' : (node.status === 'error' ? '#ef4444' : type.color),
                            opacity: node.status === 'idle' ? 0.5 : 1,
                            boxShadow: node.status !== 'idle' ? `0 0 8px ${node.status === 'success' ? '#10b981' : '#ef4444'}` : 'none'
                        }} />
                        <div style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: node.status === 'processing' ? '#4F8EF7' : type.color,
                            opacity: node.status === 'processing' ? 1 : 0.2
                        }} />
                    </div>
                    <ChevronRight style={{ width: 12, height: 12, color: '#475569' }} />
                </div>

                {/* --- Input Port (Left) --- */}
                <motion.div
                    whileHover={{ scale: 1.5, background: '#4F8EF7' }}
                    onMouseUp={() => onConnectEnd(node.id, 'in')}
                    style={{
                        position: 'absolute',
                        left: -6,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: 'rgba(79, 142, 247, 0.4)',
                        border: '2px solid #0f172a',
                        zIndex: 10,
                        cursor: 'crosshair'
                    }}
                />

                {/* --- Output Port (Right) --- */}
                <motion.div
                    whileHover={{ scale: 1.5, background: '#4F8EF7' }}
                    onMouseDown={(e) => { e.stopPropagation(); onConnectStart(node.id, 'out'); }}
                    style={{
                        position: 'absolute',
                        right: -6,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: 'rgba(79, 142, 247, 0.4)',
                        border: '2px solid #0f172a',
                        zIndex: 10,
                        cursor: 'crosshair'
                    }}
                />
            </div>
        </motion.div>
    );
}

// --- Main BlueprintCanvas Component ---
export default function BlueprintCanvas() {
    const [nodes, setNodes] = useState(INITIAL_NODES);
    const [edges, setEdges] = useState(INITIAL_EDGES);
    const [selectedNode, setSelectedNode] = useState(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionLogs, setExecutionLogs] = useState([]);
    const [toolMode, setToolMode] = useState('select'); // 'select', 'move', 'add'
    const [viewbox, setViewbox] = useState({ x: 0, y: 0, zoom: 1 });
    const [connecting, setConnecting] = useState(null); // { fromId, x, y }
    const canvasRef = useRef(null);

    const handleConnectStart = (nodeId, portType) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;
        setConnecting({ fromId: nodeId, x: node.x + 180, y: node.y + 35 });
    };

    const handleConnectEnd = (nodeId, portType) => {
        if (!connecting || connecting.fromId === nodeId) {
            setConnecting(null);
            return;
        }

        // Create new edge
        const newEdge = {
            id: `e_${connecting.fromId}_${nodeId}`,
            from: connecting.fromId,
            to: nodeId
        };

        // Avoid duplicates or self-loops
        setEdges(prev => {
            if (prev.find(e => e.from === newEdge.from && e.to === newEdge.to)) return prev;
            return [...prev, newEdge];
        });

        setConnecting(null);
    };

    const handleCanvasMouseMove = (e) => {
        if (!connecting) return;
        const rect = canvasRef.current.getBoundingClientRect();
        setConnecting(prev => ({
            ...prev,
            mouseX: e.clientX - rect.left,
            mouseY: e.clientY - rect.top
        }));
    };

    const handleCanvasMouseUp = () => {
        if (connecting) setConnecting(null);
    };

    const updateNodePos = (id, x, y) => {
        setNodes(nds => nds.map(n => n.id === id ? { ...n, x, y } : n));
    };

    const addNode = (type = 'action') => {
        const id = `node_${Date.now()}`;
        const newNode = {
            id,
            type,
            x: 100 + Math.random() * 100,
            y: 100 + Math.random() * 100,
            label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            status: 'idle',
            data: {}
        };
        setNodes([...nodes, newNode]);
        setSelectedNode(newNode);
    };

    const deleteNode = (id) => {
        setNodes(nds => nds.filter(n => n.id !== id));
        setEdges(eds => eds.filter(e => e.from !== id && e.to !== id));
        setSelectedNode(null);
    };

    const deleteEdge = (id) => {
        setEdges(eds => eds.filter(e => e.id !== id));
    };

    const runSimulation = async () => {
        setIsExecuting(true);
        setExecutionLogs([]);
        setNodes(nds => nds.map(n => ({ ...n, status: 'idle' })));

        const delay = (ms) => new Promise(res => setTimeout(res, ms));
        const addLog = (msg, type = 'info') => {
            setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, type }]);
        };

        addLog('🚀 Starting Workflow Execution...', 'start');

        // Start from trigger node
        let currentId = nodes.find(n => n.type === 'trigger')?.id;

        while (currentId) {
            const node = nodes.find(n => n.id === currentId);
            if (!node) break;

            // processing
            setNodes(nds => nds.map(n => n.id === node.id ? { ...n, status: 'processing' } : n));
            addLog(`Executing: ${node.label}...`);
            await delay(1200);

            // success
            setNodes(nds => nds.map(n => n.id === node.id ? { ...n, status: 'success' } : n));
            addLog(`Completed: ${node.label}`, 'success');
            await delay(400);

            // Find next edges
            const outgoingEdges = edges.filter(e => e.from === currentId);
            if (outgoingEdges.length === 0) {
                currentId = null;
            } else if (node.type === 'condition') {
                // Pick a branch based on "AI logic" (random for simulation)
                const branch = outgoingEdges[Math.floor(Math.random() * outgoingEdges.length)];
                addLog(`Condition Branch: ${branch.label || 'Default'}`, 'branch');
                currentId = branch.to;
            } else {
                // Linear flow
                currentId = outgoingEdges[0].to;
            }
        }

        addLog('🏁 Workflow Finished successfully.', 'end');
        setIsExecuting(false);
    };

    return (
        <div
            ref={canvasRef}
            style={{
                width: '100%',
                height: '100%',
                background: '#05070a',
                backgroundImage: 'radial-gradient(rgba(79, 142, 247, 0.05) 1px, transparent 1px)',
                backgroundSize: '30px 30px',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.05)'
            }}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onClick={() => setSelectedNode(null)}
        >
            {/* Connections Layer */}
            <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none', width: '100%', height: '100%' }}>
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orientation="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="rgba(79, 142, 247, 0.4)" />
                    </marker>
                </defs>
                {edges.map(edge => {
                    const fromNode = nodes.find(n => n.id === edge.from);
                    const toNode = nodes.find(n => n.id === edge.to);
                    return <Connection key={edge.id} id={edge.id} fromNode={fromNode} toNode={toNode} label={edge.label} onDelete={deleteEdge} />;
                })}

                {/* Temporary Connection Line */}
                {connecting && (
                    <Connection
                        fromNode={{ x: connecting.x - 180, y: connecting.y - 35 }}
                        toNode={{ x: (connecting.mouseX || connecting.x), y: (connecting.mouseY || connecting.y) - 35 }}
                    />
                )}
            </svg>

            {/* Nodes Layer */}
            {nodes.map(node => (
                <WorkflowNode
                    key={node.id}
                    node={node}
                    onDrag={updateNodePos}
                    isSelected={selectedNode?.id === node.id}
                    onClick={setSelectedNode}
                    onConnectStart={handleConnectStart}
                    onConnectEnd={handleConnectEnd}
                />
            ))}

            {/* Canvas Toolbar */}
            <div style={{
                position: 'absolute',
                bottom: 20,
                left: 20,
                display: 'flex',
                gap: 8,
                background: 'rgba(15, 23, 42, 0.8)',
                padding: '6px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                zIndex: 1000
            }}>
                <div style={{ position: 'relative', display: 'flex' }}>
                    <button
                        title="Add Action Node"
                        onClick={(e) => { e.stopPropagation(); addNode('action'); }}
                        style={{
                            padding: 8, borderRadius: 6, background: 'none', border: 'none',
                            color: '#94a3b8', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        <Plus style={{ width: 16, height: 16 }} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); addNode('ai'); }} title="Add AI Node" style={{ padding: 8, background: 'none', border: 'none', color: '#8b5cf6', cursor: 'pointer' }}><Brain style={{ width: 14, height: 14 }} /></button>
                    <button onClick={(e) => { e.stopPropagation(); addNode('condition'); }} title="Add Condition" style={{ padding: 8, background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer' }}><GitBranch style={{ width: 14, height: 14 }} /></button>
                </div>
                <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', alignSelf: 'center' }} />
                <button
                    title="Move Canvas"
                    onClick={(e) => { e.stopPropagation(); setToolMode('move'); }}
                    style={{
                        padding: 8, borderRadius: 6,
                        background: toolMode === 'move' ? 'rgba(255,255,255,0.1)' : 'none',
                        border: 'none', color: toolMode === 'move' ? '#fff' : '#94a3b8', cursor: 'pointer'
                    }}
                >
                    <Move style={{ width: 16, height: 16 }} />
                </button>
                <button
                    title="Selection Tool"
                    onClick={(e) => { e.stopPropagation(); setToolMode('select'); }}
                    style={{
                        padding: 8, borderRadius: 6,
                        background: toolMode === 'select' ? 'rgba(255,255,255,0.1)' : 'none',
                        border: 'none', color: toolMode === 'select' ? '#fff' : '#94a3b8', cursor: 'pointer'
                    }}
                >
                    <MousePointer2 style={{ width: 16, height: 16 }} />
                </button>
            </div>

            {/* Execution Logs Drawer */}
            <AnimatePresence>
                {executionLogs.length > 0 && (
                    <motion.div
                        initial={{ y: 200 }}
                        animate={{ y: 0 }}
                        exit={{ y: 200 }}
                        style={{
                            position: 'absolute',
                            bottom: 80,
                            left: 20,
                            width: 320,
                            height: 200,
                            background: 'rgba(15, 23, 42, 0.9)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 12,
                            backdropFilter: 'blur(10px)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            zIndex: 1000
                        }}
                    >
                        <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Execution Logs</span>
                            <button onClick={() => setExecutionLogs([])} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X style={{ width: 14, height: 14 }} /></button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {executionLogs.map((log, i) => (
                                <div key={i} style={{ fontSize: 11, color: log.type === 'success' ? '#10b981' : (log.type === 'branch' ? '#f59e0b' : '#cbd5e1') }}>
                                    <span style={{ color: '#475569', marginRight: 6 }}>[{log.time}]</span>
                                    {log.msg}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Run Button */}
            <button
                onClick={(e) => { e.stopPropagation(); runSimulation(); }}
                disabled={isExecuting}
                style={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 20px',
                    borderRadius: 12,
                    background: isExecuting ? 'rgba(16, 185, 129, 0.2)' : 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    color: isExecuting ? '#10b981' : '#fff',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: isExecuting ? 'not-allowed' : 'pointer',
                    boxShadow: isExecuting ? 'none' : '0 4px 15px rgba(16, 185, 129, 0.3)',
                    zIndex: 1000,
                    transition: 'all 0.3s'
                }}>
                {isExecuting ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                        <Zap style={{ width: 16, height: 16 }} />
                    </motion.div>
                ) : (
                    <Play style={{ width: 16, height: 16 }} />
                )}
                {isExecuting ? 'Simulation Running...' : 'Execute Workflow'}
            </button>

            {/* Node Properties Panel (Contextual) */}
            <AnimatePresence>
                {selectedNode && (
                    <motion.div
                        initial={{ x: 300 }}
                        animate={{ x: 0 }}
                        exit={{ x: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: 300,
                            background: 'rgba(15, 23, 42, 0.98)',
                            borderLeft: '1px solid rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(10px)',
                            padding: 24,
                            zIndex: 1100
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 900, color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Node Settings</h3>
                            <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X style={{ width: 18, height: 18 }} /></button>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Label</label>
                            <input
                                type="text"
                                value={nodes.find(n => n.id === selectedNode.id)?.label || ''}
                                onChange={(e) => setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, label: e.target.value } : n))}
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 8,
                                    padding: '10px 12px',
                                    color: '#fff',
                                    fontSize: 13,
                                    outline: 'none'
                                }}
                            />
                        </div>

                        {selectedNode.type === 'ai' && (
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Model Selection</label>
                                <select style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 13 }}>
                                    <option>GPT-4o (Standard)</option>
                                    <option>Claude 3.5 Sonnet</option>
                                    <option>Gemini 1.5 Pro</option>
                                </select>
                            </div>
                        )}

                        <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
                            <button
                                onClick={() => deleteNode(selectedNode.id)}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: 10,
                                    background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                                    color: '#ef4444', fontWeight: 700, cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.2)'}
                                onMouseLeave={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
                            >
                                <Trash2 style={{ width: 16, height: 16, margin: '0 auto' }} />
                            </button>
                            <button
                                onClick={() => setSelectedNode(null)}
                                style={{ flex: 3, padding: '12px', borderRadius: 10, background: '#4F8EF7', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <Save style={{ width: 16, height: 16 }} />
                                Save Changes
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
