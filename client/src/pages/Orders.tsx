import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apiGet } from '../api';
import { useAuth } from '../context/AuthContext';
import { OrderTracker } from '../components/OrderTracker';
import { PAYMENT_OPTIONS, type ShippingAddress } from '../types/checkout';

type OrderRow = {
  id: string;
  total: number;
  status: string;
  paymentMethod?: string;
  createdAt: string;
  items: { name: string; price: number; quantity: number }[];
  shippingAddress?: ShippingAddress & {
    line1?: string;
    city?: string;
    postalCode?: string;
  };
};

function paymentLabel(id?: string) {
  return PAYMENT_OPTIONS.find((p) => p.id === id)?.label ?? id ?? '—';
}

function formatAddress(addr: OrderRow['shippingAddress']) {
  if (!addr) return null;
  if (addr.addressLine) {
    return [
      addr.addressLine,
      addr.street,
      addr.landmark && `Landmark: ${addr.landmark}`,
      `${addr.district} – ${addr.pinCode}`,
      addr.state,
      `Ph: ${addr.phone1}${addr.phone2 ? `, ${addr.phone2}` : ''}`,
    ].filter(Boolean);
  }
  if (addr.line1) {
    return [addr.line1, addr.city, addr.postalCode].filter(Boolean);
  }
  return null;
}

export function Orders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    apiGet<{ orders: OrderRow[] }>('/api/orders/my', token)
      .then((d) => setOrders(d.orders))
      .catch((e: Error) => setError(e.message));
  }, [token]);

  async function downloadInvoice(orderId: string) {
    if (!token) return;
    setDownloadingInvoiceId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error ?? res.statusText);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDownloadingInvoiceId(null);
    }
  }

  if (!token) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <Link to="/login" className="text-indigo-600">
          Log in
        </Link>{' '}
        to see your orders.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Your orders</h1>
      {error && <p className="text-red-600">{error}</p>}
      {orders.length === 0 ? (
        <p className="text-slate-600">No orders yet.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => {
            const lines = formatAddress(o.shippingAddress);
            return (
              <li key={o.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-sm text-slate-500">{o.id.slice(-8)}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase text-slate-700">
                    {o.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {new Date(o.createdAt).toLocaleString()} · ${o.total.toFixed(2)}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Payment: {paymentLabel(o.paymentMethod)}
                </p>
                <div className="mt-4">
                  <OrderTracker status={o.status} />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadInvoice(o.id)}
                    disabled={downloadingInvoiceId === o.id}
                    className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                  >
                    {downloadingInvoiceId === o.id ? 'Downloading…' : 'Download invoice'}
                  </button>
                </div>
                {lines && (
                  <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                    <p className="font-medium text-slate-800">Delivery address</p>
                    {lines.map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                )}
                <ul className="mt-3 text-sm text-slate-700">
                  {o.items.map((it, i) => (
                    <li key={i}>
                      {it.quantity}× {it.name} — ${(it.price * it.quantity).toFixed(2)}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
