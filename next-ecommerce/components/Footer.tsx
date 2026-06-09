import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950/90 px-6 py-10 text-slate-400 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md space-y-3">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">LuxShop</p>
          <p className="text-sm leading-6 text-slate-400">
            A premium e-commerce experience built with Next.js, Express and MongoDB.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <p className="font-semibold text-white">Browse</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li><Link href="/shop">Shop</Link></li>
              <li><Link href="/emi">EMI Plans</Link></li>
              <li><Link href="/wishlist">Wishlist</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white">Support</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li><Link href="/checkout">Checkout</Link></li>
              <li><a href="mailto:support@luxshop.com">support@luxshop.com</a></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white">Policies</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li><Link href="#">Privacy</Link></li>
              <li><Link href="#">Returns</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
