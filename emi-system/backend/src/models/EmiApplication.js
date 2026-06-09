"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmiApplication = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const GuarantorSchema = new mongoose_1.default.Schema({
    fullName: String,
    mobile: String,
    relationship: String,
    address: String,
    aadhaarNumber: String,
    panNumber: String,
});
const PaymentHistorySchema = new mongoose_1.default.Schema({
    date: Date,
    amount: Number,
    method: String,
    status: String,
});
const EmiPlanSchema = new mongoose_1.default.Schema({
    productPrice: Number,
    downPayment: Number,
    interestRate: Number,
    tenureMonths: Number,
    monthlyAmount: Number,
    totalInterest: Number,
    totalPayable: Number,
});
const EmiApplicationSchema = new mongoose_1.default.Schema({
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
}, { timestamps: true });
exports.EmiApplication = mongoose_1.default.model('EmiApplication', EmiApplicationSchema);
exports.default = exports.EmiApplication;
