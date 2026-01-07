import React, { useState, useEffect, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useStockData } from '@/hooks/useStockData';
import { usePortfolioReturns } from '@/hooks/usePortfolioReturns';
import { toast } from 'sonner';
import { Scale, Target, TrendingUp, TrendingDown, RefreshCw, Plus, Trash2, CheckCircle2, BarChart3, Info, Dice5, AlertCircle, History } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line } from 'recharts';

interface TargetAllocation {
  symbol: string;
  targetPercent: number;
}

interface StockTrade {
  id: string;
  symbol: string;
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  entry_date: string;
  exit_date: string | null;
}

interface MonteCarloResult {
  year: number;
  median: number;
  p10: number;
  p90: number;
  p5: number;
  p95: number;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(142, 76%, 36%)', 'hsl(221, 83%, 53%)', 'hsl(262, 83%, 58%)'];

// Generate random number with normal distribution (Box-Muller)
const gaussianRandom = (mean: number, std: number): number => {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * std + mean;
};

const PortfolioRebalancing = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<StockTrade[]>([]);
  const [targetAllocations, setTargetAllocations] = useState<TargetAllocation[]>([]);
  const [newSymbol, setNewSymbol] = useState('');
  const [newTargetPercent, setNewTargetPercent] = useState('');
  const [cashBalance, setCashBalance] = useState(10000);
  const [importedFromPortfolio, setImportedFromPortfolio] = useState(false);
  
  // Monte Carlo settings
  const [mcYears, setMcYears] = useState(10);
  const [mcSimulations, setMcSimulations] = useState(1000);
  const [mcResults, setMcResults] = useState<MonteCarloResult[]>([]);
  const [isRunningMC, setIsRunningMC] = useState(false);
  const [riskFreeRate] = useState(0.05); // 5% risk-free rate

  // Use real portfolio returns from trade history
  const portfolioReturns = usePortfolioReturns(riskFreeRate);
  const activeSymbols = useMemo(() => {
    return [...new Set(trades.filter(t => !t.exit_date).map(t => t.symbol))];
  }, [trades]);

  const { stocks: stockPrices, loading: pricesLoading } = useStockData(activeSymbols);

  useEffect(() => {
    if (user) {
      fetchTrades();
    }
  }, [user]);

  const fetchTrades = async () => {
    const { data, error } = await supabase
      .from('stock_trades')
      .select('*')
      .is('exit_date', null)
      .order('entry_date', { ascending: false });

    if (error) {
      toast.error('Failed to fetch trades');
      return;
    }
    setTrades(data || []);
  };

  const importFromPortfolio = () => {
    const totalValue = Object.values(currentHoldings).reduce((sum, h) => sum + h.currentValue, 0) + cashBalance;
    const newTargets = currentAllocations.map(a => ({
      symbol: a.symbol,
      targetPercent: Math.round(a.currentPercent)
    }));
    setTargetAllocations(newTargets);
    setImportedFromPortfolio(true);
    toast.success(`Imported ${newTargets.length} positions from portfolio`);
  };

  const currentHoldings = useMemo(() => {
    const holdings: { [symbol: string]: { shares: number; currentValue: number; costBasis: number } } = {};
    
    trades.filter(t => !t.exit_date).forEach(trade => {
      const currentPrice = stockPrices.find(s => s.symbol === trade.symbol)?.price || trade.entry_price;
      
      if (!holdings[trade.symbol]) {
        holdings[trade.symbol] = { shares: 0, currentValue: 0, costBasis: 0 };
      }
      holdings[trade.symbol].shares += trade.quantity;
      holdings[trade.symbol].currentValue += trade.quantity * currentPrice;
      holdings[trade.symbol].costBasis += trade.quantity * trade.entry_price;
    });
    
    return holdings;
  }, [trades, stockPrices]);

  const totalPortfolioValue = useMemo(() => {
    return Object.values(currentHoldings).reduce((sum, h) => sum + h.currentValue, 0) + cashBalance;
  }, [currentHoldings, cashBalance]);

  const currentAllocations = useMemo(() => {
    return Object.entries(currentHoldings).map(([symbol, holding]) => ({
      symbol,
      currentPercent: (holding.currentValue / totalPortfolioValue) * 100,
      value: holding.currentValue,
      shares: holding.shares
    }));
  }, [currentHoldings, totalPortfolioValue]);

  const cashAllocation = (cashBalance / totalPortfolioValue) * 100;

  // Portfolio metrics from real trade history
  const portfolioMetrics = useMemo(() => {
    // Use real data if available, otherwise generate sample data for demonstration
    if (portfolioReturns.hasRealData && !portfolioReturns.isLoading) {
      return {
        annualizedReturn: portfolioReturns.annualizedReturn,
        annualizedVolatility: portfolioReturns.annualizedVolatility,
        sharpeRatio: portfolioReturns.sharpeRatio,
        sortinoRatio: portfolioReturns.sortinoRatio,
        dailyVolatility: portfolioReturns.annualizedVolatility / Math.sqrt(252),
        maxDrawdown: portfolioReturns.maxDrawdown,
        totalPnL: portfolioReturns.totalPnL,
        totalTrades: portfolioReturns.totalTrades,
        winRate: portfolioReturns.winRate,
        averageWin: portfolioReturns.averageWin,
        averageLoss: portfolioReturns.averageLoss,
        profitFactor: portfolioReturns.profitFactor,
        calmarRatio: portfolioReturns.calmarRatio,
        hasRealData: true
      };
    }
    
    // Fallback to sample data for demonstration when no trades exist
    return {
      annualizedReturn: 12.5,
      annualizedVolatility: 18.0,
      sharpeRatio: 0.42,
      sortinoRatio: 0.58,
      dailyVolatility: 1.13,
      maxDrawdown: 15.0,
      totalPnL: 0,
      totalTrades: 0,
      winRate: 0,
      averageWin: 0,
      averageLoss: 0,
      profitFactor: 0,
      calmarRatio: 0,
      hasRealData: false
    };
  }, [portfolioReturns]);

  // Run Monte Carlo simulation
  const runMonteCarloSimulation = () => {
    setIsRunningMC(true);
    
    setTimeout(() => {
      const annualReturn = portfolioMetrics.annualizedReturn / 100;
      const annualVol = portfolioMetrics.annualizedVolatility / 100;
      
      const allSimulations: number[][] = [];
      
      // Run simulations
      for (let sim = 0; sim < mcSimulations; sim++) {
        const path: number[] = [totalPortfolioValue];
        let value = totalPortfolioValue;
        
        for (let year = 1; year <= mcYears; year++) {
          // Geometric Brownian Motion
          const randomReturn = gaussianRandom(annualReturn - (annualVol * annualVol) / 2, annualVol);
          value = value * Math.exp(randomReturn);
          path.push(value);
        }
        
        allSimulations.push(path);
      }
      
      // Calculate percentiles for each year
      const results: MonteCarloResult[] = [];
      for (let year = 0; year <= mcYears; year++) {
        const yearValues = allSimulations.map(sim => sim[year]).sort((a, b) => a - b);
        results.push({
          year,
          p5: yearValues[Math.floor(mcSimulations * 0.05)],
          p10: yearValues[Math.floor(mcSimulations * 0.10)],
          median: yearValues[Math.floor(mcSimulations * 0.50)],
          p90: yearValues[Math.floor(mcSimulations * 0.90)],
          p95: yearValues[Math.floor(mcSimulations * 0.95)]
        });
      }
      
      setMcResults(results);
      setIsRunningMC(false);
      toast.success(`Monte Carlo simulation complete (${mcSimulations} scenarios)`);
    }, 100);
  };

  const rebalanceRecommendations = useMemo(() => {
    const recommendations: { symbol: string; action: 'buy' | 'sell' | 'hold'; shares: number; amount: number; currentPercent: number; targetPercent: number; difference: number }[] = [];
    
    targetAllocations.forEach(target => {
      const current = currentAllocations.find(c => c.symbol === target.symbol);
      const currentPercent = current?.currentPercent || 0;
      const difference = target.targetPercent - currentPercent;
      const targetValue = (target.targetPercent / 100) * totalPortfolioValue;
      const currentValue = current?.value || 0;
      const amountDiff = targetValue - currentValue;
      const price = stockPrices.find(s => s.symbol === target.symbol)?.price || 100;
      const sharesToTrade = Math.abs(Math.floor(amountDiff / price));
      
      if (Math.abs(difference) > 1) {
        recommendations.push({
          symbol: target.symbol,
          action: difference > 0 ? 'buy' : 'sell',
          shares: sharesToTrade,
          amount: Math.abs(amountDiff),
          currentPercent,
          targetPercent: target.targetPercent,
          difference
        });
      } else {
        recommendations.push({
          symbol: target.symbol,
          action: 'hold',
          shares: 0,
          amount: 0,
          currentPercent,
          targetPercent: target.targetPercent,
          difference
        });
      }
    });

    currentAllocations.forEach(current => {
      if (!targetAllocations.find(t => t.symbol === current.symbol)) {
        recommendations.push({
          symbol: current.symbol,
          action: 'sell',
          shares: current.shares,
          amount: current.value,
          currentPercent: current.currentPercent,
          targetPercent: 0,
          difference: -current.currentPercent
        });
      }
    });
    
    return recommendations.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
  }, [targetAllocations, currentAllocations, totalPortfolioValue, stockPrices]);

  const addTargetAllocation = () => {
    if (!newSymbol || !newTargetPercent) {
      toast.error('Please fill in symbol and target percentage');
      return;
    }
    
    const totalTarget = targetAllocations.reduce((sum, t) => sum + t.targetPercent, 0) + parseFloat(newTargetPercent);
    if (totalTarget > 100) {
      toast.error('Total allocation cannot exceed 100%');
      return;
    }
    
    setTargetAllocations([...targetAllocations, { symbol: newSymbol.toUpperCase(), targetPercent: parseFloat(newTargetPercent) }]);
    setNewSymbol('');
    setNewTargetPercent('');
    toast.success('Target allocation added');
  };

  const removeTargetAllocation = (symbol: string) => {
    setTargetAllocations(targetAllocations.filter(t => t.symbol !== symbol));
    toast.success('Target allocation removed');
  };

  const applyRebalance = async (recommendation: typeof rebalanceRecommendations[0]) => {
    toast.success(`Rebalance order for ${recommendation.symbol}: ${recommendation.action.toUpperCase()} ${recommendation.shares} shares`);
  };

  const applyAllRebalancing = () => {
    const actionable = rebalanceRecommendations.filter(r => r.action !== 'hold');
    if (actionable.length === 0) {
      toast.info('Portfolio is already balanced');
      return;
    }
    toast.success(`Executing ${actionable.length} rebalance trades`);
  };

  const pieData = [
    ...currentAllocations.map(a => ({ name: a.symbol, value: a.currentPercent })),
    { name: 'Cash', value: cashAllocation }
  ];

  const targetPieData = [
    ...targetAllocations.map(t => ({ name: t.symbol, value: t.targetPercent })),
    { name: 'Cash', value: Math.max(0, 100 - targetAllocations.reduce((sum, t) => sum + t.targetPercent, 0)) }
  ];

  const totalTargetPercent = targetAllocations.reduce((sum, t) => sum + t.targetPercent, 0);

  const getSharpeColor = (value: number) => {
    if (value >= 2) return 'text-chart-1';
    if (value >= 1) return 'text-primary';
    if (value >= 0) return 'text-warning';
    return 'text-destructive';
  };

  const getSharpeRating = (value: number) => {
    if (value >= 3) return 'Excellent';
    if (value >= 2) return 'Very Good';
    if (value >= 1) return 'Good';
    if (value >= 0) return 'Adequate';
    return 'Poor';
  };

  return (
    <PageLayout title="Portfolio Rebalancing">
      <Tabs defaultValue="rebalance" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="rebalance">Rebalancing</TabsTrigger>
          <TabsTrigger value="risk">Risk Metrics</TabsTrigger>
          <TabsTrigger value="montecarlo">Monte Carlo</TabsTrigger>
        </TabsList>

        <TabsContent value="rebalance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalPortfolioValue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Including ${cashBalance.toLocaleString()} cash</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Positions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeSymbols.length}</div>
                <p className="text-xs text-muted-foreground">Active stock positions</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Rebalance Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rebalanceRecommendations.filter(r => r.action !== 'hold').length}</div>
                <p className="text-xs text-muted-foreground">Recommended trades</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Current Allocation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Target Allocation
                </CardTitle>
                <CardDescription>Total allocated: {totalTargetPercent.toFixed(1)}% / 100%</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {targetAllocations.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={targetPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                        >
                          {targetPieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Set target allocations below
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Target Allocations
                  </CardTitle>
                  <CardDescription>Define your ideal portfolio allocation</CardDescription>
                </div>
                <Button variant="outline" onClick={importFromPortfolio} disabled={currentAllocations.length === 0}>
                  Import from Portfolio
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex-1 min-w-[120px]">
                  <Label>Symbol</Label>
                  <Input
                    placeholder="AAPL"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="w-32">
                  <Label>Target %</Label>
                  <Input
                    type="number"
                    placeholder="25"
                    value={newTargetPercent}
                    onChange={(e) => setNewTargetPercent(e.target.value)}
                    max={100 - totalTargetPercent}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={addTargetAllocation}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Allocation Progress</span>
                  <span className={totalTargetPercent > 100 ? 'text-destructive' : ''}>{totalTargetPercent.toFixed(1)}%</span>
                </div>
                <Progress value={Math.min(totalTargetPercent, 100)} className="h-2" />
              </div>

              {targetAllocations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {targetAllocations.map((target) => (
                    <Badge key={target.symbol} variant="secondary" className="flex items-center gap-2 py-1.5">
                      {target.symbol}: {target.targetPercent}%
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeTargetAllocation(target.symbol)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Rebalance Recommendations
                </CardTitle>
                <CardDescription>Actions needed to reach your target allocation</CardDescription>
              </div>
              <Button 
                onClick={applyAllRebalancing}
                disabled={rebalanceRecommendations.filter(r => r.action !== 'hold').length === 0}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Apply All
              </Button>
            </CardHeader>
            <CardContent>
              {rebalanceRecommendations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Set target allocations to see rebalance recommendations</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Current</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Difference</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Shares</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rebalanceRecommendations.map((rec) => (
                      <TableRow key={rec.symbol}>
                        <TableCell className="font-medium">{rec.symbol}</TableCell>
                        <TableCell>{rec.currentPercent.toFixed(1)}%</TableCell>
                        <TableCell>{rec.targetPercent.toFixed(1)}%</TableCell>
                        <TableCell className={rec.difference > 0 ? 'text-chart-1' : rec.difference < 0 ? 'text-destructive' : ''}>
                          {rec.difference > 0 ? '+' : ''}{rec.difference.toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          <Badge variant={rec.action === 'buy' ? 'default' : rec.action === 'sell' ? 'destructive' : 'secondary'}>
                            {rec.action === 'buy' && <TrendingUp className="h-3 w-3 mr-1" />}
                            {rec.action === 'sell' && <TrendingDown className="h-3 w-3 mr-1" />}
                            {rec.action.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{rec.shares}</TableCell>
                        <TableCell>${rec.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          {rec.action !== 'hold' && (
                            <Button size="sm" variant="outline" onClick={() => applyRebalance(rec)}>
                              Execute
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cash Balance</CardTitle>
              <CardDescription>Enter your available cash for rebalancing calculations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 items-end">
                <div className="flex-1 max-w-xs">
                  <Label>Cash Balance ($)</Label>
                  <Input
                    type="number"
                    value={cashBalance}
                    onChange={(e) => setCashBalance(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          {/* Data Source Indicator */}
          {!portfolioMetrics.hasRealData && (
            <Card className="border-warning/50 bg-warning/5">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-sm font-medium">Using Sample Data</p>
                  <p className="text-xs text-muted-foreground">
                    Add closed trades to your portfolio to see real Sharpe/Sortino ratios calculated from your actual trading history.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {portfolioMetrics.hasRealData && (
            <Card className="border-chart-1/50 bg-chart-1/5">
              <CardContent className="p-4 flex items-center gap-3">
                <History className="h-5 w-5 text-chart-1" />
                <div>
                  <p className="text-sm font-medium">Real Portfolio Data</p>
                  <p className="text-xs text-muted-foreground">
                    Metrics calculated from {portfolioMetrics.totalTrades} actual trades with ${portfolioMetrics.totalPnL.toLocaleString(undefined, { maximumFractionDigits: 2 })} total P&L.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Risk Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="glass-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-chart-1/20">
                    <TrendingUp className="h-5 w-5 text-chart-1" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
                    <p className={`text-xl font-bold ${getSharpeColor(portfolioMetrics.sharpeRatio)}`}>
                      {portfolioMetrics.sharpeRatio.toFixed(2)}
                    </p>
                    <Badge className={`text-xs mt-1 ${getSharpeColor(portfolioMetrics.sharpeRatio)} bg-transparent`}>
                      {getSharpeRating(portfolioMetrics.sharpeRatio)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/20">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sortino Ratio</p>
                    <p className="text-xl font-bold text-foreground">{portfolioMetrics.sortinoRatio.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Downside risk</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-warning/20">
                    <TrendingUp className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Annual Return</p>
                    <p className={`text-xl font-bold ${portfolioMetrics.annualizedReturn >= 0 ? 'text-chart-1' : 'text-destructive'}`}>
                      {portfolioMetrics.annualizedReturn >= 0 ? '+' : ''}{portfolioMetrics.annualizedReturn.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{portfolioMetrics.hasRealData ? 'From trades' : 'Expected'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-destructive/20">
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Volatility</p>
                    <p className="text-xl font-bold text-foreground">{portfolioMetrics.annualizedVolatility.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Annual std dev</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Trade Statistics when real data exists */}
          {portfolioMetrics.hasRealData && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="glass-card border-border/50">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
                  <p className={`text-xl font-bold ${portfolioMetrics.winRate >= 50 ? 'text-chart-1' : 'text-destructive'}`}>
                    {portfolioMetrics.winRate.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card border-border/50">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Avg Win</p>
                  <p className="text-xl font-bold text-chart-1">
                    ${portfolioMetrics.averageWin.toFixed(0)}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card border-border/50">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Avg Loss</p>
                  <p className="text-xl font-bold text-destructive">
                    ${portfolioMetrics.averageLoss.toFixed(0)}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card border-border/50">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Profit Factor</p>
                  <p className={`text-xl font-bold ${portfolioMetrics.profitFactor >= 1 ? 'text-chart-1' : 'text-destructive'}`}>
                    {isFinite(portfolioMetrics.profitFactor) ? portfolioMetrics.profitFactor.toFixed(2) : '∞'}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card border-border/50">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Max Drawdown</p>
                  <p className="text-xl font-bold text-destructive">
                    {portfolioMetrics.maxDrawdown.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Cumulative Returns Chart */}
          {portfolioReturns.hasRealData && portfolioReturns.dailyReturns.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Cumulative P&L from Trade History
                </CardTitle>
                <CardDescription>Your actual portfolio performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={portfolioReturns.dailyReturns}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        className="text-xs"
                      />
                      <YAxis 
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                        className="text-xs"
                      />
                      <Tooltip 
                        labelFormatter={(d) => new Date(d).toLocaleDateString()}
                        formatter={(v: number) => [`$${v.toFixed(2)}`, 'Cumulative P&L']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="cumulativePnl" 
                        stroke="hsl(var(--chart-1))" 
                        fill="hsl(var(--chart-1))" 
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Explanation Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Understanding Sharpe Ratio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-mono text-sm mb-2">Sharpe = (Portfolio Return - Risk-Free Rate) / Portfolio Volatility</p>
                  <p className="text-sm text-muted-foreground">
                    The Sharpe Ratio measures <strong>risk-adjusted return</strong>. It tells you how much extra return 
                    you're getting for each unit of risk (volatility) you're taking.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">What the numbers mean:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 rounded bg-chart-1/10 text-chart-1">≥ 3.0 = Excellent</div>
                    <div className="p-2 rounded bg-primary/10 text-primary">2.0-3.0 = Very Good</div>
                    <div className="p-2 rounded bg-warning/10 text-warning">1.0-2.0 = Good</div>
                    <div className="p-2 rounded bg-destructive/10 text-destructive">&lt; 1.0 = Needs work</div>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  <strong>Example:</strong> A Sharpe of 2.0 means for every 1% of volatility risk, you're earning 2% return above the risk-free rate.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Understanding Sortino Ratio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-mono text-sm mb-2">Sortino = (Portfolio Return - Risk-Free Rate) / Downside Deviation</p>
                  <p className="text-sm text-muted-foreground">
                    Like the Sharpe Ratio, but only considers <strong>downside volatility</strong> (negative returns). 
                    It doesn't penalize you for upside volatility.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Why it matters:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Investors typically worry about losses, not gains</li>
                    <li>• A high Sortino means you're getting good returns with minimal downside risk</li>
                    <li>• Compare Sortino to Sharpe: if Sortino is higher, most volatility is upside</li>
                  </ul>
                </div>

                <p className="text-sm text-muted-foreground">
                  <strong>Your portfolio:</strong> Sortino of {portfolioMetrics.sortinoRatio.toFixed(2)} vs Sharpe of {portfolioMetrics.sharpeRatio.toFixed(2)} 
                  {portfolioMetrics.sortinoRatio > portfolioMetrics.sharpeRatio ? ' — more upside volatility (good!)' : ' — some downside volatility'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Metrics Explanation */}
          <Card>
            <CardHeader>
              <CardTitle>Volatility & Return Relationship</CardTitle>
              <CardDescription>Understanding the risk-return tradeoff in your portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-muted/30 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Daily Volatility</p>
                  <p className="text-xl font-bold text-foreground">{portfolioMetrics.dailyVolatility.toFixed(2)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Typical daily swing: ±${(totalPortfolioValue * portfolioMetrics.dailyVolatility / 100).toFixed(0)}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Risk-Free Rate</p>
                  <p className="text-xl font-bold text-foreground">{(riskFreeRate * 100).toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">T-Bill benchmark rate</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Excess Return</p>
                  <p className="text-xl font-bold text-chart-1">{(portfolioMetrics.annualizedReturn - riskFreeRate * 100).toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Return above risk-free</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="montecarlo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dice5 className="h-5 w-5" />
                Monte Carlo Simulation
              </CardTitle>
              <CardDescription>
                Simulate thousands of possible portfolio outcomes to understand your range of potential returns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Time Horizon (Years)</Label>
                  <Input
                    type="number"
                    value={mcYears}
                    onChange={(e) => setMcYears(parseInt(e.target.value) || 10)}
                    min={1}
                    max={30}
                  />
                </div>
                <div>
                  <Label>Simulations</Label>
                  <Input
                    type="number"
                    value={mcSimulations}
                    onChange={(e) => setMcSimulations(parseInt(e.target.value) || 1000)}
                    min={100}
                    max={10000}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={runMonteCarloSimulation} disabled={isRunningMC} className="w-full">
                    {isRunningMC ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Dice5 className="h-4 w-4 mr-2" />}
                    Run Simulation
                  </Button>
                </div>
              </div>

              {mcResults.length > 0 && (
                <>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={mcResults}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                        <XAxis dataKey="year" label={{ value: 'Year', position: 'bottom', offset: -5 }} />
                        <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip 
                          formatter={(value: number) => `$${value.toLocaleString()}`}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="p95" stackId="1" stroke="none" fill="hsl(var(--chart-1) / 0.1)" name="95th Percentile" />
                        <Area type="monotone" dataKey="p90" stackId="2" stroke="none" fill="hsl(var(--chart-1) / 0.2)" name="90th Percentile" />
                        <Area type="monotone" dataKey="median" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.3)" strokeWidth={2} name="Median" />
                        <Area type="monotone" dataKey="p10" stroke="none" fill="hsl(var(--destructive) / 0.2)" name="10th Percentile" />
                        <Area type="monotone" dataKey="p5" stroke="none" fill="hsl(var(--destructive) / 0.1)" name="5th Percentile" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="p-4 rounded-xl bg-destructive/10 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Worst Case (5%)</p>
                      <p className="text-lg font-bold text-destructive">${mcResults[mcResults.length - 1]?.p5.toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-warning/10 text-center">
                      <p className="text-xs text-muted-foreground mb-1">10th Percentile</p>
                      <p className="text-lg font-bold text-warning">${mcResults[mcResults.length - 1]?.p10.toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-primary/10 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Median Outcome</p>
                      <p className="text-lg font-bold text-primary">${mcResults[mcResults.length - 1]?.median.toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-chart-1/10 text-center">
                      <p className="text-xs text-muted-foreground mb-1">90th Percentile</p>
                      <p className="text-lg font-bold text-chart-1">${mcResults[mcResults.length - 1]?.p90.toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-chart-1/20 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Best Case (95%)</p>
                      <p className="text-lg font-bold text-chart-1">${mcResults[mcResults.length - 1]?.p95.toLocaleString()}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Monte Carlo Explanation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Understanding Monte Carlo Simulation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>What is Monte Carlo Simulation?</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  Monte Carlo uses random sampling to model the probability of different outcomes. 
                  We run thousands of simulated "futures" using your portfolio's expected return and volatility 
                  to show the range of possible outcomes.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">How it works:</p>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Uses your portfolio's expected return ({portfolioMetrics.annualizedReturn.toFixed(1)}%)</li>
                    <li>Uses your portfolio's volatility ({portfolioMetrics.annualizedVolatility.toFixed(1)}%)</li>
                    <li>Simulates random market movements each year</li>
                    <li>Repeats {mcSimulations.toLocaleString()} times</li>
                    <li>Shows distribution of outcomes</li>
                  </ol>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">What the percentiles mean:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li><strong>5th percentile:</strong> 95% chance you'll do better than this</li>
                    <li><strong>Median:</strong> 50% chance above, 50% below</li>
                    <li><strong>95th percentile:</strong> Only 5% chance of doing this well</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-warning/10 rounded-lg">
                <p className="text-sm text-warning font-medium">⚠️ Important Limitations</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Monte Carlo assumes returns follow a normal distribution and that historical patterns continue. 
                  Real markets can have "black swan" events that models don't capture. Use this as one tool among many.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default PortfolioRebalancing;
