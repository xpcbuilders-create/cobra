import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiPost } from '../api';
import { useSite } from '../context/SiteContext';
import { RoundLogo } from '../components/RoundLogo';

export function ForgotPassword() {
  const { settings } = useSite();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setResetUrl(null);
    try {
      const data = await apiPost<{ message: string; resetUrl?: string }>('/api/auth/forgot-password', {
        email,
      });
      setMessage(data.message);
      setResetUrl(data.resetUrl ?? null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <RoundLogo imageUrl={settings.loginLogoUrl || settings.logoUrl} shopName={settings.shopName} size="lg" />
        <h1 className="text-3xl font-bold text-slate-900">Forgot password</h1>
        <p className="text-sm text-slate-600">Enter your email and we&apos;ll send password reset instructions.</p>
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Send reset link
        </button>
      </form>
      {message && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p>{message}</p>
          {resetUrl && (
            <p className="mt-3 break-words">
              <a href={resetUrl} className="font-medium text-indigo-600 hover:underline">
                Open password reset link
              </a>
            </p>
          )}
        </div>
      )}
      <p className="text-center text-sm text-slate-600">
        Remembered?{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
