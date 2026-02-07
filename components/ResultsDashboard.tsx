import React, { useState, useEffect } from 'react';
import { SocialKitResult } from '../types';
import { Icons } from './ui/Icons';

interface ResultsDashboardProps {
  result: SocialKitResult;
  user?: any;
  fullName?: string;
}

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center space-x-1 text-xs font-medium text-text-muted hover:text-primary transition-colors bg-surfaceHighlight/50 px-2 py-1 rounded hover:bg-surfaceHighlight"
      title="Copy to clipboard"
    >
      {copied ? <Icons.Check className="w-3 h-3 text-accent" /> : <Icons.Copy className="w-3 h-3" />}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
};

const tabs = [
  { id: 'captions' as const, label: 'Captions', icon: Icons.Instagram },
  { id: 'hashtags' as const, label: 'Hashtags', icon: Icons.Hash },
  { id: 'scripts' as const, label: 'Video Scripts', icon: Icons.Video },
  { id: 'linkedin' as const, label: 'LinkedIn', icon: Icons.Linkedin },
  { id: 'twitter' as const, label: 'Twitter Thread', icon: Icons.Twitter },
] as const;

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ result, user, fullName: propFullName }) => {
  const [activeTab, setActiveTab] = useState<'captions' | 'hashtags' | 'scripts' | 'linkedin' | 'twitter'>('captions');
  const userDisplayName = propFullName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member';

  const [containerHeight, setContainerHeight] = useState<number | string>('auto');

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const tabsHeaderRef = React.useRef<HTMLDivElement>(null);
  const sectionRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  const suppressScrollSync = React.useRef(false);
  const isSwiping = React.useRef(false);

  // Function to update the container height based on the active section
  const updateHeight = () => {
    const index = tabs.findIndex(t => t.id === activeTab);
    const activeSection = sectionRefs.current[index];
    if (activeSection) {
      setContainerHeight(activeSection.scrollHeight);
    }
  };

  // Update height when tab changes or window resizes
  useEffect(() => {
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [activeTab, result]);

  // Handle tab clicks with suppression of the scroll listener to prevent glitchy feedback
  const handleTabClick = (tabId: typeof activeTab) => {
    if (activeTab === tabId) return;

    isSwiping.current = false;
    suppressScrollSync.current = true;
    setActiveTab(tabId as any);

    // Recovery timeout for scroll listener
    setTimeout(() => {
      suppressScrollSync.current = false;
    }, 600);
  };

  // Sync scroll position when tab is clicked or swiped
  useEffect(() => {
    // 1. Sync Content Container (ONLY for Tab Clicks)
    if (scrollContainerRef.current && !isSwiping.current) {
      const index = tabs.findIndex(t => t.id === activeTab);
      const container = scrollContainerRef.current;

      container.scrollTo({
        left: container.offsetWidth * index,
        behavior: 'smooth'
      });
    }

    // 2. Sync Tabs Header (ALWAYS)
    if (tabsHeaderRef.current) {
      const activeTabElement = tabsHeaderRef.current.querySelector(`[data-tab-id="${activeTab}"]`);
      if (activeTabElement) {
        activeTabElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }

    isSwiping.current = false;
  }, [activeTab]);

  // Handle manual swipe/scroll
  const handleScroll = () => {
    if (scrollContainerRef.current && !suppressScrollSync.current) {
      const container = scrollContainerRef.current;
      const index = Math.round(container.scrollLeft / container.offsetWidth);
      const newTab = tabs[index]?.id;
      if (newTab && newTab !== activeTab) {
        isSwiping.current = true;
        setActiveTab(newTab as any);
      }
    }
  };

  return (
    <div className="bg-surface rounded-2xl shadow-2xl border border-surfaceHighlight overflow-hidden w-full mx-auto animate-fade-in-up">
      {/* Analysis Banner */}
      <div className="bg-gradient-to-r from-primary to-primaryHover p-6 text-white relative overflow-hidden">
        {/* Subtle texture */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Icons.Sparkles className="w-5 h-5" />
              Content Generated
            </h2>
            <p className="text-white/80 mt-1 text-sm max-w-xl">{result.analysis.summary}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {result.analysis.keywords.map((k, i) => (
              <span key={i} className="px-3 py-1 bg-black/20 backdrop-blur-md border border-white/10 rounded-full text-xs font-medium text-white/90">
                #{k}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs - Carousel on mobile */}
      <div className="relative border-b border-surfaceHighlight bg-surfaceHighlight/30">
        <div
          ref={tabsHeaderRef}
          className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              onClick={() => handleTabClick(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all whitespace-nowrap border-b-2 shrink-0 snap-start
                ${activeTab === tab.id
                  ? 'text-primary border-primary bg-primary/5'
                  : 'text-text-muted border-transparent hover:text-text-main hover:bg-surfaceHighlight/50'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
        {/* Mobile scroll indicator gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-surfaceHighlight/50 to-transparent pointer-events-none md:hidden"></div>
      </div>

      {/* Scrollable Content Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{ height: containerHeight, transition: 'height 0.3s ease-in-out' }}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar bg-background/50 touch-pan-x items-start overflow-y-hidden"
      >
        {/* Captions Section */}
        <div
          ref={el => { sectionRefs.current[0] = el; }}
          className="w-full shrink-0 snap-center p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {result.captions.map((cap, idx) => (
              <div key={idx} className="bg-surface rounded-xl p-5 border border-surfaceHighlight flex flex-col h-full hover:border-primary/30 transition-colors shadow-lg shadow-black/20">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted bg-surfaceHighlight px-2 py-0.5 rounded">{cap.platform}</span>
                  <CopyButton text={cap.text} />
                </div>
                <div className="mb-4">
                  <span className="block text-xs font-semibold text-primary mb-1 uppercase tracking-wide">Hook</span>
                  <p className="text-text-main font-bold text-lg">{cap.hook}</p>
                </div>
                <div className="flex-grow">
                  <span className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wide">Caption</span>
                  <p className="text-text-muted text-sm leading-relaxed whitespace-pre-line">{cap.text}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-surfaceHighlight flex justify-between items-center gap-1">
                  <span className="text-xs text-accent font-medium">CTA</span>
                  <span className="text-xs text-text-main font-medium text-right">{cap.cta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hashtags Section */}
        <div
          ref={el => { sectionRefs.current[1] = el; }}
          className="w-full shrink-0 snap-center p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {result.hashtags.map((set, idx) => (
              <div key={idx} className="bg-surface rounded-xl p-5 border border-surfaceHighlight hover:border-primary/30 transition-colors shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-text-main">{set.category}</h3>
                  <CopyButton text={set.tags.join(' ')} />
                </div>
                <div className="bg-surfaceHighlight/30 p-3 rounded-lg border border-surfaceHighlight">
                  <p className="text-primary text-sm leading-7 font-medium">
                    {set.tags.map(t => t.startsWith('#') ? t : `#${t}`).join(' ')}
                  </p>
                </div>
                <p className="mt-3 text-xs text-text-muted flex items-center gap-1">
                  <Icons.Hash className="w-3 h-3" /> {set.tags.length} tags
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Scripts Section */}
        <div
          ref={el => { sectionRefs.current[2] = el; }}
          className="w-full shrink-0 snap-center p-6"
        >
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* TikTok */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2 text-text-main">
                  <Icons.Video className="w-5 h-5 text-primary" /> TikTok
                </h3>
                <CopyButton text={`${result.scripts.tiktok.title}\n\n${result.scripts.tiktok.scene_breakdown.map(s => `[${s.timestamp}] ${s.visual} (Audio: ${s.audio})`).join('\n')}`} />
              </div>
              <div className="bg-surface rounded-xl overflow-hidden border border-surfaceHighlight shadow-lg">
                <div className="p-4 bg-surfaceHighlight/50 border-b border-surfaceHighlight">
                  <h4 className="font-semibold text-primary">{result.scripts.tiktok.title}</h4>
                  <p className="text-sm text-text-muted mt-1">Hook: "{result.scripts.tiktok.hook}"</p>
                </div>
                <div className="p-4 space-y-4">
                  {result.scripts.tiktok.scene_breakdown.map((scene, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-16 flex-shrink-0 text-xs font-mono text-text-muted pt-1 border-r border-surfaceHighlight pr-2">{scene.timestamp}</div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-text-main">🎥 {scene.visual}</p>
                        <p className="text-sm text-text-muted italic">🔊 {scene.audio}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-surfaceHighlight/30 border-t border-surfaceHighlight text-center text-xs text-accent uppercase tracking-widest font-semibold">
                  CTA: {result.scripts.tiktok.cta}
                </div>
              </div>
            </div>

            {/* Shorts */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2 text-text-main">
                  <Icons.Youtube className="w-5 h-5 text-red-500" /> YouTube Shorts
                </h3>
                <CopyButton text={`${result.scripts.shorts.title}\n\n${result.scripts.shorts.scene_breakdown.map(s => `[${s.timestamp}] ${s.visual} (Audio: ${s.audio})`).join('\n')}`} />
              </div>
              <div className="bg-surface rounded-xl overflow-hidden border border-surfaceHighlight shadow-lg">
                <div className="p-4 bg-surfaceHighlight/50 border-b border-surfaceHighlight">
                  <h4 className="font-semibold text-red-400">{result.scripts.shorts.title}</h4>
                  <p className="text-sm text-text-muted mt-1">Hook: "{result.scripts.shorts.hook}"</p>
                </div>
                <div className="p-4 space-y-4">
                  {result.scripts.shorts.scene_breakdown.map((scene, i) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="w-16 flex-shrink-0 text-xs font-mono text-text-muted pt-1 border-r border-surfaceHighlight pr-2">{scene.timestamp}</div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-text-main">🎥 {scene.visual}</p>
                        <p className="text-sm text-text-muted italic">🔊 {scene.audio}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-surfaceHighlight/30 border-t border-surfaceHighlight text-center text-xs text-red-400 uppercase tracking-widest font-semibold">
                  CTA: {result.scripts.shorts.cta}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LinkedIn Section */}
        <div
          ref={el => { sectionRefs.current[3] = el; }}
          className="w-full shrink-0 snap-center p-6"
        >
          <div className="max-w-2xl mx-auto">
            <div className="bg-surface rounded-xl border border-surfaceHighlight shadow-lg p-6">
              <div className="flex justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 flex items-center justify-center rounded-full border border-primary/20">
                    <span className="text-primary font-bold uppercase">{userDisplayName[0]}</span>
                  </div>
                  <div>
                    <div className="font-bold text-sm text-text-main leading-tight">{userDisplayName}</div>
                  </div>
                </div>
                <CopyButton text={result.linkedin_post} />
              </div> 
              <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap text-text-main">
                {result.linkedin_post}
              </div>
            </div>
          </div>
        </div>

        {/* Twitter Section */}
        <div
          ref={el => { sectionRefs.current[4] = el; }}
          className="w-full shrink-0 snap-center p-6"
        >
          <div className="max-w-xl mx-auto space-y-4">
            {result.twitter_thread.map((tweet, i) => (
              <div key={i} className="relative pl-8">
                {/* Thread line */}
                {i < result.twitter_thread.length - 1 && (
                  <div className="absolute left-3 top-12 bottom-0 w-0.5 bg-surfaceHighlight -mb-4 z-0"></div>
                )}
                <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-background border border-surfaceHighlight flex items-center justify-center text-xs font-bold text-text-muted z-10">
                  {i + 1}
                </div>
                <div className="bg-surface rounded-xl border border-surfaceHighlight p-4 shadow-sm hover:border-primary/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 flex items-center justify-center rounded-full border border-primary/20">
                        <span className="text-primary text-xs font-bold uppercase">{userDisplayName[0]}</span>
                      </div>
                      <div>
                        <div className="font-bold text-sm text-text-main leading-none mb-0.5">{userDisplayName}</div>
                        <div className="text-text-muted text-xs leading-none">@{userDisplayName.toLowerCase().replace(/\s+/g, '')}</div>
                      </div>
                    </div>
                    <CopyButton text={tweet} />
                  </div>
                  <p className="text-text-main text-sm whitespace-pre-wrap">{tweet}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};