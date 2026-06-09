import { Request, Response } from 'express';
import { Product } from '../models/Product.js';

export const listProducts = async (req: Request, res: Response) => {
  const query = req.query.q ? { name: new RegExp(String(req.query.q), 'i') } : {};
  const category = typeof req.query.category === 'string' ? { category: req.query.category } : {};
  const filters = { ...query, ...category };

  const products = await Product.find(filters).sort({ featured: -1, createdAt: -1 }).lean();
  res.json({ products });
};

export const getProduct = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const product = await Product.findOne({ slug }).lean();
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ product });
};
