import React, { useState } from 'react';
import { X, Copy, Check, Clock, Trash2, Sparkles, LogIn, Bookmark, Star, Cloud } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SavedItem } from '../types';
import { PLATFORMS } from '../constants/platforms';
import { useAuth } from '../context/AuthContext';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTopic: (topic: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  onSelectTopic,
}) => {
  const { isGuest, openAuthModal, savedCaptions, deleteCaption, toggleFavorite } = useAuth();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterFavoriteOnly, setFilterFavoriteOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      confetti({ particleCount: 15, spread: 35, origin: { y: 0.85 } });
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredHistory = savedCaptions
    .filter((item) => {
      if (filterFavoriteOnly && !item.isFavorite) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.topic?.toLowerCase().includes(q) ||
        item.caption?.toLowerCase().includes(q) ||
        item.platform?.toLowerCase().includes(q)
      );
    });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-full sm:w-screen max-w-md bg-white dark:bg-[#172554] text-slate-900 dark:text-white border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#EDE9FE] dark:bg-[#7C3AED]/20 text-[#7C3AED] dark:text-[#EDE9FE] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-[#172554] dark:text-white">
                    Captions Cloud History
                  </h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Cloud className="w-2.5 h-2.5" /> Firestore Sync
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {isGuest ? 'Guest Session' : `${savedCaptions.length} saved creations`}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search & Filters */}
          {!isGuest && savedCaptions.length > 0 && (
            <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search saved captions..."
                className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setFilterFavoriteOnly(!filterFavoriteOnly)}
                className={`px-2 py-1 text-[11px] font-mono rounded-lg border flex items-center gap-1 transition cursor-pointer ${
                  filterFavoriteOnly
                    ? 'bg-amber-500/15 border-amber-400 text-amber-600 dark:text-amber-300 font-bold'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
                title="Filter by favorites"
              >
                <Star className={`w-3 h-3 ${filterFavoriteOnly ? 'fill-amber-500 text-amber-500' : ''}`} />
                <span>Favorites</span>
              </button>
            </div>
          )}

          {/* List or Guest Prompt */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {isGuest ? (
              <div className="text-center py-12 px-4 space-y-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center mx-auto shadow-sm">
                  <Bookmark className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold">Cloud Synced Captions</h4>
                <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
                  You are currently using guest mode. Sign in with Google or create an account to automatically sync your captions across devices via Firebase Firestore!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openAuthModal('register', 'Sign in to save your caption history to the cloud.');
                  }}
                  className="w-full py-2.5 px-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In / Create Account
                </button>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Sparkles className="w-8 h-8 mx-auto text-[#7C3AED] opacity-60" />
                <p className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                  {searchQuery || filterFavoriteOnly ? 'NO MATCHING CAPTIONS' : 'NO SAVED CAPTIONS YET'}
                </p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  {searchQuery || filterFavoriteOnly
                    ? 'Try adjusting your search query or removing the favorites filter.'
                    : 'Click the bookmark icon on any caption card to save it to your Firestore cloud.'}
                </p>
              </div>
            ) : (
              filteredHistory.map((item) => {
                const cfg = PLATFORMS[item.platform] || PLATFORMS.instagram;
                const isCopied = copiedId === item.id;
                const fullTextToCopy =
                  item.hashtags && item.hashtags.length > 0
                    ? `${item.caption}\n\n${item.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}`
                    : item.caption;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3 text-xs shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#7C3AED] dark:text-[#A78BFA] font-mono uppercase text-[11px] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#7C3AED]"></span>
                        {cfg.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleFavorite(item.id, !item.isFavorite)}
                          className={`p-1 rounded transition cursor-pointer ${
                            item.isFavorite
                              ? 'text-amber-500 hover:text-amber-600'
                              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                          }`}
                          title={item.isFavorite ? 'Remove favorite' : 'Mark as favorite'}
                        >
                          <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-amber-500' : ''}`} />
                        </button>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteCaption(item.id)}
                          title="Delete from cloud"
                          className="text-slate-400 hover:text-rose-500 p-1 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-slate-500 dark:text-slate-400 line-clamp-1 font-serif italic text-xs">
                      "{item.topic}"
                    </p>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 line-clamp-4 leading-relaxed whitespace-pre-wrap">
                      {item.caption}
                    </div>

                    {item.hashtags && item.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.hashtags.slice(0, 5).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#EDE9FE] text-[#7C3AED] dark:bg-[#7C3AED]/20 dark:text-purple-300"
                          >
                            {tag.startsWith('#') ? tag : `#${tag}`}
                          </span>
                        ))}
                        {item.hashtags.length > 5 && (
                          <span className="text-[10px] text-slate-400 font-mono self-center">
                            +{item.hashtags.length - 5} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTopic(item.topic);
                          onClose();
                        }}
                        className="text-[11px] font-mono text-[#2563EB] font-bold uppercase hover:underline cursor-pointer"
                      >
                        RELOAD TOPIC
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopy(item.id, fullTextToCopy)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-xs'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>COPIED</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>COPY CAPTION</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
