import { ProductCard } from '../../components/ProductCard';
import { SearchIcon } from '@heroicons/react/24/outline';

const sampleProducts = [
  {
    id: 'prod-1',
    name: 'UltraSmart Pro Glass',
    slug: 'ultrasmart-pro-glass',
    category: 'Home',
    description: 'Transparent smart glass with adaptive display and gesture control.',
    price: 1499,
    emi: 129,
    discount: 18,
    stock: 4,
    imageUrl: '/images/shop-1.jpg',
  },
  {
    id: 'prod-2',
    name: 'AeroSound Studio Mini',
    slug: 'aerosound-studio-mini',
    category: 'Audio',
    description: 'Compact premium speakers with immersive sound and voice assistant.',
    price: 999,
    emi: 89,
    discount: 15,
    stock: 9,
    imageUrl: '/images/shop-2.jpg',
  },
  {
    id: 'prod-3',
    name: 'LumaCharge Desk Mat',
    slug: 'lumacharge-desk-mat',
    category: 'Accessories',
    description: 'Wireless charging desk mat with ambient lighting and premium texture.',
    price: 299,
    emi: 29,
    discount: 10,
    stock: 2,
    imageUrl: '/images/shop-3.jpg',
  },
];

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-7xl px-6 py-14 sm:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Product showcase</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">Shop the latest premium products.</h1>
          </div>
          <div className="relative max-w-md">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              placeholder="Search products, categories, brands"
              className="w-full rounded-3xl border border-slate-800/90 bg-slate-900/90 py-3 pl-12 pr-4 text-slate-200 outline-none transition focus:border-cyan-400"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sampleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
