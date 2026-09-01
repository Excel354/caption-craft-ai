/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, RotateCcw, AlertCircle, Layers, CheckCircle2, AlertTriangle, X, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { PlatformSelector } from './components/PlatformSelector';
import { IdeaInput } from './components/IdeaInput';
import { CaptionCard } from './components/CaptionCard';
import { HashtagsCard } from './components/HashtagsCard';
import { QuotaBanner } from './components/QuotaBanner';
import { UpgradeModal } from './components/UpgradeModal';
import { AuthModal } from './components/AuthModal';
import { PlatformPreviewModal } from './components/PlatformPreviewModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { AnnouncementsDrawer } from './components/AnnouncementsDrawer';
import { OnboardingModal } from './components/OnboardingModal';
import { AdminPage } from './components/AdminPage';
import { PlatformId, CaptionVariation } from './types';
import { PLATFORMS } from './constants/platforms';

function MainGenerator({ onOpenAdmin }: { onOpenAdmin: () => void }) {
  const { token, user, usage, updateUsage, openUpgradeModal, saveCaption } = useAuth();

  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState<PlatformId>('instagram');
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [tone, setTone] = useState('');

  const [captions, setCaptions] = useState<CaptionVariation[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  // Fallback & Auto-retry states
  const [isFallback, setIsFallback] = useState(false);
  const [fallbackReason, setFallbackReason] = useState<'high_demand' | 'api_error' | 'no_key' | null>(null);
  const [isFallbackBannerDismissed, setIsFallbackBannerDismissed] = useState(false);
  const [bgRetryCount, setBgRetryCount] = useState(0);
  const [isBgRetrying, setIsBgRetrying] = useState(false);
  const [successNotification, setSuccessNotification] = useState<string | null>(null);

  // Preview Modal
  const [previewCaption, setPreviewCaption] = useState<string | null>(null);

  // History Drawer
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Onboarding Explainer Modal
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    return !localStorage.getItem('hide_caption_onboarding');
  });

  useEffect(() => {
    if (user?.hasSeenOnboarding) {
      setIsOnboardingOpen(false);
    }
  }, [user?.hasSeenOnboarding]);

  // Background auto-retry refs
  const bgRetryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeParamsRef = useRef<{ topic: string; platform: PlatformId; includeEmojis: boolean; tone: string } | null>(null);
  const retryCountRef = useRef(0);

  // Check if daily quota is reached
  const isLimitReached = usage ? usage.limit !== -1 && usage.count >= usage.limit : false;

  const clearBackgroundRetry = () => {
    if (bgRetryTimerRef.current) {
      clearTimeout(bgRetryTimerRef.current);
      bgRetryTimerRef.current = null;
    }
    activeParamsRef.current = null;
    retryCountRef.current = 0;
    setBgRetryCount(0);
    setIsBgRetrying(false);
  };

  useEffect(() => {
    return () => {
      clearBackgroundRetry();
    };
  }, []);

  const triggerBackgroundAutoRetry = (params: { topic: string; platform: PlatformId; includeEmojis: boolean; tone: string }) => {
    if (retryCountRef.current >= 5) {
      setIsBgRetrying(false);
      return;
    }

    if (bgRetryTimerRef.current) {
      clearTimeout(bgRetryTimerRef.current);
    }

    setIsBgRetrying(true);

    bgRetryTimerRef.current = setTimeout(async () => {
      // Ensure user hasn't switched topics or platforms in the meantime
      if (
        !activeParamsRef.current ||
        activeParamsRef.current.topic !== params.topic ||
        activeParamsRef.current.platform !== params.platform
      ) {
        return;
      }

      retryCountRef.current += 1;
      setBgRetryCount(retryCountRef.current);

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token || ''}`,
          },
          body: JSON.stringify({
            topic: params.topic.trim(),
            platform: params.platform,
            includeEmojis: params.includeEmojis,
            tone: params.tone || undefined,
          }),
        });

        if (!res.ok) {
          throw new Error('Background retry attempt non-ok status');
        }

        const data = await res.json();

        // Check if generation parameters still match
        if (
          !activeParamsRef.current ||
          activeParamsRef.current.topic !== params.topic ||
          activeParamsRef.current.platform !== params.platform
        ) {
          return;
        }

        if (data.success && !data.isFallback) {
          // Success! Real AI-generated captions obtained!
          setCaptions(data.captions || []);
          setHashtags(data.hashtags || []);
          setIsFallback(false);
          setFallbackReason(null);
          setSuccessNotification('Good news — AI-generated captions are ready! Refreshing your results.');

          if (data.usage) {
            updateUsage(data.usage);
          }

          confetti({
            particleCount: 35,
            spread: 65,
            origin: { y: 0.65 },
            colors: ['#4f46e5', '#10b981', '#f59e0b'],
          });

          clearBackgroundRetry();

          // Auto-hide success toast after 6 seconds
          setTimeout(() => {
            setSuccessNotification(null);
          }, 6000);
          return;
        }

        // Still fallback: schedule next retry if under cap
        if (retryCountRef.current < 5) {
          triggerBackgroundAutoRetry(params);
        } else {
          setIsBgRetrying(false);
        }
      } catch (err) {
        console.warn('[Background Retry] Attempt encountered error:', err);
        if (retryCountRef.current < 5) {
          triggerBackgroundAutoRetry(params);
        } else {
          setIsBgRetrying(false);
        }
      }
    }, 22000); // Retry every 22 seconds
  };

  const handleGenerate = async () => {
    if (!topic.trim() || isLoading) return;

    // Clear any previous background auto-retry loops
    clearBackgroundRetry();

    setIsLoading(true);
    setError(null);
    setIsQuotaExceeded(false);
    setSuccessNotification(null);
    setIsFallbackBannerDismissed(false);

    const currentParams = {
      topic: topic.trim(),
      platform,
      includeEmojis,
      tone,
    };
    activeParamsRef.current = currentParams;

    let res: Response | null = null;
    let attempts = 0;
    const maxFetchAttempts = 2;

    while (attempts < maxFetchAttempts) {
      attempts++;
      try {
        res = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token || ''}`,
          },
          body: JSON.stringify({
            topic: topic.trim(),
            platform,
            includeEmojis,
            tone: tone || undefined,
          }),
        });
        break;
      } catch (networkErr: any) {
        if (attempts >= maxFetchAttempts) {
          console.error('Fetch network failure:', networkErr);
          setError('Connection temporarily unavailable. Please verify your internet or try again.');
          setIsLoading(false);
          return;
        }
        await new Promise(r => setTimeout(r, 600));
      }
    }

    if (!res) {
      setIsLoading(false);
      return;
    }

    try {
      const rawText = await res.text();
      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch {
        if (!res.ok) {
          throw new Error(`Server temporarily busy (status ${res.status}). Please try again.`);
        }
        throw new Error('Unexpected response format from server. Please try again.');
      }

      if (res.status === 429 || data.quotaExceeded) {
        setIsQuotaExceeded(true);
        setError(data.error || 'Daily generation limit reached for your plan.');
        if (data.usage) {
          updateUsage(data.usage);
        }
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate captions. Please try again.');
      }

      setCaptions(data.captions || []);
      setHashtags(data.hashtags || []);

      if (user?.id && data.captions && data.captions.length > 0) {
        saveCaption({
          id: 'cap_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          platform,
          topic: topic.trim(),
          caption: data.captions[0].text,
          hashtags: data.hashtags || [],
          tone: tone || undefined,
          createdAt: new Date().toISOString(),
          isFavorite: false,
        }).catch(() => {});
      }

      if (data.usage) {
        updateUsage(data.usage);
      }

      if (data.isFallback) {
        setIsFallback(true);
        setFallbackReason(data.fallbackReason || 'high_demand');
        // Start background auto-retry loop for real AI captions
        triggerBackgroundAutoRetry(currentParams);
      } else {
        setIsFallback(false);
        setFallbackReason(null);
        // Trigger celebratory confetti on real AI generation
        confetti({
          particleCount: 25,
          spread: 60,
          origin: { y: 0.7 },
        });
      }

      // Smooth scroll to results on mobile
      setTimeout(() => {
        const resultsEl = document.getElementById('results-section');
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'An unexpected error occurred while generating captions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopicChange = (newTopic: string) => {
    setTopic(newTopic);
    if (isBgRetrying) {
      clearBackgroundRetry();
    }
  };

  const handlePlatformChange = (newPlatform: PlatformId) => {
    setPlatform(newPlatform);
    if (isBgRetrying) {
      clearBackgroundRetry();
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex flex-col font-sans transition-colors selection:bg-indigo-600 selection:text-white">
      <Header
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenUpgrade={openUpgradeModal}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenAdmin={onOpenAdmin}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Daily Quota Alert Banner (if limit reached) */}
        <QuotaBanner onOpenUpgrade={openUpgradeModal} />

        {/* Top App Description / Title intro */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-slate-200/70 text-slate-700 dark:bg-slate-900 dark:text-slate-300 border border-slate-300 dark:border-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            PLATFORM-AWARE COPY ENGINE
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 font-sans">
            Turn Any Raw Concept Into High-Engagement Captions
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-serif italic max-w-xl mx-auto">
            Synthesize 3–5 tailored copy angles and targeted hashtag matrices enforcing character budgets.
          </p>
        </div>

        {/* Input & Configuration Section */}
        <div className="space-y-4">
          {/* Platform Selector */}
          <PlatformSelector
            selectedPlatform={platform}
            onSelect={handlePlatformChange}
            disabled={isLoading}
          />

          {/* Idea Input Card */}
          <IdeaInput
            topic={topic}
            onChangeTopic={handleTopicChange}
            includeEmojis={includeEmojis}
            onToggleEmojis={setIncludeEmojis}
            tone={tone}
            onChangeTone={setTone}
            onGenerate={handleGenerate}
            isLoading={isLoading}
            isQuotaExceeded={isLimitReached || isQuotaExceeded}
            selectedPlatform={platform}
          />
        </div>

        {/* Real-time Success Notification */}
        {successNotification && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="font-semibold font-sans">{successNotification}</p>
            </div>
            <button
              type="button"
              onClick={() => setSuccessNotification(null)}
              className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 p-1 rounded hover:bg-emerald-500/10 transition"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-start justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold font-mono">{error}</p>
                {isQuotaExceeded ? (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={openUpgradeModal}
                      className="font-bold uppercase tracking-wider text-xs font-mono underline text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                    >
                      UPGRADE QUOTA MATRIX →
                    </button>
                  </div>
                ) : (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={isLoading}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-600 text-white font-mono font-bold uppercase tracking-wider text-[11px] hover:bg-rose-700 transition active:scale-95 disabled:opacity-50"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Retry Generation
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {captions.length > 0 && (
          <section id="results-section" className="space-y-4 pt-4 animate-in fade-in duration-300">
            {/* High Demand Fallback Banner */}
            {isFallback && !isFallbackBannerDismissed && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 text-xs flex items-start justify-between gap-3 animate-in fade-in">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div className="space-y-1.5">
                    <p className="font-medium leading-relaxed">
                      Gemini is experiencing high demand right now. The captions below are basic starter templates — tap <span className="font-bold">Regenerate</span> to try getting AI-generated captions again.
                    </p>
                    <div className="flex items-center gap-3 pt-0.5 text-[11px] font-mono text-amber-800 dark:text-amber-300">
                      {isBgRetrying && bgRetryCount < 5 ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold bg-amber-500/15 px-2 py-0.5 rounded border border-amber-400/30">
                          <Loader2 className="w-3 h-3 animate-spin text-amber-600 dark:text-amber-400" />
                          Auto-retrying in background (attempt {bgRetryCount + 1}/5)...
                        </span>
                      ) : bgRetryCount >= 5 ? (
                        <span className="text-slate-600 dark:text-slate-400">
                          Background retries completed. Click Regenerate to retry manually.
                        </span>
                      ) : (
                        <span className="text-slate-600 dark:text-slate-400">
                          (No daily quota was charged for these starter templates)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFallbackBannerDismissed(true)}
                  className="text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 p-1 rounded hover:bg-amber-500/10 transition"
                  title="Dismiss banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded flex items-center justify-center border ${
                  isFallback
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                    : 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                }`}>
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-slate-900 dark:text-slate-100">
                    {isFallback ? 'STARTER TEMPLATES' : 'GENERATED ANGLES'} // {PLATFORMS[platform].name.toUpperCase()}
                  </h2>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {captions.length} {isFallback ? 'STARTER VARIATIONS (NO CREDITS CHARGED)' : 'OPTIMIZED VARIATIONS PRODUCED'}
                  </p>
                </div>
              </div>

              {/* Regenerate Button */}
              <button
                id="regenerate-btn"
                type="button"
                disabled={isLoading || isLimitReached}
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 text-indigo-500 ${isLoading ? 'animate-spin' : ''}`} />
                <span>REGENERATE BATCH</span>
              </button>
            </div>

            {/* Caption Variations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {captions.map((variation, index) => (
                <CaptionCard
                  key={variation.id || index}
                  variation={variation}
                  index={index}
                  platform={platform}
                  onPreview={text => setPreviewCaption(text)}
                  hashtags={hashtags}
                  isFallback={isFallback}
                  topic={topic}
                />
              ))}
            </div>

            {/* Platform Hashtags Block */}
            <HashtagsCard hashtags={hashtags} platform={platform} />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 mt-auto bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[11px]">
          <p>© {new Date().getFullYear()} CAPTION_MATRIX // PLATFORM-AWARE AI ENGINE</p>
          <div className="flex items-center gap-4">
            <span>IG • TIKTOK • X • FB • LI</span>
          </div>
        </div>
      </footer>

      {/* Overlays and Modals */}
      <UpgradeModal />
      <AuthModal />
      <AnnouncementsDrawer />
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectTopic={t => setTopic(t)}
      />
      <PlatformPreviewModal
        isOpen={previewCaption !== null}
        onClose={() => setPreviewCaption(null)}
        caption={previewCaption || ''}
        hashtags={hashtags}
        platform={platform}
      />
    </div>
  );
}

export default function App() {
  const [isAdminView, setIsAdminView] = useState(false);

  const openAdmin = () => {
    setIsAdminView(true);
  };

  const closeAdmin = () => {
    setIsAdminView(false);
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        {isAdminView ? (
          <AdminPage onBackToApp={closeAdmin} />
        ) : (
          <MainGenerator onOpenAdmin={openAdmin} />
        )}
      </AuthProvider>
    </ThemeProvider>
  );
}
