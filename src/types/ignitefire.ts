export enum FireType {
  LEAN = 'Lean FIRE',
  STANDARD = 'Regular FIRE',
  FAT = 'Fat FIRE',
  BARISTA = 'Barista FIRE',
  COAST = 'Coast FIRE'
}

export interface IgniteUserFinancials {
  currentAge: number;
  retirementAge: number;
  currentNetWorth: number;
  annualSpending: number;
  annualSavings: number;
  expectedReturn: number;
  grossAnnualIncome: number;
  taxRate: number;
  pensionOrSocialSecurity: number;
  zipCode?: string;
}

export interface SavingsBucket {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  currentBalance: number;
  targetBalance: number;
}

export interface PaycheckDeductions {
  fourOhOneKType: 'percentage' | 'fixed';
  fourOhOneKValue: number;
  hsaType: 'percentage' | 'fixed';
  hsaValue: number;
  rothIRAType: 'percentage' | 'fixed';
  rothIRAValue: number;
  
  ytdFourOhOneK: number;
  ytdHsa: number;
  ytdRothIRA: number;
  
  otherPreTax: number;
  brokerage: number;
  healthIns: number;
  matchPercent: number;
  matchLimit: number;
  buckets: SavingsBucket[];
}

export interface Debt {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minPayment: number;
  type: 'credit_card' | 'student_loan' | 'car_loan' | 'mortgage' | 'personal_loan';
  creditLimit?: number;
}

export type DebtPayoffStrategy = 'avalanche' | 'snowball';

export interface LocationCostData {
  location: string;
  jobTitle: string;
  text: string;
  sources: { web?: { title: string; uri: string } }[];
  timestamp: number;
}

export interface OptionsHistoryItem {
  ticker: string;
  analysis: string;
  timestamp: number;
}

export interface VacationPlan {
  origin: string;
  destination: string;
  budget: number;
  startDate: string;
  endDate: string;
  text: string;
  sources: any[];
  timestamp: number;
}
