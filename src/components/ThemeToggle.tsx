import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'icon' | 'pill' | 'menu-item';
  className?: string;
  id?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  className = '',
  id = 'theme-toggle-btn',
}) => {
  const { theme, isDark, toggleTheme } = useTheme();

  if (variant === 'menu-item') {
    return (
      <button
        id={id}
        type="button"
        onClick={toggleTheme}
        className={`w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer transition-colors ${className}`}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        <div className="flex items-center gap-2">
          {isDark ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-indigo-600" />
          )}
          <span className="font-medium">{isDark ? 'Light Theme' : 'Dark Theme'}</span>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          {isDark ? 'Dark' : 'Light'}
        </span>
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        id={id}
        type="button"
        onClick={toggleTheme}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer border ${
          isDark
            ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
            : 'bg-white hover:bg-slate-50 text-indigo-700 border-slate-200 shadow-xs'
        } ${className}`}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        {isDark ? (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            <span>Light Mode</span>
          </>
        ) : (
          <>
            <Moon className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dark Mode</span>
          </>
        )}
      </button>
    );
  }

  // Default: icon button
  return (
    <button
      id={id}
      type="button"
      onClick={toggleTheme}
      className={`relative p-2 text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-amber-300 hover:bg-violet-50 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer active:scale-95 group ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 group-hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-slate-700 transition-transform duration-300 group-hover:-rotate-12" />
        )}
      </div>
      <span className="sr-only">Toggle theme (currently {theme})</span>
    </button>
  );
};
