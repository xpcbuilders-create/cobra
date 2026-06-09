import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { AdminAnalytics, Product, SiteSettings } from '../api';
import { apiGet, apiPatch, apiPost, apiPut, apiDelete } from '../api';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';
import { AdminAnalytics as AdminAnalyticsPanel } from '../components/AdminAnalytics';
import { AdminNavbar } from '../components/AdminNavbar';

type AdminOrder = {
  id: string;
  total: number;
  status: string;
  paymentMethod?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
  user?: { email?: string; name?: string };
  shippingAddress?: {
    addressLine?: string;
    street?: string;
    landmark?: string;
    district?: string;
    pinCode?: string;
    state?: string;
    phone1?: string;
    phone2?: string;
  };
};

type Coupon = {
  id: string;
  code: string;
  discountPercentage: number;
  active: boolean;
  expiryDate: string;
  createdAt: string;
};

type CouponForm = {
  code: string;
  discountPercentage: string;
  expiryDate: string;
  active: boolean;
};

const emptyProductForm = {
  name: '',
  description: '',
  price: '',
  mrp: '',
  category: 'general',
  imageUrls: ['', '', '', '', '', ''],
  stock: '0',
  featured: false,
  isNew: false,
  specifications: [{ key: '', value: '' }],
};

const emptyCouponForm: CouponForm = {
  code: '',
  discountPercentage: '',
  expiryDate: '',
  active: true,
};

const emptyBanner = { imageUrl: '', link: '' };
const emptyNewArrival = { imageUrl: '', title: '', description: '' };

const orderStatuses = [
  'Placed',
  'Paid',
  'Confirmed',
  'Packed',
  'Shipped',
  'Out For Delivery',
  'Delivered',
  'Cancelled',
];

export function Admin() {
  const { token, user } = useAuth();
  const { refresh: refreshSite } = useSite();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyProductForm);
  const [shopName, setShopName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loginLogoUrl, setLoginLogoUrl] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [banners, setBanners] = useState<{ imageUrl: string; link: string }[]>([]);
  const [newArrivals, setNewArrivals] = useState<Array<{ imageUrl: string; title: string; description: string }>>([
    { ...emptyNewArrival },
    { ...emptyNewArrival },
    { ...emptyNewArrival },
  ]);
  const [footerTagline, setFooterTagline] = useState('');
  const [footerSlogan, setFooterSlogan] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [supportHours, setSupportHours] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [facebookLink, setFacebookLink] = useState('');
  const [instagramLink, setInstagramLink] = useState('');
  const [twitterLink, setTwitterLink] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [copyrightText, setCopyrightText] = useState('');
  const [quickLinks, setQuickLinks] = useState<Array<{ label: string; url: string }>>([
    { label: 'Home', url: '' },
    { label: 'Products', url: '' },
    { label: 'New Arrivals', url: '' },
    { label: 'EMI', url: '' },
    { label: 'About Us', url: '' },
    { label: 'Contact Us', url: '' },
  ]);
  const [footerLoading, setFooterLoading] = useState(false);
  const [footerMsg, setFooterMsg] = useState<string | null>(null);
  const [footerError, setFooterError] = useState<string | null>(null);
  const [draggedNewArrival, setDraggedNewArrival] = useState<number | null>(null);
  const [dragOverNewArrival, setDragOverNewArrival] = useState<number | null>(null);
  const [siteMsg, setSiteMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [productMsg, setProductMsg] = useState<string | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingNewArrivalIndex, setUploadingNewArrivalIndex] = useState<number | null>(null);
  const [newArrivalUploadError, setNewArrivalUploadError] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponForm, setCouponForm] = useState<CouponForm>(emptyCouponForm);
  const [couponSearch, setCouponSearch] = useState('');
  const [couponSortAsc, setCouponSortAsc] = useState(true);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<Product | null>(null);
  const [productDetailsTab, setProductDetailsTab] = useState<'details' | 'specs' | 'reviews'>('details');

  function loadOrders() {
    if (!token || user?.role !== 'admin') return;
    apiGet<{ orders: AdminOrder[] }>('/api/admin/orders', token)
      .then((d) => setOrders(d.orders))
      .catch((e: Error) => setError(e.message));
  }

  function loadProducts() {
    if (!token || user?.role !== 'admin') return;
    apiGet<{ items: Product[] }>('/api/products?limit=48', token)
      .then((d) => setProducts(d.items))
      .catch((e: Error) => setError(e.message));
  }

  function loadSite() {
    if (!token || user?.role !== 'admin') return;
    apiGet<SiteSettings>('/api/admin/site', token)
      .then((s) => {
        setShopName(s.shopName);
        setLogoUrl(s.logoUrl);
        setLoginLogoUrl(s.loginLogoUrl ?? '');
        setSenderEmail(s.senderEmail ?? '');

        setFooterTagline(s.footer.tagline ?? '');
        setFooterSlogan(s.footer.slogan ?? '');
        setSupportEmail(s.footer.supportEmail ?? '');
        setSupportPhone(s.footer.supportPhone ?? '');
        setSupportHours(s.footer.supportHours ?? '');
        setWhatsappLink(s.footer.whatsappLink ?? '');
        setFacebookLink(s.footer.facebookLink ?? '');
        setInstagramLink(s.footer.instagramLink ?? '');
        setTwitterLink(s.footer.twitterLink ?? '');
        setYoutubeLink(s.footer.youtubeLink ?? '');
        setCopyrightText(s.footer.copyrightText ?? '');

        const nextQuickLinks = [...(s.footer.quickLinks ?? [])];
        const defaultQuickLinks = [
          { label: 'Home', url: '' },
          { label: 'Products', url: '' },
          { label: 'New Arrivals', url: '' },
          { label: 'EMI', url: '' },
          { label: 'About Us', url: '' },
          { label: 'Contact Us', url: '' },
        ];
        while (nextQuickLinks.length < defaultQuickLinks.length) {
          nextQuickLinks.push(defaultQuickLinks[nextQuickLinks.length]);
        }
        setQuickLinks(nextQuickLinks.slice(0, defaultQuickLinks.length));

        const slots = [...s.banners.map((b) => ({ imageUrl: b.imageUrl, link: b.link }))];
        while (slots.length < 6) slots.push({ ...emptyBanner });
        setBanners(slots.slice(0, 6));
        const arrivals = [...(s.newArrivals ?? [])];
        while (arrivals.length < 3) arrivals.push({ ...emptyNewArrival });
        setNewArrivals(arrivals.slice(0, 3));
      })
      .catch((e: Error) => setError(e.message));
  }

  function loadCoupons() {
    if (!token || user?.role !== 'admin') return;
    apiGet<{ coupons: Coupon[] }>('/api/admin/coupons', token)
      .then((d) => setCoupons(d.coupons))
      .catch((e: Error) => setError(e.message));
  }

  function handleNewArrivalDragStart(index: number) {
    setDraggedNewArrival(index);
    setDragOverNewArrival(null);
  }

  function handleNewArrivalDragOver(index: number) {
    if (draggedNewArrival === null || draggedNewArrival === index) return;
    setDragOverNewArrival(index);
  }

  function handleNewArrivalDrop(index: number) {
    if (draggedNewArrival === null) return;
    const next = [...newArrivals];
    const [moved] = next.splice(draggedNewArrival, 1);
    next.splice(index, 0, moved);
    setNewArrivals(next);
    setDraggedNewArrival(null);
    setDragOverNewArrival(null);
  }

  function handleNewArrivalDragEnd() {
    setDraggedNewArrival(null);
    setDragOverNewArrival(null);
  }

  function loadAnalytics() {
    if (!token || user?.role !== 'admin') return;
    apiGet<{ analytics?: AdminAnalytics } & AdminAnalytics>('/api/admin/analytics', token)
      .then((d) => setAnalytics(d.analytics ?? d))
      .catch((e: Error) => setError(e.message));
  }

  async function downloadInvoice(id: string) {
    if (!token) return;
    setDownloadingInvoiceId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? res.statusText);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `invoice-${id}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDownloadingInvoiceId(null);
    }
  }

  function resetCouponForm() {
    setCouponForm(emptyCouponForm);
    setEditingCouponId(null);
    setCouponMsg(null);
  }

  async function saveCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setCouponMsg(null);

    const code = couponForm.code.trim().toUpperCase();
    const discountPercentage = Number(couponForm.discountPercentage);
    const expiryDate = new Date(couponForm.expiryDate);

    if (!code) {
      setError('Coupon code is required.');
      return;
    }
    if (!Number.isFinite(discountPercentage) || discountPercentage < 1 || discountPercentage > 90) {
      setError('Discount must be between 1 and 90%.');
      return;
    }
    if (Number.isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
      setError('Expiry date must be in the future.');
      return;
    }

    try {
      if (editingCouponId) {
        await apiPut(
          `/api/admin/coupons/${editingCouponId}`,
          {
            code,
            discountPercentage,
            expiryDate: expiryDate.toISOString(),
            active: couponForm.active,
          },
          token
        );
        setCouponMsg('Coupon updated.');
      } else {
        await apiPost(
          '/api/admin/coupons',
          {
            code,
            discountPercentage,
            expiryDate: expiryDate.toISOString(),
            active: couponForm.active,
          },
          token
        );
        setCouponMsg('Coupon created.');
      }
      resetCouponForm();
      loadCoupons();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function editCoupon(coupon: Coupon) {
    setEditingCouponId(coupon.id);
    setCouponForm({
      code: coupon.code,
      discountPercentage: String(coupon.discountPercentage),
      expiryDate: coupon.expiryDate.split('T')[0],
      active: coupon.active,
    });
    setCouponMsg(null);
  }

  async function deleteCoupon(id: string) {
    if (!token) return;
    if (!window.confirm('Delete this coupon?')) return;
    setError(null);
    try {
      await apiDelete(`/api/admin/coupons/${id}`, token);
      loadCoupons();
      setCouponMsg('Coupon deleted.');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function toggleCouponActive(coupon: Coupon) {
    if (!token) return;
    setError(null);
    try {
      await apiPut(
        `/api/admin/coupons/${coupon.id}`,
        { active: !coupon.active },
        token
      );
      loadCoupons();
      setCouponMsg(`${coupon.code} is now ${coupon.active ? 'disabled' : 'enabled'}.`);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function copyCoupon(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCouponMsg('Coupon code copied to clipboard.');
    } catch {
      setError('Could not copy coupon code.');
    }
  }

  useEffect(() => {
    loadOrders();
    loadProducts();
    loadSite();
    loadCoupons();
    loadAnalytics();
  }, [token, user?.role]);

  useEffect(() => {
    if (!footerMsg && !footerError) return;
    const timeout = window.setTimeout(() => {
      setFooterMsg(null);
      setFooterError(null);
    }, 4500);
    return () => window.clearTimeout(timeout);
  }, [footerMsg, footerError]);

  async function uploadImage(index: number, file: File) {
    if (!token) return;
    setUploadingIndex(index);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error((errorJson as { error?: string }).error || 'Upload failed');
      }
      const data = (await res.json()) as { url: string };
      setForm((prev) => {
        const nextUrls = [...prev.imageUrls];
        nextUrls[index] = data.url;
        return { ...prev, imageUrls: nextUrls };
      });
    } catch (error) {
      setUploadError((error as Error).message);
    } finally {
      setUploadingIndex(null);
    }
  }

  async function uploadNewArrivalImage(index: number, file: File) {
    if (!token) return;
    setUploadingNewArrivalIndex(index);
    setNewArrivalUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error((errorJson as { error?: string }).error || 'Upload failed');
      }
      const data = (await res.json()) as { url: string };
      setNewArrivals((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], imageUrl: data.url };
        return next;
      });
    } catch (error) {
      setNewArrivalUploadError((error as Error).message);
    } finally {
      setUploadingNewArrivalIndex(null);
    }
  }

  async function saveSite(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSiteMsg(null);
    setError(null);
    try {
      await apiPut(
        '/api/admin/site',
        {
          shopName,
          logoUrl,
          loginLogoUrl,
          senderEmail,
          banners: banners.filter((b) => b.imageUrl.trim()),
          newArrivals: newArrivals.filter((item) => item.imageUrl.trim() || item.title.trim() || item.description.trim()),
        },
        token
      );
      setSiteMsg('Store settings saved.');
      refreshSite();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function saveFooterSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setFooterMsg(null);
    setFooterError(null);
    setFooterLoading(true);

    if (supportEmail && !supportEmail.includes('@')) {
      setFooterError('Support email must be a valid email address.');
      setFooterLoading(false);
      return;
    }

    try {
      await apiPut(
        '/api/footer',
        {
          tagline: footerTagline,
          slogan: footerSlogan,
          supportEmail,
          supportPhone,
          supportHours,
          whatsappLink,
          facebookLink,
          instagramLink,
          twitterLink,
          youtubeLink,
          copyrightText,
          quickLinks: quickLinks.map((link) => ({ label: link.label, url: link.url })),
        },
        token
      );
      setFooterMsg('Footer settings updated successfully.');
      refreshSite();
    } catch (err) {
      setFooterError((err as Error).message);
    } finally {
      setFooterLoading(false);
    }
  }

  async function setStatus(id: string, status: string) {
    if (!token) return;
    try {
      await apiPatch(`/api/admin/orders/${id}/status`, { status }, token);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setProductMsg(null);
    setError(null);
    const price = Number(form.price);
    const mrp = Number(form.mrp);
    if (!form.name.trim() || Number.isNaN(price) || price < 0 || Number.isNaN(mrp) || mrp < price) {
      setProductMsg('Enter a valid name, price, and MRP (MRP must be >= price).');
      return;
    }
    try {
      await apiPost(
        '/api/admin/products',
        {
          name: form.name.trim(),
          description: form.description.trim(),
          price,
          mrp,
          category: form.category.trim() || 'general',
          imageUrls: form.imageUrls.filter((url) => url.trim()),
          stock: Math.max(0, Math.floor(Number(form.stock) || 0)),
          featured: form.featured,
          isNew: form.isNew,
          specifications: form.specifications
            .filter((item) => item.key.trim() && item.value.trim())
            .reduce<Record<string, string>>((acc, item) => {
              acc[item.key.trim()] = item.value.trim();
              return acc;
            }, {}),
        },
        token
      );
      setForm(emptyProductForm);
      setProductMsg('Product created.');
      loadProducts();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function saveStock(id: string) {
    if (!token) return;
    const stock = Math.max(0, Math.floor(Number(editStock) || 0));
    try {
      await apiPatch(`/api/admin/products/${id}`, { stock }, token);
      setEditingId(null);
      loadProducts();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function toggleFeatured(p: Product) {
    if (!token) return;
    try {
      await apiPatch(`/api/admin/products/${p.id}`, { featured: !p.featured }, token);
      loadProducts();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function toggleNew(p: Product) {
    if (!token) return;
    try {
      await apiPatch(`/api/admin/products/${p.id}`, { isNew: !p.isNew }, token);
      loadProducts();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function removeProduct(id: string) {
    if (!token) return;
    if (!window.confirm('Delete this product?')) return;
    try {
      await apiDelete(`/api/admin/products/${id}`, token);
      loadProducts();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!token || user?.role !== 'admin') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-900">
        Admin access only. <Link to="/">Go home</Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin</h1>
        <p className="mt-2 text-slate-600">
          Manage products and orders. Admin login is created by{' '}
          <code className="rounded bg-slate-100 px-1">npm run seed</code> (see server/.env.example).
        </p>
      </div>

      <AdminNavbar />

      {error && <p className="text-red-600">{error}</p>}

      <section id="dashboard" className="scroll-mt-36">
        <AdminAnalyticsPanel analytics={analytics} />
      </section>

      {products.filter((p) => p.stock > 0 && p.stock < 5).length > 0 && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-sm">
          <p className="font-semibold">Low stock alert</p>
          <p className="mt-1">
            {products.filter((p) => p.stock > 0 && p.stock < 5).length} products with low stock. Update inventory to avoid stockouts.
          </p>
        </div>
      )}

      {products.filter((p) => p.stock === 0).length > 0 && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900 shadow-sm">
          <p className="font-semibold">Out of stock products</p>
          <p className="mt-1">
            {products.filter((p) => p.stock === 0).length} products are currently unavailable and need restocking.
          </p>
        </div>
      )}

      <section id="store" className="scroll-mt-36 space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Store &amp; banners</h2>
        <p className="text-sm text-slate-600">
          Set your shop name, logo (image URL), and up to 6 homepage banner images shown under the
          navbar.
        </p>
        <form
          onSubmit={saveSite}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Shop name
              <input
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Shop logo URL (round, navbar)
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Sender email for notifications
              <input
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="no-reply@example.com"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
              Login page logo URL (round; leave empty to use shop logo)
              <input
                value={loginLogoUrl}
                onChange={(e) => setLoginLogoUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>
          <div className="flex gap-4">
            {logoUrl && (
              <div className="text-center">
                <img src={logoUrl} alt="" className="mx-auto h-14 w-14 rounded-full object-cover" />
                <p className="mt-1 text-xs text-slate-500">Shop logo</p>
              </div>
            )}
            {(loginLogoUrl || logoUrl) && (
              <div className="text-center">
                <img
                  src={loginLogoUrl || logoUrl}
                  alt=""
                  className="mx-auto h-14 w-14 rounded-full object-cover"
                />
                <p className="mt-1 text-xs text-slate-500">Login logo</p>
              </div>
            )}
          </div>

          <h3 className="font-medium text-slate-800">Homepage banners (max 6)</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {banners.map((b, i) => (
              <div key={i} className="rounded-lg border border-slate-200 p-3">
                <p className="mb-2 text-xs font-semibold text-slate-500">Banner {i + 1}</p>
                <label className="block text-xs text-slate-600">
                  Image URL
                  <input
                    value={b.imageUrl}
                    onChange={(e) => {
                      const next = [...banners];
                      next[i] = { ...next[i], imageUrl: e.target.value };
                      setBanners(next);
                    }}
                    placeholder="https://..."
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                </label>
                <label className="mt-2 block text-xs text-slate-600">
                  Link (optional, e.g. /shop)
                  <input
                    value={b.link}
                    onChange={(e) => {
                      const next = [...banners];
                      next[i] = { ...next[i], link: e.target.value };
                      setBanners(next);
                    }}
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                </label>
                {b.imageUrl && (
                  <img
                    src={b.imageUrl}
                    alt=""
                    className="mt-2 h-20 w-full rounded object-cover"
                  />
                )}
              </div>
            ))}
          </div>

          <h3 className="font-medium text-slate-800">New arrivals sections (max 3)</h3>
          <div className="grid gap-4">
            {newArrivals.map((item, i) => (
              <div
                key={i}
                draggable
                onDragStart={() => handleNewArrivalDragStart(i)}
                onDragOver={(e) => {
                  e.preventDefault();
                  handleNewArrivalDragOver(i);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleNewArrivalDrop(i);
                }}
                onDragEnd={handleNewArrivalDragEnd}
                className={`rounded-lg border p-4 ${
                  dragOverNewArrival === i ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-slate-500">Section {i + 1}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                    Drag to reorder
                  </span>
                </div>
                <div className="mb-3">
                  <label className="block text-xs text-slate-600">
                    Image Upload
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadNewArrivalImage(i, file);
                      }}
                      className="mt-1 w-full text-sm text-slate-600"
                    />
                  </label>
                  {uploadingNewArrivalIndex === i && (
                    <p className="mt-2 text-xs text-slate-500">Uploading…</p>
                  )}
                </div>
                <label className="block text-xs text-slate-600">
                  Image URL (optional - use upload above)
                  <input
                    value={item.imageUrl}
                    onChange={(e) => {
                      const next = [...newArrivals];
                      next[i] = { ...next[i], imageUrl: e.target.value };
                      setNewArrivals(next);
                    }}
                    placeholder="https://..."
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                </label>
                <label className="mt-3 block text-xs text-slate-600">
                  Section title
                  <input
                    value={item.title}
                    onChange={(e) => {
                      const next = [...newArrivals];
                      next[i] = { ...next[i], title: e.target.value };
                      setNewArrivals(next);
                    }}
                    placeholder="Title"
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                </label>
                <label className="mt-3 block text-xs text-slate-600">
                  Description
                  <textarea
                    value={item.description}
                    onChange={(e) => {
                      const next = [...newArrivals];
                      next[i] = { ...next[i], description: e.target.value };
                      setNewArrivals(next);
                    }}
                    placeholder="Short paragraph"
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-2 text-sm"
                    rows={3}
                  />
                </label>
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="mt-3 h-24 w-full rounded object-cover"
                  />
                )}
              </div>
            ))}
          </div>
          {newArrivalUploadError && <p className="mt-2 text-sm text-red-600">{newArrivalUploadError}</p>}

          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
          >
            Save store &amp; banners
          </button>
          {siteMsg && <span className="ml-3 text-sm text-green-700">{siteMsg}</span>}
        </form>
      </section>

      <section id="footer" className="scroll-mt-36 space-y-4">
        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Footer Settings</h2>
            <p className="mt-1 text-sm text-slate-600">
              Manage the footer content, social links, quick links, and copyright details.
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            Only admins can update footer settings.
          </div>
        </div>

        <form onSubmit={saveFooterSettings} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Footer tagline
              <input
                value={footerTagline}
                onChange={(e) => setFooterTagline(e.target.value)}
                placeholder="A premium shopping experience"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Main slogan
              <input
                value={footerSlogan}
                onChange={(e) => setFooterSlogan(e.target.value)}
                placeholder="Shop Smart. Dress Better. Live Stylish."
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Support email
              <input
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="support@example.com"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Support phone number
              <input
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                placeholder="+1 234 567 890"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Working hours
              <input
                value={supportHours}
                onChange={(e) => setSupportHours(e.target.value)}
                placeholder="Mon–Fri 9am–6pm"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Copyright text
              <input
                value={copyrightText}
                onChange={(e) => setCopyrightText(e.target.value)}
                placeholder="© 2026 Your Shop. All rights reserved."
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              WhatsApp community link
              <input
                value={whatsappLink}
                onChange={(e) => setWhatsappLink(e.target.value)}
                placeholder="https://wa.me/..."
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Facebook link
              <input
                value={facebookLink}
                onChange={(e) => setFacebookLink(e.target.value)}
                placeholder="https://facebook.com/..."
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Instagram link
              <input
                value={instagramLink}
                onChange={(e) => setInstagramLink(e.target.value)}
                placeholder="https://instagram.com/..."
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              X (Twitter) link
              <input
                value={twitterLink}
                onChange={(e) => setTwitterLink(e.target.value)}
                placeholder="https://x.com/..."
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700 md:col-span-2">
              YouTube link
              <input
                value={youtubeLink}
                onChange={(e) => setYoutubeLink(e.target.value)}
                placeholder="https://youtube.com/..."
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
              />
            </label>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Quick links</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {quickLinks.map((link, index) => (
                <label key={link.label} className="block text-sm font-medium text-slate-700">
                  {link.label}
                  <input
                    value={link.url}
                    onChange={(e) => {
                      const next = [...quickLinks];
                      next[index] = { ...next[index], url: e.target.value };
                      setQuickLinks(next);
                    }}
                    placeholder="/shop or https://..."
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={footerLoading}
              className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {footerLoading ? 'Saving footer...' : 'Save footer settings'}
            </button>
            {footerMsg && <span className="text-sm text-emerald-600">{footerMsg}</span>}
            {footerError && <span className="text-sm text-rose-600">{footerError}</span>}
          </div>
        </form>
      </section>

      <section id="products" className="scroll-mt-36 space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Products</h2>
        <form
          onSubmit={createProduct}
          className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Name
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Price
            <input
              required
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            MRP
            <input
              required
              type="number"
              min={0}
              step="0.01"
              value={form.mrp}
              onChange={(e) => setForm((f) => ({ ...f, mrp: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Details
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <div className="sm:col-span-3">
            <p className="text-sm font-medium text-slate-700">Specifications</p>
            <div className="mt-2 space-y-3">
              {form.specifications.map((spec, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <input
                    value={spec.key}
                    onChange={(e) => {
                      const next = [...form.specifications];
                      next[index] = { ...next[index], key: e.target.value };
                      setForm((f) => ({ ...f, specifications: next }));
                    }}
                    placeholder="Specification name"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <input
                    value={spec.value}
                    onChange={(e) => {
                      const next = [...form.specifications];
                      next[index] = { ...next[index], value: e.target.value };
                      setForm((f) => ({ ...f, specifications: next }));
                    }}
                    placeholder="Specification value"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  {form.specifications.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        const next = form.specifications.filter((_, idx) => idx !== index);
                        setForm((f) => ({ ...f, specifications: next }));
                      }}
                      className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setForm((f) => ({
                  ...f,
                  specifications: [...f.specifications, { key: '', value: '' }],
                }))}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                + Add specification
              </button>
            </div>
          </div>
          <label className="block text-sm font-medium text-slate-700">
            Category
            <input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <div className="sm:col-span-3">
            <p className="text-sm font-medium text-slate-700">Product images (up to 6)</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {form.imageUrls.map((url, index) => (
                <div key={index} className="rounded-lg border border-slate-200 p-3">
                  <p className="mb-2 text-xs font-semibold text-slate-500">Image {index + 1}</p>
                  <input
                    value={url}
                    onChange={(e) => {
                      const next = [...form.imageUrls];
                      next[index] = e.target.value;
                      setForm((f) => ({ ...f, imageUrls: next }));
                    }}
                    placeholder="https://..."
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadImage(index, file);
                    }}
                    className="mt-2 w-full text-sm text-slate-600"
                  />
                  {uploadingIndex === index && (
                    <p className="mt-2 text-xs text-slate-500">Uploading…</p>
                  )}
                </div>
              ))}
            </div>
            {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
          </div>
          <label className="block text-sm font-medium text-slate-700">
            Stock
            <input
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
            />
            Featured on home
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.isNew}
              onChange={(e) => setForm((f) => ({ ...f, isNew: e.target.checked }))}
            />
            New product
          </label>
          <div className="sm:col-span-3">
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
            >
              Add product
            </button>
            {productMsg && <span className="ml-3 text-sm text-slate-600">{productMsg}</span>}
          </div>
        </form>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Featured</th>
                <th className="px-4 py-3 font-medium">New</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.slug}</p>
                  </td>
                  <td className="px-4 py-3">${p.price.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    {editingId === p.id ? (
                      <span className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          value={editStock}
                          onChange={(e) => setEditStock(e.target.value)}
                          className="w-20 rounded border border-slate-300 px-2 py-1"
                        />
                        <button
                          type="button"
                          onClick={() => saveStock(p.id)}
                          className="text-indigo-600 hover:underline"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="text-slate-500 hover:underline"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(p.id);
                          setEditStock(String(p.stock));
                        }}
                        className="text-indigo-600 hover:underline"
                      >
                        {p.stock}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleFeatured(p)}
                      className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium uppercase text-slate-700 hover:bg-slate-200"
                    >
                      {p.featured ? 'yes' : 'no'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleNew(p)}
                      className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium uppercase text-slate-700 hover:bg-slate-200"
                    >
                      {p.isNew ? 'yes' : 'no'}
                    </button>
                  </td>
                  
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProductForDetails(p);
                        setProductDetailsTab('details');
                      }}
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                      onClick={() => removeProduct(p.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="orders" className="scroll-mt-36">
        <h2 className="text-xl font-semibold text-slate-900">Recent orders</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Update</th>
                <th className="px-4 py-3 font-medium">Razorpay ID</th>
                <th className="px-4 py-3 font-medium">Address</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3">{o.id}</td>
                  <td className="px-4 py-3">{o.user?.email}</td>
                  <td className="px-4 py-3">${o.total.toFixed(2)}</td>
                  <td className="px-4 py-3">{o.paymentMethod ?? 'N/A'}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => downloadInvoice(o.id)}
                      disabled={downloadingInvoiceId === o.id}
                      className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                    >
                      {downloadingInvoiceId === o.id ? 'Downloading…' : 'Invoice'}
                    </button>
                  </td>
                  <td className="px-4 py-3">{o.status}</td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => setStatus(o.id, e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                    >
                      {orderStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs break-all">{o.razorpayOrderId ?? '—'}</td>
                  <td className="px-4 py-3 text-xs">
                    {o.shippingAddress ? (
                      <>
                        <div>{o.shippingAddress.addressLine}</div>
                        <div>{o.shippingAddress.street}</div>
                        {o.shippingAddress.landmark && (
                          <div>Landmark: {o.shippingAddress.landmark}</div>
                        )}
                        <div>
                          {o.shippingAddress.district} - {o.shippingAddress.pinCode}
                        </div>
                        <div>{o.shippingAddress.state}</div>
                        <div>Phone: {o.shippingAddress.phone1}</div>
                        {o.shippingAddress.phone2 && <div>Alt: {o.shippingAddress.phone2}</div>}
                      </>
                    ) : (
                      'No address'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="coupons" className="scroll-mt-36 space-y-4">
        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Coupon management</h2>
            <p className="mt-1 text-sm text-slate-600">
              Create, edit, search, and enable coupons for store-wide discounts.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCouponSortAsc((prev) => !prev)}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Sort expiry {couponSortAsc ? '▲' : '▼'}
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={saveCoupon} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Coupon code
                <input
                  value={couponForm.code}
                  onChange={(e) => setCouponForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="SUMMER10"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Discount %
                <input
                  value={couponForm.discountPercentage}
                  onChange={(e) => setCouponForm((prev) => ({ ...prev, discountPercentage: e.target.value }))}
                  placeholder="15"
                  type="number"
                  min={1}
                  max={90}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Expiry date
                <input
                  type="date"
                  value={couponForm.expiryDate}
                  onChange={(e) => setCouponForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={couponForm.active}
                  onChange={(e) => setCouponForm((prev) => ({ ...prev, active: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                />
                Active
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                {editingCouponId ? 'Update coupon' : 'Create coupon'}
              </button>
              <button
                type="button"
                onClick={resetCouponForm}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Clear
              </button>
              {couponMsg && <span className="text-sm text-green-600">{couponMsg}</span>}
            </div>
          </form>

          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <label className="block text-sm font-medium text-slate-700">
              Search by code
              <input
                value={couponSearch}
                onChange={(e) => setCouponSearch(e.target.value.toUpperCase())}
                placeholder="FESTIVE20"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <p className="mt-3 text-sm text-slate-500">Showing {coupons.filter((coupon) => coupon.code.includes(couponSearch.trim())).length} coupon(s)</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Discount</th>
                <th className="px-4 py-3 font-medium">Expiry</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons
                .filter((coupon) => coupon.code.includes(couponSearch.trim()))
                .sort((a, b) => {
                  const diff = new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
                  return couponSortAsc ? diff : -diff;
                })
                .map((coupon) => (
                  <tr key={coupon.id}>
                    <td className="px-4 py-3 font-medium">{coupon.code}</td>
                    <td className="px-4 py-3">{coupon.discountPercentage}%</td>
                    <td className="px-4 py-3">{new Date(coupon.expiryDate).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3">{coupon.active ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3">{new Date(coupon.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3 space-x-2 text-sm">
                      <button
                        type="button"
                        onClick={() => editCoupon(coupon)}
                        className="rounded-lg bg-slate-100 px-3 py-1 text-slate-700 hover:bg-slate-200"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => copyCoupon(coupon.code)}
                        className="rounded-lg bg-slate-100 px-3 py-1 text-slate-700 hover:bg-slate-200"
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleCouponActive(coupon)}
                        className="rounded-lg bg-slate-100 px-3 py-1 text-slate-700 hover:bg-slate-200"
                      >
                        {coupon.active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCoupon(coupon.id)}
                        className="rounded-lg bg-rose-100 px-3 py-1 text-rose-700 hover:bg-rose-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedProductForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-slate-900">{selectedProductForDetails.name}</h2>
              <button
                type="button"
                onClick={() => setSelectedProductForDetails(null)}
                className="text-2xl text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <div className="mb-6 flex gap-4 overflow-x-auto">
              {selectedProductForDetails.imageUrls.map((url, index) => (
                <img key={index} src={url} alt={`${index + 1}`} className="h-20 w-20 rounded-lg object-cover flex-shrink-0" />
              ))}
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4">
              <div>
                <p className="text-xs uppercase text-slate-500">Price</p>
                <p className="text-lg font-semibold text-slate-900">₹{selectedProductForDetails.price.toFixed(2)}</p>
                {(selectedProductForDetails.mrp ?? selectedProductForDetails.price) > selectedProductForDetails.price && (
                  <p className="mt-1 text-sm text-slate-500 line-through">₹{(selectedProductForDetails.mrp ?? selectedProductForDetails.price).toFixed(2)}</p>
                )}
                {(selectedProductForDetails.mrp ?? selectedProductForDetails.price) > selectedProductForDetails.price && (
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                    Save ₹{((selectedProductForDetails.mrp ?? selectedProductForDetails.price) - selectedProductForDetails.price).toFixed(0)} ({Math.round((((selectedProductForDetails.mrp ?? selectedProductForDetails.price) - selectedProductForDetails.price) / (selectedProductForDetails.mrp ?? selectedProductForDetails.price)) * 100)}% OFF)
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Stock</p>
                <p className="text-lg font-semibold text-slate-900">{selectedProductForDetails.stock}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Category</p>
                <p className="text-lg font-semibold text-slate-900">{selectedProductForDetails.category}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Rating</p>
                <p className="text-lg font-semibold text-slate-900">{selectedProductForDetails.averageRating.toFixed(1)} ★ ({selectedProductForDetails.reviewCount} reviews)</p>
              </div>
            </div>

            <div className="flex gap-2 border-b border-slate-200 mb-4">
              {(['details', 'specs', 'reviews'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setProductDetailsTab(tab)}
                  className={`px-4 py-2 font-medium transition ${
                    productDetailsTab === tab
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab === 'details' ? 'Details' : tab === 'specs' ? 'Specifications' : 'Reviews'}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {productDetailsTab === 'details' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
                    <p className="text-slate-700 leading-relaxed">{selectedProductForDetails.description}</p>
                  </div>
                </div>
              )}

              {productDetailsTab === 'specs' && (
                <div className="space-y-3">
                  {Object.entries(selectedProductForDetails.specifications).length > 0 ? (
                    Object.entries(selectedProductForDetails.specifications).map(([key, value]) => (
                      <div key={key} className="flex gap-4 border-b border-slate-100 pb-3">
                        <p className="font-medium text-slate-700 flex-shrink-0 w-32">{key}</p>
                        <p className="text-slate-600">{value}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">No specifications added.</p>
                  )}
                </div>
              )}

              {productDetailsTab === 'reviews' && (
                <div className="space-y-4">
                  {selectedProductForDetails.reviews && selectedProductForDetails.reviews.length > 0 ? (
                    selectedProductForDetails.reviews.map((review, index) => (
                      <div key={index} className="border-b border-slate-100 pb-4 last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-slate-900">{review.name}</p>
                          <div className="flex gap-1">
                            {Array.from({ length: 5 }, (_, i) => (
                              <span key={i} className={i < review.rating ? 'text-amber-500' : 'text-slate-300'}>
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-slate-500 mb-2">{new Date(review.createdAt).toLocaleDateString('en-IN')}</p>
                        <p className="text-slate-700">{review.comment}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">No reviews yet.</p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedProductForDetails(null)}
                className="rounded-lg bg-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
