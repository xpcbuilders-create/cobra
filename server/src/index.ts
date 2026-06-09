import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import passport from 'passport';
import type { NextFunction, Request, Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { connectDb } from './db.js';
import { requireAuth, requireAdmin } from './middleware/auth.js';
import { authRoutes } from './routes/auth.js';
import { productRoutes } from './routes/products.js';
import { cartRoutes } from './routes/cart.js';
import { orderRoutes, adminOrderRoutes } from './routes/orders.js';
import { adminRoutes } from './routes/admin.js';
import { footerRoutes } from './routes/footer.js';
import { siteRoutes } from './routes/site.js';
import { wishlistRoutes } from './routes/wishlist.js';
import { recommendationRoutes } from './routes/recommendations.js';
import { customiseRoutes } from './routes/customise.js';
import emiRoutes from './routes/emi.js';

const PORT = Number(process.env.PORT) || 5000;
const MONGODB_URI = process.env.MONGODB_URI ?? '';
const JWT_SECRET = process.env.JWT_SECRET ?? '';
const NODE_ENV = process.env.NODE_ENV ?? 'development';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, '../../client/dist');

function getAllowedOrigins() {
  const configured = (process.env.CORS_ORIGINS ?? process.env.CLIENT_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set([
    ...configured,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    `http://localhost:${PORT}`,
    `http://127.0.0.1:${PORT}`,
  ]);
}

function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "img-src 'self' data: https:",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*",
      "font-src 'self' data:",
    ].join('; ')
  );
  if (NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
}

async function main() {
  if (!MONGODB_URI) {
    console.error(
      'Missing MONGODB_URI. Copy server/.env.example to server/.env and set your Atlas connection string.'
    );
    process.exit(1);
  }
  if (!JWT_SECRET) {
    console.error('Missing JWT_SECRET in server/.env (use a long random string).');
    process.exit(1);
  }

  await connectDb(MONGODB_URI);
  console.log('MongoDB connected');

  const app = express();
  app.disable('x-powered-by');
  const allowedOrigins = getAllowedOrigins();
  app.use(securityHeaders);
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 600,
    })
  );
  app.use(express.json({ limit: '100kb', strict: true }));
  app.use(passport.initialize());

  const authMw = requireAuth(JWT_SECRET);
  const adminMw = requireAdmin(JWT_SECRET);

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      db: mongoose.connection.readyState === 1,
    });
  });

  app.use('/api/auth', authRoutes(JWT_SECRET));
  app.use('/api/site', siteRoutes());
  app.use('/api/footer', footerRoutes(adminMw));
  app.use('/api/products', productRoutes(authMw));
  app.use('/api/cart', cartRoutes(authMw));
  app.use('/api/orders', orderRoutes(authMw));
  app.use('/api/admin/orders', adminOrderRoutes(adminMw));
  app.use('/api/admin', adminRoutes(adminMw));
  app.use('/api/wishlist', wishlistRoutes(authMw));
  app.use('/api/recommendations', recommendationRoutes(JWT_SECRET));
  app.use('/api/customise', customiseRoutes());
  console.log('EMI routes type:', typeof emiRoutes);
  // Accept multiple module shapes: function router, default export, or named `emiRouter`.
  const maybeRouter =
    (typeof emiRoutes === 'function' && emiRoutes) ||
    (emiRoutes && (emiRoutes.default ?? emiRoutes.emiRouter));
  if (typeof maybeRouter === 'function') {
    app.use('/api/emi', maybeRouter as any);
  } else {
    console.warn('Could not mount EMI routes; unexpected module shape:', Object.keys(emiRoutes || {}));
  }

  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        next();
        return;
      }
      if (req.path.startsWith('/api')) {
        next();
        return;
      }
      res.sendFile(path.join(clientDist, 'index.html'), (err) => {
        if (err) next(err);
      });
    });
  }

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
    if (fs.existsSync(clientDist)) {
      console.log(`Serving client from ${clientDist}`);
    }
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
