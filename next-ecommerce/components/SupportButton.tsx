'use client';

export function SupportButton() {
  return (
    <a
      href="https://wa.me/919999999999"
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-3 rounded-full bg-emerald-500 px-5 py-4 text-sm font-semibold text-slate-950 shadow-2xl shadow-emerald-500/20 transition hover:bg-emerald-400"
    >
      <span className="h-4 w-4 rounded-full bg-white" />
      WhatsApp Support
    </a>
  );
}
