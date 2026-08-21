import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { PlanTier, User, DailyUsage, SavedItem } from '../src/types';
import { PLAN_LIMITS } from '../src/constants/platforms';

interface StoredUser extends User {
  passwordHash: string;
  passwordSalt: string;
}

interface StoredSession {
  token: string;
  userId: string;
  createdAt: number;
}

interface DatabaseSchema {
  users: Record<string, StoredUser>;
  sessions: Record<string, StoredSession>;
  dailyUsage: Record<string, number>; // key: `${userId}:${YYYY-MM-DD}`
  history: SavedItem[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class Database {
  private data: DatabaseSchema = {
    users: {},
    sessions: {},
    dailyUsage: {},
    history: [],
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
        this.data = JSON.parse(raw);
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
      };
      this.data.users[user.id] = user;
    }
  }

  public getTodayUtcString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0]; // e.g. "2026-08-21"
  }

  public getNextMidnightUtcIso(): string {
    const now = new Date();
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
    return tomorrow.toISOString();
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
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        createdAt: user.createdAt,
      },
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
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  public getUserByToken(token: string): User | null {
    const session = this.data.sessions[token];
    if (!session) return null;
    const user = this.data.users[session.userId];
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      createdAt: user.createdAt,
    };
  }

  public getUserById(userId: string): User | null {
    const user = this.data.users[userId];
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      createdAt: user.createdAt,
    };
  }

  public updateUserPlan(userId: string, plan: PlanTier): User {
    const user = this.data.users[userId];
    if (!user) throw new Error('User not found.');
    user.plan = plan;
    this.persist();
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      createdAt: user.createdAt,
    };
  }

  public getDailyUsage(userId: string): DailyUsage {
    const user = this.data.users[userId];
    const plan: PlanTier = user ? user.plan : 'free';
    const limit = PLAN_LIMITS[plan];
    const today = this.getTodayUtcString();
    const key = `${userId}:${today}`;
    const count = this.data.dailyUsage[key] || 0;

    const remaining = limit === -1 ? 999999 : Math.max(0, limit - count);

    return {
      userId,
      date: today,
      count,
      limit,
      remaining,
    };
  }

  /**
   * Atomically checks quota and increments if allowed.
   * Prevents race conditions during rapid double clicks.
   */
  public async checkAndIncrementUsage(userId: string): Promise<{
    allowed: boolean;
    count: number;
    limit: number;
    remaining: number;
    plan: PlanTier;
    resetsAtUtc: string;
  }> {
    // Acquire simple mutex lock
    return new Promise(resolve => {
      this.lock = this.lock.then(async () => {
        const user = this.data.users[userId];
        const plan: PlanTier = user ? user.plan : 'free';
        const limit = PLAN_LIMITS[plan];
        const today = this.getTodayUtcString();
        const key = `${userId}:${today}`;
        const currentCount = this.data.dailyUsage[key] || 0;
        const resetsAtUtc = this.getNextMidnightUtcIso();

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

        // Allowed - increment
        const newCount = currentCount + 1;
        this.data.dailyUsage[key] = newCount;
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
      this.persist();
    }
  }

  public addHistory(item: Omit<SavedItem, 'id' | 'createdAt'>): SavedItem {
    const newItem: SavedItem = {
      ...item,
      id: 'hist_' + crypto.randomUUID().slice(0, 8),
      createdAt: new Date().toISOString(),
    };
    this.data.history.unshift(newItem);
    if (this.data.history.length > 50) {
      this.data.history.pop();
    }
    this.persist();
    return newItem;
  }

  public getHistory(): SavedItem[] {
    return this.data.history;
  }

  public toggleFavorite(id: string): boolean {
    const item = this.data.history.find(h => h.id === id);
    if (item) {
      item.isFavorite = !item.isFavorite;
      this.persist();
      return !!item.isFavorite;
    }
    return false;
  }
}

export const db = new Database();
