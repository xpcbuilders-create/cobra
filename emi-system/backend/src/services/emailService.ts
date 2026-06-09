import nodemailer from 'nodemailer';
import type { EmiApplication } from '../models/EmiApplication';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

export async function sendAdminNotification(app: any) {
  const adminEmail = process.env.ADMIN_EMAIL || 'xpcbuilders@gmail.com';
  await transporter.sendMail({
    from: process.env.FROM_EMAIL || 'no-reply@xpcbuilders.com',
    to: adminEmail,
    subject: `New EMI application from ${app.customer.fullName}`,
    text: `New EMI application submitted. ID: ${app._id}\nView details in admin dashboard.`,
    html: `<p>New EMI application submitted.</p><p>ID: ${app._id}</p>`,
  });
}

export async function sendCustomerEmail(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: process.env.FROM_EMAIL || 'no-reply@xpcbuilders.com',
    to,
    subject,
    html,
  });
}
