import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { db } from './db';
import { generateSocialCaptions } from './gemini';
import { PlatformId, PlanTier } from '../src/types';

dotenv.config();

export const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper auth middleware
export interface AuthenticatedRequest extends Request {
  userId?: string;
  isGuest?: boolean;
  userEmail?: string;
}

export function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7).trim();
}

export function optionalOrGuestAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  if (!token) {
    // Generate/derive guest ID based on IP or header
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || 'guest';
    req.userId = 'gst_' + Buffer.from(clientIp).toString('hex').slice(0, 12);
    req.isGuest = true;
    return next();
  }

  const user = db.getUserByToken(token);
  if (!user) {
    // Fallback to guest tracking if token is expired
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || 'guest';
    req.userId = 'gst_' + Buffer.from(clientIp).toString('hex').slice(0, 12);
    req.isGuest = true;
    return next();
  }

  req.userId = user.id;
  req.userEmail = user.email;
  req.isGuest = false;
  next();
}

export function requireStrictUserAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please log in or create an account.' });
    return;
  }

  const user = db.getUserByToken(token);
  if (!user) {
    res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
    return;
  }

  req.userId = user.id;
  req.userEmail = user.email;
  req.isGuest = false;
  next();
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const adminToken = (req.headers['x-admin-token'] as string) || getBearerToken(req);
  if (!adminToken || !db.isValidAdminSession(adminToken)) {
    res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
    return;
  }
  next();
}

// In-memory duplicate request cache (10 min TTL)
interface GenerationCacheEntry {
  captions: any[];
  hashtags: string[];
  platform: PlatformId;
  timestamp: number;
  userId: string;
}
const generationCache = new Map<string, GenerationCacheEntry>();

// Create dedicated API router
const apiRouter = express.Router();

// -------------------------------------------------------------
// Public Announcements & Health
// -------------------------------------------------------------

apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

apiRouter.get('/announcement', (req: Request, res: Response) => {
  const ann = db.getAnnouncement();
  if (ann && ann.active && ann.message) {
    res.json({ announcement: ann });
  } else {
    res.json({ announcement: null });
  }
});

apiRouter.get('/announcements', (req: Request, res: Response) => {
  const announcements = db.getAllAnnouncements();
  res.json({ announcements });
});

// -------------------------------------------------------------
// User Auth Routes
// -------------------------------------------------------------

apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const { user, token } = await db.register(email, password, name);
    const usage = db.getDailyUsage(user.id);

    res.json({
      user,
      token,
      usage,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const { user, token } = await db.login(email, password);
    const usage = db.getDailyUsage(user.id);

    res.json({
      user,
      token,
      usage,
    });
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Login failed' });
  }
});

apiRouter.post('/auth/firebase-login', async (req: Request, res: Response) => {
  try {
    const { uid, email, name } = req.body;
    if (!uid) {
      res.status(400).json({ error: 'Firebase UID is required' });
      return;
    }

    const { user, token } = db.syncFirebaseUser(uid, email || '', name);
    const usage = db.getDailyUsage(user.id);

    res.json({
      user,
      token,
      usage,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Firebase authentication failed' });
  }
});

apiRouter.get('/auth/me', (req: AuthenticatedRequest, res: Response) => {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const user = db.getUserByToken(token);
  if (!user) {
    res.status(401).json({ error: 'Session not found' });
    return;
  }

  const usage = db.getDailyUsage(user.id);
  res.json({
    user,
    usage,
  });
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const token = getBearerToken(req);
  if (token) {
    db.revokeUserSession(token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// -------------------------------------------------------------
// Cloud-Persisted User Preferences & Read States
// -------------------------------------------------------------

apiRouter.post('/user/announcements/read', requireStrictUserAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const timestamp = db.markAnnouncementsRead(userId);
  res.json({ success: true, lastReadAnnouncementTime: timestamp });
});

apiRouter.post('/user/announcements/dismiss', requireStrictUserAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { announcementId } = req.body;
  if (announcementId) {
    db.dismissAnnouncementForUser(userId, announcementId);
  }
  res.json({ success: true, dismissedAnnouncementId: announcementId });
});

apiRouter.post('/user/onboarding/seen', requireStrictUserAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  db.setOnboardingSeenForUser(userId);
  res.json({ success: true, hasSeenOnboarding: true });
});

// -------------------------------------------------------------
// Usage & Plan Information
// -------------------------------------------------------------

apiRouter.get('/user/usage', optionalOrGuestAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const user = req.isGuest ? null : db.getUserById(userId);
  const usage = db.getDailyUsage(userId);
  res.json({
    usage,
    plan: user?.plan || 'free',
    resetsAtUtc: db.getNextMidnightUtcIso(),
    isGuest: !!req.isGuest,
  });
});

// -------------------------------------------------------------
// Manual Bank Transfer Upgrade Flow
// -------------------------------------------------------------

apiRouter.post('/upgrade/request', requireStrictUserAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { plan, transferReference, senderName, notes } = req.body as {
      plan: 'pro' | 'premium';
      transferReference: string;
      senderName: string;
      notes?: string;
    };

    if (!plan || !['pro', 'premium'].includes(plan)) {
      res.status(400).json({ error: 'Please select a valid tier (Pro or Premium).' });
      return;
    }

    if (!senderName || !senderName.trim()) {
      res.status(400).json({ error: 'Please enter the account name the transfer was sent from.' });
      return;
    }

    if (!transferReference || !transferReference.trim()) {
      res.status(400).json({ error: 'Please enter your bank transfer reference or transaction receipt code.' });
      return;
    }

    const request = db.createUpgradeRequest(userId, plan, transferReference, senderName, notes);
    const updatedUser = db.getUserById(userId);

    res.json({
      success: true,
      message: 'Upgrade request submitted successfully! An administrator will review your transfer.',
      request,
      user: updatedUser,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit upgrade request.' });
  }
});

// -------------------------------------------------------------
// Generation Endpoint
// -------------------------------------------------------------

apiRouter.post('/generate', optionalOrGuestAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const isGuest = !!req.isGuest;
  const { topic, platform, includeEmojis, tone, customContext } = req.body as {
    topic: string;
    platform: PlatformId;
    includeEmojis: boolean;
    tone?: string;
    customContext?: string;
  };

  if (!topic || !topic.trim()) {
    res.status(400).json({ error: 'Please provide an idea, topic, or description.' });
    return;
  }

  const validPlatforms: PlatformId[] = ['instagram', 'tiktok', 'x', 'facebook', 'linkedin'];
  const selectedPlatform = validPlatforms.includes(platform) ? platform : 'instagram';

  // Check user suspension or quota
  const quotaCheck = await db.checkAndIncrementUsage(userId);

  if (quotaCheck.isSuspended) {
    res.status(403).json({
      success: false,
      isSuspended: true,
      error: 'Your account is temporarily paused. Contact support if you think this is a mistake.',
    });
    return;
  }

  if (quotaCheck.isFairUseCapped) {
    res.status(429).json({
      success: false,
      quotaExceeded: true,
      error: 'Daily generation fair-use threshold reached (150/day). Limits reset at midnight UTC.',
      usage: {
        usedToday: quotaCheck.count,
        limit: quotaCheck.limit,
        remaining: 0,
        plan: quotaCheck.plan,
        resetsAtUtc: quotaCheck.resetsAtUtc,
      },
    });
    return;
  }

  if (!quotaCheck.allowed) {
    res.status(429).json({
      success: false,
      quotaExceeded: true,
      error: isGuest
        ? `You have used your 10 free daily guest generations. Create a free account or upgrade to continue!`
        : `You have reached your daily limit of ${quotaCheck.limit} generations for the ${quotaCheck.plan.toUpperCase()} plan. Daily limits reset at midnight UTC.`,
      usage: {
        usedToday: quotaCheck.count,
        limit: quotaCheck.limit,
        remaining: 0,
        plan: quotaCheck.plan,
        resetsAtUtc: quotaCheck.resetsAtUtc,
      },
    });
    return;
  }

  // Duplicate / Repeated Idea Cache Check (10 minutes window)
  const normalizedTopic = topic.trim().toLowerCase();
  const cacheKey = `${userId}:${selectedPlatform}:${!!includeEmojis}:${(tone || 'default').toLowerCase()}:${normalizedTopic}`;
  const cachedHit = generationCache.get(cacheKey);

  if (cachedHit && Date.now() - cachedHit.timestamp < 10 * 60 * 1000) {
    // Record cached call & repeated idea nudge metric for user insights
    db.recordUsageMetric(userId, 'cached');
    db.recordUsageMetric(userId, 'repeated_nudge');

    res.json({
      success: true,
      isFallback: false,
      isCached: true,
      captions: cachedHit.captions,
      hashtags: cachedHit.hashtags,
      platform: selectedPlatform,
      isGuest,
      usage: {
        usedToday: quotaCheck.count,
        limit: quotaCheck.limit,
        remaining: quotaCheck.remaining,
        plan: quotaCheck.plan,
        resetsAtUtc: quotaCheck.resetsAtUtc,
      },
    });
    return;
  }

  try {
    const result = await generateSocialCaptions({
      topic: topic.trim(),
      platform: selectedPlatform,
      includeEmojis: !!includeEmojis,
      tone,
      customContext,
    });

    if (result.isFallback) {
      // Do NOT charge quota for fallback-only generations
      db.rollbackUsage(userId);
      db.recordUsageMetric(userId, 'fallback');
      const freshUsage = db.getDailyUsage(userId);
      const remainingQuota = quotaCheck.limit === -1 ? 9999 : Math.max(0, quotaCheck.limit - freshUsage.count);

      res.json({
        success: true,
        isFallback: true,
        fallbackReason: result.fallbackReason || 'high_demand',
        captions: result.captions,
        hashtags: result.hashtags,
        platform: selectedPlatform,
        isGuest,
        usage: {
          usedToday: freshUsage.count,
          limit: quotaCheck.limit,
          remaining: remainingQuota,
          plan: quotaCheck.plan,
          resetsAtUtc: quotaCheck.resetsAtUtc,
        },
      });
      return;
    }

    // Record real Gemini API call metric
    db.recordUsageMetric(userId, 'real');

    // Populate memory cache
    generationCache.set(cacheKey, {
      captions: result.captions,
      hashtags: result.hashtags,
      platform: selectedPlatform,
      timestamp: Date.now(),
      userId,
    });

    // Save batch to user's history ONLY if logged in and real AI generation
    if (!isGuest) {
      db.addHistory(userId, {
        topic: topic.trim(),
        platform: selectedPlatform,
        caption: result.captions[0]?.text || '',
        hashtags: result.hashtags,
      });
    }

    res.json({
      success: true,
      isFallback: false,
      captions: result.captions,
      hashtags: result.hashtags,
      platform: selectedPlatform,
      isGuest,
      usage: {
        usedToday: quotaCheck.count,
        limit: quotaCheck.limit,
        remaining: quotaCheck.remaining,
        plan: quotaCheck.plan,
        resetsAtUtc: quotaCheck.resetsAtUtc,
      },
    });
  } catch (err: any) {
    console.error('Error generating captions:', err);
    db.rollbackUsage(userId);
    const freshUsage = db.getDailyUsage(userId);
    const user = !isGuest ? db.getUserById(userId) : null;
    const plan = user?.plan || 'free';
    const limit = plan === 'premium' ? 9999 : plan === 'pro' ? 50 : 10;

    res.status(500).json({
      success: false,
      error: err.message || 'Failed to generate captions. Please try again.',
      usage: {
        usedToday: freshUsage.count,
        limit,
        remaining: Math.max(0, limit - freshUsage.count),
        plan,
        resetsAtUtc: db.getNextMidnightUtcIso(),
      },
    });
  }
});

// -------------------------------------------------------------
// History Routes (Logged-in users only)
// -------------------------------------------------------------

apiRouter.get('/history', optionalOrGuestAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.isGuest || !req.userId) {
    res.json({ history: [], isGuest: true });
    return;
  }
  const history = db.getUserHistory(req.userId);
  res.json({ history, isGuest: false });
});

apiRouter.post('/history', requireStrictUserAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const item = req.body;
  if (!item || !item.caption) {
    res.status(400).json({ error: 'Caption is required' });
    return;
  }
  const saved = db.addHistory(userId, item);
  res.json({ success: true, item: saved });
});

apiRouter.delete('/history/:id', requireStrictUserAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;
  const deleted = db.deleteHistoryItem(userId, id);
  res.json({ success: deleted });
});

apiRouter.post('/history/favorite/:id', requireStrictUserAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;
  const isFavorite = db.toggleFavorite(userId, id);
  res.json({ success: true, isFavorite });
});

// -------------------------------------------------------------
// Hidden Admin Routes (/admin)
// -------------------------------------------------------------

apiRouter.post('/admin/login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password) {
    res.status(400).json({ error: 'Password is required' });
    return;
  }

  const isValid = db.verifyAdminPassword(password);
  if (!isValid) {
    res.status(401).json({ error: 'Invalid admin credentials' });
    return;
  }

  const token = db.createAdminSession();
  res.json({ success: true, token });
});

apiRouter.get('/admin/verify', requireAdminAuth, (req: Request, res: Response) => {
  res.json({ valid: true });
});

apiRouter.post('/admin/logout', (req: Request, res: Response) => {
  const adminToken = (req.headers['x-admin-token'] as string) || getBearerToken(req);
  if (adminToken) {
    db.revokeAdminSession(adminToken);
  }
  res.json({ success: true });
});

apiRouter.get('/admin/stats', requireAdminAuth, (req: Request, res: Response) => {
  const stats = db.getAdminStats();
  res.json({ stats });
});

apiRouter.get('/admin/users', requireAdminAuth, (req: Request, res: Response) => {
  const users = db.getAllUsers();
  res.json({ users });
});

apiRouter.post('/admin/users/:id/suspend', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = db.suspendUser(id);
    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to suspend user' });
  }
});

apiRouter.post('/admin/users/:id/unsuspend', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = db.unsuspendUser(id);
    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to unsuspend user' });
  }
});

apiRouter.get('/admin/upgrades', requireAdminAuth, (req: Request, res: Response) => {
  const pending = db.getPendingUpgrades();
  const resolved = db.getResolvedUpgrades();
  const all = db.getAllUpgradeRequests();
  res.json({ pending, resolved, all, upgrades: all });
});

apiRouter.post('/admin/upgrades/:id/approve', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const result = db.approveUpgrade(id, note);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to approve upgrade' });
  }
});

apiRouter.post('/admin/upgrades/:id/reject', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const result = db.rejectUpgrade(id, note);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to reject upgrade' });
  }
});

apiRouter.get('/admin/announcement', requireAdminAuth, (req: Request, res: Response) => {
  const announcement = db.getAnnouncement();
  const announcements = db.getAllAnnouncements();
  res.json({ announcement, announcements });
});

apiRouter.post('/admin/announcement', requireAdminAuth, (req: Request, res: Response) => {
  const { message, active, type } = req.body;
  if (!message || !message.trim()) {
    res.status(400).json({ error: 'Announcement message is required' });
    return;
  }
  const announcement = db.setAnnouncement(message, !!active, type || 'info');
  const announcements = db.getAllAnnouncements();
  res.json({ success: true, announcement, announcements });
});

apiRouter.get('/admin/bank-config', requireAdminAuth, (req: Request, res: Response) => {
  const bankConfig = db.getBankConfig();
  res.json({ bankConfig });
});

apiRouter.post('/admin/bank-config', requireAdminAuth, (req: Request, res: Response) => {
  const { bankName, accountName, accountNumber, instructions } = req.body;
  const updated = db.setBankConfig({
    bankName: bankName || '',
    accountName: accountName || '',
    accountNumber: accountNumber || '',
    instructions: instructions || '',
  });
  res.json({ success: true, bankConfig: updated });
});

// -------------------------------------------------------------
// User Help & Support Messaging Routes
// -------------------------------------------------------------

apiRouter.get('/support/messages', (req: AuthenticatedRequest, res: Response) => {
  const token = getBearerToken(req);
  const user = token ? db.getUserByToken(token) : null;
  const guestId = (req.headers['x-guest-id'] as string) || req.ip || 'guest';
  const userId = user ? user.id : guestId;
  const userEmail = user ? user.email : undefined;

  const messages = db.getSupportMessagesForUser(userId, userEmail);
  const unreadCount = db.getUnreadSupportCountForUser(userId, userEmail);

  res.json({ messages, unreadCount });
});

apiRouter.post('/support/messages', (req: AuthenticatedRequest, res: Response) => {
  try {
    const token = getBearerToken(req);
    const user = token ? db.getUserByToken(token) : null;
    const guestId = (req.headers['x-guest-id'] as string) || req.ip || 'guest';
    const userId = user ? user.id : guestId;
    const userName = user ? user.name : (req.body.senderName || 'Creator');
    const userEmail = user ? user.email : (req.body.senderEmail || '');
    const { message, subject } = req.body;

    if (!message || !message.trim()) {
      res.status(400).json({ error: 'Message cannot be empty' });
      return;
    }

    const newMsg = db.addSupportMessage({
      conversationId: userId,
      senderRole: 'user',
      senderId: userId,
      senderName: userName,
      senderEmail: userEmail,
      recipientId: 'admin',
      subject: subject || 'Help Request',
      message: message.trim(),
    });

    res.json({ success: true, message: newMsg });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to send support message' });
  }
});

apiRouter.post('/support/messages/read', (req: AuthenticatedRequest, res: Response) => {
  const token = getBearerToken(req);
  const user = token ? db.getUserByToken(token) : null;
  const guestId = (req.headers['x-guest-id'] as string) || req.ip || 'guest';
  const userId = user ? user.id : guestId;
  const userEmail = user ? user.email : undefined;

  db.markSupportMessagesReadByUser(userId, userEmail);
  res.json({ success: true });
});

// -------------------------------------------------------------
// Admin Support & Messaging Routes
// -------------------------------------------------------------

apiRouter.get('/admin/support/conversations', requireAdminAuth, (req: Request, res: Response) => {
  const conversations = db.getAllSupportConversations();
  res.json({ conversations });
});

apiRouter.get('/admin/support/conversations/:userId', requireAdminAuth, (req: Request, res: Response) => {
  const { userId } = req.params;
  const messages = db.getMessagesForConversation(userId);
  db.markConversationReadByAdmin(userId);
  res.json({ messages });
});

apiRouter.post('/admin/support/send', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { recipientId, subject, message } = req.body;
    if (!recipientId) {
      res.status(400).json({ error: 'recipientId is required' });
      return;
    }
    if (!message || !message.trim()) {
      res.status(400).json({ error: 'Message content cannot be empty' });
      return;
    }

    const newMsg = db.addSupportMessage({
      conversationId: recipientId,
      senderRole: 'admin',
      senderId: 'admin',
      senderName: 'Admin Team',
      senderEmail: 'support@captiongenerator.app',
      recipientId,
      subject: subject || 'Direct Message from Admin',
      message: message.trim(),
    });

    res.json({ success: true, message: newMsg });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to send message to user' });
  }
});

// Mount the apiRouter under both `/api` and `/` so requests like `/api/generate` or stripped `/generate` both resolve
app.use('/api', apiRouter);

// Global Error Handler for API routes
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('API server error:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({ error: err.message || 'Internal server error occurred' });
});

export default app;
