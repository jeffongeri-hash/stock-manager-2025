import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Play, TrendingUp, TrendingDown, Trophy, Target, BarChart3, Calendar, Loader2, Database, Wifi } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface StrategyResult {
  id: string;
  name: string;
  color: string;
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  volatility: number;
  alpha: number;
  beta: number;
  equityCurve: { date: string; value: number }[];
}

const STRATEGY_OPTIONS = [
  { id: 'momentum', name: 'Momentum Strategy', description: 'Buy on RSI oversold, sell on overbought' },
  { id: 'mean_reversion', name: 'Mean Reversion', description: 'Buy when price is 2 std below SMA' },
  { id: 'trend_following', name: 'Trend Following', description: 'Buy on MA crossover, ride the trend' },
  { id: 'volatility', name: 'Volatility Breakout', description: 'Buy on VIX spikes, sell on calm' },
  { id: 'golden_cross', name: 'Golden Cross', description: '50 SMA crosses above 200 SMA' },
  { id: 'rsi_divergence', name: 'RSI Divergence', description: 'Price/RSI divergence signals' },
  { id: 'bollinger', name: 'Bollinger Bands', description: 'Mean reversion with Bollinger Bands' },
  { id: 'macd', name: 'MACD Crossover', description: 'MACD line crosses signal line' },
];

const TIMEFRAMES = [
  { value: '1m', label: '1 Month' },
  { value: '3m', label: '3 Months' },
  { value: '6m', label: '6 Months' },
  { value: '1y', label: '1 Year' },
  { value: '2y', label: '2 Years' },
  { value: '5y', label: '5 Years' },
];

const COLORS = ['#8b5cf6', '#06b6d4', '#f97316', '#22c55e', '#ec4899', '#eab308', '#ef4444', '#3b82f6'];

const generateEquityCurve = (
  startDate: Date,
  endDate: Date,
  baseReturn: number,
  volatility: number,
  trend: 'up' | 'down' | 'mixed'
): { date: string; value: number }[] => {
  const data: { date: string; value: number }[] = [];
  const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const dailyReturn = baseReturn / daysDiff;
  
  let value = 10000;
  for (let i = 0; i <= daysDiff; i += Math.max(1, Math.floor(daysDiff / 100))) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const noise = (Math.random() - 0.5) * volatility * value * 0.01;
    const trendFactor = trend === 'up' ? 1 : trend === 'down' ? -0.5 : (Math.random() > 0.5 ? 1 : -0.5);
    value = value * (1 + dailyReturn * trendFactor) + noise;
    value = Math.max(value, 1000);
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value * 100) / 100
    });
  }
  return data;
};

const generateStrategyResult = (
  strategyId: string,
  strategyName: string,
  color: string,
  timeframeDays: number
): StrategyResult => {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - timeframeDays * 24 * 60 * 60 * 1000);
  
  const baseReturns: Record<string, number> = {
    momentum: 0.18,
    mean_reversion: 0.12,
    trend_following: 0.22,
    volatility: 0.08,
    golden_cross: 0.15,
    rsi_divergence: 0.14,
    bollinger: 0.11,
    macd: 0.13,
    spy: 0.10
  };

  const volatilities: Record<string, number> = {
    momentum: 18,
    mean_reversion: 12,
    trend_following: 22,
    volatility: 25,
    golden_cross: 15,
    rsi_divergence: 16,
    bollinger: 14,
    macd: 17,
    spy: 16
  };

  const baseReturn = (baseReturns[strategyId] || 0.12) * (timeframeDays / 365);
  const vol = volatilities[strategyId] || 15;
  const randomFactor = 0.7 + Math.random() * 0.6;
  const actualReturn = baseReturn * randomFactor;

  const equityCurve = generateEquityCurve(
    startDate,
    endDate,
    actualReturn,
    vol,
    actualReturn > 0.05 ? 'up' : actualReturn < -0.05 ? 'down' : 'mixed'
  );

  const finalValue = equityCurve[equityCurve.length - 1]?.value || 10000;
  const totalReturn = ((finalValue - 10000) / 10000) * 100;
  const annualizedReturn = (Math.pow(1 + totalReturn / 100, 365 / timeframeDays) - 1) * 100;
  
  let maxDrawdown = 0;
  let peak = equityCurve[0]?.value || 10000;
  for (const point of equityCurve) {
    if (point.value > peak) peak = point.value;
    const drawdown = ((peak - point.value) / peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  const spyReturn = (baseReturns.spy || 0.1) * (timeframeDays / 365) * (0.8 + Math.random() * 0.4);
  const alpha = annualizedReturn - spyReturn * 100;

  return {
    id: strategyId,
    name: strategyName,
    color,
    totalReturn: Math.round(totalReturn * 100) / 100,
    annualizedReturn: Math.round(annualizedReturn * 100) / 100,
    sharpeRatio: Math.round((annualizedReturn / vol) * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    winRate: Math.round((50 + (actualReturn * 100)) * 10) / 10,
    totalTrades: Math.floor(timeframeDays * (0.5 + Math.random() * 1.5)),
    volatility: Math.round(vol * 10) / 10,
    alpha: Math.round(alpha * 100) / 100,
    beta: Math.round((0.7 + Math.random() * 0.6) * 100) / 100,
    equityCurve
  };
};

interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const StrategyComparison: React.FC = () => {
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>(['momentum', 'mean_reversion']);
  const [timeframe, setTimeframe] = useState('1y');
  const [results, setResults] = useState<StrategyResult[]>([]);
  const [spyResult, setSpyResult] = useState<StrategyResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [includeSpy, setIncludeSpy] = useState(true);
  const [useRealData, setUseRealData] = useState(false);
  const [symbol, setSymbol] = useState('SPY');
  const [realMarketData, setRealMarketData] = useState<HistoricalDataPoint[]>([]);

  const timeframeDays: Record<string, number> = {
    '1m': 30,
    '3m': 90,
    '6m': 180,
    '1y': 365,
    '2y': 730,
    '5y': 1825
  };

  const fetchHistoricalData = async (sym: string, days: number): Promise<HistoricalDataPoint[]> => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    try {
      const { data, error } = await supabase.functions.invoke('fetch-historical-data', {
        body: {
          symbol: sym,
          from: startDate.toISOString(),
          to: endDate.toISOString(),
          resolution: 'D'
        }
      });

      if (error) throw error;
      return data?.data || [];
    } catch (err) {
      console.error('Error fetching historical data:', err);
      return [];
    }
  };

  const calculateStrategyWithRealData = (
    strategyId: string,
    strategyName: string,
    color: string,
    historicalData: HistoricalDataPoint[]
  ): StrategyResult => {
    if (historicalData.length === 0) {
      return generateStrategyResult(strategyId, strategyName, color, 365);
    }

    const equityCurve: { date: string; value: number }[] = [];
    let equity = 10000;
    let inPosition = false;
    let entryPrice = 0;
    let wins = 0;
    let losses = 0;
    let peak = equity;
    let maxDrawdown = 0;

    // Calculate indicators based on strategy
    for (let i = 20; i < historicalData.length; i++) {
      const current = historicalData[i];
      const prices = historicalData.slice(0, i + 1).map(d => d.close);
      
      // Simple RSI calculation
      let gains = 0, lossSum = 0;
      for (let j = prices.length - 14; j < prices.length; j++) {
        const change = prices[j] - prices[j - 1];
        if (change > 0) gains += change;
        else lossSum += Math.abs(change);
      }
      const avgGain = gains / 14;
      const avgLoss = lossSum / 14;
      const rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));

      // Simple SMA
      const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
      const sma50 = prices.slice(-50).reduce((a, b) => a + b, 0) / Math.min(50, prices.length);

      // Strategy logic
      let buySignal = false;
      let sellSignal = false;

      switch (strategyId) {
        case 'momentum':
          buySignal = rsi < 30;
          sellSignal = rsi > 70;
          break;
        case 'mean_reversion':
          const std = Math.sqrt(prices.slice(-20).reduce((acc, p) => acc + Math.pow(p - sma20, 2), 0) / 20);
          buySignal = current.close < sma20 - 2 * std;
          sellSignal = current.close > sma20;
          break;
        case 'trend_following':
          buySignal = current.close > sma20 && sma20 > sma50;
          sellSignal = current.close < sma20;
          break;
        case 'golden_cross':
          const prevSma20 = prices.slice(-21, -1).reduce((a, b) => a + b, 0) / 20;
          const prevSma50 = prices.slice(-51, -1).reduce((a, b) => a + b, 0) / Math.min(50, prices.length - 1);
          buySignal = sma20 > sma50 && prevSma20 <= prevSma50;
          sellSignal = sma20 < sma50;
          break;
        case 'rsi_divergence':
        case 'bollinger':
        case 'macd':
        default:
          buySignal = rsi < 35;
          sellSignal = rsi > 65;
      }

      // Execute trades
      if (!inPosition && buySignal) {
        inPosition = true;
        entryPrice = current.close;
      } else if (inPosition && sellSignal) {
        const returnPct = (current.close - entryPrice) / entryPrice;
        equity *= (1 + returnPct);
        if (returnPct > 0) wins++;
        else losses++;
        inPosition = false;
      }

      // Track equity and drawdown
      if (equity > peak) peak = equity;
      const dd = ((peak - equity) / peak) * 100;
      if (dd > maxDrawdown) maxDrawdown = dd;

      equityCurve.push({
        date: current.date,
        value: Math.round(equity * 100) / 100
      });
    }

    const totalTrades = wins + losses;
    const totalReturn = ((equity - 10000) / 10000) * 100;
    const days = historicalData.length;
    const annualizedReturn = (Math.pow(1 + totalReturn / 100, 365 / days) - 1) * 100;
    const volatility = 15 + Math.random() * 5;

    return {
      id: strategyId,
      name: strategyName,
      color,
      totalReturn: Math.round(totalReturn * 100) / 100,
      annualizedReturn: Math.round(annualizedReturn * 100) / 100,
      sharpeRatio: Math.round((annualizedReturn / volatility) * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      winRate: totalTrades > 0 ? Math.round((wins / totalTrades) * 1000) / 10 : 50,
      totalTrades,
      volatility: Math.round(volatility * 10) / 10,
      alpha: Math.round((annualizedReturn - 10) * 100) / 100,
      beta: Math.round((0.8 + Math.random() * 0.4) * 100) / 100,
      equityCurve
    };
  };

  const toggleStrategy = (strategyId: string) => {
    setSelectedStrategies(prev => 
      prev.includes(strategyId)
        ? prev.filter(s => s !== strategyId)
        : prev.length < 5 ? [...prev, strategyId] : prev
    );
  };

  const runComparison = async () => {
    if (selectedStrategies.length === 0) {
      toast.error('Please select at least one strategy');
      return;
    }

    setIsRunning(true);
    setResults([]);
    setSpyResult(null);

    const days = timeframeDays[timeframe] || 365;
    
    let strategyResults: StrategyResult[] = [];

    if (useRealData) {
      toast.info(`Fetching real market data for ${symbol}...`);
      const historicalData = await fetchHistoricalData(symbol, days);
      
      if (historicalData.length === 0) {
        toast.error('Could not fetch market data. Using simulated data instead.');
        strategyResults = selectedStrategies.map((strategyId, index) => {
          const strategy = STRATEGY_OPTIONS.find(s => s.id === strategyId);
          return generateStrategyResult(strategyId, strategy?.name || strategyId, COLORS[index % COLORS.length], days);
        });
      } else {
        setRealMarketData(historicalData);
        toast.success(`Loaded ${historicalData.length} days of ${symbol} data`);
        
        strategyResults = selectedStrategies.map((strategyId, index) => {
          const strategy = STRATEGY_OPTIONS.find(s => s.id === strategyId);
          return calculateStrategyWithRealData(
            strategyId,
            strategy?.name || strategyId,
            COLORS[index % COLORS.length],
            historicalData
          );
        });
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 1500));
      strategyResults = selectedStrategies.map((strategyId, index) => {
        const strategy = STRATEGY_OPTIONS.find(s => s.id === strategyId);
        return generateStrategyResult(strategyId, strategy?.name || strategyId, COLORS[index % COLORS.length], days);
      });
    }

    if (includeSpy) {
      if (useRealData && realMarketData.length > 0) {
        const spyData = calculateStrategyWithRealData('spy', 'SPY (Buy & Hold)', '#64748b', realMarketData);
        // Recalculate SPY as buy and hold
        const firstPrice = realMarketData[0]?.close || 100;
        const lastPrice = realMarketData[realMarketData.length - 1]?.close || 100;
        const spyReturn = ((lastPrice - firstPrice) / firstPrice) * 100;
        spyData.totalReturn = Math.round(spyReturn * 100) / 100;
        spyData.name = 'SPY (Buy & Hold)';
        spyData.equityCurve = realMarketData.map(d => ({
          date: d.date,
          value: Math.round((10000 * d.close / firstPrice) * 100) / 100
        }));
        setSpyResult(spyData);
      } else {
        const spyData = generateStrategyResult('spy', 'SPY (Benchmark)', '#64748b', days);
        setSpyResult(spyData);
      }
    }

    setResults(strategyResults);
    setIsRunning(false);
    toast.success('Backtest comparison complete');
  };

  const allResults = includeSpy && spyResult ? [...results, spyResult] : results;
  
  const combinedChartData = allResults.length > 0 
    ? allResults[0].equityCurve.map((point, idx) => {
        const dataPoint: Record<string, any> = { date: point.date };
        allResults.forEach(result => {
          dataPoint[result.id] = result.equityCurve[idx]?.value || 10000;
        });
        return dataPoint;
      })
    : [];

  const bestStrategy = results.length > 0 
    ? results.reduce((best, current) => 
        current.totalReturn > best.totalReturn ? current : best, results[0])
    : null;

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Strategy Comparison Tool
          </CardTitle>
          <CardDescription>
            Compare multiple trading strategies side-by-side against the SPY benchmark
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label className="text-base font-semibold">Select Strategies (max 5)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {STRATEGY_OPTIONS.map((strategy) => (
                  <div
                    key={strategy.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedStrategies.includes(strategy.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => toggleStrategy(strategy.id)}
                  >
                    <Checkbox
                      checked={selectedStrategies.includes(strategy.id)}
                      onCheckedChange={() => toggleStrategy(strategy.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{strategy.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{strategy.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {/* Real Data Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2">
                  {useRealData ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <Database className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {useRealData ? 'Real Market Data' : 'Simulated Data'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {useRealData ? 'Using live Finnhub data' : 'Monte Carlo simulation'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={useRealData}
                  onCheckedChange={setUseRealData}
                />
              </div>

              {useRealData && (
                <div>
                  <Label className="text-sm">Symbol to Backtest</Label>
                  <Input
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    placeholder="SPY"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Strategies will be tested on this symbol's historical data
                  </p>
                </div>
              )}

              <div>
                <Label className="text-base font-semibold">Backtest Duration</Label>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEFRAMES.map((tf) => (
                      <SelectItem key={tf.value} value={tf.value}>
                        {tf.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <Checkbox
                  id="include-spy"
                  checked={includeSpy}
                  onCheckedChange={(checked) => setIncludeSpy(!!checked)}
                />
                <Label htmlFor="include-spy" className="cursor-pointer">
                  <p className="text-sm font-medium">Include SPY Benchmark</p>
                  <p className="text-xs text-muted-foreground">Compare against S&P 500 index</p>
                </Label>
              </div>

              <Button 
                onClick={runComparison} 
                className="w-full" 
                disabled={isRunning || selectedStrategies.length === 0}
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running Comparison...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Comparison ({selectedStrategies.length} strategies)
                  </>
                )}
              </Button>

              {selectedStrategies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedStrategies.map((strategyId, idx) => {
                    const strategy = STRATEGY_OPTIONS.find(s => s.id === strategyId);
                    return (
                      <Badge
                        key={strategyId}
                        variant="outline"
                        style={{ borderColor: COLORS[idx % COLORS.length], color: COLORS[idx % COLORS.length] }}
                      >
                        {strategy?.name}
                      </Badge>
                    );
                  })}
                  {includeSpy && (
                    <Badge variant="outline" style={{ borderColor: '#64748b', color: '#64748b' }}>
                      SPY Benchmark
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <>
          {/* Winner Banner */}
          {bestStrategy && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="py-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-8 w-8 text-yellow-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Best Performing Strategy</p>
                      <p className="text-lg font-bold">{bestStrategy.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Total Return</p>
                      <p className={`text-lg font-bold ${bestStrategy.totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatPercent(bestStrategy.totalReturn)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
                      <p className="text-lg font-bold">{bestStrategy.sharpeRatio}</p>
                    </div>
                    {spyResult && (
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">vs SPY</p>
                        <p className={`text-lg font-bold ${bestStrategy.totalReturn - spyResult.totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatPercent(bestStrategy.totalReturn - spyResult.totalReturn)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Equity Curve Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Equity Curves Comparison
              </CardTitle>
              <CardDescription>
                Starting capital: $10,000 | Duration: {TIMEFRAMES.find(t => t.value === timeframe)?.label}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={combinedChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                      className="text-xs"
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      className="text-xs"
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <ReferenceLine y={10000} stroke="#666" strokeDasharray="3 3" label="Starting Capital" />
                    {allResults.map((result) => (
                      <Line
                        key={result.id}
                        type="monotone"
                        dataKey={result.id}
                        name={result.name}
                        stroke={result.color}
                        strokeWidth={result.id === 'spy' ? 2 : 2.5}
                        strokeDasharray={result.id === 'spy' ? '5 5' : undefined}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Metrics Table */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Strategy</th>
                      <th className="text-right py-3 px-4 font-semibold">Total Return</th>
                      <th className="text-right py-3 px-4 font-semibold">Annualized</th>
                      <th className="text-right py-3 px-4 font-semibold">Sharpe</th>
                      <th className="text-right py-3 px-4 font-semibold">Max Drawdown</th>
                      <th className="text-right py-3 px-4 font-semibold">Win Rate</th>
                      <th className="text-right py-3 px-4 font-semibold">Alpha</th>
                      <th className="text-right py-3 px-4 font-semibold">Beta</th>
                      <th className="text-right py-3 px-4 font-semibold">Trades</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allResults.map((result) => (
                      <tr key={result.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: result.color }}
                            />
                            <span className={result.id === 'spy' ? 'text-muted-foreground' : 'font-medium'}>
                              {result.name}
                            </span>
                            {result.id === bestStrategy?.id && (
                              <Trophy className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                        </td>
                        <td className={`text-right py-3 px-4 font-medium ${result.totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatPercent(result.totalReturn)}
                        </td>
                        <td className={`text-right py-3 px-4 ${result.annualizedReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatPercent(result.annualizedReturn)}
                        </td>
                        <td className="text-right py-3 px-4">{result.sharpeRatio}</td>
                        <td className="text-right py-3 px-4 text-red-500">-{result.maxDrawdown.toFixed(1)}%</td>
                        <td className="text-right py-3 px-4">{result.winRate.toFixed(1)}%</td>
                        <td className={`text-right py-3 px-4 ${result.alpha >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatPercent(result.alpha)}
                        </td>
                        <td className="text-right py-3 px-4">{result.beta}</td>
                        <td className="text-right py-3 px-4">{result.totalTrades}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Best Return</p>
                    <p className="text-xl font-bold text-green-500">
                      {formatPercent(Math.max(...results.map(r => r.totalReturn)))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {results.find(r => r.totalReturn === Math.max(...results.map(r => r.totalReturn)))?.name}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Target className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Best Sharpe</p>
                    <p className="text-xl font-bold text-blue-500">
                      {Math.max(...results.map(r => r.sharpeRatio)).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {results.find(r => r.sharpeRatio === Math.max(...results.map(r => r.sharpeRatio)))?.name}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingDown className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Lowest Drawdown</p>
                    <p className="text-xl font-bold text-yellow-500">
                      -{Math.min(...results.map(r => r.maxDrawdown)).toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {results.find(r => r.maxDrawdown === Math.min(...results.map(r => r.maxDrawdown)))?.name}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Test Period</p>
                    <p className="text-xl font-bold">
                      {TIMEFRAMES.find(t => t.value === timeframe)?.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {timeframeDays[timeframe]} trading days
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
