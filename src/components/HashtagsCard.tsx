import React, { useState } from 'react';
import { Hash, Copy, Check, Info } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PlatformId } from '../types';
import { PLATFORMS } from '../constants/platforms';

interface HashtagsCardProps {
  hashtags: string[];
  platform: PlatformId;
}

export const HashtagsCard: React.FC<HashtagsCardProps> = ({ hashtags, platform }) => {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSingle, setCopiedSingle] = useState<string | null>(null);

  const config = PLATFORMS[platform] || PLATFORMS.instagram;

  const handleCopyAll = async () => {
    if (hashtags.length === 0) return;
    try {
      await navigator.clipboard.writeText(hashtags.join(' '));
      setCopiedAll(true);
      confetti({
        particleCount: 15,
        spread: 35,
        origin: { y: 0.85 },
      });
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error('Failed to copy hashtags:', err);
    }
  };

  const handleCopySingle = async (tag: string) => {
    try {
      await navigator.clipboard.writeText(tag);
      setCopiedSingle(tag);
      setTimeout(() => setCopiedSingle(null), 1500);
    } catch (err) {
      console.error('Failed to copy tag:', err);
    }
  };

  if (!hashtags || hashtags.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-md space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Hash className="w-3 h-3" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-400">
              02. Hashtag Matrix ({hashtags.length} Tags Generated)
            </span>
            <span className="ml-2 text-[10px] font-mono text-slate-400">
              TARGET: {config.hashtagCountGuidance}
            </span>
          </div>
        </div>

        <button
          id="copy-all-hashtags-btn"
          type="button"
          onClick={handleCopyAll}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all ${
            copiedAll
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 active:scale-95'
          }`}
        >
          {copiedAll ? (
            <>
              <Check className="w-3 h-3" />
              <span>COPIED ALL</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>COPY ALL HASHTAGS</span>
            </>
          )}
        </button>
      </div>

      {/* Hashtag Badges */}
      <div className="flex flex-wrap gap-2 pt-1">
        {hashtags.map((tag, idx) => {
          const isCopied = copiedSingle === tag;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleCopySingle(tag)}
              title="Click to copy single hashtag"
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                isCopied
                  ? 'bg-emerald-600 text-white border border-emerald-700 scale-105'
                  : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-300'
              }`}
            >
              {isCopied ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Copied</span>
                </>
              ) : (
                tag
              )}
            </button>
          );
        })}
      </div>
      
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 inline-block shrink-0" />
          Click any tag chip for single copy selection.
        </p>
        <span className="text-[10px] font-mono text-slate-400 uppercase">
          INDEXED • {platform.toUpperCase()}
        </span>
      </div>
    </div>
  );
};

