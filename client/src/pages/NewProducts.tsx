import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { Product } from '../api';
import { apiGet } from '../api';

export function NewProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ items: Product[] }>('/api/products?isNew=true&limit=24')
      .then((d) => {
        setItems(d.items);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">New Products</h1>
      <p className="text-slate-600">Latest arrivals marked as new in the catalog.</p>

      {loading && <p className="text-slate-600">Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <Link
            key={p.id}
            to={`/product/${p.slug}`}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
          >
            {p.imageUrl ? (
              <img src={p.imageUrl} alt="" className="h-48 w-full object-cover" />
            ) : (
              <div className="flex h-48 items-center justify-center bg-slate-100 text-slate-400">
                No image
              </div>
            )}
            <div className="p-4 text-left">
              <span className="text-xs font-semibold uppercase text-indigo-600">New</span>
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

      {!loading && items.length === 0 && !error && (
        <p className="text-slate-600">
          No new products yet. In Admin, mark products as &quot;New&quot; when creating or editing.
        </p>
      )}
    </div>
  );
}
