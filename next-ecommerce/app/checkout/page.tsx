import { ShoppingBagIcon } from '@heroicons/react/24/outline';

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-6xl px-6 py-14 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.75fr_0.45fr]">
          <div className="space-y-6 rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-glow">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Checkout</p>
                <h1 className="text-4xl font-semibold text-white">Secure payment and delivery</h1>
              </div>
              <ShoppingBagIcon className="h-10 w-10 text-cyan-300" />
            </div>

            <div className="grid gap-4 rounded-[1.75rem] border border-slate-800/90 bg-slate-950/90 p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">Order subtotal</p>
                <p className="font-semibold text-white">₹2,798</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">Shipping</p>
                <p className="font-semibold text-white">₹149</p>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
                <p className="font-semibold text-white">Total</p>
                <p className="text-2xl font-semibold text-cyan-300">₹2,947</p>
              </div>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-2 text-sm text-slate-300">
                Full name
                <input className="rounded-3xl border border-slate-800/90 bg-slate-950/90 px-5 py-4 text-slate-100 outline-none transition focus:border-cyan-400" placeholder="Jane Doe" />
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                Shipping address
                <textarea className="min-h-[120px] rounded-3xl border border-slate-800/90 bg-slate-950/90 px-5 py-4 text-slate-100 outline-none transition focus:border-cyan-400" placeholder="123 Modern Street, New York"></textarea>
              </label>
              <button className="rounded-3xl bg-cyan-400 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                Place order
              </button>
            </div>
          </div>

          <aside className="space-y-6 rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-glow">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Payment methods</p>
            <div className="grid gap-3">
              <button className="rounded-3xl border border-slate-800/90 bg-slate-950/90 px-5 py-4 text-left text-slate-200 transition hover:border-cyan-400">
                Razorpay
              </button>
              <button className="rounded-3xl border border-slate-800/90 bg-slate-950/90 px-5 py-4 text-left text-slate-200 transition hover:border-cyan-400">
                Stripe
              </button>
              <button className="rounded-3xl border border-slate-800/90 bg-slate-950/90 px-5 py-4 text-left text-slate-200 transition hover:border-cyan-400">
                Cash on Delivery
              </button>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
