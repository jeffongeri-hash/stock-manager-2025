import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend, BarChart, Bar } from 'recharts';
import { Heart, DollarSign, TrendingUp, PiggyBank, Calculator, Gift, Shield, Info } from 'lucide-react';

// 2024 HSA Contribution Limits
const HSA_LIMITS_2024 = {
  individual: 4150,
  family: 8300,
  catchUp: 1000 // Age 55+
};

// 2025 HSA Contribution Limits
const HSA_LIMITS_2025 = {
  individual: 4300,
  family: 8550,
  catchUp: 1000
};

const HEALTHCARE_INFLATION = 5.5; // 5.5% average healthcare cost inflation

export function HSACalculator() {
  const [currentAge, setCurrentAge] = useState(35);
  const [retirementAge, setRetirementAge] = useState(65);
  const [coverage, setCoverage] = useState<'individual' | 'family'>('family');
  const [currentBalance, setCurrentBalance] = useState(10000);
  const [annualContribution, setAnnualContribution] = useState(8300);
  const [employerContribution, setEmployerContribution] = useState(1000);
  const [expectedReturn, setExpectedReturn] = useState(7);
  const [annualHealthcareSpend, setAnnualHealthcareSpend] = useState(3000);
  const [payHealthcareFromHSA, setPayHealthcareFromHSA] = useState(false);
  const [taxBracket, setTaxBracket] = useState(22);
  const [stateTaxRate, setStateTaxRate] = useState(5);
  const [currentHealthcareCosts, setCurrentHealthcareCosts] = useState(5000);

  const calculations = useMemo(() => {
    const yearsToRetirement = retirementAge - currentAge;
    const limits = HSA_LIMITS_2024;
    const maxContribution = coverage === 'individual' ? limits.individual : limits.family;
    const catchUpEligibleAge = 55;
    
    // Project HSA balance over time
    const projectionData = [];
    let balance = currentBalance;
    let totalContributions = currentBalance;
    let totalTaxSavings = 0;
    let totalGrowth = 0;

    for (let year = 0; year <= yearsToRetirement + 25; year++) {
      const age = currentAge + year;
      const isRetired = age >= retirementAge;
      
      // Calculate contribution (only pre-retirement)
      let yearContribution = 0;
      let yearEmployerContribution = 0;
      
      if (!isRetired) {
        const catchUp = age >= catchUpEligibleAge ? limits.catchUp : 0;
        yearContribution = Math.min(annualContribution, maxContribution + catchUp);
        yearEmployerContribution = employerContribution;
        totalContributions += yearContribution + yearEmployerContribution;
      }

      // Calculate healthcare costs with inflation
      const healthcareCost = isRetired 
        ? currentHealthcareCosts * Math.pow(1 + HEALTHCARE_INFLATION / 100, age - currentAge)
        : payHealthcareFromHSA ? annualHealthcareSpend : 0;

      // Calculate tax savings
      const contributionTaxSavings = (yearContribution + yearEmployerContribution) * ((taxBracket + stateTaxRate) / 100);
      totalTaxSavings += contributionTaxSavings;

      // Apply growth
      const previousBalance = balance;
      balance = balance * (1 + expectedReturn / 100);
      
      // Add contributions
      balance += yearContribution + yearEmployerContribution;
      
      // Subtract healthcare if paying from HSA
      if (payHealthcareFromHSA || isRetired) {
        balance = Math.max(0, balance - healthcareCost);
      }

      totalGrowth = balance - totalContributions;

      projectionData.push({
        year,
        age,
        balance: Math.round(balance),
        contributions: Math.round(totalContributions),
        growth: Math.round(totalGrowth),
        healthcareCost: Math.round(healthcareCost),
        taxSavings: Math.round(totalTaxSavings),
        phase: isRetired ? 'Retirement' : 'Accumulation'
      });
    }

    // Calculate tax advantages
    const tripleAdvantage = {
      contributionSavings: totalTaxSavings,
      growthSavings: totalGrowth * ((taxBracket + stateTaxRate) / 100), // Tax-free growth
      withdrawalSavings: 0 // Tax-free for qualified expenses - hard to calculate
    };

    // Calculate vs taxable account comparison
    const taxableComparison = [];
    let hsaBalance = currentBalance;
    let taxableBalance = currentBalance;
    
    for (let year = 0; year <= yearsToRetirement; year++) {
      const age = currentAge + year;
      const catchUp = age >= catchUpEligibleAge ? limits.catchUp : 0;
      const contribution = Math.min(annualContribution, maxContribution + catchUp) + employerContribution;
      
      // HSA grows tax-free
      hsaBalance = hsaBalance * (1 + expectedReturn / 100) + contribution;
      
      // Taxable account: contribute after-tax, pay tax on dividends annually
      const afterTaxContribution = contribution * (1 - (taxBracket + stateTaxRate) / 100);
      const dividendYield = 0.02;
      const dividendTax = taxableBalance * dividendYield * (taxBracket / 100);
      taxableBalance = (taxableBalance * (1 + expectedReturn / 100)) + afterTaxContribution - dividendTax;
      
      taxableComparison.push({
        year,
        age,
        hsa: Math.round(hsaBalance),
        taxable: Math.round(taxableBalance),
        advantage: Math.round(hsaBalance - taxableBalance)
      });
    }

    // Calculate retirement healthcare needs
    const retirementHealthcareCosts = [];
    let cumulativeCost = 0;
    
    for (let age = 65; age <= 95; age++) {
      const yearCost = currentHealthcareCosts * Math.pow(1 + HEALTHCARE_INFLATION / 100, age - currentAge);
      cumulativeCost += yearCost;
      
      retirementHealthcareCosts.push({
        age,
        annualCost: Math.round(yearCost),
        cumulativeCost: Math.round(cumulativeCost)
      });
    }

    // Final metrics
    const balanceAtRetirement = projectionData.find(d => d.age === retirementAge)?.balance || 0;
    const totalHealthcareNeeded = retirementHealthcareCosts[retirementHealthcareCosts.length - 1]?.cumulativeCost || 0;
    const yearsCovered = Math.floor(balanceAtRetirement / (currentHealthcareCosts * Math.pow(1 + HEALTHCARE_INFLATION / 100, retirementAge - currentAge)));

    return {
      projectionData,
      taxableComparison,
      retirementHealthcareCosts,
      balanceAtRetirement,
      totalTaxSavings,
      totalContributions,
      totalGrowth,
      totalHealthcareNeeded,
      yearsCovered,
      maxContribution,
      tripleAdvantage
    };
  }, [currentAge, retirementAge, coverage, currentBalance, annualContribution, employerContribution, expectedReturn, annualHealthcareSpend, payHealthcareFromHSA, taxBracket, stateTaxRate, currentHealthcareCosts]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">HSA Calculator</h2>
      </div>
      
      <p className="text-muted-foreground">
        Plan your Health Savings Account contributions and project tax-advantaged healthcare savings for retirement.
      </p>

      <Tabs defaultValue="calculator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="projection">Growth Projection</TabsTrigger>
          <TabsTrigger value="comparison">HSA vs Taxable</TabsTrigger>
          <TabsTrigger value="guide">HSA Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  HSA Inputs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Age: {currentAge}</Label>
                  <Slider
                    value={[currentAge]}
                    onValueChange={(v) => setCurrentAge(v[0])}
                    min={18}
                    max={64}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Retirement Age: {retirementAge}</Label>
                  <Slider
                    value={[retirementAge]}
                    onValueChange={(v) => setRetirementAge(v[0])}
                    min={55}
                    max={70}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Coverage Type</Label>
                  <Select value={coverage} onValueChange={(v) => setCoverage(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual ({formatCurrency(HSA_LIMITS_2024.individual)}/yr)</SelectItem>
                      <SelectItem value="family">Family ({formatCurrency(HSA_LIMITS_2024.family)}/yr)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Current HSA Balance</Label>
                  <Input
                    type="number"
                    value={currentBalance}
                    onChange={(e) => setCurrentBalance(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Annual Contribution (Max: {formatCurrency(calculations.maxContribution + (currentAge >= 55 ? HSA_LIMITS_2024.catchUp : 0))})</Label>
                  <Input
                    type="number"
                    value={annualContribution}
                    onChange={(e) => setAnnualContribution(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Employer Contribution</Label>
                  <Input
                    type="number"
                    value={employerContribution}
                    onChange={(e) => setEmployerContribution(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Expected Return: {expectedReturn}%</Label>
                  <Slider
                    value={[expectedReturn]}
                    onValueChange={(v) => setExpectedReturn(v[0])}
                    min={0}
                    max={12}
                    step={0.5}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Tax & Healthcare Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Federal Tax Bracket: {taxBracket}%</Label>
                  <Slider
                    value={[taxBracket]}
                    onValueChange={(v) => setTaxBracket(v[0])}
                    min={10}
                    max={37}
                    step={1}
                  />
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

                <div className="space-y-2">
                  <Label>Current Annual Healthcare Spending</Label>
                  <Input
                    type="number"
                    value={annualHealthcareSpend}
                    onChange={(e) => setAnnualHealthcareSpend(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Expected Retirement Healthcare Costs (Annual)</Label>
                  <Input
                    type="number"
                    value={currentHealthcareCosts}
                    onChange={(e) => setCurrentHealthcareCosts(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Medicare premiums + out-of-pocket expenses</p>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <Label>Pay Healthcare from HSA Now?</Label>
                    <p className="text-xs text-muted-foreground">
                      Let HSA grow tax-free by paying out-of-pocket
                    </p>
                  </div>
                  <Switch
                    checked={payHealthcareFromHSA}
                    onCheckedChange={setPayHealthcareFromHSA}
                  />
                </div>

                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="font-medium text-primary mb-2">Triple Tax Advantage</p>
                  <div className="space-y-1 text-sm">
                    <p>✓ Tax-deductible contributions</p>
                    <p>✓ Tax-free growth</p>
                    <p>✓ Tax-free withdrawals for medical</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="pt-6">
                <div className="text-center">
                  <PiggyBank className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Balance at Retirement</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(calculations.balanceAtRetirement)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Gift className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm text-muted-foreground">Total Tax Savings</p>
                  <p className="text-3xl font-bold text-green-500">
                    {formatCurrency(calculations.totalTaxSavings)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-sm text-muted-foreground">Investment Growth</p>
                  <p className="text-3xl font-bold text-blue-500">
                    {formatCurrency(calculations.totalGrowth)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-sm text-muted-foreground">Years of Healthcare Covered</p>
                  <p className="text-3xl font-bold text-purple-500">
                    ~{calculations.yearsCovered} years
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 2024 Contribution Limits */}
          <Card>
            <CardHeader>
              <CardTitle>2024 & 2025 HSA Contribution Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Individual Coverage</p>
                  <p className="text-2xl font-bold">{formatCurrency(HSA_LIMITS_2024.individual)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    2025: {formatCurrency(HSA_LIMITS_2025.individual)}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Family Coverage</p>
                  <p className="text-2xl font-bold">{formatCurrency(HSA_LIMITS_2024.family)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    2025: {formatCurrency(HSA_LIMITS_2025.family)}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Catch-Up (55+)</p>
                  <p className="text-2xl font-bold">+{formatCurrency(HSA_LIMITS_2024.catchUp)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Additional contribution allowed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>HSA Balance Projection</CardTitle>
              <CardDescription>
                Projected HSA growth through retirement (assumes {HEALTHCARE_INFLATION}% healthcare inflation)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={calculations.projectionData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="age" label={{ value: 'Age', position: 'bottom', offset: -5 }} />
                    <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="contributions" 
                      name="Contributions" 
                      stackId="1"
                      fill="hsl(var(--chart-2))" 
                      stroke="hsl(var(--chart-2))"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="growth" 
                      name="Investment Growth" 
                      stackId="1"
                      fill="hsl(var(--primary))" 
                      stroke="hsl(var(--primary))"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Retirement Healthcare Costs</CardTitle>
              <CardDescription>Projected healthcare expenses in retirement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={calculations.retirementHealthcareCosts}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="age" />
                    <YAxis 
                      yAxisId="left"
                      tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} 
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`}
                    />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="annualCost" 
                      name="Annual Cost"
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="cumulativeCost" 
                      name="Cumulative Cost"
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>HSA vs Taxable Account</CardTitle>
              <CardDescription>
                Comparison of same contributions invested in HSA vs taxable brokerage account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={calculations.taxableComparison}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="age" />
                    <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="hsa" 
                      name="HSA (Tax-Free)"
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="taxable" 
                      name="Taxable Account"
                      stroke="hsl(var(--muted-foreground))" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardHeader>
              <CardTitle className="text-green-600">HSA Advantage at Retirement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-sm text-muted-foreground">HSA Balance</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(calculations.taxableComparison[calculations.taxableComparison.length - 1]?.hsa || 0)}
                  </p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-sm text-muted-foreground">Taxable Balance</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(calculations.taxableComparison[calculations.taxableComparison.length - 1]?.taxable || 0)}
                  </p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-sm text-muted-foreground">HSA Advantage</p>
                  <p className="text-2xl font-bold text-green-500">
                    +{formatCurrency(calculations.taxableComparison[calculations.taxableComparison.length - 1]?.advantage || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guide" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  HSA Eligibility Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">High-Deductible Health Plan (HDHP)</p>
                  <p className="text-sm text-muted-foreground">
                    2024: Min deductible $1,600 (individual) / $3,200 (family)
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">No Other Health Coverage</p>
                  <p className="text-sm text-muted-foreground">
                    Cannot be covered by non-HDHP health plan, Medicare, or claimed as dependent
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">Out-of-Pocket Maximum</p>
                  <p className="text-sm text-muted-foreground">
                    2024: Max $8,050 (individual) / $16,100 (family)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  HSA Investment Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">1</Badge>
                  <div>
                    <p className="font-medium">Max Out Contributions</p>
                    <p className="text-sm text-muted-foreground">
                      Contribute the maximum allowed each year for full tax benefits.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">2</Badge>
                  <div>
                    <p className="font-medium">Invest in Index Funds</p>
                    <p className="text-sm text-muted-foreground">
                      Choose low-cost index funds for long-term growth.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">3</Badge>
                  <div>
                    <p className="font-medium">Pay Out-of-Pocket Now</p>
                    <p className="text-sm text-muted-foreground">
                      Let HSA grow tax-free; save receipts for future reimbursement.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">4</Badge>
                  <div>
                    <p className="font-medium">Use in Retirement</p>
                    <p className="text-sm text-muted-foreground">
                      After 65, can withdraw for any purpose (taxed as income), medical is still tax-free.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Qualified Medical Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-muted rounded">Doctor visits</div>
                  <div className="p-2 bg-muted rounded">Prescriptions</div>
                  <div className="p-2 bg-muted rounded">Dental care</div>
                  <div className="p-2 bg-muted rounded">Vision care</div>
                  <div className="p-2 bg-muted rounded">Mental health</div>
                  <div className="p-2 bg-muted rounded">Physical therapy</div>
                  <div className="p-2 bg-muted rounded">Lab tests</div>
                  <div className="p-2 bg-muted rounded">Medical equipment</div>
                  <div className="p-2 bg-muted rounded">Long-term care premiums</div>
                  <div className="p-2 bg-muted rounded">Medicare premiums (65+)</div>
                  <div className="p-2 bg-muted rounded">COBRA premiums</div>
                  <div className="p-2 bg-muted rounded">Hearing aids</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>HSA vs FSA Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Feature</th>
                        <th className="text-center py-2">HSA</th>
                        <th className="text-center py-2">FSA</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">Rollover</td>
                        <td className="text-center py-2 text-green-500">✓ Yes</td>
                        <td className="text-center py-2 text-destructive">Limited</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Portable</td>
                        <td className="text-center py-2 text-green-500">✓ Yes</td>
                        <td className="text-center py-2 text-destructive">✗ No</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Investment</td>
                        <td className="text-center py-2 text-green-500">✓ Yes</td>
                        <td className="text-center py-2 text-destructive">✗ No</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Employer Contribution</td>
                        <td className="text-center py-2 text-green-500">✓ Allowed</td>
                        <td className="text-center py-2 text-green-500">✓ Allowed</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">HDHP Required</td>
                        <td className="text-center py-2">Yes</td>
                        <td className="text-center py-2">No</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
