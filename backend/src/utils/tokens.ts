import { randomBytes } from 'crypto';

export function generateToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

export function generateSessionToken(): string {
  return generateToken(32); // 64 hex chars
}

export function generateMagicLinkToken(): string {
  return generateToken(32); // 64 hex chars
}

export function generateConfirmToken(): string {
  return generateToken(24); // 48 hex chars
}

export function generateUnsubscribeToken(): string {
  return generateToken(24); // 48 hex chars
}
