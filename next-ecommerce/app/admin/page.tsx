import { ChartBarIcon, DocumentTextIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-7xl px-6 py-14 sm:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Admin dashboard</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">Manage products, EMI and sales analytics.</h1>
          </div>
          <p className="max-w-xl text-slate-400">A premium admin panel with inventory control, discounts, documents and EMI rates.</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-glow">
            <div className="flex items-center gap-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-cyan-400/10 text-cyan-300">
                <ChartBarIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Analytics</p>
                <p className="text-2xl font-semibold text-white">24.3K visits</p>
              </div>
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-glow">
            <div className="flex items-center gap-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-cyan-400/10 text-cyan-300">
                <DocumentTextIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Manuals</p>
                <p className="text-2xl font-semibold text-white">Upload PDFs</p>
              </div>
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-glow">
            <div className="flex items-center gap-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-cyan-400/10 text-cyan-300">
                <PencilSquareIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Products</p>
                <p className="text-2xl font-semibold text-white">Upload & edit</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
