import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { SiteSettings } from '../api';
import { apiGet } from '../api';

const defaultSettings: SiteSettings = {
  shopName: 'My Shop',
  logoUrl: '',
  loginLogoUrl: '',
  senderEmail: '',
  banners: [],
  newArrivals: [],
  footer: {
    description: '',
    tagline: '',
    slogan: '',
    supportEmail: '',
    supportPhone: '',
    supportHours: '',
    whatsappLink: '',
    facebookLink: '',
    instagramLink: '',
    twitterLink: '',
    youtubeLink: '',
    copyrightText: '',
    quickLinks: [],
    addressLines: [],
    columns: [],
    socialLinks: [],
    trustBadges: [],
  },
};

type SiteState = {
  settings: SiteSettings;
  loading: boolean;
  refresh: () => void;
};

const SiteContext = createContext<SiteState | null>(null);

export function SiteProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refresh = () => setTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<SiteSettings>('/api/site');
        if (!cancelled) setSettings(data);
      } catch {
        if (!cancelled) setSettings(defaultSettings);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const value = useMemo(
    () => ({ settings, loading, refresh }),
    [settings, loading]
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite outside SiteProvider');
  return ctx;
}
