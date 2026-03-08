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
        'hey nexo ai', 'hi nexo ai', 'hey neks', 'hay nexo', 'nexus', 'nexen'
    ];

    const matchesWakeWord = (text) => {
        // Remove punctuation and common speech recognition artifacts
        const t = text.toLowerCase().replace(/[.,!?;:]/g, '').trim();
        return WAKE_PHRASES.some(phrase => t.includes(phrase));
    };

    const onWakeRef = useRef(onWake);
    const langRef = useRef(lang);
    const minConfRef = useRef(minConfidence);

    useEffect(() => { onWakeRef.current = onWake; }, [onWake]);
    useEffect(() => { langRef.current = lang; }, [lang]);
    useEffect(() => { minConfRef.current = minConfidence; }, [minConfidence]);

    const stop = useCallback(() => {
        clearTimeout(restartTimerRef.current);
        if (recognitionRef.current) {
            console.log('[WakeWord] 🛑 Stopping recognition instance');
            try {
                recognitionRef.current.onend = null;
                recognitionRef.current.onerror = null;
                recognitionRef.current.onresult = null;
                recognitionRef.current.stop();
            } catch (_) { }
            recognitionRef.current = null;
        }
        setStatus('idle');
    }, []);

    const start = useCallback(() => {
        if (!enabledRef.current || !isComponentMounted.current) return;
        if (recognitionRef.current) return;
        // We used to check for focus here, but that's too restrictive for many users.
        // The browser will handle background throttling itself.

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.error('[WakeWord] Speech recognition not supported');
            setStatus('blocked');
            return;
        }

        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = langRef.current;

        rec.onstart = () => {
            console.log('[WakeWord] 🎤 Listening for "Hey Nexo" (Lang:', rec.lang, ')');
            setStatus('listening');
            retryCountRef.current = 0;
        };

        rec.onresult = (event) => {
            if (frozenRef.current) return;
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (!result.isFinal && !rec.interimResults) continue;

                const text = result[0].transcript;
                const conf = result[0].confidence;

                // Log every result to help debugging
                console.log(`[WakeWord] Heard: "${text}" (conf: ${conf.toFixed(2)})`);

                if (conf > 0 && conf < minConfRef.current) continue;

                if (matchesWakeWord(text)) {
                    console.log('[WakeWord] 🔥 WAKE WORD DETECTED!');
                    frozenRef.current = true;
                    setLastConfidence(conf > 0 ? conf : null);

                    // Unlock audio
                    try {
                        const silent = new SpeechSynthesisUtterance('');
                        silent.volume = 0;
                        window.speechSynthesis.speak(silent);
                    } catch (_) { }

                    onWakeRef.current?.();
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
            console.warn('[WakeWord] Recognition error:', e.error);

            if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
                setStatus('blocked');
                return;
            }

            setStatus('error');
            clearTimeout(restartTimerRef.current);
            restartTimerRef.current = setTimeout(() => {
                if (enabledRef.current && isComponentMounted.current) {
                    console.log('[WakeWord] Attempting recovery after error...');
                    start();
                }
            }, 3000);
        };

        rec.onend = () => {
            recognitionRef.current = null;
            const now = Date.now();
            const sessionDuration = now - (rec._startTime || now);

            if (enabledRef.current && !frozenRef.current && isComponentMounted.current) {
                clearTimeout(restartTimerRef.current);

                // If the session was extremely short (< 500ms), it likely failed to start properly.
                // We'll wait longer before retrying to avoid a tight loop.
                const retryDelay = sessionDuration < 500 ? 3000 : 1000;

                if (sessionDuration < 500) {
                    console.warn(`[WakeWord] Session ended too quickly (${sessionDuration}ms). Throttling restart...`);
                }

                restartTimerRef.current = setTimeout(() => {
                    if (enabledRef.current && isComponentMounted.current) {
                        console.log('[WakeWord] Cycle complete, restarting listener...');
                        start();
                    }
                }, retryDelay);
            }
        };

        recognitionRef.current = rec;
        try {
            rec._startTime = Date.now();
            rec.start();
        } catch (err) {
            console.warn('[WakeWord] Start failed:', err);
            recognitionRef.current = null;
            if (enabledRef.current) {
                clearTimeout(restartTimerRef.current);
                restartTimerRef.current = setTimeout(() => start(), 3000);
            }
        }
    }, []); // start now has NO dependencies, it uses refs!

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
