import nodemailer from 'nodemailer';
import { getOrCreateSiteSettings } from '../models/SiteSettings.js';

type EmailAddress = string;

type OrderEmailDetails = {
  id: string;
  status: string;
  paymentMethod: string;
  total: number;
  originalTotal: number;
  couponCode: string;
  couponDiscountAmount: number;
  items: Array<{ name: string; price: number; quantity: number }>;
  shippingAddress: {
    addressLine?: string;
    street?: string;
    landmark?: string;
    phone1?: string;
    phone2?: string;
    district?: string;
    pinCode?: string;
    state?: string;
    line1?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
};

type CustomiseRequestDetails = {
  name: string;
  email: string;
  details: string;
};

const smtpHost = process.env.SMTP_HOST ?? '';
const smtpPort = Number(process.env.SMTP_PORT ?? '587');
const smtpSecure = String(process.env.SMTP_SECURE ?? 'false').toLowerCase() === 'true';
const smtpUser = process.env.SMTP_USER ?? '';
const smtpPass = process.env.SMTP_PASS ?? '';
const smtpFrom = process.env.SMTP_FROM ?? '';
const supportEmail = process.env.SUPPORT_EMAIL ?? process.env.ADMIN_EMAIL ?? '';

function isSmtpConfigured() {
  return Boolean(smtpHost && smtpPort && smtpUser && smtpPass);
}

function formatMoney(value: number) {
  return `₹${value.toFixed(2)}`;
}

function renderOrderItems(items: OrderEmailDetails['items']) {
  return items
    .map(
      (item) =>
        `<tr><td style="padding:6px 8px;border:1px solid #e2e8f0">${item.name}</td><td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right">${item.quantity}</td><td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right">${formatMoney(
          item.price
        )}</td><td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right">${formatMoney(
          item.price * item.quantity
        )}</td></tr>`
    )
    .join('');
}

function formatAddress(address: OrderEmailDetails['shippingAddress']) {
  const lines = [
    address.addressLine,
    address.street,
    address.landmark,
    `${address.district || address.city || ''} ${address.pinCode || ''}`.trim(),
    `${address.state || ''}`.trim(),
    `${address.country || ''}`.trim(),
  ]
    .filter(Boolean)
    .map((line) => `<div>${line}</div>`)
    .join('');
  const phones = [address.phone1, address.phone2].filter(Boolean).join(', ');
  return `${lines}${phones ? `<div>Phone: ${phones}</div>` : ''}`;
}

async function createTransporter() {
  if (!isSmtpConfigured()) {
    return null;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  try {
    await transporter.verify();
    return transporter;
  } catch (error) {
    console.error('SMTP transporter verification failed:', error);
    return null;
  }
}

function getFromAddress(siteName: string, senderEmail?: string) {
  const email = senderEmail?.trim() || smtpFrom || supportEmail || `no-reply@localhost`;
  return `${siteName} <${email}>`;
}

async function sendMessage(to: EmailAddress, subject: string, html: string, text: string) {
  if (!isSmtpConfigured()) {
    console.warn('SMTP is not configured. Skipping email delivery.', { to, subject });
    return;
  }

  const transporter = await createTransporter();
  if (!transporter) {
    console.warn('Could not create SMTP transporter. Skipping email delivery.', { to, subject });
    return;
  }

  return transporter.sendMail({
    from: subject.includes('Welcome') ? smtpFrom || supportEmail || 'no-reply@localhost' : smtpFrom || supportEmail || 'no-reply@localhost',
    to,
    subject,
    text,
    html,
  });
}

function buildBaseHtml(title: string, bodyContent: string, shopName: string) {
  return `
    <div style="font-family:Arial,sans-serif;color:#1f2937;line-height:1.5;max-width:680px;margin:0 auto;padding:24px;">
      <div style="border-bottom:1px solid #e2e8f0;padding-bottom:16px;margin-bottom:24px;">
        <h1 style="margin:0;font-size:28px;color:#111827">${title}</h1>
        <p style="margin:8px 0 0;color:#475569;">${shopName}</p>
      </div>
      <div style="font-size:16px;color:#334155;">${bodyContent}</div>
      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0;color:#616e7c;font-size:14px;">
        <p>If you have questions, feel free to reply to this email.</p>
        <p>${shopName} Team</p>
      </div>
    </div>
  `;
}

async function sendTemplateEmail(
  to: EmailAddress,
  subject: string,
  bodyContent: string,
  shopName: string,
  senderEmail?: string
) {
  const html = buildBaseHtml(subject, bodyContent, shopName);
  const text = bodyContent.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
  const from = getFromAddress(shopName, senderEmail);

  if (!isSmtpConfigured()) {
    console.warn('SMTP not configured. Email would be sent from:', from);
    return;
  }

  const transporter = await createTransporter();
  if (!transporter) {
    return;
  }

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendCustomiseProductRequestEmail(
  to: EmailAddress,
  request: CustomiseRequestDetails
) {
  const siteSettings = await getOrCreateSiteSettings();
  const shopName = siteSettings.shopName || 'Our store';
  const senderEmail = siteSettings.senderEmail || undefined;
  const subject = `New customise product request from ${request.name}`;
  const safeName = escapeHtml(request.name);
  const safeEmail = escapeHtml(request.email);
  const safeDetails = escapeHtml(request.details).replace(/\n/g, '<br />');
  const body = `
    <p>A customer submitted a customise product request.</p>
    <div style="margin-top:16px;padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Request details:</strong></p>
      <p>${safeDetails}</p>
    </div>
  `;
  const html = buildBaseHtml('New customise product request', body, shopName);
  const text = [
    'A customer submitted a customise product request.',
    `Name: ${request.name}`,
    `Email: ${request.email}`,
    'Request details:',
    request.details,
  ].join('\n\n');
  const from = getFromAddress(shopName, senderEmail);

  if (!isSmtpConfigured()) {
    console.warn('SMTP not configured. Customise request email was not sent.', { to, subject });
    return false;
  }

  const transporter = await createTransporter();
  if (!transporter) {
    return false;
  }

  await transporter.sendMail({
    from,
    to,
    replyTo: request.email,
    subject,
    text,
    html,
  });
  return true;
}

export async function sendWelcomeEmail(userEmail: string, userName: string) {
  try {
    const siteSettings = await getOrCreateSiteSettings();
    const shopName = siteSettings.shopName || 'Our store';
    const senderEmail = siteSettings.senderEmail || undefined;
    const subject = `Welcome to ${shopName}!`;
    const body = `
      <p>Hi ${userName || 'there'},</p>
      <p>Thanks for creating an account at ${shopName}. We&apos;re excited to help you shop smarter and enjoy our curated products.</p>
      <p>Start exploring the store and let us know if you need help with any order.</p>
    `;
    await sendTemplateEmail(userEmail, subject, body, shopName, senderEmail);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}

export async function sendResetPasswordEmail(userEmail: string, userName: string, resetUrl: string) {
  try {
    const siteSettings = await getOrCreateSiteSettings();
    const shopName = siteSettings.shopName || 'Our store';
    const senderEmail = siteSettings.senderEmail || undefined;
    const subject = `Reset your ${shopName} password`;
    const body = `
      <p>Hi ${userName || 'there'},</p>
      <p>We received a request to reset your password. Click the link below to set a new password:</p>
      <p><a href="${resetUrl}" style="color:#2563eb;">Reset your password</a></p>
      <p>If you didn&apos;t request a password reset, you can ignore this email.</p>
    `;
    await sendTemplateEmail(userEmail, subject, body, shopName, senderEmail);
  } catch (error) {
    console.error('Failed to send reset password email:', error);
  }
}

export async function sendOrderConfirmationEmail(userEmail: string, userName: string, order: OrderEmailDetails) {
  try {
    const siteSettings = await getOrCreateSiteSettings();
    const shopName = siteSettings.shopName || 'Our store';
    const senderEmail = siteSettings.senderEmail || undefined;
    const subject = `Order confirmed: ${order.id}`;
    const body = `
      <p>Hi ${userName || 'there'},</p>
      <p>Thanks for your order. We have confirmed it and are getting it ready for shipment.</p>
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Status:</strong> ${order.status}</p>
      <p><strong>Payment method:</strong> ${order.paymentMethod}</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px;border:1px solid #e2e8f0;">Item</th>
            <th style="text-align:right;padding:8px;border:1px solid #e2e8f0;">Qty</th>
            <th style="text-align:right;padding:8px;border:1px solid #e2e8f0;">Price</th>
            <th style="text-align:right;padding:8px;border:1px solid #e2e8f0;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${renderOrderItems(order.items)}
        </tbody>
      </table>
      <div style="margin-top:16px;">
        <p><strong>Subtotal:</strong> ${formatMoney(order.originalTotal)}</p>
        <p><strong>Coupon:</strong> ${order.couponCode || 'None'}</p>
        <p><strong>Discount:</strong> ${formatMoney(order.couponDiscountAmount)}</p>
        <p><strong>Order total:</strong> ${formatMoney(order.total)}</p>
      </div>
      <div style="margin-top:16px;">
        <p><strong>Shipping address:</strong></p>
        ${formatAddress(order.shippingAddress)}
      </div>
    `;
    await sendTemplateEmail(userEmail, subject, body, shopName, senderEmail);
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
  }
}

export async function sendPaymentSuccessEmail(userEmail: string, userName: string, order: OrderEmailDetails) {
  try {
    const siteSettings = await getOrCreateSiteSettings();
    const shopName = siteSettings.shopName || 'Our store';
    const senderEmail = siteSettings.senderEmail || undefined;
    const subject = `Payment received for order ${order.id}`;
    const body = `
      <p>Hi ${userName || 'there'},</p>
      <p>We have successfully received your payment for order <strong>${order.id}</strong>.</p>
      <p><strong>Payment method:</strong> ${order.paymentMethod}</p>
      <p><strong>Order total:</strong> ${formatMoney(order.total)}</p>
      <p>Your order is now being processed and will be shipped soon.</p>
    `;
    await sendTemplateEmail(userEmail, subject, body, shopName, senderEmail);
  } catch (error) {
    console.error('Failed to send payment success email:', error);
  }
}

export async function sendShippingNotificationEmail(userEmail: string, userName: string, order: OrderEmailDetails) {
  try {
    const siteSettings = await getOrCreateSiteSettings();
    const shopName = siteSettings.shopName || 'Our store';
    const senderEmail = siteSettings.senderEmail || undefined;
    const subject = `Your order ${order.id} has shipped`;
    const body = `
      <p>Hi ${userName || 'there'},</p>
      <p>Great news: your order <strong>${order.id}</strong> has shipped.</p>
      <p>We&apos;ll update you when it is out for delivery.</p>
      <div style="margin-top:16px;">
        <p><strong>Shipping address:</strong></p>
        ${formatAddress(order.shippingAddress)}
      </div>
    `;
    await sendTemplateEmail(userEmail, subject, body, shopName, senderEmail);
  } catch (error) {
    console.error('Failed to send shipping notification email:', error);
  }
}

export async function sendDeliveryNotificationEmail(userEmail: string, userName: string, order: OrderEmailDetails) {
  try {
    const siteSettings = await getOrCreateSiteSettings();
    const shopName = siteSettings.shopName || 'Our store';
    const senderEmail = siteSettings.senderEmail || undefined;
    const subject = `Your order ${order.id} is delivered`;
    const body = `
      <p>Hi ${userName || 'there'},</p>
      <p>Your order <strong>${order.id}</strong> has been delivered. We hope you enjoy your purchase!</p>
      <p>If you have any questions, reply to this email.</p>
    `;
    await sendTemplateEmail(userEmail, subject, body, shopName, senderEmail);
  } catch (error) {
    console.error('Failed to send delivery notification email:', error);
  }
}
