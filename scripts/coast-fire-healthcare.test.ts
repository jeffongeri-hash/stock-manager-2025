import { describe, expect, test } from 'bun:test';
import { coastNumber, computeHealthcareCoast } from '../src/lib/coast-fire-healthcare';

describe('healthcare Coast FIRE worked examples (35-year-old PA, $1.5M target)', () => {
  test('7% real, retire 65 ≈ $197K', () => expect(Math.round(coastNumber(1_500_000, 7, 30))).toBe(197051));
  test('7% real, retire 60 ≈ $276K', () => expect(Math.round(coastNumber(1_500_000, 7, 25))).toBe(276374));
  test('5% real, retire 65 ≈ $347K', () => expect(Math.round(coastNumber(1_500_000, 5, 30))).toBe(347066));
  test('5% real, retire 60 ≈ $443K', () => expect(Math.round(coastNumber(1_500_000, 5, 25))).toBe(442954));
  test('effective part-time income subtracts every lost benefit', () => {
    const r = computeHealthcareCoast({ currentAge: 35, currentSavings: 0, retireAge: 65, realReturnPct: 7, fireNumber: 1e6,
      fullTimeIncome: 130000, partTimeIncome: 70000, healthInsurance: 7000, retirementMatch: 5000, cme: 2000, malpractice: 1500, licenseFees: 500, annualContribution: 0 });
    expect(r.benefitsTotal).toBe(16000);
    expect(r.effectivePartTime).toBe(54000);
  });
});
