import mongoose from 'mongoose';

const OTPSchema = new mongoose.Schema({
  target: String, // phone or email
  otp: String,
  expiresAt: Date,
  attempts: { type: Number, default: 0 },
});

export const OTPModel = mongoose.model('OTP', OTPSchema);
export default OTPModel;
