import { Request, Response } from 'express';
import { EmiPlan } from '../models/EmiPlan.js';

export const getEmiConfig = async (req: Request, res: Response) => {
  const plan = (await EmiPlan.findOne().lean()) as { interestRate: number; durations: number[] } | null;
  if (!plan) {
    return res.json({ interestRate: 12, durations: [3, 6, 9, 12] });
  }
  res.json({ interestRate: plan.interestRate, durations: plan.durations });
};

export const updateEmiConfig = async (req: Request, res: Response) => {
  const { interestRate, durations } = req.body;
  if (interestRate == null || !Array.isArray(durations)) {
    return res.status(400).json({ message: 'Interest rate and durations are required' });
  }

  const plan = await EmiPlan.findOneAndUpdate(
    {},
    { interestRate, durations },
    { upsert: true, new: true }
  ).lean();

  res.json({ plan });
};

export const calculateEmi = (req: Request, res: Response) => {
  const { price, months, rate } = req.body;
  if (!price || !months || !rate) {
    return res.status(400).json({ message: 'Price, months, and rate are required' });
  }

  const monthlyRate = rate / 100 / 12;
  const monthly = Math.round((price * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months)));

  res.json({ monthly, totalPayable: monthly * months, durationMonths: months, interestRate: rate });
};
