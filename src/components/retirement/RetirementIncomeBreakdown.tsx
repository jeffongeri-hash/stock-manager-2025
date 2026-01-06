import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ComposedChart, Line
} from 'recharts';
import { Wallet, PiggyBank, Landmark, Building2, Briefcase, TrendingUp } from 'lucide-react';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

interface IncomeSource {
  name: string;
  icon: React.ElementType;
  annualAmount: number;
  color: string;
}

export const RetirementIncomeBreakdown: React.FC = () => {
  // Income sources state
  const [traditionalIRA, setTraditionalIRA] = useState(500000);
  const [rothIRA, setRothIRA] = useState(200000);
  const [k401, setK401] = useState(800000);
  const [socialSecurity, setSocialSecurity] = useState(30000); // Annual
  const [pension, setPension] = useState(0);
  const [otherIncome, setOtherIncome] = useState(12000); // e.g., rental, part-time work
  
  // Withdrawal settings
  const [withdrawalRate, setWithdrawalRate] = useState(4);
  const [retirementAge, setRetirementAge] = useState(65);
  const [lifeExpectancy, setLifeExpectancy] = useState(90);

  const incomeData = useMemo(() => {
    const iraWithdrawal = (traditionalIRA + rothIRA) * (withdrawalRate / 100);
    const k401Withdrawal = k401 * (withdrawalRate / 100);
    
    const sources: IncomeSource[] = [
      { name: '401(k)', icon: Building2, annualAmount: k401Withdrawal, color: COLORS[0] },
      { name: 'Traditional IRA', icon: PiggyBank, annualAmount: traditionalIRA * (withdrawalRate / 100), color: COLORS[1] },
      { name: 'Roth IRA', icon: PiggyBank, annualAmount: rothIRA * (withdrawalRate / 100), color: COLORS[2] },
      { name: 'Social Security', icon: Landmark, annualAmount: socialSecurity, color: COLORS[3] },
      { name: 'Pension', icon: Briefcase, annualAmount: pension, color: COLORS[4] },
      { name: 'Other Income', icon: Wallet, annualAmount: otherIncome, color: COLORS[5] },
    ].filter(source => source.annualAmount > 0);

    const totalAnnual = sources.reduce((sum, s) => sum + s.annualAmount, 0);
    const totalMonthly = totalAnnual / 12;
    const totalPortfolio = traditionalIRA + rothIRA + k401;

    // Calculate pie chart data with percentages
    const pieData = sources.map(source => ({
      name: source.name,
      value: source.annualAmount,
      percentage: ((source.annualAmount / totalAnnual) * 100).toFixed(1),
      color: source.color
    }));

    // Calculate timeline data
    const timelineData = [];
    let remainingPortfolio = totalPortfolio;
    const annualWithdrawal = (traditionalIRA + rothIRA + k401) * (withdrawalRate / 100);
    const growthRate = 0.05; // Assume 5% growth

    for (let age = retirementAge; age <= lifeExpectancy; age++) {
      const portfolioIncome = Math.max(0, remainingPortfolio * (withdrawalRate / 100));
      const fixedIncome = socialSecurity + pension + otherIncome;
      
      timelineData.push({
        age,
        portfolio: Math.round(remainingPortfolio),
        'Portfolio Income': Math.round(portfolioIncome),
        'Fixed Income': fixedIncome,
        'Total Income': Math.round(portfolioIncome + fixedIncome)
      });

      // Update portfolio for next year (growth minus withdrawals)
      remainingPortfolio = Math.max(0, remainingPortfolio * (1 + growthRate) - annualWithdrawal);
    }

    return {
      sources,
      pieData,
      timelineData,
      totalAnnual,
      totalMonthly,
      totalPortfolio
    };
  }, [traditionalIRA, rothIRA, k401, socialSecurity, pension, otherIncome, withdrawalRate, retirementAge, lifeExpectancy]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Input Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Income Sources
            </CardTitle>
            <CardDescription>
              Enter your retirement account balances and income
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Investment Accounts
              </h4>
              
              <div className="space-y-1">
                <Label className="text-xs">401(k) Balance</Label>
                <Input
                  type="number"
                  value={k401}
                  onChange={(e) => setK401(Number(e.target.value))}
                  className="h-8"
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs">Traditional IRA Balance</Label>
                <Input
                  type="number"
                  value={traditionalIRA}
                  onChange={(e) => setTraditionalIRA(Number(e.target.value))}
                  className="h-8"
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs">Roth IRA Balance</Label>
                <Input
                  type="number"
                  value={rothIRA}
                  onChange={(e) => setRothIRA(Number(e.target.value))}
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Landmark className="h-4 w-4" /> Fixed Income (Annual)
              </h4>
              
              <div className="space-y-1">
                <Label className="text-xs">Social Security</Label>
                <Input
                  type="number"
                  value={socialSecurity}
                  onChange={(e) => setSocialSecurity(Number(e.target.value))}
                  className="h-8"
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs">Pension</Label>
                <Input
                  type="number"
                  value={pension}
                  onChange={(e) => setPension(Number(e.target.value))}
                  className="h-8"
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs">Other Income (Rental, Part-time, etc.)</Label>
                <Input
                  type="number"
                  value={otherIncome}
                  onChange={(e) => setOtherIncome(Number(e.target.value))}
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <h4 className="text-sm font-medium">Settings</h4>
              
              <div className="space-y-1">
                <Label className="text-xs">Withdrawal Rate: {withdrawalRate}%</Label>
                <Slider
                  value={[withdrawalRate]}
                  onValueChange={(value) => setWithdrawalRate(value[0])}
                  min={2}
                  max={6}
                  step={0.25}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Retirement Age</Label>
                  <Input
                    type="number"
                    value={retirementAge}
                    onChange={(e) => setRetirementAge(Number(e.target.value))}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Life Expectancy</Label>
                  <Input
                    type="number"
                    value={lifeExpectancy}
                    onChange={(e) => setLifeExpectancy(Number(e.target.value))}
                    className="h-8"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Retirement Income Breakdown</CardTitle>
            <CardDescription>
              Annual income distribution by source
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeData.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {incomeData.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Total Annual Income</p>
                  <p className="text-3xl font-bold">{formatCurrency(incomeData.totalAnnual)}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatCurrency(incomeData.totalMonthly)}/month
                  </p>
                </div>

                <div className="space-y-2">
                  {incomeData.pieData.map((source, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: source.color }}
                        />
                        <span>{source.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{formatCurrency(source.value)}</span>
                        <span className="text-muted-foreground ml-2">({source.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Retirement Income Timeline
          </CardTitle>
          <CardDescription>
            Projected income and portfolio value throughout retirement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={incomeData.timelineData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="age" 
                  label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  yAxisId="left"
                  tickFormatter={(value) => formatCurrency(value)}
                  label={{ value: 'Income', angle: -90, position: 'insideLeft' }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(value) => formatCurrency(value)}
                  label={{ value: 'Portfolio', angle: 90, position: 'insideRight' }}
                />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="Fixed Income"
                  stackId="income"
                  fill={COLORS[3]}
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  yAxisId="left"
                  dataKey="Portfolio Income"
                  stackId="income"
                  fill={COLORS[0]}
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="portfolio"
                  name="Portfolio Balance"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="p-3 bg-muted rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Starting Portfolio</p>
              <p className="text-lg font-bold">{formatCurrency(incomeData.totalPortfolio)}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Years of Retirement</p>
              <p className="text-lg font-bold">{lifeExpectancy - retirementAge} years</p>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Final Portfolio (Est.)</p>
              <p className="text-lg font-bold">
                {formatCurrency(incomeData.timelineData[incomeData.timelineData.length - 1]?.portfolio || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RetirementIncomeBreakdown;
