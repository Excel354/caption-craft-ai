export type PlatformId = 'instagram' | 'tiktok' | 'x' | 'facebook' | 'linkedin';

export type PlanTier = 'free' | 'pro' | 'premium';

export interface PlatformConfig {
  id: PlatformId;
  name: string;
  hardLimit: number;
  idealRange: string;
  idealMin: number;
  idealMax: number;
  toneGuidance: string;
  hashtagCountGuidance: string;
  hashtagMin: number;
  hashtagMax: number;
  iconName: string;
  accentColor: string;
  badgeBg: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  plan: PlanTier;
  createdAt: string;
}

export interface DailyUsage {
  userId: string;
  date: string; // YYYY-MM-DD UTC
  count: number;
  limit: number; // 10, 50, or -1 (unlimited)
  remaining: number;
}

export interface CaptionVariation {
  id: string;
  text: string;
  charCount: number;
  hook?: string;
  callToAction?: string;
  toneLabel?: string;
}

export interface GenerationRequest {
  topic: string;
  platform: PlatformId;
  includeEmojis: boolean;
  tone?: string;
  customContext?: string;
}

export interface GenerationResponse {
  success: boolean;
  captions: CaptionVariation[];
  hashtags: string[];
  platform: PlatformId;
  usage: {
    usedToday: number;
    limit: number;
    remaining: number;
    plan: PlanTier;
    resetsAtUtc: string;
  };
  error?: string;
  quotaExceeded?: boolean;
}

export interface SavedItem {
  id: string;
  topic: string;
  platform: PlatformId;
  caption: string;
  hashtags: string[];
  createdAt: string;
  isFavorite?: boolean;
}
