import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AppearanceProvider } from './lib/AppearanceContext.jsx'
import { LanguageProvider } from './lib/LanguageContext.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <AppearanceProvider>
                <LanguageProvider>
                    <App />
                </LanguageProvider>
            </AppearanceProvider>
        </ErrorBoundary>
    </React.StrictMode>,
)

