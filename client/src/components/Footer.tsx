import { Camera, CreditCard, Globe, PhoneOutgoing, PlayCircle, RotateCcw, ShieldCheck, Truck, X } from 'lucide-react';
import { useSite } from '../context/SiteContext';

const socialMap = [
  { key: 'whatsapp', label: 'WhatsApp', icon: PhoneOutgoing, tooltip: 'Join WhatsApp Community' },
  { key: 'facebook', label: 'Facebook', icon: Globe, tooltip: 'Follow on Facebook' },
  { key: 'instagram', label: 'Instagram', icon: Camera, tooltip: 'Follow on Instagram' },
  { key: 'twitter', label: 'X', icon: X, tooltip: 'Follow on X' },
  { key: 'youtube', label: 'YouTube', icon: PlayCircle, tooltip: 'Subscribe on YouTube' },
] as const;

const defaultBadgeItems = [
  { icon: ShieldCheck, label: 'Secure Payments' },
  { icon: Truck, label: 'Fast Delivery' },
  { icon: RotateCcw, label: 'Easy Returns' },
  { icon: CreditCard, label: 'EMI Available' },
];

function renderLink(url: string, label: string) {
  if (!url) return null;
  const isExternal = /^https?:\/\//.test(url);
  return (
    <a
      href={url}
      target={isExternal ? '_blank' : '_self'}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className="block text-sm text-slate-300 transition hover:text-white"
    >
      {label}
    </a>
  );
}

export function Footer() {
  const { settings } = useSite();
  const footer = settings.footer;
  const socialItems = [
    { url: footer.whatsappLink, ...socialMap[0] },
    { url: footer.facebookLink, ...socialMap[1] },
    { url: footer.instagramLink, ...socialMap[2] },
    { url: footer.twitterLink, ...socialMap[3] },
    { url: footer.youtubeLink, ...socialMap[4] },
  ];

  const quickLinks = footer.quickLinks.filter((item) => item.url.trim());
  const badgeItems = footer.trustBadges.length
    ? footer.trustBadges.map((badge, index) => ({
        icon: defaultBadgeItems[index]?.icon ?? ShieldCheck,
        label: badge.label || defaultBadgeItems[index]?.label || 'Trust',
      }))
    : defaultBadgeItems;

  return (
    <footer className="mt-auto bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-4 lg:gap-8">
          <div className="space-y-5">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
              <span className="text-xl font-bold">{settings.shopName?.[0] ?? 'S'}</span>
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{settings.shopName}</p>
              <p className="mt-2 max-w-xs text-sm text-slate-400">{footer.tagline || footer.description}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Customer support</p>
              {footer.supportPhone && <p className="mt-4 text-lg font-semibold text-white">{footer.supportPhone}</p>}
              {footer.supportEmail && <p className="mt-1 text-sm text-slate-400">{footer.supportEmail}</p>}
              {footer.supportHours && <p className="mt-3 text-sm text-slate-400">{footer.supportHours}</p>}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Quick links</p>
              <div className="mt-4 grid gap-2">
                {quickLinks.length > 0 ? (
                  quickLinks.map((item) => (
                    <div key={item.label}>{renderLink(item.url, item.label)}</div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Configure quick links in Admin.</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Connect with us</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {socialItems
                  .filter((item) => item.url?.trim())
                  .map((item) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={item.key}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={item.tooltip}
                        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-slate-100 shadow-lg shadow-slate-950/40 transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-600 hover:text-white"
                      >
                        <Icon size={20} />
                      </a>
                    );
                  })}
              </div>
              <div className="mt-6 grid gap-3">
                {badgeItems.map((badge) => {
                  const BadgeIcon = badge.icon;
                  return (
                    <div key={badge.label} className="inline-flex items-center gap-2 rounded-3xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-300 shadow-sm">
                      <BadgeIcon size={18} className="text-indigo-400" />
                      <span>{badge.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/20">
              <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Premium statement</p>
              <p className="mt-6 text-3xl font-semibold leading-tight text-white sm:text-4xl">
                {footer.slogan || 'Shop Smart. Dress Better. Live Stylish.'}
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {footer.addressLines.map((line, index) => (
                  <p key={`${line}-${index}`} className="text-sm text-slate-400">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-8 text-center text-sm text-slate-500 sm:flex sm:items-center sm:justify-between">
          <p>{footer.copyrightText || `© ${new Date().getFullYear()} ${settings.shopName}. All rights reserved.`}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-3 sm:mt-0">
            <span className="rounded-full bg-slate-900/90 px-3 py-2 text-xs uppercase tracking-[0.24em] text-slate-400">Secure</span>
            <span className="rounded-full bg-slate-900/90 px-3 py-2 text-xs uppercase tracking-[0.24em] text-slate-400">Premium support</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
