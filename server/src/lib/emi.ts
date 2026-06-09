export type EmiOption = {
  tenure: number;
  interest: number;
  monthlyEmi: number;
};

export function getEmiOptions(price: number): EmiOption[] {
  const plans = [
    { tenure: 3, interest: 0 },
    { tenure: 6, interest: 8 },
    { tenure: 9, interest: 12.5 },
    { tenure: 12, interest: 25 },
  ];
  return plans.map(({ tenure, interest }) => {
    const principal = price;
    const monthlyRate = interest / 100 / 12;
    const monthlyEmi =
      monthlyRate === 0
        ? principal / tenure
        : (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
          (Math.pow(1 + monthlyRate, tenure) - 1);
    return {
      tenure,
      interest,
      monthlyEmi: Number(monthlyEmi.toFixed(2)),
    };
  });
}
