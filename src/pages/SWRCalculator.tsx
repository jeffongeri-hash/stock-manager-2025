import React, { useState, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calculator, TrendingUp, PiggyBank, Wallet, Info, 
  ArrowRight, CheckCircle2, AlertTriangle, Lightbulb 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';

// Money Guy adjusted SWR table
const SWR_TABLE = [
  { label: 'Above 55', minAge: 56, maxAge: 100, rate: 4.0 },
  { label: '45–55', minAge: 45, maxAge: 55, rate: 3.5 },
  { label: 'Below 45', minAge: 20, maxAge: 44, rate: 3.0 },
];

function getSWR(retirementAge: number): number {
  if (retirementAge > 55) return 4.0;
  if (retirementAge >= 45) return 3.5;
  return 3.0;
}

function formatCurrency(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}k`;
  return `$${val.toFixed(0)}`;
}

export default function SWRCalculator() {
  // Shared inputs
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(50);
  const [inflationRate, setInflationRate] = useState(3.0);

  // "How much to save" inputs
  const [annualSpending, setAnnualSpending] = useState(45000);
  
  // "How much can I spend" inputs
  const [currentSavings, setCurrentSavings] = useState(1000000);

  // Growth rate for projections
  const [growthRate, setGrowthRate] = useState(7.0);
  const [monthlySaving, setMonthlySaving] = useState(2000);

  const yearsToRetirement = Math.max(retirementAge - currentAge, 0);
  const swr = getSWR(retirementAge);

  // === THE MATH ===
  // Formula: Required Nest Egg = (Cash Flow Need / SWR%) × (1 + inflation)^years
  const inflationMultiplier = Math.pow(1 + inflationRate / 100, yearsToRetirement);
  const inflatedSpending = annualSpending * inflationMultiplier;
  const requiredNestEgg = inflatedSpending / (swr / 100);

  // How much can I spend from current savings
  const futureValueOfSavings = currentSavings * Math.pow(1 + growthRate / 100, yearsToRetirement);
  const annualWithdrawal = futureValueOfSavings * (swr / 100);
  const monthlyWithdrawal = annualWithdrawal / 12;
  const inflationAdjustedWithdrawal = annualWithdrawal / inflationMultiplier;

  // Monthly savings needed to reach nest egg
  const monthlyRate = growthRate / 100 / 12;
  const totalMonths = yearsToRetirement * 12;
  const futureValueExisting = currentSavings * Math.pow(1 + monthlyRate, totalMonths);
  const gap = requiredNestEgg - futureValueExisting;
  const monthlySavingsNeeded = gap > 0 && totalMonths > 0
    ? (gap * monthlyRate) / (Math.pow(1 + monthlyRate, totalMonths) - 1)
    : 0;

  // Build projection chart data
  const projectionData = useMemo(() => {
    const data = [];
    let balance = currentSavings;
    for (let year = 0; year <= yearsToRetirement; year++) {
      const age = currentAge + year;
      const neededAtThisPoint = (annualSpending * Math.pow(1 + inflationRate / 100, retirementAge - currentAge)) / (swr / 100);
      data.push({
        age,
        year,
        balance: Math.round(balance),
        target: Math.round(neededAtThisPoint),
      });
      balance = balance * (1 + growthRate / 100) + monthlySaving * 12;
    }
    return data;
  }, [currentAge, retirementAge, currentSavings, growthRate, monthlySaving, annualSpending, inflationRate, swr]);

  // Withdrawal longevity simulation
  const longevityData = useMemo(() => {
    const data = [];
    let balance = futureValueOfSavings;
    const annualWithdrawAmt = balance * (swr / 100);
    for (let year = 0; year <= 40; year++) {
      const age = retirementAge + year;
      if (age > 100) break;
      data.push({
        age,
        balance: Math.max(0, Math.round(balance)),
        withdrawal: Math.round(annualWithdrawAmt * Math.pow(1 + inflationRate / 100, year)),
      });
      const yearWithdrawal = annualWithdrawAmt * Math.pow(1 + inflationRate / 100, year);
      balance = (balance - yearWithdrawal) * (1 + growthRate / 100);
    }
    return data;
  }, [futureValueOfSavings, swr, retirementAge, inflationRate, growthRate]);

  const onTrack = projectionData.length > 0 && projectionData[projectionData.length - 1].balance >= projectionData[projectionData.length - 1].target;

  return (
    <PageLayout title="Safe Withdrawal Rate Calculator">
      <div className="space-y-6">
        {/* THE MATH — Educational Section */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-primary" />
              The Math Behind the Rule
            </CardTitle>
            <CardDescription>
              Based on the Money Guy Show's adjusted Safe Withdrawal Rate, which accounts for longer retirement horizons
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Adjusted SWR Table */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Money Guy Adjusted 4% Rule</h3>
              <div className="rounded-lg overflow-hidden border">
                <div className="grid grid-cols-2 bg-muted/80">
                  <div className="p-3 font-semibold text-sm border-r">If you retire at age…</div>
                  <div className="p-3 font-semibold text-sm">…then you can likely withdraw</div>
                </div>
                {SWR_TABLE.map((row) => (
                  <div key={row.label} className={`grid grid-cols-2 border-t ${swr === row.rate ? 'bg-primary/10 font-bold' : ''}`}>
                    <div className="p-3 text-sm border-r flex items-center gap-2">
                      {swr === row.rate && <ArrowRight className="h-3 w-3 text-primary" />}
                      {row.label}
                    </div>
                    <div className="p-3 text-sm font-mono">{row.rate.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* The Formula */}
            <div className="bg-card rounded-lg p-4 border">
              <h3 className="font-semibold text-sm mb-3">The Formula</h3>
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <div className="text-center">
                      <div className="border-b-2 border-foreground px-4 pb-1">
                        <span className="font-semibold">Your Cash Flow Need</span>
                      </div>
                      <div className="pt-1">
                        <span className="font-semibold">Your SWR at Retirement</span>
                      </div>
                    </div>
                    <span className="text-xl font-bold">×</span>
                    <div className="text-center">
                      <span className="font-semibold">(1 + Inflation Rate)</span>
                      <sup className="text-xs ml-1">years until goal</sup>
                    </div>
                  </div>
                </div>
              </div>
              <Separator className="my-3" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Why adjust for inflation?</strong> $45,000/year today won't buy the same goods in 20 years. The formula inflates your spending need forward so your nest egg covers future costs in real terms.</p>
                <p><strong>Why adjust SWR by age?</strong> Retiring at 35 means your portfolio must last ~60 years — much longer than the 30-year horizon the original 4% rule was designed for. A lower withdrawal rate provides a larger margin of safety.</p>
              </div>
            </div>

            {/* Live Example */}
            <div className="bg-card rounded-lg p-4 border">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Your Numbers
              </h3>
              <div className="text-sm space-y-1">
                <p>
                  A <strong>{currentAge}-year-old</strong> retiring at <strong>{retirementAge}</strong> with <strong>{formatCurrency(annualSpending)}/year</strong> in today's dollars:
                </p>
                <div className="font-mono text-xs bg-muted/50 rounded p-2 mt-2">
                  ({formatCurrency(annualSpending)} / {swr}%) × (1 + {inflationRate}%)^{yearsToRetirement} = <strong className="text-primary">{formatCurrency(requiredNestEgg)}</strong>
                </div>
                <p className="text-muted-foreground mt-1">
                  Inflation adjusts {formatCurrency(annualSpending)} → {formatCurrency(inflatedSpending)} over {yearsToRetirement} years, requiring a {formatCurrency(requiredNestEgg)} nest egg.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shared Inputs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5" />
              Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Current Age</Label>
                <Input type="number" value={currentAge} onChange={(e) => setCurrentAge(Number(e.target.value))} min={18} max={80} />
              </div>
              <div className="space-y-2">
                <Label>Retirement Age</Label>
                <Input type="number" value={retirementAge} onChange={(e) => setRetirementAge(Number(e.target.value))} min={currentAge + 1} max={80} />
                <Badge variant="outline" className="text-xs">SWR: {swr}%</Badge>
              </div>
              <div className="space-y-2">
                <Label>Inflation Rate (%)</Label>
                <Input type="number" value={inflationRate} onChange={(e) => setInflationRate(Number(e.target.value))} min={0} max={10} step={0.1} />
              </div>
              <div className="space-y-2">
                <Label>Expected Growth Rate (%)</Label>
                <Input type="number" value={growthRate} onChange={(e) => setGrowthRate(Number(e.target.value))} min={0} max={15} step={0.1} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Two Calculator Tabs */}
        <Tabs defaultValue="save" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="save" className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4" />
              How Much to Save
            </TabsTrigger>
            <TabsTrigger value="spend" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              How Much Can I Spend
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: How Much to Save */}
          <TabsContent value="save" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Determine Your Savings Target</CardTitle>
                <CardDescription>Enter your desired annual spending in retirement and see how much you need to save</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Annual Spending (today's $)</Label>
                    <Input type="number" value={annualSpending} onChange={(e) => setAnnualSpending(Number(e.target.value))} min={10000} step={1000} />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Savings</Label>
                    <Input type="number" value={currentSavings} onChange={(e) => setCurrentSavings(Number(e.target.value))} min={0} step={1000} />
                  </div>
                  <div className="space-y-2">
                    <Label>Monthly Contribution</Label>
                    <Input type="number" value={monthlySaving} onChange={(e) => setMonthlySaving(Number(e.target.value))} min={0} step={100} />
                  </div>
                </div>

                {/* Results */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Card className="bg-primary/10 border-primary/20">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Target Nest Egg</p>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(requiredNestEgg)}</p>
                      <p className="text-xs text-muted-foreground">at {swr}% SWR</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Inflation-Adj. Spending</p>
                      <p className="text-2xl font-bold">{formatCurrency(inflatedSpending)}</p>
                      <p className="text-xs text-muted-foreground">/year at retirement</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Monthly Savings Needed</p>
                      <p className="text-2xl font-bold">{monthlySavingsNeeded > 0 ? formatCurrency(monthlySavingsNeeded) : '$0'}</p>
                      <p className="text-xs text-muted-foreground">to close the gap</p>
                    </CardContent>
                  </Card>
                  <Card className={onTrack ? "bg-green-500/10 border-green-500/20" : "bg-yellow-500/10 border-yellow-500/20"}>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        {onTrack ? (
                          <>
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">On Track</p>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                            <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">Gap Exists</p>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{yearsToRetirement} years to go</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Growth Projection Chart */}
                <div>
                  <h3 className="font-semibold text-sm mb-2">Savings Growth vs. Target</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={projectionData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="age" label={{ value: 'Age', position: 'insideBottom', offset: -5 }} />
                      <YAxis tickFormatter={(v) => formatCurrency(v)} width={70} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} labelFormatter={(label) => `Age ${label}`} />
                      <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} name="Your Savings" strokeWidth={2} />
                      <ReferenceLine y={requiredNestEgg} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: `Target: ${formatCurrency(requiredNestEgg)}`, position: 'top' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: How Much Can I Spend */}
          <TabsContent value="spend" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Determine Your Spending Power</CardTitle>
                <CardDescription>Enter your savings amount and see how much you can safely withdraw each year</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Current Savings / Nest Egg</Label>
                    <Input type="number" value={currentSavings} onChange={(e) => setCurrentSavings(Number(e.target.value))} min={0} step={10000} />
                  </div>
                  <div className="space-y-2">
                    <Label>Additional Monthly Contributions (until retirement)</Label>
                    <Input type="number" value={monthlySaving} onChange={(e) => setMonthlySaving(Number(e.target.value))} min={0} step={100} />
                  </div>
                </div>

                {/* Slider for quick savings adjustment */}
                <div className="space-y-2">
                  <Label>Quick Adjust Savings: {formatCurrency(currentSavings)}</Label>
                  <Slider
                    value={[currentSavings]}
                    onValueChange={(v) => setCurrentSavings(v[0])}
                    min={50000}
                    max={5000000}
                    step={10000}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>$50k</span>
                    <span>$5M</span>
                  </div>
                </div>

                {/* Results */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Card className="bg-primary/10 border-primary/20">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Projected Portfolio at {retirementAge}</p>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(futureValueOfSavings)}</p>
                      <p className="text-xs text-muted-foreground">{growthRate}% annual growth</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-500/10 border-green-500/20">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Annual Withdrawal</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(annualWithdrawal)}</p>
                      <p className="text-xs text-muted-foreground">at {swr}% SWR</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Monthly Spending</p>
                      <p className="text-2xl font-bold">{formatCurrency(monthlyWithdrawal)}</p>
                      <p className="text-xs text-muted-foreground">nominal dollars</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">In Today's Dollars</p>
                      <p className="text-2xl font-bold">{formatCurrency(inflationAdjustedWithdrawal)}</p>
                      <p className="text-xs text-muted-foreground">/year purchasing power</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick reference table */}
                <div>
                  <h3 className="font-semibold text-sm mb-2">Quick Reference: Savings → Annual Spending</h3>
                  <div className="rounded-lg overflow-hidden border">
                    <div className="grid grid-cols-4 bg-muted/80 text-xs font-semibold">
                      <div className="p-2 border-r">Nest Egg</div>
                      <div className="p-2 border-r">@ 3.0%</div>
                      <div className="p-2 border-r">@ 3.5%</div>
                      <div className="p-2">@ 4.0%</div>
                    </div>
                    {[500000, 750000, 1000000, 1500000, 2000000, 3000000].map((amt) => (
                      <div key={amt} className="grid grid-cols-4 border-t text-xs">
                        <div className="p-2 border-r font-medium">{formatCurrency(amt)}</div>
                        <div className="p-2 border-r font-mono">{formatCurrency(amt * 0.03)}</div>
                        <div className="p-2 border-r font-mono">{formatCurrency(amt * 0.035)}</div>
                        <div className="p-2 font-mono">{formatCurrency(amt * 0.04)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Longevity Chart */}
                <div>
                  <h3 className="font-semibold text-sm mb-2">Portfolio Longevity Simulation</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    Shows how your portfolio evolves post-retirement with inflation-adjusted withdrawals at {swr}% initial rate
                  </p>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={longevityData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="age" label={{ value: 'Age', position: 'insideBottom', offset: -5 }} />
                      <YAxis tickFormatter={(v) => formatCurrency(v)} width={70} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} labelFormatter={(label) => `Age ${label}`} />
                      <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} name="Portfolio Balance" strokeWidth={2} />
                      <Area type="monotone" dataKey="withdrawal" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.1} name="Annual Withdrawal" strokeWidth={1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Rationale & Educational Footer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5" />
              Why the Adjusted Rule Matters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">The Original 4% Rule</h4>
                <p>
                  William Bengen's 1994 study found that retirees could withdraw 4% of their portfolio in year one, 
                  then adjust for inflation each year, and not run out of money over a <strong>30-year</strong> retirement. 
                  This assumed a 50/50 stock/bond portfolio.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Why Adjust?</h4>
                <p>
                  If you retire at 40 instead of 65, your money needs to last <strong>50+ years</strong>, not 30. 
                  The Money Guy adjusted rate lowers the withdrawal percentage for earlier retirees to account for: 
                  sequence-of-returns risk, longer time horizons, and potential healthcare costs before Medicare eligibility.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Key Assumptions</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Diversified portfolio (stocks + bonds)</li>
                  <li>Annual rebalancing</li>
                  <li>Inflation-adjusted withdrawals each year</li>
                  <li>No significant lump-sum expenses</li>
                  <li>Social Security & pensions are bonus income</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
