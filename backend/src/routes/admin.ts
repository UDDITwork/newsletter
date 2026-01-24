import { Router, Request, Response } from 'express';
import { db } from '../db/client.js';
import { sendNewsletterEmail } from '../services/email.js';

const router = Router();

// POST /api/admin/send-newsletter/:id - Send newsletter to all active subscribers
router.post('/send-newsletter/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Fetch the newsletter
    const newsletterResult = await db.execute({
      sql: 'SELECT id, title, subject, content FROM newsletters WHERE id = ?',
      args: [id],
    });

    if (newsletterResult.rows.length === 0) {
      res.status(404).json({ error: 'Newsletter not found' });
      return;
    }

    const newsletter = newsletterResult.rows[0];

    // Fetch all active subscribers
    const subscribersResult = await db.execute({
      sql: 'SELECT email, unsubscribe_token FROM subscribers WHERE status = ?',
      args: ['active'],
    });

    if (subscribersResult.rows.length === 0) {
      res.status(400).json({ error: 'No active subscribers found' });
      return;
    }

    const subscribers = subscribersResult.rows;
    let successCount = 0;
    let failureCount = 0;
    const results: { email: string; success: boolean; error?: string }[] = [];

    // Send email to each subscriber
    for (const subscriber of subscribers) {
      const email = subscriber.email as string;
      const unsubscribeToken = subscriber.unsubscribe_token as string;

      console.log(`Sending newsletter to: ${email}`);

      const result = await sendNewsletterEmail(
        email,
        newsletter.subject as string,
        newsletter.content as string,
        unsubscribeToken
      );

      if (result.success) {
        successCount++;
        results.push({ email, success: true });
        console.log(`Successfully sent to: ${email}`);
      } else {
        failureCount++;
        results.push({ email, success: false, error: result.error });
        console.error(`Failed to send to: ${email}`, result.error);
      }
    }

    // Update newsletter sent_at timestamp if not already set
    await db.execute({
      sql: 'UPDATE newsletters SET sent_at = ?, status = ? WHERE id = ? AND sent_at IS NULL',
      args: [Date.now(), 'sent', id],
    });

    res.json({
      message: 'Newsletter sending completed',
      newsletterId: id,
      newsletterTitle: newsletter.title,
      totalSubscribers: subscribers.length,
      successCount,
      failureCount,
      results,
    });
  } catch (error) {
    console.error('Send newsletter error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/subscribers - List all subscribers
router.get('/subscribers', async (req: Request, res: Response) => {
  try {
    const result = await db.execute({
      sql: 'SELECT id, email, name, status, subscribe_date FROM subscribers ORDER BY subscribe_date DESC',
      args: [],
    });

    res.json({
      subscribers: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('List subscribers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/newsletters - List all newsletters
router.get('/newsletters', async (req: Request, res: Response) => {
  try {
    const result = await db.execute({
      sql: 'SELECT id, title, slug, status, created_at, sent_at FROM newsletters ORDER BY created_at DESC',
      args: [],
    });

    res.json({
      newsletters: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('List newsletters error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
