import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwt';

export interface AuthRequest extends Request {
  auth?: {
    userId: string;
  };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization required' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.auth = { userId: payload.userId };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.auth?.userId) {
    return res.status(401).json({ message: 'Admin authorization required' });
  }

  const user = await User.findById(req.auth.userId).lean();
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin privileges required' });
  }

  next();
};
