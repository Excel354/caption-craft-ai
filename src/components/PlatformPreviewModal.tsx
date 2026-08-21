import React, { useState } from 'react';
import { X, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Check, Copy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PlatformId } from '../types';
import { PLATFORMS } from '../constants/platforms';

interface PlatformPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  caption: string;
  hashtags: string[];
  platform: PlatformId;
}

export const PlatformPreviewModal: React.FC<PlatformPreviewModalProps> = ({
  isOpen,
  onClose,
  caption,
  hashtags,
  platform,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const config = PLATFORMS[platform] || PLATFORMS.instagram;

  const handleCopy = async () => {
    try {
      const fullText = hashtags.length > 0 ? `${caption}\n\n${hashtags.join(' ')}` : caption;
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 }, colors: ['#4f46e5', '#6366f1', '#818cf8'] });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-900 dark:text-slate-100">
              MOCK PREVIEW // {config.name.toUpperCase()}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mock Preview Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center">
          {/* Instagram Post Mockup */}
          {platform === 'instagram' && (
            <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 p-0.5">
                    <div className="w-full h-full rounded bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-mono font-bold">
                      CC
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">yourbrand.official</p>
                    <p className="text-[10px] text-slate-400 font-mono">ORIGINAL AUDIO</p>
                  </div>
                </div>
                <MoreHorizontal className="w-4 h-4 text-slate-400" />
              </div>

              {/* Mock Media Box */}
              <div className="w-full aspect-square bg-slate-50 dark:bg-slate-950/60 flex items-center justify-center border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-mono">
                [ VISUAL MEDIA ASSET ]
              </div>

              {/* Actions */}
              <div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between text-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 hover:text-rose-500 cursor-pointer" />
                    <MessageCircle className="w-5 h-5 cursor-pointer" />
                    <Send className="w-5 h-5 cursor-pointer" />
                  </div>
                  <Bookmark className="w-5 h-5 cursor-pointer" />
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">1,428 LIKES</p>
                <div className="text-xs text-slate-800 dark:text-slate-200 space-y-1 font-sans">
                  <span className="font-bold mr-1.5 font-mono">yourbrand.official</span>
                  <span className="whitespace-pre-line">{caption}</span>
                </div>
                {hashtags.length > 0 && (
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 font-mono">
                    {hashtags.join(' ')}
                  </div>
                )}
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">2 HOURS AGO</p>
              </div>
            </div>
          )}

          {/* X (Twitter) Tweet Mockup */}
          {platform === 'x' && (
            <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  CC
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Creator Account</span>
                    <span className="text-xs text-slate-400 font-mono">@creator • 12m</span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-900 dark:text-slate-100 whitespace-pre-line font-sans">
                    {caption}
                  </p>
                  {hashtags.length > 0 && (
                    <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400 font-mono">{hashtags.join(' ')}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* LinkedIn Post Mockup */}
          {platform === 'linkedin' && (
            <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded bg-blue-700 text-white flex items-center justify-center font-bold font-mono text-xs shrink-0">
                  CC
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Sarah Jenkins</p>
                  <p className="text-[10px] text-slate-400 font-mono">Growth Marketing Lead • 1st</p>
                  <p className="text-[10px] text-slate-400 font-mono">1h • Edited • 🌐</p>
                </div>
              </div>
              <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                {caption}
              </p>
              {hashtags.length > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">{hashtags.join(' ')}</p>
              )}
            </div>
          )}

          {/* TikTok / Facebook Fallback Mockup */}
          {(platform === 'tiktok' || platform === 'facebook') && (
            <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-indigo-600 text-white flex items-center justify-center font-mono font-bold text-xs">
                  CC
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{config.name} Creator</p>
                  <p className="text-[10px] text-slate-400 font-mono">Just now</p>
                </div>
              </div>
              <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line font-sans">
                {caption}
              </p>
              {hashtags.length > 0 && (
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono">{hashtags.join(' ')}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            {caption.length} CHARACTERS
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider text-white transition-all ${
              copied ? 'bg-emerald-600 border border-emerald-700' : 'bg-indigo-600 hover:bg-indigo-500 border border-indigo-700 active:scale-95'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>COPIED POST</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>COPY TO CLIPBOARD</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

