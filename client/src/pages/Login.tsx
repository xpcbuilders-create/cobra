import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../api';
import type { User } from '../api';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';
import { RoundLogo } from '../components/RoundLogo';

export function Login() {
  const { setSession } = useAuth();
  const { settings } = useSite();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  const loginLogo = settings.loginLogoUrl || settings.logoUrl;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const errorParam = params.get('error');
    const decodedError = errorParam ? decodeURIComponent(errorParam) : null;

    if (token) {
      setSession(token, null);
      navigate('/', { replace: true });
      return;
    }

    if (decodedError && decodedError !== 'Google OAuth is not configured') {
      const friendlyMessage =
        decodedError === 'google_auth_failed'
          ? 'Google login failed. Please try again.'
          : decodedError;
      setError(friendlyMessage);
    }

    if (params.toString()) {
      navigate({ pathname: location.pathname, search: '' }, { replace: true });
    }
  }, [location.search, location.pathname, navigate, setSession]);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ googleOAuthEnabled: boolean }>('/api/auth/config')
      .then((data) => {
        if (!cancelled) setGoogleEnabled(data.googleOAuthEnabled);
      })
      .catch(() => {
        if (!cancelled) setGoogleEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const data = await apiPost<{ token: string; user: User }>('/api/auth/login', {
        email,
        password,
      });
      setSession(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <RoundLogo imageUrl={loginLogo} shopName={settings.shopName} size="lg" />
        <h1 className="text-3xl font-bold text-slate-900">Log in</h1>
        <p className="text-sm text-slate-600">{settings.shopName}</p>
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
        <label className="block text-sm font-medium text-slate-700">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <div className="flex items-center justify-between text-sm text-slate-600">
          <Link to="/forgot-password" className="font-medium text-indigo-600 hover:underline">
            Forgot password?
          </Link>
          {googleEnabled ? (
            <button
              type="button"
              onClick={() => window.location.href = '/api/auth/google'}
              className="text-indigo-600 hover:underline"
            >
              Continue with Google
            </button>
          ) : (
            <span className="text-slate-500">Google login unavailable</span>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Log in
        </button>
      </form>
      <p className="text-center text-sm text-slate-600">
        No account?{' '}
        <Link to="/register" className="font-medium text-indigo-600 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
