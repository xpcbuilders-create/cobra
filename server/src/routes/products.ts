import { Router } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { getEmiOptions } from '../lib/emi.js';


function normalizeSpecifications(specs: any): Record<string, string> {
  if (!specs) return {};
  if (specs instanceof Map) {
    return Object.fromEntries(specs.entries());
  }
  if (typeof specs.toObject === 'function') {
    return specs.toObject();
  }
  return Object.fromEntries(Object.entries(specs ?? {}).map(([key, value]) => [key, String(value ?? '')]));
}

function serializeReviews(reviews: any[] = []) {
  return reviews.map((review) => ({
    userId: review.userId?.toString?.() ?? String(review.userId ?? ''),
    name: review.name,
    rating: review.rating,
    comment: review.comment,
    createdAt:
      review.createdAt instanceof Date
        ? review.createdAt.toISOString()
        : String(review.createdAt ?? new Date().toISOString()),
  }));
}

export function productRoutes(requireAuth: ReturnType<typeof import('../middleware/auth.js').requireAuth>) {
  const r = Router();

  r.get('/', async (req, res) => {
    const {
      q,
      category,
      featured,
      isNew,
      page = '1',
      limit = '12',
    } = req.query as Record<string, string | undefined>;
    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (featured === 'true') filter.featured = true;

    const newProductOr: Record<string, unknown>[] = [];
    if (isNew === 'true') {
      newProductOr.push({ newProduct: true }, { isNew: true });
    }

    const searchOr: Record<string, unknown>[] = [];
    if (q?.trim()) {
      const text = q.trim();
      searchOr.push(
        { name: { $regex: text, $options: 'i' } },
        { description: { $regex: text, $options: 'i' } }
      );
    }

    if (newProductOr.length > 0 && searchOr.length > 0) {
      filter.$and = [{ $or: newProductOr }, { $or: searchOr }];
    } else if (newProductOr.length > 0) {
      filter.$or = newProductOr;
    } else if (searchOr.length > 0) {
      filter.$or = searchOr;
    }
    const p = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.min(48, Math.max(1, parseInt(limit, 10) || 12));
    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((p - 1) * lim)
        .limit(lim)
        .lean(),
      Product.countDocuments(filter),
    ]);
    res.json({
      items: items.map((x) => {
        const specifications = normalizeSpecifications(x.specifications);
        return {
          id: x._id.toString(),
          name: x.name,
          slug: x.slug,
          description: x.description,
          price: x.price,
          mrp: (x as any).mrp ?? x.price,
          category: x.category,
          imageUrl: x.imageUrls?.[0] ?? '',
          imageUrls: x.imageUrls ?? [],
          stock: x.stock,
          available: x.stock > 0,
          featured: x.featured,
          isNew: (x as any).newProduct ?? (x as any).isNew,
          averageRating: x.averageRating ?? 0,
          reviewCount: x.reviewCount ?? 0,
          specifications,
          emiOptions: getEmiOptions(x.price),
        };
      }),
      page: p,
      limit: lim,
      total,
      totalPages: Math.ceil(total / lim) || 1,
    });
  });

  r.get('/categories', async (_req, res) => {
    const cats = await Product.distinct('category');
    res.json({ categories: cats.sort() });
  });

  r.get('/:slug', async (req, res) => {
    const product = await Product.findOne({ slug: req.params.slug }).lean();
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({
      id: product._id.toString(),
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      mrp: product.mrp ?? product.price,
      category: product.category,
      imageUrl: product.imageUrls?.[0] ?? '',
      imageUrls: product.imageUrls ?? [],
      stock: product.stock,
      available: product.stock > 0,
      featured: product.featured,
      isNew: (product as any).newProduct ?? (product as any).isNew,
      averageRating: product.averageRating ?? 0,
      reviewCount: product.reviewCount ?? 0,
      specifications: normalizeSpecifications(product.specifications),
      emiOptions: getEmiOptions(product.price),
      reviews: serializeReviews(product.reviews ?? []),
    });
  });

  r.post('/:slug/reviews', requireAuth, async (req, res) => {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const rating = Number(req.body.rating ?? 0);
    const comment = String(req.body.comment ?? '').trim();
    if (!rating || rating < 1 || rating > 5 || !comment) {
      res.status(400).json({ error: 'rating 1-5 and comment are required' });
      return;
    }
    if (!req.auth?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await User.findById(req.auth.userId).lean();
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const existingIndex = product.reviews.findIndex((review) => review.userId.toString() === req.auth?.userId);
    const reviewData = {
      userId: new mongoose.Types.ObjectId(req.auth.userId),
      name: user.name,
      rating,
      comment,
    } as any;

    if (existingIndex >= 0) {
      product.reviews[existingIndex] = reviewData as any;
    } else {
      product.reviews.push(reviewData as any);
    }

    product.reviewCount = product.reviews.length;
    product.averageRating =
      product.reviewCount > 0
        ? product.reviews.reduce((sum, item) => sum + item.rating, 0) / product.reviewCount
        : 0;

    await product.save();

    res.json({
      id: product._id.toString(),
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      category: product.category,
      imageUrl: product.imageUrls?.[0] ?? '',
      imageUrls: product.imageUrls ?? [],
      stock: product.stock,
      featured: product.featured,
      isNew: (product as any).newProduct ?? (product as any).isNew,
      averageRating: product.averageRating,
      reviewCount: product.reviewCount,
      specifications: normalizeSpecifications(product.specifications),
      emiOptions: getEmiOptions(product.price),
      reviews: serializeReviews(product.reviews),
    });
  });

  return r;
}
