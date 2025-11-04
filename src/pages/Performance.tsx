import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

interface StockTrade {
  id: string;
  symbol: string;
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  entry_date: string;
  exit_date: string | null;
}

const Performance = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<StockTrade[]>([]);
  const [newTrade, setNewTrade] = useState({
    symbol: '',
    entry_price: '',
    exit_price: '',
    quantity: '',
    entry_date: new Date().toISOString().split('T')[0],
    exit_date: ''
  });

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
      toast.error('Failed to fetch trades');
      return;
    }
    setTrades(data || []);
  };

  const addTrade = async () => {
    if (!newTrade.symbol || !newTrade.entry_price || !newTrade.quantity || !newTrade.entry_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    const { error } = await supabase
      .from('stock_trades')
      .insert({
        user_id: user?.id,
        symbol: newTrade.symbol.toUpperCase(),
        entry_price: parseFloat(newTrade.entry_price),
        exit_price: newTrade.exit_price ? parseFloat(newTrade.exit_price) : null,
        quantity: parseInt(newTrade.quantity),
        entry_date: newTrade.entry_date,
        exit_date: newTrade.exit_date || null
      });

    if (error) {
      toast.error('Failed to add trade');
      return;
    }

    toast.success('Trade added successfully');
    setNewTrade({
      symbol: '',
      entry_price: '',
      exit_price: '',
      quantity: '',
      entry_date: new Date().toISOString().split('T')[0],
      exit_date: ''
    });
    fetchTrades();
  };

  const deleteTrade = async (id: string) => {
    const { error } = await supabase
      .from('stock_trades')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete trade');
      return;
    }

    toast.success('Trade deleted');
    fetchTrades();
  };

  // Calculate P&L metrics
  const calculateMetrics = () => {
    let totalPnL = 0;
    let totalInvested = 0;
    let openPositionsValue = 0;
    let closedPnL = 0;

    trades.forEach(trade => {
      const entryValue = trade.entry_price * trade.quantity;

      if (trade.exit_price) {
        // Closed trade
        const exitValue = trade.exit_price * trade.quantity;
        const pnl = exitValue - entryValue;
        closedPnL += pnl;
        totalPnL += pnl;
        totalInvested += entryValue;
      } else {
        // Open position - count entry value for now
        // Note: Real-time P&L calculation would require fetching current prices
        openPositionsValue += entryValue;
        totalInvested += entryValue;
      }
    });

    return {
      totalPnL,
      totalInvested,
      openPositionsValue,
      closedPnL,
      returnPct: totalInvested > 0 ? (closedPnL / totalInvested) * 100 : 0
    };
  };

  const metrics = calculateMetrics();

  // Generate performance chart data
  const generatePerformanceData = () => {
    if (trades.length === 0) return [];

    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
    );

    let cumPnL = 0;
    const chartData: any[] = [];

    sortedTrades.forEach(trade => {
      const entryValue = trade.entry_price * trade.quantity;
      
      if (trade.exit_price && trade.exit_date) {
        const exitValue = trade.exit_price * trade.quantity;
        const pnl = exitValue - entryValue;
        cumPnL += pnl;
        
        chartData.push({
          date: new Date(trade.exit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          pnl: parseFloat(cumPnL.toFixed(2))
        });
      }
    });

    return chartData;
  };

  const performanceData = generatePerformanceData();
  
  // Generate monthly P&L breakdown
  const generateMonthlyBreakdown = () => {
    const monthlyData: { [key: string]: { pnl: number, trades: number } } = {};

    trades.forEach(trade => {
      if (trade.exit_price && trade.exit_date) {
        const monthKey = new Date(trade.exit_date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        
        const entryValue = trade.entry_price * trade.quantity;
        const exitValue = trade.exit_price * trade.quantity;
        const pnl = exitValue - entryValue;

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { pnl: 0, trades: 0 };
        }
        monthlyData[monthKey].pnl += pnl;
        monthlyData[monthKey].trades += 1;
      }
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        pnl: parseFloat(data.pnl.toFixed(2)),
        trades: data.trades
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  };

  const monthlyBreakdown = generateMonthlyBreakdown();

  // Generate enhanced performance chart data
  const generateEnhancedPerformanceData = () => {
    if (trades.length === 0) return [];

    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
    );

    let cumPnL = 0;
    const chartData: any[] = [{ date: 'Start', pnl: 0 }];

    sortedTrades.forEach(trade => {
      if (trade.exit_price && trade.exit_date) {
        const entryValue = trade.entry_price * trade.quantity;
        const exitValue = trade.exit_price * trade.quantity;
        const pnl = exitValue - entryValue;
        cumPnL += pnl;
        
        chartData.push({
          date: new Date(trade.exit_date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: '2-digit'
          }),
          pnl: parseFloat(cumPnL.toFixed(2))
        });
      }
    });

    return chartData;
  };

  const enhancedPerformanceData = generateEnhancedPerformanceData();

  return (
    <PageLayout title="Performance">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* P&L Summary Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${metrics.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${metrics.totalPnL.toFixed(2)}
            </p>
            <p className={`text-sm ${metrics.returnPct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {metrics.returnPct >= 0 ? '+' : ''}{metrics.returnPct.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Closed P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${metrics.closedPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${metrics.closedPnL.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${metrics.openPositionsValue.toFixed(2)}</p>
          </CardContent>
        </Card>

        {/* Performance Chart */}
        {enhancedPerformanceData.length > 1 && (
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Cumulative P&L Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={enhancedPerformanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs"
                      />
                      <YAxis 
                        className="text-xs"
                      />
                      <Tooltip 
                        formatter={(value) => [`$${typeof value === 'number' ? value.toFixed(2) : value}`, 'P&L']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="pnl" 
                        name="Cumulative P&L" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3} 
                        dot={{ fill: 'hsl(var(--primary))', r: 4 }} 
                        activeDot={{ r: 6 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Monthly P&L Breakdown */}
        {monthlyBreakdown.length > 0 && (
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Monthly P&L Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyBreakdown} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="month" 
                        className="text-xs"
                      />
                      <YAxis 
                        className="text-xs"
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'pnl') return [`$${typeof value === 'number' ? value.toFixed(2) : value}`, 'Monthly P&L'];
                          return [value, 'Trades'];
                        }}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="pnl" 
                        name="Monthly P&L" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3} 
                        dot={{ fill: 'hsl(var(--primary))', r: 5 }} 
                        activeDot={{ r: 7 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Monthly breakdown table */}
                <div className="mt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>P&L</TableHead>
                        <TableHead># of Trades</TableHead>
                        <TableHead>Avg P&L per Trade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyBreakdown.map((month) => (
                        <TableRow key={month.month}>
                          <TableCell className="font-medium">{month.month}</TableCell>
                          <TableCell className={month.pnl >= 0 ? 'text-green-500 font-semibold' : 'text-red-500 font-semibold'}>
                            {month.pnl >= 0 ? '+' : ''}${month.pnl.toFixed(2)}
                          </TableCell>
                          <TableCell>{month.trades}</TableCell>
                          <TableCell className={month.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                            ${(month.pnl / month.trades).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold border-t-2">
                        <TableCell>Total</TableCell>
                        <TableCell className={metrics.closedPnL >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {metrics.closedPnL >= 0 ? '+' : ''}${metrics.closedPnL.toFixed(2)}
                        </TableCell>
                        <TableCell>{monthlyBreakdown.reduce((sum, m) => sum + m.trades, 0)}</TableCell>
                        <TableCell className={metrics.closedPnL >= 0 ? 'text-green-500' : 'text-red-500'}>
                          ${(metrics.closedPnL / monthlyBreakdown.reduce((sum, m) => sum + m.trades, 0)).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Trade Form */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Add Trade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <Label htmlFor="symbol">Symbol*</Label>
                  <Input
                    id="symbol"
                    placeholder="AAPL"
                    value={newTrade.symbol}
                    onChange={(e) => setNewTrade({ ...newTrade, symbol: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="entry_price">Entry Price*</Label>
                  <Input
                    id="entry_price"
                    type="number"
                    step="0.01"
                    placeholder="150.00"
                    value={newTrade.entry_price}
                    onChange={(e) => setNewTrade({ ...newTrade, entry_price: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="exit_price">Exit Price</Label>
                  <Input
                    id="exit_price"
                    type="number"
                    step="0.01"
                    placeholder="155.00"
                    value={newTrade.exit_price}
                    onChange={(e) => setNewTrade({ ...newTrade, exit_price: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity*</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="100"
                    value={newTrade.quantity}
                    onChange={(e) => setNewTrade({ ...newTrade, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="entry_date">Entry Date*</Label>
                  <Input
                    id="entry_date"
                    type="date"
                    value={newTrade.entry_date}
                    onChange={(e) => setNewTrade({ ...newTrade, entry_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="exit_date">Exit Date</Label>
                  <Input
                    id="exit_date"
                    type="date"
                    value={newTrade.exit_date}
                    onChange={(e) => setNewTrade({ ...newTrade, exit_date: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={addTrade} className="mt-4">Add Trade</Button>
            </CardContent>
          </Card>
        </div>

        {/* Trades Table */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Trade History</CardTitle>
            </CardHeader>
            <CardContent>
              {trades.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No trades recorded yet. Add your first trade above.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Entry Price</TableHead>
                      <TableHead>Exit Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Entry Date</TableHead>
                      <TableHead>Exit Date</TableHead>
                      <TableHead>P&L</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades.map((trade) => {
                      const pnl = trade.exit_price 
                        ? (trade.exit_price - trade.entry_price) * trade.quantity 
                        : 0;
                      return (
                        <TableRow key={trade.id}>
                          <TableCell className="font-medium">{trade.symbol}</TableCell>
                          <TableCell>${trade.entry_price.toFixed(2)}</TableCell>
                          <TableCell>{trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : '-'}</TableCell>
                          <TableCell>{trade.quantity}</TableCell>
                          <TableCell>{new Date(trade.entry_date).toLocaleDateString()}</TableCell>
                          <TableCell>{trade.exit_date ? new Date(trade.exit_date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell className={trade.exit_price ? (pnl >= 0 ? 'text-green-500' : 'text-red-500') : ''}>
                            {trade.exit_price ? `$${pnl.toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${trade.exit_price ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>
                              {trade.exit_price ? 'Closed' : 'Open'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTrade(trade.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default Performance;
