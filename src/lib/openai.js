// Client-side gateway to the Nexovgen Orchestration Layer
export const getOrchestratedResponse = async (messages, mentorId, mode, modelId, language = null, isSwarmLoop = false) => {
    const token = await window.firebaseAuth?.currentUser?.getIdToken();
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                messages,
                agentId: mentorId, // Aligned with backend
                mode,
                modelId,
                isSwarmLoop,
                languageHint: language?.systemHint || '',
                languageCode: language?.code || 'en-US',
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            if (errData.code === 'quota_exceeded') throw new Error('insufficient_quota');
            throw new Error('Orchestration failed');
        }

        const data = await response.json();
        return data.content;
    } catch (error) {
        console.error("Orchestrator Client Error:", error);
        throw error;
    }
};

/**
 * Voice-optimized AI response — concise, markdown-free, natural for TTS.
 * Falls back to /api/chat if /api/voice-chat is not yet deployed.
 */
export const getVoiceResponse = async (messages, mentorId, modelId, language = null) => {
    const token = await window.firebaseAuth?.currentUser?.getIdToken();

    // Try the dedicated voice endpoint first
    try {
        const r = await fetch('/api/voice-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                messages, mentorId, modelId,
                languageHint: language?.systemHint || '',
                languageCode: language?.code || 'en-US',
            })
        });

        if (r.status === 404) {
            // Endpoint not deployed yet — fall through to /api/chat
            console.warn('[Nexo] /api/voice-chat not found, falling back to /api/chat');
            throw new Error('FALLBACK');
        }
        if (!r.ok) {
            const errData = await r.json().catch(() => ({}));
            if (errData.code === 'quota_exceeded') throw new Error('insufficient_quota');
            throw new Error('Voice chat failed');
        }
        const data = await r.json();
        return data.content;

    } catch (err) {
        console.warn('[Nexo] /api/voice-chat failed, falling back to /api/chat. Error:', err.message);
    }

    // Fallback: /api/chat with voice-mode system hint injected
    const voiceHint = (language?.systemHint || '') +
        '\n\n[VOICE MODE] Reply in 1-3 short sentences. No markdown. Speak naturally.';
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            messages, mentorId, modelId,
            languageHint: voiceHint,
            languageCode: language?.code || 'en-US',
        })
    });
    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (errData.code === 'quota_exceeded') throw new Error('insufficient_quota');
        throw new Error('Chat failed');
    }
    const data = await response.json();
    return data.content;
};
