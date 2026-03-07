/**
 * useWakeWord — continuous background speech recognition that listens for
 * "Hey Nexo" and Indian/Telugu-accent variants.
 *
 * Usage:
 *   const { wakeActive, status, confidence } = useWakeWord({ onWake: () => setShowFaceMode(true) });
 *
 *  wakeActive  – true while background mic is armed (stable, no flicker)
 *  status      – 'idle' | 'listening' | 'error' | 'blocked'
 *  confidence  – last wake-word detection confidence (0–1)
 *  minConfidence – filter out detections below this threshold (default 0.55)
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// ── Wake phrases (Indian English + Telugu slang variations) ─────────────────
const WAKE_PHRASES = [
    // Standard
    'hey nexo', 'hi nexo', 'ok nexo', 'okay nexo', 'yo nexo',
    // Indian accent variants
    'hey naxo', 'hai nexo', 'hai naxo', 'aye nexo', 'aye naxo',
    'hey nekso', 'hey nexio', 'a nexo', 'hey next',
    'hay nexo', 'hey nikso', 'hei nexo',
    // Telugu slang
    'oye nexo', 'ra nexo', 'bro nexo', 'da nexo', 'maccha nexo',
    'mama nexo', 'bava nexo', 'anna nexo', 'tammudu nexo',
    // NexoVGen variants
    'hey nexovgen', 'hi nexovgen', 'ok nexovgen', 'nexo',
    // Casual
    'nexo wake up', 'nexo start', 'start nexo',
    // Regional Scripts (Hindi/Marathi)
    'हे नेक्सो', 'नेक्सो', 'नमस्ते नेक्सो',
    // Telugu
    'హే నెక్సో', 'నెక్సో', 'ఓయ్ నెక్సో', 'నెక్సో స్టార్ట్',
    'మామా నెక్సో', 'బావ నెక్సో',
    // Tamil
    'ஹே நெக்சோ', 'நெக்சோ',
    // Kannada
    'ಹೇ ನೆಕ್ಸೋ', 'ನೆಕ್ಸೋ',
    // Malayalam
    'ഹே నెక్షో', 'నెక్షో',
    // Bengali
    'হে নেক্সো', 'নেক্সో',
    // Gujarati
    'હે નેક્સો',
];

// Fuzzy check — does the transcript contain any wake phrase?
const matchesWakeWord = (text) => {
    const t = text.toLowerCase().trim();
    return WAKE_PHRASES.some(phrase => t.includes(phrase));
};

export function useWakeWord({ onWake, enabled = true, minConfidence = 0.0, lang = null }) {
    // single boolean state — only changes when truly arming/disarming
    const [wakeActive, setWakeActive] = useState(false);
    const [status, setStatus] = useState('idle'); // 'idle' | 'listening' | 'error' | 'blocked'
    const [lastConfidence, setLastConfidence] = useState(null);

    const recognitionRef = useRef(null);
    const restartTimerRef = useRef(null);
    const retryCountRef = useRef(0);
    const frozenRef = useRef(false);      // true for 4 s after wake to avoid re-triggering
    const enabledRef = useRef(enabled);   // track enabled without causing restarts
    const armedRef = useRef(false);       // internal armed state

    // Keep enabledRef in sync
    useEffect(() => { enabledRef.current = enabled; }, [enabled]);

    const stop = useCallback(() => {
        clearTimeout(restartTimerRef.current);
        if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch (_) { }
            recognitionRef.current = null;
        }
        if (armedRef.current) {
            armedRef.current = false;
            setWakeActive(false);
        }
        setStatus('idle');
        retryCountRef.current = 0;
    }, []);

    const start = useCallback(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            console.warn('[useWakeWord] Speech Recognition not supported in this browser.');
            setStatus('blocked');
            return;
        }
        if (recognitionRef.current) return; // already running

        const rec = new SR();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = lang?.code || 'en-US';
        rec.maxAlternatives = 1;

        rec.onstart = () => {
            console.log('[WakeWord] 🎤 Microphone started - Listening for "Hey Nexo"');
            setStatus(prev => prev !== 'listening' ? 'listening' : prev);
            retryCountRef.current = 0;
            // Delay first arm to avoid re-render on page load
            if (!armedRef.current) {
                armedRef.current = true;
                setTimeout(() => setWakeActive(true), 500);
            }
        };

        rec.onresult = (event) => {
            if (frozenRef.current) return;
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const text = result[0].transcript;
                const conf = result[0].confidence;

                console.log(`[WakeWord] Result: "${text}" (conf: ${conf.toFixed(2)})`);

                // Apply confidence filter — Chrome often returns 0 for interim, allow those through
                if (conf > 0 && conf < minConfidence) continue;

                if (matchesWakeWord(text)) {
                    console.log('[WakeWord] 🔥 Wake word detected!');
                    frozenRef.current = true;
                    setLastConfidence(conf > 0 ? conf : null);
                    // Unlock audio context before opening FaceToFace
                    try {
                        const silent = new SpeechSynthesisUtterance('');
                        silent.volume = 0;
                        window.speechSynthesis.speak(silent);
                    } catch (_) { }
                    onWake?.();
                    // Freeze for 4 s so it doesn't re-trigger immediately
                    setTimeout(() => { frozenRef.current = false; }, 4000);
                    break;
                }
            }
        };

        rec.onerror = (e) => {
            if (e.error === 'no-speech' || e.error === 'aborted') return;
            console.warn('[WakeWord] error:', e.error);

            if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
                setStatus('blocked');
                return;
            }

            // For other errors (like audio-capture), try to restart after a delay
            if (enabledRef.current && !frozenRef.current) {
                setStatus('error');
                clearTimeout(restartTimerRef.current);
                restartTimerRef.current = setTimeout(() => {
                    if (enabledRef.current) start();
                }, 2000);
            }
        };

        rec.onend = () => {
            recognitionRef.current = null;
            if (enabledRef.current && !frozenRef.current) {
                // Normal cycle restart
                clearTimeout(restartTimerRef.current);
                restartTimerRef.current = setTimeout(() => {
                    if (enabledRef.current) start();
                }, 600);
            } else if (!enabledRef.current) {
                if (armedRef.current) {
                    armedRef.current = false;
                    setWakeActive(false);
                }
                setStatus('idle');
            }
        };

        recognitionRef.current = rec;
        try {
            rec.start();
        } catch (err) {
            console.warn('[WakeWord] Start failed:', err);
            // If start fails synchronously (e.g. already starting), retry soon
            if (enabledRef.current) {
                clearTimeout(restartTimerRef.current);
                restartTimerRef.current = setTimeout(() => start(), 1000);
            }
        }
    }, [onWake, minConfidence, lang]);

    useEffect(() => {
        if (enabled) {
            start();
        } else {
            stop();
        }
        return () => stop();
    }, [enabled, start, stop]);

    const restart = useCallback(() => {
        retryCountRef.current = 0;
        stop();
        setTimeout(() => start(), 200);
    }, [stop, start]);

    return { wakeActive, status, confidence: lastConfidence, restart };
}
