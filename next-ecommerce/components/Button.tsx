'use client';

import Link from 'next/link';

type ButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function Button({ href, children, variant = 'primary' }: ButtonProps) {
  const base = 'inline-flex w-full items-center justify-center rounded-3xl px-5 py-4 text-sm font-semibold transition';
  const styles = {
    primary: 'bg-cyan-400 text-slate-950 hover:bg-cyan-300',
    secondary: 'border border-slate-700/90 bg-slate-950/90 text-white hover:border-cyan-300',
    ghost: 'bg-slate-800/90 text-slate-100 hover:bg-slate-700/90',
  };

  return (
    <Link href={href} className={`${base} ${styles[variant]}`}>
      {children}
    </Link>
  );
}
