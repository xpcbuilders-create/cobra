export type User = {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  token?: string;
};

export type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  emi: number;
  discount?: number;
  stock: number;
  imageUrl: string;
};

export type ProductDetail = ProductSummary & {
  imageUrls: string[];
  rating: number;
  reviewCount: number;
  features: string[];
};

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
};

export type EmiConfig = {
  interestRate: number;
  durations: number[];
};
