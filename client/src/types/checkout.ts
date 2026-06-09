export type ShippingAddress = {
  addressLine: string;
  street: string;
  landmark: string;
  phone1: string;
  phone2: string;
  district: string;
  pinCode: string;
  state: string;
};

export type PaymentMethod = 'cod' | 'upi' | 'card' | 'netbanking' | 'emi';

export const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; hint: string }[] = [
  { id: 'cod', label: 'Cash on Delivery (COD)', hint: 'Pay when your order is delivered' },
  { id: 'upi', label: 'UPI', hint: 'GPay, PhonePe, Paytm, etc.' },
  { id: 'card', label: 'Debit / Credit Card', hint: 'Visa, Mastercard, RuPay' },
  { id: 'netbanking', label: 'Net Banking', hint: 'All major banks' },
  { id: 'emi', label: 'EMI (20% downpayment)', hint: 'Pay 20% now, finance the rest with EMI' },
];

export const emptyAddress = (): ShippingAddress => ({
  addressLine: '',
  street: '',
  landmark: '',
  phone1: '',
  phone2: '',
  district: '',
  pinCode: '',
  state: 'Tamil Nadu',
});
