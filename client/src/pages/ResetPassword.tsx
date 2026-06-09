import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiPost } from '../api';
import { useSite } from '../context/SiteContext';
import { RoundLogo } from '../components/RoundLogo';

export function ResetPassword() {
  const { settings } = useSite();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords must match.');
      return;
    }
    try {
      const data = await apiPost<{ message: string }>('/api/auth/reset-password', {
        token,
        password,
      });
      setMessage(data.message);
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <RoundLogo imageUrl={settings.loginLogoUrl || settings.logoUrl} shopName={settings.shopName} size="lg" />
        <h1 className="text-3xl font-bold text-slate-900">Reset password</h1>
        <p className="text-sm text-slate-600">
          Enter a new password to complete the reset process.
        </p>
      </div>
      {token ? (
        <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block text-sm font-medium text-slate-700">
            New password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Confirm password
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            Reset password
          </button>
        </form>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-slate-600">Reset token is missing. Please use the link sent to your email.</p>
        </div>
      )}
      {message && <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{message}</p>}
      <p className="text-center text-sm text-slate-600">
        Back to{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}
