import { NavLink, useLocation } from 'react-router-dom';
import { BarChart3, Boxes, ClipboardList, CreditCard, Image, ShieldCheck, TicketPercent } from 'lucide-react';

const adminLinks = [
  { label: 'Dashboard', to: '/admin#dashboard', icon: BarChart3 },
  { label: 'Store', to: '/admin#store', icon: Image },
  { label: 'Footer Settings', to: '/admin#footer', icon: ShieldCheck },
  { label: 'Products', to: '/admin#products', icon: Boxes },
  { label: 'Orders', to: '/admin#orders', icon: ClipboardList },
  { label: 'Coupons', to: '/admin#coupons', icon: TicketPercent },
  { label: 'EMI Applications', to: '/admin/emi', icon: CreditCard },
];

export function AdminNavbar() {
  const location = useLocation();

  return (
    <nav className="sticky top-[73px] z-30 -mx-4 border-y border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto">
        {adminLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={!item.to.includes('#')}
              className={({ isActive }) => {
                const hashActive =
                  item.to.includes('#') &&
                  ((item.to === '/admin#dashboard' && location.pathname === '/admin' && !location.hash) ||
                    `${location.pathname}${location.hash}` === item.to);
                const active = item.to.includes('#') ? hashActive : isActive;
                return `inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`;
              }}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
