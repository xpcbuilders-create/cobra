export function OrderTracker({ status }: { status: string }) {
  const steps = [
    'Placed',
    'Paid',
    'Confirmed',
    'Packed',
    'Shipped',
    'Out For Delivery',
    'Delivered',
  ];

  const currentIndex = steps.indexOf(status);
  const isCancelled = status === 'Cancelled';

  if (isCancelled) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-700">Order Cancelled</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step} className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                index <= currentIndex
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-300 text-slate-600'
              }`}
            >
              {index <= currentIndex ? '✓' : index + 1}
            </div>
            <p className="mt-2 text-center text-xs text-slate-600">
              {step}
            </p>
          </div>
        ))}
      </div>
      {currentIndex >= 0 && currentIndex < steps.length && (
        <p className="mt-3 text-center text-sm font-medium text-slate-700">
          Current Status: <span className="text-green-600">{status}</span>
        </p>
      )}
    </div>
  );
}
