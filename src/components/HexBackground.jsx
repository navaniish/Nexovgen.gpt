import React, { useEffect, useRef } from 'react';

/**
 * HexBackground — animated hexagonal grid with:
 *  - Pulsing/glowing hex cells that randomly light up
 *  - Data streams travelling along edges
 *  - Floating particles
 *  - A slow horizontal scanner sweep
 *  - Radial vignette
 */
export default function HexBackground({ style = {} }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let raf;

        /* ── Geometry ── */
        const R = 36;                          // hex circumradius
        const W3 = R * Math.sqrt(3);           // flat-to-flat width
        const ROW_H = R * 1.5;                 // row height

        /* ── Resize ── */
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        /* ── Build hex grid ── */
        const buildGrid = () => {
            const cols = Math.ceil(canvas.width / W3) + 2;
            const rows = Math.ceil(canvas.height / ROW_H) + 2;
            const cells = [];
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const x = col * W3 + (row % 2 === 0 ? 0 : W3 / 2) - W3 / 2;
                    const y = row * ROW_H - R;
                    cells.push({
                        x, y,
                        pulse: Math.random() * Math.PI * 2,          // phase offset
                        pulseSpeed: 0.004 + Math.random() * 0.006,    // individual speed
                        brightness: 0,                                  // current glow 0..1
                        lit: Math.random() < 0.12,                     // is this cell active?
                        litTimer: Math.random() * 300,                 // timer for re-triggering
                        litDuration: 120 + Math.random() * 200,
                        hue: Math.random() < 0.75 ? 210 : 260,        // blue or purple
                    });
                }
            }
            return cells;
        };
        let cells = buildGrid();

        /* ── Data stream particles ── */
        const buildStreams = () =>
            Array.from({ length: 18 }, () => {
                const angle = Math.random() * Math.PI * 2;
                const speed = 0.6 + Math.random() * 1.2;
                const len = 60 + Math.random() * 100;
                return {
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    len,
                    alpha: 0.4 + Math.random() * 0.5,
                    hue: Math.random() < 0.7 ? 210 : 260,
                    width: 0.6 + Math.random() * 1,
                };
            });
        let streams = buildStreams();

        /* ── Floating sparkles ── */
        const buildSparkles = () =>
            Array.from({ length: 55 }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: 0.5 + Math.random() * 1.5,
                alpha: 0.1 + Math.random() * 0.5,
                vx: (Math.random() - 0.5) * 0.15,
                vy: -0.1 - Math.random() * 0.2,
                phase: Math.random() * Math.PI * 2,
                speed: 0.01 + Math.random() * 0.02,
            }));
        let sparkles = buildSparkles();

        /* ── Scanner state ── */
        let scanX = 0;
        const SCAN_SPEED = 0.35;

        /* ── Hex vertex helper ── */
        const hexPath = (cx, cy, r) => {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = (Math.PI / 3) * i - Math.PI / 6;
                const px = cx + r * Math.cos(a);
                const py = cy + r * Math.sin(a);
                i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.closePath();
        };

        let t = 0;

        const render = () => {
            const W = canvas.width, H = canvas.height;

            /* ─── Background ─── */
            ctx.clearRect(0, 0, W, H);
            const bg = ctx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, Math.hypot(W, H) * 0.7);
            bg.addColorStop(0, '#0b0f1f');
            bg.addColorStop(0.6, '#080b18');
            bg.addColorStop(1, '#04060e');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, W, H);

            /* ─── Hex grid ─── */
            ctx.lineWidth = 0.7;
            cells.forEach(c => {
                // Update lit cycle
                c.litTimer++;
                if (c.litTimer > c.litDuration) {
                    c.lit = Math.random() < 0.14;
                    c.litTimer = 0;
                    c.litDuration = 80 + Math.random() * 240;
                }

                // Brightness: base pulse + lit boost
                const basePulse = 0.06 + Math.sin(t * c.pulseSpeed * 60 + c.pulse) * 0.04;
                const litBoost = c.lit
                    ? 0.35 * Math.sin(Math.PI * (c.litTimer / c.litDuration))
                    : 0;
                c.brightness = basePulse + litBoost;

                // Scanner proximity boost
                const dx = Math.abs(c.x - scanX);
                const scanBoost = Math.max(0, 1 - dx / 120) * 0.18;
                const totalAlpha = Math.min(1, c.brightness + scanBoost);

                // Border
                hexPath(c.x, c.y, R - 1);
                ctx.strokeStyle = `hsla(${c.hue}, 70%, 65%, ${totalAlpha})`;
                ctx.stroke();

                // Fill glow on lit cells
                if (c.lit || scanBoost > 0.05) {
                    hexPath(c.x, c.y, R - 1);
                    ctx.fillStyle = `hsla(${c.hue}, 80%, 55%, ${(litBoost + scanBoost) * 0.12})`;
                    ctx.fill();

                    // Bright inner glow
                    if (litBoost > 0.1) {
                        ctx.shadowBlur = 18;
                        ctx.shadowColor = `hsla(${c.hue}, 90%, 70%, 0.6)`;
                        hexPath(c.x, c.y, R * 0.45);
                        ctx.fillStyle = `hsla(${c.hue}, 90%, 70%, ${litBoost * 0.25})`;
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    }
                }
            });

            /* ─── Data streams ─── */
            streams.forEach(s => {
                s.x += s.vx;
                s.y += s.vy;
                // Wrap
                if (s.x < -s.len) s.x = W + s.len;
                if (s.x > W + s.len) s.x = -s.len;
                if (s.y < -s.len) s.y = H + s.len;
                if (s.y > H + s.len) s.y = -s.len;

                const tailX = s.x - s.vx * s.len;
                const tailY = s.y - s.vy * s.len;
                const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
                grad.addColorStop(0, `hsla(${s.hue}, 85%, 65%, 0)`);
                grad.addColorStop(1, `hsla(${s.hue}, 85%, 70%, ${s.alpha})`);
                ctx.strokeStyle = grad;
                ctx.lineWidth = s.width;
                ctx.beginPath();
                ctx.moveTo(tailX, tailY);
                ctx.lineTo(s.x, s.y);
                ctx.stroke();

                // Leading dot
                ctx.shadowBlur = 6;
                ctx.shadowColor = `hsla(${s.hue}, 90%, 75%, 0.8)`;
                ctx.fillStyle = `hsla(${s.hue}, 90%, 80%, ${s.alpha})`;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.width + 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            /* ─── Sparkles ─── */
            sparkles.forEach(sp => {
                sp.y += sp.vy;
                sp.x += sp.vx;
                sp.phase += sp.speed;
                const alpha = sp.alpha * (0.6 + Math.sin(sp.phase) * 0.4);
                // Wrap
                if (sp.y < -10) { sp.y = H + 5; sp.x = Math.random() * W; }
                if (sp.x < -10) sp.x = W + 5;
                if (sp.x > W + 10) sp.x = -5;

                ctx.shadowBlur = 8;
                ctx.shadowColor = `rgba(147,197,253,${alpha})`;
                ctx.fillStyle = `rgba(186,230,253,${alpha})`;
                ctx.beginPath();
                ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            /* ─── Scanner sweep ─── */
            scanX = (scanX + SCAN_SPEED) % (W + 200);
            const scanGrad = ctx.createLinearGradient(scanX - 80, 0, scanX + 80, 0);
            scanGrad.addColorStop(0, 'rgba(79,142,247,0)');
            scanGrad.addColorStop(0.5, 'rgba(79,142,247,0.07)');
            scanGrad.addColorStop(1, 'rgba(79,142,247,0)');
            ctx.fillStyle = scanGrad;
            ctx.fillRect(0, 0, W, H);

            /* ─── Vignette ─── */
            const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 1.0);
            vig.addColorStop(0, 'rgba(0,0,0,0)');
            vig.addColorStop(1, 'rgba(0,0,0,0.72)');
            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, W, H);

            t += 1 / 60;
            raf = requestAnimationFrame(render);
        };

        render();

        const onResize = () => {
            resize();
            cells = buildGrid();
            streams = buildStreams();
            sparkles = buildSparkles();
        };
        window.addEventListener('resize', onResize);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', onResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                inset: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                pointerEvents: 'none',
                display: 'block',
                ...style,
            }}
        />
    );
}
