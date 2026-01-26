import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Building2, PiggyBank, TrendingUp, Percent, Gift, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

interface Deduction {
  id: string;
  label: string;
  value: number;
  type: 'percentage' | 'amount';
}

interface EmployerMatchProjectionProps {
  grossPay: number;
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

const RETIREMENT_LABELS = ['401(k)', '401k', '403(b)', '403b', '457(b)', '457b', 'Roth 401(k)', 'Roth 401k'];

export function EmployerMatchProjection({ 
  grossPay, 
  payFrequency, 
  preTaxDeductions,
  postTaxDeductions 
}: EmployerMatchProjectionProps) {
  const [enableEmployerMatch, setEnableEmployerMatch] = useState(true);
  const [baseMatchPercent, setBaseMatchPercent] = useState(2); // 2% base contribution
  const [matchRate, setMatchRate] = useState(50); // 50% match
  const [matchUpTo, setMatchUpTo] = useState(6); // up to 6% of salary

  const periods = getPayPeriodsPerYear(payFrequency);
  const annualGross = grossPay * periods;

  // Calculate employee retirement contributions
  const getRetirementContribution = (deduction: Deduction): number => {
    if (deduction.type === 'percentage') {
      return (deduction.value / 100) * grossPay;
    }
    return deduction.value;
  };

  const isRetirementDeduction = (label: string): boolean => {
    const lowerLabel = label.toLowerCase();
    return RETIREMENT_LABELS.some(r => lowerLabel.includes(r.toLowerCase()));
  };

  // Get all retirement deductions (pre-tax and Roth)
  const preTaxRetirement = preTaxDeductions
    .filter(d => isRetirementDeduction(d.label))
    .reduce((sum, d) => sum + getRetirementContribution(d), 0);

  const rothRetirement = postTaxDeductions
    .filter(d => isRetirementDeduction(d.label))
    .reduce((sum, d) => sum + getRetirementContribution(d), 0);

  const totalEmployeeRetirementPerPay = preTaxRetirement + rothRetirement;
  const employeeContributionPercent = grossPay > 0 ? (totalEmployeeRetirementPerPay / grossPay) * 100 : 0;

  // Calculate employer match
  const baseContributionPerPay = enableEmployerMatch ? (baseMatchPercent / 100) * grossPay : 0;
  
  // Match: 50% of employee contribution up to 6% of salary
  const effectiveMatchablePercent = Math.min(employeeContributionPercent, matchUpTo);
  const matchContributionPerPay = enableEmployerMatch 
    ? (matchRate / 100) * (effectiveMatchablePercent / 100) * grossPay 
    : 0;

  const totalEmployerContributionPerPay = baseContributionPerPay + matchContributionPerPay;

  // Annual calculations
  const annualEmployeeContribution = totalEmployeeRetirementPerPay * periods;
  const annualEmployerBase = baseContributionPerPay * periods;
  const annualEmployerMatch = matchContributionPerPay * periods;
  const annualEmployerTotal = totalEmployerContributionPerPay * periods;
  const totalRetirementValue = annualEmployeeContribution + annualEmployerTotal;

  // Chart data for breakdown
  const chartData = [
    { 
      name: 'Your Contribution', 
      amount: annualEmployeeContribution,
      fill: 'hsl(var(--chart-1))'
    },
    { 
      name: 'Employer Base', 
      amount: annualEmployerBase,
      fill: 'hsl(var(--chart-2))'
    },
    { 
      name: 'Employer Match', 
      amount: annualEmployerMatch,
      fill: 'hsl(var(--chart-3))'
    },
  ].filter(d => d.amount > 0);

  // Monthly breakdown for year visualization
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthsCompleted = i + 1;
    return {
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
      employee: (annualEmployeeContribution / 12) * monthsCompleted,
      employer: (annualEmployerTotal / 12) * monthsCompleted,
    };
  });

  const freeMoneyPercent = annualEmployeeContribution > 0 
    ? (annualEmployerTotal / annualEmployeeContribution * 100).toFixed(0) 
    : '0';

  return (
    <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Employer Match & Retirement Projection
        </CardTitle>
        <CardDescription>
          Configure your employer's matching policy to see total retirement value
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Employer Match Configuration */}
        <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-purple-500" />
              <Label>Enable Employer Match</Label>
            </div>
            <Switch 
              checked={enableEmployerMatch} 
              onCheckedChange={setEnableEmployerMatch}
            />
          </div>

          {enableEmployerMatch && (
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Base Contribution %</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={baseMatchPercent}
                    onChange={(e) => setBaseMatchPercent(parseFloat(e.target.value) || 0)}
                    className="pr-6"
                    min={0}
                    max={100}
                    step={0.5}
                  />
                  <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">Free contribution</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Match Rate %</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={matchRate}
                    onChange={(e) => setMatchRate(parseFloat(e.target.value) || 0)}
                    className="pr-6"
                    min={0}
                    max={200}
                    step={10}
                  />
                  <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">Of your contribution</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Match Up To %</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={matchUpTo}
                    onChange={(e) => setMatchUpTo(parseFloat(e.target.value) || 0)}
                    className="pr-6"
                    min={0}
                    max={100}
                    step={1}
                  />
                  <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">Of salary cap</p>
              </div>
            </div>
          )}

          {enableEmployerMatch && (
            <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20 text-sm">
              <strong>Your Policy:</strong> {baseMatchPercent}% base + {matchRate}% match on first {matchUpTo}% you contribute
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-lg bg-chart-1/10 border border-chart-1/20 text-center">
            <PiggyBank className="h-5 w-5 mx-auto mb-2 text-chart-1" />
            <p className="text-xs text-muted-foreground">Your Annual</p>
            <p className="text-lg font-bold">${annualEmployeeContribution.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{employeeContributionPercent.toFixed(1)}% of salary</p>
          </div>
          <div className="p-4 rounded-lg bg-chart-2/10 border border-chart-2/20 text-center">
            <Gift className="h-5 w-5 mx-auto mb-2 text-chart-2" />
            <p className="text-xs text-muted-foreground">Employer Base</p>
            <p className="text-lg font-bold">${annualEmployerBase.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{baseMatchPercent}% free</p>
          </div>
          <div className="p-4 rounded-lg bg-chart-3/10 border border-chart-3/20 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-2 text-chart-3" />
            <p className="text-xs text-muted-foreground">Employer Match</p>
            <p className="text-lg font-bold">${annualEmployerMatch.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">+{freeMoneyPercent}% ROI</p>
          </div>
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
            <Wallet className="h-5 w-5 mx-auto mb-2 text-green-500" />
            <p className="text-xs text-muted-foreground">Total Annual</p>
            <p className="text-lg font-bold text-green-500">${totalRetirementValue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{(totalRetirementValue / annualGross * 100).toFixed(1)}% of salary</p>
          </div>
        </div>

        {/* Per Paycheck Details */}
        <div className="p-4 rounded-lg border bg-muted/30 space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Per Paycheck Breakdown
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your Contribution:</span>
                <span>${totalEmployeeRetirementPerPay.toFixed(2)}</span>
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
                <span className="text-green-500">${(totalEmployeeRetirementPerPay + totalEmployerContributionPerPay).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Employer Adds:</span>
                <Badge variant="secondary" className="text-xs">
                  ${totalEmployerContributionPerPay.toFixed(2)}/pay
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Year Growth Chart */}
        <div>
          <h4 className="font-medium text-sm mb-3">Cumulative Retirement Growth by Month</h4>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                <Tooltip 
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="employee" 
                  name="Your Contributions"
                  stackId="a"
                  fill="hsl(var(--chart-1))"
                  radius={[0, 0, 0, 0]}
                />
                <Bar 
                  dataKey="employer" 
                  name="Employer Contributions"
                  stackId="a"
                  fill="hsl(var(--chart-3))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insight */}
        {enableEmployerMatch && annualEmployerTotal > 0 && (
          <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <p className="text-sm">
              🎉 <strong>Free Money Alert!</strong> Your employer adds <strong>${annualEmployerTotal.toLocaleString()}</strong> per year 
              to your retirement. That's <strong>{freeMoneyPercent}%</strong> extra on top of your contributions.
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
  );
}
