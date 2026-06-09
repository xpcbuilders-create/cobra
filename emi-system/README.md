# XPC Builders EMI System (scaffold)

This folder contains a scaffold for the EMI finance system for XPC Builders.

Backend: emi-system/backend
Frontend: emi-system/frontend

What I scaffoled:
- Backend Mongoose models: `EmiApplication`, `OTP`
- OTP service with Twilio/Firebase comments
- Nodemailer email service pointing to xpcbuilders@gmail.com
- EMI Express routes (`/emi`) with apply, verify-otp, admin endpoints
- PDF generator stub
- Frontend EMI landing and a multi-step Apply form
- EMI calculator component (live updates)

Next steps I can take:
- Wire routes into your existing `server` `index.ts` or copy these files into `server/src`.
- Add authentication middleware for admin endpoints.
- Implement file storage (Cloudinary/S3) for uploaded docs.
- Replace PDF stub with `pdfkit` or Puppeteer render.
- Add Twilio/Firebase integration for OTP delivery.

If you want, I can start wiring these into your existing `server` and `client` folders now.
