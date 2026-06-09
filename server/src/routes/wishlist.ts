import { Router } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';

export function wishlistRoutes(requireAuth: ReturnType<typeof import('../middleware/auth.js').requireAuth>) {
  const r = Router();

  r.get('/', requireAuth, async (req, res) => {
    if (!req.auth?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const user = await User.findById(req.auth.userId).populate('wishlist').lean();
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const products = (user.wishlist as unknown[]).
      filter((item): item is { _id: mongoose.Types.ObjectId } => Boolean(item)).
      map((item) => item as any);

    const mapped = products.map((product: any) => ({
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
      isNew: product.newProduct ?? product.isNew,
      averageRating: product.averageRating ?? 0,
      reviewCount: product.reviewCount ?? 0,
    }));

    res.json({ items: mapped });
  });

  r.post('/items', requireAuth, async (req, res) => {
    const { productId } = req.body as { productId?: string };
    if (!req.auth?.userId || !productId || !mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ error: 'Product ID is required' });
      return;
    }
    const product = await Product.findById(productId).lean();
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    await User.updateOne(
      { _id: req.auth.userId },
      { $addToSet: { wishlist: product._id } }
    );
    res.json({ message: 'Added to wishlist' });
  });

  r.delete('/items/:productId', requireAuth, async (req, res) => {
    const productId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
    if (!req.auth?.userId || !mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ error: 'Product ID is required' });
      return;
    }
    await User.updateOne(
      { _id: req.auth.userId },
      { $pull: { wishlist: new mongoose.Types.ObjectId(productId) } }
    );
    res.json({ message: 'Removed from wishlist' });
  });

  return r;
}
