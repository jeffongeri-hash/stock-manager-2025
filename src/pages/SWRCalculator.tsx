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
import { Button } from '@/components/ui/button';
import { 
  Calculator, TrendingUp, PiggyBank, Wallet, Info, 
  ArrowRight, CheckCircle2, AlertTriangle, Lightbulb,
  Users, Globe, Zap
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';

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

// Currency definitions
const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', defaultInflation: 3.0 },
  { code: 'EUR', symbol: '€', name: 'Euro', defaultInflation: 2.5 },
  { code: 'GBP', symbol: '£', name: 'British Pound', defaultInflation: 3.5 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', defaultInflation: 1.5 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', defaultInflation: 2.8 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', defaultInflation: 3.2 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', defaultInflation: 1.2 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', defaultInflation: 5.5 },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', defaultInflation: 6.0 },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', defaultInflation: 5.0 },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', defaultInflation: 2.5 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', defaultInflation: 2.0 },
  { code: 'CUSTOM', symbol: '', name: 'Custom', defaultInflation: 3.0 },
];

// Quick-start profiles
const PROFILES = [
  {
    name: 'Young Professional',
    description: 'Age 25, aggressive saver targeting early retirement at 45',
    icon: '🚀',
    currentAge: 25, retirementAge: 45, annualSpending: 40000,
    currentSavings: 50000, monthlySaving: 3000, growthRate: 8.0,
    currency: 'USD',
  },
  {
    name: 'Mid-Career Family',
    description: 'Age 38, dual income, moderate FIRE target at 55',
    icon: '👨‍👩‍👧‍👦',
    currentAge: 38, retirementAge: 55, annualSpending: 75000,
    currentSavings: 350000, monthlySaving: 4000, growthRate: 7.0,
    currency: 'USD',
  },
  {
    name: 'Late Starter',
    description: 'Age 45, catching up with higher contributions, retire at 62',
    icon: '⏰',
    currentAge: 45, retirementAge: 62, annualSpending: 60000,
    currentSavings: 200000, monthlySaving: 5000, growthRate: 6.5,
    currency: 'USD',
  },
  {
    name: 'Lean FIRE Minimalist',
    description: 'Age 30, ultra-low spending lifestyle targeting 40',
    icon: '🌿',
    currentAge: 30, retirementAge: 40, annualSpending: 25000,
    currentSavings: 150000, monthlySaving: 4000, growthRate: 7.5,
    currency: 'USD',
  },
  {
    name: 'Fat FIRE Executive',
    description: 'Age 35, high income, luxury retirement at 50',
    icon: '💎',
    currentAge: 35, retirementAge: 50, annualSpending: 150000,
    currentSavings: 800000, monthlySaving: 8000, growthRate: 7.0,
    currency: 'USD',
  },
  {
    name: 'EU Digital Nomad',
    description: 'Age 28, euro-based, geo-arbitrage retirement at 42',
    icon: '🌍',
    currentAge: 28, retirementAge: 42, annualSpending: 30000,
    currentSavings: 80000, monthlySaving: 2500, growthRate: 6.5,
    currency: 'EUR',
  },
];

export default function SWRCalculator() {
  // Currency
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [customSymbol, setCustomSymbol] = useState('$');

  const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
  const sym = currencyCode === 'CUSTOM' ? customSymbol : currency.symbol;

  function formatCurrency(val: number): string {
    if (val >= 1_000_000) return `${sym}${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `${sym}${(val / 1_000).toFixed(0)}k`;
    return `${sym}${val.toFixed(0)}`;
  }

  // Shared inputs
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(50);
  const [inflationRate, setInflationRate] = useState(3.0);
  const [annualSpending, setAnnualSpending] = useState(45000);
  const [currentSavings, setCurrentSavings] = useState(1000000);
  const [growthRate, setGrowthRate] = useState(7.0);
  const [monthlySaving, setMonthlySaving] = useState(2000);

  // Multi-inflation scenarios
  const [showScenarios, setShowScenarios] = useState(false);
  const inflationScenarios = [
    { label: 'Low', rate: Math.max(inflationRate - 1.5, 0.5) },
    { label: 'Base', rate: inflationRate },
    { label: 'High', rate: inflationRate + 2.0 },
    { label: 'Crisis', rate: inflationRate + 5.0 },
  ];

  const yearsToRetirement = Math.max(retirementAge - currentAge, 0);
  const swr = getSWR(retirementAge);

  const inflationMultiplier = Math.pow(1 + inflationRate / 100, yearsToRetirement);
  const inflatedSpending = annualSpending * inflationMultiplier;
  const requiredNestEgg = inflatedSpending / (swr / 100);

  const futureValueOfSavings = currentSavings * Math.pow(1 + growthRate / 100, yearsToRetirement);
  const annualWithdrawal = futureValueOfSavings * (swr / 100);
  const monthlyWithdrawal = annualWithdrawal / 12;
  const inflationAdjustedWithdrawal = annualWithdrawal / inflationMultiplier;

  const monthlyRate = growthRate / 100 / 12;
  const totalMonths = yearsToRetirement * 12;
  const futureValueExisting = currentSavings * Math.pow(1 + monthlyRate, totalMonths);
  const gap = requiredNestEgg - futureValueExisting;
  const monthlySavingsNeeded = gap > 0 && totalMonths > 0
    ? (gap * monthlyRate) / (Math.pow(1 + monthlyRate, totalMonths) - 1)
    : 0;

  const projectionData = useMemo(() => {
    const data = [];
    let balance = currentSavings;
    for (let year = 0; year <= yearsToRetirement; year++) {
      const age = currentAge + year;
      const neededAtThisPoint = (annualSpending * Math.pow(1 + inflationRate / 100, retirementAge - currentAge)) / (swr / 100);
      data.push({ age, year, balance: Math.round(balance), target: Math.round(neededAtThisPoint) });
      balance = balance * (1 + growthRate / 100) + monthlySaving * 12;
    }
    return data;
  }, [currentAge, retirementAge, currentSavings, growthRate, monthlySaving, annualSpending, inflationRate, swr]);

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

  // Multi-inflation scenario data
  const scenarioData = useMemo(() => {
    return inflationScenarios.map(scenario => {
      const mult = Math.pow(1 + scenario.rate / 100, yearsToRetirement);
      const inflatedSpend = annualSpending * mult;
      const nestEgg = inflatedSpend / (swr / 100);
      const mRate = growthRate / 100 / 12;
      const tMonths = yearsToRetirement * 12;
      const fvExisting = currentSavings * Math.pow(1 + mRate, tMonths);
      const g = nestEgg - fvExisting;
      const monthlyNeeded = g > 0 && tMonths > 0 ? (g * mRate) / (Math.pow(1 + mRate, tMonths) - 1) : 0;
      return {
        ...scenario,
        inflatedSpending: inflatedSpend,
        requiredNestEgg: nestEgg,
        monthlySavingsNeeded: monthlyNeeded,
        onTrack: fvExisting >= nestEgg,
      };
    });
  }, [inflationScenarios, annualSpending, yearsToRetirement, swr, growthRate, currentSavings]);

  const onTrack = projectionData.length > 0 && projectionData[projectionData.length - 1].balance >= projectionData[projectionData.length - 1].target;

  function applyProfile(profile: typeof PROFILES[0]) {
    setCurrentAge(profile.currentAge);
    setRetirementAge(profile.retirementAge);
    setAnnualSpending(profile.annualSpending);
    setCurrentSavings(profile.currentSavings);
    setMonthlySaving(profile.monthlySaving);
    setGrowthRate(profile.growthRate);
    const cur = CURRENCIES.find(c => c.code === profile.currency);
    if (cur) {
      setCurrencyCode(cur.code);
      setInflationRate(cur.defaultInflation);
    }
  }

  return (
    <PageLayout title="Safe Withdrawal Rate Calculator">
      <div className="space-y-6">

        {/* Quick Start Profiles */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Quick Start — Choose a Profile
            </CardTitle>
            <CardDescription>Select a preset to populate all fields, then customize to fit your situation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PROFILES.map((profile) => (
                <button
                  key={profile.name}
                  onClick={() => applyProfile(profile)}
                  className="text-left p-3 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{profile.icon}</span>
                    <span className="font-semibold text-sm group-hover:text-primary transition-colors">{profile.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{profile.description}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">Age {profile.currentAge}→{profile.retirementAge}</Badge>
                    <Badge variant="outline" className="text-[10px]">{CURRENCIES.find(c => c.code === profile.currency)?.symbol}{(profile.annualSpending / 1000).toFixed(0)}k/yr</Badge>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

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
                <p><strong>Why adjust for inflation?</strong> {formatCurrency(45000)}/year today won't buy the same goods in 20 years. The formula inflates your spending need forward so your nest egg covers future costs in real terms.</p>
                <p><strong>Why adjust SWR by age?</strong> Retiring at 35 means your portfolio must last ~60 years — much longer than the 30-year horizon the original 4% rule was designed for.</p>
              </div>
            </div>

            <div className="bg-card rounded-lg p-4 border">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Your Numbers
              </h3>
              <div className="text-sm space-y-1">
                <p>
                  A <strong>{currentAge}-year-old</strong> retiring at <strong>{retirementAge}</strong> with <strong>{formatCurrency(annualSpending)}/year</strong> in today's {currency.code}:
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

        {/* Shared Inputs — now with currency selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5" />
              Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Currency Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Globe className="h-3 w-3" /> Currency</Label>
                <Select value={currencyCode} onValueChange={(v) => {
                  setCurrencyCode(v);
                  const cur = CURRENCIES.find(c => c.code === v);
                  if (cur && v !== 'CUSTOM') setInflationRate(cur.defaultInflation);
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code === 'CUSTOM' ? '🔧 Custom' : `${c.symbol} ${c.name} (${c.code})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {currencyCode === 'CUSTOM' && (
                <div className="space-y-2">
                  <Label>Symbol</Label>
                  <Input value={customSymbol} onChange={(e) => setCustomSymbol(e.target.value)} placeholder="e.g. ₺" maxLength={4} />
                </div>
              )}
              <div className="space-y-2">
                <Label>Typical Inflation ({currency.code})</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" value={inflationRate} onChange={(e) => setInflationRate(Number(e.target.value))} min={0} max={20} step={0.1} />
                  <Badge variant="secondary" className="text-xs whitespace-nowrap">
                    {currency.code !== 'CUSTOM' ? `Default: ${currency.defaultInflation}%` : 'Custom'}
                  </Badge>
                </div>
              </div>
            </div>

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
                <Label>Expected Growth Rate (%)</Label>
                <Input type="number" value={growthRate} onChange={(e) => setGrowthRate(Number(e.target.value))} min={0} max={15} step={0.1} />
              </div>
              <div className="space-y-2">
                <Label>Monthly Contribution</Label>
                <Input type="number" value={monthlySaving} onChange={(e) => setMonthlySaving(Number(e.target.value))} min={0} step={100} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Multi-Inflation Scenarios */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Inflation Scenarios
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowScenarios(!showScenarios)}>
                {showScenarios ? 'Hide' : 'Show'} Scenarios
              </Button>
            </div>
            <CardDescription>See how different inflation rates impact your retirement target across currencies</CardDescription>
          </CardHeader>
          {showScenarios && (
            <CardContent>
              <div className="rounded-lg overflow-hidden border">
                <div className="grid grid-cols-5 bg-muted/80 text-xs font-semibold">
                  <div className="p-2 border-r">Scenario</div>
                  <div className="p-2 border-r">Inflation</div>
                  <div className="p-2 border-r">Spending at Retirement</div>
                  <div className="p-2 border-r">Nest Egg Needed</div>
                  <div className="p-2">Monthly Savings</div>
                </div>
                {scenarioData.map((s) => (
                  <div key={s.label} className={`grid grid-cols-5 border-t text-xs ${s.label === 'Base' ? 'bg-primary/5 font-semibold' : ''}`}>
                    <div className="p-2 border-r flex items-center gap-1">
                      {s.label === 'Crisis' && <AlertTriangle className="h-3 w-3 text-destructive" />}
                      {s.label}
                    </div>
                    <div className="p-2 border-r font-mono">{s.rate.toFixed(1)}%</div>
                    <div className="p-2 border-r font-mono">{formatCurrency(s.inflatedSpending)}/yr</div>
                    <div className="p-2 border-r font-mono">{formatCurrency(s.requiredNestEgg)}</div>
                    <div className="p-2 font-mono flex items-center gap-1">
                      {s.monthlySavingsNeeded > 0 ? formatCurrency(s.monthlySavingsNeeded) : `${sym}0`}
                      {s.onTrack && <CheckCircle2 className="h-3 w-3 text-primary" />}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Base rate uses {currency.code}'s typical inflation ({inflationRate}%). Crisis models hyperinflation to stress-test your plan.
              </p>
            </CardContent>
          )}
        </Card>

        {/* Calculator Tabs */}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Annual Spending (today's {sym})</Label>
                    <Input type="number" value={annualSpending} onChange={(e) => setAnnualSpending(Number(e.target.value))} min={1000} step={1000} />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Savings</Label>
                    <Input type="number" value={currentSavings} onChange={(e) => setCurrentSavings(Number(e.target.value))} min={0} step={1000} />
                  </div>
                </div>

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
                      <p className="text-2xl font-bold">{monthlySavingsNeeded > 0 ? formatCurrency(monthlySavingsNeeded) : `${sym}0`}</p>
                      <p className="text-xs text-muted-foreground">to close the gap</p>
                    </CardContent>
                  </Card>
                  <Card className={onTrack ? "bg-primary/10 border-primary/20" : "bg-destructive/10 border-destructive/20"}>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        {onTrack ? (
                          <>
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <p className="text-lg font-bold text-primary">On Track</p>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            <p className="text-lg font-bold text-destructive">Gap Exists</p>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{yearsToRetirement} years to go</p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="font-semibold text-sm mb-2">Savings Growth vs. Target</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={projectionData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="age" label={{ value: 'Age', position: 'insideBottom', offset: -5 }} />
                      <YAxis tickFormatter={(v) => formatCurrency(v)} width={80} />
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
                    <Label>Additional Monthly Contributions</Label>
                    <Input type="number" value={monthlySaving} onChange={(e) => setMonthlySaving(Number(e.target.value))} min={0} step={100} />
                  </div>
                </div>

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
                    <span>{formatCurrency(50000)}</span>
                    <span>{formatCurrency(5000000)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Card className="bg-primary/10 border-primary/20">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Projected Portfolio at {retirementAge}</p>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(futureValueOfSavings)}</p>
                      <p className="text-xs text-muted-foreground">{growthRate}% annual growth</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-primary/10 border-primary/20">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Annual Withdrawal</p>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(annualWithdrawal)}</p>
                      <p className="text-xs text-muted-foreground">at {swr}% SWR</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Monthly Spending</p>
                      <p className="text-2xl font-bold">{formatCurrency(monthlyWithdrawal)}</p>
                      <p className="text-xs text-muted-foreground">nominal {currency.code}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">In Today's {currency.code}</p>
                      <p className="text-2xl font-bold">{formatCurrency(inflationAdjustedWithdrawal)}</p>
                      <p className="text-xs text-muted-foreground">/year purchasing power</p>
                    </CardContent>
                  </Card>
                </div>

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

                <div>
                  <h3 className="font-semibold text-sm mb-2">Portfolio Longevity Simulation</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    Shows how your portfolio evolves post-retirement with inflation-adjusted withdrawals at {swr}% initial rate
                  </p>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={longevityData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="age" label={{ value: 'Age', position: 'insideBottom', offset: -5 }} />
                      <YAxis tickFormatter={(v) => formatCurrency(v)} width={80} />
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

        {/* Rationale */}
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
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Why Adjust?</h4>
                <p>
                  If you retire at 40 instead of 65, your money needs to last <strong>50+ years</strong>, not 30. 
                  The Money Guy adjusted rate lowers the withdrawal percentage for earlier retirees to account for 
                  sequence-of-returns risk and longer time horizons.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Currency & Inflation</h4>
                <p>
                  Different currencies experience vastly different inflation rates. The Brazilian Real averages ~6% while 
                  the Swiss Franc averages ~1.2%. Your retirement number depends heavily on <strong>where</strong> you live, 
                  not just <strong>how much</strong> you save.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
