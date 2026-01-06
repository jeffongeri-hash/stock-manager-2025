import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, ComposedChart, Line
} from 'recharts';
import { Calculator, TrendingDown, AlertCircle, Info, Calendar, DollarSign } from 'lucide-react';

// IRS Uniform Lifetime Table (2024)
const UNIFORM_LIFETIME_TABLE: Record<number, number> = {
  72: 27.4, 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1,
  80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2, 87: 14.4,
  88: 13.7, 89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5, 95: 8.9,
  96: 8.4, 97: 7.8, 98: 7.3, 99: 6.8, 100: 6.4, 101: 6.0, 102: 5.6, 103: 5.2,
  104: 4.9, 105: 4.6, 106: 4.3, 107: 4.1, 108: 3.9, 109: 3.7, 110: 3.5, 111: 3.4,
  112: 3.3, 113: 3.1, 114: 3.0, 115: 2.9, 116: 2.8, 117: 2.7, 118: 2.5, 119: 2.3, 120: 2.0
};

// Get distribution period, default to last available if age exceeds table
const getDistributionPeriod = (age: number): number => {
  if (age < 72) return UNIFORM_LIFETIME_TABLE[72];
  if (age > 120) return UNIFORM_LIFETIME_TABLE[120];
  return UNIFORM_LIFETIME_TABLE[age] || 2.0;
};

export const RMDCalculator: React.FC = () => {
  const [accountBalance, setAccountBalance] = useState(1000000);
  const [currentAge, setCurrentAge] = useState(73);
  const [expectedReturn, setExpectedReturn] = useState(5);
  const [taxRate, setTaxRate] = useState(22);
  const [projectionYears, setProjectionYears] = useState(20);

  const calculations = useMemo(() => {
    const rmdStartAge = 73; // SECURE 2.0 Act
    
    // Current year RMD
    const distributionPeriod = getDistributionPeriod(currentAge);
    const currentRMD = currentAge >= 73 ? accountBalance / distributionPeriod : 0;
    const taxOnRMD = currentRMD * (taxRate / 100);
    const afterTaxRMD = currentRMD - taxOnRMD;

    // Project RMDs over time
    const projectionData = [];
    let balance = accountBalance;
    let cumulativeRMD = 0;
    let cumulativeTax = 0;

    for (let year = 0; year <= projectionYears; year++) {
      const age = currentAge + year;
      const period = getDistributionPeriod(age);
      const rmd = age >= 73 ? balance / period : 0;
      const tax = rmd * (taxRate / 100);
      
      cumulativeRMD += rmd;
      cumulativeTax += tax;

      projectionData.push({
        year,
        age,
        balance: Math.round(balance),
        rmd: Math.round(rmd),
        tax: Math.round(tax),
        afterTax: Math.round(rmd - tax),
        distributionPeriod: period,
        cumulativeRMD: Math.round(cumulativeRMD),
        cumulativeTax: Math.round(cumulativeTax)
      });

      // Update balance for next year (growth minus RMD)
      balance = (balance - rmd) * (1 + expectedReturn / 100);
      if (balance < 0) balance = 0;
    }

    // Calculate RMD as percentage of portfolio over time
    const rmdPercentages = projectionData.map(d => ({
      age: d.age,
      percentage: d.balance > 0 ? (d.rmd / d.balance) * 100 : 0
    }));

    // Estimate remaining balance at end of projection
    const finalBalance = projectionData[projectionData.length - 1]?.balance || 0;
    const totalRMDs = cumulativeRMD;
    const totalTaxes = cumulativeTax;

    return {
      currentRMD,
      taxOnRMD,
      afterTaxRMD,
      distributionPeriod,
      projectionData,
      rmdPercentages,
      finalBalance,
      totalRMDs,
      totalTaxes,
      rmdStartAge
    };
  }, [accountBalance, currentAge, expectedReturn, taxRate, projectionYears]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const yearsUntilRMD = Math.max(0, 73 - currentAge);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Input Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              RMD Calculator
            </CardTitle>
            <CardDescription>
              Calculate Required Minimum Distributions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Traditional IRA/401k Balance (Dec 31)</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={accountBalance}
                  onChange={(e) => setAccountBalance(Number(e.target.value))}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Use prior year-end balance for RMD calculation
              </p>
            </div>

            <div className="space-y-2">
              <Label>Your Age: {currentAge}</Label>
              <Slider
                value={[currentAge]}
                onValueChange={(value) => setCurrentAge(value[0])}
                min={50}
                max={100}
                step={1}
              />
              {currentAge < 73 && (
                <p className="text-xs text-muted-foreground">
                  RMDs begin at age 73. You have {yearsUntilRMD} years.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Expected Return: {expectedReturn}%</Label>
              <Slider
                value={[expectedReturn]}
                onValueChange={(value) => setExpectedReturn(value[0])}
                min={0}
                max={10}
                step={0.5}
              />
            </div>

            <div className="space-y-2">
              <Label>Estimated Tax Rate: {taxRate}%</Label>
              <Slider
                value={[taxRate]}
                onValueChange={(value) => setTaxRate(value[0])}
                min={10}
                max={37}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Projection Years: {projectionYears}</Label>
              <Slider
                value={[projectionYears]}
                onValueChange={(value) => setProjectionYears(value[0])}
                min={5}
                max={30}
                step={1}
              />
            </div>

            {/* Current RMD Summary */}
            <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg space-y-3">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {currentAge >= 73 ? 'Your RMD This Year' : 'RMD at Age 73'}
                </p>
                <p className="text-3xl font-bold">
                  {formatCurrency(currentAge >= 73 ? calculations.currentRMD : accountBalance / getDistributionPeriod(73))}
                </p>
                <Badge variant={currentAge >= 73 ? 'default' : 'secondary'} className="mt-1">
                  {currentAge >= 73 ? 'Required Now' : `Starts in ${yearsUntilRMD} years`}
                </Badge>
              </div>
              
              {currentAge >= 73 && (
                <div className="border-t border-primary/20 pt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Distribution Period:</span>
                    <span className="font-medium">{calculations.distributionPeriod} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Tax ({taxRate}%):</span>
                    <span className="font-medium text-red-500">-{formatCurrency(calculations.taxOnRMD)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">After-Tax Amount:</span>
                    <span className="font-medium text-green-600">{formatCurrency(calculations.afterTaxRMD)}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* RMD Projection Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>RMD Projection Over Time</CardTitle>
            <CardDescription>
              How your required distributions and balance change over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={calculations.projectionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="age" label={{ value: 'Age', position: 'insideBottom', offset: -5 }} />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    name="Account Balance"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    stroke="hsl(var(--primary))"
                  />
                  <Bar dataKey="rmd" name="RMD" fill="#f59e0b" />
                  <Line
                    type="monotone"
                    dataKey="afterTax"
                    name="After-Tax RMD"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Starting Balance</p>
                <p className="text-lg font-bold">{formatCurrency(accountBalance)}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Ending Balance</p>
                <p className="text-lg font-bold">{formatCurrency(calculations.finalBalance)}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Total RMDs</p>
                <p className="text-lg font-bold">{formatCurrency(calculations.totalRMDs)}</p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Total Taxes</p>
                <p className="text-lg font-bold text-red-500">{formatCurrency(calculations.totalTaxes)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RMD Percentage and Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* RMD as Percentage of Portfolio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              RMD as % of Portfolio
            </CardTitle>
            <CardDescription>
              Your required withdrawal rate increases with age
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={calculations.projectionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="age" />
                  <YAxis tickFormatter={(val) => `${val.toFixed(1)}%`} domain={[0, 'auto']} />
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => {
                      const percentage = props.payload.balance > 0 
                        ? ((props.payload.rmd / props.payload.balance) * 100).toFixed(2)
                        : 0;
                      return [`${percentage}%`, 'RMD Rate'];
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={(d) => d.balance > 0 ? (d.rmd / d.balance) * 100 : 0}
                    name="RMD %"
                    fill="#f59e0b"
                    fillOpacity={0.3}
                    stroke="#f59e0b"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribution Period Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              IRS Uniform Lifetime Table
            </CardTitle>
            <CardDescription>
              Distribution periods used to calculate RMDs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 text-sm max-h-[200px] overflow-y-auto">
              {Object.entries(UNIFORM_LIFETIME_TABLE).slice(0, 20).map(([age, period]) => (
                <div 
                  key={age}
                  className={`p-2 rounded text-center ${
                    Number(age) === currentAge 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-xs text-muted-foreground">Age {age}</p>
                  <p className="font-medium">{period}</p>
                </div>
              ))}
            </div>
            
            <p className="text-xs text-muted-foreground mt-3">
              RMD = Account Balance ÷ Distribution Period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Important Notes */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-500 shrink-0" />
                <h4 className="font-medium text-blue-700 dark:text-blue-400">SECURE 2.0 Act Changes</h4>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 ml-6">
                <li>• RMD age increased to 73 (2023+)</li>
                <li>• RMD age increases to 75 in 2033</li>
                <li>• Reduced penalty: 25% (from 50%), or 10% if corrected quickly</li>
                <li>• Roth 401(k)s no longer require RMDs</li>
              </ul>
            </div>
            
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0" />
                <h4 className="font-medium text-yellow-700 dark:text-yellow-400">Tax Planning Tips</h4>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 ml-6">
                <li>• RMDs are taxed as ordinary income</li>
                <li>• Consider Roth conversions before RMDs begin</li>
                <li>• QCDs can satisfy RMDs tax-free (up to $105,000)</li>
                <li>• Take RMD before Dec 31 to avoid penalties</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RMDCalculator;
