import React from 'react';

/**
 * Logo — Nexovgen.AI brand logo.
 * Renders the hexagonal neural cube icon + wordmark in various sizes.
 */
const Logo = ({ size = 'md', className = '' }) => {
    const isLg = size === 'lg';
    const isSm = size === 'sm';
    const isXs = size === 'xs';

    const svgSize = isLg ? 64 : isSm ? 36 : isXs ? 26 : 48;
    const textSize = isLg ? '32px' : isSm ? '17px' : isXs ? '13px' : '24px';

    return (
        <div
            className={`flex items-center gap-2 ${className}`}
            style={{ fontFamily: "'Outfit', sans-serif" }}
        >
            <svg
                width={svgSize}
                height={svgSize}
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ flexShrink: 0 }}
            >
                <defs>
                    <filter id="logo-glow" x="-40%" y="-40%" width="180%" height="180%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <filter id="logo-glow-strong" x="-60%" y="-60%" width="220%" height="220%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <radialGradient id="node-blue" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#BAE6FD" />
                        <stop offset="100%" stopColor="#3B82F6" />
                    </radialGradient>
                    <radialGradient id="node-white" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#fff" />
                        <stop offset="100%" stopColor="#BAE6FD" />
                    </radialGradient>
                </defs>
                <circle cx="32" cy="32" r="28" fill="rgba(59,130,246,0.04)" />
                <path d="M32 8 L50 18 L32 28 L14 18 Z" fill="rgba(100,181,246,0.07)" stroke="rgba(147,197,253,0.45)" strokeWidth="0.8" />
                <path d="M14 18 L32 28 L32 48 L14 38 Z" fill="rgba(59,130,246,0.05)" stroke="rgba(96,165,250,0.35)" strokeWidth="0.8" />
                <path d="M50 18 L32 28 L32 48 L50 38 Z" fill="rgba(100,200,255,0.05)" stroke="rgba(125,211,252,0.35)" strokeWidth="0.8" />
                <line x1="14" y1="28" x2="50" y2="28" stroke="rgba(147,197,253,0.2)" strokeWidth="0.5" />
                <line x1="32" y1="8" x2="32" y2="28" stroke="rgba(147,197,253,0.2)" strokeWidth="0.5" />
                <line x1="14" y1="18" x2="32" y2="28" stroke="rgba(147,197,253,0.15)" strokeWidth="0.4" />
                <line x1="50" y1="18" x2="32" y2="28" stroke="rgba(147,197,253,0.15)" strokeWidth="0.4" />
                <circle cx="32" cy="8" r="2.5" fill="url(#node-white)" filter="url(#logo-glow-strong)" />
                <circle cx="50" cy="18" r="2" fill="#FFD580" filter="url(#logo-glow)" opacity="0.9" />
                <circle cx="14" cy="18" r="2" fill="url(#node-blue)" filter="url(#logo-glow)" />
                <circle cx="50" cy="38" r="1.8" fill="url(#node-blue)" filter="url(#logo-glow)" />
                <circle cx="14" cy="38" r="1.8" fill="url(#node-blue)" filter="url(#logo-glow)" />
                <circle cx="32" cy="48" r="2" fill="url(#node-blue)" filter="url(#logo-glow)" />
                <circle cx="32" cy="28" r="1.5" fill="rgba(186,230,253,0.6)" />
                <g filter="url(#logo-glow)">
                    <rect x="28" y="23" width="1" height="10" fill="rgba(147,197,253,0.8)" rx="0.5" />
                    <path d="M29 23.5 Q26 24 26 28.5 Q26 33 29 33.5 L29 23.5Z" fill="rgba(147,197,253,0.5)" />
                    <path d="M29 23.5 Q32 24 32 28.5 Q32 33 29 33.5 L29 23.5Z" fill="rgba(186,230,253,0.5)" />
                </g>
            </svg>

            <div className="flex items-baseline" style={{ gap: '1px' }}>
                <span style={{ fontSize: textSize, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.025em', lineHeight: 1 }}>
                    Nexovgen
                </span>
                <span style={{ fontSize: textSize, fontWeight: 900, color: '#3B82F6', letterSpacing: '-0.015em', lineHeight: 1, marginLeft: '1px' }}>
                    .AI
                </span>
            </div>
        </div>
    );
};

export default Logo;
