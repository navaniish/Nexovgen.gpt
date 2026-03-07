import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Upload, LifeBuoy, FileX2, Sparkles, AlertCircle } from 'lucide-react';
import Logo from './Logo';

const ErrorView = ({
    title = "Content Temporarily Unavailable",
    message = "We couldn't extract the file content. The format may be unsupported, corrupted, or still processing.",
    onRetry,
    onUploadNew,
    onContactSupport
}) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 min-h-[400px] w-full max-w-2xl mx-auto text-center relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass border border-white/10 rounded-[2.5rem] p-10 lg:p-12 shadow-2xl relative z-10 w-full"
            >
                {/* Visual Header Accent */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

                {/* Animated AI Core Element */}
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                opacity: [0.3, 0.6, 0.3]
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full"
                        />
                        <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative backdrop-blur-sm">
                            <FileX2 className="w-10 h-10 text-cyan-400 opacity-80" />
                            {/* Glitch Effect Element */}
                            <motion.div
                                animate={{
                                    opacity: [0, 1, 0],
                                    x: [-2, 2, -2]
                                }}
                                transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 }}
                                className="absolute inset-0 border border-red-500/30 rounded-2xl"
                            />
                        </div>
                    </div>
                </div>

                {/* Messaging */}
                <div className="space-y-4 mb-10">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-[0.4em]">System Status: Neural Pause</span>
                        </div>
                        <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">{title}</h2>
                    </div>
                    <p className="text-sm lg:text-base text-gray-400 font-light leading-relaxed max-w-md mx-auto">
                        {message}
                    </p>
                </div>

                {/* Primary Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onRetry}
                        className="w-full sm:w-auto px-8 py-3.5 bg-cyan-600/20 border border-cyan-500/30 rounded-xl text-cyan-400 text-xs font-bold uppercase tracking-widest hover:bg-cyan-500/30 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry Sync
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onUploadNew}
                        className="w-full sm:w-auto px-8 py-3.5 bg-white/5 border border-white/10 rounded-xl text-gray-300 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    >
                        <Upload className="w-4 h-4" />
                        Upload New File
                    </motion.button>
                </div>

                {/* Secondary Actions */}
                <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-center gap-6">
                    <button
                        onClick={onContactSupport}
                        className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors group"
                    >
                        <LifeBuoy className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                        Contact Support
                    </button>
                    <div className="hidden sm:block w-[1px] h-3 bg-white/10" />
                    <button className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-cyan-400 transition-colors">
                        View Supported Formats
                    </button>
                </div>
            </motion.div>

            {/* Subtle Footer ID */}
            <p className="mt-8 text-[8px] text-gray-700 font-bold uppercase tracking-[0.6em]">
                Nexovgen Error Diagnostic Protocol • NODE_E042
            </p>
        </div>
    );
};

export default ErrorView;
