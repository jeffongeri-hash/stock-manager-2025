export interface HealthcareInputs {
  currentAge: number;
  currentSavings: number;
  retireAge: number;
  realReturnPct: number;
  fireNumber: number;
  fullTimeIncome: number;
  partTimeIncome: number;
  healthInsurance: number;
  retirementMatch: number;
  cme: number;
  malpractice: number;
  licenseFees: number;
  /** Optional annual contribution while still full-time (0 = growth only). */
  annualContribution: number;
}

export function coastNumber(fireNumber: number, realReturnPct: number, years: number) {
  return fireNumber / Math.pow(1 + realReturnPct / 100, Math.max(0, years));
}

export function computeHealthcareCoast(i: HealthcareInputs) {
  const years = Math.max(0, i.retireAge - i.currentAge);
  const r = i.realReturnPct / 100;
  const coast = coastNumber(i.fireNumber, i.realReturnPct, years);
  const gap = Math.max(0, coast - i.currentSavings);
  const benefitsTotal = i.healthInsurance + i.retirementMatch + i.cme + i.malpractice + i.licenseFees;
  const effectivePartTime = i.partTimeIncome - benefitsTotal;

  // Years until savings (growing + contributions) meet the shrinking coast target.
  let yearsToCoast: number | null = null;
  let bal = i.currentSavings;
  for (let t = 0; t <= years; t++) {
    if (bal >= coastNumber(i.fireNumber, i.realReturnPct, years - t)) { yearsToCoast = t; break; }
    bal = bal * (1 + r) + i.annualContribution;
  }
  return {
    years, coast, gap, benefitsTotal, effectivePartTime,
    incomeDrop: i.fullTimeIncome - effectivePartTime,
    yearsToCoast,
  };
}
