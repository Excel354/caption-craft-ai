import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { PlanTier, User, DailyUsage, SavedItem, UpgradeRequest, SystemAnnouncement, BankConfig, AdminStats, AdminUserItem } from '../src/types';
import { PLAN_LIMITS, PREMIUM_FAIR_USE_SOFT_CAP, DEFAULT_BANK_DETAILS } from '../src/constants/platforms';

interface StoredUser extends User {
  passwordHash: string;
  passwordSalt: string;
}

interface StoredSession {
  token: string;
  userId: string;
  createdAt: number;
}

interface DetailedUsageStats {
  count: number;
  realGeminiCalls: number;
  cachedCalls: number;
  fallbackCalls: number;
  repeatedNudgeCount: number;
}

interface DatabaseSchema {
  users: Record<string, StoredUser>;
  sessions: Record<string, StoredSession>;
  dailyUsage: Record<string, number>; // key: `${userId}:${YYYY-MM-DD}`
  dailyUsageDetails: Record<string, DetailedUsageStats>; // key: `${userId}:${YYYY-MM-DD}`
  userHistory: Record<string, SavedItem[]>; // key: userId
  upgradeRequests: Record<string, UpgradeRequest>; // key: requestId
  announcement: SystemAnnouncement;
  announcementsList: SystemAnnouncement[]; // Persistent history
  bankConfig: BankConfig;
  adminSessions: Record<string, number>; // token -> timestamp
  // Legacy migration compatibility
  history?: SavedItem[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const DEFAULT_BANK_CONFIG: BankConfig = {
  bankName: DEFAULT_BANK_DETAILS.bankName,
  accountName: DEFAULT_BANK_DETAILS.accountName,
  accountNumber: DEFAULT_BANK_DETAILS.accountNumber,
  instructions: DEFAULT_BANK_DETAILS.instructions,
};

const DEFAULT_ANNOUNCEMENT: SystemAnnouncement = {
  id: 'ann_initial',
  message: '🚀 Welcome to Caption Generator Pro! Manual bank transfer upgrades are reviewed promptly by our administration team.',
  active: true,
  type: 'promo',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

class Database {
  private data: DatabaseSchema = {
    users: {},
    sessions: {},
    dailyUsage: {},
    dailyUsageDetails: {},
    userHistory: {},
    upgradeRequests: {},
    announcement: DEFAULT_ANNOUNCEMENT,
    announcementsList: [DEFAULT_ANNOUNCEMENT],
    bankConfig: DEFAULT_BANK_CONFIG,
    adminSessions: {},
  };

  private lock = Promise.resolve();

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          ...this.data,
          ...parsed,
          dailyUsage: parsed.dailyUsage || {},
          dailyUsageDetails: parsed.dailyUsageDetails || {},
          userHistory: parsed.userHistory || {},
          upgradeRequests: parsed.upgradeRequests || {},
          announcement: parsed.announcement || DEFAULT_ANNOUNCEMENT,
          announcementsList: Array.isArray(parsed.announcementsList) && parsed.announcementsList.length > 0
            ? parsed.announcementsList
            : [parsed.announcement || DEFAULT_ANNOUNCEMENT],
          bankConfig: {
            ...DEFAULT_BANK_CONFIG,
            ...(parsed.bankConfig || {}),
          },
          adminSessions: parsed.adminSessions || {},
        };
        // Migrate legacy global history to default user if present
        if (Array.isArray(parsed.history) && parsed.history.length > 0) {
          const defaultUser = this.getOrCreateDefaultUser();
          if (!this.data.userHistory[defaultUser.id]) {
            this.data.userHistory[defaultUser.id] = parsed.history.map((h: SavedItem) => ({
              ...h,
              userId: defaultUser.id,
            }));
          }
        }
      } else {
        this.seedInitialUser();
        this.persist();
      }
    } catch (err) {
      console.warn('Database init warning, starting fresh:', err);
      this.seedInitialUser();
    }
  }

  private persist() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist db to disk:', err);
    }
  }

  private hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  }

  private seedInitialUser() {
    const defaultEmail = 'creator@example.com';
    if (!Object.values(this.data.users).some(u => u.email === defaultEmail)) {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = this.hashPassword('password123', salt);
      const user: StoredUser = {
        id: 'usr_' + crypto.randomUUID().slice(0, 8),
        email: defaultEmail,
        name: 'Demo Creator',
        plan: 'free',
        passwordHash: hash,
        passwordSalt: salt,
        createdAt: new Date().toISOString(),
        isSuspended: false,
      };
      this.data.users[user.id] = user;
    }
  }

  public getOrCreateDefaultUser(): User {
    const defaultEmail = 'creator@example.com';
    let user = Object.values(this.data.users).find(u => u.email === defaultEmail);
    if (!user) {
      this.seedInitialUser();
      user = Object.values(this.data.users).find(u => u.email === defaultEmail);
    }
    if (!user) {
      const id = 'usr_' + crypto.randomUUID().slice(0, 8);
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = this.hashPassword('password123', salt);
      const newUser: StoredUser = {
        id,
        email: defaultEmail,
        name: 'Demo Creator',
        plan: 'free',
        passwordHash: hash,
        passwordSalt: salt,
        createdAt: new Date().toISOString(),
        isSuspended: false,
      };
      this.data.users[id] = newUser;
      this.persist();
      user = newUser;
    }
    return this.mapUser(user);
  }

  public getTodayUtcString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0]; // e.g. "2026-08-27"
  }

  public getNextMidnightUtcIso(): string {
    const now = new Date();
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
    return tomorrow.toISOString();
  }

  private mapUser(stored: StoredUser): User {
    // Find active pending upgrade if any
    const pendingUpgrade = Object.values(this.data.upgradeRequests).find(
      u => u.userId === stored.id && u.status === 'pending'
    ) || stored.pendingUpgrade;

    return {
      id: stored.id,
      email: stored.email,
      name: stored.name,
      plan: stored.plan,
      createdAt: stored.createdAt,
      isSuspended: !!stored.isSuspended,
      suspendedAt: stored.suspendedAt,
      pendingUpgrade: pendingUpgrade || null,
    };
  }

  public async register(email: string, password: string, name?: string): Promise<{ user: User; token: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = Object.values(this.data.users).find(u => u.email === normalizedEmail);
    if (existing) {
      throw new Error('Email is already registered. Please log in.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = this.hashPassword(password, salt);
    const id = 'usr_' + crypto.randomUUID().slice(0, 8);

    const user: StoredUser = {
      id,
      email: normalizedEmail,
      name: name?.trim() || normalizedEmail.split('@')[0],
      plan: 'free',
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: new Date().toISOString(),
      isSuspended: false,
    };

    this.data.users[id] = user;

    const token = crypto.randomBytes(32).toString('hex');
    this.data.sessions[token] = {
      token,
      userId: id,
      createdAt: Date.now(),
    };

    this.persist();
    return {
      user: this.mapUser(user),
      token,
    };
  }

  public async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = Object.values(this.data.users).find(u => u.email === normalizedEmail);
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const hash = this.hashPassword(password, user.passwordSalt);
    if (hash !== user.passwordHash) {
      throw new Error('Invalid email or password.');
    }

    const token = crypto.randomBytes(32).toString('hex');
    this.data.sessions[token] = {
      token,
      userId: user.id,
      createdAt: Date.now(),
    };

    this.persist();
    return {
      user: this.mapUser(user),
      token,
    };
  }

  public getUserByToken(token: string): User | null {
    const session = this.data.sessions[token];
    if (!session) return null;
    const user = this.data.users[session.userId];
    if (!user) return null;
    return this.mapUser(user);
  }

  public getUserById(userId: string): User | null {
    const user = this.data.users[userId];
    if (!user) return null;
    return this.mapUser(user);
  }

  public updateUserPlan(userId: string, plan: PlanTier): User {
    const user = this.data.users[userId];
    if (!user) throw new Error('User not found.');
    user.plan = plan;
    this.persist();
    return this.mapUser(user);
  }

  public suspendUser(userId: string): User {
    const user = this.data.users[userId];
    if (!user) throw new Error('User not found.');
    user.isSuspended = true;
    user.suspendedAt = new Date().toISOString();
    this.persist();
    return this.mapUser(user);
  }

  public unsuspendUser(userId: string): User {
    const user = this.data.users[userId];
    if (!user) throw new Error('User not found.');
    user.isSuspended = false;
    delete user.suspendedAt;
    this.persist();
    return this.mapUser(user);
  }

  public getDailyUsage(userId: string): DailyUsage {
    const user = this.data.users[userId];
    const plan: PlanTier = user ? user.plan : 'free';
    const limit = PLAN_LIMITS[plan];
    const today = this.getTodayUtcString();
    const key = `${userId}:${today}`;
    const count = this.data.dailyUsage[key] || 0;
    const details = this.data.dailyUsageDetails[key] || {
      count,
      realGeminiCalls: 0,
      cachedCalls: 0,
      fallbackCalls: 0,
      repeatedNudgeCount: 0,
    };

    const remaining = limit === -1 ? 999999 : Math.max(0, limit - count);

    return {
      userId,
      date: today,
      count,
      limit,
      remaining,
      realGeminiCalls: details.realGeminiCalls,
      cachedCalls: details.cachedCalls,
      fallbackCalls: details.fallbackCalls,
      repeatedNudgeCount: details.repeatedNudgeCount,
    };
  }

  public recordUsageMetric(userId: string, type: 'real' | 'cached' | 'fallback' | 'repeated_nudge'): void {
    const today = this.getTodayUtcString();
    const key = `${userId}:${today}`;
    if (!this.data.dailyUsageDetails[key]) {
      this.data.dailyUsageDetails[key] = {
        count: this.data.dailyUsage[key] || 0,
        realGeminiCalls: 0,
        cachedCalls: 0,
        fallbackCalls: 0,
        repeatedNudgeCount: 0,
      };
    }

    const detail = this.data.dailyUsageDetails[key];
    if (type === 'real') detail.realGeminiCalls += 1;
    if (type === 'cached') detail.cachedCalls += 1;
    if (type === 'fallback') detail.fallbackCalls += 1;
    if (type === 'repeated_nudge') detail.repeatedNudgeCount += 1;

    this.persist();
  }

  public async checkAndIncrementUsage(userId: string): Promise<{
    allowed: boolean;
    count: number;
    limit: number;
    remaining: number;
    plan: PlanTier;
    resetsAtUtc: string;
    isSuspended?: boolean;
    isFairUseCapped?: boolean;
  }> {
    return new Promise(resolve => {
      this.lock = this.lock.then(async () => {
        const user = this.data.users[userId];
        if (user && user.isSuspended) {
          resolve({
            allowed: false,
            count: 0,
            limit: 0,
            remaining: 0,
            plan: user.plan,
            resetsAtUtc: this.getNextMidnightUtcIso(),
            isSuspended: true,
          });
          return;
        }

        const plan: PlanTier = user ? user.plan : 'free';
        const limit = PLAN_LIMITS[plan];
        const today = this.getTodayUtcString();
        const key = `${userId}:${today}`;
        const currentCount = this.data.dailyUsage[key] || 0;
        const resetsAtUtc = this.getNextMidnightUtcIso();

        // Check standard limits
        if (limit !== -1 && currentCount >= limit) {
          resolve({
            allowed: false,
            count: currentCount,
            limit,
            remaining: 0,
            plan,
            resetsAtUtc,
          });
          return;
        }

        // Silent server-side fair-use safeguard for Premium (150/day)
        if (limit === -1 && currentCount >= PREMIUM_FAIR_USE_SOFT_CAP) {
          resolve({
            allowed: false,
            count: currentCount,
            limit,
            remaining: 0,
            plan,
            resetsAtUtc,
            isFairUseCapped: true,
          });
          return;
        }

        const newCount = currentCount + 1;
        this.data.dailyUsage[key] = newCount;
        if (!this.data.dailyUsageDetails[key]) {
          this.data.dailyUsageDetails[key] = {
            count: newCount,
            realGeminiCalls: 0,
            cachedCalls: 0,
            fallbackCalls: 0,
            repeatedNudgeCount: 0,
          };
        } else {
          this.data.dailyUsageDetails[key].count = newCount;
        }

        this.persist();

        const remaining = limit === -1 ? 999999 : Math.max(0, limit - newCount);

        resolve({
          allowed: true,
          count: newCount,
          limit,
          remaining,
          plan,
          resetsAtUtc,
        });
      });
    });
  }

  public rollbackUsage(userId: string): void {
    const today = this.getTodayUtcString();
    const key = `${userId}:${today}`;
    if (this.data.dailyUsage[key] && this.data.dailyUsage[key] > 0) {
      this.data.dailyUsage[key] = Math.max(0, this.data.dailyUsage[key] - 1);
      if (this.data.dailyUsageDetails[key]) {
        this.data.dailyUsageDetails[key].count = this.data.dailyUsage[key];
      }
      this.persist();
    }
  }

  // -------------------------------------------------------------
  // User History Management (Per-User)
  // -------------------------------------------------------------

  public addHistory(userId: string, item: Omit<SavedItem, 'id' | 'createdAt' | 'userId'>): SavedItem {
    if (!this.data.userHistory[userId]) {
      this.data.userHistory[userId] = [];
    }

    const newItem: SavedItem = {
      ...item,
      id: 'hist_' + crypto.randomUUID().slice(0, 8),
      userId,
      createdAt: new Date().toISOString(),
    };

    this.data.userHistory[userId].unshift(newItem);
    // Keep last 100 per user
    if (this.data.userHistory[userId].length > 100) {
      this.data.userHistory[userId].pop();
    }

    this.persist();
    return newItem;
  }

  public getUserHistory(userId: string): SavedItem[] {
    return this.data.userHistory[userId] || [];
  }

  public deleteHistoryItem(userId: string, itemId: string): boolean {
    const items = this.data.userHistory[userId];
    if (!items) return false;
    const initialLen = items.length;
    this.data.userHistory[userId] = items.filter(h => h.id !== itemId);
    if (this.data.userHistory[userId].length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  public toggleFavorite(userId: string, itemId: string): boolean {
    const items = this.data.userHistory[userId];
    if (!items) return false;
    const item = items.find(h => h.id === itemId);
    if (item) {
      item.isFavorite = !item.isFavorite;
      this.persist();
      return !!item.isFavorite;
    }
    return false;
  }

  // -------------------------------------------------------------
  // Manual Bank Transfer Upgrade Requests
  // -------------------------------------------------------------

  public createUpgradeRequest(
    userId: string,
    plan: 'pro' | 'premium',
    transferReference: string,
    senderName: string,
    notes?: string
  ): UpgradeRequest {
    const user = this.data.users[userId];
    if (!user) throw new Error('User not found');

    const requestId = 'upg_' + crypto.randomUUID().slice(0, 8);
    const req: UpgradeRequest = {
      id: requestId,
      userId,
      userEmail: user.email,
      userName: user.name,
      plan,
      transferReference: transferReference.trim(),
      senderName: senderName.trim(),
      notes: notes?.trim(),
      requestedAt: new Date().toISOString(),
      status: 'pending',
    };

    this.data.upgradeRequests[requestId] = req;
    user.pendingUpgrade = req;
    this.persist();
    return req;
  }

  public getAllUpgradeRequests(): UpgradeRequest[] {
    return Object.values(this.data.upgradeRequests).sort(
      (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );
  }

  public getPendingUpgrades(): UpgradeRequest[] {
    return Object.values(this.data.upgradeRequests)
      .filter(r => r.status === 'pending')
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }

  public getResolvedUpgrades(): UpgradeRequest[] {
    return Object.values(this.data.upgradeRequests)
      .filter(r => r.status === 'approved' || r.status === 'rejected')
      .sort((a, b) => new Date(b.resolvedAt || b.requestedAt).getTime() - new Date(a.resolvedAt || a.requestedAt).getTime());
  }

  public approveUpgrade(requestId: string, resolutionNote?: string): { user: User; request: UpgradeRequest } {
    const req = this.data.upgradeRequests[requestId];
    if (!req) throw new Error('Upgrade request not found');

    const user = this.data.users[req.userId];
    if (!user) throw new Error('User for this request not found');

    req.status = 'approved';
    req.resolvedAt = new Date().toISOString();
    if (resolutionNote) req.resolutionNote = resolutionNote;

    user.plan = req.plan;
    user.pendingUpgrade = null;

    this.persist();
    return {
      user: this.mapUser(user),
      request: req,
    };
  }

  public rejectUpgrade(requestId: string, resolutionNote?: string): { user: User; request: UpgradeRequest } {
    const req = this.data.upgradeRequests[requestId];
    if (!req) throw new Error('Upgrade request not found');

    const user = this.data.users[req.userId];
    if (!user) throw new Error('User for this request not found');

    req.status = 'rejected';
    req.resolvedAt = new Date().toISOString();
    if (resolutionNote) req.resolutionNote = resolutionNote;

    user.pendingUpgrade = null;

    this.persist();
    return {
      user: this.mapUser(user),
      request: req,
    };
  }

  // -------------------------------------------------------------
  // Announcements & Persistent Messages Inbox
  // -------------------------------------------------------------

  public getAnnouncement(): SystemAnnouncement {
    return this.data.announcement || DEFAULT_ANNOUNCEMENT;
  }

  public getAllAnnouncements(): SystemAnnouncement[] {
    const list = this.data.announcementsList || [this.data.announcement || DEFAULT_ANNOUNCEMENT];
    return [...list].sort(
      (a, b) => new Date(b.createdAt || b.updatedAt).getTime() - new Date(a.createdAt || a.updatedAt).getTime()
    );
  }

  public setAnnouncement(message: string, active: boolean, type: 'info' | 'warning' | 'promo' = 'info'): SystemAnnouncement {
    const now = new Date().toISOString();
    const announcement: SystemAnnouncement = {
      id: 'ann_' + crypto.randomUUID().slice(0, 8),
      message: message.trim(),
      active,
      type,
      createdAt: now,
      updatedAt: now,
    };
    this.data.announcement = announcement;
    if (!this.data.announcementsList) {
      this.data.announcementsList = [];
    }
    this.data.announcementsList.unshift(announcement);
    // Keep max 50 announcements
    if (this.data.announcementsList.length > 50) {
      this.data.announcementsList = this.data.announcementsList.slice(0, 50);
    }
    this.persist();
    return announcement;
  }

  // -------------------------------------------------------------
  // Bank Transfer Server-Side Configuration (Private to Admin)
  // -------------------------------------------------------------

  public getBankConfig(): BankConfig {
    return this.data.bankConfig || DEFAULT_BANK_CONFIG;
  }

  public setBankConfig(config: Partial<BankConfig>): BankConfig {
    this.data.bankConfig = {
      ...DEFAULT_BANK_CONFIG,
      ...this.data.bankConfig,
      ...config,
    };
    this.persist();
    return this.data.bankConfig;
  }

  // -------------------------------------------------------------
  // Admin Authentication & Administration
  // -------------------------------------------------------------

  public verifyAdminPassword(password: string): boolean {
    const configuredPassword = process.env.ADMIN_PASSWORD || 'admin2026!';
    return password === configuredPassword;
  }

  public createAdminSession(): string {
    const token = 'adm_' + crypto.randomBytes(32).toString('hex');
    this.data.adminSessions[token] = Date.now();
    this.persist();
    return token;
  }

  public isValidAdminSession(token: string): boolean {
    if (!token || !token.startsWith('adm_')) return false;
    const createdAt = this.data.adminSessions[token];
    if (!createdAt) return false;
    // Session valid for 7 days
    const isExpired = Date.now() - createdAt > 7 * 24 * 60 * 60 * 1000;
    if (isExpired) {
      delete this.data.adminSessions[token];
      this.persist();
      return false;
    }
    return true;
  }

  public revokeAdminSession(token: string): void {
    if (this.data.adminSessions[token]) {
      delete this.data.adminSessions[token];
      this.persist();
    }
  }

  public getAllUsers(): AdminUserItem[] {
    const today = this.getTodayUtcString();
    return Object.values(this.data.users).map(u => {
      const key = `${u.id}:${today}`;
      const usedToday = this.data.dailyUsage[key] || 0;
      const details = this.data.dailyUsageDetails[key] || {
        count: usedToday,
        realGeminiCalls: 0,
        cachedCalls: 0,
        fallbackCalls: 0,
        repeatedNudgeCount: 0,
      };
      const pending = Object.values(this.data.upgradeRequests).find(
        req => req.userId === u.id && req.status === 'pending'
      );
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        plan: u.plan,
        createdAt: u.createdAt,
        usedToday,
        realCallsToday: details.realGeminiCalls,
        cachedCallsToday: details.cachedCalls,
        repeatedNudgeCount: details.repeatedNudgeCount,
        isSuspended: !!u.isSuspended,
        suspendedAt: u.suspendedAt,
        pendingUpgrade: pending || null,
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAdminStats(): AdminStats {
    const users = Object.values(this.data.users);
    const today = this.getTodayUtcString();
    let totalGenerationsToday = 0;
    let totalRealGeminiCallsToday = 0;
    let totalCachedCallsToday = 0;
    let totalFallbackCallsToday = 0;

    for (const [key, count] of Object.entries(this.data.dailyUsage)) {
      if (key.endsWith(`:${today}`)) {
        totalGenerationsToday += count;
      }
    }

    for (const [key, details] of Object.entries(this.data.dailyUsageDetails)) {
      if (key.endsWith(`:${today}`)) {
        totalRealGeminiCallsToday += details.realGeminiCalls || 0;
        totalCachedCallsToday += details.cachedCalls || 0;
        totalFallbackCallsToday += details.fallbackCalls || 0;
      }
    }

    const planCounts = {
      free: users.filter(u => u.plan === 'free').length,
      pro: users.filter(u => u.plan === 'pro').length,
      premium: users.filter(u => u.plan === 'premium').length,
    };

    const pendingUpgradesCount = Object.values(this.data.upgradeRequests).filter(
      r => r.status === 'pending'
    ).length;

    const suspendedUsersCount = users.filter(u => !!u.isSuspended).length;

    return {
      totalUsers: users.length,
      planCounts,
      totalGenerationsToday,
      totalRealGeminiCallsToday,
      totalCachedCallsToday,
      totalFallbackCallsToday,
      pendingUpgradesCount,
      suspendedUsersCount,
    };
  }
}

export const db = new Database();
