export type ShippingAddressInput = {
  addressLine?: string;
  street?: string;
  landmark?: string;
  phone1?: string;
  phone2?: string;
  district?: string;
  pinCode?: string;
  state?: string;
};

const PAYMENT_METHODS = ['cod', 'upi', 'card', 'netbanking', 'emi'] as const;

export function validatePaymentMethod(method?: string): string | null {
  if (!method || !PAYMENT_METHODS.includes(method as (typeof PAYMENT_METHODS)[number])) {
    return 'Select a valid payment method';
  }
  return null;
}

export function validateShippingAddress(addr?: ShippingAddressInput): string | null {
  if (!addr) return 'Shipping address is required';
  const required: [keyof ShippingAddressInput, string][] = [
    ['addressLine', 'Address line'],
    ['street', 'Street'],
    ['landmark', 'Landmark'],
    ['phone1', 'Phone number 1'],
    ['phone2', 'Phone number 2'],
    ['district', 'District'],
    ['pinCode', 'PIN code'],
  ];
  for (const [key, label] of required) {
    const v = addr[key]?.trim();
    if (!v) return `${label} is required`;
  }
  const pin = addr.pinCode!.trim();
  if (!/^\d{6}$/.test(pin)) return 'PIN code must be 6 digits';
  const phoneRe = /^[6-9]\d{9}$/;
  if (!phoneRe.test(addr.phone1!.replace(/\D/g, '').slice(-10))) {
    return 'Phone number 1 must be a valid 10-digit Indian mobile number';
  }
  if (!phoneRe.test(addr.phone2!.replace(/\D/g, '').slice(-10))) {
    return 'Phone number 2 must be a valid 10-digit Indian mobile number';
  }
  const state = (addr.state ?? 'Tamil Nadu').trim();
  if (state.toLowerCase() !== 'tamil nadu' && state.toLowerCase() !== 'tamilnadu') {
    return 'We deliver only within Tamil Nadu';
  }
  return null;
}

export function normalizeAddress(addr: ShippingAddressInput) {
  return {
    addressLine: addr.addressLine!.trim(),
    street: addr.street!.trim(),
    landmark: addr.landmark!.trim(),
    phone1: addr.phone1!.replace(/\D/g, '').slice(-10),
    phone2: addr.phone2!.replace(/\D/g, '').slice(-10),
    district: addr.district!.trim(),
    pinCode: addr.pinCode!.trim(),
    state: 'Tamil Nadu',
  };
}
