import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { Product } from '../api';
import { apiGet } from '../api';

export function Shop() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (category) sp.set('category', category);
    sp.set('page', String(page));
    sp.set('limit', '12');
    apiGet<{ items: Product[]; totalPages: number }>(`/api/products?${sp.toString()}`)
      .then((d) => {
        setItems(d.items);
        setTotalPages(d.totalPages);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [q, category, page]);

  useEffect(() => {
    apiGet<{ categories: string[] }>('/api/products/categories')
      .then((d) => setCategories(d.categories))
      .catch(() => {});
  }, []);

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setParams(next);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Products</h1>

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Search</span>
          <input
            type="search"
            defaultValue={q}
            onChange={(e) => setFilter('q', e.target.value)}
            placeholder="Search products..."
            className="rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </label>
        <label className="flex w-full flex-col gap-1 text-sm sm:w-48">
          <span className="font-medium text-slate-700">Category</span>
          <select
            value={category}
            onChange={(e) => setFilter('category', e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p className="text-slate-600">Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <Link
            key={p.id}
            to={`/product/${p.slug}`}
            className={`group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md ${p.stock === 0 ? 'opacity-70' : ''}`}
          >
            <div className="relative">
              {p.stock === 0 ? (
                <span className="absolute left-3 top-3 rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                  Out of stock
                </span>
              ) : p.stock > 0 && p.stock < 5 ? (
                <span className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                  Only {p.stock} left
                </span>
              ) : null}
              {p.imageUrl ? (
                <img src={p.imageUrl} alt="" className="h-48 w-full object-cover" />
              ) : (
                <div className="flex h-48 items-center justify-center bg-slate-100 text-slate-400">
                  No image
                </div>
              )}
            </div>
            <div className="p-4 text-left">
              <p className="text-xs uppercase tracking-wide text-slate-500">{p.category}</p>
              <h2 className="mt-1 font-semibold text-slate-900">{p.name}</h2>
              <div className="mt-2 flex flex-wrap items-baseline gap-2">
                <p className="font-medium text-indigo-600">₹{p.price.toFixed(2)}</p>
                {(p.mrp ?? p.price) > p.price && (
                  <p className="text-sm text-slate-500 line-through">₹{(p.mrp ?? p.price).toFixed(2)}</p>
                )}
              </div>
              {(p.mrp ?? p.price) > p.price && (
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                  {Math.round((((p.mrp ?? p.price) - p.price) / (p.mrp ?? p.price)) * 100)}% OFF
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => {
              const next = new URLSearchParams(params);
              next.set('page', String(page - 1));
              setParams(next);
            }}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="py-2 text-sm text-slate-600">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => {
              const next = new URLSearchParams(params);
              next.set('page', String(page + 1));
              setParams(next);
            }}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
