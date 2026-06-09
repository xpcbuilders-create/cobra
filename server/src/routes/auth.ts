import crypto from 'crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User.js';
import { sendWelcomeEmail, sendResetPasswordEmail } from '../lib/email.js';

export function authRoutes(jwtSecret: string) {
  const r = Router();

  r.post('/register', async (req, res) => {
    const { email, password, name } = req.body as {
      email?: string;
      password?: string;
      name?: string;
    };
    if (!email || !password || !name) {
      res.status(400).json({ error: 'email, password, and name are required' });
      return;
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: 'customer',
    });
    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
    );
    res.status(201).json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    void sendWelcomeEmail(user.email, user.name);
  });

  r.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string };
      const normalizedEmail = email?.trim().toLowerCase();
      console.log('Login attempt:', { email: normalizedEmail });
      if (!normalizedEmail || !password) {
        res.status(400).json({ error: 'email and password are required' });
        return;
      }

      const user = await User.findOne({ email: normalizedEmail });
      console.log('User found:', !!user, user?.email);
      if (!user || !user.passwordHash) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      let passwordMatches = false;
      try {
        passwordMatches = await bcrypt.compare(password, user.passwordHash);
        console.log('Password matches:', passwordMatches);
      } catch (bcryptError) {
        console.error('Bcrypt error:', bcryptError);
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      if (!passwordMatches) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const token = jwt.sign(
        { userId: user._id.toString(), role: user.role },
        jwtSecret,
        { expiresIn: '7d' }
      );
      res.json({
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Login failed:', error);
      res.status(500).json({ error: 'Login failed. Please check the server database connection and try again.' });
    }
  });

  r.post('/forgot-password', async (req, res) => {
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.json({ message: 'If that email is registered, you will receive reset instructions.' });
      return;
    }
    const token = crypto.randomBytes(20).toString('hex');
    user.resetToken = token;
    user.resetTokenExpires = new Date(Date.now() + 1000 * 60 * 60);
    await user.save();

    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    try {
      await sendResetPasswordEmail(user.email, user.name, resetUrl);
    } catch (error) {
      console.error('Failed to send reset password email:', error);
    }

    res.json({
      message: 'Password reset link has been sent to your email address.',
      resetUrl,
      resetToken: token,
    });
  });

  r.post('/reset-password', async (req, res) => {
    const { token, password } = req.body as { token?: string; password?: string };
    if (!token || !password) {
      res.status(400).json({ error: 'Token and new password are required' });
      return;
    }
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: new Date() },
    });
    if (!user) {
      res.status(400).json({ error: 'Token is invalid or expired' });
      return;
    }
    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetToken = '';
    user.resetTokenExpires = undefined;
    await user.save();
    res.json({ message: 'Password has been reset. You can now log in.' });
  });

  const googleClientId = process.env.GOOGLE_CLIENT_ID ?? '';
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? '';
  const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL ?? '';
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

  if (googleClientId && googleClientSecret && googleCallbackUrl) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: googleClientId,
          clientSecret: googleClientSecret,
          callbackURL: googleCallbackUrl,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value?.toLowerCase();
            const name = profile.displayName || email?.split('@')[0] || 'Google user';
            if (!email) {
              done(new Error('Google profile did not return an email'));
              return;
            }
            let user = await User.findOne({ email });
            if (!user) {
              const passwordHash = await bcrypt.hash(crypto.randomBytes(20).toString('hex'), 10);
              user = await User.create({
                email,
                passwordHash,
                name,
                role: 'customer',
              });
            }
            done(null, user);
          } catch (error) {
            done(error as Error);
          }
        }
      )
    );
  }

  r.get('/config', (_req, res) => {
    res.json({
      googleOAuthEnabled: Boolean(googleClientId && googleClientSecret && googleCallbackUrl),
    });
  });

  r.get('/google', (req, res, next) => {
    if (!googleClientId || !googleClientSecret || !googleCallbackUrl) {
      const redirectUrl = new URL(`${frontendUrl}/login`);
      redirectUrl.searchParams.set('error', 'Google OAuth is not configured');
      res.redirect(redirectUrl.toString());
      return;
    }
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
      prompt: 'select_account',
    })(req, res, next);
  });

  r.get('/google/callback', (req, res, next) => {
    if (!googleClientId || !googleClientSecret || !googleCallbackUrl) {
      const redirectUrl = new URL(`${frontendUrl}/login`);
      redirectUrl.searchParams.set('error', 'Google OAuth is not configured');
      res.redirect(redirectUrl.toString());
      return;
    }
    passport.authenticate('google', { session: false }, (err, user) => {
      if (err || !user) {
        const redirectUrl = new URL(`${frontendUrl}/login`);
        redirectUrl.searchParams.set('error', err?.message ?? 'google_auth_failed');
        res.redirect(redirectUrl.toString());
        return;
      }
      const token = jwt.sign({ userId: user._id.toString(), role: user.role }, jwtSecret, {
        expiresIn: '7d',
      });
      const redirectUrl = new URL(`${frontendUrl}/login`);
      redirectUrl.searchParams.set('token', token);
      res.redirect(redirectUrl.toString());
    })(req, res, next);
  });

  r.get('/me', async (req, res) => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    try {
      const payload = jwt.verify(token, jwtSecret) as { userId: string };
      if (!mongoose.Types.ObjectId.isValid(payload.userId)) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }
      const user = await User.findById(payload.userId).select('-passwordHash');
      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }
      res.json({
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  return r;
}
