import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwt';
const JWT_EXPIRES = '30d';

function buildToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: 'Email already exists' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, role: 'customer' });
  const token = buildToken(user._id.toString());

  res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Missing credentials' });

  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = buildToken(user._id.toString());
  res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token });
};

export const googleAuthRedirect = (req: Request, res: Response) => {
  res.send('Redirecting to Google OAuth...');
};

export const googleAuthCallback = async (req: Request, res: Response) => {
  const profile = (req as any).user;
  if (!profile) return res.redirect('/auth/login');

  const email = profile.emails[0].value;
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: profile.displayName || email,
      email,
      passwordHash: await bcrypt.hash(Math.random().toString(36), 12),
      role: 'customer',
    });
  }

  const token = buildToken(user._id.toString());
  res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/login?token=${token}`);
};
