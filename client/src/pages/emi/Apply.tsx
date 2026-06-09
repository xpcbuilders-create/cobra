import { useState } from 'react';

export default function Apply() {
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-black text-slate-100 p-6">
      <div className="max-w-3xl mx-auto glass p-6">
        <h1 className="text-2xl font-bold">Apply for EMI</h1>
        <p className="text-sm text-slate-300">Only Credit Card EMI supported. Complete verification to get approval.</p>

        {step === 1 && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
            <div>
              <label className="block text-sm">Full Name</label>
              <input className="mt-1 w-full rounded" required />
            </div>
            <div>
              <label className="block text-sm">Mobile Number</label>
              <input className="mt-1 w-full rounded" required />
            </div>
            <div>
              <label className="block text-sm">Email</label>
              <input className="mt-1 w-full rounded" required />
            </div>
            <div className="flex justify-end">
              <button className="px-4 py-2 bg-blue-600 rounded">Next: KYC</button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
            <div>
              <label className="block text-sm">Aadhaar Number</label>
              <input className="mt-1 w-full rounded" pattern="\d{12}" required />
            </div>
            <div>
              <label className="block text-sm">PAN Number</label>
              <input className="mt-1 w-full rounded" pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}" required />
            </div>
            <div>
              <label className="block text-sm">Upload Aadhaar</label>
              <input type="file" accept="image/*,application/pdf" />
            </div>
            <div>
              <label className="block text-sm">Upload PAN</label>
              <input type="file" accept="image/*,application/pdf" />
            </div>
            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(1)} className="px-4 py-2 border rounded">Back</button>
              <button className="px-4 py-2 bg-blue-600 rounded">Next: Guarantor</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); /* submit */ }}>
            <div>
              <label className="block text-sm">Guarantor Full Name</label>
              <input className="mt-1 w-full rounded" required />
            </div>
            <div>
              <label className="block text-sm">Guarantor Mobile</label>
              <input className="mt-1 w-full rounded" required />
            </div>
            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(2)} className="px-4 py-2 border rounded">Back</button>
              <button className="px-4 py-2 bg-blue-600 rounded">Submit Application</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
