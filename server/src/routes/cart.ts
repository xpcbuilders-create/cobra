import { Router } from 'express';
import mongoose from 'mongoose';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { getEmiOptions } from '../lib/emi.js';
import type { AuthPayload } from '../middleware/auth.js';

function uid(auth: AuthPayload | undefined) {
  return auth?.userId;
}

export function cartRoutes(requireAuth: ReturnType<typeof import('../middleware/auth.js').requireAuth>) {
  const r = Router();

  r.use(requireAuth);

  r.get('/', async (req, res) => {
    const userId = uid(req.auth);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    let cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }
    const items = cart.items.map((line: { product: unknown; quantity: number }) => {
      const p = line.product as {
        _id: mongoose.Types.ObjectId;
        name: string;
        price: number;
        imageUrl?: string;
        slug: string;
        stock: number;
      } | null;
      if (!p) return null;
      return {
        productId: p._id.toString(),
        name: p.name,
        price: p.price,
        quantity: line.quantity,
        imageUrl: p.imageUrl,
        slug: p.slug,
        stock: p.stock,
        emiOptions: getEmiOptions(p.price),
      };
    }).filter(Boolean);
    res.json({ items });
  });

  r.post('/items', async (req, res) => {
    const userId = uid(req.auth);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { productId, quantity = 1 } = req.body as {
      productId?: string;
      quantity?: number;
    };
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ error: 'valid productId required' });
      return;
    }
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const qty = Math.max(1, Math.floor(Number(quantity) || 1));
    if (qty > product.stock) {
      res.status(400).json({ error: 'Not enough stock', stock: product.stock });
      return;
    }
    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = await Cart.create({ user: userId, items: [] });

    const pid = new mongoose.Types.ObjectId(productId);
    const existing = cart.items.find((i) => i.product.equals(pid));
    const nextQty = existing ? existing.quantity + qty : qty;
    if (nextQty > product.stock) {
      res.status(400).json({ error: 'Not enough stock', stock: product.stock });
      return;
    }
    if (existing) existing.quantity = nextQty;
    else cart.items.push({ product: pid, quantity: qty });
    await cart.save();
    res.status(201).json({ ok: true });
  });

  r.patch('/items/:productId', async (req, res) => {
    const userId = uid(req.auth);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { productId } = req.params;
    const { quantity } = req.body as { quantity?: number };
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ error: 'invalid product id' });
      return;
    }
    const qty = Math.max(0, Math.floor(Number(quantity) || 0));
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      res.status(404).json({ error: 'Cart not found' });
      return;
    }
    const pid = new mongoose.Types.ObjectId(productId);
    const product = await Product.findById(pid);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const line = cart.items.find((i) => i.product.equals(pid));
    if (!line) {
      res.status(404).json({ error: 'Item not in cart' });
      return;
    }
    if (qty === 0) {
      await Cart.updateOne({ user: userId }, { $pull: { items: { product: pid } } });
    } else {
      if (qty > product.stock) {
        res.status(400).json({ error: 'Not enough stock', stock: product.stock });
        return;
      }
      await Cart.updateOne(
        { user: userId, 'items.product': pid },
        { $set: { 'items.$.quantity': qty } }
      );
    }
    res.json({ ok: true });
  });

  r.delete('/items/:productId', async (req, res) => {
    const userId = uid(req.auth);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ error: 'invalid product id' });
      return;
    }
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      res.status(404).json({ error: 'Cart not found' });
      return;
    }
    const pid = new mongoose.Types.ObjectId(productId);
    await Cart.updateOne({ user: userId }, { $pull: { items: { product: pid } } });
    res.json({ ok: true });
  });

  return r;
}
