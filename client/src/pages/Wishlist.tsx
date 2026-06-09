import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../api';
import { apiDelete, apiGet } from '../api';
import { useAuth } from '../context/AuthContext';

export function Wishlist() {
  const { token } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    apiGet<{ items: Product[] }>('/api/wishlist', token)
      .then((data) => {
        setItems(data.items);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function removeFromWishlist(productId: string) {
    if (!token) return;
    try {
      await apiDelete(`/api/wishlist/items/${encodeURIComponent(productId)}`, token);
      setItems((current) => current.filter((item) => item.id !== productId));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!token) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Wishlist</h1>
        <p className="mt-4 text-slate-600">You need to log in to view your wishlist.</p>
        <Link to="/login" className="mt-6 inline-flex rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700">
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Your Wishlist</h1>
          <p className="text-sm text-slate-600">Saved products for later.</p>
        </div>
      </div>

      {loading && <p className="text-slate-600">Loading wishlist…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && items.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-600">No items in your wishlist yet.</p>
          <Link to="/shop" className="mt-4 inline-flex rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700">
            Browse products
          </Link>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((product) => (
          <div key={product.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <Link to={`/product/${product.slug}`} className="block">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="h-48 w-full object-cover" />
              ) : (
                <div className="flex h-48 items-center justify-center bg-slate-100 text-slate-400">No image</div>
              )}
            </Link>
            <div className="p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{product.category}</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">{product.name}</h2>
              <p className="mt-2 text-indigo-600">₹{product.price.toFixed(2)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to={`/product/${product.slug}`} className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">
                  View product
                </Link>
                <button
                  type="button"
                  onClick={() => removeFromWishlist(product.id)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
