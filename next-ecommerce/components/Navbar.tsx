'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ShoppingBagIcon, HeartIcon, SparklesIcon } from '@heroicons/react/24/outline';

const navItems = [
  { label: 'Shop', href: '/shop' },
  { label: 'EMI', href: '/emi' },
  { label: 'Wishlist', href: '/wishlist' },
  { label: 'Admin', href: '/admin' },
];

export function Navbar() {
  const path = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/70 bg-slate-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-3 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 to-sky-500 shadow-glow">
            <SparklesIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.45em] text-slate-400">LuxShop</p>
            <h1 className="text-lg font-semibold">Premium Store</h1>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition ${path === item.href ? 'text-cyan-300' : 'text-slate-300 hover:text-white'}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/cart" className="group inline-flex items-center gap-2 rounded-2xl border border-slate-800/80 bg-slate-900/80 px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-300/60 hover:text-white">
            <ShoppingBagIcon className="h-4 w-4 text-cyan-300" />
            Cart
          </Link>
          <Link href="/login" className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
            Login
          </Link>
        </div>
      </div>
    </header>
  );
}
