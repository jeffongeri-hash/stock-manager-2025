import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { 
  Play, Pause, RotateCcw, TrendingUp, TrendingDown, DollarSign, 
  Target, Clock, BarChart3, ArrowUpRight, ArrowDownRight, Save, History, Bot, Settings2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Trade {
  id: string;
  symbol: string;
  type: 'long' | 'short';
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  entryTime: Date;
  exitTime?: Date;
  pnl?: number;
  status: 'open' | 'closed';
  reason?: string;
}

interface PriceData {
  price: number;
  sma5: number;
  sma20: number;
  rsi: number;
  high20: number;
  low20: number;
}

interface SavedSession {
  id: string;
  symbol: string;
  strategy: string;
  initial_balance: number;
  final_balance: number;
  total_trades: number;
  winning_trades: number;
  total_pnl: number;
  win_rate: number;
  created_at: string;
}

interface PaperTradingSimulatorProps {
  symbol: string;
}

// Strategy configurations
const STRATEGY_CONFIG = {
  manual: { name: 'Manual Trading', description: 'Execute trades manually' },
  ma_cross: { name: 'MA Crossover', description: 'Buy when SMA5 crosses above SMA20, sell when below' },
  rsi: { name: 'RSI Strategy', description: 'Buy when RSI < 30, sell when RSI > 70' },
  breakout: { name: 'Breakout', description: 'Buy on 20-period high, sell on 20-period low' },
};

export const PaperTradingSimulator = ({ symbol }: PaperTradingSimulatorProps) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(100000);
  const [initialBalance, setInitialBalance] = useState(100000);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [priceData, setPriceData] = useState<PriceData>({ price: 450, sma5: 450, sma20: 450, rsi: 50, high20: 450, low20: 450 });
  const [quantity, setQuantity] = useState(10);
  const [isSimulating, setIsSimulating] = useState(false);
  const [equityCurve, setEquityCurve] = useState<{ time: string; equity: number }[]>([]);
  const [strategy, setStrategy] = useState('manual');
  const [autoTrade, setAutoTrade] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [maxDrawdown, setMaxDrawdown] = useState(0);
  const [peakEquity, setPeakEquity] = useState(100000);

  // Calculate technical indicators
  const calculateIndicators = useCallback((prices: number[]): Partial<PriceData> => {
    if (prices.length < 20) return {};
    
    const last5 = prices.slice(-5);
    const last20 = prices.slice(-20);
    const last14 = prices.slice(-14);
    
    const sma5 = last5.reduce((a, b) => a + b, 0) / 5;
    const sma20 = last20.reduce((a, b) => a + b, 0) / 20;
    const high20 = Math.max(...last20);
    const low20 = Math.min(...last20);
    
    // RSI calculation
    const changes = last14.slice(1).map((p, i) => p - last14[i]);
    const gains = changes.filter(c => c > 0);
    const losses = changes.filter(c => c < 0).map(c => Math.abs(c));
    const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / 14 : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / 14 : 0;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    return { sma5, sma20, rsi, high20, low20 };
  }, []);

  // Execute strategy signals
  const executeStrategy = useCallback((data: PriceData, prevData: PriceData) => {
    if (!autoTrade || strategy === 'manual') return;
    
    const openTrades = trades.filter(t => t.status === 'open');
    const hasOpenPosition = openTrades.length > 0;
    const currentPosition = hasOpenPosition ? openTrades[0].type : null;
    
    let signal: 'buy' | 'sell' | null = null;
    let reason = '';
    
    switch (strategy) {
      case 'ma_cross':
        if (!hasOpenPosition && data.sma5 > data.sma20 && prevData.sma5 <= prevData.sma20) {
          signal = 'buy';
          reason = 'SMA5 crossed above SMA20';
        } else if (currentPosition === 'long' && data.sma5 < data.sma20 && prevData.sma5 >= prevData.sma20) {
          signal = 'sell';
          reason = 'SMA5 crossed below SMA20';
        } else if (!hasOpenPosition && data.sma5 < data.sma20 && prevData.sma5 >= prevData.sma20) {
          signal = 'sell';
          reason = 'SMA5 crossed below SMA20 (short)';
        } else if (currentPosition === 'short' && data.sma5 > data.sma20 && prevData.sma5 <= prevData.sma20) {
          signal = 'buy';
          reason = 'SMA5 crossed above SMA20 (cover)';
        }
        break;
        
      case 'rsi':
        if (!hasOpenPosition && data.rsi < 30) {
          signal = 'buy';
          reason = `RSI oversold at ${data.rsi.toFixed(1)}`;
        } else if (currentPosition === 'long' && data.rsi > 70) {
          signal = 'sell';
          reason = `RSI overbought at ${data.rsi.toFixed(1)}`;
        } else if (!hasOpenPosition && data.rsi > 70) {
          signal = 'sell';
          reason = `RSI overbought at ${data.rsi.toFixed(1)} (short)`;
        } else if (currentPosition === 'short' && data.rsi < 30) {
          signal = 'buy';
          reason = `RSI oversold at ${data.rsi.toFixed(1)} (cover)`;
        }
        break;
        
      case 'breakout':
        if (!hasOpenPosition && data.price >= data.high20 * 0.99) {
          signal = 'buy';
          reason = '20-period high breakout';
        } else if (currentPosition === 'long' && data.price <= data.low20 * 1.01) {
          signal = 'sell';
          reason = '20-period low breakdown';
        } else if (!hasOpenPosition && data.price <= data.low20 * 1.01) {
          signal = 'sell';
          reason = '20-period low breakdown (short)';
        } else if (currentPosition === 'short' && data.price >= data.high20 * 0.99) {
          signal = 'buy';
          reason = '20-period high breakout (cover)';
        }
        break;
    }
    
    if (signal === 'buy') {
      if (currentPosition === 'short') {
        // Close short first
        const shortTrade = openTrades.find(t => t.type === 'short');
        if (shortTrade) closeTradeInternal(shortTrade.id, reason);
      }
      if (!hasOpenPosition || currentPosition === 'short') {
        openTradeInternal('long', reason);
      }
    } else if (signal === 'sell') {
      if (currentPosition === 'long') {
        // Close long first
        const longTrade = openTrades.find(t => t.type === 'long');
        if (longTrade) closeTradeInternal(longTrade.id, reason);
      }
      if (!hasOpenPosition || currentPosition === 'long') {
        openTradeInternal('short', reason);
      }
    }
  }, [autoTrade, strategy, trades]);

  // Simulate price movement
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setPriceHistory(prev => {
        const lastPrice = prev.length > 0 ? prev[prev.length - 1] : 450;
        const change = (Math.random() - 0.5) * 3;
        const newPrice = Math.max(100, lastPrice + change);
        const newHistory = [...prev, newPrice].slice(-100);
        
        const indicators = calculateIndicators(newHistory);
        const prevIndicators = { ...priceData };
        
        setPriceData({
          price: newPrice,
          sma5: indicators.sma5 || newPrice,
          sma20: indicators.sma20 || newPrice,
          rsi: indicators.rsi || 50,
          high20: indicators.high20 || newPrice,
          low20: indicators.low20 || newPrice,
        });
        
        // Execute strategy after indicators are calculated
        if (newHistory.length >= 20) {
          setTimeout(() => executeStrategy(
            {
              price: newPrice,
              sma5: indicators.sma5 || newPrice,
              sma20: indicators.sma20 || newPrice,
              rsi: indicators.rsi || 50,
              high20: indicators.high20 || newPrice,
              low20: indicators.low20 || newPrice,
            },
            prevIndicators
          ), 0);
        }
        
        return newHistory;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSimulating, calculateIndicators, executeStrategy, priceData]);

  // Update equity curve and track drawdown
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      const openPnL = trades
        .filter(t => t.status === 'open')
        .reduce((sum, t) => {
          const pnl = t.type === 'long' 
            ? (priceData.price - t.entryPrice) * t.quantity
            : (t.entryPrice - priceData.price) * t.quantity;
          return sum + pnl;
        }, 0);

      const currentEquity = balance + openPnL;
      
      // Track peak and drawdown
      if (currentEquity > peakEquity) {
        setPeakEquity(currentEquity);
      }
      const drawdown = ((peakEquity - currentEquity) / peakEquity) * 100;
      if (drawdown > maxDrawdown) {
        setMaxDrawdown(drawdown);
      }

      setEquityCurve(prev => [
        ...prev.slice(-100),
        {
          time: new Date().toLocaleTimeString(),
          equity: currentEquity
        }
      ]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isSimulating, balance, trades, priceData.price, peakEquity, maxDrawdown]);

  const openTradeInternal = (type: 'long' | 'short', reason?: string) => {
    const cost = priceData.price * quantity;
    if (cost > balance) {
      toast.error('Insufficient balance');
      return;
    }

    const trade: Trade = {
      id: Date.now().toString(),
      symbol,
      type,
      entryPrice: priceData.price,
      quantity,
      entryTime: new Date(),
      status: 'open',
      reason
    };

    setTrades(prev => [trade, ...prev]);
    setBalance(prev => prev - cost);
    toast.success(`${autoTrade ? '🤖 Auto: ' : ''}Opened ${type.toUpperCase()} at $${priceData.price.toFixed(2)}${reason ? ` - ${reason}` : ''}`);
  };

  const closeTradeInternal = (tradeId: string, reason?: string) => {
    setTrades(prev => prev.map(t => {
      if (t.id === tradeId && t.status === 'open') {
        const pnl = t.type === 'long'
          ? (priceData.price - t.entryPrice) * t.quantity
          : (t.entryPrice - priceData.price) * t.quantity;
        
        setBalance(b => b + (t.entryPrice * t.quantity) + pnl);
        toast.success(`${autoTrade ? '🤖 Auto: ' : ''}Closed at $${priceData.price.toFixed(2)} | P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}${reason ? ` - ${reason}` : ''}`);
        
        return {
          ...t,
          exitPrice: priceData.price,
          exitTime: new Date(),
          pnl,
          status: 'closed' as const,
          reason: t.reason ? `${t.reason} → ${reason}` : reason
        };
      }
      return t;
    }));
  };

  const openTrade = (type: 'long' | 'short') => openTradeInternal(type);
  const closeTrade = (tradeId: string) => closeTradeInternal(tradeId);

  const resetSimulation = () => {
    setBalance(initialBalance);
    setTrades([]);
    setEquityCurve([]);
    setIsSimulating(false);
    setPriceHistory([]);
    setPriceData({ price: 450, sma5: 450, sma20: 450, rsi: 50, high20: 450, low20: 450 });
    setMaxDrawdown(0);
    setPeakEquity(initialBalance);
  };

  // Save session to database
  const saveSession = async () => {
    if (!user) {
      toast.error('Please log in to save sessions');
      return;
    }

    const closedTrades = trades.filter(t => t.status === 'closed');
    const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

    const { error } = await supabase.from('paper_trading_sessions').insert([{
      user_id: user.id,
      symbol,
      strategy: STRATEGY_CONFIG[strategy as keyof typeof STRATEGY_CONFIG]?.name || strategy,
      initial_balance: initialBalance,
      final_balance: balance,
      total_trades: closedTrades.length,
      winning_trades: winningTrades.length,
      total_pnl: totalPnL,
      win_rate: winRate,
      max_drawdown: maxDrawdown,
      session_data: JSON.parse(JSON.stringify({ trades, equityCurve: equityCurve.slice(-50) })),
      ended_at: new Date().toISOString()
    }]);

    if (error) {
      toast.error('Failed to save session');
      console.error(error);
    } else {
      toast.success('Session saved successfully');
      loadSavedSessions();
    }
  };

  // Load saved sessions
  const loadSavedSessions = async () => {
    if (!user) return;
    
    setLoadingSessions(true);
    const { data, error } = await supabase
      .from('paper_trading_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error(error);
    } else {
      setSavedSessions(data as SavedSession[]);
    }
    setLoadingSessions(false);
  };

  useEffect(() => {
    if (user) loadSavedSessions();
  }, [user]);

  const openTrades = trades.filter(t => t.status === 'open');
  const closedTrades = trades.filter(t => t.status === 'closed');
  
  const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const unrealizedPnL = openTrades.reduce((sum, t) => {
    const pnl = t.type === 'long'
      ? (priceData.price - t.entryPrice) * t.quantity
      : (t.entryPrice - priceData.price) * t.quantity;
    return sum + pnl;
  }, 0);
  
  const winRate = closedTrades.length > 0
    ? (closedTrades.filter(t => (t.pnl || 0) > 0).length / closedTrades.length) * 100
    : 0;

  const totalReturn = ((balance + unrealizedPnL - initialBalance) / initialBalance) * 100;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={isSimulating ? "destructive" : "default"}
            onClick={() => setIsSimulating(!isSimulating)}
          >
            {isSimulating ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isSimulating ? 'Pause' : 'Start'} Simulation
          </Button>
          <Button variant="outline" onClick={resetSimulation}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline" onClick={saveSession} disabled={trades.length === 0}>
            <Save className="h-4 w-4 mr-2" />
            Save Session
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Label>Strategy</Label>
          <Select value={strategy} onValueChange={setStrategy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STRATEGY_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="auto-trade">Auto-Trade</Label>
          <Switch
            id="auto-trade"
            checked={autoTrade}
            onCheckedChange={setAutoTrade}
            disabled={strategy === 'manual'}
          />
        </div>

        <div className="flex items-center gap-2">
          <Label>Qty</Label>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-20"
            min={1}
          />
        </div>
      </div>

      {/* Strategy Info */}
      {strategy !== 'manual' && (
        <Card className="bg-muted/50">
          <CardContent className="py-3">
            <div className="flex items-center gap-4">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="font-medium">{STRATEGY_CONFIG[strategy as keyof typeof STRATEGY_CONFIG]?.name}: </span>
                <span className="text-muted-foreground">{STRATEGY_CONFIG[strategy as keyof typeof STRATEGY_CONFIG]?.description}</span>
              </div>
              {autoTrade && <Badge variant="secondary" className="ml-auto"><Bot className="h-3 w-3 mr-1" /> Auto-Trading Active</Badge>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Balance</span>
            </div>
            <p className="text-2xl font-bold">${balance.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Price</span>
            </div>
            <p className="text-2xl font-bold">${priceData.price.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">RSI: {priceData.rsi.toFixed(1)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Realized P&L</span>
            </div>
            <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Unrealized</span>
            </div>
            <p className={`text-2xl font-bold ${unrealizedPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {unrealizedPnL >= 0 ? '+' : ''}${unrealizedPnL.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Win Rate</span>
            </div>
            <p className="text-2xl font-bold">{winRate.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Max DD</span>
            </div>
            <p className="text-2xl font-bold text-red-500">-{maxDrawdown.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Trading Actions */}
      {strategy === 'manual' && (
        <Card>
          <CardHeader>
            <CardTitle>Trade {symbol}</CardTitle>
            <CardDescription>Execute paper trades manually</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => openTrade('long')} 
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={!isSimulating}
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Buy / Long
              </Button>
              <Button 
                onClick={() => openTrade('short')} 
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={!isSimulating}
              >
                <ArrowDownRight className="h-4 w-4 mr-2" />
                Sell / Short
              </Button>
            </div>

            {!isSimulating && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                Start the simulation to begin trading
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Equity Curve */}
      {equityCurve.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Equity Curve</span>
              <Badge variant={totalReturn >= 0 ? 'default' : 'destructive'}>
                {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={equityCurve}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis 
                    domain={['dataMin - 1000', 'dataMax + 1000']}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(val: number) => [`$${val.toLocaleString()}`, 'Equity']}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                  />
                  <ReferenceLine y={initialBalance} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
                  <Line 
                    type="monotone" 
                    dataKey="equity" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trades & History */}
      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">Open ({openTrades.length})</TabsTrigger>
          <TabsTrigger value="closed">History ({closedTrades.length})</TabsTrigger>
          <TabsTrigger value="saved"><History className="h-4 w-4 mr-1" /> Saved Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="open">
          <Card>
            <CardContent className="pt-4">
              {openTrades.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No open positions</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Entry</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>P&L</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {openTrades.map(trade => {
                      const pnl = trade.type === 'long'
                        ? (priceData.price - trade.entryPrice) * trade.quantity
                        : (trade.entryPrice - priceData.price) * trade.quantity;
                      return (
                        <TableRow key={trade.id}>
                          <TableCell className="font-medium">{trade.symbol}</TableCell>
                          <TableCell>
                            <Badge variant={trade.type === 'long' ? 'default' : 'destructive'}>
                              {trade.type.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>${trade.entryPrice.toFixed(2)}</TableCell>
                          <TableCell>{trade.quantity}</TableCell>
                          <TableCell className={pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                            {trade.reason || '-'}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => closeTrade(trade.id)}>
                              Close
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
        </TabsContent>

        <TabsContent value="closed">
          <Card>
            <CardContent className="pt-4">
              {closedTrades.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No trade history</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Entry</TableHead>
                      <TableHead>Exit</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>P&L</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {closedTrades.map(trade => (
                      <TableRow key={trade.id}>
                        <TableCell className="font-medium">{trade.symbol}</TableCell>
                        <TableCell>
                          <Badge variant={trade.type === 'long' ? 'default' : 'destructive'}>
                            {trade.type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>${trade.entryPrice.toFixed(2)}</TableCell>
                        <TableCell>${trade.exitPrice?.toFixed(2)}</TableCell>
                        <TableCell>{trade.quantity}</TableCell>
                        <TableCell className={(trade.pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {(trade.pnl || 0) >= 0 ? '+' : ''}${trade.pnl?.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {trade.reason || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved">
          <Card>
            <CardContent className="pt-4">
              {!user ? (
                <p className="text-center text-muted-foreground py-8">Please log in to view saved sessions</p>
              ) : loadingSessions ? (
                <p className="text-center text-muted-foreground py-8">Loading...</p>
              ) : savedSessions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No saved sessions yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Strategy</TableHead>
                      <TableHead>Trades</TableHead>
                      <TableHead>Win Rate</TableHead>
                      <TableHead>P&L</TableHead>
                      <TableHead>Return</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {savedSessions.map(session => {
                      const returnPct = ((session.final_balance - session.initial_balance) / session.initial_balance) * 100;
                      return (
                        <TableRow key={session.id}>
                          <TableCell>{new Date(session.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{session.symbol}</TableCell>
                          <TableCell>{session.strategy}</TableCell>
                          <TableCell>{session.total_trades}</TableCell>
                          <TableCell>{session.win_rate?.toFixed(1)}%</TableCell>
                          <TableCell className={session.total_pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {session.total_pnl >= 0 ? '+' : ''}${session.total_pnl?.toFixed(2)}
                          </TableCell>
                          <TableCell className={returnPct >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};