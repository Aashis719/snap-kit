import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { UploadZone } from './components/UploadZone';
import { ResultsDashboard } from './components/ResultsDashboard';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AuthModal } from './components/AuthModal';
import { HistorySidebar } from './components/HistorySidebar';
import { Footer } from './components/Footer';
import { generateContent, fileToGenerativePart } from './services/geminiService';
import { uploadImageToCloudinary } from './services/cloudinaryService';
import { saveGeneration, getUserApiKey, updateUserApiKey, getAdminKeyForFreeTier, incrementFreeUsage, getUserFreeGenerationStats } from './services/supabaseService';
import { VisualFlowConnector } from './components/VisualFlowConnector';
import { supabase } from './lib/supabase';
import { AppState, SocialKitConfig } from './types';
import { Icons } from './components/ui/Icons';
import { Features } from './components/pages/Features';
import { About } from './components/pages/About';
import { PrivacyPolicy } from './components/pages/PrivacyPolicy';
import { NotFound } from './components/pages/NotFound';
import { AuthCallback } from './components/pages/AuthCallback';
import { ThemeToggle } from './components/ThemeToggle';
import { FreeGenerationBadge } from './components/FreeGenerationBadge';
import { Analytics } from '@vercel/analytics/react';

const DEFAULT_CONFIG: SocialKitConfig = {
  tone: 'playful',
  platforms: ['Instagram', 'TikTok', 'LinkedIn', 'Twitter'],
  includeEmoji: true,
  language: 'English'
};

const Content: React.FC = () => {
  const [state, setState] = useState<AppState>({
    status: 'idle',
    imageFile: null,
    imagePreview: null,
    config: DEFAULT_CONFIG,
    result: null,
    error: null,
    apiKey: '' // Will be loaded from database when user logs in
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      // Load API key from database if user is logged in
      if (session?.user) {
        loadUserApiKey(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // Load API key when user logs in
      if (session?.user) {
        loadUserApiKey(session.user.id);
      } else {
        // Clear API key when user logs out
        setState(prev => ({ ...prev, apiKey: '' }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-menu-container')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load user's API key and credits from database
  const loadUserApiKey = async (userId: string) => {
    try {
      const stats = await getUserFreeGenerationStats(userId);
      setState(prev => ({
        ...prev,
        apiKey: stats.gemini_api_key || '',
        creditsRemaining: stats.remaining
      }));
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  // Clear file handler
  const handleClear = () => {
    setState(prev => ({
      ...prev,
      imageFile: null,
      imagePreview: null,
      result: null,
      status: 'idle',
      error: null
    }));
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setState(prev => ({
      ...prev,
      imageFile: file,
      imagePreview: previewUrl,
      status: 'idle', // Ready to generate
      error: null
    }));
  };

  // Handle Generation
  const handleGenerate = async () => {
    if (!state.imageFile) return;

    if (!user) {
      setShowAuth(true);
      return;
    }

    const hasOwnKey = state.apiKey && state.apiKey.trim() !== '';
    const hasCredits = (state.creditsRemaining ?? 0) > 0;

    if (!hasOwnKey && !hasCredits) {
      setShowSettings(true);
      return;
    }

    setState(prev => ({ ...prev, status: 'generating', error: null }));

    try {
      // 1. Upload to Cloudinary
      const uploadResult = await uploadImageToCloudinary(state.imageFile);
      const mimeType = state.imageFile.type;

      let result: any;
      let newCredits: number | undefined = state.creditsRemaining;

      if (hasOwnKey) {
        // Use user's own API key directly (unlimited)
        const base64Data = await fileToGenerativePart(state.imageFile);
        result = await generateContent(state.apiKey, base64Data, mimeType, state.config);

        await saveGeneration(
          user.id,
          uploadResult.url,
          uploadResult.publicId,
          state.config,
          result,
          { api_key_source: 'user' }
        );
      } else {
        // Use Database-level key rotation (bypasses Edge Function)
        let retryCount = 0;
        const maxRetries = 3;
        let success = false;

        while (retryCount < maxRetries && !success) {
          try {
            const { key: adminKey, id: adminKeyId } = await getAdminKeyForFreeTier();
            const base64Data = await fileToGenerativePart(state.imageFile);

            // Generate content using the admin key (Gemini 2.0 Flash)
            result = await generateContent(adminKey, base64Data, mimeType, state.config);

            // Save generation record with admin billing details
            await saveGeneration(
              user.id,
              uploadResult.url,
              uploadResult.publicId,
              state.config,
              result,
              { api_key_source: 'admin', admin_key_id: adminKeyId }
            );

            // Decrement user's free credits
            await incrementFreeUsage(user.id);
            newCredits = (state.creditsRemaining ?? 1) - 1;
            success = true;
          } catch (error: any) {
            // If it's a rate limit/quota error, try the next key automatically
            if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('limit')) {
              console.warn(`Key rate limited. Automatically rotating to next key... (Attempt ${retryCount + 1})`);
              retryCount++;
              if (retryCount >= maxRetries) throw error;
              await new Promise(r => setTimeout(r, 300));
            } else {
              throw error;
            }
          }
        }
      }

      setState(prev => ({
        ...prev,
        status: 'complete',
        result,
        creditsRemaining: newCredits
      }));
    } catch (err: any) {
      console.error(err);
      setState(prev => ({
        ...prev,
        status: 'error',
        error: err.message || "Something went wrong. Please check your API key or credits."
      }));
    }
  };

  const saveApiKey = async (key: string) => {
    if (!user) {
      console.error('User must be logged in to save API key');
      return;
    }

    try {
      // Save to database
      await updateUserApiKey(user.id, key);
      // Refresh user stats (key and credits)
      await loadUserApiKey(user.id);
      setShowSettings(false);
    } catch (error) {
      console.error('Failed to save API key:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to save API key. Please try again.'
      }));
    }
  };

  const loadFromHistory = (result: any, imageUrl: string) => {
    setState(prev => ({
      ...prev,
      result,
      imagePreview: imageUrl,
      // We don't have the original File object, so imageFile remains what it was or null.
      // This is fine for viewing credentials results.
      status: 'complete'
    }));
    setShowHistory(false);
  };

  return (
    <div className="min-h-screen bg-background text-text-main pb-10 md:pb-5 relative flex flex-col">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 z-0 bg-grid-pattern pointer-events-none fixed"></div>

      {/* Pro Full-Width Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all duration-300 supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 lg:px-6 h-16 md:h-20 flex items-center justify-between max-w-7xl">
          {/* Logo Section */}
          <a href='/' className="flex items-center gap-0 group focus:outline-none">
            <div className="relative w-10 h-10 flex items-center justify-center  rounded-xl group-hover:scale-105 transition-transform duration-300 ">
              <img src="/snapkit.png" alt="SnapKit" className="w-full h-full object-cover rounded-xl opacity-90 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-2xl font-bold text-primary tracking-tight group-hover:text-primary transition-colors">
              SnapKit
            </span>
          </a>

          {/* Desktop Navigation - Minimalist */}
          <nav className="hidden md:flex items-center gap-8">
            {['Home', 'Features', 'About'].map((item) => (
              <Link
                key={item}
                to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                className={`text-base font-medium transition-colors hover:text-primary relative group py-1
                    ${location.pathname === (item === 'Home' ? '/' : `/${item.toLowerCase()}`)
                    ? 'text-primary'
                    : 'text-text-muted'}`}
              >
                {item}
                {/* Hover Underline Animation */}
                <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full transform origin-left transition-transform duration-300 ${location.pathname === (item === 'Home' ? '/' : `/${item.toLowerCase()}`) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3 md:gap-4">
            <div className="hidden md:block">
              <ThemeToggle />
            </div>

            <div className="h-6 w-px bg-border/50 hidden md:block"></div>

            {user && (
              <div className="hidden sm:block">
                <FreeGenerationBadge
                  remaining={state.creditsRemaining ?? 0}
                  limit={3}
                  hasOwnKey={!!(state.apiKey && state.apiKey.trim() !== '')}
                />
              </div>
            )}

            {user ? (
              <div className="relative user-menu-container">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-surfaceHighlight/50 transition-colors border border-transparent hover:border-border/50"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 p-[1px]">
                    <div className="w-full h-full rounded-full bg-surface flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{user.email?.charAt(0).toUpperCase()}</span>
                    </div>
                  </div>
                  <Icons.ChevronRight className={`w-4 h-4 text-text-muted transition-transform duration-300 ${showProfileMenu ? 'rotate-90' : 'rotate-0'}`} />
                </button>

                {/* Dropdown Menu */}
                <div className={`absolute top-full right-0 mt-4 w-60 bg-surface border border-border/50 rounded-2xl shadow-2xl p-2 transform transition-all duration-200 origin-top-right ring-1 ring-black/5 ${showProfileMenu ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
                  <div className="px-4 py-3 border-b border-border/40 mb-2 bg-surfaceHighlight/30 rounded-t-xl -mx-2 -mt-2">
                    <p className="text-xs text-text-muted font-medium mb-0.5">Signed in as</p>
                    <p className="text-sm font-semibold text-text-main truncate">{user.email}</p>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setShowHistory(true);
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-text-muted hover:text-text-main hover:bg-surfaceHighlight/50 rounded-xl transition-all group"
                    >
                      <div className="p-1.5 rounded-lg bg-surfaceHighlight group-hover:bg-primary/10 transition-colors">
                        <Icons.History className="w-4 h-4 group-hover:text-primary transition-colors" />
                      </div>
                      History
                    </button>
                    <button
                      onClick={() => {
                        setShowSettings(true);
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-text-muted hover:text-text-main hover:bg-surfaceHighlight/50 rounded-xl transition-all group"
                    >
                      <div className="p-1.5 rounded-lg bg-surfaceHighlight group-hover:bg-primary/10 transition-colors">
                        <Icons.Settings className="w-4 h-4 group-hover:text-primary transition-colors" />
                      </div>
                      Settings
                    </button>
                  </div>

                  <div className="mt-2 pt-2 border-t border-border/40">
                    <button
                      onClick={() => {
                        supabase.auth.signOut();
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/5 rounded-xl transition-all group"
                    >
                      <div className="p-1.5 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                        <Icons.LogOut className="w-4 h-4" />
                      </div>
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="hidden md:flex px-6 py-2.5 bg-primary hover:bg-primaryHover text-white shadow-lg shadow-primary/25 rounded-full text-sm font-bold transition-all transform hover:scale-[1.02] active:scale-95"
              >
                Sign In
              </button>
            )}

            {/* Mobile Actions */}
            <div className="flex items-center gap-3 md:hidden">
              {/* <ThemeToggle /> */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2.5 text-text-muted hover:text-primary hover:bg-primary/5 rounded-xl transition-colors border border-transparent hover:border-primary/20"
              >
                <Icons.Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 lg:px-8 pt-8 lg:pt-10 max-w-[1600px] relative z-10 w-full">
        <Routes>
          <Route path="/" element={
            <>
              {/* Intro Hero (Only if idle or no image) */}
              {!state.imagePreview && (
                <div className="relative text-center max-w-5xl mx-auto mb-24 md:mt-20 mt-10  animate-fade-in z-0 overflow-hidden md:overflow-visible">

                  {/* Floating Social Icons (Background) */}
                  <div className="absolute top-0 w-full h-full pointer-events-none z-[-1]">
                    {/* Left Side */}
                    <div className="absolute md:top-1 md:left-[0.5%] top-20 left-[5%] opacity-20 dark:opacity-10 animate-float" style={{ animationDelay: '0s' }}>
                      <Icons.Instagram className="w-8 h-8 md:w-12 md:h-12 text-pink-500 rotate-12 transform" />
                    </div>
                    <div className="absolute top-72 md:top-1 right-[6%] md:right-[10%] opacity-20 dark:opacity-10 animate-float" style={{ animationDelay: '2s' }}>
                      <Icons.Linkedin className="w-8 h-8 md:w-10 md:h-10 text-blue-500 -rotate-12 transform" />
                    </div>

                    {/* Right Side */}
                    <div className="absolute top-36 md:top-40 right-[10%] md:right-[15%] opacity-20 dark:opacity-10 animate-float" style={{ animationDelay: '1.5s' }}>
                      <Icons.Video className="w-10 h-10 md:w-14 md:h-14 text-black dark:text-white rotate-6 transform" />
                    </div>
                    <div className="absolute top-72 md:top-64 right-[76%] md:right-[84%] opacity-20 dark:opacity-10 animate-float" style={{ animationDelay: '3s' }}>
                      <Icons.Twitter className="w-8 h-8 md:w-10 md:h-10 text-blue-400 rotate-[-8deg] transform" />
                    </div>
                  </div>

                  {/* Background Radial Glow */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] md:w-[800px] md:h-[800px] bg-gradient-radial from-primary/10 to-transparent rounded-full blur-[60px] md:blur-[120px] pointer-events-none"></div>

                  {/* Badge */}
                  {/* <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface/50 border border-border/50 backdrop-blur-md shadow-sm mb-10 hover:border-primary/30 transition-colors animate-fade-in-up">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="animate-pulse relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                    </span>
                    <span className="text-xs font-bold text-text-main tracking-widest uppercase opacity-80">v1.0 Now Live</span>
                  </div> */}

                  {/* Main Headline */}
                  <h1 className="relative text-5xl md:text-8xl font-black text-text-main mb-8 tracking-tighter leading-[1] drop-shadow-sm animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    Transform <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-500 animate-gradient-x">Photos</span> into <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-500 animate-gradient-x">Viral</span> content
                    <br className="hidden md:block" />
                  </h1>
                  {/* Subtitle */}
                  <p className="text-xl md:text-2xl text-text-muted mb-12 leading-relaxed max-w-3xl mx-auto font-light">
                    Upload your image and let SnapKit generate scroll-stopping
                    <span className="text-text-main font-semibold"> captions, hashtags, and scripts</span> for every platform in seconds.
                  </p>

                  {/* Feature Pills */}
                  <div className="flex flex-wrap justify-center gap-3 mb-12">
                    <div className="flex items-center gap-2 px-4 py-2 bg-surfaceHighlight rounded-full border border-border">
                      <Icons.Brain className="w-4 h-4 text-primary" />
                      <span className="text-sm text-text-main font-medium">AI-Powered</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-surfaceHighlight rounded-full border border-border">
                      <Icons.Rocket className="w-4 h-4 text-accent" />
                      <span className="text-sm text-text-main font-medium">Instant Results</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-surfaceHighlight rounded-full border border-border">
                      <Icons.Share2 className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-text-main font-medium">Multi-Platform</span>
                    </div>
                  </div>

                  {/* Upload Zone / CTA */}
                  <div className="max-w-lg mx-auto relative group">
                    {/* Glow effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>

                    <div className="relative bg-surface rounded-2xl p-1 border border-surfaceHighlight">
                      {user ? (
                        <UploadZone onFileSelect={handleFileSelect} />
                      ) : (
                        <div className="py-16 px-8 text-center border-2 border-dashed border-surfaceHighlight rounded-xl bg-gradient-to-b from-background/50 to-surfaceHighlight/20">
                          <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/30">
                            <Icons.Upload className="w-10 h-10 text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-text-main mb-3 flex items-center justify-center gap-2">
                            Start Creating Magic
                            <Icons.Wand2 className="w-5 h-5 text-primary" />
                          </h3>
                          <p className="text-text-muted mb-8 text-sm max-w-sm mx-auto">
                            Sign in to upload your first image and watch SnapKit transform it into scroll-stopping content.
                          </p>
                          <button
                            onClick={() => setShowAuth(true)}
                            className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-purple-600 hover:to-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 transition-all transform hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/40"
                          >
                            Get Started Free
                          </button>
                          <p className="text-xs text-text-muted mt-4">
                            No credit card required • {user ? (
                              <span className="text-primary font-semibold">
                                {state.creditsRemaining ?? 0} generations remaining
                              </span>
                            ) : (
                              '3 free generations'
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Social Proof / Stats */}
                  <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-text-main mb-1">100+</div>
                      <div className="text-sm text-text-muted">Content Generated</div>
                    </div>
                    <div className="text-center border-x border-surfaceHighlight">
                      <div className="text-3xl font-bold text-text-main mb-1">5+</div>
                      <div className="text-sm text-text-muted">Platforms Supported</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-text-main mb-1">&lt;15s</div>
                      <div className="text-sm text-text-muted">Average Generation</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Setup Area - Split View for Desktop */}
              {state.imagePreview && (
                <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-10">
                  {/* Visual Flow Bridge */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden lg:overflow-visible z-10">
                    <VisualFlowConnector status={state.status} />
                  </div>

                  {/* LEFT COLUMN: Sidebar (Sticky on Desktop) */}
                  <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">

                    {/* Image Preview Card */}
                    <div className={`bg-white dark:bg-surface rounded-2xl shadow-xl border border-surfaceHighlight overflow-hidden group relative transition-all duration-500 ${(state.status === 'uploading' || state.status === 'analyzing' || state.status === 'generating') ? 'card-node-active' : ''}`}>
                      <div className="aspect-square relative overflow-hidden bg-black/50">
                        <img
                          src={state.imagePreview}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                          <button
                            onClick={handleClear}
                            className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform"
                            title="Remove Image"
                          >
                            <Icons.X className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Config Panel */}
                    <div className={`bg-white dark:bg-surface rounded-2xl shadow-xl border border-surfaceHighlight p-6 animate-fade-in-up transition-all duration-500 ${(state.status === 'analyzing' || state.status === 'generating') ? 'card-node-active' : ''}`}>
                      <h3 className="font-semibold text-text-main mb-4 flex items-center gap-2">
                        <Icons.Settings className="w-4 h-4 text-primary" /> Configuration
                      </h3>

                      <div className="space-y-6">
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
                          <div className="pt-4 flex justify-center">
                            <FreeGenerationBadge
                              remaining={state.creditsRemaining ?? 0}
                              limit={3}
                              hasOwnKey={!!(state.apiKey && state.apiKey.trim() !== '')}
                            />
                          </div>
                        )}

                        <button
                          onClick={handleGenerate}
                          disabled={state.status === 'generating' || state.status === 'complete'}
                          className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all mt-4
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

                    {/* Error Message */}
                    {state.error && (
                      <div className="bg-red-500/10 text-red-400 p-4 rounded-xl border border-red-500/20 flex items-start gap-3 animate-fade-in">
                        <Icons.AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p className="text-sm">{state.error}</p>
                      </div>
                    )}
                  </div>

                  {/* RIGHT COLUMN: Results Dashboard */}
                  <div className={`lg:col-span-8 animate-fade-in-up space-y-6 transition-all duration-500 ${state.status === 'generating' ? 'card-node-content-active' : ''}`}>
                    {!state.result && state.status === 'generating' && (
                      <div className="h-full min-h-[500px] flex flex-col items-center justify-center rounded-2xl bg-white/40 dark:bg-surface/50 backdrop-blur-sm border border-border/50">
                        <div className="flex flex-col items-center space-y-6">
                          {/* Simple spinner */}
                          <div className="relative w-16 h-16">
                            <div className="absolute inset-0 border-4 border-surfaceHighlight rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
                          </div>

                          {/* Loading text */}
                          <div className="text-center">
                            <p className="text-text-muted text-sm">
                              Generating your content...
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {!state.result && state.status !== 'generating' && (
                      <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-border/40 rounded-2xl bg-white/20 dark:bg-surface/50 text-text-muted">
                        <Icons.Sparkles className="w-10 h-10 text-primary mb-4" />
                        <p className="text-lg">Ready to generate content.</p>
                        <p className="text-sm opacity-60">Configure your settings on the left and hit generate.</p>
                      </div>
                    )}

                    {state.result && (
                      <>
                        <ResultsDashboard result={state.result} />

                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          } />
          <Route path="/features" element={<Features />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <ApiKeyModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={saveApiKey}
        currentKey={state.apiKey}
      />

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={() => console.log('Auth success')}
      />

      <HistorySidebar
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        userId={user?.id}
        onSelect={loadFromHistory}
      />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

      {/* Footer */}
      <Footer />

      {/* Mobile Navigation Sidebar */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-opacity duration-300 md:hidden ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Side Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-[280px] bg-surface border-l border-surfaceHighlight shadow-2xl transform transition-transform duration-300 ease-out md:hidden flex flex-col ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="p-5 flex items-center justify-between border-b border-surfaceHighlight/50">
          <span className="font-bold text-lg text-text-main tracking-tight">Menu</span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-text-muted hover:text-text-main hover:bg-white/5 rounded-full transition-colors"
            >
              <Icons.X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 py-6 px-4 flex flex-col gap-2 overflow-y-auto">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${location.pathname === '/'
              ? 'bg-primary/10 text-primary font-medium border border-primary/20'
              : 'text-text-muted hover:text-text-main hover:bg-surfaceHighlight'
              }`}
          >
            <Icons.Home className="w-5 h-5" />
            Home
          </Link>
          <Link
            to="/features"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${location.pathname === '/features'
              ? 'bg-primary/10 text-primary font-medium border border-primary/20'
              : 'text-text-muted hover:text-text-main hover:bg-surfaceHighlight'
              }`}
          >
            <Icons.Zap className="w-5 h-5" />
            Features
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${location.pathname === '/about'
              ? 'bg-primary/10 text-primary font-medium border border-primary/20'
              : 'text-text-muted hover:text-text-main hover:bg-surfaceHighlight'
              }`}
          >
            <Icons.Globe className="w-5 h-5" />
            About
          </Link>
          <Link
            to="/privacy-policy"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${location.pathname === '/privacy-policy'
              ? 'bg-primary/10 text-primary font-medium border border-primary/20'
              : 'text-text-muted hover:text-text-main hover:bg-surfaceHighlight'
              }`}
          >
            <Icons.Shield className="w-5 h-5" />
            Privacy Policy
          </Link>
        </div>

        <div className="px-4 pb-4">
          {user ? (
            <button
              onClick={() => {
                supabase.auth.signOut();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-muted hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
            >
              <Icons.LogOut className="w-5 h-5" />
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => {
                setShowAuth(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-medium border border-primary/20 hover:bg-primary/20 transition-all justify-center"
            >
              <Icons.LogIn className="w-5 h-5" />
              Sign In
            </button>
          )}
        </div>

        <div className="p-5 border-t border-surfaceHighlight/50 bg-black/20">
          <p className="text-xs text-text-muted text-center">
            © 2026 SnapKit. All rights reserved.
          </p>
        </div>
      </div>
    </div >
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Analytics />
      <Content />
    </Router>
  )
}

export default App;
