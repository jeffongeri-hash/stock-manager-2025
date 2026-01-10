
import React, { useState, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedStatsCard } from '@/components/ui/AnimatedStatsCard';
import { DollarSign, TrendingUp, Calendar, Plus, Trash2, RefreshCw, PiggyBank, LineChart } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DividendStock {
  id: string;
  symbol: string;
  shares: number;
  costBasis: number;
  annualDividend: number;
  dividendYield: number;
  frequency: 'monthly' | 'quarterly' | 'annually';
  nextExDate: string;
  dripEnabled: boolean;
}

interface GrowthData {
  year: number;
  value: number;
  dividends: number;
  dripShares: number;
}

const SAMPLE_STOCKS: DividendStock[] = [
  { id: '1', symbol: 'SCHD', shares: 100, costBasis: 7500, annualDividend: 2.68, dividendYield: 3.57, frequency: 'quarterly', nextExDate: '2026-03-15', dripEnabled: true },
  { id: '2', symbol: 'VYM', shares: 50, costBasis: 5500, annualDividend: 3.21, dividendYield: 2.92, frequency: 'quarterly', nextExDate: '2026-03-20', dripEnabled: true },
  { id: '3', symbol: 'O', shares: 75, costBasis: 4125, annualDividend: 3.08, dividendYield: 5.60, frequency: 'monthly', nextExDate: '2026-01-31', dripEnabled: false },
  { id: '4', symbol: 'JNJ', shares: 30, costBasis: 4500, annualDividend: 4.76, dividendYield: 3.17, frequency: 'quarterly', nextExDate: '2026-02-18', dripEnabled: true },
  // High-yield income ETFs
  { id: '5', symbol: 'QYLD', shares: 200, costBasis: 3400, annualDividend: 2.04, dividendYield: 12.0, frequency: 'monthly', nextExDate: '2026-01-20', dripEnabled: true },
  { id: '6', symbol: 'JEPI', shares: 100, costBasis: 5400, annualDividend: 4.32, dividendYield: 8.0, frequency: 'monthly', nextExDate: '2026-01-05', dripEnabled: true },
  { id: '7', symbol: 'JEPQ', shares: 80, costBasis: 4000, annualDividend: 4.50, dividendYield: 9.0, frequency: 'monthly', nextExDate: '2026-01-05', dripEnabled: true },
];

export default function DividendTracker() {
  const [stocks, setStocks] = useState<DividendStock[]>(SAMPLE_STOCKS);
  const [years, setYears] = useState(10);
  const [dividendGrowthRate, setDividendGrowthRate] = useState(5);
  const [newStock, setNewStock] = useState({
    symbol: '',
    shares: 0,
    costBasis: 0,
    annualDividend: 0,
    dividendYield: 0,
  });

  // Calculate totals
  const totals = useMemo(() => {
    const totalCost = stocks.reduce((sum, s) => sum + s.costBasis, 0);
    const annualIncome = stocks.reduce((sum, s) => sum + (s.annualDividend * s.shares), 0);
    const monthlyIncome = annualIncome / 12;
    const avgYield = totalCost > 0 ? (annualIncome / totalCost) * 100 : 0;
    
    return { totalCost, annualIncome, monthlyIncome, avgYield };
  }, [stocks]);

  // Calculate DRIP projections
  const dripProjection = useMemo(() => {
    const data: GrowthData[] = [];
    let currentValue = totals.totalCost;
    let totalShares = stocks.reduce((sum, s) => sum + s.shares, 0);
    let annualDividend = totals.annualIncome;
    let cumulativeDripShares = 0;

    for (let year = 0; year <= years; year++) {
      data.push({
        year,
        value: Math.round(currentValue),
        dividends: Math.round(annualDividend),
        dripShares: Math.round(cumulativeDripShares),
      });

      // Apply DRIP - reinvest dividends at current price
      const avgPrice = currentValue / totalShares;
      const newShares = annualDividend / avgPrice;
      cumulativeDripShares += newShares;
      totalShares += newShares;
      
      // Grow dividends
      annualDividend *= (1 + dividendGrowthRate / 100);
      currentValue = totalShares * avgPrice * (1 + dividendGrowthRate / 200); // Modest price appreciation
    }

    return data;
  }, [stocks, years, dividendGrowthRate, totals]);

  // Monthly income breakdown
  const monthlyBreakdown = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, i) => {
      let income = 0;
      stocks.forEach(stock => {
        if (stock.frequency === 'monthly') {
          income += stock.annualDividend * stock.shares / 12;
        } else if (stock.frequency === 'quarterly' && [2, 5, 8, 11].includes(i)) {
          income += stock.annualDividend * stock.shares / 4;
        } else if (stock.frequency === 'annually' && i === 11) {
          income += stock.annualDividend * stock.shares;
        }
      });
      return { month, income: Math.round(income * 100) / 100 };
    });
  }, [stocks]);

  const addStock = () => {
    if (!newStock.symbol) {
      toast.error('Please enter a stock symbol');
      return;
    }
    
    const stock: DividendStock = {
      id: Date.now().toString(),
      symbol: newStock.symbol.toUpperCase(),
      shares: newStock.shares,
      costBasis: newStock.costBasis,
      annualDividend: newStock.annualDividend,
      dividendYield: newStock.costBasis > 0 ? (newStock.annualDividend * newStock.shares / newStock.costBasis) * 100 : 0,
      frequency: 'quarterly',
      nextExDate: '2026-03-15',
      dripEnabled: true,
    };
    
    setStocks([...stocks, stock]);
    setNewStock({ symbol: '', shares: 0, costBasis: 0, annualDividend: 0, dividendYield: 0 });
    toast.success(`${stock.symbol} added to dividend tracker`);
  };

  const removeStock = (id: string) => {
    setStocks(stocks.filter(s => s.id !== id));
    toast.success('Stock removed');
  };

  const toggleDrip = (id: string) => {
    setStocks(stocks.map(s => 
      s.id === id ? { ...s, dripEnabled: !s.dripEnabled } : s
    ));
  };

  const finalValue = dripProjection[dripProjection.length - 1]?.value || 0;
  const totalGrowth = ((finalValue - totals.totalCost) / totals.totalCost) * 100;

  return (
    <PageLayout title="Dividend Tracker">
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-animation">
          <AnimatedStatsCard
            title="Portfolio Value"
            value={`$${totals.totalCost.toLocaleString()}`}
            icon={<DollarSign className="h-full w-full" />}
            variant="primary"
            delay={0}
          />
          <AnimatedStatsCard
            title="Annual Income"
            value={`$${totals.annualIncome.toFixed(2)}`}
            description={`$${totals.monthlyIncome.toFixed(2)}/month`}
            icon={<PiggyBank className="h-full w-full" />}
            variant="success"
            sparklineData={monthlyBreakdown.map(m => m.income)}
            delay={50}
          />
          <AnimatedStatsCard
            title="Avg Yield"
            value={`${totals.avgYield.toFixed(2)}%`}
            icon={<TrendingUp className="h-full w-full" />}
            variant="primary"
            delay={100}
          />
          <AnimatedStatsCard
            title={`${years}Y DRIP Value`}
            value={`$${finalValue.toLocaleString()}`}
            trend={totalGrowth}
            trendLabel="projected growth"
            icon={<LineChart className="h-full w-full" />}
            variant="success"
            delay={150}
          />
        </div>

        <Tabs defaultValue="holdings" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="holdings">Holdings</TabsTrigger>
            <TabsTrigger value="projections">DRIP Projections</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>

          <TabsContent value="holdings" className="space-y-4">
            {/* Add Stock Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Dividend Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <Label>Symbol</Label>
                    <Input
                      placeholder="SCHD"
                      value={newStock.symbol}
                      onChange={(e) => setNewStock({ ...newStock, symbol: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div>
                    <Label>Shares</Label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={newStock.shares || ''}
                      onChange={(e) => setNewStock({ ...newStock, shares: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Cost Basis ($)</Label>
                    <Input
                      type="number"
                      placeholder="7500"
                      value={newStock.costBasis || ''}
                      onChange={(e) => setNewStock({ ...newStock, costBasis: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Annual Div/Share ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="2.68"
                      value={newStock.annualDividend || ''}
                      onChange={(e) => setNewStock({ ...newStock, annualDividend: Number(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addStock} className="w-full">
                      <Plus className="h-4 w-4 mr-2" /> Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Holdings Table */}
            <Card>
              <CardHeader>
                <CardTitle>Dividend Holdings</CardTitle>
                <CardDescription>Your dividend-paying stocks with DRIP settings</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead className="text-right">Shares</TableHead>
                      <TableHead className="text-right">Cost Basis</TableHead>
                      <TableHead className="text-right">Annual Div</TableHead>
                      <TableHead className="text-right">Yield</TableHead>
                      <TableHead className="text-right">Annual Income</TableHead>
                      <TableHead className="text-center">DRIP</TableHead>
                      <TableHead className="text-center">Next Ex-Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stocks.map((stock) => (
                      <TableRow key={stock.id} className="group">
                        <TableCell className="font-medium">{stock.symbol}</TableCell>
                        <TableCell className="text-right">{stock.shares}</TableCell>
                        <TableCell className="text-right">${stock.costBasis.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${stock.annualDividend.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={stock.dividendYield >= 4 ? 'default' : 'secondary'}>
                            {stock.dividendYield.toFixed(2)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-success">
                          ${(stock.annualDividend * stock.shares).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={stock.dripEnabled}
                            onCheckedChange={() => toggleDrip(stock.id)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{stock.nextExDate}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100"
                            onClick={() => removeStock(stock.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projections" className="space-y-4">
            {/* DRIP Calculator Settings */}
            <Card>
              <CardHeader>
                <CardTitle>DRIP Growth Calculator</CardTitle>
                <CardDescription>Project your dividend growth with reinvestment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <Label>Projection Years</Label>
                    <Input
                      type="number"
                      value={years}
                      onChange={(e) => setYears(Math.min(30, Math.max(1, Number(e.target.value))))}
                      min={1}
                      max={30}
                    />
                  </div>
                  <div>
                    <Label>Dividend Growth Rate (%)</Label>
                    <Input
                      type="number"
                      value={dividendGrowthRate}
                      onChange={(e) => setDividendGrowthRate(Math.min(20, Math.max(0, Number(e.target.value))))}
                      min={0}
                      max={20}
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <p className="text-sm text-muted-foreground">Starting Value</p>
                    <p className="text-xl font-bold">${totals.totalCost.toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col justify-end">
                    <p className="text-sm text-muted-foreground">Ending Value</p>
                    <p className="text-xl font-bold text-success">${finalValue.toLocaleString()}</p>
                  </div>
                </div>

                {/* Growth Chart */}
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dripProjection}>
                      <defs>
                        <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="dividendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="year" 
                        tickFormatter={(v) => `Year ${v}`}
                        className="text-xs"
                      />
                      <YAxis 
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                        className="text-xs"
                      />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          `$${value.toLocaleString()}`,
                          name === 'value' ? 'Portfolio Value' : 'Annual Dividends'
                        ]}
                        labelFormatter={(label) => `Year ${label}`}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        fill="url(#valueGradient)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="dividends"
                        stroke="hsl(var(--success))"
                        fill="url(#dividendGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* DRIP Summary Table */}
            <Card>
              <CardHeader>
                <CardTitle>Year-by-Year DRIP Projection</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead className="text-right">Portfolio Value</TableHead>
                      <TableHead className="text-right">Annual Dividends</TableHead>
                      <TableHead className="text-right">DRIP Shares Added</TableHead>
                      <TableHead className="text-right">Cumulative Growth</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dripProjection.filter((_, i) => i % 2 === 0 || i === dripProjection.length - 1).map((data, i) => (
                      <TableRow key={data.year}>
                        <TableCell>Year {data.year}</TableCell>
                        <TableCell className="text-right font-medium">${data.value.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-success">${data.dividends.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{data.dripShares.toFixed(1)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={data.value > totals.totalCost ? 'default' : 'secondary'}>
                            +{(((data.value - totals.totalCost) / totals.totalCost) * 100).toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            {/* Monthly Income Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Dividend Income</CardTitle>
                <CardDescription>Expected dividend payments by month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis tickFormatter={(v) => `$${v}`} className="text-xs" />
                      <Tooltip 
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Income']}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar 
                        dataKey="income" 
                        fill="hsl(var(--success))" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Dividends */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Ex-Dividend Dates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stocks
                    .sort((a, b) => new Date(a.nextExDate).getTime() - new Date(b.nextExDate).getTime())
                    .map((stock) => (
                      <div
                        key={stock.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{stock.symbol}</p>
                            <p className="text-sm text-muted-foreground">
                              {stock.frequency} dividend
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{stock.nextExDate}</Badge>
                          <p className="text-sm text-success mt-1">
                            ${((stock.annualDividend * stock.shares) / (stock.frequency === 'monthly' ? 12 : stock.frequency === 'quarterly' ? 4 : 1)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
