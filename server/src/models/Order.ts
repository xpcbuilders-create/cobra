import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [orderItemSchema], required: true },
    originalTotal: { type: Number, required: true, min: 0, default: 0 },
    couponCode: { type: String, trim: true, default: '' },
    couponDiscountPercentage: { type: Number, min: 0, max: 90, default: 0 },
    couponDiscountAmount: { type: Number, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: [
        'Placed',
        'Paid',
        'Partially Paid',
        'Confirmed',
        'Packed',
        'Shipped',
        'Out For Delivery',
        'Delivered',
        'Cancelled',
      ],
      default: 'Placed',
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'upi', 'card', 'netbanking', 'emi'],
      default: 'cod',
    },
    isEmi: { type: Boolean, default: false },
    emiDownPaymentAmount: { type: Number, min: 0, default: 0 },
    emiRemainingAmount: { type: Number, min: 0, default: 0 },
    emiTenureMonths: { type: Number, min: 0, default: 0 },
    emiInterestRate: { type: Number, min: 0, default: 0 },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    shippingAddress: {
      addressLine: { type: String, default: '' },
      street: { type: String, default: '' },
      landmark: { type: String, default: '' },
      phone1: { type: String, default: '' },
      phone2: { type: String, default: '' },
      district: { type: String, default: '' },
      pinCode: { type: String, default: '' },
      state: { type: String, default: 'Tamil Nadu' },
      // legacy fields
      line1: { type: String, default: '' },
      city: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: '' },
    },
    invoiceSent: { type: Boolean, default: false },
    invoiceNumber: { type: String, default: '' },
    invoiceUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);
