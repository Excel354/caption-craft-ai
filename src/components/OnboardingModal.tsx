import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Flame, Target, Compass, ArrowRight, Play, Pause, Video, BookOpen, Volume2, VolumeX, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'video' | 'playbook'>('video');
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Video playback state
  const [hasRealVideo, setHasRealVideo] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeScene, setActiveScene] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const realVideoRef = useRef<HTMLVideoElement | null>(null);

  // Simulated tour timer when real video is not yet loaded
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !hasRealVideo) {
      interval = setInterval(() => {
        setActiveScene(prev => (prev + 1) % 3);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, hasRealVideo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dontShowAgain, token]);

  const handleDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem('hide_caption_onboarding', 'true');
      if (token) {
        fetch('/api/user/onboarding/seen', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    }
    if (realVideoRef.current) {
      realVideoRef.current.pause();
    }
    setIsPlaying(false);
    onClose();
  };

  const togglePlay = () => {
    if (hasRealVideo && realVideoRef.current) {
      if (realVideoRef.current.paused) {
        realVideoRef.current.play().then(() => setIsPlaying(true)).catch(() => {
          setHasRealVideo(false);
          setIsPlaying(true);
        });
      } else {
        realVideoRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
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

  const videoScenes = [
    {
      title: '1. The 2-Second Hook',
      subtitle: 'Stop the scroll immediately',
      previewText: '"Most creators get Instagram reach completely backwards. Here is the 1 shift that doubled our conversions..."',
      stat: '+184% engagement rate',
      highlight: 'First 5 words dictate 80% of retention',
      color: 'from-amber-500 to-orange-500',
    },
    {
      title: '2. Platform Tone Matching',
      subtitle: 'Adapt format per network',
      previewText: '"TikTok thrives on authentic raw storytelling, while LinkedIn commands punchy business insights with white space."',
      stat: '5 unique platform formats',
      highlight: 'Auto-tuned character & hashtag caps',
      color: 'from-indigo-500 to-violet-600',
    },
    {
      title: '3. Algorithmic Search Indexing',
      subtitle: 'Niche search discovery',
      previewText: '#ContentStrategy #CreatorEconomy #SocialGrowth — indexed for users searching directly in explorer tabs.',
      stat: 'Niche relevance over spam',
      highlight: 'Curated hashtag bundles',
      color: 'from-emerald-500 to-teal-600',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="onboarding-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            id="onboarding-modal-card"
            className="relative w-full max-w-xl overflow-hidden bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]"
          >
            {/* Header Accent Bar */}
            <div className="h-1.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-500 shrink-0" />

            <div className="p-5 sm:p-6 flex-1 overflow-y-auto">
              {/* Close Button */}
              <button
                id="onboarding-close-btn"
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Title & Badge */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  Creator Onboarding
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Why Captions Drive 10x More Reach
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
                Watch our quick 60-second walkthrough or review the core viral formula below.
              </p>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl mb-4">
                <button
                  id="onboarding-tab-video"
                  onClick={() => setActiveTab('video')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'video'
                      ? 'bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  Video Walkthrough
                </button>
                <button
                  id="onboarding-tab-playbook"
                  onClick={() => setActiveTab('playbook')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'playbook'
                      ? 'bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Strategy Playbook
                </button>
              </div>

              {/* Video Tab Content */}
              {activeTab === 'video' ? (
                <div className="space-y-3">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex flex-col justify-between p-4 group">
                    {/* HTML5 video element if real video is present */}
                    {hasRealVideo && (
                      <video
                        ref={realVideoRef}
                        src="/onboarding.mp4"
                        playsInline
                        muted={isMuted}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onError={() => setHasRealVideo(false)}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}

                    {/* Fallback Animated Tour Scene Player */}
                    {!hasRealVideo && (
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-5 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30">
                            {videoScenes[activeScene].title}
                          </span>
                          <span className="text-[11px] font-mono text-emerald-400 font-medium">
                            {videoScenes[activeScene].stat}
                          </span>
                        </div>

                        <div className="my-auto space-y-2">
                          <p className="text-xs font-semibold text-slate-300">
                            {videoScenes[activeScene].subtitle}:
                          </p>
                          <div className="p-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-xs">
                            <p className="text-xs sm:text-sm font-medium text-white italic leading-relaxed">
                              {videoScenes[activeScene].previewText}
                            </p>
                          </div>
                          <p className="text-[11px] text-violet-300 font-mono flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" />
                            {videoScenes[activeScene].highlight}
                          </p>
                        </div>

                        {/* Scene Indicator Dots */}
                        <div className="flex items-center justify-center gap-1.5 pt-2">
                          {videoScenes.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setActiveScene(i)}
                              className={`h-1.5 rounded-full transition-all ${
                                activeScene === i ? 'w-6 bg-violet-500' : 'w-2 bg-slate-700 hover:bg-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Central Play/Pause Overlay Button */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={togglePlay}
                        className="pointer-events-auto w-12 h-12 rounded-full bg-violet-600/90 text-white flex items-center justify-center shadow-lg shadow-violet-600/40 hover:bg-violet-500 transition cursor-pointer backdrop-blur-xs"
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                      </motion.button>
                    </div>

                    {/* Overlay Bottom Controls Bar */}
                    <div className="relative z-10 flex items-center justify-between text-white text-xs pt-1 pointer-events-auto">
                      <span className="font-mono text-[10px] text-slate-400">
                        {isPlaying ? 'PLAYING TUTORIAL' : 'PAUSED // CLICK TO WATCH'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className="p-1 text-slate-400 hover:text-white transition"
                          title={isMuted ? 'Unmute' : 'Mute'}
                        >
                          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-medium text-slate-600 dark:text-slate-400">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="block font-bold text-slate-900 dark:text-white">0-2s</span>
                      Hook Headline
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="block font-bold text-slate-900 dark:text-white">2-5s</span>
                      Story / Value
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="block font-bold text-slate-900 dark:text-white">End</span>
                      Call-to-Action
                    </div>
                  </div>
                </div>
              ) : (
                /* Strategy Playbook Tab Content */
                <div className="space-y-3">
                  {points.map((point, index) => {
                    const Icon = point.icon;
                    return (
                      <motion.div
                        key={point.title}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08, duration: 0.25 }}
                        className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                      >
                        <div className={`p-2.5 rounded-xl shrink-0 ${point.badgeBg}`}>
                          <Icon className={`w-4 h-4 ${point.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mb-0.5">
                            {point.title}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {point.description}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Soft Tier note */}
              <div className="mt-4 p-2.5 rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 text-center">
                <p className="text-xs text-violet-800 dark:text-violet-300 font-medium">
                  💡 Pro and Premium tiers unlock 5–7 variations with custom tones & angles.
                </p>
              </div>

              {/* Footer Controls */}
              <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                  <input
                    id="onboarding-dont-show-checkbox"
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 border-slate-300 dark:border-slate-700 focus:ring-violet-500 cursor-pointer"
                  />
                  <span>Don't show this again</span>
                </label>

                <button
                  id="onboarding-got-it-btn"
                  onClick={handleDismiss}
                  className="w-full sm:w-auto px-5 py-2 rounded-xl font-semibold text-xs sm:text-sm text-white bg-violet-600 hover:bg-violet-700 active:scale-95 transition-all shadow-md shadow-violet-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Got it, let's create</span>
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
