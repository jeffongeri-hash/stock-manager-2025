import React, { useState, useEffect, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PlusCircle, Trash2, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useStockData } from '@/hooks/useStockData';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { PriceAlerts } from '@/components/portfolio/PriceAlerts';
interface StockTrade {
  id: string;
  symbol: string;
  entry_price: number;
  quantity: number;
  entry_date: string;
  exit_date?: string;
  exit_price?: number;
}

const Portfolio = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [stockTrades, setStockTrades] = useState<StockTrade[]>([]);
  const [currentTrade, setCurrentTrade] = useState({
    symbol: '',
    entry_price: '',
    quantity: '',
    entry_date: new Date().toISOString().split('T')[0],
  });

  // Get unique symbols from active positions (not exited)
  const activeSymbols = useMemo(() => {
    const symbols = stockTrades
      .filter(trade => !trade.exit_date)
      .map(trade => trade.symbol);
    return Array.from(new Set(symbols));
  }, [stockTrades]);

  // Fetch real-time stock prices
  const { stocks, refresh, isRefreshing } = useStockData(activeSymbols);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchTrades();
    }
  }, [user]);

  const fetchTrades = async () => {
    const { data, error } = await supabase
      .from('stock_trades')
      .select('*')
      .order('entry_date', { ascending: false });
    
    if (error) {
      toast.error('Failed to fetch stock trades');
    } else {
      setStockTrades(data || []);
    }
  };

  const addTrade = async () => {
    if (!currentTrade.symbol || !currentTrade.entry_price || !currentTrade.quantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    const entry_price = parseFloat(currentTrade.entry_price);
    const quantity = parseInt(currentTrade.quantity);

    const { error } = await supabase
      .from('stock_trades')
      .insert([{
        user_id: user?.id,
        symbol: currentTrade.symbol.toUpperCase(),
        entry_price,
        quantity,
        entry_date: currentTrade.entry_date,
      }]);

    if (error) {
      toast.error('Failed to add stock position');
    } else {
      toast.success('Stock position added successfully');
      setCurrentTrade({
        symbol: '',
        entry_price: '',
        quantity: '',
        entry_date: new Date().toISOString().split('T')[0],
      });
      fetchTrades();
    }
  };

  const deleteTrade = async (id: string) => {
    const { error } = await supabase
      .from('stock_trades')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete position');
    } else {
      toast.success('Position deleted');
      fetchTrades();
    }
  };

  const [exitPriceInput, setExitPriceInput] = useState<{ [key: string]: string }>({});

  const exitPosition = async (symbol: string) => {
    const exitPrice = parseFloat(exitPriceInput[symbol]);
    
    if (!exitPrice || exitPrice <= 0) {
      toast.error('Please enter a valid exit price');
      return;
    }

    // Find all active trades for this symbol
    const activeTrades = stockTrades.filter(t => t.symbol === symbol && !t.exit_date);
    
    if (activeTrades.length === 0) {
      toast.error('No active positions found');
      return;
    }

    // Update all active trades with exit info
    const exitDate = new Date().toISOString().split('T')[0];
    
    for (const trade of activeTrades) {
      const { error } = await supabase
        .from('stock_trades')
        .update({
          exit_price: exitPrice,
          exit_date: exitDate
        })
        .eq('id', trade.id);

      if (error) {
        toast.error(`Failed to exit position for ${trade.symbol}`);
        return;
      }
    }

    toast.success(`Exited all positions in ${symbol} at $${exitPrice}`);
    setExitPriceInput({ ...exitPriceInput, [symbol]: '' });
    fetchTrades();
  };

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    let totalCostBasis = 0;
    let totalCurrentValue = 0;
    let totalShares = 0;

    const positionsBySymbol = new Map<string, { shares: number; costBasis: number; currentPrice: number }>();

    stockTrades.forEach(trade => {
      if (!trade.exit_date) {
        const existing = positionsBySymbol.get(trade.symbol) || { shares: 0, costBasis: 0, currentPrice: 0 };
        existing.shares += trade.quantity;
        existing.costBasis += trade.entry_price * trade.quantity;
        positionsBySymbol.set(trade.symbol, existing);
      }
    });

    // Update with current prices
    stocks.forEach(stock => {
      const position = positionsBySymbol.get(stock.symbol);
      if (position && stock.price && stock.price > 0) {
        position.currentPrice = stock.price;
      }
    });

    // Calculate totals
    positionsBySymbol.forEach((position) => {
      totalShares += position.shares;
      totalCostBasis += position.costBasis;
      // Only calculate value if we have a real current price, not zero
      if (position.currentPrice > 0) {
        totalCurrentValue += position.currentPrice * position.shares;
      } else {
        // If no price data, show cost basis as current value (no P/L)
        totalCurrentValue += position.costBasis;
      }
    });

    return {
      totalCostBasis,
      totalCurrentValue,
      totalShares,
      totalPnL: totalCurrentValue - totalCostBasis,
      totalPnLPercent: totalCostBasis > 0 ? ((totalCurrentValue - totalCostBasis) / totalCostBasis) * 100 : 0,
      positions: Array.from(positionsBySymbol.entries()).map(([symbol, data]) => {
        const avgPrice = data.costBasis / data.shares;
        const currentPrice = data.currentPrice > 0 ? data.currentPrice : avgPrice;
        const currentValue = currentPrice * data.shares;
        const pnl = data.currentPrice > 0 ? (currentValue - data.costBasis) : 0;
        const pnlPercent = (data.currentPrice > 0 && data.costBasis > 0) ? (pnl / data.costBasis) * 100 : 0;
        
        return {
          symbol,
          shares: data.shares,
          costBasis: data.costBasis,
          currentValue,
          avgPrice,
          currentPrice,
          pnl,
          pnlPercent,
          hasPriceData: data.currentPrice > 0
        };
      })
    };
  }, [stockTrades, stocks]);

  // Generate chart data for portfolio performance by position
  const chartData = useMemo(() => {
    const data = portfolioMetrics.positions.map(pos => ({
      symbol: pos.symbol,
      'Cost Basis': pos.costBasis,
      'Current Value': pos.currentValue,
      'P&L': pos.pnl
    }));
    return data;
  }, [portfolioMetrics]);

  // Generate P/L trend over time based on closed trades
  const plTrendData = useMemo(() => {
    // Get closed trades sorted by exit date
    const closedTrades = stockTrades
      .filter(trade => trade.exit_date && trade.exit_price)
      .sort((a, b) => new Date(a.exit_date!).getTime() - new Date(b.exit_date!).getTime());

    if (closedTrades.length === 0) return [];

    let cumulativePnL = 0;
    const trendData: { date: string; pnl: number; cumulative: number; symbol: string }[] = [];

    closedTrades.forEach(trade => {
      const tradePnL = (trade.exit_price! - trade.entry_price) * trade.quantity;
      cumulativePnL += tradePnL;
      
      trendData.push({
        date: new Date(trade.exit_date!).toLocaleDateString(),
        pnl: tradePnL,
        cumulative: cumulativePnL,
        symbol: trade.symbol
      });
    });

    return trendData;
  }, [stockTrades]);

  // Create a map of current prices for alerts
  const currentPricesMap = useMemo(() => {
    const priceMap = new Map<string, number>();
    stocks.forEach(stock => {
      if (stock.price && stock.price > 0) {
        priceMap.set(stock.symbol.toUpperCase(), stock.price);
      }
    });
    return priceMap;
  }, [stocks]);

  if (loading) {
    return <PageLayout title="Portfolio"><div>Loading...</div></PageLayout>;
  }

  if (!user) {
    return null;
  }
  
  return (
    <PageLayout title="Stock Portfolio">
      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${portfolioMetrics.totalCurrentValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Current market value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Basis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${portfolioMetrics.totalCostBasis.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total invested</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${portfolioMetrics.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${portfolioMetrics.totalPnL.toFixed(2)}
            </div>
            <p className={`text-xs mt-1 ${portfolioMetrics.totalPnLPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {portfolioMetrics.totalPnLPercent >= 0 ? '+' : ''}{portfolioMetrics.totalPnLPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolioMetrics.totalShares}</div>
            <p className="text-xs text-muted-foreground mt-1">{portfolioMetrics.positions.length} positions</p>
          </CardContent>
        </Card>
      </div>

      {/* Price Alerts */}
      <PriceAlerts userId={user.id} currentPrices={currentPricesMap} />

      {/* P/L Trend Over Time Chart */}
      {plTrendData.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>P/L Trend Over Time</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Prices'}
            </Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={plTrendData}>
                <defs>
                  <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name === 'cumulative' ? 'Cumulative P/L' : 'Trade P/L']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend formatter={(value) => value === 'cumulative' ? 'Cumulative P/L' : 'Trade P/L'} />
                <Area 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1}
                  fill="url(#colorPnL)"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="pnl" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--chart-2))' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Performance Chart */}
      {chartData.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Position Performance</CardTitle>
            {plTrendData.length === 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh Prices'}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="symbol" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                />
                <Legend />
                <Bar dataKey="Cost Basis" fill="hsl(var(--muted))" />
                <Bar dataKey="Current Value" fill="hsl(var(--primary))" />
                <Bar dataKey="P&L" fill="hsl(var(--chart-2))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Add Position Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add Stock Position</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Symbol</Label>
              <Input
                value={currentTrade.symbol}
                onChange={(e) => setCurrentTrade({...currentTrade, symbol: e.target.value.toUpperCase()})}
                placeholder="AAPL"
              />
            </div>

            <div className="space-y-2">
              <Label>Entry Price</Label>
              <Input
                type="number"
                step="0.01"
                value={currentTrade.entry_price}
                onChange={(e) => setCurrentTrade({...currentTrade, entry_price: e.target.value})}
                placeholder="150.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Shares</Label>
              <Input
                type="number"
                value={currentTrade.quantity}
                onChange={(e) => setCurrentTrade({...currentTrade, quantity: e.target.value})}
                placeholder="100"
              />
            </div>

            <div className="space-y-2">
              <Label>Entry Date</Label>
              <Input
                type="date"
                value={currentTrade.entry_date}
                onChange={(e) => setCurrentTrade({...currentTrade, entry_date: e.target.value})}
              />
            </div>
          </div>

          <Button onClick={addTrade} className="mt-4">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Position
          </Button>
        </CardContent>
      </Card>

      {/* Active Positions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Active Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Symbol</th>
                  <th className="text-right py-2 px-4">Shares</th>
                  <th className="text-right py-2 px-4">Avg Price</th>
                  <th className="text-right py-2 px-4">Current Price</th>
                  <th className="text-right py-2 px-4">Cost Basis</th>
                  <th className="text-right py-2 px-4">Market Value</th>
                  <th className="text-right py-2 px-4">P&L</th>
                  <th className="text-right py-2 px-4">P&L %</th>
                  <th className="text-right py-2 px-4">Exit Price</th>
                  <th className="text-center py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {portfolioMetrics.positions.map((position) => (
                  <tr key={position.symbol} className="border-b">
                    <td className="py-3 px-4 font-medium">{position.symbol}</td>
                    <td className="py-3 px-4 text-right">{position.shares}</td>
                    <td className="py-3 px-4 text-right">${position.avgPrice.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">
                      ${position.currentPrice.toFixed(2)}
                      {!position.hasPriceData && <span className="text-xs text-muted-foreground ml-1">(est)</span>}
                    </td>
                    <td className="py-3 px-4 text-right">${position.costBasis.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">${position.currentValue.toFixed(2)}</td>
                    <td className={`py-3 px-4 text-right font-medium ${position.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {position.hasPriceData ? `$${position.pnl.toFixed(2)}` : '-'}
                    </td>
                    <td className={`py-3 px-4 text-right ${position.pnlPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {position.hasPriceData ? `${position.pnlPercent >= 0 ? '+' : ''}${position.pnlPercent.toFixed(2)}%` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Exit price"
                        value={exitPriceInput[position.symbol] || ''}
                        onChange={(e) => setExitPriceInput({ ...exitPriceInput, [position.symbol]: e.target.value })}
                        className="w-28"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exitPosition(position.symbol)}
                      >
                        Exit Position
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {portfolioMetrics.positions.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No active positions. Add your first stock position above.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* All Trades History */}
      <Card>
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Symbol</th>
                  <th className="text-right py-2 px-4">Shares</th>
                  <th className="text-right py-2 px-4">Entry Price</th>
                  <th className="text-right py-2 px-4">Total Cost</th>
                  <th className="text-left py-2 px-4">Entry Date</th>
                  <th className="text-center py-2 px-4">Status</th>
                  <th className="text-center py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stockTrades.map((trade) => (
                  <tr key={trade.id} className="border-b">
                    <td className="py-3 px-4 font-medium">{trade.symbol}</td>
                    <td className="py-3 px-4 text-right">{trade.quantity}</td>
                    <td className="py-3 px-4 text-right">${trade.entry_price.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">${(trade.entry_price * trade.quantity).toFixed(2)}</td>
                    <td className="py-3 px-4">{new Date(trade.entry_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${trade.exit_date ? 'bg-muted' : 'bg-primary/10 text-primary'}`}>
                        {trade.exit_date ? 'Closed' : 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTrade(trade.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stockTrades.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No trades yet. Add your first position above.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default Portfolio;
