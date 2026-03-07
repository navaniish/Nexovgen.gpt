import { useEffect, useRef } from 'react';

/**
 * NeuralCanvas — full-screen animated deep-space neural network background.
 * Renders a canvas with: radial gradient bg, animated grid, data streams,
 * glowing particles with connections, and a vignette.
 * Intended to be placed as a fixed/absolute full-screen layer behind all UI.
 */
export default function NeuralCanvas({ style = {} }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let raf;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // ── Particles ──
        const PARTICLE_COUNT = 130;
        const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.8 + 0.3,
            vx: (Math.random() - 0.5) * 0.22,
            vy: (Math.random() - 0.5) * 0.22,
            alpha: Math.random() * 0.55 + 0.15,
            hue: Math.random() < 0.65 ? 220 : 275,
        }));

        // ── Data streams converging to center ──
        const STREAM_COUNT = 30;
        const streams = Array.from({ length: STREAM_COUNT }, (_, i) => ({
            angle: (i / STREAM_COUNT) * Math.PI * 2,
            length: Math.random() * 0.38 + 0.22,
            speed: Math.random() * 0.0013 + 0.0005,
            offset: Math.random(),
            width: Math.random() * 1.6 + 0.3,
            hue: Math.random() < 0.65 ? 217 : 275,
        }));

        const GRID_SPACING = 72;
        let t = 0;

        const draw = () => {
            const W = canvas.width, H = canvas.height;
            const cx = W / 2, cy = H / 2;
            ctx.clearRect(0, 0, W, H);

            // Background gradient
            const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(cx, cy));
            bg.addColorStop(0, 'rgba(8,14,30,1)');
            bg.addColorStop(0.55, 'rgba(5,8,18,1)');
            bg.addColorStop(1, 'rgba(2,3,8,1)');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, W, H);

            // Animated grid
            ctx.strokeStyle = 'rgba(59,130,246,0.035)';
            ctx.lineWidth = 0.5;
            const shift = (t * 11) % GRID_SPACING;
            for (let x = -GRID_SPACING + shift; x < W + GRID_SPACING; x += GRID_SPACING) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
            }
            for (let y = -GRID_SPACING + shift; y < H + GRID_SPACING; y += GRID_SPACING) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
            }

            // Center radial glow
            const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 280);
            cg.addColorStop(0, 'rgba(59,130,246,0.11)');
            cg.addColorStop(0.5, 'rgba(139,92,246,0.045)');
            cg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = cg;
            ctx.beginPath(); ctx.arc(cx, cy, 280, 0, Math.PI * 2); ctx.fill();

            // Data streams
            streams.forEach(s => {
                const phase = (t * s.speed + s.offset) % 1;
                const maxDist = Math.hypot(cx, cy) * s.length;
                const headFrac = 1 - phase;
                const tailFrac = Math.min(1, headFrac + 0.18);
                const hx = cx + Math.cos(s.angle) * maxDist * headFrac;
                const hy = cy + Math.sin(s.angle) * maxDist * headFrac;
                const tx = cx + Math.cos(s.angle) * maxDist * tailFrac;
                const ty = cy + Math.sin(s.angle) * maxDist * tailFrac;
                const lg = ctx.createLinearGradient(tx, ty, hx, hy);
                lg.addColorStop(0, `hsla(${s.hue},85%,65%,0)`);
                lg.addColorStop(1, `hsla(${s.hue},85%,72%,${0.5 * (1 - headFrac * 0.8)})`);
                ctx.strokeStyle = lg;
                ctx.lineWidth = s.width;
                ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
            });

            // Particles + connections
            particles.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
                if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue},80%,70%,${p.alpha})`;
                ctx.fill();
            });
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < 88) {
                        ctx.strokeStyle = `rgba(79,142,247,${0.1 * (1 - d / 88)})`;
                        ctx.lineWidth = 0.4;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            // Vignette
            const vig = ctx.createRadialGradient(cx, cy, H * 0.28, cx, cy, H * 0.9);
            vig.addColorStop(0, 'rgba(0,0,0,0)');
            vig.addColorStop(1, 'rgba(0,0,0,0.7)');
            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, W, H);

            t += 1 / 60;
            raf = requestAnimationFrame(draw);
        };

        draw();
        return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                inset: 0,
                width: '100%',
                height: '100%',
                display: 'block',
                zIndex: 0,
                pointerEvents: 'none',
                ...style,
            }}
        />
    );
}
