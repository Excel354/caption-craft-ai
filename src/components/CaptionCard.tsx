import React, { useState } from 'react';
import { Copy, Check, Eye, Bookmark, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CaptionVariation, PlatformId } from '../types';
import { PLATFORMS } from '../constants/platforms';
import { useAuth } from '../context/AuthContext';

interface CaptionCardProps {
  variation: CaptionVariation;
  index: number;
  platform: PlatformId;
  onPreview: (caption: string) => void;
  hashtags?: string[];
  isFallback?: boolean;
  topic?: string;
}

export const CaptionCard: React.FC<CaptionCardProps> = ({
  variation,
  index,
  platform,
  onPreview,
  hashtags = [],
  isFallback = false,
  topic = 'Social Post',
}) => {
  const { saveCaption, savedCaptions } = useAuth();
  const [copied, setCopied] = useState(false);
  const [copiedWithTags, setCopiedWithTags] = useState(false);

  const isSavedInFirestore = savedCaptions.some(
    (c) => c.caption === variation.text && c.platform === platform
  );
  const [localSaved, setLocalSaved] = useState(false);
  const isSaved = isSavedInFirestore || localSaved;

  const config = PLATFORMS[platform] || PLATFORMS.instagram;
  const charCount = variation.text.length;
  const isOverLimit = charCount > config.hardLimit;
  const isWithinIdeal = charCount >= config.idealMin && charCount <= config.idealMax;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(variation.text);
      setCopied(true);
      confetti({
        particleCount: 20,
        spread: 40,
        origin: { y: 0.85 },
        colors: ['#4f46e5', '#6366f1', '#818cf8'],
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy caption:', err);
    }
  };

  const handleCopyWithHashtags = async () => {
    try {
      const fullText =
        hashtags.length > 0
          ? `${variation.text}\n\n${hashtags.join(' ')}`
          : variation.text;
      await navigator.clipboard.writeText(fullText);
      setCopiedWithTags(true);
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.85 },
      });
      setTimeout(() => setCopiedWithTags(false), 2000);
    } catch (err) {
      console.error('Failed to copy combo:', err);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!isSaved) {
      setLocalSaved(true);
      await saveCaption({
        id: 'cap_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        platform,
        topic: topic || 'Social Media Caption',
        caption: variation.text,
        hashtags: hashtags || [],
        tone: variation.toneLabel,
        createdAt: new Date().toISOString(),
        isFavorite: true,
      });
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.8 },
        colors: ['#f59e0b', '#fbbf24', '#7c3aed'],
      });
    }
  };

  const getCharBadge = () => {
    if (isOverLimit) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
          {charCount} / {config.hardLimit} CHARS (LIMIT EXCEEDED)
        </span>
      );
    }
    if (isWithinIdeal) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
          {charCount} / {config.hardLimit} CHARS (OPTIMAL)
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        {charCount} / {config.hardLimit} CHARS
      </span>
    );
  };

  return (
    <div
      id={`caption-card-${index}`}
      className={`group relative bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-md hover:shadow-lg transition-all flex flex-col justify-between ${
        isFallback
          ? 'border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-400/20'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Card Header: Angle tag & Char count */}
      <div>
        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`font-mono font-bold text-xs ${
                isFallback
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-indigo-600 dark:text-indigo-400'
              }`}
            >
              0{index + 1}.
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide font-sans">
              {variation.toneLabel || `Variation 0${index + 1}`}
            </span>
            {isFallback && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50">
                Template
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">{getCharBadge()}</div>
        </div>

        {/* Caption Body Text */}
        <div className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line select-text font-normal font-sans bg-slate-50/50 dark:bg-slate-950/30 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
          {variation.text}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        {/* Left side auxiliary tools */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPreview(variation.text)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors cursor-pointer"
            title="Preview in mock social feed"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-mono text-[11px] uppercase">Preview</span>
          </button>

          <button
            type="button"
            onClick={handleBookmarkToggle}
            className={`p-1.5 rounded transition-colors border cursor-pointer ${
              isSaved
                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent hover:border-slate-200'
            }`}
            title={isSaved ? 'Saved to Cloud History' : 'Save to Cloud History'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-500' : ''}`} />
          </button>
        </div>

        {/* Right side copy actions */}
        <div className="flex items-center gap-2">
          {hashtags.length > 0 && (
            <button
              type="button"
              onClick={handleCopyWithHashtags}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Copy caption and all hashtags together"
            >
              {copiedWithTags ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    COPIED + TAGS
                  </span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden md:inline">+ TAGS</span>
                </>
              )}
            </button>
          )}

          <button
            id={`copy-btn-${index}`}
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white shadow-sm border border-emerald-700'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm border border-indigo-700 active:scale-95'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>COPIED</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>COPY</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
