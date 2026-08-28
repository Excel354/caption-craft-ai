import React, { useState } from 'react';
import { Zap, Crown, User as UserIcon, LogOut, History, ChevronDown, CheckCircle2, Clock, Sparkles, LogIn, Bell, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppLogo } from './AppLogo';

interface HeaderProps {
  onOpenHistory: () => void;
  onOpenUpgrade: () => void;
  onOpenOnboarding?: () => void;
  onOpenAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenHistory, onOpenUpgrade, onOpenOnboarding, onOpenAdmin }) => {
  const { user, isGuest, usage, logout, openAuthModal, openAnnouncements, unreadAnnouncementsCount } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Hidden admin gesture state: 10 consecutive clicks within 2s windows
  const logoClicksRef = React.useRef(0);
  const lastLogoClickTimeRef = React.useRef(0);

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastLogoClickTimeRef.current > 2000) {
      logoClicksRef.current = 1;
    } else {
      logoClicksRef.current += 1;
    }
    lastLogoClickTimeRef.current = now;

    if (logoClicksRef.current >= 10) {
      logoClicksRef.current = 0;
      lastLogoClickTimeRef.current = 0;
      if (onOpenAdmin) {
        onOpenAdmin();
      }
    }
  };

  const plan = user?.plan || 'free';
  const limit = usage?.limit ?? 10;
  const count = usage?.count ?? 0;
  const remaining = usage?.remaining ?? (limit === -1 ? 999 : Math.max(0, limit - count));

  const isPendingUpgrade = !!user?.pendingUpgrade && user.pendingUpgrade.status === 'pending';

  const getPlanBadge = () => {
    if (isPendingUpgrade) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
          <Clock className="w-3 h-3 text-amber-500 animate-spin" />
          UPGRADE PENDING
        </span>
      );
    }

    switch (plan) {
      case 'premium':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            <Crown className="w-3 h-3 text-amber-500" />
            PREMIUM
          </span>
        );
      case 'pro':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-300 dark:border-violet-800">
            <Zap className="w-3 h-3 text-violet-600 dark:text-violet-400" />
            PRO
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {isGuest ? 'GUEST' : 'FREE TIER'}
          </span>
        );
    }
  };

  const percentUsed = limit === -1 ? 0 : Math.min(100, Math.round((count / limit) * 100));

  return (
    <header id="app-header" className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand with Uploaded Logo & Hidden Admin Gesture */}
        <div
          onClick={handleLogoClick}
          className="flex items-center gap-3 select-none"
        >
          <AppLogo size="md" />
          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
          <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400 font-mono tracking-tight">
            AI Social Media Caption & Hashtag Suite
          </p>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Daily Quota pill */}
          <div className="hidden sm:flex flex-col items-end text-xs font-mono">
            <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 text-[11px]">
              {limit === -1 ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> UNLIMITED
                </span>
              ) : (
                <>
                  <span className="text-slate-900 dark:text-white font-bold">{remaining}</span> of{' '}
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
                      : 'bg-violet-600'
                  }`}
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
            )}
          </div>

          {/* Plan badge */}
          <div className="hidden lg:block">{getPlanBadge()}</div>

          {/* Upgrade CTA */}
          {plan !== 'premium' && (
            <button
              id="header-upgrade-btn"
              onClick={onOpenUpgrade}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold font-mono uppercase tracking-wider text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-md shadow-violet-600/25 border border-violet-500/30 transition active:scale-95 cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>{isPendingUpgrade ? 'Upgrade Info' : 'Go Pro'}</span>
            </button>
          )}

          {/* Bell Icon / Announcements Drawer */}
          <button
            id="header-announcements-btn"
            onClick={openAnnouncements}
            className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            title="Announcements & Inbox"
            aria-label="Announcements"
          >
            <Bell className="w-4 h-4" />
            {unreadAnnouncementsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white font-mono shadow-xs animate-bounce">
                {unreadAnnouncementsCount}
              </span>
            )}
          </button>

          {/* History drawer button */}
          <button
            id="header-history-btn"
            onClick={onOpenHistory}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            title="Saved Captions & History"
            aria-label="History"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Onboarding Guide Tip Button */}
          {onOpenOnboarding && (
            <button
              id="header-onboarding-btn"
              onClick={onOpenOnboarding}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer hidden sm:flex items-center justify-center"
              title="Why Captions Matter Guide"
              aria-label="Creator Guide"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}

          {/* User Account / Guest Sign In */}
          {isGuest ? (
            <div className="flex items-center gap-2">
              <button
                id="header-login-btn"
                onClick={() => openAuthModal('login')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-violet-600 bg-slate-100 hover:bg-violet-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
              <button
                id="header-signup-btn"
                onClick={() => openAuthModal('register')}
                className="hidden sm:inline-flex px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                id="header-user-menu-btn"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 hover:bg-violet-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-violet-600 text-white flex items-center justify-center text-[10px] font-mono font-bold shadow-xs">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <span className="max-w-[90px] truncate hidden sm:inline-block font-medium text-xs">
                  {user?.name || 'Account'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>
                    <p className="text-[11px] font-mono text-slate-400 truncate">{user?.email}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Plan:</span>
                      {getPlanBadge()}
                    </div>
                  </div>

                  <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                    <div className="flex justify-between items-center mb-1">
                      <span>TODAY'S USAGE:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {limit === -1 ? 'UNLIMITED' : `${count} / ${limit}`}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">Resets daily at 00:00 UTC</p>
                  </div>

                  <button
                    id="user-menu-upgrade-btn"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenUpgrade();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                    {isPendingUpgrade ? 'View Upgrade Status' : 'Upgrade to Pro / Premium'}
                  </button>

                  <button
                    id="user-menu-history-btn"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenHistory();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-blue-600" />
                    My Saved Captions
                  </button>

                  {onOpenOnboarding && (
                    <button
                      id="user-menu-onboarding-btn"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenOnboarding();
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                      Why Captions Matter Guide
                    </button>
                  )}

                  <button
                    id="user-menu-signout-btn"
                    onClick={() => {
                      setIsMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 mt-1 pt-2 font-semibold cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
