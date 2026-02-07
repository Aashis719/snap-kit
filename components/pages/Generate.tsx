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
    setShowSettings: (show: boolean) => void;
    creditsRemaining: number | null;
    loadFromHistory: (result: SocialKitResult, imageUrl: string, config?: SocialKitConfig, generationId?: string) => void;
    historyRefreshKey: number;
}

export const Generate: React.FC<GenerateProps> = ({
    state,
    user,
    handleClear,
    handleGenerate,
    handleFileSelect,
    setState,
    setShowAuth,
    setShowSettings,
    creditsRemaining,
    loadFromHistory,
    historyRefreshKey
}) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.sidebar-profile-container')) {
                setShowProfileMenu(false);
            }
        };

        if (showProfileMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showProfileMenu]);

    const handleSignOut = async () => {
        const { supabase } = await import('../../lib/supabase');
        await supabase.auth.signOut();
        setShowProfileMenu(false);
        window.location.href = '/';
    };

    return (
        <div className="flex w-full h-full max-w-full overflow-hidden text-sm md:text-base relative">
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
                        <Link to="/" className="flex items-center  hover:opacity-80 transition-opacity">
                            <div className="w-8 h-8 flex items-center justify-center">
                                <img src="/favsnap.png" alt="SnapKit" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-2xl font-bold tracking-tight text-primary">SnapKit</span>
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
                                currentId={state.result ? state.currentId : undefined}
                                onClear={handleClear}
                                refreshKey={historyRefreshKey}
                            />
                        </div>
                    </div>

                    {/* Profile Footer */}
                    {user && (
                        <div className="pt-4 border-t border-surfaceHighlight shrink-0 relative sidebar-profile-container">
                            {/* Profile Popup Menu */}
                            <div className={`absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-surface border border-surfaceHighlight rounded-2xl shadow-2xl p-2 transform transition-all duration-200 origin-bottom z-[60] ${showProfileMenu ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'}`}>
                                <div className="px-4 py-3 border-b border-surfaceHighlight mb-2 bg-surfaceHighlight/30 rounded-t-xl -mx-2 -mt-2">
                                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-1">Account</p>
                                    <p className="text-xs font-bold text-text-main truncate">{user.email}</p>
                                </div>

                                <div className="space-y-1">
                                    <button
                                        onClick={() => {
                                            setShowSettings(true);
                                            setShowProfileMenu(false);
                                        }}
                                        className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm font-medium text-text-muted hover:text-text-main hover:bg-surfaceHighlight rounded-xl transition-all group"
                                    >
                                        <div className="p-1.5 rounded-lg bg-surfaceHighlight group-hover:bg-primary/10 transition-colors">
                                            <Icons.Settings className="w-4 h-4 group-hover:text-primary transition-colors" />
                                        </div>
                                        Settings
                                    </button>

                                    <Link
                                        to="/profile"
                                        onClick={() => setShowProfileMenu(false)}
                                        className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm font-medium text-text-muted hover:text-text-main hover:bg-surfaceHighlight rounded-xl transition-all group"
                                    >
                                        <div className="p-1.5 rounded-lg bg-surfaceHighlight group-hover:bg-primary/10 transition-colors">
                                            <Icons.User className="w-4 h-4 group-hover:text-primary transition-colors" />
                                        </div>
                                        Profile
                                    </Link>

                                    <button
                                        onClick={handleSignOut}
                                        className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/5 rounded-xl transition-all group"
                                    >
                                        <div className="p-1.5 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                                            <Icons.LogOut className="w-4 h-4" />
                                        </div>
                                        Sign Out
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className={`w-full flex items-center justify-between p-2 rounded-xl transition-all hover:bg-surfaceHighlight group ${showProfileMenu ? 'bg-surfaceHighlight' : ''}`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 p-[1px] shrink-0">
                                        <div className="w-full h-full rounded-full bg-surface flex items-center justify-center">
                                            <span className="text-xs font-bold text-primary">
                                                {(state.fullName || user.email || "").charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="min-w-0 text-left">
                                        <p className="text-xs font-bold text-text-main truncate">
                                            {state.fullName || user.email?.split('@')[0]}
                                        </p>
                                        <p className="text-[10px] text-text-muted truncate">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <div className="scale-75 origin-right">
                                        <ThemeToggle />
                                    </div>
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 w-full overflow-y-auto overflow-x-hidden no-scrollbar relative h-full">
                {/* Mobile Menu Toggle */}
                <div className="lg:hidden sticky top-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md z-30 border-b border-surfaceHighlight flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-0">
                        <img src="/favsnap.png" alt="SnapKit" className="w-6 h-6 object-contain" />
                        <span className="text-xl font-bold text-primary">SnapKit</span>
                    </Link>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 bg-surfaceHighlight rounded-lg text-text-main shadow-sm"
                    >
                        <Icons.Menu className="w-5 h-5" />
                    </button>
                </div>

                <div className="w-full max-w-5xl mx-auto py-8">
                    {state.imagePreview ? (
                        <div className="animate-fade-in flex flex-col items-center w-full">

                            {/* Top Row: Scanner + Config */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-start px-4 relative">
                                {/* Scanner View */}
                                <div className="z-10 relative">
                                    <Scanner
                                        image={state.imagePreview}
                                        isScanning={state.status === 'generating'}
                                        onClear={handleClear}
                                        progress={state.generationProgress}
                                    />
                                </div>

                                {/* Visual Connection Wire (Desktop) */}
                                <div className="hidden xl:flex items-center justify-center h-full absolute left-1/2 top-0 bottom-0 -ml-6 pointer-events-none z-0">
                                    <VisualCombiningEffect isGenerating={state.status === 'generating'} />
                                </div>

                                {/* Config Panel */}
                                <div className={`bg-white dark:bg-surface rounded-2xl shadow-xl border border-surfaceHighlight p-4 z-10 transition-all duration-500 ${(state.status === 'analyzing' || state.status === 'generating') ? 'card-node-active' : ''}`}>
                                    <h3 className="text-sm font-semibold text-text-main mb-4 flex items-center gap-2">
                                        <Icons.Settings className="w-4 h-4 text-primary" /> Configuration
                                    </h3>

                                    <div className="space-y-5">
                                        <div>
                                            <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">Tone of Voice</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['playful', 'professional', 'minimal', 'inspirational', 'funny'].map((t) => (
                                                    <button
                                                        key={t}
                                                        onClick={() => setState(prev => ({ ...prev, config: { ...prev.config, tone: t as any } }))}
                                                        className={`px-3 py-1.5 rounded-lg text-xs transition-all border
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
                                            <label className="text-xs font-medium text-text-muted">Include Emojis</label>
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

                            {/* Vertical Connector Wire (Config -> Results) */}
                            <div className="w-full flex justify-center -my-6 relative z-0 animate-fade-in">
                                <VisualCombiningEffect isGenerating={state.status === 'generating'} vertical={true} />
                            </div>

                            {/* Error Message */}
                            {state.error && (
                                <div className="bg-red-500/10 text-red-400 p-4 rounded-xl border border-red-500/20 flex items-start gap-3 animate-fade-in">
                                    <Icons.AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm">{state.error}</p>
                                </div>
                            )}

                            {/* Results Section */}
                            <div className={`w-full max-w-full mt-4 relative z-10 transition-all duration-500 ${state.status === 'generating' ? 'opacity-80' : ''}`}>
                                {!state.result && state.status === 'generating' ? (
                                    <div className="bg-white dark:bg-surface rounded-2xl shadow-xl border border-surfaceHighlight overflow-hidden animate-pulse">
                                        {/* Skeleton Header */}
                                        <div className="h-48 bg-gradient-to-r from-surfaceHighlight to-surfaceHighlight/50 p-8 flex flex-col justify-end gap-4">
                                            <div className="h-6 w-1/3 bg-white/10 rounded-full" />
                                            <div className="space-y-2">
                                                <div className="h-4 w-full bg-white/5 rounded-full" />
                                                <div className="h-4 w-2/3 bg-white/5 rounded-full" />
                                            </div>
                                            <div className="flex gap-2">
                                                {[1, 2, 3].map(i => <div key={i} className="h-8 w-20 bg-white/10 rounded-full" />)}
                                            </div>
                                        </div>
                                        {/* Skeleton Tabs */}
                                        <div className="flex border-b border-surfaceHighlight bg-surfaceHighlight/20 overflow-x-auto no-scrollbar snap-x snap-mandatory">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div key={i} className="px-8 py-5 border-b-2 border-transparent shrink-0 snap-start">
                                                    <div className="h-4 w-16 bg-surfaceHighlight rounded" />
                                                </div>
                                            ))}
                                        </div>
                                        {/* Skeleton Grid */}
                                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="h-64 bg-surfaceHighlight/30 rounded-xl border border-surfaceHighlight/50" />
                                            ))}
                                        </div>
                                    </div>
                                ) : state.result ? (
                                    <ResultsDashboard result={state.result} user={user} fullName={state.fullName} />
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

                <Link
                    to="/"
                    className="fixed bottom-8 right-8 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white rounded-full shadow-2xl shadow-primary/30 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-[100] group"
                    title="Home"
                >
                    <Icons.Home className="w-7 h-7" />
                </Link>

            </main >
        </div >
    );

};
