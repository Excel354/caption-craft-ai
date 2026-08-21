import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, Zap, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface QuotaBannerProps {
  onOpenUpgrade: () => void;
}

export const QuotaBanner: React.FC<QuotaBannerProps> = ({ onOpenUpgrade }) => {
  const { user, usage } = useAuth();
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');

  const plan = user?.plan || 'free';
  const limit = usage?.limit ?? 10;
  const count = usage?.count ?? 0;
  const isAtLimit = limit !== -1 && count >= limit;

  // Calculate live countdown to midnight UTC
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextMidnight = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)
      );
      const diffMs = nextMidnight.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeUntilReset('Resetting now...');
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeUntilReset(
        `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isAtLimit) return null;

  return (
    <div
      id="quota-limit-banner"
      className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 shadow-md animate-in fade-in duration-200"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 mt-0.5 border border-amber-500/30">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-amber-900 dark:text-amber-100">
              Daily Generation Limit Reached ({count}/{limit})
            </h4>
            <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5 max-w-xl">
              You've used all {limit} generations for your {plan.toUpperCase()} plan today. Your quota will automatically refresh at midnight UTC.
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-amber-700 dark:text-amber-400 font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>RESETS IN: {timeUntilReset} (00:00 UTC)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            id="quota-upgrade-cta-btn"
            type="button"
            onClick={onOpenUpgrade}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded text-xs font-bold font-mono uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-700 shadow-sm active:scale-95 transition-all"
          >
            {plan === 'free' ? (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Upgrade to Pro (50/Day)</span>
              </>
            ) : (
              <>
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span>Upgrade to Premium (Unlimited)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
