import { useSite } from '../context/SiteContext';
import { Link } from 'react-router-dom';

export function NewArrivals() {
  const { settings } = useSite();
  const arrivals = settings.newArrivals ?? [];

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-indigo-600">New arrivals</p>
          <h1 className="text-4xl font-bold text-slate-900">Fresh arrivals handpicked for you</h1>
          <p className="mx-auto max-w-2xl text-sm text-slate-600">
            Discover the latest additions to our store. Each section below is managed by the admin and highlights one featured item with a headline and description.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {arrivals.length > 0 ? (
          arrivals.map((section, index) => (
            <article key={index} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              {section.imageUrl && (
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
                  <img src={section.imageUrl} alt={section.title} className="h-52 w-full object-cover" />
                </div>
              )}
              <div className="mt-5 space-y-3">
                <h2 className="text-2xl font-semibold text-slate-900">{section.title || 'New arrival'}</h2>
                <p className="text-sm text-slate-600">{section.description || 'A fresh new arrival from our collection.'}</p>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-600">
            <p className="text-lg font-semibold">No new arrivals are available yet.</p>
            <p className="mt-2">Please check back later or browse our current products.</p>
            <Link to="/shop" className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              Shop products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
