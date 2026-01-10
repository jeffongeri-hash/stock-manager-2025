import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Target, DollarSign, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell } from 'recharts';

interface YieldOnCostStock {
  symbol: string;
  costBasis: number;
  shares: number;
  annualDividend: number;
  currentYield: number;
  dividendGrowthRate: number;
}

interface YieldOnCostTrackerProps {
  stocks: YieldOnCostStock[];
  projectionYears: number;
  dividendGrowthRate: number;
}

interface YOCProjection {
  year: number;
  yieldOnCost: number;
  annualIncome: number;
  cumulativeIncome: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(142, 76%, 36%)', 'hsl(221, 83%, 53%)', 'hsl(280, 70%, 50%)', 'hsl(350, 80%, 50%)'];

export function YieldOnCostTracker({ stocks, projectionYears, dividendGrowthRate }: YieldOnCostTrackerProps) {
  // Calculate current portfolio totals
  const totals = useMemo(() => {
    const totalCost = stocks.reduce((sum, s) => sum + s.costBasis, 0);
    const annualIncome = stocks.reduce((sum, s) => sum + (s.annualDividend * s.shares), 0);
    const currentYOC = totalCost > 0 ? (annualIncome / totalCost) * 100 : 0;
    return { totalCost, annualIncome, currentYOC };
  }, [stocks]);

  // YOC projection for portfolio
  const yocProjection = useMemo(() => {
    const data: YOCProjection[] = [];
    let currentIncome = totals.annualIncome;
    let cumulativeIncome = 0;

    for (let year = 0; year <= projectionYears; year++) {
      const yoc = (currentIncome / totals.totalCost) * 100;
      cumulativeIncome += currentIncome;
      
      data.push({
        year,
        yieldOnCost: parseFloat(yoc.toFixed(2)),
        annualIncome: Math.round(currentIncome),
        cumulativeIncome: Math.round(cumulativeIncome),
      });

      currentIncome *= (1 + dividendGrowthRate / 100);
    }

    return data;
  }, [totals, projectionYears, dividendGrowthRate]);

  // Per-stock YOC analysis
  const stockYOCAnalysis = useMemo(() => {
    return stocks.map((stock, i) => {
      const currentYOC = stock.costBasis > 0 
        ? (stock.annualDividend * stock.shares / stock.costBasis) * 100 
        : 0;
      
      const growthRate = stock.dividendGrowthRate || dividendGrowthRate;
      const futureYOC5 = currentYOC * Math.pow(1 + growthRate / 100, 5);
      const futureYOC10 = currentYOC * Math.pow(1 + growthRate / 100, 10);
      const futureYOC20 = currentYOC * Math.pow(1 + growthRate / 100, 20);
      
      // Years to double YOC (Rule of 72)
      const yearsToDouble = growthRate > 0 ? 72 / growthRate : 0;
      
      // Years to reach 10% YOC
      const yearsTo10Pct = currentYOC > 0 && currentYOC < 10 && growthRate > 0
        ? Math.log(10 / currentYOC) / Math.log(1 + growthRate / 100)
        : currentYOC >= 10 ? 0 : null;

      return {
        ...stock,
        currentYOC,
        futureYOC5,
        futureYOC10,
        futureYOC20,
        yearsToDouble,
        yearsTo10Pct,
        growthRate,
        color: COLORS[i % COLORS.length],
      };
    }).sort((a, b) => b.futureYOC10 - a.futureYOC10);
  }, [stocks, dividendGrowthRate]);

  // Multi-stock YOC chart data
  const stockYOCChartData = useMemo(() => {
    const data = [];
    for (let year = 0; year <= Math.min(projectionYears, 20); year += 2) {
      const yearData: Record<string, number | string> = { year: `Year ${year}` };
      
      stockYOCAnalysis.forEach(stock => {
        const yoc = stock.currentYOC * Math.pow(1 + stock.growthRate / 100, year);
        yearData[stock.symbol] = parseFloat(yoc.toFixed(2));
      });
      
      data.push(yearData);
    }
    return data;
  }, [stockYOCAnalysis, projectionYears]);

  const finalYOC = yocProjection[yocProjection.length - 1];
  const totalDividendsReceived = finalYOC?.cumulativeIncome || 0;
  const costBasisRecovered = (totalDividendsReceived / totals.totalCost) * 100;

  return (
    <div className="space-y-4">
      {/* YOC Overview */}
      <Card className="border-2 border-warning/30 bg-gradient-to-br from-warning/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-warning" />
            Yield on Cost Tracker
          </CardTitle>
          <CardDescription>
            Watch your effective yield grow as dividends increase on your original investment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-muted/50 border text-center">
              <p className="text-sm text-muted-foreground mb-1">Current YOC</p>
              <p className="text-3xl font-bold">{totals.currentYOC.toFixed(2)}%</p>
              <p className="text-xs text-muted-foreground mt-1">on ${totals.totalCost.toLocaleString()} invested</p>
            </div>
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 text-center">
              <p className="text-sm text-muted-foreground mb-1">YOC in {projectionYears} Years</p>
              <p className="text-3xl font-bold text-warning">{finalYOC?.yieldOnCost.toFixed(2)}%</p>
              <p className="text-xs text-warning mt-1">
                +{((finalYOC?.yieldOnCost || 0) - totals.currentYOC).toFixed(1)}% increase
              </p>
            </div>
            <div className="p-4 rounded-lg bg-success/10 border border-success/20 text-center">
              <p className="text-sm text-muted-foreground mb-1">Annual Income ({projectionYears}yr)</p>
              <p className="text-3xl font-bold text-success">${finalYOC?.annualIncome.toLocaleString()}</p>
              <p className="text-xs text-success mt-1">
                {((finalYOC?.annualIncome || 0) / totals.annualIncome).toFixed(1)}x starting income
              </p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
              <p className="text-sm text-muted-foreground mb-1">Total Dividends Received</p>
              <p className="text-3xl font-bold text-primary">${totalDividendsReceived.toLocaleString()}</p>
              <p className="text-xs text-primary mt-1">
                {costBasisRecovered.toFixed(0)}% of cost basis recovered
              </p>
            </div>
          </div>

          {/* YOC Growth Chart */}
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={yocProjection}>
                <defs>
                  <linearGradient id="yocGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="year" 
                  tickFormatter={(v) => `Year ${v}`}
                  className="text-xs"
                />
                <YAxis 
                  tickFormatter={(v) => `${v}%`}
                  className="text-xs"
                />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'yieldOnCost') return [`${value}%`, 'Yield on Cost'];
                    if (name === 'annualIncome') return [`$${value.toLocaleString()}`, 'Annual Income'];
                    return [`$${value.toLocaleString()}`, 'Cumulative Income'];
                  }}
                  labelFormatter={(label) => `Year ${label}`}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="yieldOnCost"
                  stroke="hsl(var(--warning))"
                  fill="url(#yocGradient)"
                  strokeWidth={3}
                  name="yieldOnCost"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Per-Stock YOC Analysis */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              YOC by Holding
            </CardTitle>
            <CardDescription>How each position's yield on cost will grow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockYOCChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    type="number"
                    tickFormatter={(v) => `${v}%`}
                    className="text-xs"
                  />
                  <YAxis 
                    type="category"
                    dataKey="year"
                    className="text-xs"
                    width={60}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [`${value}%`, name]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  {stockYOCAnalysis.slice(0, 5).map((stock, i) => (
                    <Bar 
                      key={stock.symbol}
                      dataKey={stock.symbol}
                      fill={COLORS[i % COLORS.length]}
                      radius={[0, 4, 4, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              YOC Milestones
            </CardTitle>
            <CardDescription>Key yield on cost targets by holding</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">5yr YOC</TableHead>
                  <TableHead className="text-right">10yr YOC</TableHead>
                  <TableHead className="text-right">Double In</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockYOCAnalysis.slice(0, 7).map((stock) => (
                  <TableRow key={stock.symbol}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: stock.color }}
                        />
                        <span className="font-medium">{stock.symbol}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{stock.currentYOC.toFixed(1)}%</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-warning">{stock.futureYOC5.toFixed(1)}%</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-success">{stock.futureYOC10.toFixed(1)}%</span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {stock.yearsToDouble > 0 ? `${stock.yearsToDouble.toFixed(0)}yr` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* YOC Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Understanding Yield on Cost
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                What is YOC?
              </h4>
              <p className="text-sm text-muted-foreground">
                Yield on Cost measures your dividend yield based on your <strong>original purchase price</strong>, 
                not the current market price. As companies raise dividends, your YOC increases.
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                Why It Matters
              </h4>
              <p className="text-sm text-muted-foreground">
                A stock you bought at 3% yield that grows dividends 10%/year will have a <strong>7.8% YOC</strong> in 
                10 years and <strong>20% YOC</strong> in 20 years on your original investment.
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                Time is Your Friend
              </h4>
              <p className="text-sm text-muted-foreground">
                With {dividendGrowthRate}% dividend growth, your YOC doubles every <strong>{(72 / dividendGrowthRate).toFixed(0)} years</strong>. 
                The longer you hold, the more powerful this effect becomes.
              </p>
            </div>
          </div>
          
          {/* YOC Milestones Timeline */}
          <div className="mt-6 p-4 rounded-lg bg-muted/30 border">
            <h4 className="font-medium mb-4">Your Portfolio YOC Journey</h4>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {[0, 5, 10, 15, 20].map((year, i) => {
                const yoc = totals.currentYOC * Math.pow(1 + dividendGrowthRate / 100, year);
                const income = totals.annualIncome * Math.pow(1 + dividendGrowthRate / 100, year);
                return (
                  <React.Fragment key={year}>
                    <div className={`flex-shrink-0 p-3 rounded-lg text-center min-w-[100px] ${
                      i === 0 ? 'bg-muted' : 'bg-warning/10 border border-warning/20'
                    }`}>
                      <p className="text-xs text-muted-foreground">Year {year}</p>
                      <p className={`text-lg font-bold ${i > 0 ? 'text-warning' : ''}`}>
                        {yoc.toFixed(1)}%
                      </p>
                      <p className="text-xs text-success">${Math.round(income).toLocaleString()}/yr</p>
                    </div>
                    {i < 4 && (
                      <div className="flex-shrink-0 w-8 h-0.5 bg-warning/30" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
