import { db } from '../db/client.js';
import { generateSessionToken, generateMagicLinkToken } from '../utils/tokens.js';
import { sendMagicLinkEmail } from './email.js';

const MAGIC_LINK_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface Subscriber {
  id: number;
  email: string;
  name: string | null;
  status: string;
}

export async function requestMagicLink(
  email: string,
  returnUrl?: string
): Promise<{ success: boolean; message: string }> {
  // Check if subscriber exists and is active
  const result = await db.execute({
    sql: 'SELECT id, status FROM subscribers WHERE email = ?',
    args: [email.toLowerCase()],
  });

  if (result.rows.length === 0) {
    // Don't reveal if email exists - return same message
    return { success: true, message: 'If you have an account, check your email for the login link.' };
  }

  const subscriber = result.rows[0];
  if (subscriber.status !== 'active') {
    return { success: true, message: 'If you have an account, check your email for the login link.' };
  }

  // Generate magic link token
  const token = generateMagicLinkToken();
  const now = Date.now();
  const expiresAt = now + MAGIC_LINK_EXPIRY_MS;

  // Invalidate any existing magic links for this email
  await db.execute({
    sql: 'UPDATE magic_links SET used = 1 WHERE email = ? AND used = 0',
    args: [email.toLowerCase()],
  });

  // Create new magic link
  await db.execute({
    sql: 'INSERT INTO magic_links (email, token, created_at, expires_at, used) VALUES (?, ?, ?, ?, 0)',
    args: [email.toLowerCase(), token, now, expiresAt],
  });

  // Send magic link email
  const emailResult = await sendMagicLinkEmail(email, token, returnUrl);

  if (!emailResult.success) {
    console.error('Failed to send magic link email:', emailResult.error);
    return { success: false, message: 'Failed to send login email. Please try again.' };
  }

  return { success: true, message: 'Check your email for the login link.' };
}

export async function verifyMagicLink(
  token: string
): Promise<{ success: boolean; sessionToken?: string; subscriber?: Subscriber; error?: string }> {
  const now = Date.now();

  // Find the magic link
  const result = await db.execute({
    sql: 'SELECT id, email, expires_at, used FROM magic_links WHERE token = ?',
    args: [token],
  });

  if (result.rows.length === 0) {
    return { success: false, error: 'Invalid or expired link' };
  }

  const magicLink = result.rows[0];

  if (magicLink.used === 1) {
    return { success: false, error: 'This link has already been used' };
  }

  if (Number(magicLink.expires_at) < now) {
    return { success: false, error: 'This link has expired' };
  }

  // Mark magic link as used
  await db.execute({
    sql: 'UPDATE magic_links SET used = 1 WHERE id = ?',
    args: [magicLink.id],
  });

  // Get subscriber
  const subscriberResult = await db.execute({
    sql: 'SELECT id, email, name, status FROM subscribers WHERE email = ?',
    args: [magicLink.email],
  });

  if (subscriberResult.rows.length === 0) {
    return { success: false, error: 'Account not found' };
  }

  const subscriber = subscriberResult.rows[0] as unknown as Subscriber;

  // Create session
  const sessionToken = generateSessionToken();
  const expiresAt = now + SESSION_EXPIRY_MS;

  await db.execute({
    sql: 'INSERT INTO sessions (token, subscriber_id, created_at, expires_at) VALUES (?, ?, ?, ?)',
    args: [sessionToken, subscriber.id, now, expiresAt],
  });

  return {
    success: true,
    sessionToken,
    subscriber,
  };
}

export async function validateSession(
  token: string
): Promise<Subscriber | null> {
  const now = Date.now();

  const result = await db.execute({
    sql: `
      SELECT s.id, s.email, s.name, s.status
      FROM sessions sess
      JOIN subscribers s ON sess.subscriber_id = s.id
      WHERE sess.token = ? AND sess.expires_at > ?
    `,
    args: [token, now],
  });

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as unknown as Subscriber;
}

export async function invalidateSession(token: string): Promise<void> {
  await db.execute({
    sql: 'DELETE FROM sessions WHERE token = ?',
    args: [token],
  });
}

export async function cleanupExpiredSessions(): Promise<void> {
  const now = Date.now();
  await db.execute({
    sql: 'DELETE FROM sessions WHERE expires_at < ?',
    args: [now],
  });
  await db.execute({
    sql: 'DELETE FROM magic_links WHERE expires_at < ?',
    args: [now],
  });
}
