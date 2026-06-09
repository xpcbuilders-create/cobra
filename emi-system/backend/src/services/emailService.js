"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAdminNotification = sendAdminNotification;
exports.sendCustomerEmail = sendCustomerEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
    },
});
async function sendAdminNotification(app) {
    const adminEmail = process.env.ADMIN_EMAIL || 'xpcbuilders@gmail.com';
    await transporter.sendMail({
        from: process.env.FROM_EMAIL || 'no-reply@xpcbuilders.com',
        to: adminEmail,
        subject: `New EMI application from ${app.customer.fullName}`,
        text: `New EMI application submitted. ID: ${app._id}\nView details in admin dashboard.`,
        html: `<p>New EMI application submitted.</p><p>ID: ${app._id}</p>`,
    });
}
async function sendCustomerEmail(to, subject, html) {
    await transporter.sendMail({
        from: process.env.FROM_EMAIL || 'no-reply@xpcbuilders.com',
        to,
        subject,
        html,
    });
}
