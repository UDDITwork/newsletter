import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requestMagicLink, verifyMagicLink, invalidateSession } from '../services/auth.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import { env } from '../config/env.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  returnUrl: z.string().optional(),
});

// POST /api/auth/login - Request magic link
router.post('/login', async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { email, returnUrl } = parsed.data;
    const result = await requestMagicLink(email, returnUrl);

    res.json({ success: result.success, message: result.message });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/verify/:token - Verify magic link and create session
router.get('/verify/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const result = await verifyMagicLink(token);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    // Set session cookie
    res.cookie('session', result.sessionToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });

    res.json({
      success: true,
      subscriber: result.subscriber,
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', optionalAuthMiddleware, async (req: Request, res: Response) => {
  if (!req.subscriber) {
    res.json({ subscriber: null });
    return;
  }

  res.json({
    subscriber: {
      id: req.subscriber.id,
      email: req.subscriber.email,
      name: req.subscriber.name,
      status: req.subscriber.status,
    },
  });
});

// POST /api/auth/logout - Logout
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.session;

    if (token) {
      await invalidateSession(token);
    }

    res.clearCookie('session', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
