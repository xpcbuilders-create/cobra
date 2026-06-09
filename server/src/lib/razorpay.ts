import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function createRazorpayOrder(amount: number, orderId: string, customerEmail: string, customerPhone: string) {
  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: orderId,
      notes: {
        orderId,
      },
    });
    return order;
  } catch (error) {
    throw new Error(`Failed to create Razorpay order: ${(error as Error).message}`);
  }
}

export function verifyRazorpayPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET || '';
  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expectedSignature === razorpaySignature;
}

export async function captureRazorpayPayment(paymentId: string, amount: number) {
  try {
    const payment = await razorpay.payments.capture(paymentId, Math.round(amount * 100), 'INR');
    return payment;
  } catch (error) {
    throw new Error(`Failed to capture Razorpay payment: ${(error as Error).message}`);
  }
}

export { razorpay };
