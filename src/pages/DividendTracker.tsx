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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimatedStatsCard } from '@/components/ui/AnimatedStatsCard';
import { DollarSign, TrendingUp, Calendar, Plus, Trash2, RefreshCw, PiggyBank, LineChart, ChevronLeft, ChevronRight, CalendarDays, Banknote } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO, addDays, isSameDay } from 'date-fns';

interface DividendStock {
  id: string;
  symbol: string;
  shares: number;
  costBasis: number;
  annualDividend: number;
  dividendYield: number;
  frequency: 'monthly' | 'quarterly' | 'annually';
  nextExDate: string;
  paymentDate?: string;
  dripEnabled: boolean;
}

interface DividendEvent {
  date: Date;
  symbol: string;
  type: 'ex-date' | 'payment';
  amount: number;
}

interface GrowthData {
  year: number;
  value: number;
  dividends: number;
  dripShares: number;
}

const SAMPLE_STOCKS: DividendStock[] = [
  { id: '1', symbol: 'SCHD', shares: 100, costBasis: 7500, annualDividend: 2.68, dividendYield: 3.57, frequency: 'quarterly', nextExDate: '2026-03-15', paymentDate: '2026-03-25', dripEnabled: true },
  { id: '2', symbol: 'VYM', shares: 50, costBasis: 5500, annualDividend: 3.21, dividendYield: 2.92, frequency: 'quarterly', nextExDate: '2026-03-20', paymentDate: '2026-03-28', dripEnabled: true },
  { id: '3', symbol: 'O', shares: 75, costBasis: 4125, annualDividend: 3.08, dividendYield: 5.60, frequency: 'monthly', nextExDate: '2026-01-31', paymentDate: '2026-02-15', dripEnabled: false },
  { id: '4', symbol: 'JNJ', shares: 30, costBasis: 4500, annualDividend: 4.76, dividendYield: 3.17, frequency: 'quarterly', nextExDate: '2026-02-18', paymentDate: '2026-03-10', dripEnabled: true },
  // High-yield income ETFs
  { id: '5', symbol: 'QYLD', shares: 200, costBasis: 3400, annualDividend: 2.04, dividendYield: 12.0, frequency: 'monthly', nextExDate: '2026-01-20', paymentDate: '2026-01-25', dripEnabled: true },
  { id: '6', symbol: 'JEPI', shares: 100, costBasis: 5400, annualDividend: 4.32, dividendYield: 8.0, frequency: 'monthly', nextExDate: '2026-01-05', paymentDate: '2026-01-08', dripEnabled: true },
  { id: '7', symbol: 'JEPQ', shares: 80, costBasis: 4000, annualDividend: 4.50, dividendYield: 9.0, frequency: 'monthly', nextExDate: '2026-01-05', paymentDate: '2026-01-08', dripEnabled: true },
];

export default function DividendTracker() {
  const [stocks, setStocks] = useState<DividendStock[]>(SAMPLE_STOCKS);
  const [years, setYears] = useState(10);
  const [dividendGrowthRate, setDividendGrowthRate] = useState(5);
  const [calendarMonth, setCalendarMonth] = useState(new Date(2026, 0, 1)); // Start at Jan 2026 to match sample data
  const [selectedMonthView, setSelectedMonthView] = useState<string>('all');
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

  // Monthly income breakdown with stock details
  const monthlyBreakdown = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, i) => {
      let income = 0;
      const contributors: { symbol: string; amount: number }[] = [];
      stocks.forEach(stock => {
        let stockIncome = 0;
        if (stock.frequency === 'monthly') {
          stockIncome = stock.annualDividend * stock.shares / 12;
        } else if (stock.frequency === 'quarterly' && [2, 5, 8, 11].includes(i)) {
          stockIncome = stock.annualDividend * stock.shares / 4;
        } else if (stock.frequency === 'annually' && i === 11) {
          stockIncome = stock.annualDividend * stock.shares;
        }
        if (stockIncome > 0) {
          income += stockIncome;
          contributors.push({ symbol: stock.symbol, amount: stockIncome });
        }
      });
      return { month, monthIndex: i, income: Math.round(income * 100) / 100, contributors };
    });
  }, [stocks]);

  // Generate calendar events for the current view
  const calendarEvents = useMemo(() => {
    const events: DividendEvent[] = [];
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    
    stocks.forEach(stock => {
      const dividendPerPayment = stock.frequency === 'monthly' 
        ? (stock.annualDividend * stock.shares) / 12
        : stock.frequency === 'quarterly'
          ? (stock.annualDividend * stock.shares) / 4
          : stock.annualDividend * stock.shares;
      
      // Parse ex-date and payment date
      if (stock.nextExDate) {
        try {
          const exDate = parseISO(stock.nextExDate);
          // Generate recurring events based on frequency
          const frequencyMonths = stock.frequency === 'monthly' ? 1 : stock.frequency === 'quarterly' ? 3 : 12;
          
          for (let offset = -12; offset <= 12; offset += frequencyMonths) {
            const eventExDate = addMonths(exDate, offset);
            if (eventExDate >= monthStart && eventExDate <= monthEnd) {
              events.push({
                date: eventExDate,
                symbol: stock.symbol,
                type: 'ex-date',
                amount: dividendPerPayment
              });
            }
            
            // Payment date is typically ~10 days after ex-date if not specified
            const paymentDate = stock.paymentDate 
              ? addMonths(parseISO(stock.paymentDate), offset)
              : addDays(eventExDate, 10);
            if (paymentDate >= monthStart && paymentDate <= monthEnd) {
              events.push({
                date: paymentDate,
                symbol: stock.symbol,
                type: 'payment',
                amount: dividendPerPayment
              });
            }
          }
        } catch (e) {
          console.error('Error parsing date for', stock.symbol, e);
        }
      }
    });
    
    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [stocks, calendarMonth]);

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return calendarEvents.filter(event => isSameDay(event.date, day));
  };

  // Calendar days for the current month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Add padding days for the start of the week
    const startPadding = monthStart.getDay();
    const paddedDays: (Date | null)[] = Array(startPadding).fill(null);
    
    return [...paddedDays, ...days];
  }, [calendarMonth]);

  // Monthly income by stock for pie chart
  const incomeByStock = useMemo(() => {
    return stocks.map(stock => ({
      symbol: stock.symbol,
      income: stock.annualDividend * stock.shares,
      yield: stock.dividendYield
    })).sort((a, b) => b.income - a.income);
  }, [stocks]);

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(142, 76%, 36%)', 'hsl(221, 83%, 53%)'];

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
            {/* Visual Calendar */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarDays className="h-5 w-5" />
                      Dividend Calendar
                    </CardTitle>
                    <CardDescription>Ex-dates and payment dates for your holdings</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCalendarMonth(prev => addMonths(prev, -1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium w-32 text-center">
                      {format(calendarMonth, 'MMMM yyyy')}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCalendarMonth(prev => addMonths(prev, 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Calendar Legend */}
                <div className="flex gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-warning" />
                    <span>Ex-Dividend Date</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-success" />
                    <span>Payment Date</span>
                  </div>
                </div>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                  {calendarDays.map((day, i) => {
                    if (!day) {
                      return <div key={`empty-${i}`} className="h-24 bg-muted/20 rounded" />;
                    }
                    const events = getEventsForDay(day);
                    const hasExDate = events.some(e => e.type === 'ex-date');
                    const hasPayment = events.some(e => e.type === 'payment');
                    
                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "h-24 p-1 rounded border text-xs overflow-hidden",
                          isToday(day) && "border-primary bg-primary/5",
                          !isSameMonth(day, calendarMonth) && "opacity-50",
                          events.length > 0 && "bg-muted/30"
                        )}
                      >
                        <div className={cn(
                          "font-medium mb-1",
                          isToday(day) && "text-primary"
                        )}>
                          {format(day, 'd')}
                        </div>
                        <div className="space-y-0.5 overflow-y-auto max-h-16">
                          {events.slice(0, 3).map((event, idx) => (
                            <div
                              key={`${event.symbol}-${event.type}-${idx}`}
                              className={cn(
                                "px-1 py-0.5 rounded text-[10px] truncate",
                                event.type === 'ex-date' 
                                  ? "bg-warning/20 text-warning-foreground border-l-2 border-warning"
                                  : "bg-success/20 text-success border-l-2 border-success"
                              )}
                              title={`${event.symbol} ${event.type === 'ex-date' ? 'Ex-Date' : 'Payment'}: $${event.amount.toFixed(2)}`}
                            >
                              {event.symbol}
                            </div>
                          ))}
                          {events.length > 3 && (
                            <div className="text-[10px] text-muted-foreground">
                              +{events.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Income Chart with Details */}
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Banknote className="h-5 w-5" />
                    Monthly Income Distribution
                  </CardTitle>
                  <CardDescription>Expected dividend payments by month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis tickFormatter={(v) => `$${v}`} className="text-xs" />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.[0]) return null;
                            const data = payload[0].payload;
                            return (
                              <div className="bg-card border rounded-lg p-3 shadow-lg">
                                <p className="font-medium mb-2">{label}</p>
                                <p className="text-success font-bold">${data.income.toFixed(2)}</p>
                                {data.contributors?.length > 0 && (
                                  <div className="mt-2 pt-2 border-t text-xs space-y-1">
                                    {data.contributors.map((c: { symbol: string; amount: number }) => (
                                      <div key={c.symbol} className="flex justify-between gap-4">
                                        <span>{c.symbol}</span>
                                        <span className="text-muted-foreground">${c.amount.toFixed(2)}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="income" radius={[4, 4, 0, 0]}>
                          {monthlyBreakdown.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.income > 0 ? 'hsl(var(--success))' : 'hsl(var(--muted))'} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Income by Holding</CardTitle>
                  <CardDescription>Annual dividend income breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={incomeByStock}
                          dataKey="income"
                          nameKey="symbol"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {incomeByStock.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string) => [`$${value.toFixed(2)}/yr`, name]}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {incomeByStock.slice(0, 6).map((stock, i) => (
                      <div key={stock.symbol} className="flex items-center gap-2 text-xs">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <span className="font-medium">{stock.symbol}</span>
                        <span className="text-muted-foreground">${stock.income.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Dividends List */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Ex-Dividend & Payment Dates</CardTitle>
                <CardDescription>Next 30 days of dividend events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Ex-Dates */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-warning" />
                      Ex-Dividend Dates
                    </h4>
                    <div className="space-y-2">
                      {stocks
                        .sort((a, b) => new Date(a.nextExDate).getTime() - new Date(b.nextExDate).getTime())
                        .slice(0, 5)
                        .map((stock) => (
                          <div
                            key={stock.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-warning/10 border border-warning/20"
                          >
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-warning" />
                              <div>
                                <p className="font-medium text-sm">{stock.symbol}</p>
                                <p className="text-xs text-muted-foreground">{stock.frequency}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="text-xs">{stock.nextExDate}</Badge>
                              <p className="text-xs text-success mt-0.5">
                                ${((stock.annualDividend * stock.shares) / (stock.frequency === 'monthly' ? 12 : stock.frequency === 'quarterly' ? 4 : 1)).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Payment Dates */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-success" />
                      Payment Dates
                    </h4>
                    <div className="space-y-2">
                      {stocks
                        .filter(s => s.paymentDate)
                        .sort((a, b) => new Date(a.paymentDate!).getTime() - new Date(b.paymentDate!).getTime())
                        .slice(0, 5)
                        .map((stock) => (
                          <div
                            key={stock.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-success/10 border border-success/20"
                          >
                            <div className="flex items-center gap-2">
                              <Banknote className="h-4 w-4 text-success" />
                              <div>
                                <p className="font-medium text-sm">{stock.symbol}</p>
                                <p className="text-xs text-muted-foreground">{stock.frequency}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="text-xs bg-success/10">{stock.paymentDate}</Badge>
                              <p className="text-xs text-success mt-0.5">
                                ${((stock.annualDividend * stock.shares) / (stock.frequency === 'monthly' ? 12 : stock.frequency === 'quarterly' ? 4 : 1)).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
