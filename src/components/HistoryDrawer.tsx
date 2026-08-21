import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Clock, Bookmark, Sparkles } from 'lucide-react';
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
  const { token } = useAuth();
  const [history, setHistory] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && token) {
      fetchHistory();
    }
  }, [isOpen, token]);

  const fetchHistory = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-slate-900 dark:text-slate-100">
                GENERATION ARCHIVE
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-xs font-mono text-slate-400">
                FETCHING ARCHIVED BATCHES...
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Sparkles className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-xs font-mono">NO GENERATIONS RECORDED YET.</p>
                <p className="text-[11px] text-slate-500 font-sans">
                  Captions you generate will appear here automatically.
                </p>
              </div>
            ) : (
              history.map(item => {
                const cfg = PLATFORMS[item.platform] || PLATFORMS.instagram;
                const isCopied = copiedId === item.id;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100 font-mono uppercase text-[11px]">
                        {cfg.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-slate-500 dark:text-slate-400 line-clamp-1 font-serif italic text-xs">
                      "{item.topic}"
                    </p>

                    <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 line-clamp-3 font-sans leading-relaxed">
                      {item.caption}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTopic(item.topic);
                          onClose();
                        }}
                        className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold uppercase hover:underline"
                      >
                        RELOAD PROMPT
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopy(item.id, item.caption)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono font-bold uppercase tracking-wider transition-all ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300/80'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>COPIED</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>COPY</span>
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

