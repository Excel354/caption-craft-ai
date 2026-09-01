import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, Info, AlertTriangle, Sparkles, Calendar, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SystemAnnouncement } from '../types';

export const AnnouncementsDrawer: React.FC = () => {
  const { isAnnouncementsOpen, closeAnnouncements, announcements } = useAuth();

  const getBadge = (type: string) => {
    switch (type) {
      case 'warning':
        return {
          icon: AlertTriangle,
          label: 'Alert',
          bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900',
        };
      case 'promo':
        return {
          icon: Sparkles,
          label: 'Update',
          bg: 'bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-900',
        };
      default:
        return {
          icon: Info,
          label: 'Announcement',
          bg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900',
        };
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Recent';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <AnimatePresence>
      {isAnnouncementsOpen && (
        <div id="announcements-drawer-overlay" className="fixed inset-0 z-50 overflow-hidden bg-slate-950/50 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={closeAnnouncements} />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              id="announcements-drawer-container"
              className="w-full sm:w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Announcements & Updates
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Product updates, tips, and service notices
                    </p>
                  </div>
                </div>
                <button
                  id="announcements-drawer-close"
                  onClick={closeAnnouncements}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Announcements List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {announcements.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="inline-flex p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
                      <Bell className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      No announcements yet
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Check back later for news, feature drops, and upgrades.
                    </p>
                  </div>
                ) : (
                  announcements.map((item: SystemAnnouncement) => {
                    const badge = getBadge(item.type);
                    const BadgeIcon = badge.icon;
                    return (
                      <div
                        key={item.id}
                        id={`announcement-item-${item.id}`}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs hover:border-violet-200 dark:hover:border-violet-900/50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${badge.bg}`}>
                            <BadgeIcon className="w-3 h-3" />
                            {badge.label}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(item.createdAt || item.updatedAt)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                          {item.message}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  All caught up
                </span>
                <button
                  onClick={closeAnnouncements}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
