import { Link, useLocation } from 'react-router-dom';

export function PaymentFailure() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const reason = params.get('reason');

  return (
    <div className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-3xl font-bold text-slate-900">Payment failed</h1>
      <p className="text-slate-600">There was a problem processing your payment.</p>
      {reason && <p className="text-sm text-red-600">{decodeURIComponent(reason)}</p>}
      <div className="space-x-3 pt-4">
        <Link
          to="/checkout"
          className="inline-flex rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Try again
        </Link>
        <Link to="/" className="inline-flex rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Back to shop
        </Link>
      </div>
    </div>
  );
}
