import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, AreaChart, Area, ComposedChart, ReferenceLine 
} from 'recharts';
import { 
  Calculator, DollarSign, TrendingDown, AlertTriangle, CheckCircle2, 
  Lightbulb, ArrowRight, Percent, Scale, Building
} from 'lucide-react';

// 2024 Tax Brackets with inflation adjustment
const TAX_BRACKETS_2024 = {
  single: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
  married: [
    { min: 0, max: 23200, rate: 0.10 },
    { min: 23200, max: 94300, rate: 0.12 },
    { min: 94300, max: 201050, rate: 0.22 },
    { min: 201050, max: 383900, rate: 0.24 },
    { min: 383900, max: 487450, rate: 0.32 },
    { min: 487450, max: 731200, rate: 0.35 },
    { min: 731200, max: Infinity, rate: 0.37 },
  ]
};

const STANDARD_DEDUCTION_2024 = {
  single: 14600,
  married: 29200,
  single65: 16550,
  married65: 32600
};

// RMD Distribution Period Table (Uniform Lifetime Table)
const RMD_TABLE: Record<number, number> = {
  72: 27.4, 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1,
  80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2, 87: 14.4,
  88: 13.7, 89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5, 95: 8.9,
  96: 8.4, 97: 7.8, 98: 7.3, 99: 6.8, 100: 6.4, 101: 6.0, 102: 5.6, 103: 5.2,
  104: 4.9, 105: 4.6, 106: 4.3, 107: 4.1, 108: 3.9, 109: 3.7, 110: 3.5
};

// Social Security taxation thresholds
const SS_TAX_THRESHOLDS = {
  single: { base: 25000, additional: 34000 },
  married: { base: 32000, additional: 44000 }
};

export const TaxAwareWithdrawalOptimizer: React.FC = () => {
  // Account balances
  const [traditionalBalance, setTraditionalBalance] = useState(600000);
  const [rothBalance, setRothBalance] = useState(200000);
  const [taxableBalance, setTaxableBalance] = useState(150000);
  const [hsaBalance, setHsaBalance] = useState(50000);
  
  // Income sources
  const [socialSecurityBenefit, setSocialSecurityBenefit] = useState(30000);
  const [pensionIncome, setPensionIncome] = useState(0);
  const [otherIncome, setOtherIncome] = useState(0);
  
  // Retirement details
  const [currentAge, setCurrentAge] = useState(65);
  const [ssStartAge, setSsStartAge] = useState(67);
  const [lifeExpectancy, setLifeExpectancy] = useState(90);
  const [annualSpending, setAnnualSpending] = useState(80000);
  const [healthcareCosts, setHealthcareCosts] = useState(8000);
  
  // Tax settings
  const [filingStatus, setFilingStatus] = useState<'single' | 'married'>('married');
  const [stateTaxRate, setStateTaxRate] = useState(5);
  
  // Strategy options
  const [useRothConversions, setUseRothConversions] = useState(true);
  const [rothConversionLimit, setRothConversionLimit] = useState(50000);
  const [expectedReturn, setExpectedReturn] = useState(5);
  const [inflationRate, setInflationRate] = useState(2.5);

  const calculations = useMemo(() => {
    const yearsInRetirement = lifeExpectancy - currentAge;
    const brackets = TAX_BRACKETS_2024[filingStatus];
    const standardDeduction = currentAge >= 65 
      ? STANDARD_DEDUCTION_2024[`${filingStatus}65`] 
      : STANDARD_DEDUCTION_2024[filingStatus];
    const ssThresholds = SS_TAX_THRESHOLDS[filingStatus];

    // Calculate Social Security taxable amount
    const calculateSSTaxable = (provisionalIncome: number, ssBenefit: number) => {
      if (provisionalIncome <= ssThresholds.base) return 0;
      if (provisionalIncome <= ssThresholds.additional) {
        return Math.min(ssBenefit * 0.5, (provisionalIncome - ssThresholds.base) * 0.5);
      }
      const firstTier = (ssThresholds.additional - ssThresholds.base) * 0.5;
      const secondTier = (provisionalIncome - ssThresholds.additional) * 0.85;
      return Math.min(ssBenefit * 0.85, firstTier + secondTier);
    };

    // Calculate federal tax
    const calculateFederalTax = (taxableIncome: number) => {
      let tax = 0;
      let remainingIncome = taxableIncome;
      for (const bracket of brackets) {
        if (remainingIncome <= 0) break;
        const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
        tax += taxableInBracket * bracket.rate;
        remainingIncome -= taxableInBracket;
      }
      return tax;
    };

    // Get marginal bracket
    const getMarginalBracket = (taxableIncome: number) => {
      for (const bracket of brackets) {
        if (taxableIncome <= bracket.max) return bracket;
      }
      return brackets[brackets.length - 1];
    };

    // Calculate RMD
    const calculateRMD = (age: number, balance: number) => {
      if (age < 73) return 0; // RMD age is now 73 (SECURE 2.0)
      const divisor = RMD_TABLE[age] || RMD_TABLE[110];
      return balance / divisor;
    };

    // Simulate optimized withdrawal strategy
    const simulateOptimized = () => {
      let traditional = traditionalBalance;
      let roth = rothBalance;
      let taxable = taxableBalance;
      let hsa = hsaBalance;
      
      const yearlyData = [];
      let lifetimeTaxes = 0;
      let lifetimeRothConversions = 0;
      const recommendations: string[] = [];

      for (let year = 0; year < yearsInRetirement; year++) {
        const age = currentAge + year;
        const inflationMultiplier = Math.pow(1 + inflationRate / 100, year);
        const adjustedSpending = annualSpending * inflationMultiplier;
        const adjustedHealthcare = healthcareCosts * Math.pow(1.055, year);
        
        // Social Security (starts at ssStartAge)
        const ssThisYear = age >= ssStartAge ? socialSecurityBenefit * inflationMultiplier : 0;
        const pensionThisYear = pensionIncome * inflationMultiplier;
        const otherThisYear = otherIncome * inflationMultiplier;
        
        // Calculate RMD requirement
        const rmdRequired = calculateRMD(age, traditional);
        
        // Start with guaranteed income
        let incomeNeeded = adjustedSpending - ssThisYear - pensionThisYear - otherThisYear;
        
        // Withdrawal tracking
        let traditionalWithdrawal = 0;
        let rothWithdrawal = 0;
        let taxableWithdrawal = 0;
        let hsaWithdrawal = 0;
        let rothConversion = 0;

        // Step 1: Use HSA for healthcare (tax-free)
        if (hsa > 0 && adjustedHealthcare > 0) {
          hsaWithdrawal = Math.min(hsa, adjustedHealthcare);
          hsa -= hsaWithdrawal;
          incomeNeeded -= Math.min(hsaWithdrawal, adjustedHealthcare);
        }

        // Step 2: Must take RMD first
        if (rmdRequired > 0) {
          traditionalWithdrawal = Math.min(rmdRequired, traditional);
          traditional -= traditionalWithdrawal;
          incomeNeeded -= traditionalWithdrawal;
        }

        // Step 3: Optimize remaining withdrawals
        // Calculate provisional income so far
        let provisionalIncome = (ssThisYear * 0.5) + pensionThisYear + otherThisYear + traditionalWithdrawal;
        
        // Calculate taxable SS
        const ssTaxable = calculateSSTaxable(provisionalIncome + (incomeNeeded > 0 ? incomeNeeded * 0.5 : 0), ssThisYear);
        
        // Current taxable income estimate
        let currentTaxableIncome = ssTaxable + pensionThisYear + otherThisYear + traditionalWithdrawal;
        
        // Get current marginal bracket
        const currentBracket = getMarginalBracket(Math.max(0, currentTaxableIncome - standardDeduction));
        
        // If in low bracket and have room, consider Roth conversion
        if (useRothConversions && traditional > 0 && age < 73) {
          const top22Bracket = filingStatus === 'married' ? 201050 : 100525;
          const roomInLowBrackets = Math.max(0, top22Bracket - currentTaxableIncome + standardDeduction);
          
          if (roomInLowBrackets > 0 && currentBracket.rate <= 0.22) {
            const conversionAmount = Math.min(
              roomInLowBrackets,
              rothConversionLimit,
              traditional
            );
            if (conversionAmount > 5000) { // Only convert if meaningful amount
              rothConversion = conversionAmount;
              traditional -= conversionAmount;
              roth += conversionAmount;
              lifetimeRothConversions += conversionAmount;
              currentTaxableIncome += conversionAmount;
            }
          }
        }

        // Step 4: Fill remaining income need
        if (incomeNeeded > 0) {
          // Use taxable account first (only gains taxed at lower rate)
          if (taxable > 0 && incomeNeeded > 0) {
            const fromTaxable = Math.min(taxable, incomeNeeded);
            taxableWithdrawal = fromTaxable;
            taxable -= fromTaxable;
            incomeNeeded -= fromTaxable;
            // Assume 30% cost basis, so 70% is taxable gains
            currentTaxableIncome += fromTaxable * 0.7 * 0.15 / currentBracket.rate; // Convert cap gains to equivalent ordinary income
          }

          // Then traditional (if needed and in lower bracket)
          if (traditional > 0 && incomeNeeded > 0 && currentBracket.rate <= 0.22) {
            const fromTraditional = Math.min(traditional, incomeNeeded);
            traditionalWithdrawal += fromTraditional;
            traditional -= fromTraditional;
            incomeNeeded -= fromTraditional;
            currentTaxableIncome += fromTraditional;
          }

          // Finally Roth (tax-free, save for higher bracket years or later)
          if (roth > 0 && incomeNeeded > 0) {
            rothWithdrawal = Math.min(roth, incomeNeeded);
            roth -= rothWithdrawal;
            incomeNeeded -= rothWithdrawal;
          }

          // If still need more, take from traditional
          if (traditional > 0 && incomeNeeded > 0) {
            const additional = Math.min(traditional, incomeNeeded);
            traditionalWithdrawal += additional;
            traditional -= additional;
            incomeNeeded -= additional;
            currentTaxableIncome += additional;
          }
        }

        // Calculate taxes
        const adjustedGrossIncome = ssTaxable + pensionThisYear + otherThisYear + traditionalWithdrawal + rothConversion;
        const federalTaxableIncome = Math.max(0, adjustedGrossIncome - standardDeduction);
        const federalTax = calculateFederalTax(federalTaxableIncome);
        const stateTax = (adjustedGrossIncome - standardDeduction * 0.5) * (stateTaxRate / 100);
        const totalTax = federalTax + Math.max(0, stateTax) + (taxableWithdrawal * 0.7 * 0.15); // Add cap gains tax
        
        lifetimeTaxes += totalTax;

        // Apply growth
        traditional *= (1 + expectedReturn / 100);
        roth *= (1 + expectedReturn / 100);
        taxable *= (1 + expectedReturn / 100);
        hsa *= (1 + expectedReturn / 100);

        yearlyData.push({
          year: year + 1,
          age,
          traditional: Math.round(traditional),
          roth: Math.round(roth),
          taxable: Math.round(taxable),
          hsa: Math.round(hsa),
          total: Math.round(traditional + roth + taxable + hsa),
          withdrawals: {
            traditional: Math.round(traditionalWithdrawal),
            roth: Math.round(rothWithdrawal),
            taxable: Math.round(taxableWithdrawal),
            hsa: Math.round(hsaWithdrawal)
          },
          rmd: Math.round(rmdRequired),
          rothConversion: Math.round(rothConversion),
          federalTax: Math.round(federalTax),
          stateTax: Math.round(Math.max(0, stateTax)),
          totalTax: Math.round(totalTax),
          marginalRate: currentBracket.rate,
          ssIncome: Math.round(ssThisYear),
          effectiveRate: adjustedGrossIncome > 0 ? (totalTax / adjustedGrossIncome * 100) : 0
        });
      }

      // Generate recommendations
      if (lifetimeRothConversions > 0) {
        recommendations.push(`Consider converting $${(lifetimeRothConversions / 1000).toFixed(0)}K to Roth over the next ${Math.min(73 - currentAge, yearsInRetirement)} years to reduce future RMDs and taxes.`);
      }
      
      const avgTaxRate = lifetimeTaxes / (annualSpending * yearsInRetirement) * 100;
      if (avgTaxRate > 15) {
        recommendations.push('Your average tax rate is above 15%. Consider accelerating Roth conversions in lower-income years.');
      }

      if (currentAge < ssStartAge && ssStartAge < 70) {
        recommendations.push(`Delaying Social Security from age ${ssStartAge} to 70 could increase benefits by ${((70 - ssStartAge) * 8)}%.`);
      }

      return {
        yearlyData,
        lifetimeTaxes: Math.round(lifetimeTaxes),
        lifetimeRothConversions: Math.round(lifetimeRothConversions),
        endingBalance: Math.round(traditional + roth + taxable + hsa),
        recommendations
      };
    };

    const optimized = simulateOptimized();

    // Calculate tax bracket utilization
    const bracketUtilization = brackets.map(bracket => {
      const bracketSize = bracket.max - bracket.min;
      return {
        rate: `${(bracket.rate * 100).toFixed(0)}%`,
        min: bracket.min,
        max: bracket.max === Infinity ? 'Unlimited' : bracket.max,
        size: bracketSize === Infinity ? 0 : bracketSize
      };
    });

    return {
      optimized,
      bracketUtilization,
      standardDeduction,
      rmdStartAge: 73
    };
  }, [
    traditionalBalance, rothBalance, taxableBalance, hsaBalance,
    socialSecurityBenefit, pensionIncome, otherIncome,
    currentAge, ssStartAge, lifeExpectancy, annualSpending, healthcareCosts,
    filingStatus, stateTaxRate, useRothConversions, rothConversionLimit,
    expectedReturn, inflationRate
  ]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Scale className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Tax-Aware Withdrawal Optimizer</h2>
          <p className="text-muted-foreground">
            Minimize lifetime taxes considering RMDs, Social Security, and tax brackets
          </p>
        </div>
      </div>

      <Tabs defaultValue="setup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="projection">Year-by-Year</TabsTrigger>
          <TabsTrigger value="analysis">Tax Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Account Balances */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Balances</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Traditional IRA/401(k)</Label>
                  <Input
                    type="number"
                    value={traditionalBalance}
                    onChange={(e) => setTraditionalBalance(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Subject to RMDs at age 73</p>
                </div>
                <div className="space-y-2">
                  <Label>Roth IRA/401(k)</Label>
                  <Input
                    type="number"
                    value={rothBalance}
                    onChange={(e) => setRothBalance(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Taxable Brokerage</Label>
                  <Input
                    type="number"
                    value={taxableBalance}
                    onChange={(e) => setTaxableBalance(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>HSA Balance</Label>
                  <Input
                    type="number"
                    value={hsaBalance}
                    onChange={(e) => setHsaBalance(Number(e.target.value))}
                  />
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <div className="flex justify-between">
                    <span className="font-medium">Total Portfolio</span>
                    <span className="font-bold">
                      {formatCurrency(traditionalBalance + rothBalance + taxableBalance + hsaBalance)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Income Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Income Sources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Social Security (annual)</Label>
                  <Input
                    type="number"
                    value={socialSecurityBenefit}
                    onChange={(e) => setSocialSecurityBenefit(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>SS Start Age: {ssStartAge}</Label>
                  <Slider
                    value={[ssStartAge]}
                    onValueChange={(v) => setSsStartAge(v[0])}
                    min={62}
                    max={70}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pension (annual)</Label>
                  <Input
                    type="number"
                    value={pensionIncome}
                    onChange={(e) => setPensionIncome(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Other Income (annual)</Label>
                  <Input
                    type="number"
                    value={otherIncome}
                    onChange={(e) => setOtherIncome(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Healthcare Costs (annual)</Label>
                  <Input
                    type="number"
                    value={healthcareCosts}
                    onChange={(e) => setHealthcareCosts(Number(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Retirement Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Annual Spending Need</Label>
                  <Input
                    type="number"
                    value={annualSpending}
                    onChange={(e) => setAnnualSpending(Number(e.target.value))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Age: {currentAge}</Label>
                    <Slider
                      value={[currentAge]}
                      onValueChange={(v) => setCurrentAge(v[0])}
                      min={55}
                      max={80}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Life Exp: {lifeExpectancy}</Label>
                    <Slider
                      value={[lifeExpectancy]}
                      onValueChange={(v) => setLifeExpectancy(v[0])}
                      min={75}
                      max={100}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Filing Status</Label>
                  <Select value={filingStatus} onValueChange={(v) => setFilingStatus(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married Filing Jointly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>State Tax Rate: {stateTaxRate}%</Label>
                  <Slider
                    value={[stateTaxRate]}
                    onValueChange={(v) => setStateTaxRate(v[0])}
                    min={0}
                    max={13}
                    step={0.5}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Roth Conversions</Label>
                  <Switch checked={useRothConversions} onCheckedChange={setUseRothConversions} />
                </div>
                {useRothConversions && (
                  <div className="space-y-2">
                    <Label>Max Conversion/Year</Label>
                    <Input
                      type="number"
                      value={rothConversionLimit}
                      onChange={(e) => setRothConversionLimit(Number(e.target.value))}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Lifetime Taxes</p>
                    <p className="text-2xl font-bold">{formatCurrency(calculations.optimized.lifetimeTaxes)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingDown className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Roth Conversions</p>
                    <p className="text-2xl font-bold">{formatCurrency(calculations.optimized.lifetimeRothConversions)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ending Balance</p>
                    <p className="text-2xl font-bold">{formatCurrency(calculations.optimized.endingBalance)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Percent className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Tax Rate</p>
                    <p className="text-2xl font-bold">
                      {((calculations.optimized.lifetimeTaxes / (annualSpending * (lifeExpectancy - currentAge))) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Balance Over Time</CardTitle>
              <CardDescription>How your accounts evolve through retirement with optimized withdrawals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={calculations.optimized.yearlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="age" />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                    <Area type="monotone" dataKey="traditional" name="Traditional" stackId="1" fill="#3b82f6" stroke="#3b82f6" />
                    <Area type="monotone" dataKey="roth" name="Roth" stackId="1" fill="#8b5cf6" stroke="#8b5cf6" />
                    <Area type="monotone" dataKey="taxable" name="Taxable" stackId="1" fill="#10b981" stroke="#10b981" />
                    <Area type="monotone" dataKey="hsa" name="HSA" stackId="1" fill="#f59e0b" stroke="#f59e0b" />
                    <ReferenceLine x={73} stroke="#ef4444" label={{ value: 'RMDs Start', fill: '#ef4444' }} />
                    <ReferenceLine x={ssStartAge} stroke="#22c55e" label={{ value: 'SS Starts', fill: '#22c55e' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Annual Withdrawals & Taxes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={calculations.optimized.yearlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="age" />
                    <YAxis yAxisId="left" tickFormatter={(v) => formatCurrency(v)} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(v: number, name: string) => 
                      name === 'Effective Tax Rate' ? `${v.toFixed(1)}%` : formatCurrency(v)
                    } />
                    <Legend />
                    <Bar yAxisId="left" dataKey="rmd" name="RMD Required" fill="#ef4444" />
                    <Bar yAxisId="left" dataKey="rothConversion" name="Roth Conversion" fill="#8b5cf6" />
                    <Bar yAxisId="left" dataKey="totalTax" name="Total Tax" fill="#f97316" />
                    <Line yAxisId="right" type="monotone" dataKey="effectiveRate" name="Effective Tax Rate" stroke="#22c55e" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Tax Bracket Utilization
                </CardTitle>
                <CardDescription>Current federal tax brackets ({filingStatus === 'married' ? 'MFJ' : 'Single'})</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {calculations.bracketUtilization.slice(0, 5).map((bracket, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Badge variant={i < 2 ? 'default' : i < 4 ? 'secondary' : 'destructive'}>
                          {bracket.rate}
                        </Badge>
                        <span className="text-sm">
                          {formatCurrency(bracket.min)} - {typeof bracket.max === 'string' ? bracket.max : formatCurrency(bracket.max)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-green-500/10 rounded-lg">
                  <p className="text-sm">
                    <strong>Strategy:</strong> Fill the 22% bracket or lower with traditional withdrawals and Roth conversions to minimize future RMDs and taxes.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Social Security Taxation</CardTitle>
                <CardDescription>Up to 85% of SS can be taxable based on provisional income</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground mb-2">Provisional Income Thresholds ({filingStatus === 'married' ? 'MFJ' : 'Single'})</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>0% taxable:</span>
                        <span className="font-medium">Below {formatCurrency(SS_TAX_THRESHOLDS[filingStatus].base)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Up to 50% taxable:</span>
                        <span className="font-medium">{formatCurrency(SS_TAX_THRESHOLDS[filingStatus].base)} - {formatCurrency(SS_TAX_THRESHOLDS[filingStatus].additional)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Up to 85% taxable:</span>
                        <span className="font-medium">Above {formatCurrency(SS_TAX_THRESHOLDS[filingStatus].additional)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                    <p className="text-xs">
                      Provisional income = AGI + tax-exempt interest + 50% of SS benefits. Strategic withdrawals can minimize SS taxation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>RMD Schedule</CardTitle>
              <CardDescription>Required Minimum Distributions starting at age 73 (SECURE 2.0 Act)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="flex gap-2 pb-2">
                  {calculations.optimized.yearlyData
                    .filter(d => d.age >= 73 && d.age <= 85)
                    .map(d => (
                      <div key={d.age} className="min-w-[80px] p-3 rounded-lg bg-muted text-center">
                        <p className="text-xs text-muted-foreground">Age {d.age}</p>
                        <p className="font-bold text-sm">{formatCurrency(d.rmd)}</p>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Personalized Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {calculations.optimized.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{rec}</p>
                  </div>
                ))}
                
                <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Roth Conversion Window</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      The years between retirement and age 73 (when RMDs start) are your prime Roth conversion window. 
                      Consider converting enough each year to fill up the 22% bracket or lower.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <Building className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Consider Your State</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Some states don't tax retirement income. If you're in a high-tax state ({stateTaxRate}%), 
                      relocating could save {formatCurrency(calculations.optimized.lifetimeTaxes * (stateTaxRate / (stateTaxRate + 20)))} in state taxes.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
