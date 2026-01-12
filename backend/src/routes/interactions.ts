import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/client.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';

const router = Router();

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment too long'),
  parentId: z.number().optional(),
});

// Helper to get newsletter by slug
async function getNewsletterBySlug(slug: string) {
  const result = await db.execute({
    sql: 'SELECT id FROM newsletters WHERE slug = ?',
    args: [slug],
  });
  return result.rows[0] || null;
}

// GET /api/newsletter/:slug/likes - Get like count and user's like status
router.get('/:slug/likes', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const newsletter = await getNewsletterBySlug(slug);
    if (!newsletter) {
      res.status(404).json({ error: 'Newsletter not found' });
      return;
    }

    const countResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM likes WHERE newsletter_id = ?',
      args: [newsletter.id],
    });

    let userHasLiked = false;

    if (req.subscriber) {
      const userLikeResult = await db.execute({
        sql: 'SELECT id FROM likes WHERE newsletter_id = ? AND subscriber_id = ?',
        args: [newsletter.id, req.subscriber.id],
      });
      userHasLiked = userLikeResult.rows.length > 0;
    }

    res.json({
      count: Number(countResult.rows[0].count),
      userHasLiked,
    });
  } catch (error) {
    console.error('Get likes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/newsletter/:slug/likes - Toggle like
router.post('/:slug/likes', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const subscriberId = req.subscriber!.id;

    const newsletter = await getNewsletterBySlug(slug);
    if (!newsletter) {
      res.status(404).json({ error: 'Newsletter not found' });
      return;
    }

    // Check if already liked
    const existingLike = await db.execute({
      sql: 'SELECT id FROM likes WHERE newsletter_id = ? AND subscriber_id = ?',
      args: [newsletter.id, subscriberId],
    });

    let liked: boolean;

    if (existingLike.rows.length > 0) {
      // Unlike
      await db.execute({
        sql: 'DELETE FROM likes WHERE newsletter_id = ? AND subscriber_id = ?',
        args: [newsletter.id, subscriberId],
      });
      liked = false;
    } else {
      // Like
      await db.execute({
        sql: 'INSERT INTO likes (newsletter_id, subscriber_id, created_at) VALUES (?, ?, ?)',
        args: [newsletter.id, subscriberId, Date.now()],
      });
      liked = true;
    }

    // Get updated count
    const countResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM likes WHERE newsletter_id = ?',
      args: [newsletter.id],
    });

    res.json({
      liked,
      count: Number(countResult.rows[0].count),
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/newsletter/:slug/comments - Get all comments with replies
router.get('/:slug/comments', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const newsletter = await getNewsletterBySlug(slug);
    if (!newsletter) {
      res.status(404).json({ error: 'Newsletter not found' });
      return;
    }

    // Get all comments for this newsletter
    const result = await db.execute({
      sql: `SELECT c.id, c.parent_id, c.content, c.created_at,
                   s.id as subscriber_id, s.name, s.email
            FROM comments c
            JOIN subscribers s ON c.subscriber_id = s.id
            WHERE c.newsletter_id = ?
            ORDER BY c.created_at ASC`,
      args: [newsletter.id],
    });

    // Organize into tree structure (top-level comments with replies)
    const commentsMap = new Map<number, any>();
    const topLevelComments: any[] = [];

    // First pass: create comment objects
    for (const row of result.rows) {
      const comment = {
        id: row.id,
        content: row.content,
        createdAt: row.created_at,
        author: {
          id: row.subscriber_id,
          name: row.name || row.email?.toString().split('@')[0],
        },
        replies: [],
      };
      commentsMap.set(Number(row.id), comment);

      if (row.parent_id === null) {
        topLevelComments.push(comment);
      }
    }

    // Second pass: attach replies to parents
    for (const row of result.rows) {
      if (row.parent_id !== null) {
        const parent = commentsMap.get(Number(row.parent_id));
        if (parent) {
          parent.replies.push(commentsMap.get(Number(row.id)));
        }
      }
    }

    res.json({ comments: topLevelComments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/newsletter/:slug/comments - Add comment
router.post('/:slug/comments', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const subscriberId = req.subscriber!.id;

    const parsed = commentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { content, parentId } = parsed.data;

    const newsletter = await getNewsletterBySlug(slug);
    if (!newsletter) {
      res.status(404).json({ error: 'Newsletter not found' });
      return;
    }

    // If this is a reply, verify parent exists and is a top-level comment
    if (parentId) {
      const parentComment = await db.execute({
        sql: 'SELECT id, parent_id FROM comments WHERE id = ? AND newsletter_id = ?',
        args: [parentId, newsletter.id],
      });

      if (parentComment.rows.length === 0) {
        res.status(400).json({ error: 'Parent comment not found' });
        return;
      }

      // Only allow 1 level of replies
      if (parentComment.rows[0].parent_id !== null) {
        res.status(400).json({ error: 'Cannot reply to a reply' });
        return;
      }
    }

    const now = Date.now();

    const result = await db.execute({
      sql: `INSERT INTO comments (newsletter_id, subscriber_id, parent_id, content, created_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [newsletter.id, subscriberId, parentId || null, content, now],
    });

    res.json({
      success: true,
      comment: {
        id: Number(result.lastInsertRowid),
        content,
        createdAt: now,
        parentId: parentId || null,
        author: {
          id: req.subscriber!.id,
          name: req.subscriber!.name || req.subscriber!.email.split('@')[0],
        },
        replies: [],
      },
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
