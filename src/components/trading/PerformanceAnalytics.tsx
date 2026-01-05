import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Target, Activity, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface TradePerformance {
  id: string;
  ruleId?: string;
  ruleName?: string;
  symbol: string;
  instruction: string;
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  entryTime: string;
  exitTime?: string;
  realizedPnl?: number;
  status: 'open' | 'closed' | 'cancelled';
  executionStrategy?: string;
  slippage?: number;
  fees: number;
}

interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6'];

export const PerformanceAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<TradePerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    if (user) {
      loadPerformanceData();
    }
  }, [user, timeframe]);

  const loadPerformanceData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from('automated_trade_performance')
        .select('*, trading_rules(name)')
        .eq('user_id', user.id)
        .order('entry_time', { ascending: false });

      // Apply timeframe filter
      if (timeframe !== 'all') {
        const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        query = query.gte('entry_time', startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const mappedTrades: TradePerformance[] = (data || []).map(t => ({
        id: t.id,
        ruleId: t.rule_id,
        ruleName: (t.trading_rules as any)?.name,
        symbol: t.symbol,
        instruction: t.instruction,
        quantity: t.quantity,
        entryPrice: Number(t.entry_price),
        exitPrice: t.exit_price ? Number(t.exit_price) : undefined,
        entryTime: t.entry_time,
        exitTime: t.exit_time,
        realizedPnl: t.realized_pnl ? Number(t.realized_pnl) : undefined,
        status: t.status as 'open' | 'closed' | 'cancelled',
        executionStrategy: t.execution_strategy,
        slippage: t.slippage ? Number(t.slippage) : undefined,
        fees: Number(t.fees) || 0,
      }));

      setTrades(mappedTrades);
    } catch (error: any) {
      console.error('Error loading performance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMetrics = (): PerformanceMetrics => {
    const closedTrades = trades.filter(t => t.status === 'closed' && t.realizedPnl !== undefined);
    
    if (closedTrades.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalPnl: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
      };
    }

    const winningTrades = closedTrades.filter(t => (t.realizedPnl || 0) > 0);
    const losingTrades = closedTrades.filter(t => (t.realizedPnl || 0) < 0);
    
    const totalPnl = closedTrades.reduce((sum, t) => sum + (t.realizedPnl || 0), 0);
    const totalWins = winningTrades.reduce((sum, t) => sum + (t.realizedPnl || 0), 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + (t.realizedPnl || 0), 0));

    // Calculate running P&L for drawdown
    let runningPnl = 0;
    let peak = 0;
    let maxDrawdown = 0;
    
    closedTrades.forEach(t => {
      runningPnl += t.realizedPnl || 0;
      if (runningPnl > peak) peak = runningPnl;
      const drawdown = peak - runningPnl;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    // Calculate Sharpe Ratio (simplified)
    const returns = closedTrades.map(t => t.realizedPnl || 0);
    const avgReturn = totalPnl / closedTrades.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / closedTrades.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

    return {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: (winningTrades.length / closedTrades.length) * 100,
      totalPnl,
      avgWin: winningTrades.length > 0 ? totalWins / winningTrades.length : 0,
      avgLoss: losingTrades.length > 0 ? totalLosses / losingTrades.length : 0,
      profitFactor: totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0,
      maxDrawdown,
      sharpeRatio,
    };
  };

  const metrics = calculateMetrics();

  // Prepare chart data
  const equityCurve = trades
    .filter(t => t.status === 'closed')
    .reverse()
    .reduce((acc: { date: string; pnl: number; cumulative: number }[], trade) => {
      const lastCumulative = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
      const cumulative = lastCumulative + (trade.realizedPnl || 0);
      acc.push({
        date: new Date(trade.entryTime).toLocaleDateString(),
        pnl: trade.realizedPnl || 0,
        cumulative,
      });
      return acc;
    }, []);

  const winLossData = [
    { name: 'Wins', value: metrics.winningTrades },
    { name: 'Losses', value: metrics.losingTrades },
  ];

  const tradesBySymbol = trades.reduce((acc: Record<string, number>, trade) => {
    acc[trade.symbol] = (acc[trade.symbol] || 0) + 1;
    return acc;
  }, {});

  const symbolData = Object.entries(tradesBySymbol)
    .map(([symbol, count]) => ({ symbol, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeframe Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Performance Analytics
        </h2>
        <Select value={timeframe} onValueChange={(v) => setTimeframe(v as typeof timeframe)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center gap-1 ${metrics.totalPnl >= 0 ? 'text-green-500' : 'text-destructive'}`}>
              {metrics.totalPnl >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              ${Math.abs(metrics.totalPnl).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              <Target className="h-5 w-5" />
              {metrics.winRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              <Activity className="h-5 w-5" />
              {metrics.totalTrades}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profit Factor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.profitFactor >= 1 ? 'text-green-500' : 'text-destructive'}`}>
              {metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Max Drawdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ${metrics.maxDrawdown.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sharpe Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.sharpeRatio >= 1 ? 'text-green-500' : metrics.sharpeRatio >= 0 ? 'text-yellow-500' : 'text-destructive'}`}>
              {metrics.sharpeRatio.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equity Curve */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Equity Curve</CardTitle>
            <CardDescription>Cumulative P&L over time</CardDescription>
          </CardHeader>
          <CardContent>
            {equityCurve.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={equityCurve}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                    labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cumulative" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No trade data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Win/Loss Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Win/Loss Distribution</CardTitle>
            <CardDescription>Trade outcomes breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.totalTrades > 0 ? (
              <div className="flex items-center justify-around h-[250px]">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={winLossData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {winLossData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Wins: {metrics.winningTrades} (Avg: ${metrics.avgWin.toFixed(2)})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-destructive" />
                    <span>Losses: {metrics.losingTrades} (Avg: ${metrics.avgLoss.toFixed(2)})</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No trade data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trades by Symbol */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Traded Symbols</CardTitle>
          </CardHeader>
          <CardContent>
            {symbolData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={symbolData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" />
                  <YAxis dataKey="symbol" type="category" className="text-xs" width={50} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No trade data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Trades */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Trades</CardTitle>
          </CardHeader>
          <CardContent>
            {trades.length > 0 ? (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {trades.slice(0, 10).map(trade => (
                  <div key={trade.id} className="flex items-center justify-between p-2 border rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant={trade.instruction === 'BUY' ? 'default' : 'secondary'}>
                        {trade.instruction}
                      </Badge>
                      <span className="font-medium">{trade.symbol}</span>
                      <span className="text-muted-foreground">x{trade.quantity}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={trade.status === 'open' ? 'outline' : trade.status === 'closed' ? 'default' : 'secondary'}>
                        {trade.status}
                      </Badge>
                      {trade.realizedPnl !== undefined && (
                        <span className={trade.realizedPnl >= 0 ? 'text-green-500' : 'text-destructive'}>
                          {trade.realizedPnl >= 0 ? '+' : ''}${trade.realizedPnl.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No trades yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
