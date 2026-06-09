import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiGet } from '../api';

type CreditOrder = {
  id: string;
  total: number;
  status: string;
  paymentMethod?: string;
  isEmi?: boolean;
  emiRemainingAmount?: number;
  createdAt: string;
};

export function Credit() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<CreditOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setOrders([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    apiGet<{ orders: CreditOrder[] }>('/api/orders/my', token)
      .then((data) => setOrders(data.orders))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const {
    approvedLimit,
    availableLimit,
    creditScore,
    statusLabel,
    onTimePercent,
    utilization,
    outstandingBalance,
    paidCount,
    totalOrders,
    emiOrderCount,
  } = useMemo(() => {
    const totalOrders = orders.length;
    const paidCount = orders.filter((order) => order.status.toLowerCase() === 'paid').length;
    const pendingCount = orders.filter((order) => order.status.toLowerCase() !== 'paid').length;
    const emiOrders = orders.filter((order) => order.paymentMethod === 'emi' || order.isEmi);
    const outstandingBalance = emiOrders.reduce((sum, order) => sum + (order.emiRemainingAmount ?? 0), 0);
    const onTimePercent = totalOrders ? Math.round((paidCount / totalOrders) * 100) : 0;
    const creditScore = Math.max(300, Math.min(850, 600 + paidCount * 18 - pendingCount * 8 + Math.round(onTimePercent * 0.7)));
    const approvedLimit = Math.max(3000, Math.min(15000, 3000 + paidCount * 250 + Math.round((creditScore - 600) * 20)));
    const availableLimit = Math.max(0, approvedLimit - outstandingBalance);
    const utilization = approvedLimit ? Math.min(100, Number(((outstandingBalance / approvedLimit) * 100).toFixed(1))) : 0;
    const statusLabel = creditScore >= 720 ? 'Strong' : creditScore >= 650 ? 'Good' : creditScore >= 600 ? 'Fair' : 'Needs improvement';

    return {
      approvedLimit,
      availableLimit,
      creditScore,
      statusLabel,
      onTimePercent,
      utilization,
      outstandingBalance,
      paidCount,
      totalOrders,
      emiOrderCount: emiOrders.length,
    };
  }, [orders]);

  const summaryHeading = user ? 'Your credit dashboard' : 'Sign in to view your credit limit';
  const summaryText = user
    ? 'Track your score, approved limit, and key credit factors in one place. Stay on top of payments to grow your credit health.'
    : 'Login to unlock your personalized credit score, approved limit, and available credit based on your purchases and EMI history.';

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center text-slate-700 sm:px-6 lg:px-8">
        <p className="text-lg font-semibold">Loading credit details…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center text-rose-700 sm:px-6 lg:px-8">
        <p className="text-lg font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">PRO GAMER GEAR</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              {summaryHeading}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              {summaryText}
            </p>
          </div>
          <div className="rounded-3xl bg-slate-900 px-6 py-5 text-white shadow-lg sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Approved limit</p>
                <p className="mt-1 text-3xl font-semibold">₹{approvedLimit.toLocaleString()}</p>
              </div>
              <div className="rounded-3xl bg-slate-800/90 px-4 py-3 text-center">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Available limit</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-300">₹{availableLimit.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {token ? (
        <div className="grid gap-8 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Credit score</p>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-900 text-center text-4xl font-semibold text-white shadow-lg">
                      {creditScore}
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-slate-900">{statusLabel}</p>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                        Your score is driven by order history and on-time payments. Keep pending balances low to grow your limit.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Score range</p>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-3">
                      <span>300–449</span>
                      <span className="text-rose-600">Poor</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-3">
                      <span>450–599</span>
                      <span className="text-amber-600">Fair</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-slate-100 px-3 py-3">
                      <span>600–749</span>
                      <span className="text-emerald-600">Good</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-slate-100 px-3 py-3">
                      <span>750–850</span>
                      <span className="text-emerald-800">Excellent</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Key factors affecting your score</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">On Time Payments</p>
                  <p className="mt-2 text-4xl font-semibold text-slate-900">{onTimePercent}%</p>
                  <p className={`mt-2 text-sm ${onTimePercent >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {onTimePercent >= 80 ? 'Strong' : 'Improving'}
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Credit Utilization</p>
                  <p className="mt-2 text-4xl font-semibold text-slate-900">{utilization}%</p>
                  <p className="mt-2 text-sm text-emerald-600">{utilization <= 30 ? 'Healthy' : 'High'}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Outstanding EMI</p>
                  <p className="mt-2 text-4xl font-semibold text-slate-900">₹{outstandingBalance.toLocaleString()}</p>
                  <p className="mt-2 text-sm text-slate-600">{emiOrderCount} EMI account{emiOrderCount === 1 ? '' : 's'}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Credit age</p>
                  <p className="mt-2 text-4xl font-semibold text-slate-900">1Y 6M</p>
                  <p className="mt-2 text-sm text-emerald-600">Based on your account history</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                  <p className="text-sm font-semibold text-slate-900">Credit mix</p>
                  <p className="mt-2 text-4xl font-semibold text-slate-900">{Math.min(3, 1 + emiOrderCount)}.0</p>
                  <p className="mt-2 text-sm text-emerald-600">Includes EMI and one-time purchases</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Credit history</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">Timely Payments</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{paidCount} / {totalOrders}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">Pending Orders</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{totalOrders - paidCount}</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Action needed</h2>
              <div className="mt-5 space-y-4">
                <div className="rounded-3xl bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-700">Pay now</p>
                  <p className="mt-2 text-sm text-slate-600">Avoid extra interest and penalties by clearing pending EMI amounts.</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Keep utilization low</p>
                  <p className="mt-2 text-sm text-slate-600">Maintain low credit usage to improve your score faster.</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Frequently asked questions</h2>
              <div className="mt-4 space-y-4 text-sm text-slate-600">
                <div>
                  <p className="font-semibold text-slate-900">What affects my credit score?</p>
                  <p className="mt-2">On-time payments, credit utilization, age of credit accounts, and credit mix.</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">How can I improve it?</p>
                  <p className="mt-2">Pay dues on time and avoid taking on too much new credit at once.</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Want a better limit?</p>
              <p className="mt-2 text-sm text-slate-600">Keep your payment history clean and apply again after 30 days.</p>
              <Link
                to="/emi"
                className="mt-4 inline-flex rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Explore EMI options
              </Link>
            </div>
          </aside>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-900">Your credit score and limits are available after login.</p>
          <p className="mt-3 text-sm text-slate-600">Sign in to see a personalized approved limit based on your order history and EMI performance.</p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="inline-flex rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Create account
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
