import { Router } from 'express';
import { sendCustomiseProductRequestEmail } from '../lib/email.js';

const CUSTOMISE_REQUEST_TO = 'xpcbuilders@gmail.com';
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 160;
const MAX_DETAILS_LENGTH = 2500;
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const buckets = new Map<string, { count: number; resetAt: number }>();

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function rateLimited(key: string) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > MAX_REQUESTS_PER_WINDOW;
}

export function customiseRoutes() {
  const r = Router();

  r.post('/', async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (rateLimited(ip)) {
      res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
      return;
    }

    const name = String(req.body?.name ?? '').trim();
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const details = String(req.body?.details ?? '').trim();

    if (!name || !email || !details) {
      res.status(400).json({ error: 'Name, email, and customise details are required.' });
      return;
    }
    if (name.length > MAX_NAME_LENGTH) {
      res.status(400).json({ error: 'Name is too long.' });
      return;
    }
    if (email.length > MAX_EMAIL_LENGTH || !isEmail(email)) {
      res.status(400).json({ error: 'Enter a valid email address.' });
      return;
    }
    if (details.length > MAX_DETAILS_LENGTH) {
      res.status(400).json({ error: 'Request details are too long.' });
      return;
    }

    try {
      const sent = await sendCustomiseProductRequestEmail(CUSTOMISE_REQUEST_TO, {
        name,
        email,
        details,
      });
      if (!sent) {
        res.status(503).json({ error: 'Email service is not configured. Please contact the store directly.' });
        return;
      }

      res.status(201).json({ message: 'Customise request sent successfully.' });
    } catch (error) {
      console.error('Failed to send customise request:', error);
      res.status(500).json({ error: 'Could not send customise request. Please try again later.' });
    }
  });

  return r;
}
