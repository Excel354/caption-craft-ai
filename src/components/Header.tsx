import React, { useState } from 'react';
import { Zap, Crown, User as UserIcon, LogOut, History, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenHistory: () => void;
  onOpenUpgrade: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenHistory, onOpenUpgrade }) => {
  const { user, usage, logout, openAuthModal } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const plan = user?.plan || 'free';
  const limit = usage?.limit ?? 10;
  const count = usage?.count ?? 0;
  const remaining = usage?.remaining ?? (limit === -1 ? 999 : limit - count);

  const getPlanBadge = () => {
    switch (plan) {
      case 'premium':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Crown className="w-3 h-3" />
            PREMIUM
          </span>
        );
      case 'pro':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
            <Zap className="w-3 h-3" />
            PRO
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            FREE TIER
          </span>
        );
    }
  };

  const percentUsed = limit === -1 ? 0 : Math.min(100, Math.round((count / limit) * 100));

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Geometric Brand & Breadcrumb */}
        <div className="flex items-center gap-3">
          {/* Geometric Diamond Icon Mark */}
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shadow-sm shrink-0">
            <div className="w-3.5 h-3.5 border-2 border-white rotate-45"></div>
          </div>
          
          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50 font-sans">
                CONTENT_CAPTION / ENGINE
              </span>
              <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-bold tracking-widest uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700">
                AI_V2
              </span>
            </div>
            <p className="hidden lg:block text-[11px] text-slate-400 font-mono tracking-tight">
              PRECISION COPYWRITING & HASHTAG MATRIX
            </p>
          </div>
        </div>

        {/* Right side items: Status, Quota, Plan, Upgrade & User */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Live Engine Status Indicator */}
          <div className="hidden xl:flex items-center gap-2 text-slate-400 text-xs font-mono">
            <span className="text-[10px] font-bold uppercase tracking-wider">ENGINE</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>

          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 hidden xl:block"></div>

          {/* Daily Quota pill */}
          <div className="hidden sm:flex flex-col items-end text-xs font-mono">
            <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 text-[11px]">
              {limit === -1 ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> UNLIMITED
                </span>
              ) : (
                <>
                  <span className="text-slate-900 dark:text-slate-100 font-bold">{remaining}</span> of{' '}
                  <span className="text-slate-400">{limit}</span> LEFT TODAY
                </>
              )}
            </div>
            {limit !== -1 && (
              <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1 border border-slate-200 dark:border-slate-700/60">
                <div
                  className={`h-full transition-all duration-500 ${
                    percentUsed >= 90
                      ? 'bg-rose-500'
                      : percentUsed >= 70
                      ? 'bg-amber-500'
                      : 'bg-indigo-600'
                  }`}
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
            )}
          </div>

          {/* Plan badge */}
          <div className="hidden lg:block">{getPlanBadge()}</div>

          {/* Upgrade CTA if on free or pro */}
          {plan !== 'premium' && (
            <button
              id="header-upgrade-btn"
              onClick={onOpenUpgrade}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold font-mono uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 rounded border border-indigo-700 shadow-sm transition-all active:scale-95"
            >
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span>Upgrade</span>
            </button>
          )}

          {/* History drawer button */}
          <button
            id="header-history-btn"
            onClick={onOpenHistory}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
            title="Saved Captions & History"
            aria-label="History"
          >
            <History className="w-4 h-4" />
          </button>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              id="header-user-menu-btn"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <div className="w-5 h-5 rounded bg-indigo-600 text-white flex items-center justify-center text-[10px] font-mono font-bold">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <span className="max-w-[90px] truncate hidden sm:inline-block font-sans text-xs">{user?.name || 'Account'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>
                  <p className="text-[11px] font-mono text-slate-400 truncate">{user?.email}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plan:</span>
                    {getPlanBadge()}
                  </div>
                </div>

                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                  <div className="flex justify-between items-center mb-1">
                    <span>TODAY'S USAGE:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-200">
                      {limit === -1 ? 'UNLIMITED' : `${count} / ${limit}`}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">Resets daily at 00:00 UTC</p>
                </div>

                <button
                  id="menu-switch-plan-btn"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenUpgrade();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5 text-indigo-500" />
                  Manage / Switch Plan
                </button>

                <button
                  id="menu-switch-account-btn"
                  onClick={() => {
                    setIsMenuOpen(false);
                    openAuthModal('login');
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                  Switch Account
                </button>

                <button
                  id="menu-logout-btn"
                  onClick={() => {
                    setIsMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 mt-1 pt-1 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

