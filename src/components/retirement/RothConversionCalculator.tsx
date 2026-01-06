import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, Cell, ComposedChart, Line
} from 'recharts';
import { ArrowRightLeft, TrendingUp, DollarSign, Calculator, Info, AlertCircle } from 'lucide-react';

// 2024 Tax Brackets (Single filer - adjust for married filing jointly)
const TAX_BRACKETS_SINGLE = [
  { min: 0, max: 11600, rate: 10 },
  { min: 11600, max: 47150, rate: 12 },
  { min: 47150, max: 100525, rate: 22 },
  { min: 100525, max: 191950, rate: 24 },
  { min: 191950, max: 243725, rate: 32 },
  { min: 243725, max: 609350, rate: 35 },
  { min: 609350, max: Infinity, rate: 37 }
];

const TAX_BRACKETS_MARRIED = [
  { min: 0, max: 23200, rate: 10 },
  { min: 23200, max: 94300, rate: 12 },
  { min: 94300, max: 201050, rate: 22 },
  { min: 201050, max: 383900, rate: 24 },
  { min: 383900, max: 487450, rate: 32 },
  { min: 487450, max: 731200, rate: 35 },
  { min: 731200, max: Infinity, rate: 37 }
];

const calculateTax = (income: number, brackets: typeof TAX_BRACKETS_SINGLE): number => {
  let tax = 0;
  let remainingIncome = income;
  
  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;
    const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
    tax += taxableInBracket * (bracket.rate / 100);
    remainingIncome -= taxableInBracket;
  }
  
  return tax;
};

const getMarginalRate = (income: number, brackets: typeof TAX_BRACKETS_SINGLE): number => {
  for (const bracket of brackets) {
    if (income <= bracket.max) {
      return bracket.rate;
    }
  }
  return 37;
};

export const RothConversionCalculator: React.FC = () => {
  const [traditionalBalance, setTraditionalBalance] = useState(500000);
  const [currentAge, setCurrentAge] = useState(55);
  const [retirementAge, setRetirementAge] = useState(60);
  const [currentIncome, setCurrentIncome] = useState(50000);
  const [conversionAmount, setConversionAmount] = useState(40000);
  const [expectedReturn, setExpectedReturn] = useState(7);
  const [filingStatus, setFilingStatus] = useState<'single' | 'married'>('married');
  const [futureRate, setFutureRate] = useState(22);

  const brackets = filingStatus === 'single' ? TAX_BRACKETS_SINGLE : TAX_BRACKETS_MARRIED;

  const calculations = useMemo(() => {
    const yearsToRetirement = retirementAge - currentAge;
    const years59Half = Math.max(0, 59.5 - currentAge);
    
    // Current tax situation
    const taxableIncomeWithConversion = currentIncome + conversionAmount;
    const taxWithConversion = calculateTax(taxableIncomeWithConversion, brackets);
    const taxWithoutConversion = calculateTax(currentIncome, brackets);
    const conversionTax = taxWithConversion - taxWithoutConversion;
    const effectiveConversionRate = (conversionTax / conversionAmount) * 100;
    const marginalRate = getMarginalRate(taxableIncomeWithConversion, brackets);

    // Ladder conversion plan
    const ladderData = [];
    let remainingTraditional = traditionalBalance;
    const annualConversion = conversionAmount;
    const monthlyReturn = expectedReturn / 100 / 12;

    for (let year = 0; year <= yearsToRetirement + 10; year++) {
      const age = currentAge + year;
      const yearConversion = year < yearsToRetirement ? annualConversion : 0;
      const taxOnConversion = year < yearsToRetirement 
        ? calculateTax(currentIncome + yearConversion, brackets) - calculateTax(currentIncome, brackets)
        : 0;

      // Track what's available (5-year seasoning rule)
      const availableForWithdrawal = year >= 5 ? annualConversion : 0;

      ladderData.push({
        year,
        age,
        traditionalBalance: Math.round(remainingTraditional),
        conversion: yearConversion,
        taxPaid: Math.round(taxOnConversion),
        available: availableForWithdrawal,
        phase: year < yearsToRetirement ? 'Conversion' : 'Withdrawal'
      });

      // Update balances for next year
      remainingTraditional = (remainingTraditional - yearConversion) * (1 + expectedReturn / 100);
    }

    // Calculate total conversions and taxes
    const totalConversions = yearsToRetirement * annualConversion;
    const totalTaxesPaid = ladderData.reduce((sum, d) => sum + d.taxPaid, 0);
    
    // Future value comparison
    const convertedGrowth = totalConversions * Math.pow(1 + expectedReturn / 100, yearsToRetirement);
    const traditionalGrowth = totalConversions * Math.pow(1 + expectedReturn / 100, yearsToRetirement);
    const futureTaxOnTraditional = traditionalGrowth * (futureRate / 100);
    const taxSavings = futureTaxOnTraditional - totalTaxesPaid;

    // Bracket space analysis
    const bracketSpaceData = brackets.map(bracket => {
      const spaceUsed = Math.min(
        Math.max(0, taxableIncomeWithConversion - bracket.min),
        bracket.max - bracket.min
      );
      const spaceAvailable = bracket.max - bracket.min - Math.max(0, currentIncome - bracket.min);
      
      return {
        bracket: `${bracket.rate}%`,
        rate: bracket.rate,
        used: Math.max(0, Math.min(spaceUsed, bracket.max - bracket.min)),
        available: Math.max(0, spaceAvailable),
        total: bracket.max === Infinity ? 200000 : bracket.max - bracket.min
      };
    }).filter(b => b.rate <= 32); // Only show up to 32% bracket

    return {
      taxWithConversion,
      taxWithoutConversion,
      conversionTax,
      effectiveConversionRate,
      marginalRate,
      ladderData,
      totalConversions,
      totalTaxesPaid,
      taxSavings,
      bracketSpaceData,
      yearsToRetirement
    };
  }, [traditionalBalance, currentAge, retirementAge, currentIncome, conversionAmount, expectedReturn, filingStatus, futureRate, brackets]);

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
              <ArrowRightLeft className="h-5 w-5" />
              Roth Conversion Ladder
            </CardTitle>
            <CardDescription>
              Plan tax-efficient conversions from Traditional to Roth
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Traditional IRA/401k Balance</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={traditionalBalance}
                  onChange={(e) => setTraditionalBalance(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Current Age</Label>
                <Input
                  type="number"
                  value={currentAge}
                  onChange={(e) => setCurrentAge(Number(e.target.value))}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Retirement Age</Label>
                <Input
                  type="number"
                  value={retirementAge}
                  onChange={(e) => setRetirementAge(Number(e.target.value))}
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Filing Status</Label>
              <Select value={filingStatus} onValueChange={(val: 'single' | 'married') => setFilingStatus(val)}>
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
              <Label>Other Taxable Income</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={currentIncome}
                  onChange={(e) => setCurrentIncome(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Annual Conversion Amount: {formatCurrency(conversionAmount)}</Label>
              <Slider
                value={[conversionAmount]}
                onValueChange={(value) => setConversionAmount(value[0])}
                min={5000}
                max={150000}
                step={1000}
              />
            </div>

            <div className="space-y-2">
              <Label>Expected Return: {expectedReturn}%</Label>
              <Slider
                value={[expectedReturn]}
                onValueChange={(value) => setExpectedReturn(value[0])}
                min={3}
                max={12}
                step={0.5}
              />
            </div>

            <div className="space-y-2">
              <Label>Expected Future Tax Rate: {futureRate}%</Label>
              <Slider
                value={[futureRate]}
                onValueChange={(value) => setFutureRate(value[0])}
                min={10}
                max={37}
                step={1}
              />
            </div>
          </CardContent>
        </Card>

        {/* Analysis Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Conversion Tax Analysis</CardTitle>
            <CardDescription>
              Understanding your tax impact and bracket utilization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Conversion Tax</p>
                <p className="text-xl font-bold text-red-500">
                  {formatCurrency(calculations.conversionTax)}
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Effective Rate</p>
                <p className="text-xl font-bold">
                  {calculations.effectiveConversionRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Marginal Rate</p>
                <p className="text-xl font-bold">{calculations.marginalRate}%</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Est. Tax Savings</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(Math.max(0, calculations.taxSavings))}
                </p>
              </div>
            </div>

            <h4 className="font-medium mb-3">Tax Bracket Utilization</h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={calculations.bracketSpaceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={(val) => formatCurrency(val)} />
                  <YAxis type="category" dataKey="bracket" width={50} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="used" name="Used" stackId="a" fill="hsl(var(--primary))" />
                  <Bar dataKey="available" name="Available" stackId="a" fill="#94a3b8" fillOpacity={0.3} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-2">
              <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-400">
                <strong>Strategy:</strong> Fill up lower tax brackets (10%, 12%, 22%) during low-income years 
                before Social Security and RMDs begin. This creates tax-free growth and withdrawals in retirement.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Ladder Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Conversion Ladder Timeline
          </CardTitle>
          <CardDescription>
            Your multi-year Roth conversion strategy (5-year seasoning rule applies)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={calculations.ladderData.slice(0, 15)}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="age" label={{ value: 'Age', position: 'insideBottom', offset: -5 }} />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="traditionalBalance"
                  name="Traditional Balance"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                  stroke="hsl(var(--primary))"
                />
                <Bar dataKey="conversion" name="Annual Conversion" fill="#22c55e" />
                <Line
                  type="monotone"
                  dataKey="available"
                  name="Available (Seasoned)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="p-3 bg-muted rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Total Conversions</p>
              <p className="text-lg font-bold">{formatCurrency(calculations.totalConversions)}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Total Taxes Paid</p>
              <p className="text-lg font-bold text-red-500">{formatCurrency(calculations.totalTaxesPaid)}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Years Until Retirement</p>
              <p className="text-lg font-bold">{calculations.yearsToRetirement}</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-700 dark:text-yellow-400">
              <strong>5-Year Rule:</strong> Converted amounts must season for 5 years before penalty-free withdrawal 
              if you're under 59½. Plan your ladder to have conversions mature when you need them.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RothConversionCalculator;
