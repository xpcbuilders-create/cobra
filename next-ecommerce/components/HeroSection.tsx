import Link from 'next/link';
import { motion } from 'framer-motion';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 py-20 sm:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.1),transparent_24%)]" />
      <div className="relative mx-auto max-w-7xl rounded-[3rem] border border-white/10 bg-slate-950/80 p-10 shadow-glow backdrop-blur-xl sm:p-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-cyan-400/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200">
              Premium e-commerce • Apple-style UI
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Shop smarter with luxury design and flexible EMI options.</h1>
            <p className="max-w-2xl text-slate-300 sm:text-lg">
              Explore curated collections, fast payments, seamless checkout, and intelligent EMI breakdowns across every product.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/shop" className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
                Shop now
              </Link>
              <Link href="/emi" className="rounded-2xl border border-slate-700 px-6 py-3 text-sm text-slate-200 transition hover:border-cyan-300 hover:text-white">
                EMI calculator
              </Link>
            </div>
          </div>
          <motion.div className="grid gap-4 sm:grid-cols-2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <div className="rounded-[2rem] bg-slate-900/90 p-5 shadow-xl shadow-cyan-500/10">
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Trending</p>
              <h2 className="mt-3 text-xl font-semibold text-white">AeroSound Studio Mini</h2>
              <p className="mt-2 text-sm text-slate-400">Smart audio with premium bass and sleek glass finish.</p>
            </div>
            <div className="rounded-[2rem] bg-slate-900/90 p-5 shadow-xl shadow-cyan-500/10">
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Hot deal</p>
              <h2 className="mt-3 text-xl font-semibold text-white">UltraSmart Pro Glass</h2>
              <p className="mt-2 text-sm text-slate-400">Buy now with 0% down payment and smart EMI guidance.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
