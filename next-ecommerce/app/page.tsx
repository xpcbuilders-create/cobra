import { HeroSection } from '../components/HeroSection';
import { ProductCard } from '../components/ProductCard';
import { GlassCard } from '../components/GlassCard';
import { motion } from 'framer-motion';

const featuredProducts = [
  {
    id: 'prod-1',
    name: 'UltraSmart Pro Glass',
    price: 1499,
    emi: 129,
    discount: 18,
    imageUrl: '/images/hero-product-1.jpg',
    category: 'Smart Home',
    slug: 'ultrasmart-pro-glass',
  },
  {
    id: 'prod-2',
    name: 'AeroSound Studio Mini',
    price: 999,
    emi: 89,
    discount: 15,
    imageUrl: '/images/hero-product-2.jpg',
    category: 'Audio',
    slug: 'aerosound-studio-mini',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <HeroSection />
      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Premium Collections</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Curated deals for modern living.</h2>
          </div>
          <p className="max-w-xl text-slate-400">
            Experience a refined shopping catalog with smart filters, stunning product cards, and flexible EMI payment options.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {featuredProducts.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-900/70 px-6 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl grid gap-6 md:grid-cols-3">
          <GlassCard title="Flash sales" description="Limited-time offers on trending categories." />
          <GlassCard title="Seamless checkout" description="Fast payments with Razorpay, Stripe and COD support." />
          <GlassCard title="Rewarding EMI" description="Smart EMI suggestions and transparent monthly breakdowns." />
        </div>
      </section>
    </main>
  );
}
