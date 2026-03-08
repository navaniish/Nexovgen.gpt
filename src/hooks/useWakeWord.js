import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useWakeWord Hook
 * Low-level speech recognition loop for "Hey Nexo" wake word.
 */
export function useWakeWord({ onWake, enabled = true, minConfidence = 0.0, lang = 'en-US' }) {
    const [wakeActive, setWakeActive] = useState(false);
    const [status, setStatus] = useState('idle'); // idle | listening | blocked | error
    const [lastConfidence, setLastConfidence] = useState(null);

    const recognitionRef = useRef(null);
    const retryCountRef = useRef(0);
    const restartTimerRef = useRef(null);
    const isComponentMounted = useRef(true);
    const enabledRef = useRef(enabled);
    const frozenRef = useRef(false);
    const armedRef = useRef(false);

    // Sync refs
    useEffect(() => {
        enabledRef.current = enabled;
        if (enabled) {
            armedRef.current = true;
            setWakeActive(true);
        } else {
            armedRef.current = false;
            setWakeActive(false);
        }
    }, [enabled]);

    useEffect(() => {
        isComponentMounted.current = true;
        return () => { isComponentMounted.current = false; };
    }, []);

    const WAKE_PHRASES = [
        'hey nexo', 'hi nexo', 'okay nexo', 'ok nexo', 'hello nexo',
        'hey nexo ai', 'hi nexo ai'
    ];

    const matchesWakeWord = (text) => {
        const t = text.toLowerCase().trim();
        return WAKE_PHRASES.some(phrase => t.includes(phrase));
    };

    const stop = useCallback(() => {
        clearTimeout(restartTimerRef.current);
        if (recognitionRef.current) {
            try {
                recognitionRef.current.onend = null;
                recognitionRef.current.onerror = null;
                recognitionRef.current.stop();
            } catch (_) { }
            recognitionRef.current = null;
        }
        setStatus('idle');
    }, []);

    const start = useCallback(() => {
        if (!enabledRef.current || !isComponentMounted.current) return;
        if (recognitionRef.current) return;
        // Don't start if another tab/window is using it or if backgrounded
        if (!document.hasFocus()) {
            console.log('[WakeWord] ⏸ Window not focused, skipping start');
            setStatus('idle');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setStatus('blocked');
            return;
        }

        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = lang;

        rec.onstart = () => {
            console.log('[WakeWord] 🎤 Listening for "Hey Nexo"...');
            setStatus('listening');
            retryCountRef.current = 0;
        };

        rec.onresult = (event) => {
            if (frozenRef.current) return;
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const text = result[0].transcript;
                const conf = result[0].confidence;

                console.log(`[WakeWord] Result: "${text}" (conf: ${conf.toFixed(2)})`);

                if (conf > 0 && conf < minConfidence) continue;

                if (matchesWakeWord(text)) {
                    console.log('[WakeWord] 🔥 Wake word detected!');
                    frozenRef.current = true;
                    setLastConfidence(conf > 0 ? conf : null);

                    // Unlock audio
                    try {
                        const silent = new SpeechSynthesisUtterance('');
                        silent.volume = 0;
                        window.speechSynthesis.speak(silent);
                    } catch (_) { }

                    onWake?.();
                    setTimeout(() => { frozenRef.current = false; }, 4000);
                    break;
                }
            }
        };

        rec.onerror = (e) => {
            // Ignore trivial ones
            if (e.error === 'no-speech' || e.error === 'aborted') {
                if (e.error === 'aborted') recognitionRef.current = null;
                return;
            }
            console.warn('[WakeWord] error:', e.error);

            if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
                setStatus('blocked');
                return;
            }

            setStatus('error');
            clearTimeout(restartTimerRef.current);
            restartTimerRef.current = setTimeout(() => {
                if (enabledRef.current) start();
            }, 3000);
        };

        rec.onend = () => {
            recognitionRef.current = null;
            if (enabledRef.current && !frozenRef.current && document.hasFocus()) {
                clearTimeout(restartTimerRef.current);
                restartTimerRef.current = setTimeout(() => {
                    if (enabledRef.current) start();
                }, 1000);
            } else if (enabledRef.current && !frozenRef.current) {
                console.log('[WakeWord] ⏸ Paused (lost focus)');
                setStatus('idle');
            }
        };

        recognitionRef.current = rec;
        try {
            rec.start();
        } catch (err) {
            console.warn('[WakeWord] Start failed:', err);
            recognitionRef.current = null;
            if (enabledRef.current) {
                clearTimeout(restartTimerRef.current);
                restartTimerRef.current = setTimeout(() => start(), 2000);
            }
        }
    }, [onWake, minConfidence, lang]);

    useEffect(() => {
        if (enabled) {
            start();
        } else {
            stop();
        }

        const h = () => {
            if (enabledRef.current && !recognitionRef.current) {
                console.log('[WakeWord] 🪟 focus returned, restarting...');
                start();
            }
        };
        window.addEventListener('focus', h);

        return () => {
            stop();
            window.removeEventListener('focus', h);
        };
    }, [enabled, start, stop]);

    const manualRestart = useCallback(() => {
        retryCountRef.current = 0;
        stop();
        setTimeout(() => start(), 200);
    }, [stop, start]);

    return { wakeActive, status, confidence: lastConfidence, restart: manualRestart };
}
