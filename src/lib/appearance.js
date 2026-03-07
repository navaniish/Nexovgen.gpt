/**
 * appearance.js
 * Applies appearance settings from localStorage to CSS custom properties
 * on `document.documentElement`. Called on mount and on every change.
 */

const FONT_SIZE_MAP = { small: '13px', medium: '15px', large: '17px' };

/**
 * THEME PALETTES
 * Each theme defines CSS variable values that are applied globally.
 */
const THEMES = {
    dark: {
        '--bg-base': '#080c18',
        '--bg-surface': '#0d1020',
        '--bg-card': '#111520',
        '--bg-input': 'rgba(255,255,255,0.04)',
        '--bg-sidebar': 'rgba(8,12,22,0.82)',
        '--border-color': 'rgba(255,255,255,0.08)',
        '--text-primary': '#F1F5F9',
        '--text-secondary': '#64748B',
        '--text-muted': '#374151',
        '--shadow-color': 'rgba(0,0,0,0.5)',
    },
    light: {
        '--bg-base': '#F0F4FF',
        '--bg-surface': '#FAFBFF',
        '--bg-card': '#FFFFFF',
        '--bg-input': 'rgba(0,0,0,0.04)',
        '--bg-sidebar': 'rgba(240,244,255,0.92)',
        '--border-color': 'rgba(0,0,0,0.1)',
        '--text-primary': '#0F172A',
        '--text-secondary': '#475569',
        '--text-muted': '#94A3B8',
        '--shadow-color': 'rgba(0,0,0,0.12)',
    },
    system: null, // resolved at runtime below
};

function resolveTheme(theme) {
    if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return THEMES[prefersDark ? 'dark' : 'light'];
    }
    return THEMES[theme] || THEMES.dark;
}

export function applyAppearance(settings = {}) {
    const root = document.documentElement;

    // ── Load stored settings if none passed ──
    let s = settings;
    if (!s || Object.keys(s).length === 0) {
        try { s = JSON.parse(localStorage.getItem('nxv_settings') || '{}'); }
        catch { s = {}; }
    }

    const theme = s.theme || 'dark';
    const accent = s.accentColor || '#4F8EF7';
    const fontSize = s.fontSize || 'medium';
    const reduced = s.reducedMotion ?? false;

    // ── Apply theme tokens ──
    const palette = resolveTheme(theme);
    Object.entries(palette).forEach(([k, v]) => root.style.setProperty(k, v));

    // ── Accent color + derived shades ──
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-dim', accent + '25');
    root.style.setProperty('--accent-border', accent + '40');
    root.style.setProperty('--accent-glow', accent + '50');

    // ── Font size ──
    root.style.setProperty('--font-size-base', FONT_SIZE_MAP[fontSize] || '15px');

    // ── Reduced motion ──
    root.style.setProperty('--transition-speed', reduced ? '0ms' : '200ms');
    root.style.setProperty('--animation-play', reduced ? 'paused' : 'running');
    if (reduced) {
        root.style.setProperty('--motion-scale', '1');
    } else {
        root.style.removeProperty('--motion-scale');
    }

    // ── data-theme attribute for CSS selectors ──
    root.setAttribute('data-theme', theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme
    );

    // Dispatch event so other components can react
    window.dispatchEvent(new CustomEvent('nxv:appearance-changed', { detail: s }));
}

/** Called to pick up system preference changes at runtime */
export function watchSystemTheme() {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
        const s = JSON.parse(localStorage.getItem('nxv_settings') || '{}');
        if (s.theme === 'system') applyAppearance(s);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
}
