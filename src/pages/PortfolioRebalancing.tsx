import React, { useState, useEffect, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useStockData } from '@/hooks/useStockData';
import { toast } from 'sonner';
import { Scale, Target, TrendingUp, TrendingDown, RefreshCw, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

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

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(142, 76%, 36%)', 'hsl(221, 83%, 53%)', 'hsl(262, 83%, 58%)'];

const PortfolioRebalancing = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<StockTrade[]>([]);
  const [targetAllocations, setTargetAllocations] = useState<TargetAllocation[]>([]);
  const [newSymbol, setNewSymbol] = useState('');
  const [newTargetPercent, setNewTargetPercent] = useState('');
  const [cashBalance, setCashBalance] = useState(10000);

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
      
      if (Math.abs(difference) > 1) { // Only recommend if difference > 1%
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

    // Add symbols in portfolio but not in targets
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
    // This would integrate with a broker API in production
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

  return (
    <PageLayout title="Portfolio Rebalancing">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary Cards */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Current Allocation Chart */}
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

        {/* Target Allocation Chart */}
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

      {/* Set Target Allocations */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Target Allocations
          </CardTitle>
          <CardDescription>Define your ideal portfolio allocation</CardDescription>
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

      {/* Rebalance Recommendations */}
      <Card className="mt-6">
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
                    <TableCell className={rec.difference > 0 ? 'text-green-500' : rec.difference < 0 ? 'text-red-500' : ''}>
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

      {/* Cash Balance Setting */}
      <Card className="mt-6">
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
    </PageLayout>
  );
};

export default PortfolioRebalancing;
