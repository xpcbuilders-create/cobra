import Link from 'next/link';

const cartItems = [
  {
    id: 'prod-1',
    name: 'UltraSmart Pro Glass',
    slug: 'ultrasmart-pro-glass',
    quantity: 1,
    price: 1499,
    imageUrl: '/images/shop-1.jpg',
  },
  {
    id: 'prod-2',
    name: 'AeroSound Studio Mini',
    slug: 'aerosound-studio-mini',
    quantity: 1,
    price: 999,
    imageUrl: '/images/shop-2.jpg',
  },
];

export default function CartPage() {
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-6xl px-6 py-14 sm:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Shopping cart</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">Review your selected items.</h1>
          </div>
          <p className="max-w-xl text-slate-400">Fast checkout with COD, Razorpay, Stripe and EMI support.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.7fr_0.35fr]">
          <div className="space-y-5 rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-6 shadow-glow">
            {cartItems.map((item) => (
              <div key={item.id} className="grid gap-4 rounded-[1.75rem] border border-slate-800/90 bg-slate-950/90 p-4 sm:grid-cols-[100px_1fr]">
                <img src={item.imageUrl} alt={item.name} className="h-28 w-full rounded-3xl object-cover" />
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold text-white">{item.name}</h2>
                    <span className="rounded-full bg-slate-800/90 px-3 py-1 text-sm text-cyan-300">x{item.quantity}</span>
                  </div>
                  <p className="text-slate-400">₹{item.price}</p>
                  <div className="flex gap-3">
                    <button className="rounded-3xl bg-slate-800/90 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-700/90">Remove</button>
                    <button className="rounded-3xl border border-slate-700/90 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300">Move to wishlist</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="space-y-5 rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-6 shadow-glow">
            <div className="rounded-[1.75rem] bg-slate-950/90 p-6">
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Order summary</p>
              <div className="mt-4 space-y-4 text-slate-300">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>₹149</span>
                </div>
                <div className="flex justify-between border-t border-slate-800/80 pt-4 text-lg font-semibold text-white">
                  <span>Total</span>
                  <span>₹{total + 149}</span>
                </div>
              </div>
            </div>
            <Link href="/checkout" className="inline-flex w-full items-center justify-center rounded-3xl bg-cyan-400 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
              Proceed to checkout
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}
