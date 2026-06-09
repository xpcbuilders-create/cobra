import crypto from 'crypto';
import { OTPModel } from '../models/OTP';

// OTP service: generate and verify OTPs
// Twilio comments: To use Twilio, call client.messages.create({to: target, from: TWILIO_FROM, body: `Your OTP is ${otp}`})
// Firebase alternative: Use Firebase Auth phone auth flow and verify on client.

export async function generateOtp(target: string) {
  const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 5); // 5 minutes
  await OTPModel.findOneAndUpdate(
    { target },
    { otp, expiresAt, attempts: 0 },
    { upsert: true }
  );
  // TODO: send OTP via SMS/email using Twilio/Nodemailer
  return otp;
}

export async function verifyOtp(target: string, otp: string) {
  const rec = await OTPModel.findOne({ target });
  if (!rec) return false;
  if (!rec.expiresAt || rec.expiresAt < new Date()) return false;
  if (rec.attempts >= 5) return false;
  if (rec.otp !== otp) {
    rec.attempts += 1;
    await rec.save();
    return false;
  }
  // on success remove or expire
  await OTPModel.deleteOne({ target });
  return true;
}
