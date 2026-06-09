import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { Product } from '../api';
import { apiGet } from '../api';
import { useSite } from '../context/SiteContext';
import { User } from "lucide-react";
import { RecommendationWidgets } from '../components/RecommendationWidgets';
import { useAuth } from '../context/AuthContext';

export function Home() {
  const { settings } = useSite();
  const { token } = useAuth();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ items: Product[] }>('/api/products?featured=true&limit=6')
      .then((d) => setFeatured(d.items))
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div className="space-y-12">
      <section className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          Welcome to {settings.shopName}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          Discover our latest collections and featured picks.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/shop"
            className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            Shop Products
          </Link>
          <Link
            to="/new-products"
            className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-800 hover:bg-slate-50"
          >
            New Arrivals
          </Link>
          <Link to="/profile">
  <User size={22} />
 </Link>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-slate-900">Featured</h2>
        {error && <p className="mt-4 text-red-600">{error}</p>}
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <Link
              key={p.id}
              to={`/product/${p.slug}`}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
              {p.imageUrl ? (
                <img src={p.imageUrl} alt="" className="h-44 w-full object-cover" />
              ) : (
                <div className="flex h-44 items-center justify-center bg-slate-100 text-slate-400">
                  No image
                </div>
              )}
              <div className="p-4 text-left">
                <h3 className="font-medium text-slate-900">{p.name}</h3>
                <div className="mt-1 flex flex-wrap items-baseline gap-2">
                  <p className="text-lg font-semibold text-indigo-600">₹{p.price.toFixed(2)}</p>
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
        {featured.length === 0 && !error && (
          <p className="mt-4 text-slate-600">
            No featured products yet. Run <code className="rounded bg-slate-100 px-1">npm run seed</code>{' '}
            or mark products as featured in Admin.
          </p>
        )}
      </section>

      <RecommendationWidgets endpoint="/api/recommendations/home" token={token} />
    </div>
  );
}
