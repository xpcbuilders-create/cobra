import { useState } from 'react';

const emiConfig = {
  interestRate: 12,
  durations: [3, 6, 9, 12],
};

const price = 1499;

function calculateMonthly(price: number, months: number, interest: number) {
  const monthlyRate = interest / 100 / 12;
  const installment = (price * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  return Math.round(installment);
}

export default function EmiPage() {
  const [duration, setDuration] = useState(12);
  const monthly = calculateMonthly(price, duration, emiConfig.interestRate);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-6xl px-6 py-14 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_0.6fr]">
          <div className="space-y-6 rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-glow">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">EMI calculator</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">Flexible plans designed for every purchase.</h1>
              <p className="mt-4 max-w-2xl text-slate-400">Adjust duration and interest to preview your monthly commitment across premium products.</p>
            </div>

            <div className="grid gap-4 rounded-[1.75rem] border border-slate-800/90 bg-slate-950/90 p-6">
              <div className="grid gap-3">
                <label className="text-sm text-slate-300">Product price</label>
                <p className="text-3xl font-semibold text-white">₹{price}</p>
              </div>
              <div className="grid gap-3">
                <label className="text-sm text-slate-300">EMI duration</label>
                <div className="grid gap-3 sm:grid-cols-4">
                  {emiConfig.durations.map((months) => (
                    <button
                      type="button"
                      key={months}
                      onClick={() => setDuration(months)}
                      className={`rounded-3xl px-4 py-3 text-sm font-semibold transition ${duration === months ? 'bg-cyan-400 text-slate-950' : 'bg-slate-950/90 text-slate-200 hover:bg-slate-800/90'}`}
                    >
                      {months} months
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-3">
                <p className="text-sm text-slate-300">Interest rate</p>
                <p className="text-xl font-semibold text-cyan-300">{emiConfig.interestRate}% per annum</p>
              </div>
            </div>
          </div>

          <aside className="space-y-6 rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-glow">
            <div className="rounded-[1.75rem] bg-slate-950/90 p-6 text-center">
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Monthly installment</p>
              <p className="mt-4 text-5xl font-semibold text-white">₹{monthly}</p>
              <p className="mt-2 text-slate-400">Estimated payment for {duration} months.</p>
            </div>
            <div className="rounded-[1.75rem] border border-slate-800/90 bg-slate-950/90 p-6 text-sm text-slate-300">
              <p className="font-semibold text-white">EMI breakdown</p>
              <ul className="mt-4 space-y-3">
                <li className="flex justify-between">
                  <span>Principal</span>
                  <span>₹{price}</span>
                </li>
                <li className="flex justify-between">
                  <span>Monthly interest</span>
                  <span>{emiConfig.interestRate}%</span>
                </li>
                <li className="flex justify-between border-t border-slate-800/80 pt-3">
                  <span>Total payable</span>
                  <span>₹{monthly * duration}</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
