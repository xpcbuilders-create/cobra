import { Router } from 'express';
import mongoose from 'mongoose';
import { Cart } from '../models/Cart.js';
import { Coupon } from '../models/Coupon.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import {
  normalizeAddress,
  validatePaymentMethod,
  validateShippingAddress,
  type ShippingAddressInput,
} from '../lib/validateAddress.js';
import { createRazorpayOrder, verifyRazorpayPayment } from '../lib/razorpay.js';
import { createInvoicePdf } from '../lib/invoice.js';
import {
  sendOrderConfirmationEmail,
  sendPaymentSuccessEmail,
  sendShippingNotificationEmail,
  sendDeliveryNotificationEmail,
} from '../lib/email.js';
import { generateInvoicePDF, uploadInvoiceToCloud } from '../services/invoiceService.js';
import { sendInvoiceEmail } from '../services/emailService.js';

export function orderRoutes(requireAuth: ReturnType<typeof import('../middleware/auth.js').requireAuth>) {
  const r = Router();

  r.use(requireAuth);

  function normalizeCouponCode(code?: string) {
    return String(code ?? '').trim().toUpperCase();
  }

  function computeDiscountAmount(total: number, discountPercentage: number) {
    return Number((Math.max(0, Math.min(discountPercentage, 90)) * total / 100).toFixed(2));
  }

  async function resolveCoupon(couponCode?: string) {
    if (!couponCode) return null;
    const code = normalizeCouponCode(couponCode);
    const coupon = await Coupon.findOne({ code });
    if (!coupon) {
      throw new Error('Invalid coupon');
    }
    if (!coupon.active) {
      throw new Error('Coupon is not active');
    }
    if (coupon.expiryDate < new Date()) {
      throw new Error('Coupon has expired');
    }
    return coupon;
  }

  r.post('/', async (req, res) => {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const user = await User.findById(userId).lean();
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { shippingAddress, paymentMethod, couponCode, emiTenureMonths, emiInterestRate } = req.body as {
      shippingAddress?: ShippingAddressInput;
      paymentMethod?: string;
      couponCode?: string;
      emiTenureMonths?: number;
      emiInterestRate?: number;
    };

    const payErr = validatePaymentMethod(paymentMethod);
    if (payErr) {
      res.status(400).json({ error: payErr });
      return;
    }
    const addrErr = validateShippingAddress(shippingAddress);
    if (addrErr) {
      res.status(400).json({ error: addrErr });
      return;
    }

    const normalizedAddress = normalizeAddress(shippingAddress!);
    const orderStatus = 'Placed';

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const cart = await Cart.findOne({ user: userId }).session(session);
      if (!cart || cart.items.length === 0) {
        await session.abortTransaction();
        res.status(400).json({ error: 'Cart is empty' });
        return;
      }

      const lines: { product?: mongoose.Types.ObjectId; name: string; price: number; quantity: number }[] =
        [];
      let total = 0;

      for (const line of cart.items) {
        const product = await Product.findById(line.product).session(session);
        if (!product) {
          await session.abortTransaction();
          res.status(400).json({ error: `Product missing: ${line.product}` });
          return;
        }
        if (product.stock < line.quantity) {
          await session.abortTransaction();
          res.status(400).json({
            error: `Insufficient stock for ${product.name}`,
            productId: product._id.toString(),
            stock: product.stock,
          });
          return;
        }
        product.stock -= line.quantity;
        await product.save({ session });
        const itemTotal = product.price * line.quantity;
        total += itemTotal;
        lines.push({
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: line.quantity,
        });
      }

      const coupon = await resolveCoupon(couponCode).catch((err) => {
        throw new Error(err.message);
      });
      const discountPercentage = coupon?.discountPercentage ?? 0;
      const discountAmount = coupon ? computeDiscountAmount(total, discountPercentage) : 0;
      const discountedTotal = Math.max(0, Number((total - discountAmount).toFixed(2)));

      const [order] = await Order.create(
        [
          {
            user: new mongoose.Types.ObjectId(userId),
            items: lines,
            originalTotal: total,
            couponCode: coupon?.code ?? '',
            couponDiscountPercentage: discountPercentage,
            couponDiscountAmount: discountAmount,
            total: discountedTotal,
            status: orderStatus,
            paymentMethod,
            isEmi: paymentMethod === 'emi',
            emiDownPaymentAmount: paymentMethod === 'emi' ? Number((discountedTotal * 0.2).toFixed(2)) : 0,
            emiRemainingAmount: paymentMethod === 'emi' ? Number((discountedTotal - Number((discountedTotal * 0.2).toFixed(2))).toFixed(2)) : 0,
            emiTenureMonths: paymentMethod === 'emi' ? emiTenureMonths ?? 12 : 0,
            emiInterestRate: paymentMethod === 'emi' ? emiInterestRate ?? 0 : 0,
            shippingAddress: normalizedAddress,
          },
        ],
        { session }
      );

      await Cart.updateOne({ _id: cart._id }, { $set: { items: [] } }).session(session);

      await session.commitTransaction();

      res.status(201).json({
        order: {
          id: order._id.toString(),
          total: order.total,
          status: order.status,
          paymentMethod: order.paymentMethod,
          items: order.items,
          shippingAddress: order.shippingAddress,
          createdAt: order.createdAt,
        },
      });

      void sendOrderConfirmationEmail(user.email, user.name, {
        id: order._id.toString(),
        status: order.status,
        paymentMethod: order.paymentMethod,
        total: order.total,
        originalTotal: order.originalTotal,
        couponCode: order.couponCode,
        couponDiscountAmount: order.couponDiscountAmount,
        items: order.items,
        shippingAddress: order.shippingAddress ?? {},
      });

      // generate invoice PDF, upload to cloud and email asynchronously
      (async () => {
        try {
          if (!user.email) {
            console.warn('No customer email; skipping invoice email for order', order._id?.toString());
            return;
          }
          const pdfPath = await generateInvoicePDF(order, { name: user.name, email: user.email });
          try {
            const invoiceUrl = await uploadInvoiceToCloud(pdfPath, order).catch(() => '');
            if (invoiceUrl) {
              await Order.updateOne({ _id: order._id }, { $set: { invoiceUrl } });
            }
          } catch (err) {
            console.warn('Invoice upload failed, continuing to email with local attachment', err);
          }
          await sendInvoiceEmail(user.email, pdfPath, { ...order.toObject?.() ?? order, customerName: user.name });
          await Order.updateOne({ _id: order._id }, { $set: { invoiceSent: true } });
          console.log('Invoice emailed successfully');
        } catch (err) {
          console.error('Failed to generate or send invoice for order', order._id?.toString(), err);
        }
      })();
    } catch (e) {
      await session.abortTransaction();
      console.error(e);
      res.status(500).json({ error: 'Checkout failed' });
    } finally {
      session.endSession();
    }
  });

  r.post('/razorpay', async (req, res) => {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { shippingAddress, paymentMethod, couponCode, emiTenureMonths, emiInterestRate } = req.body as {
      shippingAddress?: ShippingAddressInput;
      paymentMethod?: string;
      couponCode?: string;
      emiTenureMonths?: number;
      emiInterestRate?: number;
    };

    const payErr = validatePaymentMethod(paymentMethod);
    if (payErr) {
      res.status(400).json({ error: payErr });
      return;
    }

    const addrErr = validateShippingAddress(shippingAddress);
    if (addrErr) {
      res.status(400).json({ error: addrErr });
      return;
    }

    const normalizedAddress = normalizeAddress(shippingAddress!);

    try {
      const user = await User.findById(userId).lean();
      const cart = await Cart.findOne({ user: userId });
      if (!cart || cart.items.length === 0) {
        res.status(400).json({ error: 'Cart is empty' });
        return;
      }

      const lines: { product?: mongoose.Types.ObjectId; name: string; price: number; quantity: number }[] = [];
      let total = 0;

      for (const line of cart.items) {
        const product = await Product.findById(line.product);
        if (!product) {
          res.status(400).json({ error: `Product missing: ${line.product}` });
          return;
        }
        if (product.stock < line.quantity) {
          res.status(400).json({
            error: `Insufficient stock for ${product.name}`,
            productId: product._id.toString(),
            stock: product.stock,
          });
          return;
        }
        const itemTotal = product.price * line.quantity;
        total += itemTotal;
        lines.push({
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: line.quantity,
        });
      }

      const coupon = await resolveCoupon(couponCode).catch((err) => {
        throw new Error(err.message);
      });
      const discountPercentage = coupon?.discountPercentage ?? 0;
      const discountAmount = coupon ? computeDiscountAmount(total, discountPercentage) : 0;
      const discountedTotal = Math.max(0, Number((total - discountAmount).toFixed(2)));

      const emiDownPaymentAmount = paymentMethod === 'emi' ? Number((discountedTotal * 0.2).toFixed(2)) : 0;
      const emiRemainingAmount = paymentMethod === 'emi' ? Number((discountedTotal - emiDownPaymentAmount).toFixed(2)) : 0;

      const tempOrder = await Order.create({
        user: new mongoose.Types.ObjectId(userId),
        items: lines,
        originalTotal: total,
        couponCode: coupon?.code ?? '',
        couponDiscountPercentage: discountPercentage,
        couponDiscountAmount: discountAmount,
        total: discountedTotal,
        status: 'Placed',
        paymentMethod,
        isEmi: paymentMethod === 'emi',
        emiDownPaymentAmount,
        emiRemainingAmount,
        emiTenureMonths: paymentMethod === 'emi' ? emiTenureMonths ?? 12 : 0,
        emiInterestRate: paymentMethod === 'emi' ? emiInterestRate ?? 0 : 0,
        shippingAddress: normalizedAddress,
      });

      const paymentAmount = paymentMethod === 'emi' ? emiDownPaymentAmount : discountedTotal;
      const razorpayOrder = await createRazorpayOrder(
        paymentAmount,
        tempOrder._id.toString(),
        user?.email ?? '',
        normalizedAddress.phone1 || ''
      );

      tempOrder.razorpayOrderId = razorpayOrder.id;
      await tempOrder.save();

      res.json({
        orderId: tempOrder._id.toString(),
        razorpayOrderId: razorpayOrder.id,
        amount: tempOrder.total,
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: (e as Error).message || 'Failed to create Razorpay order' });
    }
  });

  r.post('/verify-razorpay', async (req, res) => {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body as {
      orderId?: string;
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      razorpaySignature?: string;
    };

    const user = await User.findById(userId).lean();
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      res.status(400).json({ error: 'Missing payment details' });
      return;
    }

    if (!verifyRazorpayPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
      res.status(400).json({ error: 'Payment verification failed' });
      return;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const tempOrder = await Order.findById(orderId).session(session);
      if (!tempOrder || tempOrder.user.toString() !== userId) {
        await session.abortTransaction();
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      if (tempOrder.status !== 'Placed') {
        await session.abortTransaction();
        res.status(400).json({ error: 'Order is already processed' });
        return;
      }
      if (tempOrder.razorpayOrderId !== razorpayOrderId) {
        await session.abortTransaction();
        res.status(400).json({ error: 'Order mismatch' });
        return;
      }

      for (const item of tempOrder.items) {
        const product = await Product.findById(item.product).session(session);
        if (!product) {
          await session.abortTransaction();
          res.status(400).json({ error: `Product missing: ${item.product}` });
          return;
        }
        if (product.stock < item.quantity) {
          await session.abortTransaction();
          res.status(400).json({
            error: `Insufficient stock for ${product.name}`,
            productId: product._id.toString(),
            stock: product.stock,
          });
          return;
        }
        product.stock -= item.quantity;
        await product.save({ session });
      }

      tempOrder.status = tempOrder.paymentMethod === 'emi' ? 'Partially Paid' : 'Paid';
      tempOrder.razorpayPaymentId = razorpayPaymentId;
      await tempOrder.save({ session });

      await Cart.updateOne({ user: new mongoose.Types.ObjectId(userId) }, { $set: { items: [] } }).session(session);
      await session.commitTransaction();

      res.json({
        success: true,
        orderId: tempOrder._id.toString(),
      });

      void sendPaymentSuccessEmail(user.email, user.name, {
        id: tempOrder._id.toString(),
        status: tempOrder.status,
        paymentMethod: tempOrder.paymentMethod,
        total: tempOrder.total,
        originalTotal: tempOrder.originalTotal,
        couponCode: tempOrder.couponCode,
        couponDiscountAmount: tempOrder.couponDiscountAmount,
        items: tempOrder.items,
        shippingAddress: tempOrder.shippingAddress ?? {},
      });

      // If order is fully paid, generate and email invoice
      if (tempOrder.status === 'Paid') {
        (async () => {
          try {
            const customer = await User.findById(tempOrder.user).lean();
            if (!customer?.email) {
              console.warn('No customer email; skipping invoice for', tempOrder._id.toString());
              return;
            }
            const pdfPath = await generateInvoicePDF(tempOrder, { name: customer.name, email: customer.email });
            try {
              const invoiceUrl = await uploadInvoiceToCloud(pdfPath, tempOrder).catch(() => '');
              if (invoiceUrl) {
                await Order.updateOne({ _id: tempOrder._id }, { $set: { invoiceUrl } });
              }
            } catch (err) {
              console.warn('Invoice upload failed, continuing to email with local attachment', err);
            }
            await sendInvoiceEmail(customer.email, pdfPath, { ...tempOrder.toObject?.() ?? tempOrder, customerName: customer.name });
            await Order.updateOne({ _id: tempOrder._id }, { $set: { invoiceSent: true } });
            console.log('Invoice emailed successfully');
          } catch (err) {
            console.error('Failed to generate/send invoice for paid order', tempOrder._id.toString(), err);
          }
        })();
      }
    } catch (e) {
      await session.abortTransaction();
      console.error(e);
      res.status(500).json({ error: 'Payment verification failed' });
    } finally {
      session.endSession();
    }
  });

  r.post('/coupons/validate', async (req, res) => {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { couponCode } = req.body as { couponCode?: string };
    if (!couponCode || !couponCode.trim()) {
      res.status(400).json({ error: 'Coupon code is required' });
      return;
    }

    const coupon = await resolveCoupon(couponCode).catch((err) => {
      res.status(400).json({ error: err.message });
      return null;
    });
    if (!coupon) return;

    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      res.status(400).json({ error: 'Cart is empty' });
      return;
    }

    const originalTotal = cart.items.reduce((sum, line) => {
      const product = line.product as unknown as { price: number } | null;
      return sum + (product?.price ?? 0) * line.quantity;
    }, 0);

    const discountAmount = computeDiscountAmount(originalTotal, coupon.discountPercentage);
    const finalTotal = Math.max(0, Number((originalTotal - discountAmount).toFixed(2)));

    res.json({
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
      originalTotal,
      discountAmount,
      finalTotal,
      active: coupon.active,
      expiryDate: coupon.expiryDate.toISOString(),
    });
  });

  r.get('/my', async (req, res) => {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({
      orders: orders.map((o) => ({
        id: o._id.toString(),
        originalTotal: o.originalTotal,
        couponCode: o.couponCode,
        couponDiscountPercentage: o.couponDiscountPercentage,
        couponDiscountAmount: o.couponDiscountAmount,
        total: o.total,
        status: o.status,
        paymentMethod: o.paymentMethod,
        isEmi: o.isEmi,
        emiRemainingAmount: o.emiRemainingAmount,
        items: o.items,
        shippingAddress: o.shippingAddress,
        createdAt: o.createdAt,
      })),
    });
  });

  r.get('/:id/invoice', async (req, res) => {
    const userId = req.auth?.userId;
    const { id } = req.params;
    if (!userId || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid request' });
      return;
    }
    const order = await Order.findOne({ _id: id, user: userId }).lean();
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    // if invoice already uploaded to cloud, redirect to it
    if (order.invoiceUrl) {
      return res.redirect(order.invoiceUrl);
    }
    const customer = await User.findById(order.user).lean();
    const pdfBytes = await createInvoicePdf(order, { name: customer?.name, email: customer?.email });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${id}.pdf`);
    res.send(Buffer.from(pdfBytes));
  });

  r.get('/:id', async (req, res) => {
    const userId = req.auth?.userId;
    if (!userId || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: 'Invalid request' });
      return;
    }
    const order = await Order.findOne({
      _id: req.params.id,
      user: userId,
    }).lean();
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json({
      id: order._id.toString(),
      originalTotal: order.originalTotal,
      couponCode: order.couponCode,
      couponDiscountPercentage: order.couponDiscountPercentage,
      couponDiscountAmount: order.couponDiscountAmount,
      total: order.total,
      status: order.status,
      paymentMethod: order.paymentMethod,
      items: order.items,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt,
    });
  });

  return r;
}

export function adminOrderRoutes(requireAdmin: ReturnType<typeof import('../middleware/auth.js').requireAdmin>) {
  const r = Router();
  r.use(requireAdmin);

  r.get('/:id/invoice', async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid order ID' });
      return;
    }
    const order = await Order.findById(id).lean();
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    if (order.invoiceUrl) {
      return res.redirect(order.invoiceUrl);
    }
    const customer = await User.findById(order.user).lean();
    const pdfBytes = await createInvoicePdf(order, { name: customer?.name, email: customer?.email });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${id}.pdf`);
    res.send(Buffer.from(pdfBytes));
  });

  r.patch('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body as { status?: string };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid order ID' });
      return;
    }

    const validStatuses = ['Placed', 'Paid', 'Partially Paid', 'Confirmed', 'Packed', 'Shipped', 'Out For Delivery', 'Delivered', 'Cancelled'] as const;
    type OrderStatus = typeof validStatuses[number];
    if (!status || !validStatuses.includes(status as OrderStatus)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }
    const typedStatus = status as OrderStatus;

    const order = await Order.findById(id).populate('user', 'email name');
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const previousStatus = order.status;
    order.status = typedStatus;
    await order.save();

    const customer = order.user as { email?: string; name?: string } | null;
    if (customer?.email) {
      if (status === 'Shipped' && previousStatus !== 'Shipped') {
        void sendShippingNotificationEmail(customer.email, customer.name ?? 'Customer', {
          id: order._id.toString(),
          status: order.status,
          paymentMethod: order.paymentMethod,
          total: order.total,
          originalTotal: order.originalTotal,
          couponCode: order.couponCode,
          couponDiscountAmount: order.couponDiscountAmount,
          items: order.items,
          shippingAddress: order.shippingAddress ?? {},
        });
      }
      if (status === 'Delivered' && previousStatus !== 'Delivered') {
        void sendDeliveryNotificationEmail(customer.email, customer.name ?? 'Customer', {
          id: order._id.toString(),
          status: order.status,
          paymentMethod: order.paymentMethod,
          total: order.total,
          originalTotal: order.originalTotal,
          couponCode: order.couponCode,
          couponDiscountAmount: order.couponDiscountAmount,
          items: order.items,
          shippingAddress: order.shippingAddress ?? {},
        });
      }
      if (status === 'Paid' && previousStatus !== 'Paid') {
        (async () => {
          try {
            const pdfPath = await generateInvoicePDF(order, { name: customer.name, email: customer.email });
            try {
              const invoiceUrl = await uploadInvoiceToCloud(pdfPath, order).catch(() => '');
              if (invoiceUrl) {
                await Order.updateOne({ _id: order._id }, { $set: { invoiceUrl } });
              }
            } catch (err) {
              console.warn('Invoice upload failed, continuing to email with local attachment', err);
            }
            await sendInvoiceEmail(customer.email ?? '', pdfPath, { ...order.toObject?.() ?? order, customerName: customer.name });
            await Order.updateOne({ _id: order._id }, { $set: { invoiceSent: true } });
            console.log('Invoice emailed successfully');
          } catch (err) {
            console.error('Failed to generate/send invoice on status change for order', order._id.toString(), err);
          }
        })();
      }
    }

    res.json({
      id: order._id.toString(),
      total: order.total,
      status: order.status,
      paymentMethod: order.paymentMethod,
      items: order.items,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt,
    });
  });

  return r;
}
