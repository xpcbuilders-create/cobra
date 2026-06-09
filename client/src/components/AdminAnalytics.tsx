import type { AdminAnalytics } from '../api';

function formatCurrency(value: number) {
  return `₹${value.toFixed(2)}`;
}

function formatDateLabel(value: string) {
  return value;
}

function maxValue(values: number[]) {
  return Math.max(1, ...values);
}

function RevenueChart({ data }: { data: AdminAnalytics['monthlyRevenue'] }) {
  const maxRevenue = maxValue(data.map((item) => item.revenue));
  const points = data.map((item, index) => {
    const x = data.length <= 1 ? 50 : (index / (data.length - 1)) * 100;
    const y = 92 - (item.revenue / maxRevenue) * 76;
    return { ...item, x, y };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(' ');
  const area = points.length > 0 ? `0,100 ${line} 100,100` : '';

  return (
    <div className="h-[300px] rounded-2xl bg-slate-50 p-4">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-56 w-full overflow-visible">
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4f46e5" stopOpacity="0.38" />
            <stop offset="95%" stopColor="#c7d2fe" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <polyline points="0,16 100,16" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
        <polyline points="0,54 100,54" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
        <polyline points="0,92 100,92" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
        {area && <polygon points={area} fill="url(#revenueGradient)" />}
        {line && <polyline points={line} fill="none" stroke="#4338ca" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />}
      </svg>
      <div className="mt-3 grid grid-cols-6 gap-2 text-xs text-slate-500">
        {data.map((item) => (
          <div key={item.label} className="truncate text-center">
            <p>{item.label}</p>
            <p className="mt-1 font-semibold text-slate-700">{formatCurrency(item.revenue)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersChart({ data }: { data: AdminAnalytics['monthlyOrders'] }) {
  const maxOrders = maxValue(data.map((item) => item.orders));

  return (
    <div className="h-[300px] rounded-2xl bg-slate-50 p-4">
      <div className="flex h-56 items-end gap-3">
        {data.map((item) => (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-44 w-full items-end rounded-lg bg-white px-2 shadow-inner">
              <div
                className="w-full rounded-t-lg bg-indigo-600"
                style={{ height: `${Math.max(8, (item.orders / maxOrders) * 100)}%` }}
                title={`${item.orders} orders`}
              />
            </div>
            <div className="text-center text-xs text-slate-500">
              <p>{item.label}</p>
              <p className="font-semibold text-slate-700">{item.orders}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminAnalytics({ analytics }: { analytics: AdminAnalytics | null }) {
  if (!analytics) {
    return (
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6">
        <div className="h-6 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-3xl bg-slate-100 p-4" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Total revenue</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">{formatCurrency(analytics.totalRevenue)}</p>
          <p className="mt-2 text-sm text-slate-500">Revenue from completed orders</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Orders</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">{analytics.totalOrders}</p>
          <p className="mt-2 text-sm text-slate-500">All orders placed on the store</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Users</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">{analytics.totalUsers}</p>
          <p className="mt-2 text-sm text-slate-500">Registered customers</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Products</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">{analytics.totalProducts}</p>
          <p className="mt-2 text-sm text-slate-500">Live product catalog</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <p className="text-sm font-medium text-slate-900">Monthly revenue</p>
            <p className="text-sm text-slate-500">Last 6 months</p>
          </div>
          <RevenueChart data={analytics.monthlyRevenue} />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <p className="text-sm font-medium text-slate-900">Monthly orders</p>
            <p className="text-sm text-slate-500">Last 6 months</p>
          </div>
          <OrdersChart data={analytics.monthlyOrders} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.7fr_0.3fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Top selling products</h3>
          <div className="mt-4 space-y-3">
            {analytics.topSellingProducts.map((product) => (
              <div key={product.productId} className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="font-semibold text-slate-900">{product.name}</p>
                  <p className="text-sm text-slate-500">{product.quantitySold} sold</p>
                </div>
                <p className="text-sm font-semibold text-slate-900">{formatCurrency(product.revenue)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Recent orders</h3>
          <div className="mt-4 space-y-3">
            {analytics.recentOrders.map((order) => (
              <div key={order.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">Order {order.id.slice(-6)}</p>
                  <span className="rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold text-white">
                    {order.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{order.user?.email ?? 'Unknown customer'}</p>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-700">
                  <span>{order.paymentMethod?.toUpperCase() ?? 'Unknown'}</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDateLabel(new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }))}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
