import { Router } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { Coupon } from '../models/Coupon.js';
import { User } from '../models/User.js';
import {
  formatSiteSettings,
  getOrCreateSiteSettings,
  SITE_KEY,
  SiteSettings,
} from '../models/SiteSettings.js';

const upload = multer({ storage: multer.memoryStorage() });
type RequestWithFile = { file?: { buffer: Buffer } };
const allowedOrderStatuses = [
  'Placed',
  'Paid',
  'Confirmed',
  'Packed',
  'Shipped',
  'Out For Delivery',
  'Delivered',
  'Cancelled',
] as const;
type OrderStatus = (typeof allowedOrderStatuses)[number];

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function toIsoDate(value: unknown) {
  const date = value instanceof Date ? value : new Date(String(value ?? Date.now()));
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export function adminRoutes(requireAdmin: ReturnType<typeof import('../middleware/auth.js').requireAdmin>) {
  const r = Router();
  r.use(requireAdmin);

  r.get('/site', async (_req, res) => {
    const doc = await getOrCreateSiteSettings();
    res.json(formatSiteSettings(doc));
  });

  r.put('/site', async (req, res) => {
    const body = req.body as {
      shopName?: string;
      logoUrl?: string;
      loginLogoUrl?: string;
      senderEmail?: string;
      banners?: { imageUrl?: string; link?: string }[];
      newArrivals?: { imageUrl?: string; title?: string; description?: string }[];
      footerDescription?: string;
      supportEmail?: string;
      supportPhone?: string;
      supportHours?: string;
      addressLines?: string[];
      footerColumns?: { title?: string; links?: { label?: string; url?: string }[] }[];
      socialLinks?: { label?: string; url?: string }[];
      trustBadges?: { label?: string; iconUrl?: string }[];
    };
    const banners = (body.banners ?? [])
      .filter((b) => b.imageUrl?.trim())
      .slice(0, 6)
      .map((b) => ({
        imageUrl: b.imageUrl!.trim(),
        link: (b.link ?? '').trim(),
      }));
    const newArrivals = (body.newArrivals ?? [])
      .filter((item) => item.imageUrl?.trim() && item.title?.trim() && item.description?.trim())
      .slice(0, 3)
      .map((item) => ({
        imageUrl: item.imageUrl!.trim(),
        title: item.title!.trim(),
        description: item.description!.trim(),
      }));
    const footerColumns = (body.footerColumns ?? [])
      .filter((col) => col.title?.trim())
      .slice(0, 4)
      .map((col) => ({
        title: col.title!.trim(),
        links: (col.links ?? [])
          .filter((link) => link.label?.trim() && link.url?.trim())
          .slice(0, 6)
          .map((link) => ({
            label: link.label!.trim(),
            url: link.url!.trim(),
          })),
      }));
    const socialLinks = (body.socialLinks ?? [])
      .filter((item) => item.label?.trim() && item.url?.trim())
      .slice(0, 6)
      .map((item) => ({
        label: item.label!.trim(),
        url: item.url!.trim(),
      }));
    const trustBadges = (body.trustBadges ?? [])
      .filter((item) => item.label?.trim())
      .slice(0, 4)
      .map((item) => ({
        label: item.label!.trim(),
        iconUrl: (item.iconUrl ?? '').trim(),
      }));
    const addressLines = (body.addressLines ?? []).map((line) => String(line ?? '').trim()).filter(Boolean).slice(0, 3);

    const doc = await SiteSettings.findOneAndUpdate(
      { key: SITE_KEY },
      {
        ...(body.shopName != null && { shopName: body.shopName.trim() || 'My Shop' }),
        ...(body.logoUrl != null && { logoUrl: body.logoUrl.trim() }),
        ...(body.loginLogoUrl != null && { loginLogoUrl: body.loginLogoUrl.trim() }),
        ...(body.senderEmail != null && { senderEmail: body.senderEmail.trim() }),
        ...(body.banners != null && { banners }),
        ...(body.newArrivals != null && { newArrivals }),
        ...(body.footerDescription != null ||
        body.supportEmail != null ||
        body.supportPhone != null ||
        body.supportHours != null ||
        body.addressLines != null ||
        body.footerColumns != null ||
        body.socialLinks != null ||
        body.trustBadges != null
          ? {
              footer: {
                description: body.footerDescription?.trim() ?? '',
                supportEmail: body.supportEmail?.trim() ?? '',
                supportPhone: body.supportPhone?.trim() ?? '',
                supportHours: body.supportHours?.trim() ?? '',
                addressLines,
                columns: footerColumns,
                socialLinks,
                trustBadges,
              },
            }
          : {}),
      },
      { upsert: true, new: true }
    );
    if (!doc) {
      res.status(500).json({ error: 'Failed to save site settings' });
      return;
    }
    res.json(formatSiteSettings(doc));
  });

  r.put('/footer', async (req, res) => {
    const body = req.body as {
      footerDescription?: string;
      supportEmail?: string;
      supportPhone?: string;
      supportHours?: string;
      addressLines?: string[];
      footerColumns?: { title?: string; links?: { label?: string; url?: string }[] }[];
      socialLinks?: { label?: string; url?: string }[];
      trustBadges?: { label?: string; iconUrl?: string }[];
    };

    const footerColumns = (body.footerColumns ?? [])
      .filter((col) => col.title?.trim())
      .slice(0, 4)
      .map((col) => ({
        title: col.title!.trim(),
        links: (col.links ?? [])
          .filter((link) => link.label?.trim() && link.url?.trim())
          .slice(0, 6)
          .map((link) => ({
            label: link.label!.trim(),
            url: link.url!.trim(),
          })),
      }));
    const socialLinks = (body.socialLinks ?? [])
      .filter((item) => item.label?.trim() && item.url?.trim())
      .slice(0, 6)
      .map((item) => ({
        label: item.label!.trim(),
        url: item.url!.trim(),
      }));
    const trustBadges = (body.trustBadges ?? [])
      .filter((item) => item.label?.trim())
      .slice(0, 4)
      .map((item) => ({
        label: item.label!.trim(),
        iconUrl: (item.iconUrl ?? '').trim(),
      }));
    const addressLines = (body.addressLines ?? [])
      .map((line) => String(line ?? '').trim())
      .filter(Boolean)
      .slice(0, 3);

    const doc = await SiteSettings.findOneAndUpdate(
      { key: SITE_KEY },
      {
        footer: {
          description: body.footerDescription?.trim() ?? '',
          supportEmail: body.supportEmail?.trim() ?? '',
          supportPhone: body.supportPhone?.trim() ?? '',
          supportHours: body.supportHours?.trim() ?? '',
          addressLines,
          columns: footerColumns,
          socialLinks,
          trustBadges,
        },
      },
      { upsert: true, new: true }
    );
    if (!doc) {
      res.status(500).json({ error: 'Failed to save footer settings' });
      return;
    }
    res.json({ footer: formatSiteSettings(doc).footer });
  });

  r.get('/analytics', async (_req, res) => {
    try {
      const activeOrderStatuses = [
        'Paid',
        'Confirmed',
        'Packed',
        'Shipped',
        'Out For Delivery',
        'Delivered',
      ];
      const today = new Date();
      const startMonth = new Date(today.getFullYear(), today.getMonth() - 5, 1);

      const [totalUsers, totalProducts, totalOrders, revenueResult, monthlyStats, topSelling, recentOrders] =
        await Promise.all([
          User.countDocuments(),
          Product.countDocuments(),
          Order.countDocuments(),
          Order.aggregate([
            { $match: { status: { $in: activeOrderStatuses } } },
            { $group: { _id: null, revenue: { $sum: { $ifNull: ['$total', 0] } } } },
          ]),
          Order.aggregate([
            {
              $match: {
                createdAt: { $type: 'date', $gte: startMonth },
                status: { $in: activeOrderStatuses },
              },
            },
            {
              $group: {
                _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                revenue: { $sum: { $ifNull: ['$total', 0] } },
                orders: { $sum: 1 },
              },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
          ]),
          Order.aggregate([
            { $unwind: { path: '$items', preserveNullAndEmptyArrays: false } },
            {
              $group: {
                _id: { productId: '$items.product', name: { $ifNull: ['$items.name', 'Unknown product'] } },
                quantitySold: { $sum: { $ifNull: ['$items.quantity', 0] } },
                revenue: {
                  $sum: {
                    $multiply: [{ $ifNull: ['$items.price', 0] }, { $ifNull: ['$items.quantity', 0] }],
                  },
                },
              },
            },
            { $sort: { quantitySold: -1, revenue: -1 } },
            { $limit: 5 },
          ]),
          Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'email name')
            .lean(),
        ]);

      const monthlyRevenueMap = new Map<string, { revenue: number; orders: number }>();
      monthlyStats.forEach((stat) => {
        const key = `${stat._id.year}-${stat._id.month}`;
        monthlyRevenueMap.set(key, {
          revenue: Number(stat.revenue ?? 0),
          orders: Number(stat.orders ?? 0),
        });
      });

      const monthlyRevenue = [] as { label: string; revenue: number }[];
      const monthlyOrders = [] as { label: string; orders: number }[];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = `${monthDate.getFullYear()}-${monthDate.getMonth() + 1}`;
        const metric = monthlyRevenueMap.get(key) ?? { revenue: 0, orders: 0 };
        const label = monthDate.toLocaleString('en-US', { month: 'short', year: '2-digit' });
        monthlyRevenue.push({ label, revenue: metric.revenue });
        monthlyOrders.push({ label, orders: metric.orders });
      }

      res.json({
        analytics: {
          totalRevenue: Number(revenueResult[0]?.revenue ?? 0),
          totalOrders,
          totalUsers,
          totalProducts,
          monthlyRevenue,
          monthlyOrders,
          topSellingProducts: topSelling.map((item) => ({
            productId: String(item._id.productId ?? item._id.name ?? 'unknown'),
            name: String(item._id.name ?? 'Unknown product'),
            quantitySold: Number(item.quantitySold ?? 0),
            revenue: Number(item.revenue ?? 0),
          })),
          recentOrders: recentOrders.map((order) => ({
            id: order._id.toString(),
            user: order.user,
            total: Number(order.total ?? 0),
            status: order.status ?? 'Placed',
            paymentMethod: order.paymentMethod ?? 'cod',
            createdAt: toIsoDate(order.createdAt),
          })),
        },
      });
    } catch (error) {
      console.error('Failed to load admin analytics:', error);
      res.status(500).json({ error: 'Failed to load admin dashboard analytics' });
    }
  });

  r.post('/upload', upload.single('file'), async (req, res) => {
    const file = (req as typeof req & RequestWithFile).file;
    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      res.status(500).json({ error: 'Cloudinary is not configured' });
      return;
    }

    try {
      await new Promise<void>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: 'image' },
          (error, uploadResult) => {
            if (error) {
              reject(error);
              return;
            }
            if (!uploadResult?.secure_url) {
              reject(new Error('Upload failed'));
              return;
            }
            res.json({ url: uploadResult.secure_url });
            resolve();
          }
        );

        uploadStream.end(file.buffer);
      });
    } catch (error) {
      res.status(500).json({ error: 'Upload failed' });
    }
  });

  r.post('/products', async (req, res) => {
    const body = req.body as {
      name?: string;
      description?: string;
      price?: number;
      mrp?: number;
      category?: string;
      imageUrl?: string;
      imageUrls?: string[];
      stock?: number;
      featured?: boolean;
      isNew?: boolean;
      slug?: string;
      specifications?: Record<string, string>;
    };
    if (!body.name || body.price == null) {
      res.status(400).json({ error: 'name and price required' });
      return;
    }
    const price = Number(body.price);
    const mrp = body.mrp != null ? Number(body.mrp) : price;
    if (mrp < price) {
      res.status(400).json({ error: 'mrp must be greater than or equal to price' });
      return;
    }
    let slug = body.slug?.trim() || slugify(body.name);
    const exists = await Product.findOne({ slug });
    if (exists) slug = `${slug}-${Date.now().toString(36)}`;
    const imageUrls = Array.isArray(body.imageUrls)
      ? body.imageUrls.map((url) => String(url).trim()).filter(Boolean).slice(0, 6)
      : body.imageUrl
      ? [String(body.imageUrl).trim()].filter(Boolean)
      : [];

    const product = await Product.create({
      name: body.name,
      slug,
      description: body.description ?? '',
      price,
      mrp,
      category: body.category ?? 'general',
      imageUrls,
      stock: Math.max(0, Number(body.stock ?? 0)),
      featured: Boolean(body.featured),
      newProduct: Boolean(body.isNew),
      specifications: body.specifications ?? {},
    });
    res.status(201).json({
      id: product._id.toString(),
      name: product.name,
      slug: product.slug,
      price: product.price,
      mrp: product.mrp,
      stock: product.stock,
    });
  });

  r.patch('/products/:id', async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'invalid id' });
      return;
    }
    const body = req.body as Partial<{
      name: string;
      description: string;
      price: number;
      mrp: number;
      category: string;
      imageUrl: string;
      imageUrls: string[];
      stock: number;
      featured: boolean;
      isNew: boolean;
      specifications: Record<string, string>;
    }>;
    const imageUrls = body.imageUrls
      ? body.imageUrls.map((url) => String(url).trim()).filter(Boolean).slice(0, 6)
      : body.imageUrl
      ? [String(body.imageUrl).trim()].filter(Boolean)
      : undefined;

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const nextPrice = body.price != null ? Number(body.price) : product.price;
    const nextMrp = body.mrp != null ? Number(body.mrp) : product.mrp ?? nextPrice;
    if (nextMrp < nextPrice) {
      res.status(400).json({ error: 'mrp must be greater than or equal to price' });
      return;
    }

    const updated = await Product.findByIdAndUpdate(
      id,
      {
        ...(body.name != null && { name: body.name }),
        ...(body.description != null && { description: body.description }),
        ...(body.price != null && { price: Number(body.price) }),
        ...(body.mrp != null && { mrp: Number(body.mrp) }),
        ...(body.category != null && { category: body.category }),
        ...(imageUrls != null && { imageUrls }),
        ...(body.stock != null && { stock: Math.max(0, Number(body.stock)) }),
        ...(body.featured != null && { featured: Boolean(body.featured) }),
        ...(body.isNew != null && { newProduct: Boolean(body.isNew) }),
        ...(body.specifications != null && { specifications: body.specifications }),
      },
      { new: true }
    );
    if (!updated) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json({
      id: updated._id.toString(),
      name: updated.name,
      slug: updated.slug,
      price: updated.price,
      mrp: updated.mrp,
      stock: updated.stock,
    });
  });

  r.delete('/products/:id', async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'invalid id' });
      return;
    }
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json({ ok: true });
  });

  r.get('/coupons', async (_req, res) => {
    const coupons = await Coupon.find().sort({ expiryDate: 1, createdAt: -1 }).lean();
    res.json({
      coupons: coupons.map((coupon) => ({
        id: coupon._id.toString(),
        code: coupon.code,
        discountPercentage: coupon.discountPercentage,
        active: coupon.active,
        expiryDate: toIsoDate(coupon.expiryDate),
        createdAt: toIsoDate(coupon.createdAt),
      })),
    });
  });

  r.post('/coupons', async (req, res) => {
    const body = req.body as {
      code?: string;
      discountPercentage?: number;
      active?: boolean;
      expiryDate?: string;
    };

    const code = String(body.code ?? '').trim().toUpperCase();
    const discountPercentage = Number(body.discountPercentage ?? 0);
    const expiryDate = new Date(String(body.expiryDate ?? ''));
    const active = Boolean(body.active ?? true);

    if (!code) {
      res.status(400).json({ error: 'Coupon code is required' });
      return;
    }
    if (!Number.isFinite(discountPercentage) || discountPercentage < 1 || discountPercentage > 90) {
      res.status(400).json({ error: 'Discount percentage must be between 1 and 90' });
      return;
    }
    if (Number.isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
      res.status(400).json({ error: 'Expiry date must be a future date' });
      return;
    }

    const existing = await Coupon.findOne({ code });
    if (existing) {
      res.status(400).json({ error: 'Coupon code already exists' });
      return;
    }

    const coupon = await Coupon.create({
      code,
      discountPercentage,
      active,
      expiryDate,
    });

    res.status(201).json({
      id: coupon._id.toString(),
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
      active: coupon.active,
      expiryDate: coupon.expiryDate.toISOString(),
      createdAt: coupon.createdAt.toISOString(),
    });
  });

  r.put('/coupons/:id', async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'invalid id' });
      return;
    }

    const body = req.body as {
      code?: string;
      discountPercentage?: number;
      active?: boolean;
      expiryDate?: string;
    };

    const updates: Record<string, unknown> = {};
    if (body.code != null) {
      const code = String(body.code).trim().toUpperCase();
      if (!code) {
        res.status(400).json({ error: 'Coupon code is required' });
        return;
      }
      const duplicate = await Coupon.findOne({ code, _id: { $ne: id } });
      if (duplicate) {
        res.status(400).json({ error: 'Coupon code already exists' });
        return;
      }
      updates.code = code;
    }
    if (body.discountPercentage != null) {
      const discountPercentage = Number(body.discountPercentage);
      if (!Number.isFinite(discountPercentage) || discountPercentage < 1 || discountPercentage > 90) {
        res.status(400).json({ error: 'Discount percentage must be between 1 and 90' });
        return;
      }
      updates.discountPercentage = discountPercentage;
    }
    if (body.active != null) {
      updates.active = Boolean(body.active);
    }
    if (body.expiryDate != null) {
      const expiryDate = new Date(String(body.expiryDate));
      if (Number.isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
        res.status(400).json({ error: 'Expiry date must be a future date' });
        return;
      }
      updates.expiryDate = expiryDate;
    }

    const coupon = await Coupon.findByIdAndUpdate(id, updates, { new: true }).lean();
    if (!coupon) {
      res.status(404).json({ error: 'Coupon not found' });
      return;
    }

    res.json({
      id: coupon._id.toString(),
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
      active: coupon.active,
      expiryDate: coupon.expiryDate.toISOString(),
      createdAt: coupon.createdAt.toISOString(),
    });
  });

  r.delete('/coupons/:id', async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'invalid id' });
      return;
    }
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      res.status(404).json({ error: 'Coupon not found' });
      return;
    }
    res.json({ ok: true });
  });

  r.get('/orders', async (req, res) => {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20));
    const [orders, total] = await Promise.all([
      Order.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user', 'email name')
        .lean(),
      Order.countDocuments(),
    ]);
    res.json({
      orders: orders.map((o) => ({
        id: o._id.toString(),
        user: o.user,
        total: o.total,
        status: o.status,
        paymentMethod: o.paymentMethod,
        razorpayOrderId: o.razorpayOrderId,
        razorpayPaymentId: o.razorpayPaymentId,
        shippingAddress: o.shippingAddress,
        items: o.items,
        createdAt: o.createdAt,
      })),
      page,
      limit,
      total,
    });
  });

 r.patch('/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status?: string };

  if (!status || !allowedOrderStatuses.includes(status as OrderStatus)) {
    res.status(400).json({
      error: 'Invalid order status',
    });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: 'invalid id' });
    return;
  }

  const order = await Order.findById(id);

  if (!order) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  order.status = status as OrderStatus;

  await order.save();

  res.json({
    id: order._id.toString(),
    status: order.status,
  });
});

  return r;
}
