import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';
import { apiGet } from '../api';
import { HomeBanner } from './HomeBanner';
import { RoundLogo } from './RoundLogo';
import { UserAvatar } from './UserAvatar';
import { Footer } from './Footer';

export function Layout() {
  const { user, logout, token } = useAuth();
  const { settings } = useSite();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [orders, setOrders] = useState<Array<{ id: string; total: number; status: string; paymentMethod?: string; createdAt: string }>>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) {
      setCartCount(0);
      return;
    }
    apiGet<{ items: Array<{ quantity: number }> }>('/api/cart', token)
      .then((d) => {
        const count = (d.items as Array<{ quantity: number }>).reduce((s, i) => s + i.quantity, 0);
        setCartCount(count);
      })
      .catch(() => setCartCount(0));
  }, [token, location.pathname]);

  useEffect(() => {
    if (!profileOpen || !token) return;
    setLoadingProfile(true);
    setProfileError(null);
    apiGet<{ orders: Array<{ id: string; total: number; status: string; paymentMethod?: string; createdAt: string }> }>('/api/orders/my', token)
      .then((d) => setOrders(d.orders))
      .catch((err) => setProfileError(err.message))
      .finally(() => setLoadingProfile(false));
  }, [profileOpen, token]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (!profileOpen) return;
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen]);

  const showBanner = location.pathname === '/';

  const orderCount = orders.length;
  const paidCount = orders.filter((order) => order.status.toLowerCase() === 'paid').length;
  const pendingCount = orders.filter((order) => order.status === 'pending').length;
  const emiOrders = orders.filter((order) => order.paymentMethod?.toLowerCase().includes('emi'));
  const emiPaidCount = emiOrders.filter((order) => order.status.toLowerCase() === 'paid').length;
  const emiPendingCount = emiOrders.filter((order) => order.status === 'pending').length;

  const creditScore = Math.max(550, Math.min(850, 650 + paidCount * 10 - pendingCount * 5));

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
    }`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <RoundLogo imageUrl={settings.logoUrl} shopName={settings.shopName} size="md" />
              <span className="text-xl font-bold tracking-tight text-slate-900">
                {settings.shopName}
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 sm:hidden"
              aria-label="Open navigation"
            >
              <span className="flex h-1.5 w-1.5 rounded-full bg-slate-700"></span>
              <span className="flex h-1.5 w-1.5 rounded-full bg-slate-700"></span>
              <span className="flex h-1.5 w-1.5 rounded-full bg-slate-700"></span>
            </button>
          </div>

          <nav className="hidden flex-wrap items-center justify-center gap-1 sm:flex">
            <NavLink to="/" end className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/shop" className={linkClass}>
              Products
            </NavLink>
            <NavLink to="/new-arrivals" className={linkClass}>
              New Arrivals
            </NavLink>
            <NavLink to="/new-products" className={linkClass}>
              New Products
            </NavLink>
            <NavLink to="/about" className={linkClass}>
              About Us
            </NavLink>
            <NavLink to="/customise" className={linkClass}>
              Customise
            </NavLink>
            <NavLink to="/emi" className={linkClass}>
              EMI
            </NavLink>
            <NavLink to="/credit" className={linkClass}>
              Credit
            </NavLink>
            {user && (
              <NavLink to="/wishlist" className={linkClass}>
                Wishlist
              </NavLink>
            )}
          </nav>
          {mobileMenuOpen && (
            <div className="absolute right-4 top-full z-50 mt-2 w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg sm:hidden">
              {[
                { label: 'Home', to: '/' },
                { label: 'Products', to: '/shop' },
                { label: 'New Arrivals', to: '/new-arrivals' },
                { label: 'New Products', to: '/new-products' },
                { label: 'About Us', to: '/about' },
                { label: 'Customise', to: '/customise' },
                { label: 'EMI', to: '/emi' },
                { label: 'Credit', to: '/credit' },
                ...(user ? [{ label: 'Wishlist', to: '/wishlist' }] : []),
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      `rounded-md px-3 py-2 text-sm font-medium ${
                        isActive ? 'text-indigo-700' : 'text-slate-600 hover:text-indigo-600'
                      }`
                    }
                  >
                    Admin
                  </NavLink>
                )}
                <NavLink to="/cart" className={({ isActive }) => `relative inline-flex items-center ${linkClass({ isActive })}`}>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                      {cartCount}
                    </span>
                  )}
                </NavLink>
                <div className="relative" ref={profileRef}>
                  <button
                    type="button"
                    onClick={() => setProfileOpen((open) => !open)}
                    aria-expanded={profileOpen}
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-2 hover:bg-slate-100"
                  >
                    <UserAvatar name={user.name} size="sm" />
                    <span className="hidden max-w-[120px] truncate text-sm font-medium text-slate-700 sm:inline">
                      {user.name}
                    </span>
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                      <div className="space-y-4 p-4">
                        <div className="rounded-3xl bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-900">Customer summary</p>
                          <p className="mt-1 text-sm text-slate-600">{user.email}</p>
                          <div className="mt-3 grid gap-2 text-sm text-slate-700">
                            <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 shadow-sm">
                              <span>Total orders</span>
                              <span className="font-semibold">{orderCount}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 shadow-sm">
                              <span>Paid orders</span>
                              <span className="font-semibold">{paidCount}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 shadow-sm">
                              <span>Pending orders</span>
                              <span className="font-semibold">{pendingCount}</span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-3xl bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-900">EMI details</p>
                          <p className="mt-1 text-sm text-slate-600">
                            {emiOrders.length > 0
                              ? `EMI orders: ${emiOrders.length}, Paid ${emiPaidCount}, Pending ${emiPendingCount}`
                              : 'No active EMI orders yet. Visit EMI page to get started.'}
                          </p>
                          <p className="mt-3 text-sm text-slate-700">
                            Tenure: {emiOrders.length > 0 ? 'Information unavailable in order records' : 'Not available'}
                          </p>
                        </div>

                        <div className="rounded-3xl bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-900">Credit score</p>
                          <p className="mt-1 text-xl font-semibold text-indigo-700">{creditScore}</p>
                          <p className="mt-1 text-sm text-slate-600">Score derived from order history and payment status.</p>
                        </div>

                        <div className="space-y-2">
                          <Link
                            to="/orders"
                            onClick={() => setProfileOpen(false)}
                            className="block rounded-2xl bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-700"
                          >
                            View full order history
                          </Link>
                          <Link
                            to="/emi"
                            onClick={() => setProfileOpen(false)}
                            className="block rounded-2xl border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Open EMI dashboard
                          </Link>
                        </div>
                      </div>
                      {loadingProfile && (
                        <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
                          Loading profile data…
                        </div>
                      )}
                      {profileError && (
                        <div className="border-t border-slate-200 px-4 py-3 text-sm text-rose-600">
                          {profileError}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-full bg-indigo-600 py-2 pl-2 pr-4 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <RoundLogo
                  imageUrl={settings.loginLogoUrl || settings.logoUrl}
                  shopName={settings.shopName}
                  size="sm"
                />
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      {showBanner && <HomeBanner banners={settings.banners} />}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
