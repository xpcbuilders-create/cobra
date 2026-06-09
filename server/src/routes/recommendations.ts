import { Router } from 'express';
import type { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { RecommendationEvent } from '../models/RecommendationEvent.js';
import type { AuthPayload } from '../middleware/auth.js';

type ProductLean = {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  price: number;
  category?: string;
  imageUrls?: string[];
  stock?: number;
  featured?: boolean;
  newProduct?: boolean;
  isNew?: boolean;
  averageRating?: number;
  reviewCount?: number;
  createdAt?: Date;
};

type Shelf = {
  key: string;
  title: string;
  subtitle: string;
  items: ReturnType<typeof serializeProduct>[];
};

const MAX_RECENT_QUERY_LENGTH = 420;
const MAX_SLUG_LENGTH = 160;
const EVENT_WINDOW_MS = 60 * 1000;
const MAX_EVENTS_PER_WINDOW = 30;
const DUPLICATE_VIEW_WINDOW_MS = 15 * 60 * 1000;
const eventBuckets = new Map<string, { count: number; resetAt: number }>();

function getAuthUserId(req: Request, secret: string) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, secret) as AuthPayload;
    return mongoose.Types.ObjectId.isValid(payload.userId) ? payload.userId : null;
  } catch {
    return null;
  }
}

function isValidSlug(slug: string) {
  return slug.length > 0 && slug.length <= MAX_SLUG_LENGTH && /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(slug);
}

function isRateLimited(key: string) {
  const now = Date.now();
  const bucket = eventBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    eventBuckets.set(key, { count: 1, resetAt: now + EVENT_WINDOW_MS });
    return false;
  }

  bucket.count += 1;
  if (bucket.count > MAX_EVENTS_PER_WINDOW) return true;

  if (eventBuckets.size > 5000) {
    for (const [bucketKey, value] of eventBuckets.entries()) {
      if (value.resetAt <= now) eventBuckets.delete(bucketKey);
    }
  }

  return false;
}

function serializeProduct(product: ProductLean) {
  return {
    id: product._id.toString(),
    name: product.name,
    slug: product.slug,
    description: product.description ?? '',
    price: product.price,
    category: product.category ?? 'general',
    imageUrl: product.imageUrls?.[0] ?? '',
    imageUrls: product.imageUrls ?? [],
    stock: product.stock ?? 0,
    available: (product.stock ?? 0) > 0,
    featured: product.featured ?? false,
    isNew: product.newProduct ?? product.isNew ?? false,
    averageRating: product.averageRating ?? 0,
    reviewCount: product.reviewCount ?? 0,
    specifications: {},
    emiOptions: [],
  };
}

function parseRecentIds(value: unknown) {
  const raw = String(value ?? '');
  if (raw.length > MAX_RECENT_QUERY_LENGTH) return [];
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter((item) => mongoose.Types.ObjectId.isValid(item))
    .filter((item, index, items) => items.indexOf(item) === index)
    .slice(0, 12);
}

function uniqueObjectIds(ids: Array<mongoose.Types.ObjectId | string | undefined | null>) {
  const seen = new Set<string>();
  return ids.reduce<string[]>((acc, id) => {
    const value = id?.toString();
    if (value && mongoose.Types.ObjectId.isValid(value) && !seen.has(value)) {
      seen.add(value);
      acc.push(value);
    }
    return acc;
  }, []);
}

async function productsByIds(ids: string[], limit = 8) {
  if (ids.length === 0) return [];
  const products = await Product.find({ _id: { $in: ids }, stock: { $gt: 0 } }).lean<ProductLean[]>();
  const byId = new Map(products.map((product) => [product._id.toString(), product]));
  return ids
    .map((id) => byId.get(id))
    .filter((product): product is ProductLean => Boolean(product))
    .slice(0, limit);
}

async function trendingProducts(limit = 8, excludeIds: string[] = []) {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 45);
  const excluded = new Set(excludeIds);
  const ranked = await Order.aggregate<{ _id: mongoose.Types.ObjectId; quantitySold: number; lastOrderedAt: Date }>([
    { $match: { createdAt: { $gte: since }, status: { $ne: 'Cancelled' } } },
    { $unwind: '$items' },
    { $match: { 'items.product': { $type: 'objectId' } } },
    {
      $group: {
        _id: '$items.product',
        quantitySold: { $sum: '$items.quantity' },
        lastOrderedAt: { $max: '$createdAt' },
      },
    },
    { $sort: { quantitySold: -1, lastOrderedAt: -1 } },
    { $limit: 30 },
  ]);

  const rankedIds = ranked.map((item) => item._id.toString()).filter((id) => !excluded.has(id));
  const products = await productsByIds(rankedIds, limit);
  if (products.length >= limit) return products;

  const fallback = await Product.find({
    _id: { $nin: [...excludeIds, ...products.map((product) => product._id.toString())] },
    stock: { $gt: 0 },
  })
    .sort({ featured: -1, newProduct: -1, averageRating: -1, createdAt: -1 })
    .limit(limit - products.length)
    .lean<ProductLean[]>();

  return [...products, ...fallback];
}

async function recentlyViewedProducts(userId: string | null, recentIds: string[], limit = 8) {
  const eventIds = userId
    ? uniqueObjectIds(
        (
          await RecommendationEvent.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean<Array<{ product: mongoose.Types.ObjectId }>>()
        ).map((event) => event.product)
      )
    : [];

  return productsByIds(uniqueObjectIds([...recentIds, ...eventIds]), limit);
}

async function similarProducts(product: ProductLean, limit = 8) {
  const lower = product.price * 0.55;
  const upper = product.price * 1.65;
  const sameCategory = await Product.find({
    _id: { $ne: product._id },
    category: product.category,
    stock: { $gt: 0 },
  })
    .sort({ averageRating: -1, reviewCount: -1, featured: -1 })
    .limit(24)
    .lean<ProductLean[]>();

  return sameCategory
    .map((candidate) => ({
      product: candidate,
      score:
        40 +
        (candidate.price >= lower && candidate.price <= upper ? 20 : 0) +
        (candidate.averageRating ?? 0) * 6 +
        Math.max(0, 10 - Math.abs(candidate.price - product.price) / Math.max(product.price, 1)),
    }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.product)
    .slice(0, limit);
}

async function frequentlyBoughtTogether(productId: string, limit = 8) {
  const pairs = await Order.aggregate<{ _id: mongoose.Types.ObjectId; count: number; quantity: number }>([
    { $match: { 'items.product': new mongoose.Types.ObjectId(productId), status: { $ne: 'Cancelled' } } },
    { $unwind: '$items' },
    { $match: { 'items.product': { $ne: new mongoose.Types.ObjectId(productId), $type: 'objectId' } } },
    {
      $group: {
        _id: '$items.product',
        count: { $sum: 1 },
        quantity: { $sum: '$items.quantity' },
      },
    },
    { $sort: { count: -1, quantity: -1 } },
    { $limit: 20 },
  ]);

  return productsByIds(
    pairs.map((item) => item._id.toString()),
    limit
  );
}

async function personalizedProducts(userId: string | null, recentIds: string[], limit = 8) {
  const categoryWeights = new Map<string, number>();
  const excludeIds = new Set<string>();

  if (userId) {
    const orders = await Order.find({ user: userId, status: { $ne: 'Cancelled' } })
      .sort({ createdAt: -1 })
      .limit(12)
      .populate('items.product')
      .lean();

    for (const order of orders) {
      for (const item of order.items) {
        const product = item.product as unknown as ProductLean | null;
        if (!product?._id) continue;
        excludeIds.add(product._id.toString());
        categoryWeights.set(product.category ?? 'general', (categoryWeights.get(product.category ?? 'general') ?? 0) + item.quantity * 4);
      }
    }
  }

  const recentProducts = await productsByIds(recentIds, 12);
  for (const product of recentProducts) {
    excludeIds.add(product._id.toString());
    categoryWeights.set(product.category ?? 'general', (categoryWeights.get(product.category ?? 'general') ?? 0) + 2);
  }

  if (categoryWeights.size === 0) {
    return trendingProducts(limit);
  }

  const categories = [...categoryWeights.keys()];
  const candidates = await Product.find({
    _id: { $nin: [...excludeIds] },
    category: { $in: categories },
    stock: { $gt: 0 },
  })
    .sort({ averageRating: -1, featured: -1, createdAt: -1 })
    .limit(60)
    .lean<ProductLean[]>();

  return candidates
    .map((product) => ({
      product,
      score:
        (categoryWeights.get(product.category ?? 'general') ?? 0) * 10 +
        (product.averageRating ?? 0) * 7 +
        (product.reviewCount ?? 0) * 0.4 +
        (product.featured ? 8 : 0) +
        (product.newProduct ? 5 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.product)
    .slice(0, limit);
}

function shelf(key: string, title: string, subtitle: string, items: ProductLean[]): Shelf | null {
  if (items.length === 0) return null;
  return {
    key,
    title,
    subtitle,
    items: items.map(serializeProduct),
  };
}

export function recommendationRoutes(jwtSecret: string) {
  const r = Router();

  r.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'private, no-store');
    next();
  });

  r.post('/events', async (req, res) => {
    const userId = getAuthUserId(req, jwtSecret);
    const productId = String(req.body?.productId ?? '');
    if (!userId) {
      res.json({ tracked: false });
      return;
    }
    if (isRateLimited(userId)) {
      res.status(429).json({ error: 'Too many recommendation events' });
      return;
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ error: 'Invalid product ID' });
      return;
    }

    const productObjectId = new mongoose.Types.ObjectId(productId);
    const productExists = await Product.exists({ _id: productObjectId });
    if (!productExists) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const duplicateSince = new Date(Date.now() - DUPLICATE_VIEW_WINDOW_MS);
    const recentDuplicate = await RecommendationEvent.exists({
      user: new mongoose.Types.ObjectId(userId),
      product: productObjectId,
      eventType: 'view',
      createdAt: { $gte: duplicateSince },
    });

    if (!recentDuplicate) {
      await RecommendationEvent.create({
        user: new mongoose.Types.ObjectId(userId),
        product: productObjectId,
        eventType: 'view',
      });
    }
    res.json({ tracked: true });
  });

  r.get('/home', async (req, res) => {
    const userId = getAuthUserId(req, jwtSecret);
    const recentIds = parseRecentIds(req.query.recent);
    const [recent, personalized, trending] = await Promise.all([
      recentlyViewedProducts(userId, recentIds, 8),
      personalizedProducts(userId, recentIds, 8),
      trendingProducts(8),
    ]);

    res.json({
      shelves: [
        shelf('personalized', 'Recommended for you', 'Picked from your browsing and order patterns.', personalized),
        shelf('trending', 'Trending products', 'Popular with shoppers right now.', trending),
        shelf('recently-viewed', 'Recently viewed', 'Jump back into products you checked out.', recent),
      ].filter(Boolean),
    });
  });

  r.get('/product/:slug', async (req, res) => {
    const userId = getAuthUserId(req, jwtSecret);
    const recentIds = parseRecentIds(req.query.recent);
    if (!isValidSlug(req.params.slug)) {
      res.status(400).json({ error: 'Invalid product slug' });
      return;
    }
    const product = await Product.findOne({ slug: req.params.slug }).lean<ProductLean | null>();
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const [similar, together, recent, personalized, trending] = await Promise.all([
      similarProducts(product, 8),
      frequentlyBoughtTogether(product._id.toString(), 8),
      recentlyViewedProducts(userId, recentIds.filter((id) => id !== product._id.toString()), 8),
      personalizedProducts(userId, recentIds, 8),
      trendingProducts(8, [product._id.toString()]),
    ]);
    const boughtTogether = together.length > 0 ? together : trending.slice(0, 4);

    res.json({
      shelves: [
        shelf('similar', 'Similar products', 'Comparable picks in this category and price range.', similar),
        shelf('frequently-bought', 'Frequently bought together', 'Products often ordered with this item.', boughtTogether),
        shelf('personalized', 'Recommended for you', 'A blend of your activity and shopper demand.', personalized),
        shelf('trending', 'Trending products', 'Popular products across the store.', trending),
        shelf('recently-viewed', 'Recently viewed', 'Your latest product visits.', recent),
      ].filter(Boolean),
    });
  });

  return r;
}
