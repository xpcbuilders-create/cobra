import Link from 'next/link';

const wishlistItems = [
  {
    id: 'prod-1',
    name: 'UltraSmart Pro Glass',
    slug: 'ultrasmart-pro-glass',
    price: 1499,
    imageUrl: '/images/shop-1.jpg',
  },
  {
    id: 'prod-3',
    name: 'LumaCharge Desk Mat',
    slug: 'lumacharge-desk-mat',
    price: 299,
    imageUrl: '/images/shop-3.jpg',
  },
];

export default function WishlistPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-7xl px-6 py-14 sm:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Wishlist</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">Your saved items.</h1>
          </div>
          <p className="max-w-xl text-slate-400">Quick access to the products you want to revisit and buy later.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {wishlistItems.map((product) => (
            <div key={product.id} className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-5 shadow-glow">
              <img src={product.imageUrl} alt={product.name} className="h-72 w-full rounded-[1.75rem] object-cover" />
              <div className="mt-5 space-y-3">
                <h2 className="text-xl font-semibold text-white">{product.name}</h2>
                <p className="text-lg font-semibold text-cyan-300">₹{product.price}</p>
                <div className="flex flex-wrap gap-3">
                  <Link href={`/product/${product.slug}`} className="rounded-3xl border border-slate-700/90 bg-slate-950/90 px-5 py-3 text-sm text-white transition hover:border-cyan-300">
                    View
                  </Link>
                  <button className="rounded-3xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-400">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
