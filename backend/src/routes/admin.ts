import { Router, Request, Response } from 'express';
import { db } from '../db/client.js';
import { sendNewsletterEmail } from '../services/email.js';
import { marked } from 'marked';

const router = Router();

// Configure marked for better email rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

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

    // Convert markdown content to HTML
    const markdownContent = newsletter.content as string;
    const htmlContent = await marked.parse(markdownContent);

    // Wrap in styled container for better email presentation
    const styledHtmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.8; color: #1a1a1a; max-width: 680px; margin: 0 auto;">
        <style>
          h1 { font-size: 28px; font-weight: 700; margin: 32px 0 16px 0; color: #111; }
          h2 { font-size: 22px; font-weight: 600; margin: 28px 0 12px 0; color: #222; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
          h3 { font-size: 18px; font-weight: 600; margin: 24px 0 10px 0; color: #333; }
          p { margin: 16px 0; font-size: 16px; }
          ul, ol { margin: 16px 0; padding-left: 24px; }
          li { margin: 8px 0; }
          code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: 'Fira Code', Consolas, monospace; font-size: 14px; }
          pre { background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 20px 0; }
          pre code { background: none; padding: 0; color: inherit; }
          blockquote { border-left: 4px solid #667eea; padding-left: 16px; margin: 20px 0; color: #4b5563; font-style: italic; }
          table { border-collapse: collapse; width: 100%; margin: 20px 0; }
          th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
          th { background: #f9fafb; font-weight: 600; }
          img { max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0; }
          a { color: #667eea; text-decoration: none; }
          a:hover { text-decoration: underline; }
          hr { border: none; border-top: 1px solid #e5e7eb; margin: 32px 0; }
          strong { font-weight: 600; }
        </style>
        ${htmlContent}
      </div>
    `;

    // Send email to each subscriber
    for (const subscriber of subscribers) {
      const email = subscriber.email as string;
      const unsubscribeToken = subscriber.unsubscribe_token as string;

      console.log(`Sending newsletter to: ${email}`);

      const result = await sendNewsletterEmail(
        email,
        newsletter.subject as string,
        styledHtmlContent,
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

// DELETE /api/admin/newsletter/:id - Delete a newsletter
router.delete('/newsletter/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Delete related data first (likes, comments)
    await db.execute({
      sql: 'DELETE FROM likes WHERE newsletter_id = ?',
      args: [id],
    });

    await db.execute({
      sql: 'DELETE FROM comments WHERE newsletter_id = ?',
      args: [id],
    });

    // Delete the newsletter
    const result = await db.execute({
      sql: 'DELETE FROM newsletters WHERE id = ?',
      args: [id],
    });

    res.json({
      success: true,
      message: 'Newsletter deleted successfully',
    });
  } catch (error) {
    console.error('Delete newsletter error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
