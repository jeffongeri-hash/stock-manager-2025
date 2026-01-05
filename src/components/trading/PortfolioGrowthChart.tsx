import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Percent, Calendar, Target } from 'lucide-react';

interface PortfolioGrowthChartProps {
  mode?: 'backtest' | 'live' | 'projection';
  backtestData?: {
    dates: string[];
    values: number[];
  };
  liveData?: {
    dates: string[];
    values: number[];
  };
}

interface ProjectionData {
  month: string;
  conservative: number;
  moderate: number;
  aggressive: number;
  benchmark: number;
}

const PortfolioGrowthChart: React.FC<PortfolioGrowthChartProps> = ({
  mode = 'projection',
  backtestData,
  liveData
}) => {
  const [initialCapital, setInitialCapital] = useState(1000);
  const [timeHorizon, setTimeHorizon] = useState('12'); // months
  const [strategy, setStrategy] = useState('moderate');

  // Strategy return assumptions (monthly)
  const strategyReturns = {
    conservative: { monthly: 0.005, risk: 0.02, label: 'Conservative', description: '6% annual' },
    moderate: { monthly: 0.008, risk: 0.04, label: 'Moderate', description: '10% annual' },
    aggressive: { monthly: 0.015, risk: 0.08, label: 'Aggressive', description: '18% annual' }
  };

  // Generate projection data
  const projectionData = useMemo(() => {
    const months = parseInt(timeHorizon);
    const data: ProjectionData[] = [];
    
    let conservative = initialCapital;
    let moderate = initialCapital;
    let aggressive = initialCapital;
    let benchmark = initialCapital;

    for (let i = 0; i <= months; i++) {
      const monthLabel = i === 0 ? 'Start' : `M${i}`;
      
      data.push({
        month: monthLabel,
        conservative: parseFloat(conservative.toFixed(2)),
        moderate: parseFloat(moderate.toFixed(2)),
        aggressive: parseFloat(aggressive.toFixed(2)),
        benchmark: parseFloat(benchmark.toFixed(2))
      });

      // Apply monthly returns with some variance
      const variance = (Math.random() - 0.5) * 0.02;
      conservative *= (1 + strategyReturns.conservative.monthly + variance * 0.5);
      moderate *= (1 + strategyReturns.moderate.monthly + variance);
      aggressive *= (1 + strategyReturns.aggressive.monthly + variance * 1.5);
      benchmark *= (1 + 0.007); // S&P 500 average ~8.5% annual
    }

    return data;
  }, [initialCapital, timeHorizon]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const months = parseInt(timeHorizon);
    const selectedReturn = strategyReturns[strategy as keyof typeof strategyReturns];
    
    const finalValue = initialCapital * Math.pow(1 + selectedReturn.monthly, months);
    const totalReturn = finalValue - initialCapital;
    const returnPct = (totalReturn / initialCapital) * 100;
    const annualizedReturn = (Math.pow(finalValue / initialCapital, 12 / months) - 1) * 100;
    
    // Risk-adjusted metrics
    const maxDrawdown = selectedReturn.risk * 100 * (months / 12);
    const sharpeRatio = (annualizedReturn - 4) / (selectedReturn.risk * 100); // Assuming 4% risk-free rate

    return {
      finalValue,
      totalReturn,
      returnPct,
      annualizedReturn,
      maxDrawdown: Math.min(maxDrawdown, 35), // Cap at 35%
      sharpeRatio: Math.max(sharpeRatio, 0)
    };
  }, [initialCapital, timeHorizon, strategy]);

  // Generate backtest chart data
  const backtestChartData = useMemo(() => {
    if (!backtestData) {
      // Generate sample backtest data
      const data = [];
      let value = initialCapital;
      const days = parseInt(timeHorizon) * 30;
      
      for (let i = 0; i <= Math.min(days, 365); i += 7) {
        const variance = (Math.random() - 0.45) * 0.03;
        value *= (1 + variance);
        value = Math.max(value, initialCapital * 0.7); // Floor at 30% loss
        
        data.push({
          day: i === 0 ? 'Start' : `D${i}`,
          portfolio: parseFloat(value.toFixed(2)),
          benchmark: parseFloat((initialCapital * (1 + (i / 365) * 0.085)).toFixed(2))
        });
      }
      return data;
    }

    return backtestData.dates.map((date, i) => ({
      day: date,
      portfolio: backtestData.values[i],
      benchmark: initialCapital * (1 + (i / backtestData.dates.length) * 0.085)
    }));
  }, [backtestData, initialCapital, timeHorizon]);

  // Generate live automation data
  const liveChartData = useMemo(() => {
    if (!liveData) {
      // Generate sample live data (last 30 days)
      const data = [];
      let value = initialCapital;
      
      for (let i = 0; i <= 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (30 - i));
        
        const variance = (Math.random() - 0.48) * 0.02;
        value *= (1 + variance);
        
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          portfolio: parseFloat(value.toFixed(2)),
          trades: Math.floor(Math.random() * 3)
        });
      }
      return data;
    }

    return liveData.dates.map((date, i) => ({
      date,
      portfolio: liveData.values[i],
      trades: Math.floor(Math.random() * 3)
    }));
  }, [liveData, initialCapital]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-semibold">${entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Portfolio Growth Chart
            </CardTitle>
            <CardDescription>
              Track performance and projected returns for your trading portfolio
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="capital" className="text-sm whitespace-nowrap">Starting Capital</Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="capital"
                  type="number"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(Math.max(100, parseInt(e.target.value) || 1000))}
                  className="w-28 pl-7"
                />
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="projection" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="projection" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Projection</span>
            </TabsTrigger>
            <TabsTrigger value="backtest" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Backtest</span>
            </TabsTrigger>
            <TabsTrigger value="live" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Live</span>
            </TabsTrigger>
          </TabsList>

          {/* Projection Tab */}
          <TabsContent value="projection" className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label>Time Horizon</Label>
                <Select value={timeHorizon} onValueChange={setTimeHorizon}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">1 year</SelectItem>
                    <SelectItem value="24">2 years</SelectItem>
                    <SelectItem value="36">3 years</SelectItem>
                    <SelectItem value="60">5 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Strategy</Label>
                <Select value={strategy} onValueChange={setStrategy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Est. Final Value</p>
                <p className="text-lg font-bold text-primary">
                  ${summaryStats.finalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Total Return</p>
                <p className={`text-lg font-bold ${summaryStats.returnPct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {summaryStats.returnPct >= 0 ? '+' : ''}{summaryStats.returnPct.toFixed(1)}%
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Annualized Return</p>
                <p className="text-lg font-bold text-primary">
                  {summaryStats.annualizedReturn.toFixed(1)}%
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Max Drawdown</p>
                <p className="text-lg font-bold text-orange-500">
                  -{summaryStats.maxDrawdown.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Projection Chart */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorConservative" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorModerate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAggressive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis 
                    className="text-xs" 
                    tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <ReferenceLine y={initialCapital} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
                  <Area 
                    type="monotone" 
                    dataKey="conservative" 
                    name="Conservative" 
                    stroke="#3b82f6" 
                    fill="url(#colorConservative)"
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="moderate" 
                    name="Moderate" 
                    stroke="#22c55e" 
                    fill="url(#colorModerate)"
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="aggressive" 
                    name="Aggressive" 
                    stroke="#f59e0b" 
                    fill="url(#colorAggressive)"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="benchmark" 
                    name="S&P 500 Benchmark" 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">⚠️ Disclaimer</p>
              <p>
                Projections are based on historical averages and assumptions. Actual returns may vary significantly. 
                Past performance does not guarantee future results.
              </p>
            </div>
          </TabsContent>

          {/* Backtest Tab */}
          <TabsContent value="backtest" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Strategy Return</p>
                <p className="text-lg font-bold text-green-500">
                  +{(((backtestChartData[backtestChartData.length - 1]?.portfolio || initialCapital) / initialCapital - 1) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">vs Benchmark</p>
                <p className="text-lg font-bold text-primary">
                  {((backtestChartData[backtestChartData.length - 1]?.portfolio || 0) > (backtestChartData[backtestChartData.length - 1]?.benchmark || 0)) ? '+' : ''}
                  {(((backtestChartData[backtestChartData.length - 1]?.portfolio || initialCapital) - (backtestChartData[backtestChartData.length - 1]?.benchmark || initialCapital)) / initialCapital * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Final Value</p>
                <p className="text-lg font-bold">
                  ${(backtestChartData[backtestChartData.length - 1]?.portfolio || initialCapital).toLocaleString()}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Data Points</p>
                <p className="text-lg font-bold">{backtestChartData.length}</p>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={backtestChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis 
                    className="text-xs" 
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <ReferenceLine y={initialCapital} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
                  <Line 
                    type="monotone" 
                    dataKey="portfolio" 
                    name="Portfolio" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="benchmark" 
                    name="S&P 500" 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Live Tab */}
          <TabsContent value="live" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Current Value</p>
                <p className="text-lg font-bold">
                  ${(liveChartData[liveChartData.length - 1]?.portfolio || initialCapital).toLocaleString()}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">30-Day Return</p>
                <p className={`text-lg font-bold ${((liveChartData[liveChartData.length - 1]?.portfolio || initialCapital) >= initialCapital) ? 'text-green-500' : 'text-red-500'}`}>
                  {((liveChartData[liveChartData.length - 1]?.portfolio || initialCapital) >= initialCapital) ? '+' : ''}
                  {(((liveChartData[liveChartData.length - 1]?.portfolio || initialCapital) / initialCapital - 1) * 100).toFixed(2)}%
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Total Trades</p>
                <p className="text-lg font-bold">
                  {liveChartData.reduce((sum, d) => sum + (d.trades || 0), 0)}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">
                  Live Trading
                </Badge>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={liveChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis 
                    className="text-xs" 
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <ReferenceLine y={initialCapital} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
                  <Area 
                    type="monotone" 
                    dataKey="portfolio" 
                    name="Portfolio Value" 
                    stroke="hsl(var(--primary))" 
                    fill="url(#colorLive)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PortfolioGrowthChart;
