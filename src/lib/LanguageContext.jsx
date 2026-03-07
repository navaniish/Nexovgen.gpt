import React, { createContext, useContext, useState } from 'react';

/**
 * LANGUAGES — code = BCP-47 for Web Speech API, systemHint shapes AI tone/dialect.
 * Grouped: India (with regional slang) → Major World Languages
 */
export const LANGUAGES = [

    // ── ENGLISH ─────────────────────────────────────────────────────────────────
    { id: 'en-US', code: 'en-US', label: 'English (US)', flag: '🇺🇸', group: 'English', systemHint: '' },
    {
        id: 'en-IN', code: 'en-IN', label: 'English (India)', flag: '🇮🇳', group: 'English',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Indian English. Use Indian expressions naturally: "kindly", "do the needful", "prepone", "out of station", "revert back", "passed out from college". Keep tech terms in English.'
    },
    {
        id: 'en-GB', code: 'en-GB', label: 'English (UK)', flag: '🇬🇧', group: 'English',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in British English. Use British spellings and expressions.'
    },

    // ── INDIA — North ────────────────────────────────────────────────────────────
    {
        id: 'hinglish', code: 'hi-IN', label: 'Hinglish', flag: '🇮🇳', group: '🇮🇳 India — North',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Hinglish — urban Hindi-English mix. Use: yaar, bhai, ekdum sahi, kya scene hai, dhakad, jugaad, full paisa vasool, solid, arrey, seedha baat. Mix English and Hindi naturally. Example: "Yaar, this idea is ekdum solid — no tension on funding, bhai."'
    },
    {
        id: 'hindi', code: 'hi-IN', label: 'Hindi (शुद्ध)', flag: '🇮🇳', group: '🇮🇳 India — North',
        systemHint: 'LANGUAGE DIRECTIVE: Respond entirely in pure Hindi using Devanagari script. Keep brand names and technical terms in English. Be warm and motivating. Example: "यार, आपका विचार बिल्कुल सही है।"'
    },
    {
        id: 'awadhi', code: 'hi-IN', label: 'Awadhi (UP)', flag: '🇮🇳', group: '🇮🇳 India — North',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Awadhi dialect (Lucknow/Ayodhya, UP). Mix Awadhi words: haan ji, ka ho, bahutai achha, kaahe, hamar, tohar, kab se. Be warm like Nawabi Lucknow culture.'
    },
    {
        id: 'braj', code: 'hi-IN', label: 'Braj Bhasha (Mathura)', flag: '🇮🇳', group: '🇮🇳 India — North',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Braj Bhasha (Mathura-Agra region). Use Braj flavor: kaahe ko, mohe, tohe, kaun baat hai, suno ji. Keep technical advice practical.'
    },
    {
        id: 'bundeli', code: 'hi-IN', label: 'Bundeli (MP)', flag: '🇮🇳', group: '🇮🇳 India — North',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Bundeli dialect (Bundelkhand — MP/UP). Use: ka re bhai, kitne ki baat, theek hai ji. Blend with Hindi for clarity.'
    },
    {
        id: 'bhojpuri', code: 'bho', label: 'Bhojpuri (Bihar/UP)', flag: '🇮🇳', group: '🇮🇳 India — North',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Bhojpuri (Bihar, eastern UP, Jharkhand). Use: ka baat ba, sahi baat bola, hamni ke, tohra ke, kaise ba, zabardast, ekdum solid. Warm and direct tone.'
    },
    {
        id: 'maithili', code: 'mai', label: 'Maithili (Bihar)', flag: '🇮🇳', group: '🇮🇳 India — North',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Maithili (Mithila region, Bihar). Use Maithili expressions naturally. Keep technical terms in English.'
    },
    {
        id: 'magahi', code: 'hi-IN', label: 'Magahi (Patna/Gaya)', flag: '🇮🇳', group: '🇮🇳 India — North',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Magahi dialect (Gaya, Jehanabad, Patna region). Use Magahi flavor with Hindi base. Warm, direct.'
    },
    {
        id: 'haryanvi', code: 'hi-IN', label: 'Haryanvi (Haryana)', flag: '🇮🇳', group: '🇮🇳 India — North',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Haryanvi dialect. Use Haryanvi expressions: ke baat karun, thane, mhane, haanji, zabardast baat, ekdum pakka. Confident, rural-entrepreneurial tone.'
    },
    {
        id: 'punjabi', code: 'pa-IN', label: 'Punjabi', flag: '🇮🇳', group: '🇮🇳 India — North',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Punjabi (Gurmukhi script) with English tech terms. Use: ਹਾਂ ਜੀ, ਕੀ ਗੱਲ ਹੈ, ਬਿਲਕੁਲ ਸਹੀ, ਯਾਰ, ਸ਼ਾਬਾਸ਼। Warm, energetic Punjabi tone.'
    },
    {
        id: 'punjabi-lat', code: 'pa-IN', label: 'Punjabi Bolbol (Roman)', flag: '🇮🇳', group: '🇮🇳 India — North',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Punjabi written in Latin script (Punjabi Roman). Use: yaar, ki gal, bilkul sahi, ki haal ae, chal, wah. Energetic and fun tone.'
    },
    {
        id: 'urdu', code: 'ur-IN', label: 'Urdu (اردو)', flag: '🇮🇳', group: '🇮🇳 India — North',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Urdu using Nastaliq script. Use refined Urdu: janab, bahut khoob, bilkul durust, khidmat mein hazir, shukriya. Keep technical terms in English. Elegant and warm tone.'
    },

    // ── INDIA — South ────────────────────────────────────────────────────────────
    {
        id: 'telugu', code: 'te-IN', label: 'Telugu (తెలుగు)', flag: '🇮🇳', group: '🇮🇳 India — South',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Telugu script. Use telugu expressions: అవును, బాగుంది, చాలా సంతోషం, సరే. Mix in slangs naturally: "Mama/Bava", "Sarele", "Taggedele", "Asalu..". Keep tech terms in English. Andhra regional warmth.'
    },
    {
        id: 'telugu-telangana', code: 'te-IN', label: 'Telangana Telugu', flag: '🇮🇳', group: '🇮🇳 India — South',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Telangana dialect of Telugu. Use Telangana slang: "Kirrak", "Keko", "Baigan", "Picha lite", "Galthi", "Aagaladu". Be energetic and use Hyderabadi style. Example: "Output kirrak vachindi mama!"'
    },
    {
        id: 'tamil', code: 'ta-IN', label: 'Tamil (தமிழ்)', flag: '🇮🇳', group: '🇮🇳 India — South',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Tamil script. Use: ஆமாம், சரிதான், நல்லா இருக்கு, பாரு, மச்சி, தலைவா. Keep tech terms in English. Chennai-style warmth.'
    },
    {
        id: 'kannada', code: 'kn-IN', label: 'Kannada (ಕನ್ನಡ)', flag: '🇮🇳', group: '🇮🇳 India — South',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Kannada script. Use: ಹೌದು, ಸರಿ, ಚೆನ್ನಾಗಿದೆ, ಮಚ್ಚಾ, ಗುರು, ನೋಡು. Keep technical terms in English. Bengaluru startup culture tone.'
    },
    {
        id: 'malayalam', code: 'ml-IN', label: 'Malayalam (മലയാളം)', flag: '🇮🇳', group: '🇮🇳 India — South',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Malayalam script. Use: ശരി, ഉണ്ട്, നല്ലതാ, ചേട്ടാ, മോനേ, ആദ്യം. Keep technical terms in English. Kerala warmth.'
    },
    {
        id: 'tulu', code: 'kn-IN', label: 'Tulu (Coastal Karnataka)', flag: '🇮🇳', group: '🇮🇳 India — South',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Tulu language (Coastal Karnataka — Mangaluru, Udupi). Use Tulu expressions with Kannada/English mix where needed. Warm coastal tone.'
    },
    {
        id: 'kodava', code: 'kn-IN', label: 'Kodava (Coorg)', flag: '🇮🇳', group: '🇮🇳 India — South',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Kodava dialect (Coorg, Karnataka). Mix Kodava phrases with Kannada and English. Warm, direct.'
    },

    // ── INDIA — West ─────────────────────────────────────────────────────────────
    {
        id: 'marathi', code: 'mr-IN', label: 'Marathi (मराठी)', flag: '🇮🇳', group: '🇮🇳 India — West',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Marathi script. Use: हो, बरोबर आहे, एकदम झकास, काय मस्त, भीड नको, सांगतो. Keep tech terms English. Pune/Mumbai startup tone.'
    },
    {
        id: 'mumbai-hindi', code: 'hi-IN', label: 'Mumbai Tapori', flag: '🇮🇳', group: '🇮🇳 India — West',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Mumbai street Hindi (tapori style). Use: aye, kya re, bindaas, mast, full on, ekdum solid, apun, kya bakwaas, tension nahi le, scene set hai, boss. Mix Marathi and Bambaiya Hindi.'
    },
    {
        id: 'gujarati', code: 'gu-IN', label: 'Gujarati (ગુજરાતી)', flag: '🇮🇳', group: '🇮🇳 India — West',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Gujarati script. Use: kem cho, maja ma, bilkul sahi, saru che, aavyo, tame. Business savvy Gujarati entrepreneurial tone. Keep tech terms English.'
    },
    {
        id: 'kutchi', code: 'gu-IN', label: 'Kutchi (Kutch, Gujarat)', flag: '🇮🇳', group: '🇮🇳 India — West',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Kutchi dialect (Kutch district, Gujarat). Mix Kutchi phrases with Gujarati. Trading/business community warmth.'
    },
    {
        id: 'rajasthani', code: 'hi-IN', label: 'Rajasthani (Marwari)', flag: '🇮🇳', group: '🇮🇳 India — West',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Marwari/Rajasthani dialect. Use: ke baat chhe, sahi baat, haaji haaji, khub saro, mharo, thaaro, rajab se. Marwari business community energy.'
    },

    // ── INDIA — East ─────────────────────────────────────────────────────────────
    {
        id: 'bengali', code: 'bn-IN', label: 'Bengali (বাংলা)', flag: '🇮🇳', group: '🇮🇳 India — East',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Bengali script. Use: হ্যাঁ, ঠিক আছে, দারুণ, বলো, দাদা, দিদি, একেবারে সঠিক. Kolkata intellectual-entrepreneur tone. Keep tech terms English.'
    },
    {
        id: 'odia', code: 'or-IN', label: 'Odia (ଓଡ଼ିଆ)', flag: '🇮🇳', group: '🇮🇳 India — East',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Odia script (Odisha). Use: ହଁ, ଠିକ ଅଛି, ଭଲ, ବୁଝିଲ, ଭାଇ. Keep technical terms in English. Warm Odia tone.'
    },
    {
        id: 'assamese', code: 'as-IN', label: 'Assamese (অসমীয়া)', flag: '🇮🇳', group: '🇮🇳 India — East',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Assamese script. Use: হয়, ঠিকেই আছে, বহুত ভাল, ভাই, দেখা. Keep tech terms English. Assam regional warmth.'
    },
    {
        id: 'bodo', code: 'as-IN', label: 'Bodo (Assam)', flag: '🇮🇳', group: '🇮🇳 India — East',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Bodo language (Assam). Mix Bodo with Assamese and English for clarity. Warm and direct.'
    },
    {
        id: 'meitei', code: 'mni-IN', label: 'Meitei/Manipuri (মণিপুরী)', flag: '🇮🇳', group: '🇮🇳 India — East',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Meitei (Manipuri). Use Meitei Mayek script where possible or transliteration. Keep technical terms in English.'
    },

    // ── INDIA — Northeast ────────────────────────────────────────────────────────
    {
        id: 'nagamese', code: 'en-IN', label: 'Nagamese (Nagaland)', flag: '🇮🇳', group: '🇮🇳 India — Northeast',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Nagamese creole (Nagaland). Mix English, Hindi, and Nagamese naturally. Warm, direct Northeast India tone.'
    },
    {
        id: 'mizo', code: 'en-IN', label: 'Mizo (Mizoram)', flag: '🇮🇳', group: '🇮🇳 India — Northeast',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Mizo language (Mizoram). Use Mizo expressions with English technical terms. Warm and direct.'
    },
    {
        id: 'khasi', code: 'en-IN', label: 'Khasi (Meghalaya)', flag: '🇮🇳', group: '🇮🇳 India — Northeast',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Khasi language (Meghalaya). Mix Khasi and English naturally. Warm Northeast tone.'
    },
    {
        id: 'sikkimese', code: 'ne-IN', label: 'Sikkimese (Sikkim)', flag: '🇮🇳', group: '🇮🇳 India — Northeast',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Sikkimese/Nepali (Sikkim). Use warm, Himalayan-community tone with English tech terms.'
    },

    // ── INDIA — Central ──────────────────────────────────────────────────────────
    {
        id: 'chhattisgarhi', code: 'hi-IN', label: 'Chhattisgarhi (Chattisgarh)', flag: '🇮🇳', group: '🇮🇳 India — Central',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Chhattisgarhi dialect. Use: का गोठ, ठीक हावय, संगी, भाई, बने हे, मोर, तोर. Warm tribal-heartland tone.'
    },
    {
        id: 'gondi', code: 'hi-IN', label: 'Gondi (Central India)', flag: '🇮🇳', group: '🇮🇳 India — Central',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Gondi language (tribal belt — MP, Telangana, Maharashtra). Mix Gondi with Hindi where needed for clarity.'
    },

    // ── INDIA — Himalayan ────────────────────────────────────────────────────────
    {
        id: 'kashmiri', code: 'ks-IN', label: 'Kashmiri (کٲشُر)', flag: '🇮🇳', group: '🇮🇳 India — Himalayan',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Kashmiri language. Use warm Kashmiri expressions: chai, wanaan, kyah, bai, bane. Mix Urdu/Hindi where clarity needed. Keep tech terms English.'
    },
    {
        id: 'dogri', code: 'doi-IN', label: 'Dogri (Jammu)', flag: '🇮🇳', group: '🇮🇳 India — Himalayan',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Dogri language (Jammu region). Use Dogri warmth with Hindi/English mix. Direct and practical.'
    },
    {
        id: 'nepali', code: 'ne-IN', label: 'Nepali (Darjeeling/Sikkim)', flag: '🇮🇳', group: '🇮🇳 India — Himalayan',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Nepali language (Darjeeling, Sikkim, North Bengal hills). Use: हो, ठिक छ, राम्रो, दाइ, दिदी. Warm Himalayan-community tone.'
    },
    {
        id: 'tibetan-ladakhi', code: 'en-IN', label: 'Ladakhi (Ladakh)', flag: '🇮🇳', group: '🇮🇳 India — Himalayan',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Ladakhi/Tibetan dialect (Leh-Ladakh). Mix Ladakhi phrases with English. Calm, wise Himalayan tone.'
    },

    // ── INDIA — Coastal/Island ───────────────────────────────────────────────────
    {
        id: 'konkani', code: 'kok-IN', label: 'Konkani (Goa/Konkan)', flag: '🇮🇳', group: '🇮🇳 India — Coastal',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Konkani (Goa, Konkan coast). Use: ho, bori goshta, sare, bhai. Mix Portuguese loanwords naturally (mesa, janela). Relaxed Goan coastal vibes.'
    },
    {
        id: 'tulu-udupi', code: 'kn-IN', label: 'Udupi Tulu', flag: '🇮🇳', group: '🇮🇳 India — Coastal',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Udupi Tulu dialect (Udupi, Mangaluru). Use Tulu coastal warmth with Kannada/English mix.'
    },
    {
        id: 'andamanese', code: 'en-IN', label: 'Andaman Hindi', flag: '🇮🇳', group: '🇮🇳 India — Coastal',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in the Andaman Islands mixed Hindi dialect. Use island community warmth with standard Hindi base.'
    },

    // ── INDIA — Tribal ────────────────────────────────────────────────────────────
    {
        id: 'santali', code: 'sat-IN', label: 'Santali (Jharkhand)', flag: '🇮🇳', group: '🇮🇳 India — Tribal',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Santali language (Jharkhand, West Bengal, Odisha). Use Ol Chiki script where possible, or transliteration. Keep tech terms English.'
    },
    {
        id: 'mundari', code: 'en-IN', label: 'Mundari (Jharkhand)', flag: '🇮🇳', group: '🇮🇳 India — Tribal',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Mundari tribal language (Jharkhand). Mix with Hindi where needed for clarity. Warm community tone.'
    },

    // ── WORLD — Asia Pacific ──────────────────────────────────────────────────────
    {
        id: 'zh-CN', code: 'zh-CN', label: '普通话 Mandarin', flag: '🇨🇳', group: '🌏 Asia Pacific',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Simplified Chinese (Mandarin). Keep technical terms in English. Professional and direct.'
    },
    {
        id: 'zh-TW', code: 'zh-TW', label: '繁體中文 Traditional', flag: '🇹🇼', group: '🌏 Asia Pacific',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Traditional Chinese (Taiwan). Keep technical terms in English. Professional tone.'
    },
    {
        id: 'ja', code: 'ja-JP', label: '日本語 Japanese', flag: '🇯🇵', group: '🌏 Asia Pacific',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Japanese (Keigo where appropriate). Keep brand names and technical terms in English.'
    },
    {
        id: 'ko', code: 'ko-KR', label: '한국어 Korean', flag: '🇰🇷', group: '🌏 Asia Pacific',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Korean. Keep technical terms in English. Professional and energetic tone.'
    },
    {
        id: 'ms', code: 'ms-MY', label: 'Bahasa Melayu', flag: '🇲🇾', group: '🌏 Asia Pacific',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Bahasa Malaysia. Keep technical terms in English. Warm Malaysian startup tone.'
    },
    {
        id: 'id', code: 'id-ID', label: 'Bahasa Indonesia', flag: '🇮🇩', group: '🌏 Asia Pacific',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Bahasa Indonesia. Keep technical terms in English. Friendly and direct.'
    },
    {
        id: 'th', code: 'th-TH', label: 'ภาษาไทย Thai', flag: '🇹🇭', group: '🌏 Asia Pacific',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Thai. Keep technical terms in English. Warm and professional.'
    },
    {
        id: 'vi', code: 'vi-VN', label: 'Tiếng Việt Vietnamese', flag: '🇻🇳', group: '🌏 Asia Pacific',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Vietnamese. Keep technical terms in English. Professional tone.'
    },
    {
        id: 'fil', code: 'fil-PH', label: 'Filipino/Tagalog', flag: '🇵🇭', group: '🌏 Asia Pacific',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Filipino/Tagalog. Mix English naturally (Taglish is fine). Warm and energetic Filipino tone.'
    },
    {
        id: 'si', code: 'si-LK', label: 'සිංහල Sinhala', flag: '🇱🇰', group: '🌏 Asia Pacific',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Sinhala script. Keep technical terms in English. Warm Sri Lankan tone.'
    },
    {
        id: 'ne', code: 'ne-NP', label: 'नेपाली Nepali', flag: '🇳🇵', group: '🌏 Asia Pacific',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Nepali. Keep technical terms in English. Warm and practical.'
    },
    {
        id: 'bn-BD', code: 'bn-BD', label: 'বাংলা Bengali (BD)', flag: '🇧🇩', group: '🌏 Asia Pacific',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Bangladeshi Bengali. Keep technical terms in English. Warm, direct tone.'
    },

    // ── WORLD — Middle East / Central Asia ───────────────────────────────────────
    {
        id: 'ar', code: 'ar-SA', label: 'العربية Arabic', flag: '🇸🇦', group: '🌍 Middle East',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Arabic (Modern Standard). Keep technical terms in English.'
    },
    {
        id: 'ar-EG', code: 'ar-EG', label: 'عربي مصري Egyptian Arabic', flag: '🇪🇬', group: '🌍 Middle East',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Egyptian Arabic dialect. Warm, conversational Cairo style.'
    },
    {
        id: 'fa', code: 'fa-IR', label: 'فارسی Persian/Farsi', flag: '🇮🇷', group: '🌍 Middle East',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Persian/Farsi. Keep technical terms in English.'
    },
    {
        id: 'tr', code: 'tr-TR', label: 'Türkçe Turkish', flag: '🇹🇷', group: '🌍 Middle East',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Turkish. Keep technical terms in English. Professional and warm.'
    },
    {
        id: 'he', code: 'he-IL', label: 'עברית Hebrew', flag: '🇮🇱', group: '🌍 Middle East',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Hebrew. Keep technical terms in English.'
    },

    // ── WORLD — Europe ───────────────────────────────────────────────────────────
    {
        id: 'es', code: 'es-ES', label: 'Español Spanish', flag: '🇪🇸', group: '🌍 Europe',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Spanish (Spain). Keep tech terms in English.'
    },
    {
        id: 'es-MX', code: 'es-MX', label: 'Español Mexicano', flag: '🇲🇽', group: '🌍 Europe',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Mexican Spanish. Keep tech terms English. Friendly Mexican warmth.'
    },
    {
        id: 'fr', code: 'fr-FR', label: 'Français French', flag: '🇫🇷', group: '🌍 Europe',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in French. Keep technical terms in English.'
    },
    {
        id: 'de', code: 'de-DE', label: 'Deutsch German', flag: '🇩🇪', group: '🌍 Europe',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in German. Keep technical terms in English.'
    },
    {
        id: 'it', code: 'it-IT', label: 'Italiano Italian', flag: '🇮🇹', group: '🌍 Europe',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Italian. Keep technical terms in English.'
    },
    {
        id: 'pt', code: 'pt-PT', label: 'Português Portuguese', flag: '🇵🇹', group: '🌍 Europe',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Portuguese. Keep technical terms in English.'
    },
    {
        id: 'pt-BR', code: 'pt-BR', label: 'Português Brasileiro', flag: '🇧🇷', group: '🌍 Europe',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Brazilian Portuguese. Warm and energetic Brazil tone.'
    },
    {
        id: 'ru', code: 'ru-RU', label: 'Русский Russian', flag: '🇷🇺', group: '🌍 Europe',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Russian. Keep technical terms in English.'
    },
    {
        id: 'pl', code: 'pl-PL', label: 'Polski Polish', flag: '🇵🇱', group: '🌍 Europe',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Polish. Keep technical terms in English.'
    },
    {
        id: 'nl', code: 'nl-NL', label: 'Nederlands Dutch', flag: '🇳🇱', group: '🌍 Europe',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Dutch. Keep technical terms in English.'
    },
    {
        id: 'sv', code: 'sv-SE', label: 'Svenska Swedish', flag: '🇸🇪', group: '🌍 Europe',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Swedish. Keep technical terms in English.'
    },
    {
        id: 'uk', code: 'uk-UA', label: 'Українська Ukrainian', flag: '🇺🇦', group: '🌍 Europe',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Ukrainian. Keep technical terms in English.'
    },
    {
        id: 'el', code: 'el-GR', label: 'Ελληνικά Greek', flag: '🇬🇷', group: '🌍 Europe',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Greek. Keep technical terms in English.'
    },

    // ── WORLD — Africa ───────────────────────────────────────────────────────────
    {
        id: 'sw', code: 'sw-KE', label: 'Kiswahili Swahili', flag: '🇰🇪', group: '🌍 Africa',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Swahili. Keep technical terms in English. Warm East African tone.'
    },
    {
        id: 'am', code: 'am-ET', label: 'አማርኛ Amharic', flag: '🇪🇹', group: '🌍 Africa',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Amharic. Keep technical terms in English.'
    },
    {
        id: 'yo', code: 'yo-NG', label: 'Yorùbá', flag: '🇳🇬', group: '🌍 Africa',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Yoruba. Mix English where needed. Nigerian warmth and energy.'
    },
    {
        id: 'ha', code: 'ha-NE', label: 'Hausa', flag: '🇳🇬', group: '🌍 Africa',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Hausa. Keep technical terms in English.'
    },
    {
        id: 'zu', code: 'zu-ZA', label: 'isiZulu Zulu', flag: '🇿🇦', group: '🌍 Africa',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Zulu. Keep technical terms in English. Warm South African tone.'
    },
    {
        id: 'af', code: 'af-ZA', label: 'Afrikaans', flag: '🇿🇦', group: '🌍 Africa',
        systemHint: 'LANGUAGE DIRECTIVE: Respond in Afrikaans. Keep technical terms in English.'
    },
];

// ── Group helper ─────────────────────────────────────────────────────────────
export const LANGUAGE_GROUPS = LANGUAGES.reduce((acc, lang) => {
    const g = lang.group || 'Other';
    if (!acc[g]) acc[g] = [];
    acc[g].push(lang);
    return acc;
}, {});

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(LANGUAGES[0]);
    return (
        <LanguageContext.Provider value={{ lang, setLang, LANGUAGES, LANGUAGE_GROUPS }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used within <LanguageProvider>');
    return ctx;
}
