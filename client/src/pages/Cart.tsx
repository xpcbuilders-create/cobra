import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { CartLine } from '../api';
import { apiGet, apiPatch, apiDelete } from '../api';
import { useAuth } from '../context/AuthContext';

export function Cart() {
  const { token } = useAuth();
  const [items, setItems] = useState<CartLine[]>([]);
  const [error, setError] = useState<string | null>(null);

  function load() {
    if (!token) return;
    apiGet<{ items: CartLine[] }>('/api/cart', token)
      .then((d) => {
        setItems(d.items as CartLine[]);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }

  useEffect(() => {
    load();
  }, [token]);

  if (!token) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600">Sign in to view your cart.</p>
        <Link to="/login" className="mt-4 inline-block text-indigo-600 hover:underline">
          Log in
        </Link>
      </div>
    );
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const hasUnavailableItems = items.some((item) => item.stock === 0 || item.quantity > item.stock);

  async function updateQty(productId: string, quantity: number) {
    if (!token) return;
    try {
      await apiPatch(`/api/cart/items/${productId}`, { quantity }, token);
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function remove(productId: string) {
    if (!token) return;
    try {
      await apiDelete(`/api/cart/items/${productId}`, token);
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Cart</h1>
      {error && <p className="text-red-600">{error}</p>}

      {items.length === 0 ? (
        <p className="text-slate-600">Your cart is empty.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <ul className="divide-y divide-slate-100">
            {items.map((line) => (
              <li key={line.productId} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <Link to={`/product/${line.slug}`} className="flex flex-1 gap-4">
                  {line.imageUrl ? (
                    <img src={line.imageUrl} alt="" className="h-24 w-24 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                      No img
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-slate-900">{line.name}</p>
                    <p className="text-sm text-slate-600">${line.price.toFixed(2)} each</p>
                  </div>
                </Link>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={line.stock}
                    value={line.quantity}
                    onChange={(e) =>
                      updateQty(line.productId, Math.max(0, Number(e.target.value) || 0))
                    }
                    className="w-16 rounded border border-slate-300 px-2 py-1 text-center"
                  />
                  <button
                    type="button"
                    onClick={() => remove(line.productId)}
                    disabled={items.length === 1}
                    className={`text-sm ${items.length === 1 ? 'cursor-not-allowed text-slate-400' : 'text-red-600 hover:underline'}`}
                  >
                    Remove
                  </button>
                </div>
                <p className="font-semibold text-slate-900 sm:w-28 sm:text-right">
                  ${(line.price * line.quantity).toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-4">
            <span className="text-lg font-semibold text-slate-900">Subtotal</span>
            <span className="text-xl font-bold text-indigo-600">${subtotal.toFixed(2)}</span>
          </div>
          {hasUnavailableItems && (
            <div className="border-t border-slate-100 px-4 py-4 text-sm text-rose-600">
              Some cart items are unavailable or exceed current stock. Please update quantities before checkout.
            </div>
          )}
          <div className="border-t border-slate-100 px-4 py-4">
            <button
              type="button"
              onClick={() => !hasUnavailableItems && navigate('/checkout')}
              disabled={hasUnavailableItems}
              className={`inline-block w-full rounded-lg py-3 text-center font-semibold text-white sm:w-auto sm:px-8 ${hasUnavailableItems ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
