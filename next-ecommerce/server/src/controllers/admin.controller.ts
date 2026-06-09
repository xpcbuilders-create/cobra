import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import { Product } from '../models/Product.js';
import { EmiPlan } from '../models/EmiPlan.js';

export const createProduct = async (req: Request, res: Response) => {
  const { name, slug, category, description, price, emi, discount, stock, imageUrls } = req.body;
  if (!name || !slug || !price || !emi || !category || !description) {
    return res.status(400).json({ message: 'Missing required product fields' });
  }

  const existing = await Product.findOne({ slug });
  if (existing) {
    return res.status(409).json({ message: 'Product slug already exists' });
  }

  const product = await Product.create({
    name,
    slug,
    category,
    description,
    price,
    emi,
    discount: discount || 0,
    stock: stock || 0,
    imageUrls: Array.isArray(imageUrls) ? imageUrls : [String(imageUrls || '')],
    manuals: [],
  });

  res.status(201).json({ product });
};

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const product = await Product.findByIdAndUpdate(id, updates, { new: true }).lean();
  if (!product) return res.status(404).json({ message: 'Product not found' });

  res.json({ product });
};

export const uploadProductManual = async (req: Request, res: Response) => {
  const { id } = req.params;
  const file = (req as any).file;
  if (!file) return res.status(400).json({ message: 'PDF manual file is required' });

  const manualPath = `/uploads/manuals/${file.filename}`;
  const product = await Product.findByIdAndUpdate(
    id,
    { $push: { manuals: manualPath } },
    { new: true }
  ).lean();

  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ product });
};

export const updateEmiConfig = async (req: Request, res: Response) => {
  const { interestRate, durations } = req.body;
  if (interestRate == null || !Array.isArray(durations)) {
    return res.status(400).json({ message: 'Interest rate and durations are required' });
  }

  const plan = await EmiPlan.findOneAndUpdate(
    {},
    { interestRate, durations },
    { upsert: true, new: true }
  ).lean();

  res.json({ plan });
};

export const getDashboard = async (req: Request, res: Response) => {
  const productCount = await Product.countDocuments();
  const emiPlanCount = await EmiPlan.countDocuments();

  res.json({ revenue: 120000, orders: 260, productCount, emiPlanCount });
};
