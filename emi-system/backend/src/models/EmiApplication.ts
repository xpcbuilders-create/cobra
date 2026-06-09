import mongoose from 'mongoose';

const GuarantorSchema = new mongoose.Schema({
  fullName: String,
  mobile: String,
  relationship: String,
  address: String,
  aadhaarNumber: String,
  panNumber: String,
});

const PaymentHistorySchema = new mongoose.Schema({
  date: Date,
  amount: Number,
  method: String,
  status: String,
});

const EmiPlanSchema = new mongoose.Schema({
  productPrice: Number,
  downPayment: Number,
  interestRate: Number,
  tenureMonths: Number,
  monthlyAmount: Number,
  totalInterest: Number,
  totalPayable: Number,
});

const EmiApplicationSchema = new mongoose.Schema(
  {
    customer: {
      fullName: String,
      mobile: String,
      email: String,
      dob: Date,
      address: String,
      city: String,
      state: String,
      pincode: String,
    },
    documents: {
      aadhaarUrl: String,
      panUrl: String,
    },
    aadhaarNumber: String,
    panNumber: String,
    guarantor: GuarantorSchema,
    otpVerified: { type: Boolean, default: false },
    kycVerified: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'on_hold'], default: 'pending' },
    emiPlan: EmiPlanSchema,
    paymentHistory: [PaymentHistorySchema],
    agreementPdfUrl: String,
    signatureUrl: String,
    autoDebitConsent: { type: Boolean, default: false },
    adminNote: String,
  },
  { timestamps: true }
);

export const EmiApplication = mongoose.model('EmiApplication', EmiApplicationSchema);
export default EmiApplication;
