import { Request, Response, NextFunction } from 'express';
import { validateSession, Subscriber } from '../services/auth.js';

declare global {
  namespace Express {
    interface Request {
      subscriber?: Subscriber;
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.cookies?.session;

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const subscriber = await validateSession(token);

  if (!subscriber) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }

  req.subscriber = subscriber;
  next();
}

export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.cookies?.session;

  if (token) {
    const subscriber = await validateSession(token);
    if (subscriber) {
      req.subscriber = subscriber;
    }
  }

  next();
}
