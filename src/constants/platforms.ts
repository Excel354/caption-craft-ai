import { PlatformConfig, PlatformId } from '../types';

export const PLATFORMS: Record<PlatformId, PlatformConfig> = {
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    hardLimit: 2200,
    idealRange: '125–150 chars',
    idealMin: 125,
    idealMax: 150,
    toneGuidance: 'Casual, visual, personality-driven; strong hook in the first line since Instagram truncates in-feed.',
    hashtagCountGuidance: '5–10 relevant hashtags',
    hashtagMin: 5,
    hashtagMax: 10,
    iconName: 'Instagram',
    accentColor: 'from-pink-500 via-purple-500 to-amber-500',
    badgeBg: 'bg-gradient-to-r from-pink-500/10 to-purple-500/10 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800/40',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    hardLimit: 2200,
    idealRange: '30–100 chars',
    idealMin: 30,
    idealMax: 100,
    toneGuidance: 'Short, punchy, trend-aware, conversational — not polished/corporate.',
    hashtagCountGuidance: '3–5 high-engagement hashtags',
    hashtagMin: 3,
    hashtagMax: 5,
    iconName: 'Video',
    accentColor: 'from-cyan-400 to-rose-500',
    badgeBg: 'bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/40',
  },
  x: {
    id: 'x',
    name: 'X (Twitter)',
    hardLimit: 280,
    idealRange: '70–280 chars',
    idealMin: 70,
    idealMax: 280,
    toneGuidance: 'Concise, witty, or direct — every word earns its place. Must not exceed 280 chars.',
    hashtagCountGuidance: '1–2 punchy hashtags',
    hashtagMin: 1,
    hashtagMax: 2,
    iconName: 'Twitter',
    accentColor: 'from-zinc-700 to-zinc-900',
    badgeBg: 'bg-zinc-800/10 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700',
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    hardLimit: 500, // effectively soft limit, prompt asks to keep well under 300
    idealRange: '40–80 chars',
    idealMin: 40,
    idealMax: 250,
    toneGuidance: 'Warm, conversational; a question at the end helps drive comments and shares.',
    hashtagCountGuidance: '1–3 contextual hashtags',
    hashtagMin: 1,
    hashtagMax: 3,
    iconName: 'Facebook',
    accentColor: 'from-blue-600 to-blue-800',
    badgeBg: 'bg-blue-600/10 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/40',
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    hardLimit: 3000,
    idealRange: '150–300 chars',
    idealMin: 150,
    idealMax: 300,
    toneGuidance: 'Professional but personable; lead with insight, lesson, business value, or result.',
    hashtagCountGuidance: '3–5 industry and topic hashtags',
    hashtagMin: 3,
    hashtagMax: 5,
    iconName: 'Linkedin',
    accentColor: 'from-blue-700 to-sky-600',
    badgeBg: 'bg-blue-700/10 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700/50',
  },
};

export const PLAN_LIMITS = {
  free: 10,
  pro: 50,
  premium: -1, // -1 represents unlimited in user UI
} as const;

export const PREMIUM_FAIR_USE_SOFT_CAP = 150; // Server-side silent fair-use safeguard

export const DEFAULT_BANK_DETAILS = {
  accountNumber: '3040505559',
  bankName: 'First Bank',
  accountName: 'Christabel Clement',
  instructions: 'Please include your Account Email and requested Plan in the transfer description or reference note.',
} as const;

export const PLAN_PRICING = {
  free: {
    priceNaira: '₦0',
    amount: 0,
    period: 'forever',
    dailyLimitText: '10 generations/day',
  },
  pro: {
    priceNaira: '₦3,500',
    amount: 3500,
    period: '/ month',
    dailyLimitText: '50 generations/day',
  },
  premium: {
    priceNaira: '₦9,000',
    amount: 9000,
    period: '/ month',
    dailyLimitText: 'Unlimited generations',
  },
} as const;
