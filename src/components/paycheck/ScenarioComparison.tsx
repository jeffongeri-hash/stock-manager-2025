import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowUp, ArrowDown, Equal, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PaycheckResult {
  grossPay: number;
  preTaxDeductions: number;
  taxableIncome: number;
  taxes: {
    federalTax: number;
    stateTax: number;
    stateName: string;
    localTax: number;
    localTaxName: string | null;
    socialSecurity: number;
    medicare: number;
    taxBreakdown: {
      federalRate: string;
      stateRate: string;
      localRate: string;
    };
    notes: string;
  };
  totalTaxes: number;
  postTaxDeductions: number;
  netPay: number;
}

interface ScenarioComparisonProps {
  scenarioA: {
    name: string;
    result: PaycheckResult | null;
    payFrequency: string;
  };
  scenarioB: {
    name: string;
    result: PaycheckResult | null;
    payFrequency: string;
  };
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

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
};

const DifferenceIndicator = ({ valueA, valueB, inverse = false }: { valueA: number; valueB: number; inverse?: boolean }) => {
  const diff = valueB - valueA;
  const percentDiff = valueA !== 0 ? (diff / valueA) * 100 : 0;
  
  if (Math.abs(diff) < 0.01) {
    return <span className="text-muted-foreground flex items-center gap-1"><Equal className="h-3 w-3" /> Same</span>;
  }
  
  const isPositive = inverse ? diff < 0 : diff > 0;
  
  return (
    <span className={`flex items-center gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
      {diff > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {formatCurrency(Math.abs(diff))} ({percentDiff > 0 ? '+' : ''}{percentDiff.toFixed(1)}%)
    </span>
  );
};

export function ScenarioComparison({ scenarioA, scenarioB }: ScenarioComparisonProps) {
  if (!scenarioA.result || !scenarioB.result) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">
            Calculate both scenarios to see comparison
          </p>
        </CardContent>
      </Card>
    );
  }

  const resultA = scenarioA.result;
  const resultB = scenarioB.result;
  
  const periodsA = getPayPeriodsPerYear(scenarioA.payFrequency);
  const periodsB = getPayPeriodsPerYear(scenarioB.payFrequency);
  
  const yearlyA = {
    gross: resultA.grossPay * periodsA,
    preTax: resultA.preTaxDeductions * periodsA,
    taxes: resultA.totalTaxes * periodsA,
    postTax: resultA.postTaxDeductions * periodsA,
    net: resultA.netPay * periodsA,
  };
  
  const yearlyB = {
    gross: resultB.grossPay * periodsB,
    preTax: resultB.preTaxDeductions * periodsB,
    taxes: resultB.totalTaxes * periodsB,
    postTax: resultB.postTaxDeductions * periodsB,
    net: resultB.netPay * periodsB,
  };

  const comparisonData = [
    { 
      category: 'Gross Pay',
      [scenarioA.name]: resultA.grossPay,
      [scenarioB.name]: resultB.grossPay,
    },
    { 
      category: 'Pre-Tax Ded.',
      [scenarioA.name]: resultA.preTaxDeductions,
      [scenarioB.name]: resultB.preTaxDeductions,
    },
    { 
      category: 'Total Taxes',
      [scenarioA.name]: resultA.totalTaxes,
      [scenarioB.name]: resultB.totalTaxes,
    },
    { 
      category: 'Post-Tax Ded.',
      [scenarioA.name]: resultA.postTaxDeductions,
      [scenarioB.name]: resultB.postTaxDeductions,
    },
    { 
      category: 'Net Pay',
      [scenarioA.name]: resultA.netPay,
      [scenarioB.name]: resultB.netPay,
    },
  ];

  const yearlyComparisonData = [
    { 
      category: 'Gross',
      [scenarioA.name]: yearlyA.gross,
      [scenarioB.name]: yearlyB.gross,
    },
    { 
      category: 'Pre-Tax',
      [scenarioA.name]: yearlyA.preTax,
      [scenarioB.name]: yearlyB.preTax,
    },
    { 
      category: 'Taxes',
      [scenarioA.name]: yearlyA.taxes,
      [scenarioB.name]: yearlyB.taxes,
    },
    { 
      category: 'Net',
      [scenarioA.name]: yearlyA.net,
      [scenarioB.name]: yearlyB.net,
    },
  ];

  const netDiff = resultB.netPay - resultA.netPay;
  const yearlyNetDiff = yearlyB.net - yearlyA.net;
  const taxSavings = resultA.totalTaxes - resultB.totalTaxes;
  const yearlyTaxSavings = yearlyA.taxes - yearlyB.taxes;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={netDiff >= 0 ? 'border-green-500/30' : 'border-red-500/30'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Pay Difference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {netDiff >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              <span className={`text-2xl font-bold ${netDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {netDiff >= 0 ? '+' : ''}{formatCurrency(netDiff)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">per paycheck</p>
          </CardContent>
        </Card>

        <Card className={yearlyNetDiff >= 0 ? 'border-green-500/30' : 'border-red-500/30'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Annual Net Difference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {yearlyNetDiff >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              <span className={`text-2xl font-bold ${yearlyNetDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {yearlyNetDiff >= 0 ? '+' : ''}{formatCurrency(yearlyNetDiff)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">per year</p>
          </CardContent>
        </Card>

        <Card className={taxSavings >= 0 ? 'border-green-500/30' : 'border-orange-500/30'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tax Savings (B vs A)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${taxSavings >= 0 ? 'text-green-500' : 'text-orange-500'}`}>
                {formatCurrency(Math.abs(taxSavings))}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {taxSavings >= 0 ? 'saved' : 'extra'} per paycheck ({formatCurrency(Math.abs(yearlyTaxSavings))}/year)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per Paycheck Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Per Paycheck Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `$${v.toLocaleString()}`} />
                <YAxis type="category" dataKey="category" width={90} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey={scenarioA.name} fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                <Bar dataKey={scenarioB.name} fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Annual Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Annual Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyComparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="category" />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey={scenarioA.name} fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <Bar dataKey={scenarioB.name} fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4 text-sm font-medium border-b pb-2">
              <span>Category</span>
              <span className="text-right">{scenarioA.name}</span>
              <span className="text-right">{scenarioB.name}</span>
              <span className="text-right">Difference</span>
            </div>
            
            <div className="grid grid-cols-4 gap-4 text-sm">
              <span>Gross Pay</span>
              <span className="text-right">{formatCurrency(resultA.grossPay)}</span>
              <span className="text-right">{formatCurrency(resultB.grossPay)}</span>
              <span className="text-right">
                <DifferenceIndicator valueA={resultA.grossPay} valueB={resultB.grossPay} />
              </span>
            </div>

            <div className="grid grid-cols-4 gap-4 text-sm">
              <span>Pre-Tax Deductions</span>
              <span className="text-right">{formatCurrency(resultA.preTaxDeductions)}</span>
              <span className="text-right">{formatCurrency(resultB.preTaxDeductions)}</span>
              <span className="text-right">
                <DifferenceIndicator valueA={resultA.preTaxDeductions} valueB={resultB.preTaxDeductions} />
              </span>
            </div>

            <div className="grid grid-cols-4 gap-4 text-sm">
              <span>Taxable Income</span>
              <span className="text-right">{formatCurrency(resultA.taxableIncome)}</span>
              <span className="text-right">{formatCurrency(resultB.taxableIncome)}</span>
              <span className="text-right">
                <DifferenceIndicator valueA={resultA.taxableIncome} valueB={resultB.taxableIncome} />
              </span>
            </div>

            <Separator />

            <div className="grid grid-cols-4 gap-4 text-sm">
              <span className="text-muted-foreground">Federal Tax</span>
              <span className="text-right text-red-500">{formatCurrency(resultA.taxes.federalTax)}</span>
              <span className="text-right text-red-500">{formatCurrency(resultB.taxes.federalTax)}</span>
              <span className="text-right">
                <DifferenceIndicator valueA={resultA.taxes.federalTax} valueB={resultB.taxes.federalTax} inverse />
              </span>
            </div>

            <div className="grid grid-cols-4 gap-4 text-sm">
              <span className="text-muted-foreground">State Tax</span>
              <span className="text-right text-orange-500">{formatCurrency(resultA.taxes.stateTax)}</span>
              <span className="text-right text-orange-500">{formatCurrency(resultB.taxes.stateTax)}</span>
              <span className="text-right">
                <DifferenceIndicator valueA={resultA.taxes.stateTax} valueB={resultB.taxes.stateTax} inverse />
              </span>
            </div>

            <div className="grid grid-cols-4 gap-4 text-sm">
              <span className="text-muted-foreground">Social Security</span>
              <span className="text-right text-blue-500">{formatCurrency(resultA.taxes.socialSecurity)}</span>
              <span className="text-right text-blue-500">{formatCurrency(resultB.taxes.socialSecurity)}</span>
              <span className="text-right">
                <DifferenceIndicator valueA={resultA.taxes.socialSecurity} valueB={resultB.taxes.socialSecurity} inverse />
              </span>
            </div>

            <div className="grid grid-cols-4 gap-4 text-sm">
              <span className="text-muted-foreground">Medicare</span>
              <span className="text-right text-pink-500">{formatCurrency(resultA.taxes.medicare)}</span>
              <span className="text-right text-pink-500">{formatCurrency(resultB.taxes.medicare)}</span>
              <span className="text-right">
                <DifferenceIndicator valueA={resultA.taxes.medicare} valueB={resultB.taxes.medicare} inverse />
              </span>
            </div>

            <div className="grid grid-cols-4 gap-4 text-sm font-medium border-t pt-2">
              <span>Total Taxes</span>
              <span className="text-right text-red-500">{formatCurrency(resultA.totalTaxes)}</span>
              <span className="text-right text-red-500">{formatCurrency(resultB.totalTaxes)}</span>
              <span className="text-right">
                <DifferenceIndicator valueA={resultA.totalTaxes} valueB={resultB.totalTaxes} inverse />
              </span>
            </div>

            <Separator />

            <div className="grid grid-cols-4 gap-4 text-sm">
              <span>Post-Tax Deductions</span>
              <span className="text-right">{formatCurrency(resultA.postTaxDeductions)}</span>
              <span className="text-right">{formatCurrency(resultB.postTaxDeductions)}</span>
              <span className="text-right">
                <DifferenceIndicator valueA={resultA.postTaxDeductions} valueB={resultB.postTaxDeductions} />
              </span>
            </div>

            <div className="grid grid-cols-4 gap-4 text-sm font-bold border-t pt-2">
              <span>Net Pay</span>
              <span className="text-right text-green-500">{formatCurrency(resultA.netPay)}</span>
              <span className="text-right text-green-500">{formatCurrency(resultB.netPay)}</span>
              <span className="text-right">
                <DifferenceIndicator valueA={resultA.netPay} valueB={resultB.netPay} />
              </span>
            </div>

            <Separator />

            <div className="grid grid-cols-4 gap-4 text-sm font-medium">
              <span>Annual Net</span>
              <span className="text-right">{formatCurrency(yearlyA.net)}</span>
              <span className="text-right">{formatCurrency(yearlyB.net)}</span>
              <span className="text-right">
                <DifferenceIndicator valueA={yearlyA.net} valueB={yearlyB.net} />
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
