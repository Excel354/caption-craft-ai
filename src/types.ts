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

export interface UpgradeRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  plan: 'pro' | 'premium';
  transferReference: string;
  senderName: string;
  notes?: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  resolvedAt?: string;
  resolutionNote?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  plan: PlanTier;
  createdAt: string;
  isSuspended?: boolean;
  suspendedAt?: string;
  pendingUpgrade?: UpgradeRequest | null;
  lastReadAnnouncementTime?: number;
  dismissedAnnouncementId?: string | null;
  hasSeenOnboarding?: boolean;
}

export interface DailyUsage {
  userId: string;
  date: string; // YYYY-MM-DD UTC
  count: number;
  limit: number; // 10, 50, or -1 (unlimited)
  remaining: number;
  realGeminiCalls?: number;
  cachedCalls?: number;
  fallbackCalls?: number;
  repeatedNudgeCount?: number;
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
  isFallback?: boolean;
  fallbackReason?: 'high_demand' | 'api_error' | 'no_key';
  isCached?: boolean;
  usage: {
    usedToday: number;
    limit: number;
    remaining: number;
    plan: PlanTier;
    resetsAtUtc: string;
  };
  error?: string;
  quotaExceeded?: boolean;
  isGuest?: boolean;
  isSuspended?: boolean;
}

export interface SavedItem {
  id: string;
  userId?: string;
  topic: string;
  platform: PlatformId;
  caption: string;
  hashtags: string[];
  createdAt: string;
  isFavorite?: boolean;
}

export interface SystemAnnouncement {
  id: string;
  message: string;
  active: boolean;
  type: 'info' | 'warning' | 'promo';
  createdAt?: string;
  updatedAt: string;
}

export interface BankConfig {
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingOrIban?: string;
  swiftCode?: string;
  instructions: string;
}

export interface AdminStats {
  totalUsers: number;
  planCounts: {
    free: number;
    pro: number;
    premium: number;
  };
  totalGenerationsToday: number;
  totalRealGeminiCallsToday: number;
  totalCachedCallsToday: number;
  totalFallbackCallsToday: number;
  pendingUpgradesCount: number;
  suspendedUsersCount: number;
  unreadSupportMessagesCount?: number;
}

export interface AdminUserItem {
  id: string;
  email: string;
  name: string;
  plan: PlanTier;
  createdAt: string;
  usedToday: number;
  realCallsToday: number;
  cachedCallsToday: number;
  repeatedNudgeCount: number;
  isSuspended: boolean;
  suspendedAt?: string;
  pendingUpgrade?: UpgradeRequest | null;
}

export interface SupportMessage {
  id: string;
  conversationId: string;
  senderRole: 'user' | 'admin';
  senderId: string;
  senderName: string;
  senderEmail?: string;
  recipientId: string; // 'admin' or userId
  subject?: string;
  message: string;
  createdAt: string;
  readByUser: boolean;
  readByAdmin: boolean;
}

export interface SupportConversation {
  userId: string;
  userName: string;
  userEmail: string;
  userPlan: PlanTier;
  totalMessages: number;
  unreadByAdminCount: number;
  lastMessage: SupportMessage;
  updatedAt: string;
}

