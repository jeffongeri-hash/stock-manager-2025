import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Banknote, MapPin, Plus, Trash2, Shield, TrendingUp, 
  Wallet, Heart, PiggyBank, Loader2, Gift, BarChart3, 
  Calculator, RefreshCw, Percent, DollarSign, Scale
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, Legend, PieChart, Pie 
} from 'recharts';
import { IgniteUserFinancials, PaycheckDeductions, SavingsBucket } from '@/types/ignitefire';

interface IgnitePaycheckPlannerProps {
  financials: IgniteUserFinancials;
}

const LIMITS_2025 = {
  fourOhOneK: 23500,
  hsa: 4150,
  rothIRA: 7000
};

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const IgnitePaycheckPlanner: React.FC<IgnitePaycheckPlannerProps> = ({ financials }) => {
  const [payCycle, setPayCycle] = useState<'biweekly' | 'monthly' | 'annual'>('biweekly');
  const [grossInput, setGrossInput] = useState(3846.15);
  const [zipCode, setZipCode] = useState(financials.zipCode || '95814');
  const [filingStatus, setFilingStatus] = useState('single');
  const [loadingTax, setLoadingTax] = useState(false);
  const [taxResult, setTaxResult] = useState<any>(null);
  
  const [deductions, setDeductions] = useState<PaycheckDeductions>(() => {
    const saved = localStorage.getItem('ignite_paycheck_v7');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      fourOhOneKType: 'percentage',
      fourOhOneKValue: 15,
      hsaType: 'percentage',
      hsaValue: 5,
      rothIRAType: 'fixed',
      rothIRAValue: 250,
      ytdFourOhOneK: 0,
      ytdHsa: 0,
      ytdRothIRA: 0,
      otherPreTax: 0,
      brokerage: 500,
      healthIns: 150,
      matchPercent: 5,
      matchLimit: 100,
      buckets: [
        { id: '1', name: 'Emergency Fund', type: 'percentage', value: 10, currentBalance: 12000, targetBalance: 30000 },
      ],
    };
  });

  // Employer match settings
  const [enableEmployerMatch, setEnableEmployerMatch] = useState(true);
  const [baseMatchPercent, setBaseMatchPercent] = useState(2);
  const [matchRate, setMatchRate] = useState(50);
  const [matchUpTo, setMatchUpTo] = useState(6);

  useEffect(() => {
    localStorage.setItem('ignite_paycheck_v7', JSON.stringify(deductions));
  }, [deductions]);

  const grossAnnual = useMemo(() => {
    if (payCycle === 'biweekly') return grossInput * 26;
    if (payCycle === 'monthly') return grossInput * 12;
    return grossInput;
  }, [grossInput, payCycle]);

  const periodsPerYear = payCycle === 'biweekly' ? 26 : (payCycle === 'monthly' ? 12 : 1);

  // Calculate contributions
  const contrib401k = deductions.fourOhOneKType === 'percentage' 
    ? (grossInput * deductions.fourOhOneKValue / 100) 
    : deductions.fourOhOneKValue;
  const contribHsa = deductions.hsaType === 'percentage' 
    ? (grossInput * deductions.hsaValue / 100) 
    : deductions.hsaValue;
  const rothIRA = deductions.rothIRAType === 'percentage' 
    ? (grossInput * deductions.rothIRAValue / 100) 
    : deductions.rothIRAValue;

  const totalPreTax = contrib401k + contribHsa + deductions.otherPreTax;
  const taxableGross = Math.max(0, grossInput - totalPreTax);

  // Use tax result if available, otherwise estimate
  const estTaxRate = taxResult?.taxes?.taxBreakdown?.federalRate 
    ? parseFloat(taxResult.taxes.taxBreakdown.federalRate) / 100 
    : (financials.taxRate / 100);
  const estTax = taxResult?.totalTaxes || (taxableGross * estTaxRate);
  const netAfterTax = Math.max(0, taxableGross - estTax - deductions.healthIns);

  // Post-tax calculations
  const bucketSums = deductions.buckets.reduce((acc, b) => {
    const val = b.type === 'percentage' ? (netAfterTax * b.value) / 100 : b.value;
    return acc + val;
  }, 0);
  const totalPostTaxSavings = bucketSums + rothIRA + deductions.brokerage;
  const disposable = Math.max(0, netAfterTax - totalPostTaxSavings);

  // Employer match calculations
  const employeeContributionPercent = grossInput > 0 ? (contrib401k / grossInput) * 100 : 0;
  const baseContributionPerPay = enableEmployerMatch ? (baseMatchPercent / 100) * grossInput : 0;
  const effectiveMatchablePercent = Math.min(employeeContributionPercent, matchUpTo);
  const matchContributionPerPay = enableEmployerMatch 
    ? (matchRate / 100) * (effectiveMatchablePercent / 100) * grossInput 
    : 0;
  const totalEmployerContributionPerPay = baseContributionPerPay + matchContributionPerPay;
  const annualEmployerTotal = totalEmployerContributionPerPay * periodsPerYear;

  // Chart data
  const compositionData = useMemo(() => [
    { name: 'Pre-Tax Savings', value: totalPreTax, fill: CHART_COLORS[0] },
    { name: 'Taxes', value: estTax, fill: 'hsl(0 84% 60%)' },
    { name: 'Insurance', value: deductions.healthIns, fill: CHART_COLORS[3] },
    { name: 'Post-Tax Savings', value: totalPostTaxSavings, fill: CHART_COLORS[2] },
    { name: 'Disposable', value: disposable, fill: CHART_COLORS[4] }
  ].filter(d => d.value > 0), [totalPreTax, estTax, deductions.healthIns, totalPostTaxSavings, disposable]);

  const waterfallData = [
    { name: 'Gross', value: grossInput, fill: CHART_COLORS[0] },
    { name: 'Pre-Tax', value: -totalPreTax, fill: CHART_COLORS[1] },
    { name: 'Taxes', value: -estTax, fill: 'hsl(0 84% 60%)' },
    { name: 'Insurance', value: -deductions.healthIns, fill: CHART_COLORS[3] },
    { name: 'Post-Tax', value: -totalPostTaxSavings, fill: CHART_COLORS[2] },
    { name: 'Net', value: disposable, fill: 'hsl(142 76% 36%)' },
  ];

  const calculateTax = async () => {
    if (!zipCode || zipCode.length !== 5) {
      toast.error('Please enter a valid 5-digit ZIP code');
      return;
    }

    setLoadingTax(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-paycheck', {
        body: {
          grossPay: grossInput,
          payFrequency: payCycle,
          zipCode,
          filingStatus,
          allowances: 0,
          preTaxDeductions: [
            { label: '401(k)', value: contrib401k, type: 'amount' },
            { label: 'HSA', value: contribHsa, type: 'amount' },
          ],
          postTaxDeductions: [
            { label: 'Roth IRA', value: rothIRA, type: 'amount' },
            { label: 'Brokerage', value: deductions.brokerage, type: 'amount' },
          ],
        },
      });

      if (error) throw error;
      setTaxResult(data);
      toast.success('Tax calculated with AI precision');
    } catch (error) {
      console.error('Error calculating tax:', error);
      toast.error('Failed to calculate taxes');
    } finally {
      setLoadingTax(false);
    }
  };

  const handleInputChange = (name: string, value: number) => {
    setDeductions(prev => ({ ...prev, [name]: value }));
  };

  const toggleType = (name: 'fourOhOneKType' | 'hsaType' | 'rothIRAType') => {
    setDeductions(prev => ({
      ...prev,
      [name]: prev[name] === 'percentage' ? 'fixed' : 'percentage'
    }));
  };

  const addBucket = () => {
    const newBucket: SavingsBucket = {
      id: Date.now().toString(),
      name: 'New Savings Goal',
      type: 'fixed',
      value: 100,
      currentBalance: 0,
      targetBalance: 1000
    };
    setDeductions(prev => ({ ...prev, buckets: [...prev.buckets, newBucket] }));
  };

  const updateBucket = (id: string, field: keyof SavingsBucket, value: any) => {
    setDeductions(prev => ({
      ...prev,
      buckets: prev.buckets.map(b => b.id === id ? { ...b, [field]: value } : b)
    }));
  };

  const removeBucket = (id: string) => {
    setDeductions(prev => ({ ...prev, buckets: prev.buckets.filter(b => b.id !== id) }));
  };

  const getPrediction = (currentYtd: number, perPeriod: number, limit: number) => {
    if (perPeriod <= 0) return { label: 'Set Contrib', color: 'text-muted-foreground' };
    if (currentYtd >= limit) return { label: 'MAXED OUT!', color: 'text-primary' };
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const periodsRemaining = Math.max(0, periodsPerYear - Math.floor((dayOfYear / 365) * periodsPerYear));
    const totalExpected = currentYtd + (perPeriod * periodsRemaining);
    return totalExpected < limit
      ? { label: `EOY: $${Math.round(totalExpected).toLocaleString()}`, color: 'text-yellow-500' }
      : { label: 'On track to Max', color: 'text-green-500' };
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="planner" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="planner">Paycheck Planner</TabsTrigger>
          <TabsTrigger value="match">Employer Match</TabsTrigger>
          <TabsTrigger value="goals">Savings Goals</TabsTrigger>
          <TabsTrigger value="compare">Compare Scenarios</TabsTrigger>
        </TabsList>

        <TabsContent value="planner" className="space-y-6">
          {/* Header Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Flexible Paycheck Lab
              </CardTitle>
              <CardDescription>
                Deconstruct your pay via percentage or fixed dollar targets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pay Cycle Toggle */}
              <div className="flex gap-2">
                {(['biweekly', 'monthly', 'annual'] as const).map((cycle) => (
                  <Button
                    key={cycle}
                    variant={payCycle === cycle ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const newGross = cycle === 'biweekly' ? (grossAnnual / 26) : (cycle === 'monthly' ? grossAnnual / 12 : grossAnnual);
                      setGrossInput(Math.round(newGross * 100) / 100);
                      setPayCycle(cycle);
                    }}
                    className="capitalize"
                  >
                    {cycle}
                  </Button>
                ))}
              </div>

              {/* Input Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Gross {payCycle} Pay</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={grossInput}
                      onChange={(e) => setGrossInput(parseFloat(e.target.value) || 0)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>ZIP Code</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="pl-9"
                      maxLength={5}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Filing Status</Label>
                  <Select value={filingStatus} onValueChange={setFilingStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married Filing Jointly</SelectItem>
                      <SelectItem value="marriedSeparate">Married Filing Separately</SelectItem>
                      <SelectItem value="headOfHousehold">Head of Household</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button onClick={calculateTax} disabled={loadingTax} className="w-full">
                    {loadingTax ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Calculate Tax
                  </Button>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-lg bg-muted text-center">
                  <p className="text-xs text-muted-foreground">Est. Take Home</p>
                  <p className="text-2xl font-bold">${Math.round(disposable).toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted text-center">
                  <p className="text-xs text-muted-foreground">Total Savings</p>
                  <p className="text-2xl font-bold text-green-500">${Math.round(totalPreTax + totalPostTaxSavings).toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted text-center">
                  <p className="text-xs text-muted-foreground">Taxes</p>
                  <p className="text-2xl font-bold text-destructive">${Math.round(estTax).toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted text-center">
                  <p className="text-xs text-muted-foreground">Savings Rate</p>
                  <p className="text-2xl font-bold">{((totalPreTax + totalPostTaxSavings) / grossInput * 100).toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Composition Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Capital Flow Composition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={compositionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: $${Math.round(value).toLocaleString()}`}
                    >
                      {compositionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => `$${Math.round(val).toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Contribution Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: '401(k) / 403(b)', name: 'fourOhOneKValue', typeName: 'fourOhOneKType', ytdName: 'ytdFourOhOneK', limit: LIMITS_2025.fourOhOneK, val: deductions.fourOhOneKValue, type: deductions.fourOhOneKType, contrib: contrib401k, icon: PiggyBank },
              { label: 'HSA', name: 'hsaValue', typeName: 'hsaType', ytdName: 'ytdHsa', limit: LIMITS_2025.hsa, val: deductions.hsaValue, type: deductions.hsaType, contrib: contribHsa, icon: Heart },
              { label: 'Roth IRA', name: 'rothIRAValue', typeName: 'rothIRAType', ytdName: 'ytdRothIRA', limit: LIMITS_2025.rothIRA, val: deductions.rothIRAValue, type: deductions.rothIRAType, contrib: rothIRA, icon: TrendingUp },
              { label: 'Brokerage', name: 'brokerage', typeName: null, ytdName: null, limit: 0, val: deductions.brokerage, type: 'fixed', contrib: deductions.brokerage, icon: Wallet },
            ].map(item => {
              const pred = item.ytdName ? getPrediction(deductions[item.ytdName as keyof PaycheckDeductions] as number, item.contrib, item.limit) : null;
              const Icon = item.icon;
              return (
                <Card key={item.label}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">{item.label}</p>
                      </div>
                      {item.typeName && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleType(item.typeName as any)}
                          className="h-6 px-2 text-xs"
                        >
                          {item.type === 'percentage' ? '%' : '$'}
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Input
                        type="number"
                        value={item.val}
                        onChange={(e) => handleInputChange(item.name, parseFloat(e.target.value) || 0)}
                      />
                      <p className="text-xs text-muted-foreground">
                        = ${item.contrib.toFixed(2)} / paycheck
                      </p>
                    </div>
                    {pred && item.ytdName && (
                      <div className="pt-2 border-t space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">YTD:</span>
                          <Input
                            type="number"
                            value={deductions[item.ytdName as keyof PaycheckDeductions] as number}
                            onChange={(e) => handleInputChange(item.ytdName!, parseFloat(e.target.value) || 0)}
                            className="h-6 w-24 text-xs text-right"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Limit: ${item.limit.toLocaleString()}</span>
                          <Badge variant="secondary" className={`text-xs ${pred.color}`}>
                            {pred.label}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tax Breakdown (if available) */}
          {taxResult && (
            <Card>
              <CardHeader>
                <CardTitle>AI Tax Breakdown</CardTitle>
                <CardDescription>
                  {taxResult.taxes?.stateName} • {taxResult.taxes?.localTaxName || 'No local tax'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <p className="text-xs text-muted-foreground">Federal</p>
                    <p className="font-bold">${taxResult.taxes?.federalTax?.toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <p className="text-xs text-muted-foreground">State</p>
                    <p className="font-bold">${taxResult.taxes?.stateTax?.toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <p className="text-xs text-muted-foreground">Local</p>
                    <p className="font-bold">${taxResult.taxes?.localTax?.toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <p className="text-xs text-muted-foreground">Social Security</p>
                    <p className="font-bold">${taxResult.taxes?.socialSecurity?.toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <p className="text-xs text-muted-foreground">Medicare</p>
                    <p className="font-bold">${taxResult.taxes?.medicare?.toFixed(2)}</p>
                  </div>
                </div>
                {taxResult.taxes?.notes && (
                  <p className="mt-4 text-sm text-muted-foreground italic">{taxResult.taxes.notes}</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="match" className="space-y-6">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Employer Match & Retirement Projection
              </CardTitle>
              <CardDescription>
                Configure your employer's matching policy to see total retirement value
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-primary" />
                  <Label>Enable Employer Match</Label>
                </div>
                <Switch checked={enableEmployerMatch} onCheckedChange={setEnableEmployerMatch} />
              </div>

              {enableEmployerMatch && (
                <>
                  {/* Match Configuration */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Base Contribution %</Label>
                      <Input
                        type="number"
                        value={baseMatchPercent}
                        onChange={(e) => setBaseMatchPercent(parseFloat(e.target.value) || 0)}
                        min={0}
                        max={100}
                        step={0.5}
                      />
                      <p className="text-xs text-muted-foreground">Free contribution</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Match Rate %</Label>
                      <Input
                        type="number"
                        value={matchRate}
                        onChange={(e) => setMatchRate(parseFloat(e.target.value) || 0)}
                        min={0}
                        max={200}
                        step={10}
                      />
                      <p className="text-xs text-muted-foreground">Of your contribution</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Match Up To %</Label>
                      <Input
                        type="number"
                        value={matchUpTo}
                        onChange={(e) => setMatchUpTo(parseFloat(e.target.value) || 0)}
                        min={0}
                        max={100}
                        step={1}
                      />
                      <p className="text-xs text-muted-foreground">Of salary cap</p>
                    </div>
                  </div>

                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 text-sm">
                    <strong>Your Policy:</strong> {baseMatchPercent}% base + {matchRate}% match on first {matchUpTo}% you contribute
                  </div>
                </>
              )}

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-lg bg-chart-1/10 border border-chart-1/20 text-center">
                  <PiggyBank className="h-5 w-5 mx-auto mb-2 text-chart-1" />
                  <p className="text-xs text-muted-foreground">Your Annual 401(k)</p>
                  <p className="text-lg font-bold">${(contrib401k * periodsPerYear).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{employeeContributionPercent.toFixed(1)}% of salary</p>
                </div>
                <div className="p-4 rounded-lg bg-chart-2/10 border border-chart-2/20 text-center">
                  <Gift className="h-5 w-5 mx-auto mb-2 text-chart-2" />
                  <p className="text-xs text-muted-foreground">Employer Base</p>
                  <p className="text-lg font-bold">${(baseContributionPerPay * periodsPerYear).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{baseMatchPercent}% free</p>
                </div>
                <div className="p-4 rounded-lg bg-chart-3/10 border border-chart-3/20 text-center">
                  <TrendingUp className="h-5 w-5 mx-auto mb-2 text-chart-3" />
                  <p className="text-xs text-muted-foreground">Employer Match</p>
                  <p className="text-lg font-bold">${(matchContributionPerPay * periodsPerYear).toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                  <Wallet className="h-5 w-5 mx-auto mb-2 text-green-500" />
                  <p className="text-xs text-muted-foreground">Total Annual</p>
                  <p className="text-lg font-bold text-green-500">
                    ${((contrib401k * periodsPerYear) + annualEmployerTotal).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Per Paycheck */}
              <div className="p-4 rounded-lg border bg-muted/30 space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Per Paycheck Breakdown
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Your 401(k):</span>
                      <span>${contrib401k.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Employer Base:</span>
                      <span className="text-chart-2">${baseContributionPerPay.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Employer Match:</span>
                      <span className="text-chart-3">${matchContributionPerPay.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span>Total to Retirement:</span>
                      <span className="text-green-500">${(contrib401k + totalEmployerContributionPerPay).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Employer Adds:</span>
                      <Badge variant="secondary">${totalEmployerContributionPerPay.toFixed(2)}/pay</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Insight */}
              {enableEmployerMatch && annualEmployerTotal > 0 && (
                <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                  <p className="text-sm">
                    🎉 <strong>Free Money Alert!</strong> Your employer adds <strong>${annualEmployerTotal.toLocaleString()}</strong> per year.
                    {employeeContributionPercent < matchUpTo && (
                      <span className="block mt-1 text-muted-foreground">
                        💡 Tip: You're contributing {employeeContributionPercent.toFixed(1)}% but could get matched up to {matchUpTo}%.
                        Consider increasing to maximize your free money!
                      </span>
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Savings Goals
                  </CardTitle>
                  <CardDescription>
                    Automate post-tax savings into dedicated buckets
                  </CardDescription>
                </div>
                <Button onClick={addBucket} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Goal
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deductions.buckets.map(bucket => (
                  <Card key={bucket.id} className="group">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <Input
                          type="text"
                          value={bucket.name}
                          onChange={(e) => updateBucket(bucket.id, 'name', e.target.value)}
                          className="font-medium border-none p-0 h-auto focus-visible:ring-0"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBucket(bucket.id)}
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Type</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateBucket(bucket.id, 'type', bucket.type === 'fixed' ? 'percentage' : 'fixed')}
                            className="w-full justify-start text-xs"
                          >
                            {bucket.type === 'percentage' ? '% Net' : '$ Fixed'}
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Amount</Label>
                          <Input
                            type="number"
                            value={bucket.value}
                            onChange={(e) => updateBucket(bucket.id, 'value', parseFloat(e.target.value) || 0)}
                            className="h-8"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm text-green-500 pt-2 border-t">
                        <span>Per Paycheck:</span>
                        <span className="font-bold">
                          ${(bucket.type === 'percentage' ? (netAfterTax * bucket.value) / 100 : bucket.value).toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {deductions.buckets.length === 0 && (
                  <div className="col-span-full text-center py-10 text-muted-foreground">
                    No savings goals yet. Add one to prioritize your surplus.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="compare" className="space-y-6">
          <ScenarioComparison
            grossInput={grossInput}
            payCycle={payCycle}
            periodsPerYear={periodsPerYear}
            zipCode={zipCode}
            filingStatus={filingStatus}
            enableEmployerMatch={enableEmployerMatch}
            baseMatchPercent={baseMatchPercent}
            matchRate={matchRate}
            matchUpTo={matchUpTo}
            healthIns={deductions.healthIns}
            taxRate={financials.taxRate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// --- Scenario Comparison Sub-Component ---

interface ScenarioConfig {
  fourOhOneKPercent: number;
  hsaPercent: number;
  rothIRA: number;
  brokerage: number;
}

interface ScenarioComparisonProps {
  grossInput: number;
  payCycle: string;
  periodsPerYear: number;
  zipCode: string;
  filingStatus: string;
  enableEmployerMatch: boolean;
  baseMatchPercent: number;
  matchRate: number;
  matchUpTo: number;
  healthIns: number;
  taxRate: number;
}

const defaultScenarioA: ScenarioConfig = { fourOhOneKPercent: 10, hsaPercent: 3, rothIRA: 250, brokerage: 300 };
const defaultScenarioB: ScenarioConfig = { fourOhOneKPercent: 20, hsaPercent: 5, rothIRA: 500, brokerage: 0 };

const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({
  grossInput, periodsPerYear, enableEmployerMatch, baseMatchPercent, matchRate, matchUpTo, healthIns, taxRate,
}) => {
  const [scenarioA, setScenarioA] = useState<ScenarioConfig>(defaultScenarioA);
  const [scenarioB, setScenarioB] = useState<ScenarioConfig>(defaultScenarioB);

  const calcScenario = (s: ScenarioConfig) => {
    const contrib401k = grossInput * s.fourOhOneKPercent / 100;
    const contribHsa = grossInput * s.hsaPercent / 100;
    const totalPreTax = contrib401k + contribHsa;
    const taxableGross = Math.max(0, grossInput - totalPreTax);
    const estTax = taxableGross * (taxRate / 100);
    const netAfterTax = Math.max(0, taxableGross - estTax - healthIns);
    const totalPostTax = s.rothIRA + s.brokerage;
    const disposable = Math.max(0, netAfterTax - totalPostTax);
    const totalSavings = totalPreTax + totalPostTax;

    const employeePercent = grossInput > 0 ? (contrib401k / grossInput) * 100 : 0;
    const baseMatch = enableEmployerMatch ? (baseMatchPercent / 100) * grossInput : 0;
    const matchable = Math.min(employeePercent, matchUpTo);
    const matchContrib = enableEmployerMatch ? (matchRate / 100) * (matchable / 100) * grossInput : 0;
    const employerTotal = baseMatch + matchContrib;

    return {
      contrib401k, contribHsa, totalPreTax, estTax, netAfterTax,
      totalPostTax, disposable, totalSavings, employerTotal,
      savingsRate: grossInput > 0 ? (totalSavings / grossInput * 100) : 0,
      annualSavings: totalSavings * periodsPerYear,
      annualEmployer: employerTotal * periodsPerYear,
    };
  };

  const a = calcScenario(scenarioA);
  const b = calcScenario(scenarioB);

  const renderScenarioInputs = (label: string, scenario: ScenarioConfig, setter: React.Dispatch<React.SetStateAction<ScenarioConfig>>, color: string) => (
    <Card className={`border-${color}/30`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Badge variant="outline" className={`text-${color}`}>{label}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">401(k) %</Label>
          <Input type="number" value={scenario.fourOhOneKPercent}
            onChange={(e) => setter(p => ({ ...p, fourOhOneKPercent: parseFloat(e.target.value) || 0 }))} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">HSA %</Label>
          <Input type="number" value={scenario.hsaPercent}
            onChange={(e) => setter(p => ({ ...p, hsaPercent: parseFloat(e.target.value) || 0 }))} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Roth IRA ($/pay)</Label>
          <Input type="number" value={scenario.rothIRA}
            onChange={(e) => setter(p => ({ ...p, rothIRA: parseFloat(e.target.value) || 0 }))} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Brokerage ($/pay)</Label>
          <Input type="number" value={scenario.brokerage}
            onChange={(e) => setter(p => ({ ...p, brokerage: parseFloat(e.target.value) || 0 }))} />
        </div>
      </CardContent>
    </Card>
  );

  const renderMetric = (label: string, valA: number, valB: number, isCurrency = true, higherIsBetter = true) => {
    const diff = valB - valA;
    const better = higherIsBetter ? diff > 0 : diff < 0;
    return (
      <div className="flex items-center justify-between py-2 border-b last:border-0">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex items-center gap-4 text-sm">
          <span className="font-medium w-24 text-right">{isCurrency ? `$${Math.round(valA).toLocaleString()}` : `${valA.toFixed(1)}%`}</span>
          <span className="font-medium w-24 text-right">{isCurrency ? `$${Math.round(valB).toLocaleString()}` : `${valB.toFixed(1)}%`}</span>
          <Badge variant={diff === 0 ? 'secondary' : better ? 'default' : 'destructive'} className="w-24 justify-center text-xs">
            {diff === 0 ? 'Same' : `${diff > 0 ? '+' : ''}${isCurrency ? `$${Math.round(diff).toLocaleString()}` : `${diff.toFixed(1)}%`}`}
          </Badge>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Strategy Comparison
          </CardTitle>
          <CardDescription>
            Compare two contribution strategies side by side to find the optimal allocation
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderScenarioInputs('Scenario A', scenarioA, setScenarioA, 'chart-1')}
        {renderScenarioInputs('Scenario B', scenarioB, setScenarioB, 'chart-2')}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Per-Paycheck Comparison</CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
            <span className="w-[calc(100%-20rem)]"></span>
            <span className="w-24 text-right font-bold">Scenario A</span>
            <span className="w-24 text-right font-bold">Scenario B</span>
            <span className="w-24 text-center font-bold">Delta</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-0">
          {renderMetric('Pre-Tax Savings', a.totalPreTax, b.totalPreTax)}
          {renderMetric('Estimated Taxes', a.estTax, b.estTax, true, false)}
          {renderMetric('Post-Tax Savings', a.totalPostTax, b.totalPostTax)}
          {renderMetric('Disposable Income', a.disposable, b.disposable)}
          {renderMetric('Total Savings', a.totalSavings, b.totalSavings)}
          {renderMetric('Employer Match', a.employerTotal, b.employerTotal)}
          {renderMetric('Savings Rate', a.savingsRate, b.savingsRate, false)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Annual Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted text-center">
              <p className="text-xs text-muted-foreground mb-1">Scenario A Annual Savings</p>
              <p className="text-2xl font-bold">${a.annualSavings.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">+ ${a.annualEmployer.toLocaleString()} employer</p>
            </div>
            <div className="p-4 rounded-lg bg-muted text-center">
              <p className="text-xs text-muted-foreground mb-1">Scenario B Annual Savings</p>
              <p className="text-2xl font-bold">${b.annualSavings.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">+ ${b.annualEmployer.toLocaleString()} employer</p>
            </div>
          </div>
          {a.annualSavings !== b.annualSavings && (
            <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20 text-sm text-center">
              {b.annualSavings > a.annualSavings
                ? `📈 Scenario B saves $${(b.annualSavings - a.annualSavings).toLocaleString()} more per year`
                : `📈 Scenario A saves $${(a.annualSavings - b.annualSavings).toLocaleString()} more per year`}
              {' — '}
              {b.annualEmployer > a.annualEmployer
                ? `with $${(b.annualEmployer - a.annualEmployer).toLocaleString()} more employer match`
                : a.annualEmployer > b.annualEmployer
                ? `but $${(a.annualEmployer - b.annualEmployer).toLocaleString()} less employer match`
                : 'with equal employer match'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IgnitePaycheckPlanner;
