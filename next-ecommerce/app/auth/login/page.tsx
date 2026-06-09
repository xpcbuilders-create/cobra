'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-24 sm:px-8">
        <div className="w-full rounded-[2rem] border border-slate-800/90 bg-slate-900/90 p-10 shadow-glow sm:p-14">
          <div className="mb-8 space-y-3">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Welcome back</p>
            <h1 className="text-4xl font-semibold text-white">Sign in to your LuxShop account</h1>
            <p className="max-w-2xl text-slate-400">Access your cart, wishlist, orders and premium EMI plans.</p>
          </div>

          <div className="grid gap-5">
            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-3 rounded-3xl border border-slate-700/90 bg-slate-800/90 px-5 py-4 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/60 hover:text-white"
            >
              <img src="/images/google-logo.svg" alt="Google logo" className="h-5 w-5" />
              Continue with Google
            </button>

            <div className="flex items-center gap-3 text-slate-500">
              <span className="h-px flex-1 bg-slate-700/80"></span>
              <span className="text-sm uppercase tracking-[0.35em]">or</span>
              <span className="h-px flex-1 bg-slate-700/80"></span>
            </div>

            <form className="grid gap-5" onSubmit={(event) => event.preventDefault()}>
              <div className="grid gap-2">
                <label className="text-sm text-slate-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="rounded-3xl border border-slate-800/90 bg-slate-950/90 px-5 py-4 text-slate-100 outline-none transition focus:border-cyan-400"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm text-slate-300">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  className="rounded-3xl border border-slate-800/90 bg-slate-950/90 px-5 py-4 text-slate-100 outline-none transition focus:border-cyan-400"
                />
              </div>
              {error && <p className="text-sm text-rose-400">{error}</p>}

              <button className="inline-flex items-center justify-center gap-2 rounded-3xl bg-cyan-400 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300" type="submit">
                Sign in
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </form>

            <p className="text-sm text-slate-400">
              Don’t have an account?{' '}
              <Link href="/auth/register" className="font-semibold text-white hover:text-cyan-300">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
