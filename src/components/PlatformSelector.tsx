import React from 'react';
import { Instagram, Video, Twitter, Facebook, Linkedin, Info } from 'lucide-react';
import { PlatformId } from '../types';
import { PLATFORMS } from '../constants/platforms';

interface PlatformSelectorProps {
  selectedPlatform: PlatformId;
  onSelect: (platform: PlatformId) => void;
  disabled?: boolean;
}

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedPlatform,
  onSelect,
  disabled = false,
}) => {
  const platformsList: PlatformId[] = ['instagram', 'tiktok', 'x', 'facebook', 'linkedin'];

  const getPlatformIcon = (id: PlatformId, active: boolean) => {
    const size = 'w-3.5 h-3.5';
    switch (id) {
      case 'instagram':
        return <Instagram className={`${size} ${active ? 'text-pink-500' : 'text-slate-400'}`} />;
      case 'tiktok':
        return <Video className={`${size} ${active ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'}`} />;
      case 'x':
        return <Twitter className={`${size} ${active ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`} />;
      case 'facebook':
        return <Facebook className={`${size} ${active ? 'text-blue-600' : 'text-slate-400'}`} />;
      case 'linkedin':
        return <Linkedin className={`${size} ${active ? 'text-sky-600' : 'text-slate-400'}`} />;
    }
  };

  const currentConfig = PLATFORMS[selectedPlatform];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-0.5">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-400">
          Target Network / Architecture
        </label>
        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
          Rules active
        </span>
      </div>

      {/* Platform Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" role="tablist">
        {platformsList.map(pId => {
          const cfg = PLATFORMS[pId];
          const isSelected = selectedPlatform === pId;

          return (
            <button
              key={pId}
              id={`platform-tab-${pId}`}
              type="button"
              role="tab"
              aria-selected={isSelected}
              disabled={disabled}
              onClick={() => onSelect(pId)}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs transition-all relative border ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 border-indigo-600 dark:border-indigo-500 shadow-sm text-slate-900 dark:text-slate-50 ring-1 ring-indigo-500 font-semibold'
                  : 'bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {getPlatformIcon(pId, isSelected)}
              <span>{cfg.name}</span>
            </button>
          );
        })}
      </div>

      {/* Platform constraints & Geometric Specs strip */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-between gap-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 font-mono">
            {currentConfig.name} Specs:
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] border border-slate-200 dark:border-slate-700">
            LIMIT: {currentConfig.hardLimit} CHARS
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] border border-slate-200 dark:border-slate-700">
            IDEAL: {currentConfig.idealRange}
          </span>
        </div>
        <div className="text-slate-500 dark:text-slate-400 text-[11px] font-serif italic">
          "{currentConfig.toneGuidance}"
        </div>
      </div>
    </div>
  );
};

