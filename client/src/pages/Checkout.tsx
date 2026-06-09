import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../api';
import type { CartLine, CouponValidationResult } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  emptyAddress,
  PAYMENT_OPTIONS,
  type PaymentMethod,
  type ShippingAddress,
} from '../types/checkout';

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay?: {
      new (options: Record<string, unknown>): {
        open(): void;
      };
    };
  }
}

interface CheckoutLocationState {
  paymentMethod?: PaymentMethod;
  selectedEmiTenure?: number;
}

export function Checkout() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [address, setAddress] = useState<ShippingAddress>(emptyAddress);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [error, setError] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState<CouponValidationResult | null>(null);
  const [cartItems, setCartItems] = useState<CartLine[]>([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [selectedEmiTenure, setSelectedEmiTenure] = useState(12);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    setCartLoading(true);
    apiGet<{ items: CartLine[] }>('/api/cart', token)
      .then((data) => {
        setCartItems(data.items);
        if (data.items.length > 0) {
          const locationState = location.state as CheckoutLocationState | null;
          const defaultTenure = data.items[0].emiOptions?.[0]?.tenure ?? 12;
          setSelectedEmiTenure(locationState?.selectedEmiTenure ?? defaultTenure);
          if (locationState?.paymentMethod) {
            setPaymentMethod(locationState.paymentMethod);
          }
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setCartLoading(false);
      });
  }, [token, location.state]);

  const locationState = location.state as CheckoutLocationState | null;
  const isProductEmiCheckout = locationState?.paymentMethod === 'emi';

  function setField<K extends keyof ShippingAddress>(key: K, value: ShippingAddress[K]) {
    setAddress((a) => ({ ...a, [key]: value }));
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError('Location is not supported on this device.');
      return;
    }
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = (await res.json()) as { display_name?: string; address?: Record<string, string> };
          const a = data.address;
          setField(
            'addressLine',
            a?.house_number
              ? `${a.house_number} ${a.road ?? ''}`.trim()
              : data.display_name?.split(',')[0] ?? `Near ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          );
          if (a?.road) setField('street', a.road);
          if (a?.suburb || a?.neighbourhood) setField('landmark', a.suburb ?? a.neighbourhood ?? '');
          if (a?.state_district || a?.city || a?.town) {
            setField('district', a.state_district ?? a.city ?? a.town ?? '');
          }
          if (a?.postcode) setField('pinCode', a.postcode.replace(/\D/g, '').slice(0, 6));
        } catch {
          setField('addressLine', `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
      },
      () => setError('Could not get your location. Allow location access or enter address manually.')
    );
  }

  function setCouponCodeField(value: string) {
    const normalized = value.toUpperCase();
    setCouponCode(normalized);
    setCouponError(null);
    setCouponMessage(null);
    if (couponResult?.code !== normalized) {
      setCouponResult(null);
    }
  }

  async function applyCoupon() {
    if (!token) return;
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError('Enter a coupon code.');
      return;
    }

    setApplyingCoupon(true);
    setCouponError(null);
    setCouponMessage(null);

    try {
      const result = await apiPost<CouponValidationResult>('/api/coupons/validate', { couponCode: code }, token);
      setCouponResult(result);
      setCouponMessage(`Coupon ${result.code} applied. You saved ₹${result.discountAmount.toFixed(2)}.`);
    } catch (err) {
      setCouponResult(null);
      setCouponError((err as Error).message);
    } finally {
      setApplyingCoupon(false);
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasUnavailableItems = cartItems.some((item) => item.stock === 0 || item.quantity > item.stock);
  const discountAmount = couponResult?.discountAmount ?? 0;
  const finalTotal = couponResult?.finalTotal ?? subtotal;
  const emiDownPaymentAmount = paymentMethod === 'emi' ? Number((finalTotal * 0.2).toFixed(2)) : 0;
  const emiRemainingAmount = paymentMethod === 'emi' ? Number((finalTotal - emiDownPaymentAmount).toFixed(2)) : 0;
  const cartEmiOptions = cartItems[0]?.emiOptions ?? [];
  const selectedEmiOption = cartEmiOptions.find((option) => option.tenure === selectedEmiTenure) ?? cartEmiOptions[0];
  const emiInterestRate = paymentMethod === 'emi' ? selectedEmiOption?.interest ?? 13.5 : 0;
  const emiTenureMonths = paymentMethod === 'emi' ? selectedEmiOption?.tenure ?? 12 : 0;
  const emiPrincipal = emiRemainingAmount;
  const emiMonthly = emiPrincipal && emiTenureMonths > 0
    ? (emiPrincipal * (emiInterestRate / 100 / 12) * Math.pow(1 + emiInterestRate / 100 / 12, emiTenureMonths)) /
      (Math.pow(1 + emiInterestRate / 100 / 12, emiTenureMonths) - 1)
    : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      if (cartItems.length === 0) {
        setError('Your cart is empty.');
        setLoading(false);
        return;
      }

      const orderPayload = {
        shippingAddress: address,
        paymentMethod,
        couponCode: couponResult?.code ?? undefined,
        emiTenureMonths: paymentMethod === 'emi' ? emiTenureMonths : undefined,
        emiInterestRate: paymentMethod === 'emi' ? emiInterestRate : undefined,
      };

      if (paymentMethod === 'cod') {
        // Direct order creation for COD
        await apiPost('/api/orders', orderPayload, token);
        navigate('/orders');
      } else {
        // Razorpay payment flow
        await handleRazorpayPayment(orderPayload);
      }
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  async function handleRazorpayPayment(orderPayload: { shippingAddress: ShippingAddress; paymentMethod: PaymentMethod; couponCode?: string; emiTenureMonths?: number; emiInterestRate?: number }) {
    try {
      const orderResponse = await apiPost<{
        orderId: string;
        razorpayOrderId: string;
        amount: number;
        keyId: string;
      }>(
        '/api/orders/razorpay',
        orderPayload,
        token!
      );

      const { orderId, razorpayOrderId, amount, keyId } = orderResponse;

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded');
      }

      const razorpayInstance = new window.Razorpay({
        key: keyId,
        amount: Math.round(amount * 100),
        currency: 'INR',
        name: 'Shop',
        order_id: razorpayOrderId,
        description: 'Payment for order ' + orderId,
        prefill: {
          name: user?.name ?? undefined,
          email: user?.email ?? undefined,
          contact: address.phone1,
        },
        handler: async (response: RazorpayResponse) => {
          try {
            await apiPost(
              '/api/orders/verify-razorpay',
              {
                orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
              token!
            );
            navigate(`/payment-success?orderId=${encodeURIComponent(orderId)}`);
          } catch (err) {
            const message = (err as Error).message || 'Payment verification failed.';
            navigate(`/payment-failure?reason=${encodeURIComponent(message)}`);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            navigate('/payment-failure?reason=payment%20cancelled');
            setLoading(false);
          },
        },
        theme: {
          color: '#4f46e5',
        },
      });

      razorpayInstance.open();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600">Sign in to checkout.</p>
        <Link to="/login" className="mt-4 inline-block text-indigo-600">
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-3xl font-bold text-slate-900">Checkout</h1>

      <form onSubmit={submit} className="space-y-8">
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Delivery address</h2>
          <p className="text-sm font-medium text-amber-800">
            We deliver only within Tamil Nadu. All fields below are required.
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Address line <span className="text-red-500">*</span>
              <input
                required
                value={address.addressLine}
                onChange={(e) => setField('addressLine', e.target.value)}
                placeholder="House / flat / building no."
                className={inputClass}
              />
            </label>
            <button
              type="button"
              onClick={useCurrentLocation}
              className="mt-2 text-sm font-medium text-indigo-600 hover:underline"
            >
              Use my current location
            </button>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Street <span className="text-red-500">*</span>
            <input
              required
              value={address.street}
              onChange={(e) => setField('street', e.target.value)}
              placeholder="Street name, area"
              className={inputClass}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Landmark <span className="text-red-500">*</span>
            <input
              required
              value={address.landmark}
              onChange={(e) => setField('landmark', e.target.value)}
              placeholder="Near school, temple, shop, etc."
              className={inputClass}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Phone number 1 <span className="text-red-500">*</span>
              <input
                required
                type="tel"
                inputMode="numeric"
                pattern="[6-9][0-9]{9}"
                maxLength={10}
                value={address.phone1}
                onChange={(e) => setField('phone1', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile"
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Phone number 2 <span className="text-red-500">*</span>
              <input
                required
                type="tel"
                inputMode="numeric"
                pattern="[6-9][0-9]{9}"
                maxLength={10}
                value={address.phone2}
                onChange={(e) => setField('phone2', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Alternate mobile"
                className={inputClass}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              District <span className="text-red-500">*</span>
              <input
                required
                value={address.district}
                onChange={(e) => setField('district', e.target.value)}
                placeholder="e.g. Chennai, Coimbatore"
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              PIN code <span className="text-red-500">*</span>
              <input
                required
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={address.pinCode}
                onChange={(e) => setField('pinCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6 digits"
                className={inputClass}
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            State
            <input
              readOnly
              value={address.state}
              className={`${inputClass} bg-slate-50 text-slate-600`}
            />
          </label>
          <p className="text-xs text-slate-500">Only Tamil Nadu</p>
        </section>

        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Payment method</h2>
          {isProductEmiCheckout ? (
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-emerald-900">EMI checkout</p>
              <p className="mt-2">
                Your EMI order is preselected. You will pay the 20% downpayment now using credit/debit card via Razorpay.
              </p>
              <p className="mt-2 text-slate-600">
                After payment, the remaining amount will be financed according to your selected EMI plan.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {PAYMENT_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition ${
                    paymentMethod === opt.id
                      ? opt.id === 'emi'
                        ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                        : 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={opt.id}
                    checked={paymentMethod === opt.id}
                    onChange={() => setPaymentMethod(opt.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className={`font-medium ${opt.id === 'emi' ? 'text-emerald-900' : 'text-slate-900'}`}>
                      {opt.label}
                    </span>
                    <span className="mt-0.5 block text-sm text-slate-500">{opt.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
          {paymentMethod !== 'cod' && (
            <p className="text-sm text-slate-600">
              Your payment will be processed securely through Razorpay. All transactions are encrypted and safe.
            </p>
          )}

          {paymentMethod === 'emi' && cartEmiOptions.length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Choose an EMI plan</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {cartEmiOptions.map((option) => (
                  <button
                    key={option.tenure}
                    type="button"
                    onClick={() => setSelectedEmiTenure(option.tenure)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      selectedEmiTenure === option.tenure
                        ? 'border-emerald-500 bg-emerald-100 text-slate-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option.tenure}-month</span>
                      <span className="text-sm text-slate-500">{option.interest}% interest</span>
                    </div>
                    <p className="mt-1 text-lg font-semibold text-slate-900">₹{option.monthlyEmi.toFixed(2)}/month</p>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-slate-600">
                Pay 20% now and finance the remaining amount. Your selected plan shows the estimated monthly EMI.
              </p>
            </div>
          )}

          {paymentMethod === 'emi' && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">EMI plan details</p>
              <p className="mt-2">
                20% downpayment is due now before delivery: <strong>₹{emiDownPaymentAmount.toFixed(2)}</strong>.
              </p>
              <p>
                Remaining amount to finance: <strong>₹{emiRemainingAmount.toFixed(2)}</strong>.
              </p>
              <p>
                Estimated monthly EMI for {emiTenureMonths} months: <strong>₹{emiMonthly.toFixed(2)}</strong> at {emiInterestRate}% p.a.
              </p>
              <p className="mt-2 text-xs text-slate-600">
                Select EMI and complete the 20% downpayment now. Your order will be reserved and the remaining amount will be financed.
              </p>
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Coupon</h2>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              value={couponCode}
              onChange={(e) => setCouponCodeField(e.target.value)}
              placeholder="Enter coupon code"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            <button
              type="button"
              onClick={applyCoupon}
              disabled={!couponCode.trim() || applyingCoupon || cartLoading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {applyingCoupon ? 'Applying…' : 'Apply coupon'}
            </button>
          </div>
          {couponMessage && <p className="text-sm text-green-600">{couponMessage}</p>}
          {couponError && <p className="text-sm text-red-600">{couponError}</p>}
        </section>

        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Order summary</h2>
          <div className="space-y-3 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span>Original total</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Discount</span>
              <span>-₹{discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
              <span>Final payable amount</span>
              <span>₹{finalTotal.toFixed(2)}</span>
            </div>
            {paymentMethod === 'emi' && (
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Down payment due now (20%)</span>
                  <span>₹{emiDownPaymentAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Remaining amount to finance</span>
                  <span>₹{emiRemainingAmount.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {hasUnavailableItems && (
          <p className="text-sm text-rose-600">
            Some cart items are unavailable or exceed current stock. Update your cart before placing the order.
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || hasUnavailableItems}
          className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? 'Processing…'
            : paymentMethod === 'emi'
            ? `Pay ₹${emiDownPaymentAmount.toFixed(2)} with credit/debit card`
            : paymentMethod === 'card'
            ? 'Pay with credit/debit card'
            : paymentMethod === 'upi'
            ? 'Pay with UPI'
            : paymentMethod === 'netbanking'
            ? 'Pay with net banking'
            : 'Place order'}
        </button>
      </form>
    </div>
  );
}
