import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, AreaChart, Area } from 'recharts';
import { ArrowDownUp, DollarSign, Percent, TrendingDown, Info, Calculator, Layers, PiggyBank } from 'lucide-react';

// 2024 Tax Brackets
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

const CHART_COLORS = {
  taxable: 'hsl(var(--chart-1))',
  traditional: 'hsl(var(--chart-2))',
  roth: 'hsl(var(--chart-3))',
  hsa: 'hsl(var(--chart-4))',
  taxes: 'hsl(var(--destructive))'
};

export function WithdrawalStrategyPlanner() {
  const [taxableBalance, setTaxableBalance] = useState(200000);
  const [traditionalBalance, setTraditionalBalance] = useState(500000);
  const [rothBalance, setRothBalance] = useState(150000);
  const [hsaBalance, setHsaBalance] = useState(50000);
  const [annualNeed, setAnnualNeed] = useState(80000);
  const [socialSecurity, setSocialSecurity] = useState(24000);
  const [pension, setPension] = useState(0);
  const [currentAge, setCurrentAge] = useState(65);
  const [lifeExpectancy, setLifeExpectancy] = useState(90);
  const [filingStatus, setFilingStatus] = useState<'single' | 'married'>('married');
  const [expectedReturn, setExpectedReturn] = useState(5);
  const [healthcareCosts, setHealthcareCosts] = useState(8000);

  const calculations = useMemo(() => {
    const yearsInRetirement = lifeExpectancy - currentAge;
    const brackets = TAX_BRACKETS_2024[filingStatus];
    const standardDeduction = currentAge >= 65 
      ? STANDARD_DEDUCTION_2024[`${filingStatus}65`] 
      : STANDARD_DEDUCTION_2024[filingStatus];

    // Calculate tax on given income
    const calculateTax = (taxableIncome: number) => {
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

    // Get marginal tax rate
    const getMarginalRate = (taxableIncome: number) => {
      for (const bracket of brackets) {
        if (taxableIncome <= bracket.max) return bracket.rate;
      }
      return 0.37;
    };

    // Simulate different withdrawal strategies
    const simulateStrategy = (strategy: 'traditional_first' | 'roth_first' | 'tax_optimized' | 'proportional') => {
      let taxable = taxableBalance;
      let traditional = traditionalBalance;
      let roth = rothBalance;
      let hsa = hsaBalance;
      const yearlyData = [];
      let totalTaxesPaid = 0;

      for (let year = 0; year < yearsInRetirement; year++) {
        const age = currentAge + year;
        const needAfterGuaranteed = Math.max(0, annualNeed - socialSecurity - pension);
        const healthcareNeed = healthcareCosts * Math.pow(1.055, year); // Healthcare inflation
        
        let withdrawals = { taxable: 0, traditional: 0, roth: 0, hsa: 0 };
        let remaining = needAfterGuaranteed;

        // HSA first for healthcare (tax-free for qualified expenses)
        if (hsa > 0 && healthcareNeed > 0) {
          const hsaWithdrawal = Math.min(hsa, healthcareNeed);
          withdrawals.hsa = hsaWithdrawal;
          hsa -= hsaWithdrawal;
        }

        if (strategy === 'traditional_first') {
          // Withdraw from traditional first, then taxable, then Roth
          if (remaining > 0 && traditional > 0) {
            const w = Math.min(traditional, remaining);
            withdrawals.traditional = w;
            traditional -= w;
            remaining -= w;
          }
          if (remaining > 0 && taxable > 0) {
            const w = Math.min(taxable, remaining);
            withdrawals.taxable = w;
            taxable -= w;
            remaining -= w;
          }
          if (remaining > 0 && roth > 0) {
            const w = Math.min(roth, remaining);
            withdrawals.roth = w;
            roth -= w;
            remaining -= w;
          }
        } else if (strategy === 'roth_first') {
          // Withdraw from Roth first, then taxable, then traditional
          if (remaining > 0 && roth > 0) {
            const w = Math.min(roth, remaining);
            withdrawals.roth = w;
            roth -= w;
            remaining -= w;
          }
          if (remaining > 0 && taxable > 0) {
            const w = Math.min(taxable, remaining);
            withdrawals.taxable = w;
            taxable -= w;
            remaining -= w;
          }
          if (remaining > 0 && traditional > 0) {
            const w = Math.min(traditional, remaining);
            withdrawals.traditional = w;
            traditional -= w;
            remaining -= w;
          }
        } else if (strategy === 'tax_optimized') {
          // Fill up low tax brackets with traditional, use Roth for rest
          const taxableFromSS = socialSecurity * 0.85; // Up to 85% of SS can be taxable
          const currentTaxableIncome = taxableFromSS + pension;
          
          // Calculate room in lower brackets (up to 22% bracket)
          const targetBracket = filingStatus === 'married' ? 201050 : 100525;
          const bracketRoom = Math.max(0, targetBracket - currentTaxableIncome + standardDeduction);
          
          // Fill bracket with traditional
          if (remaining > 0 && traditional > 0) {
            const traditionalToFillBracket = Math.min(traditional, bracketRoom, remaining);
            withdrawals.traditional = traditionalToFillBracket;
            traditional -= traditionalToFillBracket;
            remaining -= traditionalToFillBracket;
          }
          
          // Use taxable next (only gains taxed, usually at lower rate)
          if (remaining > 0 && taxable > 0) {
            const w = Math.min(taxable, remaining);
            withdrawals.taxable = w;
            taxable -= w;
            remaining -= w;
          }
          
          // Use Roth for remainder (tax-free)
          if (remaining > 0 && roth > 0) {
            const w = Math.min(roth, remaining);
            withdrawals.roth = w;
            roth -= w;
            remaining -= w;
          }
          
          // If still need more, take from traditional
          if (remaining > 0 && traditional > 0) {
            const w = Math.min(traditional, remaining);
            withdrawals.traditional += w;
            traditional -= w;
            remaining -= w;
          }
        } else {
          // Proportional withdrawal
          const total = taxable + traditional + roth;
          if (total > 0) {
            const taxableRatio = taxable / total;
            const traditionalRatio = traditional / total;
            const rothRatio = roth / total;
            
            withdrawals.taxable = Math.min(taxable, remaining * taxableRatio);
            withdrawals.traditional = Math.min(traditional, remaining * traditionalRatio);
            withdrawals.roth = Math.min(roth, remaining * rothRatio);
            
            taxable -= withdrawals.taxable;
            traditional -= withdrawals.traditional;
            roth -= withdrawals.roth;
          }
        }

        // Calculate taxes
        const taxableFromSS = socialSecurity * 0.85;
        const taxableIncome = taxableFromSS + pension + withdrawals.traditional + (withdrawals.taxable * 0.15); // Assume 15% of taxable is gains
        const adjustedIncome = Math.max(0, taxableIncome - standardDeduction);
        const yearTax = calculateTax(adjustedIncome);
        totalTaxesPaid += yearTax;

        // Apply growth to remaining balances
        taxable *= (1 + expectedReturn / 100);
        traditional *= (1 + expectedReturn / 100);
        roth *= (1 + expectedReturn / 100);
        hsa *= (1 + expectedReturn / 100);

        yearlyData.push({
          year: year + 1,
          age,
          taxable: Math.round(taxable),
          traditional: Math.round(traditional),
          roth: Math.round(roth),
          hsa: Math.round(hsa),
          total: Math.round(taxable + traditional + roth + hsa),
          withdrawals,
          tax: Math.round(yearTax),
          marginalRate: getMarginalRate(adjustedIncome)
        });
      }

      return {
        yearlyData,
        totalTaxesPaid: Math.round(totalTaxesPaid),
        endingBalance: Math.round(taxable + traditional + roth + hsa)
      };
    };

    const traditionalFirst = simulateStrategy('traditional_first');
    const rothFirst = simulateStrategy('roth_first');
    const taxOptimized = simulateStrategy('tax_optimized');
    const proportional = simulateStrategy('proportional');

    // Find best strategy
    const strategies = [
      { name: 'Tax-Optimized', data: taxOptimized, key: 'tax_optimized' },
      { name: 'Traditional First', data: traditionalFirst, key: 'traditional_first' },
      { name: 'Roth First', data: rothFirst, key: 'roth_first' },
      { name: 'Proportional', data: proportional, key: 'proportional' }
    ];

    const bestStrategy = strategies.reduce((best, current) => 
      current.data.totalTaxesPaid < best.data.totalTaxesPaid ? current : best
    );

    // Tax comparison data
    const comparisonData = strategies.map(s => ({
      strategy: s.name,
      totalTaxes: s.data.totalTaxesPaid,
      endingBalance: s.data.endingBalance,
      savings: traditionalFirst.totalTaxesPaid - s.data.totalTaxesPaid
    }));

    return {
      strategies,
      bestStrategy,
      comparisonData,
      taxOptimized,
      standardDeduction,
      brackets
    };
  }, [taxableBalance, traditionalBalance, rothBalance, hsaBalance, annualNeed, socialSecurity, pension, currentAge, lifeExpectancy, filingStatus, expectedReturn, healthcareCosts]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <ArrowDownUp className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Tax-Efficient Withdrawal Strategy</h2>
      </div>
      
      <p className="text-muted-foreground">
        Optimize the order of account withdrawals to minimize lifetime taxes and maximize your retirement wealth.
      </p>

      <Tabs defaultValue="inputs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inputs">Account Balances</TabsTrigger>
          <TabsTrigger value="comparison">Strategy Comparison</TabsTrigger>
          <TabsTrigger value="projection">Detailed Projection</TabsTrigger>
          <TabsTrigger value="guide">Strategy Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="inputs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="h-5 w-5" />
                  Account Balances
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Taxable Brokerage Account</Label>
                  <Input
                    type="number"
                    value={taxableBalance}
                    onChange={(e) => setTaxableBalance(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Only gains taxed at capital gains rates</p>
                </div>

                <div className="space-y-2">
                  <Label>Traditional IRA/401(k)</Label>
                  <Input
                    type="number"
                    value={traditionalBalance}
                    onChange={(e) => setTraditionalBalance(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Withdrawals taxed as ordinary income</p>
                </div>

                <div className="space-y-2">
                  <Label>Roth IRA/401(k)</Label>
                  <Input
                    type="number"
                    value={rothBalance}
                    onChange={(e) => setRothBalance(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Tax-free withdrawals</p>
                </div>

                <div className="space-y-2">
                  <Label>HSA Balance</Label>
                  <Input
                    type="number"
                    value={hsaBalance}
                    onChange={(e) => setHsaBalance(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Tax-free for qualified medical expenses</p>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between">
                    <span className="font-medium">Total Portfolio</span>
                    <span className="font-bold text-primary">
                      {formatCurrency(taxableBalance + traditionalBalance + rothBalance + hsaBalance)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Retirement Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Annual Spending Need</Label>
                  <Input
                    type="number"
                    value={annualNeed}
                    onChange={(e) => setAnnualNeed(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Annual Social Security</Label>
                  <Input
                    type="number"
                    value={socialSecurity}
                    onChange={(e) => setSocialSecurity(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Annual Pension</Label>
                  <Input
                    type="number"
                    value={pension}
                    onChange={(e) => setPension(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Annual Healthcare Costs</Label>
                  <Input
                    type="number"
                    value={healthcareCosts}
                    onChange={(e) => setHealthcareCosts(Number(e.target.value))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Current Age: {currentAge}</Label>
                    <Slider
                      value={[currentAge]}
                      onValueChange={(v) => setCurrentAge(v[0])}
                      min={55}
                      max={80}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Life Expectancy: {lifeExpectancy}</Label>
                    <Slider
                      value={[lifeExpectancy]}
                      onValueChange={(v) => setLifeExpectancy(v[0])}
                      min={75}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                    <Label>Expected Return: {expectedReturn}%</Label>
                    <Slider
                      value={[expectedReturn]}
                      onValueChange={(v) => setExpectedReturn(v[0])}
                      min={0}
                      max={10}
                      step={0.5}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Best Strategy Summary */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Recommended Strategy: {calculations.bestStrategy.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-sm text-muted-foreground">Lifetime Taxes</p>
                  <p className="text-2xl font-bold text-destructive">
                    {formatCurrency(calculations.bestStrategy.data.totalTaxesPaid)}
                  </p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-sm text-muted-foreground">Ending Balance</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(calculations.bestStrategy.data.endingBalance)}
                  </p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-sm text-muted-foreground">Tax Savings vs Traditional-First</p>
                  <p className="text-2xl font-bold text-green-500">
                    {formatCurrency(calculations.strategies.find(s => s.key === 'traditional_first')!.data.totalTaxesPaid - calculations.bestStrategy.data.totalTaxesPaid)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Strategy Comparison</CardTitle>
              <CardDescription>Compare lifetime taxes and ending balances across different withdrawal strategies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={calculations.comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="strategy" />
                    <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Bar dataKey="totalTaxes" name="Lifetime Taxes" fill="hsl(var(--destructive))" />
                    <Bar dataKey="endingBalance" name="Ending Balance" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {calculations.strategies.map((strategy) => (
              <Card key={strategy.key} className={strategy.key === calculations.bestStrategy.key ? 'ring-2 ring-primary' : ''}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {strategy.name}
                    {strategy.key === calculations.bestStrategy.key && (
                      <Badge className="ml-2">Best</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Lifetime Taxes</span>
                    <span className="font-medium text-destructive">{formatCurrency(strategy.data.totalTaxesPaid)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ending Balance</span>
                    <span className="font-medium">{formatCurrency(strategy.data.endingBalance)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg Tax/Year</span>
                    <span className="font-medium">{formatCurrency(strategy.data.totalTaxesPaid / (lifeExpectancy - currentAge))}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="projection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Balance Over Time (Tax-Optimized Strategy)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={calculations.taxOptimized.yearlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="age" label={{ value: 'Age', position: 'bottom', offset: -5 }} />
                    <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Area type="monotone" dataKey="taxable" name="Taxable" stackId="1" fill={CHART_COLORS.taxable} stroke={CHART_COLORS.taxable} />
                    <Area type="monotone" dataKey="traditional" name="Traditional" stackId="1" fill={CHART_COLORS.traditional} stroke={CHART_COLORS.traditional} />
                    <Area type="monotone" dataKey="roth" name="Roth" stackId="1" fill={CHART_COLORS.roth} stroke={CHART_COLORS.roth} />
                    <Area type="monotone" dataKey="hsa" name="HSA" stackId="1" fill={CHART_COLORS.hsa} stroke={CHART_COLORS.hsa} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Annual Taxes Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={calculations.taxOptimized.yearlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="age" />
                    <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value, name) => [
                        formatCurrency(value as number),
                        name === 'tax' ? 'Annual Tax' : name
                      ]}
                    />
                    <Bar dataKey="tax" name="Annual Tax" fill="hsl(var(--destructive))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guide" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Withdrawal Order Strategies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="font-medium text-primary">Tax-Optimized (Recommended)</p>
                  <p className="text-sm text-muted-foreground">
                    Fill lower tax brackets with traditional withdrawals, use taxable for moderate needs, 
                    and preserve Roth for higher tax years or legacy. HSA covers healthcare expenses tax-free.
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="font-medium">Traditional First</p>
                  <p className="text-sm text-muted-foreground">
                    Deplete traditional accounts first. May result in higher early-year taxes 
                    but leaves tax-free Roth assets for later years.
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="font-medium">Roth First</p>
                  <p className="text-sm text-muted-foreground">
                    Use Roth first to minimize current taxes. Not typically recommended 
                    as it wastes the tax-free growth potential of Roth assets.
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="font-medium">Proportional</p>
                  <p className="text-sm text-muted-foreground">
                    Withdraw proportionally from all accounts. Provides balance 
                    but doesn't optimize for tax efficiency.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Tax Optimization Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">1</Badge>
                  <div>
                    <p className="font-medium">Fill Low Tax Brackets</p>
                    <p className="text-sm text-muted-foreground">
                      Withdraw enough from traditional accounts to fill the 12% or 22% bracket each year.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">2</Badge>
                  <div>
                    <p className="font-medium">Consider Roth Conversions</p>
                    <p className="text-sm text-muted-foreground">
                      In low-income years, convert traditional to Roth to reduce future RMDs.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">3</Badge>
                  <div>
                    <p className="font-medium">Use HSA for Healthcare</p>
                    <p className="text-sm text-muted-foreground">
                      HSA withdrawals for qualified medical expenses are completely tax-free.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">4</Badge>
                  <div>
                    <p className="font-medium">Manage IRMAA</p>
                    <p className="text-sm text-muted-foreground">
                      Keep income below IRMAA thresholds to avoid Medicare premium surcharges.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">5</Badge>
                  <div>
                    <p className="font-medium">Tax-Loss Harvest</p>
                    <p className="text-sm text-muted-foreground">
                      Sell losing investments in taxable accounts to offset gains and reduce taxes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">6</Badge>
                  <div>
                    <p className="font-medium">Qualified Charitable Distributions</p>
                    <p className="text-sm text-muted-foreground">
                      After age 70½, donate directly from IRA to charity to satisfy RMDs tax-free.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>2024 Tax Brackets ({filingStatus === 'married' ? 'Married Filing Jointly' : 'Single'})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Tax Rate</th>
                        <th className="text-right py-2">Income Range</th>
                        <th className="text-right py-2">Tax on Bracket</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculations.brackets.map((bracket, i) => (
                        <tr key={i} className="border-b">
                          <td className="py-2 font-medium">{(bracket.rate * 100).toFixed(0)}%</td>
                          <td className="text-right py-2">
                            {formatCurrency(bracket.min)} - {bracket.max === Infinity ? '∞' : formatCurrency(bracket.max)}
                          </td>
                          <td className="text-right py-2">
                            {formatCurrency((Math.min(bracket.max, 500000) - bracket.min) * bracket.rate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Standard Deduction (65+): {formatCurrency(calculations.standardDeduction)}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
