import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeductionRow } from './DeductionRow';
import { DollarSign, Plus, PiggyBank, Heart, Shield, Car, Baby, Briefcase, Landmark, GraduationCap } from 'lucide-react';

interface Deduction {
  id: string;
  label: string;
  value: number;
  type: 'percentage' | 'amount';
}

const COMMON_PRETAX_DEDUCTIONS = [
  { value: '401k', label: '401(k) Contribution', icon: PiggyBank },
  { value: '403b', label: '403(b) Contribution', icon: PiggyBank },
  { value: '457b', label: '457(b) Contribution', icon: PiggyBank },
  { value: 'hsa', label: 'HSA Contribution', icon: Heart },
  { value: 'fsa', label: 'FSA (Flexible Spending)', icon: Heart },
  { value: 'health', label: 'Health Insurance Premium', icon: Shield },
  { value: 'dental', label: 'Dental Insurance', icon: Shield },
  { value: 'vision', label: 'Vision Insurance', icon: Shield },
  { value: 'life', label: 'Life Insurance', icon: Shield },
  { value: 'commuter', label: 'Commuter Benefits', icon: Car },
  { value: 'dependent', label: 'Dependent Care FSA', icon: Baby },
  { value: 'custom', label: 'Custom Deduction', icon: DollarSign },
];

const COMMON_POSTTAX_DEDUCTIONS = [
  { value: 'roth401k', label: 'Roth 401(k)', icon: PiggyBank },
  { value: 'rothira', label: 'Roth IRA', icon: PiggyBank },
  { value: 'union', label: 'Union Dues', icon: Briefcase },
  { value: 'charity', label: 'Charitable Contributions', icon: Heart },
  { value: 'garnishment', label: 'Wage Garnishment', icon: Landmark },
  { value: 'studentloan', label: 'Student Loan Repayment', icon: GraduationCap },
  { value: 'aftertaxlife', label: 'After-Tax Life Insurance', icon: Shield },
  { value: 'disability', label: 'Disability Insurance', icon: Shield },
  { value: 'custom', label: 'Custom Deduction', icon: DollarSign },
];

interface ScenarioInputsProps {
  grossPay: number;
  setGrossPay: (v: number) => void;
  payFrequency: string;
  setPayFrequency: (v: string) => void;
  zipCode: string;
  setZipCode: (v: string) => void;
  filingStatus: string;
  setFilingStatus: (v: string) => void;
  allowances: number;
  setAllowances: (v: number) => void;
  preTaxDeductions: Deduction[];
  postTaxDeductions: Deduction[];
  onAddDeduction: (isPretax: boolean) => void;
  onUpdateDeduction: (id: string, field: keyof Deduction, value: string | number, isPretax: boolean) => void;
  onRemoveDeduction: (id: string, isPretax: boolean) => void;
}

export function ScenarioInputs({
  grossPay,
  setGrossPay,
  payFrequency,
  setPayFrequency,
  zipCode,
  setZipCode,
  filingStatus,
  setFilingStatus,
  allowances,
  setAllowances,
  preTaxDeductions,
  postTaxDeductions,
  onAddDeduction,
  onUpdateDeduction,
  onRemoveDeduction,
}: ScenarioInputsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Gross Pay</Label>
          <div className="relative">
            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              type="number"
              value={grossPay}
              onChange={(e) => setGrossPay(parseFloat(e.target.value) || 0)}
              className="pl-6 h-9"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Frequency</Label>
          <Select value={payFrequency} onValueChange={setPayFrequency}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Bi-Weekly</SelectItem>
              <SelectItem value="semimonthly">Semi-Monthly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">ZIP Code</Label>
          <Input
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="12345"
            className="h-9"
            maxLength={5}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Filing Status</Label>
          <Select value={filingStatus} onValueChange={setFilingStatus}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="married">Married</SelectItem>
              <SelectItem value="marriedSeparate">Married Sep.</SelectItem>
              <SelectItem value="headOfHousehold">Head of House</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pre-Tax Deductions Compact */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-green-500">Pre-Tax Deductions</Label>
          <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => onAddDeduction(true)}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        {preTaxDeductions.map(d => (
          <DeductionRow 
            key={d.id} 
            deduction={d} 
            isPretax={true} 
            options={COMMON_PRETAX_DEDUCTIONS}
            onUpdate={(id, field, value) => onUpdateDeduction(id, field, value, true)}
            onRemove={(id) => onRemoveDeduction(id, true)}
          />
        ))}
      </div>

      {/* Post-Tax Deductions Compact */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-blue-500">Post-Tax Deductions</Label>
          <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => onAddDeduction(false)}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        {postTaxDeductions.map(d => (
          <DeductionRow 
            key={d.id} 
            deduction={d} 
            isPretax={false} 
            options={COMMON_POSTTAX_DEDUCTIONS}
            onUpdate={(id, field, value) => onUpdateDeduction(id, field, value, false)}
            onRemove={(id) => onRemoveDeduction(id, false)}
          />
        ))}
      </div>
    </div>
  );
}
