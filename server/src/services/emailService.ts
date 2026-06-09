import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';

const SMTP_HOST = process.env.SMTP_HOST ?? '';
const SMTP_PORT = Number(process.env.SMTP_PORT ?? '587');
const SMTP_SECURE = String(process.env.SMTP_SECURE ?? 'false').toLowerCase() === 'true';
const EMAIL_USER = process.env.EMAIL_USER ?? process.env.SMTP_USER ?? '';
const EMAIL_PASS = process.env.EMAIL_PASS ?? process.env.SMTP_PASS ?? '';
const SMTP_FROM = process.env.SMTP_FROM ?? EMAIL_USER;

function isConfigured() {
  return Boolean(SMTP_HOST && SMTP_PORT && EMAIL_USER && EMAIL_PASS);
}

async function createTransporter() {
  if (!isConfigured()) return null;
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
  try {
    await transporter.verify();
    return transporter;
  } catch (err) {
    console.error('SMTP verification failed', err);
    return null;
  }
}

export async function sendInvoiceEmail(customerEmail: string, pdfPath: string, order: any) {
  if (!customerEmail) throw new Error('Missing customer email');
  if (!isConfigured()) throw new Error('SMTP is not configured');

  const transporter = await createTransporter();
  if (!transporter) throw new Error('Could not create SMTP transporter');

  const subject = `Your Order Invoice - Order #${order._id.toString()}`;
  const text = `Dear ${order.customerName ?? 'Customer'},\n\nThank you for your purchase.\n\nYour invoice is attached as a PDF.\n\nOrder ID: ${order._id.toString()}\nTotal Amount: ₹${Number(order.total).toFixed(2)}\n\nThank you for shopping with us.`;

  const html = `<p>Dear ${order.customerName ?? 'Customer'},</p>
    <p>Thank you for your purchase.</p>
    <p>Your invoice is attached as a PDF.</p>
    <p><strong>Order ID:</strong> ${order._id.toString()}<br/><strong>Total Amount:</strong> ₹${Number(order.total).toFixed(2)}</p>
    <p>Thank you for shopping with us.</p>`;

  let attempt = 0;
  const maxAttempts = 3;
  const baseDelay = 500; // ms
  let lastErr: any = null;

  try {
    while (attempt < maxAttempts) {
      try {
        attempt += 1;
        await transporter.sendMail({
          from: SMTP_FROM,
          to: customerEmail,
          subject,
          text,
          html,
          attachments: [{ filename: path.basename(pdfPath), path: pdfPath }],
        });
        // success
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.warn(`Invoice email send attempt ${attempt} failed, retrying in ${delay}ms`, err);
        await new Promise((res) => setTimeout(res, delay));
      }
    }

    if (lastErr) {
      throw lastErr;
    }
  } finally {
    // always try to remove temporary file
    try {
      await fs.unlink(pdfPath);
    } catch (err) {
      // ignore
    }
  }
}

export default { sendInvoiceEmail };
