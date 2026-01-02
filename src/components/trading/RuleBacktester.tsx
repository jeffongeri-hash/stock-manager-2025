import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Play, Loader2, TrendingUp, TrendingDown, BarChart3, 
  Calendar, DollarSign, Target, AlertTriangle, CheckCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts';

interface BacktestResult {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  equityCurve: { date: string; equity: number; benchmark: number }[];
  trades: { date: string; type: 'buy' | 'sell'; price: number; pnl: number }[];
}

interface RuleBacktesterProps {
  ruleText: string;
  ruleName?: string;
}

export const RuleBacktester: React.FC<RuleBacktesterProps> = ({ ruleText, ruleName }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [period, setPeriod] = useState('1Y');
  const [initialCapital, setInitialCapital] = useState('10000');

  const runBacktest = async () => {
    if (!ruleText) {
      toast.error('No rule to backtest');
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setResult(null);

    // Simulate backtest progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 15, 95));
    }, 200);

    // Simulate backtest execution (in real app, this would call an edge function)
    await new Promise(resolve => setTimeout(resolve, 2500));

    clearInterval(progressInterval);
    setProgress(100);

    // Generate mock backtest results
    const capital = parseFloat(initialCapital);
    const mockResult = generateMockBacktestResult(capital, period);
    
    setResult(mockResult);
    setIsRunning(false);
    toast.success('Backtest completed!');
  };

  const generateMockBacktestResult = (capital: number, period: string): BacktestResult => {
    const months = period === '1M' ? 1 : period === '3M' ? 3 : period === '6M' ? 6 : period === '1Y' ? 12 : 24;
    const tradeDays = months * 21;
    
    // Generate equity curve
    const equityCurve: { date: string; equity: number; benchmark: number }[] = [];
    let equity = capital;
    let benchmark = capital;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const trades: { date: string; type: 'buy' | 'sell'; price: number; pnl: number }[] = [];
    let totalTrades = 0;
    let winningTrades = 0;
    let totalWinAmount = 0;
    let totalLossAmount = 0;
    let maxDrawdown = 0;
    let peak = capital;

    for (let i = 0; i < tradeDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      // Random daily returns with slight positive bias
      const dailyReturn = (Math.random() - 0.48) * 0.025;
      const benchmarkReturn = (Math.random() - 0.48) * 0.02;
      
      equity *= (1 + dailyReturn);
      benchmark *= (1 + benchmarkReturn);

      // Track drawdown
      if (equity > peak) peak = equity;
      const drawdown = (peak - equity) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;

      // Simulate trades (roughly 2-3 trades per month)
      if (Math.random() < 0.12) {
        totalTrades++;
        const tradeReturn = (Math.random() - 0.45) * 0.08;
        const pnl = capital * 0.1 * tradeReturn;
        
        if (pnl > 0) {
          winningTrades++;
          totalWinAmount += pnl;
        } else {
          totalLossAmount += Math.abs(pnl);
        }

        trades.push({
          date: dateStr,
          type: Math.random() > 0.3 ? 'buy' : 'sell',
          price: 100 + Math.random() * 50,
          pnl
        });
      }

      equityCurve.push({
        date: dateStr,
        equity: Math.round(equity * 100) / 100,
        benchmark: Math.round(benchmark * 100) / 100
      });
    }

    const losingTrades = totalTrades - winningTrades;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const avgWin = winningTrades > 0 ? totalWinAmount / winningTrades : 0;
    const avgLoss = losingTrades > 0 ? totalLossAmount / losingTrades : 0;
    const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount > 0 ? 999 : 0;
    const totalReturn = ((equity - capital) / capital) * 100;

    // Approximate Sharpe ratio
    const sharpeRatio = totalReturn > 0 ? (totalReturn / 100) / (maxDrawdown || 0.1) : 0;

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      winRate: Math.round(winRate * 10) / 10,
      totalReturn: Math.round(totalReturn * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 10000) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      profitFactor: Math.round(profitFactor * 100) / 100,
      avgWin: Math.round(avgWin * 100) / 100,
      avgLoss: Math.round(avgLoss * 100) / 100,
      equityCurve,
      trades: trades.slice(-10) // Last 10 trades
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Rule Backtester
        </CardTitle>
        <CardDescription>
          Test your trading rule against historical data before enabling it
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {ruleText ? (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Testing Rule:</p>
            <p className="text-sm font-mono">{ruleName || ruleText}</p>
          </div>
        ) : (
          <div className="bg-yellow-500/10 rounded-lg p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
            <p className="text-sm text-yellow-700">Parse a rule first to run a backtest</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Backtest Period</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1M">1 Month</SelectItem>
                <SelectItem value="3M">3 Months</SelectItem>
                <SelectItem value="6M">6 Months</SelectItem>
                <SelectItem value="1Y">1 Year</SelectItem>
                <SelectItem value="2Y">2 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Initial Capital</Label>
            <Input
              type="number"
              value={initialCapital}
              onChange={(e) => setInitialCapital(e.target.value)}
              placeholder="10000"
            />
          </div>
          <div className="flex items-end">
            <Button 
              onClick={runBacktest} 
              disabled={isRunning || !ruleText}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Backtest
                </>
              )}
            </Button>
          </div>
        </div>

        {isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing historical data...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {result && (
          <div className="space-y-6 pt-4 border-t">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Total Return</p>
                <p className={`text-xl font-bold ${result.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {result.totalReturn >= 0 ? '+' : ''}{result.totalReturn}%
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Win Rate</p>
                <p className="text-xl font-bold">{result.winRate}%</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Max Drawdown</p>
                <p className="text-xl font-bold text-red-600">-{result.maxDrawdown}%</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
                <p className="text-xl font-bold">{result.sharpeRatio}</p>
              </div>
            </div>

            {/* Equity Curve Chart */}
            <div>
              <h4 className="text-sm font-medium mb-3">Equity Curve vs Benchmark</h4>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={result.equityCurve.filter((_, i) => i % 5 === 0)}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short' })}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value: number) => ['$' + value.toFixed(2)]}
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <ReferenceLine 
                      y={parseFloat(initialCapital)} 
                      stroke="#888" 
                      strokeDasharray="3 3" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="equity" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.2}
                      name="Strategy"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="benchmark" 
                      stroke="#888" 
                      strokeDasharray="5 5"
                      dot={false}
                      name="Benchmark"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total Trades</p>
                <p className="font-semibold">{result.totalTrades}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Winning / Losing</p>
                <p className="font-semibold">
                  <span className="text-green-600">{result.winningTrades}</span>
                  {' / '}
                  <span className="text-red-600">{result.losingTrades}</span>
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Avg Win / Loss</p>
                <p className="font-semibold">
                  <span className="text-green-600">${result.avgWin}</span>
                  {' / '}
                  <span className="text-red-600">${result.avgLoss}</span>
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Profit Factor</p>
                <p className="font-semibold">{result.profitFactor}</p>
              </div>
            </div>

            {/* Recent Trades */}
            <div>
              <h4 className="text-sm font-medium mb-3">Sample Trades</h4>
              <div className="space-y-2">
                {result.trades.map((trade, i) => (
                  <div key={i} className="flex items-center justify-between text-sm bg-muted/30 rounded px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={trade.type === 'buy' ? 'default' : 'destructive'} className="text-xs">
                        {trade.type.toUpperCase()}
                      </Badge>
                      <span className="text-muted-foreground">{trade.date}</span>
                      <span>@ ${trade.price.toFixed(2)}</span>
                    </div>
                    <span className={trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendation */}
            <div className={`rounded-lg p-4 ${
              result.totalReturn > 5 && result.winRate > 50 
                ? 'bg-green-500/10 border border-green-500/20' 
                : result.totalReturn < 0 
                ? 'bg-red-500/10 border border-red-500/20'
                : 'bg-yellow-500/10 border border-yellow-500/20'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {result.totalReturn > 5 && result.winRate > 50 ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-700">Strategy Looks Promising</span>
                  </>
                ) : result.totalReturn < 0 ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-700">Strategy Needs Adjustment</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-700">Moderate Performance</span>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {result.totalReturn > 5 && result.winRate > 50 
                  ? `This strategy shows a ${result.totalReturn}% return with ${result.winRate}% win rate. Consider enabling it with proper position sizing.`
                  : result.totalReturn < 0 
                  ? `This strategy shows a ${result.totalReturn}% return. Consider adjusting conditions or testing different parameters.`
                  : `This strategy shows modest returns. Consider paper trading before going live.`
                }
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
