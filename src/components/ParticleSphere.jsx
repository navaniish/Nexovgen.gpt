import React, { useEffect, useRef } from 'react';

/**
 * ParticleSphere — an animated spiky particle sphere canvas similar to the
 * "sea urchin" / neural orb effect. Responds to mode + amplitude props.
 *
 * Props:
 *   mode      : 'idle' | 'listening' | 'thinking' | 'speaking'
 *   amplitude : 0..1 — drives spike length during speaking
 *   color     : base accent color (hex string, default cyan)
 *   size      : canvas size in px (default 380)
 */
export default function ParticleSphere({
    mode = 'idle',
    amplitude = 0,
    color = '#22d3ee',
    size = 380,
}) {
    const canvasRef = useRef(null);
    const stateRef = useRef({ mode, amplitude, color });

    // Keep ref in sync — avoids re-running the heavy animation loop
    useEffect(() => {
        stateRef.current = { mode, amplitude, color };
    }, [mode, amplitude, color]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const DPR = Math.min(window.devicePixelRatio || 1, 2);
        const S = size;
        canvas.width = S * DPR;
        canvas.height = S * DPR;
        canvas.style.width = `${S}px`;
        canvas.style.height = `${S}px`;
        ctx.scale(DPR, DPR);

        const CX = S / 2, CY = S / 2;
        const BASE_R = S * 0.22;

        /* ── Generate spike directions evenly spread over a sphere ── */
        const N_SPIKES = 480;
        const spikes = Array.from({ length: N_SPIKES }, (_, i) => {
            // Fibonacci sphere distribution
            const golden = Math.PI * (3 - Math.sqrt(5));
            const y = 1 - (i / (N_SPIKES - 1)) * 2;
            const r = Math.sqrt(1 - y * y);
            const theta = golden * i;
            return {
                nx: r * Math.cos(theta),  // unit normal
                ny: y,
                nz: r * Math.sin(theta),
                len: 0.5 + Math.random() * 0.5, // base length multiplier
                phase: Math.random() * Math.PI * 2,
                speed: 0.5 + Math.random() * 1.5,
                bright: 0.4 + Math.random() * 0.6,
            };
        });

        /* ── Inner glow particles ── */
        const INNER = Array.from({ length: 80 }, () => ({
            angle: Math.random() * Math.PI * 2,
            dist: 0.3 + Math.random() * 0.65,
            phase: Math.random() * Math.PI * 2,
            speed: 0.3 + Math.random() * 0.7,
            size: 0.8 + Math.random() * 2,
        }));

        let t = 0;
        let raf;

        const hexToRgb = (hex) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return { r, g, b };
        };

        const render = () => {
            const { mode: m, amplitude: amp, color: col } = stateRef.current;
            const rgb = hexToRgb(col.length === 7 ? col : '#22d3ee');
            const { r: cr, g: cg, b: cb } = rgb;

            ctx.clearRect(0, 0, S, S);

            /* ── Glow modes ── */
            const modeScale = m === 'speaking'
                ? 1 + amp * 0.55
                : m === 'listening'
                    ? 1.08 + Math.sin(t * 3) * 0.04
                    : m === 'thinking'
                        ? 1.0 + Math.sin(t * 8) * 0.03
                        : 1.0;

            /* ── Soft center glow (no hard circle) ── */
            const glowR = BASE_R * (modeScale + 1.2);
            const glowBright = m === 'speaking' ? 0.18 + amplitude * 0.18 : m === 'listening' ? 0.14 : 0.09;
            const coreGrad = ctx.createRadialGradient(CX, CY, 0, CX, CY, glowR);
            coreGrad.addColorStop(0, `rgba(${cr},${cg},${cb},${glowBright})`);
            coreGrad.addColorStop(0.35, `rgba(${cr},${cg},${cb},${(glowBright * 0.4).toFixed(3)})`);
            coreGrad.addColorStop(0.7, `rgba(${cr},${cg},${cb},${(glowBright * 0.08).toFixed(3)})`);
            coreGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = coreGrad;
            ctx.fillRect(0, 0, S, S);

            /* ── Spikes from center ── */
            const ROT_X = t * (m === 'thinking' ? 0.6 : 0.3);
            const ROT_Y = t * (m === 'listening' ? 0.8 : 0.4);
            const sinRX = Math.sin(ROT_X), cosRX = Math.cos(ROT_X);
            const sinRY = Math.sin(ROT_Y), cosRY = Math.cos(ROT_Y);

            spikes.forEach(sp => {
                let nx = sp.nx, ny = sp.ny, nz = sp.nz;
                let tmpX = nx * cosRY + nz * sinRY;
                let tmpZ = -nx * sinRY + nz * cosRY;
                nx = tmpX; nz = tmpZ;
                let tmpY = ny * cosRX - nz * sinRX;
                tmpZ = ny * sinRX + nz * cosRX;
                ny = tmpY; nz = tmpZ;

                const depth = (nz + 1) / 2;
                if (nz < -0.1) return;

                const pulse = Math.sin(t * sp.speed * 2 + sp.phase);
                let spikeLen;
                if (m === 'speaking') {
                    spikeLen = sp.len * (BASE_R * 0.7 + amplitude * BASE_R * 0.9 + pulse * BASE_R * 0.15);
                } else if (m === 'listening') {
                    spikeLen = sp.len * (BASE_R * 0.5 + pulse * BASE_R * 0.2);
                } else if (m === 'thinking') {
                    spikeLen = sp.len * (BASE_R * 0.45 + pulse * BASE_R * 0.18);
                } else {
                    spikeLen = sp.len * (BASE_R * 0.35 + pulse * BASE_R * 0.1);
                }

                // Spike starts at CENTER, tip points outward
                const tx = CX + nx * spikeLen;
                const ty = CY + ny * spikeLen;

                const alpha = depth * sp.bright * (m === 'idle' ? 0.45 : 0.9);
                const grad = ctx.createLinearGradient(CX, CY, tx, ty);
                grad.addColorStop(0, `rgba(${cr},${cg},${cb},0)`);
                grad.addColorStop(0.5, `rgba(${cr},${cg},${cb},${alpha * 0.55})`);
                grad.addColorStop(1, `rgba(255,255,255,${alpha * 0.9})`);

                ctx.strokeStyle = grad;
                ctx.lineWidth = depth * 1.1;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(CX, CY);
                ctx.lineTo(tx, ty);
                ctx.stroke();

                // Bright tip dot
                if (depth > 0.55 && spikeLen > BASE_R * 0.3) {
                    ctx.shadowBlur = 5;
                    ctx.shadowColor = `rgba(${cr},${cg},${cb},0.8)`;
                    ctx.fillStyle = `rgba(255,255,255,${alpha * 0.6})`;
                    ctx.beginPath();
                    ctx.arc(tx, ty, depth * 0.9, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            });

            /* ── Inner floating particles ── */
            INNER.forEach(p => {
                p.angle += p.speed * 0.01;
                const pAngle = p.angle + t * 0.3;
                const pDist = p.dist * BASE_R * modeScale * (0.9 + Math.sin(t * 0.5 + p.phase) * 0.1);
                const px = CX + Math.cos(pAngle) * pDist;
                const py = CY + Math.sin(pAngle) * pDist;
                const palpha = (0.3 + Math.sin(t * 2 + p.phase) * 0.2) * (m === 'idle' ? 0.35 : 0.75);
                ctx.shadowBlur = 6;
                ctx.shadowColor = `rgba(${cr},${cg},${cb},${palpha})`;
                ctx.fillStyle = `rgba(${cr},${cg},${cb},${palpha})`;
                ctx.beginPath();
                ctx.arc(px, py, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            /* ── Center bright core dot ── */
            const coreDot = ctx.createRadialGradient(CX, CY, 0, CX, CY, BASE_R * 0.18);
            const cdBright = m === 'speaking' ? 0.9 + amplitude * 0.1 : m === 'listening' ? 0.7 : 0.5;
            coreDot.addColorStop(0, `rgba(255,255,255,${cdBright})`);
            coreDot.addColorStop(0.4, `rgba(${cr},${cg},${cb},${cdBright * 0.6})`);
            coreDot.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = coreDot;
            ctx.beginPath();
            ctx.arc(CX, CY, BASE_R * 0.18, 0, Math.PI * 2);
            ctx.fill();

            t += 1 / 60;
            raf = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(raf);
    }, [size]);

    return (
        <canvas
            ref={canvasRef}
            style={{ display: 'block' }}
        />
    );
}
