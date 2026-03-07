import { useState, useMemo } from 'react';

const QUICK_ACTIONS = [
    { id: 'new-chat', title: 'Start New Chat', subtitle: 'Open a fresh conversation', command: '/new', searchType: 'action', iconType: 'chat' },
    { id: 'auth', title: 'Authentication', subtitle: 'Login or create account', command: '/auth', searchType: 'action', iconType: 'lock' },
    { id: 'pricing', title: 'Pricing Plans', subtitle: 'View subscription cycles', command: '/pricing', searchType: 'action', iconType: 'zap' },
    { id: 'templates', title: 'Logic Blueprints', subtitle: 'Browse available templates', command: '/templates', searchType: 'action', iconType: 'layout' },
];

/**
 * Custom hook for fuzzy-ish searching across multiple data sources
 */
export default function useSearch(history = [], templates = []) {
    const [query, setQuery] = useState('');

    const results = useMemo(() => {
        const lowQuery = query.toLowerCase().trim();
        const queryWords = lowQuery.split(/\s+/).filter(Boolean);

        const matchesWords = (text) => {
            if (!text) return false;
            const lowText = text.toLowerCase();
            return queryWords.every(word => lowText.includes(word));
        };

        // Handle Quick Actions
        let actionResults = QUICK_ACTIONS.filter(action =>
            (lowQuery && (action.command.startsWith(lowQuery) || matchesWords(action.title))) ||
            (!lowQuery) // Show all actions if query is empty
        );

        // Search in history
        const filteredChats = history.filter(chat => {
            if (!lowQuery) return true; // Show all (limited later) if empty
            const firstMsg = chat.messages?.[0]?.content || '';
            const mentorName = chat.mentorId || '';
            return matchesWords(firstMsg) || matchesWords(mentorName);
        }).map(c => ({
            ...c,
            searchType: 'chat',
            title: c.messages?.[0]?.content?.slice(0, 60) + (c.messages?.[0]?.content?.length > 60 ? '...' : '') || 'Unnamed Chat',
            subtitle: `Chat with ${c.mentorId || 'System'}`
        }));

        // Search in templates
        const filteredTemplates = templates.filter(t => {
            if (!lowQuery) return true; // Show all if empty
            return matchesWords(t.name) ||
                matchesWords(t.description) ||
                t.tags?.some(tag => matchesWords(tag));
        }).map(t => ({
            ...t,
            searchType: 'template',
            title: t.name,
            subtitle: t.description
        }));

        // If empty query, we might want to limit the 'Everything' initial view
        // But the SearchBar component handles the 'all' category specifically 
        // by showing recentSearches for the initial view.

        return {
            chats: filteredChats,
            templates: filteredTemplates,
            actions: actionResults,
            total: filteredChats.length + filteredTemplates.length + actionResults.length
        };
    }, [query, history, templates]);

    return {
        query,
        setQuery,
        results
    };
}
