import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icons } from '../ui/Icons';
import { UploadZone } from '../UploadZone';
import { FreeGenerationBadge } from '../FreeGenerationBadge';
import { ResultsDashboard } from '../ResultsDashboard';
import { Scanner } from '../Scanner';
import { HistorySidebar } from '../HistorySidebar';
import { ThemeToggle } from '../ThemeToggle';
import { VisualCombiningEffect } from '../VisualCombiningEffect';
import { AppState, SocialKitResult, SocialKitConfig } from '../../types';

interface GenerateProps {
    state: AppState;
    user: any;
    handleClear: () => void;
    handleGenerate: () => void;
    handleFileSelect: (file: File) => void;
    setState: React.Dispatch<React.SetStateAction<AppState>>;
    setShowAuth: (show: boolean) => void;
    creditsRemaining: number | null;
    loadFromHistory: (result: SocialKitResult, imageUrl: string, config?: SocialKitConfig) => void;
}

export const Generate: React.FC<GenerateProps> = ({
    state,
    user,
    handleClear,
    handleGenerate,
    handleFileSelect,
    setState,
    setShowAuth,
    creditsRemaining,
    loadFromHistory
}) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex w-full h-full overflow-hidden text-sm md:text-base relative">
            {/* MOBILE BACKDROP */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* LEFT SIDEBAR: Pro Panel */}
            <aside className={`
                fixed inset-y-0 left-0 w-80 border-r border-surfaceHighlight bg-white dark:bg-surface flex flex-col h-full shrink-0 z-[101] overflow-hidden transition-transform duration-300 lg:relative lg:translate-x-0 lg:z-20
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 flex flex-col gap-6 h-full w-full overflow-hidden">
                    {/* Brand Header */}
                    <div className="flex items-center justify-between shrink-0">
                        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <div className="w-10 h-10 flex items-center justify-center">
                                <img src="/favsnap.png" alt="SnapKit" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-primary">SnapKit</span>
                        </Link>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-2 lg:hidden text-text-muted hover:text-primary transition-colors"
                        >
                            <Icons.X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* New Action */}
                    <Link
                        to="/generate"
                        onClick={() => {
                            handleClear();
                            setIsSidebarOpen(false);
                        }}
                        className="w-full py-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl font-bold flex items-center justify-center gap-2 transition-all group shrink-0"
                    >
                        <Icons.Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        New Generation
                    </Link>

                    {/* History Section */}
                    <div className="flex flex-col gap-2 flex-1 min-h-0">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted">
                            <Icons.History className="w-3 h-3" />
                            History
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            <HistorySidebar
                                isOpen={true}
                                variant="static"
                                userId={user?.id}
                                onSelect={(...args) => {
                                    loadFromHistory(...args);
                                    setIsSidebarOpen(false);
                                }}
                            />
                        </div>
                    </div>

                    {/* Profile Footer */}
                    {user && (
                        <div className="pt-4 border-t border-surfaceHighlight shrink-0 flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 p-[1px] shrink-0">
                                    <div className="w-full h-full rounded-full bg-surface flex items-center justify-center">
                                        <span className="text-xs font-bold text-primary">{user.email?.charAt(0).toUpperCase()}</span>
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-text-main truncate">{user.email?.split('@')[0]}</p>
                                    <p className="text-[10px] text-text-muted truncate">{user.email}</p>
                                </div>
                            </div>
                            <div className="shrink-0 scale-75 origin-right">
                                <ThemeToggle />
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 overflow-y-auto no-scrollbar relative h-full">
                {/* Mobile Menu Toggle */}
                <div className="lg:hidden sticky top-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md z-30 border-b border-surfaceHighlight flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <img src="/favsnap.png" alt="SnapKit" className="w-6 h-6 object-contain" />
                        <span className="text-sm font-bold text-primary">SnapKit</span>
                    </Link>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 bg-surfaceHighlight rounded-lg text-text-main shadow-sm"
                    >
                        <Icons.Menu className="w-5 h-5" />
                    </button>
                </div>

                <div className="max-w-6xl mx-auto p-4 md:p-8 lg:p-12">
                    {state.imagePreview ? (
                        <div className="space-y-6 md:space-y-8 animate-fade-in">

                            {/* Top Row: Scanner + Config */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                                {/* Scanner View */}
                                <div className="z-10 relative">
                                    <Scanner
                                        image={state.imagePreview}
                                        isScanning={state.status === 'generating'}
                                        onClear={handleClear}
                                        progress={state.generationProgress}
                                    />

                                    {/* Visual Connection Effect */}
                                    <div className="absolute top-1/2 -right-10 w-12 h-full pointer-events-none transform -translate-y-1/2 overflow-visible">
                                        <VisualCombiningEffect isGenerating={state.status === 'generating'} />
                                    </div>
                                </div>

                                {/* Config Panel */}
                                <div className={`bg-white dark:bg-surface rounded-2xl shadow-xl border border-surfaceHighlight p-6 z-10 transition-all duration-500 ${(state.status === 'analyzing' || state.status === 'generating') ? 'card-node-active' : ''}`}>
                                    <h3 className="font-semibold text-text-main mb-6 flex items-center gap-2">
                                        <Icons.Settings className="w-4 h-4 text-primary" /> Configuration
                                    </h3>

                                    <div className="space-y-8">
                                        <div>
                                            <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-3">Tone of Voice</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['playful', 'professional', 'minimal', 'inspirational', 'funny'].map((t) => (
                                                    <button
                                                        key={t}
                                                        onClick={() => setState(prev => ({ ...prev, config: { ...prev.config, tone: t as any } }))}
                                                        className={`px-3 py-2 rounded-lg text-sm transition-all border
                                              ${state.config.tone === t
                                                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                                                : 'bg-surfaceHighlight text-text-muted border-transparent hover:border-border hover:text-text-main'
                                                            }`}
                                                    >
                                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-surfaceHighlight">
                                            <label className="text-sm font-medium text-text-muted">Include Emojis</label>
                                            <button
                                                onClick={() => setState(prev => ({ ...prev, config: { ...prev.config, includeEmoji: !prev.config.includeEmoji } }))}
                                                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${state.config.includeEmoji ? 'bg-accent' : 'bg-surfaceHighlight'}`}
                                            >
                                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${state.config.includeEmoji ? 'translate-x-6' : ''}`} />
                                            </button>
                                        </div>

                                        {user && (
                                            <div className="pt-2 flex justify-center">
                                                <FreeGenerationBadge
                                                    remaining={creditsRemaining ?? 0}
                                                    limit={3}
                                                    hasOwnKey={!!(state.apiKey && state.apiKey.trim() !== '')}
                                                />
                                            </div>
                                        )}

                                        <button
                                            onClick={handleGenerate}
                                            disabled={state.status === 'generating' || state.status === 'complete'}
                                            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all
                                       ${state.status === 'generating'
                                                    ? 'bg-surfaceHighlight cursor-not-allowed text-text-muted shadow-none'
                                                    : state.status === 'complete'
                                                        ? 'bg-primary/80 text-white  cursor-default shadow-none'
                                                        : 'bg-primary hover:bg-primaryHover hover:shadow-primary/25 hover:scale-[1.02]'
                                                }
                                     `}
                                        >
                                            {state.status === 'generating' ? (
                                                <>
                                                    <Icons.RefreshCw className="w-5 h-5 animate-spin" />
                                                    Generating...
                                                </>
                                            ) : state.status === 'complete' ? (
                                                <>
                                                    <Icons.CheckCircle className="w-5 h-5" />
                                                    Social Kit Ready
                                                </>
                                            ) : (
                                                <>
                                                    <Icons.Sparkles className="w-5 h-5" />
                                                    Generate Social Kit
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Error Message */}
                            {state.error && (
                                <div className="bg-red-500/10 text-red-400 p-4 rounded-xl border border-red-500/20 flex items-start gap-3 animate-fade-in">
                                    <Icons.AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm">{state.error}</p>
                                </div>
                            )}

                            {/* Results Section */}
                            <div className={`transition-all duration-500 ${state.status === 'generating' ? 'opacity-50 blur-[2px]' : ''}`}>
                                {!state.result && state.status === 'generating' ? (
                                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-surface shadow-xl border border-surfaceHighlight">
                                        <div className="flex flex-col items-center space-y-6">
                                            <div className="relative w-16 h-16">
                                                <div className="absolute inset-0 border-4 border-surfaceHighlight rounded-full"></div>
                                                <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-text-muted text-sm">Generating your content...</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : state.result ? (
                                    <ResultsDashboard result={state.result} />
                                ) : (
                                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-border/40 rounded-2xl bg-white/20 dark:bg-surface/50 text-text-muted">
                                        <Icons.Sparkles className="w-10 h-10 text-primary mb-4" />
                                        <p className="text-lg font-semibold text-text-main">Ready to generate content.</p>
                                        <p className="text-sm opacity-60">Configure your settings on the left and hit generate.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center min-h-[70vh]">
                            <div className="text-center max-w-2xl mb-12">
                                <h1 className="text-4xl md:text-6xl font-bold text-text-main mb-4 tracking-tight">
                                    Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500 pr-1">Generate?</span>
                                </h1>
                                <p className="text-lg md:text-xl text-text-muted font-light">
                                    Upload your photo below and watch SnapKit turn it into <span className="text-text-main font-medium">viral content</span>
                                </p>
                            </div>

                            <div className="w-full max-w-xl mx-auto relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                <div className="relative bg-white dark:bg-surface rounded-2xl p-1 border border-surfaceHighlight shadow-2xl overflow-hidden">
                                    {user ? (
                                        <UploadZone onFileSelect={handleFileSelect} />
                                    ) : (
                                        <div className="py-16 px-8 text-center bg-gradient-to-b from-background/50 to-surfaceHighlight/20 rounded-xl">
                                            <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/30">
                                                <Icons.Lock className="w-10 h-10 text-white" />
                                            </div>
                                            <h3 className="text-xl font-bold text-text-main mb-3">
                                                Start Creating Magic
                                            </h3>
                                            <p className="text-text-muted mb-8 text-sm max-w-sm mx-auto leading-relaxed">
                                                Sign in to upload your first image and watch SnapKit transform it into scroll-stopping content.
                                            </p>
                                            <button
                                                onClick={() => setShowAuth(true)}
                                                className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-purple-600 hover:to-primary text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.02]"
                                            >
                                                Get Started Free
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );

};
