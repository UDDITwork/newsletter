import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/client.js';
import { generateConfirmToken, generateUnsubscribeToken } from '../utils/tokens.js';
import { sendConfirmationEmail, sendUnsubscribeConfirmationEmail } from '../services/email.js';

const router = Router();

const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
});

// POST /api/newsletter/subscribe - Subscribe with email
router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const parsed = subscribeSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { email, name } = parsed.data;
    const emailLower = email.toLowerCase();

    // Check if already subscribed
    const existing = await db.execute({
      sql: 'SELECT id, status, confirm_token FROM subscribers WHERE email = ?',
      args: [emailLower],
    });

    if (existing.rows.length > 0) {
      const subscriber = existing.rows[0];

      if (subscriber.status === 'active') {
        res.json({ success: true, message: "You're already subscribed!" });
        return;
      }

      if (subscriber.status === 'pending') {
        // Resend confirmation email
        const token = subscriber.confirm_token as string;
        await sendConfirmationEmail(emailLower, token, name);
        res.json({ success: true, message: 'Almost there! Check your email to confirm.' });
        return;
      }

      if (subscriber.status === 'unsubscribed') {
        // Re-subscribe: generate new tokens and set to pending
        const confirmToken = generateConfirmToken();
        const unsubscribeToken = generateUnsubscribeToken();

        await db.execute({
          sql: `UPDATE subscribers
                SET status = 'pending',
                    confirm_token = ?,
                    unsubscribe_token = ?,
                    name = COALESCE(?, name),
                    subscribe_date = ?
                WHERE id = ?`,
          args: [confirmToken, unsubscribeToken, name || null, Date.now(), subscriber.id],
        });

        await sendConfirmationEmail(emailLower, confirmToken, name);
        res.json({ success: true, message: 'Welcome back! Check your email to confirm.' });
        return;
      }
    }

    // New subscriber
    const confirmToken = generateConfirmToken();
    const unsubscribeToken = generateUnsubscribeToken();
    const now = Date.now();

    await db.execute({
      sql: `INSERT INTO subscribers (email, name, status, subscribe_date, confirm_token, unsubscribe_token)
            VALUES (?, ?, 'pending', ?, ?, ?)`,
      args: [emailLower, name || null, now, confirmToken, unsubscribeToken],
    });

    const emailResult = await sendConfirmationEmail(emailLower, confirmToken, name);

    if (!emailResult.success) {
      console.error('Failed to send confirmation email:', emailResult.error);
      // Still return success since they're in the database
    }

    res.json({ success: true, message: 'Almost there! Check your email to confirm.' });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/newsletter/confirm/:token - Confirm email subscription
router.get('/confirm/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const result = await db.execute({
      sql: 'SELECT id, email, status FROM subscribers WHERE confirm_token = ?',
      args: [token],
    });

    if (result.rows.length === 0) {
      res.status(400).json({ error: 'Invalid or expired confirmation link' });
      return;
    }

    const subscriber = result.rows[0];

    if (subscriber.status === 'active') {
      res.json({ success: true, message: 'Your subscription is already confirmed!' });
      return;
    }

    await db.execute({
      sql: `UPDATE subscribers SET status = 'active', confirm_token = NULL WHERE id = ?`,
      args: [subscriber.id],
    });

    // Create default preferences
    await db.execute({
      sql: `INSERT OR IGNORE INTO subscriber_preferences (subscriber_id) VALUES (?)`,
      args: [subscriber.id],
    });

    res.json({ success: true, message: 'Your subscription has been confirmed!' });
  } catch (error) {
    console.error('Confirm error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/newsletter/unsubscribe/:token - Unsubscribe
router.get('/unsubscribe/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const result = await db.execute({
      sql: 'SELECT id, email, status FROM subscribers WHERE unsubscribe_token = ?',
      args: [token],
    });

    if (result.rows.length === 0) {
      res.status(400).json({ error: 'Invalid unsubscribe link' });
      return;
    }

    const subscriber = result.rows[0];

    if (subscriber.status === 'unsubscribed') {
      res.json({ success: true, message: "You're already unsubscribed." });
      return;
    }

    await db.execute({
      sql: `UPDATE subscribers SET status = 'unsubscribed' WHERE id = ?`,
      args: [subscriber.id],
    });

    // Send confirmation email
    await sendUnsubscribeConfirmationEmail(subscriber.email as string);

    res.json({ success: true, message: "You've been unsubscribed successfully." });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/newsletters - List all published newsletters
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const result = await db.execute({
      sql: `SELECT id, title, slug, excerpt, cover_image, created_at, tags
            FROM newsletters
            WHERE status = 'sent'
            ORDER BY sent_at DESC
            LIMIT ? OFFSET ?`,
      args: [limit, offset],
    });

    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as total FROM newsletters WHERE status = 'sent'`,
      args: [],
    });

    const total = Number(countResult.rows[0].total);

    res.json({
      newsletters: result.rows.map(row => ({
        ...row,
        tags: JSON.parse((row.tags as string) || '[]'),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List newsletters error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/newsletter/:slug - Get single newsletter
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const result = await db.execute({
      sql: `SELECT id, title, slug, subject, content, mdx_content, excerpt,
                   cover_image, created_at, sent_at, author_id, tags
            FROM newsletters
            WHERE slug = ? AND status = 'sent'`,
      args: [slug],
    });

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Newsletter not found' });
      return;
    }

    const newsletter = result.rows[0];

    res.json({
      newsletter: {
        ...newsletter,
        tags: JSON.parse((newsletter.tags as string) || '[]'),
      },
    });
  } catch (error) {
    console.error('Get newsletter error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
