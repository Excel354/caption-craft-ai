import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Flame, Target, Compass, ArrowRight, Check } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dontShowAgain]);

  const handleDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem('hide_caption_onboarding', 'true');
    }
    onClose();
  };

  const points = [
    {
      icon: Flame,
      title: 'Hooks in the first line',
      description: 'Stop the relentless scroll in the first 2 seconds. A magnetic first sentence is what turns passive browsers into active viewers.',
      badgeText: 'Hook Strategy',
      iconColor: 'text-amber-500',
      badgeBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
    },
    {
      icon: Target,
      title: 'Smart hashtags',
      description: 'Algorithms rely on high-relevance niche hashtags to classify and index your post, reaching targeted search feeds beyond just your current followers.',
      badgeText: 'Discovery Reach',
      iconColor: 'text-violet-600 dark:text-violet-400',
      badgeBg: 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300',
    },
    {
      icon: Compass,
      title: 'Consistent tone & voice',
      description: 'Aligning your caption style with your platform archetype builds an authentic, recognizable personal brand that converts viewers into lifelong fans.',
      badgeText: 'Brand Authority',
      iconColor: 'text-sky-500',
      badgeBg: 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="onboarding-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            id="onboarding-modal-card"
            className="relative w-full max-w-lg overflow-hidden bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800"
          >
            {/* Header Accent Bar */}
            <div className="h-2 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-500" />

            <div className="p-6 sm:p-7">
              {/* Close Button */}
              <button
                id="onboarding-close-btn"
                onClick={handleDismiss}
                className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Title & Badge */}
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  Creator Playbook
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Why Great Captions Matter
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
                Captions are your highest-leverage conversion tool. Here is how our AI engine engineers high-performing social copy:
              </p>

              {/* Staggered Feature List */}
              <div className="space-y-4">
                {points.map((point, index) => {
                  const Icon = point.icon;
                  return (
                    <motion.div
                      key={point.title}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.1, duration: 0.3 }}
                      className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                    >
                      <div className={`p-2.5 rounded-xl shrink-0 ${point.badgeBg}`}>
                        <Icon className={`w-5 h-5 ${point.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                            {point.title}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {point.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Soft Pro / Premium note */}
              <div className="mt-5 p-3 rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 text-center">
                <p className="text-xs text-violet-800 dark:text-violet-300 font-medium">
                  💡 Pro and Premium tiers unlock more caption variations and angles per idea.
                </p>
              </div>

              {/* Footer Controls */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                  <input
                    id="onboarding-dont-show-checkbox"
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 border-slate-300 dark:border-slate-700 focus:ring-violet-500"
                  />
                  <span>Don't show this again</span>
                </label>

                <button
                  id="onboarding-got-it-btn"
                  onClick={handleDismiss}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-violet-600 hover:bg-violet-700 active:scale-95 transition-all shadow-md shadow-violet-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Got it</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
