import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, TrendingUp, History, PackagePlus, Blocks } from 'lucide-react';
import type { RecommendationResponse, RecommendationShelf } from '../api';
import { apiGet } from '../api';
import { getRecentlyViewedProductIds } from '../utils/recentlyViewed';

type Props = {
  endpoint: string;
  token?: string | null;
};

const shelfIcons: Record<string, typeof Sparkles> = {
  personalized: Sparkles,
  trending: TrendingUp,
  'recently-viewed': History,
  'frequently-bought': PackagePlus,
  similar: Blocks,
};

function buildEndpoint(endpoint: string) {
  const recent = getRecentlyViewedProductIds();
  if (recent.length === 0) return endpoint;
  const separator = endpoint.includes('?') ? '&' : '?';
  return `${endpoint}${separator}recent=${encodeURIComponent(recent.join(','))}`;
}

function RecommendationCard({ product }: { product: RecommendationShelf['items'][number] }) {
  return (
    <Link
      to={`/product/${product.slug}`}
      className="group grid min-h-[250px] grid-rows-[150px_1fr] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative bg-slate-100">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">No image</div>
        )}
        {product.isNew && (
          <span className="absolute left-3 top-3 rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">
            New
          </span>
        )}
      </div>
      <div className="flex flex-col p-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">{product.category}</p>
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900">{product.name}</h3>
        <div className="mt-auto pt-3">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-semibold text-indigo-600">₹{product.price.toFixed(2)}</span>
            {(product.mrp ?? product.price) > product.price && (
              <span className="text-sm text-slate-500 line-through">₹{(product.mrp ?? product.price).toFixed(2)}</span>
            )}
          </div>
          {(product.mrp ?? product.price) > product.price && (
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
              {Math.round((((product.mrp ?? product.price) - product.price) / (product.mrp ?? product.price)) * 100)}% OFF
            </p>
          )}
          <span className="mt-2 inline-block text-xs text-slate-500">{product.averageRating.toFixed(1)} ★</span>
        </div>
      </div>
    </Link>
  );
}

export function RecommendationWidgets({ endpoint, token }: Props) {
  const [shelves, setShelves] = useState<RecommendationShelf[]>([]);
  const [error, setError] = useState<string | null>(null);
  const requestPath = useMemo(() => buildEndpoint(endpoint), [endpoint]);

  useEffect(() => {
    let cancelled = false;
    apiGet<RecommendationResponse>(requestPath, token)
      .then((data) => {
        if (!cancelled) {
          setShelves(data.shelves.filter((item) => item.items.length > 0));
          setError(null);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [requestPath, token]);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (shelves.length === 0) {
    return null;
  }

  return (
    <div className="space-y-10">
      {shelves.map((shelf) => {
        const Icon = shelfIcons[shelf.key] ?? Sparkles;
        return (
          <section key={shelf.key} className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-lg bg-indigo-50 p-2 text-indigo-600">
                <Icon size={18} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{shelf.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{shelf.subtitle}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {shelf.items.slice(0, 8).map((product) => (
                <RecommendationCard key={`${shelf.key}-${product.id}`} product={product} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
