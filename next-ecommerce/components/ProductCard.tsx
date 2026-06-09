'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { ProductSummary } from '../lib/types';

export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <motion.article
      whileHover={{ y: -6 }}
      className="group overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/80 p-4 shadow-glow transition"
    >
      <Link href={`/product/${product.slug}`}>
        <div className="relative overflow-hidden rounded-3xl bg-slate-800">
          <img src={product.imageUrl} alt={product.name} className="h-72 w-full object-cover transition duration-500 group-hover:scale-105" />
          {product.discount && (
            <span className="absolute left-4 top-4 rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold uppercase text-white shadow-lg">
              -{product.discount}%
            </span>
          )}
          {product.stock !== undefined && product.stock < 5 && (
            <span className="absolute right-4 top-4 rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold uppercase text-white shadow-lg">
              Only {product.stock} left
            </span>
          )}
        </div>
      </Link>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm uppercase tracking-[0.32em] text-cyan-300">{product.category}</p>
          <span className="rounded-full bg-slate-800/80 px-3 py-1 text-xs uppercase tracking-[0.35em] text-slate-300">
            EMI ₹{product.emi}/mo
          </span>
        </div>
        <h2 className="text-xl font-semibold text-white">{product.name}</h2>
        <p className="text-slate-400">{product.description}</p>

        <div className="flex items-center justify-between gap-4 pt-4">
          <div>
            <p className="text-2xl font-semibold text-white">₹{product.price}</p>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Starting EMI</p>
          </div>
          <Link href={`/product/${product.slug}`} className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
            View
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
