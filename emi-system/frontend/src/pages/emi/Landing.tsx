import React from 'react';
import { Link } from 'react-router-dom';
import EmiCalculator from '../../components/emi/EmiCalculator';

export default function Landing() {
  return (
    <div className="min-h-screen bg-black text-slate-100 p-6">
      <section className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">XPC Builders EMI Finance</h1>
          <p className="mt-2 text-lg text-slate-300">Premium gaming PC finance — starting from ₹2999/month</p>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass p-6">
            <h2 className="text-2xl font-semibold mb-4">EMI Calculator</h2>
            <EmiCalculator />
            <div className="mt-4 flex gap-3">
              <Link to="/emi/apply" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md">Apply for EMI</Link>
              <Link to="/emi/apply" className="px-4 py-2 border border-slate-600 rounded-md">Check Eligibility</Link>
            </div>
          </div>

          <div className="glass p-6">
            <h2 className="text-2xl font-semibold mb-4">Why choose XPC Builders</h2>
            <ul className="list-disc pl-5 text-slate-300">
              <li>Credit Card EMI Available</li>
              <li>Fast verification and premium support</li>
              <li>Auto-debit (optional) and reminders</li>
            </ul>
          </div>
        </div>

        <section className="mt-10 glass p-6">
          <h3 className="text-xl font-semibold">FAQ</h3>
          <p className="text-slate-300 mt-2">Credit Card EMI is the only supported payment method for EMI plans.</p>
        </section>
      </section>
    </div>
  );
}
