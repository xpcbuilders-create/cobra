import React, { useMemo, useState } from 'react';

function calcEMI(P: number, Rpercent: number, Nmonths: number) {
  if (!P || !Nmonths) return { emi: 0, totalInterest: 0, totalPayable: 0 };
  const R = Rpercent / 100 / 12;
  const N = Nmonths;
  const emi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
  const totalPayable = emi * N;
  const totalInterest = totalPayable - P;
  return { emi, totalInterest, totalPayable };
}

export default function EmiCalculator() {
  const [price, setPrice] = useState(80000);
  const [down, setDown] = useState(10000);
  const [rate, setRate] = useState(13.5);
  const [tenure, setTenure] = useState(12);

  const principal = Math.max(0, price - down);
  const res = useMemo(() => calcEMI(principal, rate, tenure), [principal, rate, tenure]);

  return (
    <div>
      <div className="grid gap-2">
        <label>Product Price</label>
        <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full rounded p-2 bg-black/60" />
        <label>Down Payment</label>
        <input type="number" value={down} onChange={(e) => setDown(Number(e.target.value))} className="w-full rounded p-2 bg-black/60" />
        <label>Interest Rate (annual %)</label>
        <input type="number" step="0.1" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full rounded p-2 bg-black/60" />
        <label>Tenure (months)</label>
        <input type="number" value={tenure} onChange={(e) => setTenure(Number(e.target.value))} className="w-full rounded p-2 bg-black/60" />
      </div>

      <div className="mt-4">
        <div>Monthly EMI: <strong>₹{Math.round(res.emi)}</strong></div>
        <div>Total Interest: ₹{Math.round(res.totalInterest)}</div>
        <div>Total Payable: ₹{Math.round(res.totalPayable)}</div>
      </div>
    </div>
  );
}
