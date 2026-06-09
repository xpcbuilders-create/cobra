import { notFound } from 'next/navigation';
import Link from 'next/link';
import { StarIcon } from '@heroicons/react/24/solid';
import { Button } from '../../../components/Button';

const products = [
  {
    id: 'prod-1',
    slug: 'ultrasmart-pro-glass',
    name: 'UltraSmart Pro Glass',
    category: 'Smart Home',
    description: 'A glass display with gesture controls, AR overlays, and premium ambient lighting.',
    price: 1499,
    emi: 129,
    discount: 18,
    stock: 4,
    rating: 4.8,
    reviewCount: 225,
    imageUrls: ['/images/shop-1.jpg', '/images/shop-1-2.jpg', '/images/shop-1-3.jpg'],
    features: ['Gesture controls', 'Adaptive brightness', 'Wi-Fi + Bluetooth', 'Voice assistant ready'],
  },
];

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = products.find((item) => item.slug === params.slug);
  if (!product) return notFound();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-7xl px-6 py-14 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6 rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-6 shadow-glow">
            <div className="grid gap-4 md:grid-cols-[0.95fr_0.4fr]">
              <div className="rounded-[2rem] bg-slate-950/70 p-4">
                <img src={product.imageUrls[0]} alt={product.name} className="h-96 w-full rounded-[1.75rem] object-cover" />
              </div>
              <div className="grid gap-4">
                {product.imageUrls.slice(1).map((image) => (
                  <div key={image} className="overflow-hidden rounded-[1.75rem] bg-slate-900/90">
                    <img src={image} alt={product.name} className="h-44 w-full object-cover transition duration-500 hover:scale-105" />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">{product.category}</p>
              <h1 className="text-4xl font-semibold text-white">{product.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-slate-400">
                <span className="inline-flex items-center gap-1 text-sm">
                  <StarIcon className="h-4 w-4 text-amber-400" /> {product.rating}
                </span>
                <span className="text-sm">{product.reviewCount} reviews</span>
                <span className="rounded-full bg-slate-800/90 px-3 py-1 text-xs uppercase tracking-[0.35em] text-cyan-300">Only {product.stock} left</span>
              </div>
              <p className="max-w-2xl leading-7 text-slate-300">{product.description}</p>
            </div>
          </div>

          <aside className="space-y-6 rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-glow">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Price</p>
                  <p className="text-4xl font-semibold text-white">₹{product.price}</p>
                </div>
                <div className="rounded-3xl bg-slate-950/80 px-4 py-3 text-sm font-semibold text-cyan-300">Save {product.discount}%</div>
              </div>
              <div className="rounded-3xl bg-slate-800/80 p-5 text-slate-300">
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">EMI starts at</p>
                <p className="mt-2 text-3xl font-semibold text-white">₹{product.emi}/mo</p>
                <p className="mt-1 text-sm text-slate-400">Based on 12-month plan with selected EMI rates.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Button href="/checkout">Buy now</Button>
              <Button href="#" variant="ghost">Add to cart</Button>
              <Button href="#" variant="secondary">Add to wishlist</Button>
            </div>

            <div className="rounded-3xl border border-slate-800/90 bg-slate-950/90 p-5 text-sm text-slate-300">
              <p className="font-semibold text-white">EMI calculator</p>
              <p className="mt-3 leading-7">Choose duration and interest rate on the EMI page to preview breakdowns with zero surprises.</p>
              <Link href="/emi" className="mt-4 inline-flex rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                View EMI plans
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
