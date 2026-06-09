import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { createInvoicePdf } from '../lib/invoice.js';
import cloudinary from '../config/cloudinary.js';
import { Order } from '../models/Order.js';

export async function generateInvoicePDF(order: any, customer: { name?: string; email?: string } | null) {
  try {
    // ensure invoiceNumber
    if (!order.invoiceNumber) {
      const formatted = formatInvoiceNumber(order);
      try {
        await Order.updateOne({ _id: order._id }, { $set: { invoiceNumber: formatted } });
        order.invoiceNumber = formatted;
      } catch (err) {
        // ignore update failure
        console.warn('Could not save invoiceNumber on order', order._id?.toString(), err);
      }
    }

    const pdfBytes = await createInvoicePdf(order, customer);
    const tmpDir = os.tmpdir();
    const fileName = `invoice-${order._id.toString()}-${Date.now()}.pdf`;
    const filePath = path.join(tmpDir, fileName);
    await fs.writeFile(filePath, Buffer.from(pdfBytes));
    return filePath;
  } catch (err) {
    throw new Error(`Failed to generate invoice PDF: ${(err as Error).message}`);
  }
}

export async function removeTempFile(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    // ignore
  }
}

export function formatInvoiceNumber(order: any) {
  const d = order.createdAt ? new Date(order.createdAt) : new Date();
  const YYYY = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const DD = String(d.getDate()).padStart(2, '0');
  const suffix = String(order._id?.toString().slice(-6) ?? Date.now()).toUpperCase();
  return `INV-${YYYY}${MM}${DD}-${suffix}`;
}

export async function uploadInvoiceToCloud(filePath: string, order: any) {
  if (!cloudinary.config().cloud_name) {
    throw new Error('Cloudinary is not configured');
  }
  const publicId = `invoices/invoice-${order._id.toString()}-${Date.now()}`;
  try {
    const result = await cloudinary.uploader.upload(filePath, { resource_type: 'raw', public_id: publicId, folder: 'invoices' });
    return result.secure_url as string;
  } catch (err) {
    throw new Error(`Cloud upload failed: ${(err as Error).message}`);
  }
}

export default { generateInvoicePDF, removeTempFile, formatInvoiceNumber, uploadInvoiceToCloud };
