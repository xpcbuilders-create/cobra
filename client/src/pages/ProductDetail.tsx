import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { Product } from '../api';
import { apiDelete, apiGet, apiPost } from '../api';
import { useAuth } from '../context/AuthContext';
import { UserAvatar } from '../components/UserAvatar';
import { RecommendationWidgets } from '../components/RecommendationWidgets';
import { rememberViewedProduct } from '../utils/recentlyViewed';

export function ProductDetail() {
  const { slug } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedTab, setSelectedTab] = useState<'details' | 'specs' | 'reviews'>('details');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    if (!slug) return;
    apiGet<Product>(`/api/products/${encodeURIComponent(slug)}`)
      .then((data) => {
        setProduct(data);
        setSelectedImageIndex(0);
        rememberViewedProduct(data.id);
        if (token) {
          void apiPost('/api/recommendations/events', { productId: data.id }, token).catch(() => {});
        }
      })
      .catch((e: Error) => setError(e.message));
  }, [slug, token]);

  useEffect(() => {
    async function loadWishlistState() {
      if (!product || !token) {
        setInWishlist(false);
        return;
      }
      try {
        const wishlist = await apiGet<{ items: Product[] }>('/api/wishlist', token);
        setInWishlist(wishlist.items.some((item) => item.id === product.id));
      } catch {
        setInWishlist(false);
      }
    }
    loadWishlistState();
  }, [product, token]);

  async function addToCart() {
    if (!product || !token) return;
    setMsg(null);
    try {
      await apiPost('/api/cart/items', { productId: product.id, quantity: qty }, token);
      setMsg('Added to cart');
      setQty(1);
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  async function buyNow() {
    if (!product || !token) return;
    setMsg(null);
    try {
      await apiPost('/api/cart/items', { productId: product.id, quantity: qty }, token);
      navigate('/checkout');
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  async function toggleWishlist() {
    if (!product || !token) return;
    setWishlistLoading(true);
    try {
      if (inWishlist) {
        await apiDelete(`/api/wishlist/items/${encodeURIComponent(product.id)}`, token);
        setInWishlist(false);
      } else {
        await apiPost('/api/wishlist/items', { productId: product.id }, token);
        setInWishlist(true);
      }
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setWishlistLoading(false);
    }
  }

  async function submitReview() {
    if (!product || !token) return;
    setReviewMsg(null);
    try {
      const updated = await apiPost<Product>(
        `/api/products/${encodeURIComponent(product.slug)}/reviews`,
        { rating, comment: comment.trim() },
        token
      );
      setProduct(updated);
      setComment('');
      setRating(5);
      setReviewMsg('Review submitted.');
      setSelectedTab('reviews');
    } catch (e) {
      setReviewMsg((e as Error).message);
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!product) return <p className="text-slate-600">Loading…</p>;

  const mrp = product.mrp ?? product.price;
  const discountAmount = Math.max(0, mrp - product.price);
  const discountPercent = mrp > product.price ? Math.round((discountAmount / mrp) * 100) : 0;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-6">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-10">
        <div className="lg:w-[60%]">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100">
            <img
              src={product.imageUrls[selectedImageIndex] ?? product.imageUrl}
              alt={`${product.name} image ${selectedImageIndex + 1}`}
              className="w-full object-cover"
            />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-4">
            {product.imageUrls.map((url, index) => (
              <button
                key={url + index}
                type="button"
                onClick={() => setSelectedImageIndex(index)}
                className={`overflow-hidden rounded-3xl border p-1 transition ${
                  selectedImageIndex === index ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200'
                }`}
              >
                <img src={url} alt={`Thumbnail ${index + 1}`} className="h-20 w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="inline-flex items-center rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                {product.category}
              </span>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                {Array.from({ length: 5 }, (_, idx) => (
                  <span key={idx} className={idx < Math.round(product.averageRating) ? 'text-amber-500' : 'text-slate-300'}>
                    ★
                  </span>
                ))}
                <span className="text-slate-700">{product.averageRating.toFixed(1)}</span>
                <span className="text-slate-500">({product.reviewCount} reviews)</span>
              </div>
            </div>

            <h1 className="mt-6 text-3xl font-semibold leading-tight text-slate-900 sm:text-[2rem] max-w-full break-words">
              {product.name}
            </h1>

            <div className="mt-5 flex flex-wrap items-baseline gap-4">
              <span className="text-3xl font-bold text-slate-900">₹{product.price.toFixed(2)}</span>
              {mrp > product.price && (
                <span className="text-sm text-slate-500 line-through">₹{mrp.toFixed(2)}</span>
              )}
              {discountAmount > 0 && (
                <span className="text-sm font-semibold uppercase tracking-[0.15em] text-emerald-600">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            <div className="mt-4 text-sm text-slate-700">
              {product.stock > 0 ? (
                <span className="font-medium text-emerald-600">In Stock ({product.stock} available)</span>
              ) : (
                <span className="font-medium text-rose-600">Out of stock</span>
              )}
            </div>

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={addToCart}
                disabled={product.stock < 1}
                className="min-h-[48px] w-full rounded-3xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add to Cart
              </button>
              <button
                type="button"
                onClick={toggleWishlist}
                disabled={wishlistLoading}
                className={`min-h-[48px] w-full rounded-3xl px-6 py-3 text-sm font-semibold transition ${
                  inWishlist ? 'bg-slate-900 text-white hover:bg-slate-800' : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                }`}
              >
                {inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              </button>
              <button
                type="button"
                onClick={buyNow}
                disabled={product.stock < 1}
                className="min-h-[48px] w-full rounded-3xl border border-indigo-600 bg-white px-6 py-3 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Buy Now
              </button>
            </div>

            {msg && <p className="mt-4 text-sm text-slate-600">{msg}</p>}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">Product details</p>
            <p className="mt-4 text-slate-700 leading-relaxed">{product.description}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap gap-2">
          {(['details', 'specs', 'reviews'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                selectedTab === tab
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab === 'details' ? 'Details' : tab === 'specs' ? 'Specifications' : 'Reviews'}
            </button>
          ))}
        </div>

        {selectedTab === 'details' && (
          <div className="mt-6 space-y-4 text-slate-700">
            <p>{product.description}</p>
          </div>
        )}

        {selectedTab === 'specs' && (
          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-full divide-y divide-slate-200 text-sm">
              <tbody className="divide-y divide-slate-200">
                {Object.entries(product.specifications).length > 0 ? (
                  Object.entries(product.specifications).map(([key, value]) => (
                    <tr key={key} className="odd:bg-slate-50">
                      <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-slate-700">{key}</th>
                      <td className="px-4 py-3 text-slate-600">{value}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-slate-500">
                      No specifications available for this product.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {selectedTab === 'reviews' && (
          <div className="mt-6 space-y-6">
            {product.reviews && product.reviews.length > 0 ? (
              <div className="space-y-4">
                {product.reviews.map((review, index) => (
                  <div key={index} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <UserAvatar name={review.name} size="sm" />
                      <div>
                        <p className="font-semibold text-slate-900">{review.name}</p>
                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: review.rating }, (_, i) => (
                            <span key={i}>★</span>
                          ))}
                          {Array.from({ length: 5 - review.rating }, (_, i) => (
                            <span key={i} className="text-slate-300">★</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-slate-700">{review.comment}</p>
                    <p className="mt-2 text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">No reviews yet. Be the first to share feedback.</p>
            )}

            {token ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <h3 className="text-base font-semibold text-slate-900">Write a review</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Rating</label>
                    <select
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="mt-2 w-32 rounded-xl border border-slate-300 bg-white px-3 py-2"
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>
                          {value} star{value > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Comment</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      className="mt-2 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={submitReview}
                    className="rounded-3xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Submit review
                  </button>
                  {reviewMsg && <p className="text-sm text-slate-600">{reviewMsg}</p>}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                <Link to="/login" className="font-semibold text-indigo-600">
                  Log in
                </Link>{' '}
                to submit a review.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-10">
        <RecommendationWidgets endpoint={`/api/recommendations/product/${encodeURIComponent(product.slug)}`} token={token} />
      </div>
    </div>
  );
}
