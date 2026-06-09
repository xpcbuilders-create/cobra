import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDb } from './db.js';
import { User } from './models/User.js';
import { Product } from './models/Product.js';
import { SiteSettings, SITE_KEY } from './models/SiteSettings.js';

const MONGODB_URI = process.env.MONGODB_URI ?? '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123';

async function run() {
  if (!MONGODB_URI) {
    console.error('Set MONGODB_URI in server/.env');
    process.exit(1);
  }
  await connectDb(MONGODB_URI);

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await User.findOneAndUpdate(
    { email: ADMIN_EMAIL.toLowerCase() },
    {
      email: ADMIN_EMAIL.toLowerCase(),
      passwordHash,
      name: 'Admin',
      role: 'admin',
    },
    { upsert: true, new: true }
  );
  console.log(`Admin user: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);

  await SiteSettings.findOneAndUpdate(
    { key: SITE_KEY },
    {
      shopName: 'StyleHub',
      logoUrl: '',
      senderEmail: ADMIN_EMAIL.toLowerCase(),
      banners: [
        {
          imageUrl:
            'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80',
          link: '/shop',
        },
        {
          imageUrl:
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80',
          link: '/new-products',
        },
        {
          imageUrl:
            'https://images.unsplash.com/photo-1472851294608-062f824d1479?w=1200&q=80',
          link: '/shop',
        },
      ],
      newArrivals: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1200&q=80',
          title: 'Fresh launch: Summer essentials',
          description: 'Stylish new pieces to keep you cool and confident all season long.',
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1512499617640-c2f999018b72?w=1200&q=80',
          title: 'New tech for modern homes',
          description: 'Smart gadgets and accessories now available for fast delivery.',
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200&q=80',
          title: 'Trending fashion arrivals',
          description: 'Discover the latest arrivals in clothing, shoes, and statement accessories.',
        },
      ],
      footer: {
        description: 'StyleHub brings curated fashion, fast delivery, and friendly support to every shopper.',
        tagline: 'Elite style with effortless comfort',
        slogan: 'Shop Smart. Dress Better. Live Stylish.',
        supportEmail: ADMIN_EMAIL.toLowerCase(),
        supportPhone: '+1 555 123 4567',
        supportHours: 'Mon–Fri 9am–6pm',
        whatsappLink: 'https://wa.me/15551234567',
        facebookLink: 'https://facebook.com',
        instagramLink: 'https://instagram.com',
        twitterLink: 'https://twitter.com',
        youtubeLink: 'https://youtube.com',
        copyrightText: '© 2026 StyleHub. Crafted for modern wardrobes and curated living.',
        quickLinks: [
          { label: 'Home', url: '/' },
          { label: 'Products', url: '/shop' },
          { label: 'New Arrivals', url: '/new-arrivals' },
          { label: 'EMI', url: '/emi' },
          { label: 'About Us', url: '/about' },
          { label: 'Contact Us', url: '/customise' },
        ],
        addressLines: ['123 Market Street', 'Suite 400', 'Los Angeles, CA 90017'],
        columns: [
          {
            title: 'Company',
            links: [
              { label: 'About', url: '/about' },
              { label: 'Shop', url: '/shop' },
              { label: 'Careers', url: '/contact' },
            ],
          },
          {
            title: 'Support',
            links: [
              { label: 'Help center', url: '/help' },
              { label: 'Shipping', url: '/shipping' },
              { label: 'Returns', url: '/returns' },
            ],
          },
          {
            title: 'Legal',
            links: [
              { label: 'Terms', url: '/terms' },
              { label: 'Privacy', url: '/privacy' },
              { label: 'Security', url: '/security' },
            ],
          },
        ],
        socialLinks: [
          { label: 'Instagram', url: 'https://instagram.com' },
          { label: 'Facebook', url: 'https://facebook.com' },
          { label: 'Twitter', url: 'https://twitter.com' },
        ],
        trustBadges: [
          { label: 'Secure Payments', iconUrl: '' },
          { label: 'Fast Delivery', iconUrl: '' },
          { label: 'Easy Returns', iconUrl: '' },
          { label: 'EMI Available', iconUrl: '' },
        ],
      },
    },
    { upsert: true, new: true }
  );
  console.log('Site settings (shop name, banners) seeded.');

  const samples = [
    {
      name: 'Minimal Desk Lamp',
      slug: 'minimal-desk-lamp',
      description: 'Adjustable LED lamp with warm light.',
      price: 49.99,
      category: 'home',
      imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80',
      stock: 25,
      featured: true,
      newProduct: false,
    },
    {
      name: 'Wireless Headphones',
      slug: 'wireless-headphones',
      description: 'Comfortable over-ear headphones with active noise cancellation.',
      price: 199,
      category: 'electronics',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
      stock: 40,
      featured: true,
      newProduct: true,
    },
    {
      name: 'Ceramic Coffee Mug',
      slug: 'ceramic-coffee-mug',
      description: 'Matte finish mug, dishwasher safe.',
      price: 18.5,
      category: 'kitchen',
      imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80',
      stock: 100,
      featured: false,
      newProduct: true,
    },
  ];

  for (const s of samples) {
    await Product.findOneAndUpdate({ slug: s.slug }, s, { upsert: true, new: true });
  }
  console.log(`Seeded ${samples.length} products.`);

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
