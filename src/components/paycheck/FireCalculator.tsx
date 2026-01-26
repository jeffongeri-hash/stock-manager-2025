import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Flame, TrendingUp, Target, Calendar, Wallet, PiggyBank, Sparkles, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';

interface Deduction {
  id: string;
  label: string;
  value: number;
  type: 'percentage' | 'amount';
}

interface FireCalculatorProps {
  grossPay: number;
  netPay: number;
  payFrequency: string;
  preTaxDeductions: Deduction[];
  postTaxDeductions: Deduction[];
}

const getPayPeriodsPerYear = (frequency: string): number => {
  switch (frequency) {
    case 'weekly': return 52;
    case 'biweekly': return 26;
    case 'semimonthly': return 24;
    case 'monthly': return 12;
    default: return 26;
  }
};

const RETIREMENT_LABELS = ['401(k)', '401k', '403(b)', '403b', '457(b)', '457b', 'roth 401(k)', 'roth 401k', 'roth ira', 'ira'];

export function FireCalculator({
  grossPay,
  netPay,
  payFrequency,
  preTaxDeductions,
  postTaxDeductions,
}: FireCalculatorProps) {
  const [currentAge, setCurrentAge] = useState(30);
  const [currentSavings, setCurrentSavings] = useState(50000);
  const [annualExpenses, setAnnualExpenses] = useState(50000);
  const [expectedReturn, setExpectedReturn] = useState(7);
  const [safeWithdrawalRate, setSafeWithdrawalRate] = useState(4);
  
  // Employer match config (mirroring EmployerMatchProjection)
  const [employerMatchEnabled, setEmployerMatchEnabled] = useState(true);
  const [baseMatchPercent] = useState(2);
  const [matchRate] = useState(50);
  const [matchUpTo] = useState(6);

  const periods = getPayPeriodsPerYear(payFrequency);
  const annualGross = grossPay * periods;
  const annualNet = netPay * periods;

  // Calculate savings from deductions
  const getDeductionAmount = (deduction: Deduction): number => {
    if (deduction.type === 'percentage') {
      return (deduction.value / 100) * grossPay;
    }
    return deduction.value;
  };

  const isRetirementDeduction = (label: string): boolean => {
    const lowerLabel = label.toLowerCase();
    return RETIREMENT_LABELS.some(r => lowerLabel.includes(r.toLowerCase()));
  };

  const isSavingsDeduction = (label: string): boolean => {
    const lowerLabel = label.toLowerCase();
    return isRetirementDeduction(label) || 
      lowerLabel.includes('hsa') || 
      lowerLabel.includes('savings');
  };

  // Calculate total savings per paycheck
  const preTaxSavings = preTaxDeductions
    .filter(d => isSavingsDeduction(d.label))
    .reduce((sum, d) => sum + getDeductionAmount(d), 0);

  const postTaxSavings = postTaxDeductions
    .filter(d => isSavingsDeduction(d.label))
    .reduce((sum, d) => sum + getDeductionAmount(d), 0);

  // Calculate retirement contributions for employer match
  const retirementContributions = preTaxDeductions
    .filter(d => isRetirementDeduction(d.label))
    .reduce((sum, d) => sum + getDeductionAmount(d), 0);
  
  const employeeContributionPercent = grossPay > 0 ? (retirementContributions / grossPay) * 100 : 0;
  
  // Employer match calculation
  const baseContributionPerPay = employerMatchEnabled ? (baseMatchPercent / 100) * grossPay : 0;
  const effectiveMatchablePercent = Math.min(employeeContributionPercent, matchUpTo);
  const matchContributionPerPay = employerMatchEnabled 
    ? (matchRate / 100) * (effectiveMatchablePercent / 100) * grossPay 
    : 0;
  const totalEmployerMatch = (baseContributionPerPay + matchContributionPerPay) * periods;

  const totalSavingsPerPaycheck = preTaxSavings + postTaxSavings;
  const annualSavings = (totalSavingsPerPaycheck * periods) + totalEmployerMatch;
  
  // Savings rate calculation (savings / gross income)
  const savingsRate = annualGross > 0 ? (annualSavings / annualGross) * 100 : 0;

  // FIRE calculations
  const fireNumber = annualExpenses / (safeWithdrawalRate / 100);
  const leanFireNumber = fireNumber * 0.6; // 60% of regular FIRE
  const fatFireNumber = fireNumber * 1.5; // 150% of regular FIRE
  const coastFireAge = 65; // Target retirement age for Coast FIRE

  // Years to FIRE calculation using compound interest formula
  const calculateYearsToTarget = (target: number, currentPortfolio: number, annualContribution: number, returnRate: number): number => {
    if (currentPortfolio >= target) return 0;
    if (annualContribution <= 0 && returnRate <= 0) return Infinity;
    
    const r = returnRate / 100;
    let years = 0;
    let portfolio = currentPortfolio;
    
    while (portfolio < target && years < 100) {
      portfolio = portfolio * (1 + r) + annualContribution;
      years++;
    }
    
    return years >= 100 ? Infinity : years;
  };

  const yearsToFire = calculateYearsToTarget(fireNumber, currentSavings, annualSavings, expectedReturn);
  const yearsToLeanFire = calculateYearsToTarget(leanFireNumber, currentSavings, annualSavings, expectedReturn);
  const yearsToFatFire = calculateYearsToTarget(fatFireNumber, currentSavings, annualSavings, expectedReturn);

  const fireAge = yearsToFire < Infinity ? currentAge + yearsToFire : null;
  const leanFireAge = yearsToLeanFire < Infinity ? currentAge + yearsToLeanFire : null;
  const fatFireAge = yearsToFatFire < Infinity ? currentAge + yearsToFatFire : null;

  // Coast FIRE: Amount needed now to reach FIRE by age 65 with no more contributions
  const yearsToCoastTarget = coastFireAge - currentAge;
  const coastFireNumber = yearsToCoastTarget > 0 
    ? fireNumber / Math.pow(1 + expectedReturn / 100, yearsToCoastTarget)
    : fireNumber;
  const coastFireReached = currentSavings >= coastFireNumber;

  // Generate projection data
  const projectionData = useMemo(() => {
    const data = [];
    let portfolio = currentSavings;
    const r = expectedReturn / 100;
    
    for (let year = 0; year <= Math.min(yearsToFatFire + 5, 50); year++) {
      data.push({
        age: currentAge + year,
        year,
        portfolio: Math.round(portfolio),
        leanFire: Math.round(leanFireNumber),
        fire: Math.round(fireNumber),
        fatFire: Math.round(fatFireNumber),
      });
      portfolio = portfolio * (1 + r) + annualSavings;
    }
    
    return data;
  }, [currentSavings, expectedReturn, annualSavings, currentAge, leanFireNumber, fireNumber, fatFireNumber, yearsToFatFire]);

  // Savings rate insights
  const getSavingsRateInsight = () => {
    if (savingsRate >= 50) return { message: "Extreme Saver! You're on the fast track to FIRE.", color: "text-green-500" };
    if (savingsRate >= 30) return { message: "Great savings rate. FIRE is very achievable.", color: "text-emerald-500" };
    if (savingsRate >= 20) return { message: "Solid savings rate. Keep pushing higher if possible.", color: "text-blue-500" };
    if (savingsRate >= 10) return { message: "Average savings rate. Consider increasing contributions.", color: "text-yellow-500" };
    return { message: "Low savings rate. Review expenses or increase income.", color: "text-orange-500" };
  };

  const insight = getSavingsRateInsight();

  return (
    <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-red-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          FIRE Calculator
        </CardTitle>
        <CardDescription>
          Financial Independence, Retire Early - Based on your paycheck data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Savings & Situation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Current Age</Label>
            <Input
              type="number"
              value={currentAge}
              onChange={(e) => setCurrentAge(parseInt(e.target.value) || 0)}
              min={18}
              max={80}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Current Savings ($)</Label>
            <Input
              type="number"
              value={currentSavings}
              onChange={(e) => setCurrentSavings(parseFloat(e.target.value) || 0)}
              min={0}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Annual Expenses ($)</Label>
            <Input
              type="number"
              value={annualExpenses}
              onChange={(e) => setAnnualExpenses(parseFloat(e.target.value) || 0)}
              min={0}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Expected Return (%)</Label>
            <Input
              type="number"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(parseFloat(e.target.value) || 0)}
              min={0}
              max={15}
              step={0.5}
            />
          </div>
        </div>

        {/* Safe Withdrawal Rate Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Safe Withdrawal Rate</Label>
            <Badge variant="outline">{safeWithdrawalRate}%</Badge>
          </div>
          <Slider
            value={[safeWithdrawalRate]}
            onValueChange={([v]) => setSafeWithdrawalRate(v)}
            min={2.5}
            max={5}
            step={0.25}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Standard is 4% (Trinity Study). Lower = more conservative.
          </p>
        </div>

        <Separator />

        {/* Savings Rate from Paycheck */}
        <div className="p-4 rounded-lg bg-muted/50 space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Your Paycheck Savings
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Annual Gross</p>
              <p className="font-bold">${annualGross.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Annual Savings</p>
              <p className="font-bold text-green-500">${annualSavings.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Incl. Employer Match</p>
              <p className="font-bold text-purple-500">${totalEmployerMatch.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Savings Rate</p>
              <p className="font-bold text-orange-500">{savingsRate.toFixed(1)}%</p>
            </div>
          </div>
          <p className={`text-sm ${insight.color}`}>
            <Sparkles className="h-3 w-3 inline mr-1" />
            {insight.message}
          </p>
        </div>

        {/* FIRE Numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-center">
            <Target className="h-5 w-5 mx-auto mb-2 text-yellow-500" />
            <p className="text-xs text-muted-foreground">Lean FIRE</p>
            <p className="text-lg font-bold">${(leanFireNumber / 1000).toFixed(0)}k</p>
            {leanFireAge && (
              <Badge variant="secondary" className="mt-1 text-xs">
                Age {Math.round(leanFireAge)}
              </Badge>
            )}
          </div>
          <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 text-center">
            <Flame className="h-5 w-5 mx-auto mb-2 text-orange-500" />
            <p className="text-xs text-muted-foreground">FIRE Number</p>
            <p className="text-lg font-bold">${(fireNumber / 1000).toFixed(0)}k</p>
            {fireAge && (
              <Badge variant="secondary" className="mt-1 text-xs">
                Age {Math.round(fireAge)}
              </Badge>
            )}
          </div>
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-2 text-red-500" />
            <p className="text-xs text-muted-foreground">Fat FIRE</p>
            <p className="text-lg font-bold">${(fatFireNumber / 1000).toFixed(0)}k</p>
            {fatFireAge && (
              <Badge variant="secondary" className="mt-1 text-xs">
                Age {Math.round(fatFireAge)}
              </Badge>
            )}
          </div>
          <div className={`p-4 rounded-lg text-center ${coastFireReached ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted border'}`}>
            <PiggyBank className={`h-5 w-5 mx-auto mb-2 ${coastFireReached ? 'text-green-500' : 'text-muted-foreground'}`} />
            <p className="text-xs text-muted-foreground">Coast FIRE</p>
            <p className="text-lg font-bold">${(coastFireNumber / 1000).toFixed(0)}k</p>
            <Badge variant={coastFireReached ? "default" : "outline"} className="mt-1 text-xs">
              {coastFireReached ? '✓ Reached!' : `Need $${((coastFireNumber - currentSavings) / 1000).toFixed(0)}k`}
            </Badge>
          </div>
        </div>

        {/* Timeline */}
        <div className="p-4 rounded-lg border bg-gradient-to-r from-orange-500/5 to-transparent">
          <h4 className="font-medium flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4" />
            Your FIRE Timeline
          </h4>
          <div className="space-y-2 text-sm">
            {yearsToLeanFire < Infinity && (
              <div className="flex justify-between items-center">
                <span>Lean FIRE ({60}% expenses)</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{Math.round(yearsToLeanFire)} years</span>
                  <Badge variant="outline">Age {Math.round(leanFireAge!)}</Badge>
                </div>
              </div>
            )}
            {yearsToFire < Infinity && (
              <div className="flex justify-between items-center">
                <span>Regular FIRE</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-orange-500">{Math.round(yearsToFire)} years</span>
                  <Badge variant="outline" className="border-orange-500/50">Age {Math.round(fireAge!)}</Badge>
                </div>
              </div>
            )}
            {yearsToFatFire < Infinity && (
              <div className="flex justify-between items-center">
                <span>Fat FIRE (150% expenses)</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{Math.round(yearsToFatFire)} years</span>
                  <Badge variant="outline">Age {Math.round(fatFireAge!)}</Badge>
                </div>
              </div>
            )}
            {yearsToFire >= Infinity && (
              <div className="flex items-center gap-2 text-orange-500">
                <AlertCircle className="h-4 w-4" />
                <span>Increase savings rate to reach FIRE</span>
              </div>
            )}
          </div>
        </div>

        {/* Projection Chart */}
        <div>
          <h4 className="font-medium text-sm mb-3">Portfolio Growth Projection</h4>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData}>
                <defs>
                  <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="age" 
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Age', position: 'bottom', fontSize: 10 }}
                />
                <YAxis 
                  tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} 
                  tick={{ fontSize: 10 }}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `$${value.toLocaleString()}`,
                    name === 'portfolio' ? 'Your Portfolio' : name
                  ]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <ReferenceLine y={leanFireNumber} stroke="hsl(48, 96%, 53%)" strokeDasharray="5 5" label={{ value: 'Lean', fontSize: 10 }} />
                <ReferenceLine y={fireNumber} stroke="hsl(24, 95%, 53%)" strokeDasharray="5 5" label={{ value: 'FIRE', fontSize: 10 }} />
                <ReferenceLine y={fatFireNumber} stroke="hsl(0, 84%, 60%)" strokeDasharray="5 5" label={{ value: 'Fat', fontSize: 10 }} />
                <Area
                  type="monotone"
                  dataKey="portfolio"
                  stroke="hsl(var(--chart-1))"
                  fill="url(#portfolioGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tips */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 text-sm space-y-2">
          <p className="font-medium">🔥 Quick FIRE Tips</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Every 1% increase in savings rate can reduce years to FIRE by 1-3 years</li>
            <li>Employer match is "free money" - always contribute enough to get the full match</li>
            <li>Coast FIRE means you can stop saving and still retire on time</li>
            <li>Consider house hacking or geo-arbitrage to reduce expenses</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
