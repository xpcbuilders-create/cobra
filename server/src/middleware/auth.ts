import type { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

export type AuthPayload = { userId: string; role: 'customer' | 'admin' };

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function requireAuth(secret: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    try {
      const payload = jwt.verify(token, secret) as AuthPayload;
      req.auth = payload;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
}

export function requireAdmin(secret: string) {
  const auth = requireAuth(secret);
  return (req: Request, res: Response, next: NextFunction) => {
    auth(req, res, () => {
      if (req.auth?.role !== 'admin') {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      next();
    });
  };
}
