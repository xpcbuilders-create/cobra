import mongoose from 'mongoose';

const EmiPlanSchema = new mongoose.Schema(
  {
    durationMonths: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    name: { type: String, required: true },
  },
  { timestamps: true }
);

export const EmiPlan = mongoose.model('EmiPlan', EmiPlanSchema);
