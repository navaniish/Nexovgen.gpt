/**
 * AppearanceContext.jsx
 * Provides a global appearance state to all components.
 * Settings changes update both the React tree AND CSS custom properties.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { applyAppearance, watchSystemTheme } from './appearance';

const DEFAULT_SETTINGS = {
    theme: 'dark',
    accentColor: '#4F8EF7',
    fontSize: 'medium',
    reducedMotion: false,
};

function loadSettings() {
    try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('nxv_settings') || '{}') }; }
    catch { return DEFAULT_SETTINGS; }
}

const AppearanceContext = createContext({
    appearance: DEFAULT_SETTINGS,
    setAppearance: () => { },
});

export function AppearanceProvider({ children }) {
    const [appearance, setAppearanceState] = useState(loadSettings);

    // Apply on first mount
    useEffect(() => {
        applyAppearance(appearance);
        const cleanup = watchSystemTheme();
        return cleanup;
    }, []);

    const setAppearance = useCallback((updates) => {
        setAppearanceState(prev => {
            const next = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };
            localStorage.setItem('nxv_settings', JSON.stringify(next));
            applyAppearance(next);
            return next;
        });
    }, []);

    // Listen for changes from Settings panel (same tab or other instances)
    useEffect(() => {
        const handler = (e) => setAppearanceState(e.detail);
        window.addEventListener('nxv:appearance-changed', handler);
        return () => window.removeEventListener('nxv:appearance-changed', handler);
    }, []);

    return (
        <AppearanceContext.Provider value={{ appearance, setAppearance }}>
            {children}
        </AppearanceContext.Provider>
    );
}

export function useAppearance() {
    return useContext(AppearanceContext);
}
