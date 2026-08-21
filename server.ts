import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { generateSocialCaptions } from './server/gemini';
import { PlatformId, PlanTier } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper auth middleware
interface AuthenticatedRequest extends Request {
  userId?: string;
}

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7).trim();
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const user = db.getUserByToken(token);
  if (!user) {
    res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
    return;
  }

  req.userId = user.id;
  next();
}

// -------------------------------------------------------------
// Auth Routes
// -------------------------------------------------------------

app.post('/api/auth/register', async (req: Request, res: Response) => {
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

app.post('/api/auth/login', async (req: Request, res: Response) => {
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

app.get('/api/auth/me', (req: AuthenticatedRequest, res: Response) => {
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

// -------------------------------------------------------------
// Usage & User Settings
// -------------------------------------------------------------

app.get('/api/user/usage', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const user = db.getUserById(userId);
  const usage = db.getDailyUsage(userId);
  res.json({
    usage,
    plan: user?.plan || 'free',
    resetsAtUtc: db.getNextMidnightUtcIso(),
  });
});

app.post('/api/user/plan', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { plan } = req.body as { plan: PlanTier };

  if (!['free', 'pro', 'premium'].includes(plan)) {
    res.status(400).json({ error: 'Invalid plan tier' });
    return;
  }

  const updatedUser = db.updateUserPlan(userId, plan);
  const usage = db.getDailyUsage(userId);

  res.json({
    user: updatedUser,
    usage,
  });
});

// -------------------------------------------------------------
// Generation Endpoint
// -------------------------------------------------------------

app.post('/api/generate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
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

  // Step 1 to 4: Check daily quota atomically before calling Gemini
  const quotaCheck = await db.checkAndIncrementUsage(userId);

  if (!quotaCheck.allowed) {
    res.status(429).json({
      success: false,
      quotaExceeded: true,
      error: `You have reached your daily limit of ${quotaCheck.limit} generations for the ${quotaCheck.plan.toUpperCase()} plan. Daily limits reset at midnight UTC.`,
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

  try {
    // Step 5 & 6: Call Gemini API server-side
    const result = await generateSocialCaptions({
      topic: topic.trim(),
      platform: selectedPlatform,
      includeEmojis: !!includeEmojis,
      tone,
      customContext,
    });

    // Save batch to recent history
    db.addHistory({
      topic: topic.trim(),
      platform: selectedPlatform,
      caption: result.captions[0]?.text || '',
      hashtags: result.hashtags,
    });

    // Step 8: Return validated captions, hashtags and remaining generation count
    res.json({
      success: true,
      captions: result.captions,
      hashtags: result.hashtags,
      platform: selectedPlatform,
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
    // Roll back usage count so user is not penalized for API errors
    db.rollbackUsage(userId);
    const freshUsage = db.getDailyUsage(userId);
    const user = db.getUserById(userId);
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
// History Routes
// -------------------------------------------------------------

app.get('/api/history', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const history = db.getHistory();
  res.json({ history });
});

app.post('/api/history/favorite/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const isFavorite = db.toggleFavorite(id);
  res.json({ success: true, isFavorite });
});

// -------------------------------------------------------------
// Server Start & Vite Middleware
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Content-Caption Generator running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
