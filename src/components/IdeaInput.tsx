import React from 'react';
import { Smile, Meh, ArrowRight, X, Lightbulb, Sparkles } from 'lucide-react';
import { PlatformId } from '../types';

interface IdeaInputProps {
  topic: string;
  onChangeTopic: (val: string) => void;
  includeEmojis: boolean;
  onToggleEmojis: (val: boolean) => void;
  tone: string;
  onChangeTone: (tone: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  isQuotaExceeded: boolean;
  selectedPlatform: PlatformId;
}

const EXAMPLE_TOPICS = [
  'Launching our new eco-friendly ceramic coffee mug collection',
  '3 productivity habits that saved me 10 hours this week',
  'Behind-the-scenes look at how we package customer orders',
  'Weekend flash sale: 30% off all design templates for 48h',
  'Why making mistakes in your 20s is your greatest competitive edge',
];

const TONE_OPTIONS = [
  { id: 'default', label: 'Platform Default' },
  { id: 'casual', label: 'Casual & Relatable' },
  { id: 'witty', label: 'Witty & Clever' },
  { id: 'authoritative', label: 'Professional & Insightful' },
  { id: 'inspirational', label: 'Inspirational & Bold' },
  { id: 'promotional', label: 'High-Converting & Sales' },
];

export const IdeaInput: React.FC<IdeaInputProps> = ({
  topic,
  onChangeTopic,
  includeEmojis,
  onToggleEmojis,
  tone,
  onChangeTone,
  onGenerate,
  isLoading,
  isQuotaExceeded,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (topic.trim() && !isLoading && !isQuotaExceeded) {
        onGenerate();
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-md flex flex-col space-y-4">
      {/* Top row: Label + Clear */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label
            htmlFor="idea-input"
            className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-400"
          >
            01. Prompt Specification / Core Idea
          </label>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            (TOPIC, VALUE PROP, OR PRODUCT CONTEXT)
          </span>
        </div>
        {topic && (
          <button
            type="button"
            onClick={() => onChangeTopic('')}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 transition-colors font-mono"
          >
            <X className="w-3 h-3" />
            CLEAR
          </button>
        )}
      </div>

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          id="idea-input"
          value={topic}
          onChange={e => onChangeTopic(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Announcing our new summer cold brew menu with coconut foam and honey drizzle, available starting this Friday..."
          rows={3}
          disabled={isLoading}
          className="w-full resize-none rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-4 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 transition-all font-sans leading-relaxed"
        />
      </div>

      {/* Quick Example Starters */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <Lightbulb className="w-3 h-3 text-amber-500" />
          <span>Preset Archetypes:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_TOPICS.map((promptText, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChangeTopic(promptText)}
              className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 px-2.5 py-1 rounded border border-slate-200/80 dark:border-slate-800 transition-colors text-left truncate max-w-full font-serif italic"
            >
              "{promptText}"
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Controls Row: Emojis, Tone, and Generate CTA */}
      <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left Side: Emoji Switch & Tone */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Emoji Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Emojis:
            </span>
            <button
              id="emoji-toggle-btn"
              type="button"
              role="switch"
              aria-checked={includeEmojis}
              onClick={() => onToggleEmojis(!includeEmojis)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                includeEmojis ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out flex items-center justify-center text-[9px] ${
                  includeEmojis ? 'translate-x-4' : 'translate-x-0'
                }`}
              >
                {includeEmojis ? (
                  <Smile className="w-2.5 h-2.5 text-indigo-600" />
                ) : (
                  <Meh className="w-2.5 h-2.5 text-slate-400" />
                )}
              </span>
            </button>
            <span className="text-[11px] font-mono text-slate-500">
              {includeEmojis ? 'ON' : 'OFF'}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

          {/* Tone Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Tone:
            </span>
            <select
              id="tone-selector"
              value={tone}
              onChange={e => onChangeTone(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600 font-sans"
            >
              {TONE_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id === 'default' ? '' : opt.label}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Side: Generate Button */}
        <div className="flex items-center gap-2">
          <button
            id="generate-captions-btn"
            type="button"
            disabled={!topic.trim() || isLoading || isQuotaExceeded}
            onClick={onGenerate}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all ${
              !topic.trim() || isLoading || isQuotaExceeded
                ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                : 'bg-indigo-600 hover:bg-indigo-500 active:scale-98 border border-indigo-700'
            }`}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-3.5 w-3.5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Synthesizing Copy...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                <span>Execute Generation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

