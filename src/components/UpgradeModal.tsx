import React, { useState } from 'react';
import { X, Check, Zap, Crown, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { PlanTier } from '../types';

export const UpgradeModal: React.FC = () => {
  const { user, isUpgradeModalOpen, closeUpgradeModal, changePlan } = useAuth();
  const [updating, setUpdating] = useState<string | null>(null);

  if (!isUpgradeModalOpen) return null;

  const currentPlan = user?.plan || 'free';

  const handleSelectPlan = async (tier: PlanTier) => {
    if (tier === currentPlan) return;
    setUpdating(tier);
    try {
      await changePlan(tier);
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#6366f1', '#818cf8'],
      });
      closeUpgradeModal();
    } catch (err) {
      console.error('Failed to change plan:', err);
    } finally {
      setUpdating(null);
    }
  };

  const PLANS = [
    {
      id: 'free' as PlanTier,
      name: 'Free Starter',
      limitDesc: '10 GENERATIONS / DAY',
      price: '$0',
      period: 'forever',
      description: 'Ideal for testing content angles and drafting casual posts.',
      features: [
        '10 daily generation batches',
        '3–5 variations per request',
        'All 5 platforms (IG, TikTok, X, FB, LI)',
        'Character limit & tone adaptation',
        'Emoji matrix control toggle',
      ],
      icon: Sparkles,
      buttonText: 'Current Tier',
      colorClass: 'border-slate-200 dark:border-slate-800',
    },
    {
      id: 'pro' as PlanTier,
      name: 'Creator Pro',
      limitDesc: '50 GENERATIONS / DAY',
      price: '$12',
      period: '/ month',
      popular: true,
      description: 'For active creators, social managers, and scaling brands.',
      features: [
        '50 daily generation batches',
        'Advanced tone & style control',
        'Full hashtag matrix engine',
        'Live social feed mock previews',
        'High-priority AI response pipeline',
        'Instant copy & combos',
      ],
      icon: Zap,
      buttonText: 'Upgrade to Pro',
      colorClass: 'border-indigo-600 dark:border-indigo-500 shadow-md ring-1 ring-indigo-500',
    },
    {
      id: 'premium' as PlanTier,
      name: 'Agency Premium',
      limitDesc: 'UNLIMITED GENERATIONS',
      price: '$29',
      period: '/ month',
      description: 'For agencies, marketing teams, and high-frequency creators.',
      features: [
        'Unlimited generations every day',
        'Zero quota restrictions',
        'All platforms & future models',
        'Saved caption library & history',
        'Priority 24/7 AI compute speed',
        'Early access to new features',
      ],
      icon: Crown,
      buttonText: 'Upgrade to Premium',
      colorClass: 'border-amber-500/80 shadow-md ring-1 ring-amber-500',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl my-8">
        {/* Close Button */}
        <button
          id="close-upgrade-modal-btn"
          type="button"
          onClick={closeUpgradeModal}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 mb-3">
            <Zap className="w-3.5 h-3.5" />
            TIER CONFIGURATION MATRIX
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 font-sans">
            Choose Your Generation Tier
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 font-serif italic">
            Instant tier activation — switch anytime to unlock higher daily capacity.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map(plan => {
            const isCurrent = currentPlan === plan.id;
            const Icon = plan.icon;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 p-5 sm:p-6 border transition-all ${
                  plan.colorClass
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-mono font-bold uppercase tracking-widest shadow-sm">
                    MOST POPULAR
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                      <Icon
                        className={`w-4 h-4 ${
                          plan.id === 'premium'
                            ? 'text-amber-500'
                            : plan.id === 'pro'
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-500'
                        }`}
                      />
                    </div>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        ACTIVE TIER
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    {plan.name}
                  </h3>
                  <p className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {plan.limitDesc}
                  </p>

                  <div className="my-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 font-mono">
                      {plan.price}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">{plan.period}</span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 font-sans">
                    {plan.description}
                  </p>

                  {/* Features List */}
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 mb-6 font-sans">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  id={`select-plan-${plan.id}-btn`}
                  type="button"
                  disabled={isCurrent || updating !== null}
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`w-full py-2.5 px-4 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all border ${
                    isCurrent
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700 cursor-default'
                      : plan.id === 'premium'
                      ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-700 shadow-sm active:scale-98'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-700 shadow-sm active:scale-98'
                  }`}
                >
                  {updating === plan.id
                    ? 'ACTIVATING...'
                    : isCurrent
                    ? 'CURRENT TIER'
                    : `SWITCH TO ${plan.name.toUpperCase()}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-[11px] font-mono text-slate-400 text-center mt-6">
          DAILY QUOTAS AUTOMATICALLY REFRESH AT 00:00 UTC • FULL PLATFORM CONSTRAINTS APPLIED
        </p>
      </div>
    </div>
  );
};

