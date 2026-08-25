/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, RotateCcw, AlertCircle, Layers, CheckCircle, ArrowDown } from 'lucide-react';
import confetti from 'canvas-confetti';
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
import { PlatformId, CaptionVariation } from './types';
import { PLATFORMS } from './constants/platforms';

function MainGenerator() {
  const { token, usage, updateUsage, openUpgradeModal } = useAuth();

  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState<PlatformId>('instagram');
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [tone, setTone] = useState('');

  const [captions, setCaptions] = useState<CaptionVariation[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  // Preview Modal
  const [previewCaption, setPreviewCaption] = useState<string | null>(null);

  // History Drawer
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Check if daily quota is reached
  const isLimitReached = usage ? usage.limit !== -1 && usage.count >= usage.limit : false;

  const handleGenerate = async () => {
    if (!topic.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setIsQuotaExceeded(false);

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

      if (data.usage) {
        updateUsage(data.usage);
      }

      // Trigger celebratory confetti on generation
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.7 },
      });

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

  return (
    <div className="min-h-screen bg-[#F1F5F9] dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex flex-col font-sans transition-colors selection:bg-indigo-600 selection:text-white">
      <Header
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenUpgrade={openUpgradeModal}
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
            onSelect={setPlatform}
            disabled={isLoading}
          />

          {/* Idea Input Card */}
          <IdeaInput
            topic={topic}
            onChangeTopic={setTopic}
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-slate-900 dark:text-slate-100">
                    GENERATED ANGLES // {PLATFORMS[platform].name.toUpperCase()}
                  </h2>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {captions.length} OPTIMIZED VARIATIONS PRODUCED
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
          <div className="flex items-center gap-4 uppercase">
            <span>IG • TIKTOK • X • FB • LI</span>
          </div>
        </div>
      </footer>

      {/* Overlays and Modals */}
      <UpgradeModal />
      <AuthModal />
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
  return (
    <AuthProvider>
      <MainGenerator />
    </AuthProvider>
  );
}
