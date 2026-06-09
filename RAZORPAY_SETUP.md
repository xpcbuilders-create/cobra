# Razorpay Integration Setup

## Overview
This guide explains how to set up Razorpay payment integration for your e-commerce platform.

## Prerequisites
- Razorpay account (sign up at https://razorpay.com)
- API credentials from your Razorpay dashboard

## Step 1: Get Razorpay API Keys

1. Log in to your Razorpay Dashboard
2. Go to **Settings** → **API Keys**
3. Copy your **Key ID** and **Key Secret**

## Step 2: Configure Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```env
# Razorpay API Credentials
RAZORPAY_KEY_ID=your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
```

## Step 3: Payment Methods Supported

The following payment methods are now supported through Razorpay:
- **UPI** - Google Pay, PhonePe, Paytm, BHIM
- **Credit/Debit Cards** - Visa, Mastercard, RuPay
- **Net Banking** - All major Indian banks

Cash on Delivery (COD) is still available as a direct payment method without Razorpay.

## Step 4: Payment Flow

### For Razorpay Payments:
1. User selects a payment method (UPI, Card, or Net Banking) and fills the address
2. Frontend sends request to `POST /api/orders/razorpay`
3. Backend creates a temporary order and generates Razorpay order ID
4. Razorpay modal opens on the frontend
5. User completes payment
6. Frontend calls `POST /api/orders/verify-razorpay` with payment details
7. Backend verifies the signature and finalizes the order

### For Cash on Delivery:
1. User selects COD and fills the address
2. Frontend sends request to `POST /api/orders`
3. Order is created immediately with "pending" status

## Step 5: Testing

### Test Card Details (Razorpay Sandbox):
- **Card Number**: 4111111111111111
- **Expiry**: Any future date (e.g., 12/25)
- **CVV**: Any 3 digits (e.g., 123)
- **OTP**: 000000

### Test UPI Details:
- **UPI ID**: success@razorpay (for success)
- **UPI ID**: failure@razorpay (for failure)

## Security Notes

⚠️ **Important:**
- Never commit your `.env` file with real API keys
- Always keep `RAZORPAY_KEY_SECRET` private
- Use HTTPS in production
- Enable webhook verification for additional security
- Test thoroughly in sandbox mode before going live

## API Endpoints Added

### Create Razorpay Order
```
POST /api/orders/razorpay
Headers: Authorization: Bearer <token>
Body: {
  shippingAddress: ShippingAddress,
  paymentMethod: 'upi' | 'card' | 'netbanking'
}
Response: {
  orderId: string,
  razorpayOrderId: string,
  amount: number,
  keyId: string
}
```

### Verify Razorpay Payment
```
POST /api/orders/verify-razorpay
Headers: Authorization: Bearer <token>
Body: {
  orderId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
}
Response: {
  success: boolean,
  orderId: string
}
```

## Troubleshooting

### "Razorpay SDK not loaded"
- Ensure Razorpay script is loading from `https://checkout.razorpay.com/v1/checkout.js`
- Check browser console for CORS errors

### "Payment verification failed"
- Verify that `RAZORPAY_KEY_SECRET` is correctly set in `.env`
- Check that order amount matches

### Orders not being created
- Ensure cart has items
- Check product stock availability
- Verify shipping address is valid

## Production Deployment

1. Switch Razorpay to Live mode (not Sandbox)
2. Update environment variables with Live API keys
3. Update Razorpay script URL to production (already done in code)
4. Enable webhook verification
5. Set up order status updates via webhooks
6. Test end-to-end payment flow
