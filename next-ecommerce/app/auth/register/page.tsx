'use client';

import Link from 'next/link';
import { useState } from 'react';
import { UserPlusIcon } from '@heroicons/react/24/outline';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-24 sm:px-8">
        <div className="w-full rounded-[2rem] border border-slate-800/90 bg-slate-900/90 p-10 shadow-glow sm:p-14">
          <div className="mb-8 space-y-3">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Create account</p>
            <h1 className="text-4xl font-semibold text-white">Start shopping with premium privileges.</h1>
            <p className="max-w-2xl text-slate-400">Secure registration with JWT and Google OAuth support.</p>
          </div>

          <form className="grid gap-5" onSubmit={(event) => event.preventDefault()}>
            <div className="grid gap-2">
              <label className="text-sm text-slate-300">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Jane Doe"
                className="rounded-3xl border border-slate-800/90 bg-slate-950/90 px-5 py-4 text-slate-100 outline-none transition focus:border-cyan-400"
              />
            </div>
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
                placeholder="Choose a strong password"
                className="rounded-3xl border border-slate-800/90 bg-slate-950/90 px-5 py-4 text-slate-100 outline-none transition focus:border-cyan-400"
              />
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-3xl bg-cyan-400 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300" type="submit">
              Create account
              <UserPlusIcon className="h-5 w-5" />
            </button>
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold text-white hover:text-cyan-300">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
