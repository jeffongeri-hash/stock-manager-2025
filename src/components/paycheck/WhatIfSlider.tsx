import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { SlidersHorizontal, TrendingUp, TrendingDown, DollarSign, Percent, PiggyBank, Heart, Shield, Car, GraduationCap, Gift, Sparkles } from 'lucide-react';

interface PaycheckResult {
  grossPay: number;
  preTaxDeductions: number;
  taxableIncome: number;
  taxes: {
    federalTax: number;
    stateTax: number;
    stateName: string;
    localTax: number;
    localTaxName: string | null;
    socialSecurity: number;
    medicare: number;
    taxBreakdown: {
      federalRate: string;
      stateRate: string;
      localRate: string;
    };
    notes: string;
  };
  totalTaxes: number;
  postTaxDeductions: number;
  netPay: number;
}

interface WhatIfSliderProps {
  result: PaycheckResult;
  grossPay: number;
  payFrequency: string;
}

const ADJUSTABLE_VARIABLES = [
  { value: '401k', label: '401(k) Contribution', icon: PiggyBank, maxPercent: 23, category: 'pretax', hasMatch: true },
  { value: 'hsa', label: 'HSA Contribution', icon: Heart, maxPercent: 8, category: 'pretax', hasMatch: false },
  { value: 'fsa', label: 'FSA Contribution', icon: Heart, maxPercent: 5, category: 'pretax', hasMatch: false },
  { value: 'health_premium', label: 'Health Insurance Premium', icon: Shield, maxPercent: 15, category: 'pretax', hasMatch: false },
  { value: 'commuter', label: 'Commuter Benefits', icon: Car, maxPercent: 5, category: 'pretax', hasMatch: false },
  { value: 'roth_401k', label: 'Roth 401(k)', icon: PiggyBank, maxPercent: 23, category: 'posttax', hasMatch: true },
  { value: 'student_loan', label: 'Student Loan Payment', icon: GraduationCap, maxPercent: 20, category: 'posttax', hasMatch: false },
];

const getPayPeriodsPerYear = (frequency: string): number => {
  switch (frequency) {
    case 'weekly': return 52;
    case 'biweekly': return 26;
    case 'semimonthly': return 24;
    case 'monthly': return 12;
    default: return 26;
  }
};

// Simplified marginal tax rate estimation based on taxable income
const estimateMarginalTaxRate = (annualTaxableIncome: number, federalTax: number, stateTax: number): number => {
  // Federal brackets (2024 single filer approximation)
  let federalMarginal = 0;
  if (annualTaxableIncome <= 11600) federalMarginal = 0.10;
  else if (annualTaxableIncome <= 47150) federalMarginal = 0.12;
  else if (annualTaxableIncome <= 100525) federalMarginal = 0.22;
  else if (annualTaxableIncome <= 191950) federalMarginal = 0.24;
  else if (annualTaxableIncome <= 243725) federalMarginal = 0.32;
  else if (annualTaxableIncome <= 609350) federalMarginal = 0.35;
  else federalMarginal = 0.37;
  
  // Estimate state marginal rate from effective rate (rough approximation)
  const effectiveStateRate = annualTaxableIncome > 0 ? (stateTax * 26) / annualTaxableIncome : 0.05;
  const stateMarginal = Math.min(effectiveStateRate * 1.2, 0.13); // Most states cap around 13%
  
  return federalMarginal + stateMarginal;
};

export function WhatIfSlider({ result, grossPay, payFrequency }: WhatIfSliderProps) {
  const [selectedVariable, setSelectedVariable] = useState('401k');
  const [adjustmentPercent, setAdjustmentPercent] = useState(6); // Default 6%
  
  // Employer match settings
  const [enableEmployerMatch, setEnableEmployerMatch] = useState(true);
  const [matchPercent, setMatchPercent] = useState(50); // 50% match
  const [matchUpTo, setMatchUpTo] = useState(6); // Up to 6% of salary
  
  const selectedVarConfig = ADJUSTABLE_VARIABLES.find(v => v.value === selectedVariable);
  const Icon = selectedVarConfig?.icon || DollarSign;
  const isPretax = selectedVarConfig?.category === 'pretax';
  const maxPercent = selectedVarConfig?.maxPercent || 25;
  const hasMatchOption = selectedVarConfig?.hasMatch || false;
  
  const periodsPerYear = getPayPeriodsPerYear(payFrequency);
  
  const calculations = useMemo(() => {
    const adjustmentAmount = (grossPay * adjustmentPercent) / 100;
    const annualAdjustment = adjustmentAmount * periodsPerYear;
    
    // Calculate employer match
    let employerMatchPerPaycheck = 0;
    let annualEmployerMatch = 0;
    
    if (enableEmployerMatch && hasMatchOption) {
      // Calculate what portion of your contribution gets matched
      const matchablePercent = Math.min(adjustmentPercent, matchUpTo);
      const matchableAmount = (grossPay * matchablePercent) / 100;
      employerMatchPerPaycheck = matchableAmount * (matchPercent / 100);
      annualEmployerMatch = employerMatchPerPaycheck * periodsPerYear;
    }
    
    // Estimate the annual taxable income
    const annualTaxableIncome = result.taxableIncome * periodsPerYear;
    
    // Get marginal tax rate
    const marginalRate = estimateMarginalTaxRate(
      annualTaxableIncome,
      result.taxes.federalTax,
      result.taxes.stateTax
    );
    
    // Total contribution (yours + employer)
    const totalContributionPerPaycheck = adjustmentAmount + employerMatchPerPaycheck;
    const totalAnnualContribution = annualAdjustment + annualEmployerMatch;
    
    if (isPretax) {
      // Pre-tax deductions reduce taxable income
      const taxSavingsPerPaycheck = adjustmentAmount * marginalRate;
      const annualTaxSavings = taxSavingsPerPaycheck * periodsPerYear;
      const netCostPerPaycheck = adjustmentAmount - taxSavingsPerPaycheck;
      const newNetPay = result.netPay - netCostPerPaycheck;
      const netPayDifference = newNetPay - result.netPay;
      
      // Calculate effective return on investment
      const immediateReturn = ((taxSavingsPerPaycheck + employerMatchPerPaycheck) / netCostPerPaycheck) * 100;
      
      return {
        adjustmentAmount,
        annualAdjustment,
        taxSavingsPerPaycheck,
        annualTaxSavings,
        netCostPerPaycheck,
        newNetPay,
        netPayDifference,
        effectiveRate: (netCostPerPaycheck / adjustmentAmount) * 100,
        marginalRate: marginalRate * 100,
        employerMatchPerPaycheck,
        annualEmployerMatch,
        totalContributionPerPaycheck,
        totalAnnualContribution,
        immediateReturn,
      };
    } else {
      // Post-tax deductions don't affect taxes
      const newNetPay = result.netPay - adjustmentAmount;
      const immediateReturn = employerMatchPerPaycheck > 0 
        ? (employerMatchPerPaycheck / adjustmentAmount) * 100 
        : 0;
      
      return {
        adjustmentAmount,
        annualAdjustment,
        taxSavingsPerPaycheck: 0,
        annualTaxSavings: 0,
        netCostPerPaycheck: adjustmentAmount,
        newNetPay,
        netPayDifference: -adjustmentAmount,
        effectiveRate: 100,
        marginalRate: marginalRate * 100,
        employerMatchPerPaycheck,
        annualEmployerMatch,
        totalContributionPerPaycheck,
        totalAnnualContribution,
        immediateReturn,
      };
    }
  }, [result, grossPay, adjustmentPercent, isPretax, periodsPerYear, enableEmployerMatch, matchPercent, matchUpTo, hasMatchOption]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-primary" />
          What-If Slider
        </CardTitle>
        <CardDescription>
          Quickly see how adjusting a single variable impacts your take-home pay
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Variable Selection */}
        <div className="space-y-2">
          <Label>Select Variable to Adjust</Label>
          <Select value={selectedVariable} onValueChange={setSelectedVariable}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Pre-Tax Deductions</div>
              {ADJUSTABLE_VARIABLES.filter(v => v.category === 'pretax').map(v => (
                <SelectItem key={v.value} value={v.value}>
                  <div className="flex items-center gap-2">
                    <v.icon className="h-4 w-4" />
                    {v.label}
                    {v.hasMatch && <Badge variant="secondary" className="text-[10px] px-1">Match</Badge>}
                  </div>
                </SelectItem>
              ))}
              <Separator className="my-1" />
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Post-Tax Deductions</div>
              {ADJUSTABLE_VARIABLES.filter(v => v.category === 'posttax').map(v => (
                <SelectItem key={v.value} value={v.value}>
                  <div className="flex items-center gap-2">
                    <v.icon className="h-4 w-4" />
                    {v.label}
                    {v.hasMatch && <Badge variant="secondary" className="text-[10px] px-1">Match</Badge>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Employer Match Settings */}
        {hasMatchOption && (
          <div className="p-4 rounded-lg border bg-gradient-to-br from-purple-500/5 to-transparent">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-purple-500" />
                <Label className="font-medium">Employer Match</Label>
              </div>
              <Switch
                checked={enableEmployerMatch}
                onCheckedChange={setEnableEmployerMatch}
              />
            </div>
            
            {enableEmployerMatch && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Match Rate</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={matchPercent}
                      onChange={(e) => setMatchPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                      className="w-20"
                      min={0}
                      max={100}
                    />
                    <span className="text-sm text-muted-foreground">% of your contribution</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Up To</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={matchUpTo}
                      onChange={(e) => setMatchUpTo(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                      className="w-20"
                      min={0}
                      max={100}
                    />
                    <span className="text-sm text-muted-foreground">% of your salary</span>
                  </div>
                </div>
              </div>
            )}
            
            {enableEmployerMatch && (
              <p className="text-xs text-muted-foreground mt-3">
                Example: {matchPercent}% match up to {matchUpTo}% means if you contribute {matchUpTo}% of your salary, 
                your employer adds {(matchUpTo * matchPercent / 100).toFixed(1)}%.
              </p>
            )}
          </div>
        )}
        
        {/* Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {selectedVarConfig?.label} Rate
            </Label>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-lg font-bold">
                {adjustmentPercent}%
              </Badge>
              <span className="text-sm text-muted-foreground">
                (${calculations.adjustmentAmount.toFixed(2)}/paycheck)
              </span>
            </div>
          </div>
          
          <Slider
            value={[adjustmentPercent]}
            onValueChange={(v) => setAdjustmentPercent(v[0])}
            min={0}
            max={maxPercent}
            step={0.5}
            className="py-4"
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            {hasMatchOption && enableEmployerMatch && (
              <span className="text-purple-500">↑ {matchUpTo}% (max match)</span>
            )}
            <span>{maxPercent}%</span>
          </div>
        </div>
        
        <Separator />
        
        {/* Impact Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1 p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Your Contribution</p>
            <p className="text-xl font-bold">${calculations.adjustmentAmount.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">
              ${calculations.annualAdjustment.toLocaleString(undefined, { maximumFractionDigits: 0 })}/year
            </p>
          </div>
          
          {enableEmployerMatch && hasMatchOption && calculations.employerMatchPerPaycheck > 0 && (
            <div className="space-y-1 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Gift className="h-3 w-3" />
                Employer Match
              </p>
              <p className="text-xl font-bold text-purple-600">
                +${calculations.employerMatchPerPaycheck.toFixed(2)}
              </p>
              <p className="text-xs text-purple-600">
                +${calculations.annualEmployerMatch.toLocaleString(undefined, { maximumFractionDigits: 0 })}/year
              </p>
            </div>
          )}
          
          {isPretax && (
            <div className="space-y-1 p-3 rounded-lg bg-green-500/10">
              <p className="text-xs text-muted-foreground">Tax Savings</p>
              <p className="text-xl font-bold text-green-500">
                ${calculations.taxSavingsPerPaycheck.toFixed(2)}
              </p>
              <p className="text-xs text-green-600">
                ${calculations.annualTaxSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}/year
              </p>
            </div>
          )}
          
          <div className="space-y-1 p-3 rounded-lg bg-amber-500/10">
            <p className="text-xs text-muted-foreground">Actual Cost to You</p>
            <p className="text-xl font-bold text-amber-600">
              ${calculations.netCostPerPaycheck.toFixed(2)}
            </p>
            {isPretax && (
              <p className="text-xs text-muted-foreground">
                {calculations.effectiveRate.toFixed(0)}¢ per dollar contributed
              </p>
            )}
          </div>
          
          <div className={`space-y-1 p-3 rounded-lg ${calculations.netPayDifference >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <p className="text-xs text-muted-foreground">Net Pay Change</p>
            <p className={`text-xl font-bold flex items-center gap-1 ${calculations.netPayDifference >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {calculations.netPayDifference >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {calculations.netPayDifference >= 0 ? '+' : ''}${calculations.netPayDifference.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              New: ${calculations.newNetPay.toFixed(2)}
            </p>
          </div>
        </div>
        
        {/* Total Value Card (when employer match is enabled) */}
        {enableEmployerMatch && hasMatchOption && adjustmentPercent > 0 && (
          <>
            <Separator />
            <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 via-primary/5 to-green-500/10 border">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-semibold">Total Retirement Value</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Your Contribution</p>
                  <p className="text-lg font-bold">${calculations.adjustmentAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">+ Employer Match</p>
                  <p className="text-lg font-bold text-purple-600">
                    ${calculations.employerMatchPerPaycheck.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">= Total/Paycheck</p>
                  <p className="text-lg font-bold text-primary">
                    ${calculations.totalContributionPerPaycheck.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t text-center">
                <p className="text-sm text-muted-foreground">Annual Total to Retirement</p>
                <p className="text-2xl font-bold text-primary">
                  ${calculations.totalAnnualContribution.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                {calculations.immediateReturn > 0 && (
                  <Badge className="mt-2 bg-green-500">
                    {calculations.immediateReturn.toFixed(0)}% Immediate Return!
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}
        
        {/* Insight Box */}
        {isPretax && adjustmentPercent > 0 && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-sm">Tax Advantage Insight</p>
                <p className="text-sm text-muted-foreground">
                  At your estimated {calculations.marginalRate.toFixed(0)}% marginal tax rate, 
                  every <strong>$1.00</strong> you contribute to {selectedVarConfig?.label} only costs you{' '}
                  <strong className="text-primary">${(calculations.effectiveRate / 100).toFixed(2)}</strong> in take-home pay.
                </p>
                {hasMatchOption && enableEmployerMatch && calculations.employerMatchPerPaycheck > 0 && (
                  <p className="text-sm text-purple-600 mt-2">
                    🎁 With your employer's {matchPercent}% match, you're getting{' '}
                    <strong>${(calculations.adjustmentAmount + calculations.employerMatchPerPaycheck).toFixed(2)}</strong> invested 
                    for only <strong>${calculations.netCostPerPaycheck.toFixed(2)}</strong> out of pocket!
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {!isPretax && adjustmentPercent > 0 && (
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-sm">Post-Tax Contribution</p>
                <p className="text-sm text-muted-foreground">
                  {selectedVarConfig?.label} contributions come from after-tax income, 
                  so there's no immediate tax benefit. However, {selectedVariable === 'roth_401k' ? 
                    'Roth contributions grow tax-free and withdrawals in retirement are tax-free!' :
                    'this helps you build savings and meet financial goals.'}
                </p>
                {hasMatchOption && enableEmployerMatch && calculations.employerMatchPerPaycheck > 0 && (
                  <p className="text-sm text-purple-600 mt-2">
                    🎁 Your employer match of <strong>${calculations.employerMatchPerPaycheck.toFixed(2)}/paycheck</strong> is 
                    essentially a {calculations.immediateReturn.toFixed(0)}% instant return on your contribution!
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
