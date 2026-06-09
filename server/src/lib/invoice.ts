import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const TAX_RATE = 0.18;
const COMPANY_NAME = 'Ecommerce Shop';
const COMPANY_ADDRESS_LINES = [
  '123 Commerce Street',
  'Retail Park, Business District',
  'Tamil Nadu, India',
];

export async function createInvoicePdf(order: any, customer: { name?: string; email?: string } | null) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const normalFont = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const smallFont = await doc.embedFont(StandardFonts.HelveticaOblique);

  const lineHeight = 16;
  let y = height - 50;
  const leftMargin = 50;
  const rightMargin = 545;

  page.drawText('INVOICE', {
    x: leftMargin,
    y,
    size: 26,
    font: boldFont,
    color: rgb(0.12, 0.12, 0.44),
  });

  y -= 34;
  page.drawText(`Order #: ${order._id.toString()}`, {
    x: leftMargin,
    y,
    size: 12,
    font: normalFont,
  });
  page.drawText(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, {
    x: 380,
    y,
    size: 12,
    font: normalFont,
  });

  y -= 22;
  page.drawLine({
    start: { x: leftMargin, y },
    end: { x: rightMargin, y },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });

  y -= 24;
  page.drawText('Seller', { x: leftMargin, y, size: 12, font: boldFont });
  COMPANY_ADDRESS_LINES.forEach((line, index) => {
    page.drawText(line, { x: leftMargin, y: y - lineHeight * (index + 1), size: 10, font: normalFont, color: rgb(0.2, 0.2, 0.2) });
  });

  const customerY = y;
  page.drawText('Customer', { x: 330, y: customerY, size: 12, font: boldFont });
  const customerLines = [
    customer?.name ?? 'Customer',
    customer?.email ?? 'Email not available',
    '',
    'Delivery address:',
    order.shippingAddress?.addressLine ?? '',
    order.shippingAddress?.street ?? '',
    order.shippingAddress?.landmark ? `Landmark: ${order.shippingAddress.landmark}` : '',
    `${order.shippingAddress?.district ?? ''} – ${order.shippingAddress?.pinCode ?? ''}`,
    order.shippingAddress?.state ?? '',
    `Phone: ${order.shippingAddress?.phone1 ?? ''}${order.shippingAddress?.phone2 ? `, ${order.shippingAddress.phone2}` : ''}`,
  ].filter(Boolean);
  customerLines.forEach((line, index) => {
    page.drawText(line, {
      x: 330,
      y: customerY - lineHeight * (index + 1),
      size: 10,
      font: normalFont,
      color: rgb(0.2, 0.2, 0.2),
    });
  });

  y -= Math.max(customerLines.length + 2, 6) * lineHeight;
  y -= 14;

  page.drawText('Products', { x: leftMargin, y, size: 12, font: boldFont });
  y -= 20;
  page.drawText('Item', { x: leftMargin, y, size: 10, font: boldFont });
  page.drawText('Qty', { x: 340, y, size: 10, font: boldFont });
  page.drawText('Unit', { x: 390, y, size: 10, font: boldFont });
  page.drawText('Total', { x: 470, y, size: 10, font: boldFont });
  y -= 14;
  page.drawLine({ start: { x: leftMargin, y }, end: { x: rightMargin, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
  y -= 16;

  const itemStartY = y;
  order.items.forEach((item: any, index: number) => {
    const rowY = itemStartY - index * 18;
    page.drawText(item.name, { x: leftMargin, y: rowY, size: 10, font: normalFont });
    page.drawText(String(item.quantity), { x: 350, y: rowY, size: 10, font: normalFont });
    page.drawText(`₹${item.price.toFixed(2)}`, { x: 400, y: rowY, size: 10, font: normalFont });
    page.drawText(`₹${(item.price * item.quantity).toFixed(2)}`, { x: 470, y: rowY, size: 10, font: normalFont });
  });

  y = itemStartY - order.items.length * 18 - 24;
  page.drawLine({ start: { x: leftMargin, y }, end: { x: rightMargin, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
  y -= 18;

  const subtotal = Number(order.originalTotal?.toFixed?.(2) ?? 0);
  const discount = Number(order.couponDiscountAmount?.toFixed?.(2) ?? 0);
  const amountAfterDiscount = Math.max(0, subtotal - discount);
  const taxAmount = Number((amountAfterDiscount * TAX_RATE).toFixed(2));
  const invoiceTotal = Number((amountAfterDiscount + taxAmount).toFixed(2));
  const paidTotal = Number(order.total?.toFixed?.(2) ?? 0);

  const totals = [
    { label: 'Subtotal', value: subtotal },
    { label: 'Discount', value: -discount },
    { label: `Tax (${Math.round(TAX_RATE * 100)}%)`, value: taxAmount },
    { label: 'Invoice total', value: invoiceTotal },
    { label: 'Amount paid', value: paidTotal },
  ];

  totals.forEach((line, index) => {
    const rowY = y - index * 16;
    page.drawText(line.label, { x: 360, y: rowY, size: 10, font: line.label === 'Invoice total' ? boldFont : normalFont });
    page.drawText(`₹${line.value.toFixed(2)}`, { x: 470, y: rowY, size: 10, font: line.label === 'Invoice total' ? boldFont : normalFont });
  });

  y -= totals.length * 16 + 20;
  page.drawText(`Payment method: ${order.paymentMethod ?? 'N/A'}`, { x: leftMargin, y, size: 10, font: normalFont });
  y -= lineHeight;
  page.drawText(`Order status: ${order.status}`, { x: leftMargin, y, size: 10, font: normalFont });

  page.drawText('Thank you for your purchase!', { x: leftMargin, y: 60, size: 12, font: boldFont, color: rgb(0.1, 0.1, 0.44) });
  page.drawText('Please contact support for any questions about this invoice.', { x: leftMargin, y: 44, size: 9, font: smallFont, color: rgb(0.4, 0.4, 0.4) });

  return await doc.save();
}
