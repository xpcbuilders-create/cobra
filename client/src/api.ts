const API_BASE = '';

export type User = {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
};

export type Review = {
  userId: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type EmiOption = {
  tenure: number;
  interest: number;
  monthlyEmi: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  mrp?: number;
  category: string;
  imageUrl: string;
  imageUrls: string[];
  stock: number;
  available?: boolean;
  featured: boolean;
  isNew?: boolean;
  averageRating: number;
  reviewCount: number;
  reviews?: Review[];
  specifications: Record<string, string>;
  emiOptions: EmiOption[];
};

export type RecommendationShelf = {
  key: string;
  title: string;
  subtitle: string;
  items: Product[];
};

export type RecommendationResponse = {
  shelves: RecommendationShelf[];
};

export type BannerSlide = {
  imageUrl: string;
  link: string;
  order: number;
};

type FooterLink = {
  label: string;
  url: string;
};

type TrustBadge = {
  label: string;
  iconUrl: string;
};

type FooterColumn = {
  title: string;
  links: FooterLink[];
};

export type CartLine = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  slug: string;
  stock: number;
  emiOptions?: EmiOption[];
};

export type TopSellingProduct = {
  productId: string;
  name: string;
  quantitySold: number;
  revenue: number;
};

export type RecentAdminOrder = {
  id: string;
  total: number;
  status: string;
  paymentMethod?: string;
  createdAt: string;
  user?: { email?: string; name?: string };
};

export type AdminAnalytics = {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  monthlyRevenue: { label: string; revenue: number }[];
  monthlyOrders: { label: string; orders: number }[];
  topSellingProducts: TopSellingProduct[];
  recentOrders: RecentAdminOrder[];
};

export type Coupon = {
  id: string;
  code: string;
  discountPercentage: number;
  active: boolean;
  expiryDate: string;
  createdAt: string;
};

export type CouponValidationResult = {
  code: string;
  discountPercentage: number;
  originalTotal: number;
  discountAmount: number;
  finalTotal: number;
  active: boolean;
  expiryDate: string;
};

export type NewArrivalSection = {
  imageUrl: string;
  title: string;
  description: string;
};

export type SiteSettings = {
  shopName: string;
  logoUrl: string;
  loginLogoUrl: string;
  senderEmail: string;
  banners: BannerSlide[];
  newArrivals: NewArrivalSection[];
  footer: {
    description: string;
    tagline: string;
    slogan: string;
    supportEmail: string;
    supportPhone: string;
    supportHours: string;
    whatsappLink: string;
    facebookLink: string;
    instagramLink: string;
    twitterLink: string;
    youtubeLink: string;
    copyrightText: string;
    quickLinks: FooterLink[];
    addressLines: string[];
    columns: FooterColumn[];
    socialLinks: { label: string; url: string }[];
    trustBadges: TrustBadge[];
  };
};

function authHeader(token: string | null): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function apiGet<T>(path: string, token?: string | null): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: authHeader(token ?? null),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: authHeader(token ?? null),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function apiPut<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: authHeader(token ?? null),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: authHeader(token ?? null),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function apiDelete(path: string, token?: string | null): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: authHeader(token ?? null),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
}
