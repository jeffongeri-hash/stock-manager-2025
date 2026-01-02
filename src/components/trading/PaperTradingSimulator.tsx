import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Play, Pause, RotateCcw, TrendingUp, TrendingDown, DollarSign, 
  Target, AlertCircle, Clock, BarChart3, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { toast } from 'sonner';

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
}

interface PaperTradingSimulatorProps {
  symbol: string;
}

export const PaperTradingSimulator = ({ symbol }: PaperTradingSimulatorProps) => {
  const [balance, setBalance] = useState(100000);
  const [initialBalance] = useState(100000);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [currentPrice, setCurrentPrice] = useState(450);
  const [quantity, setQuantity] = useState(10);
  const [isSimulating, setIsSimulating] = useState(false);
  const [equityCurve, setEquityCurve] = useState<{ time: string; equity: number }[]>([]);
  const [strategy, setStrategy] = useState('manual');

  // Simulate price movement
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setCurrentPrice(prev => {
        const change = (Math.random() - 0.5) * 2;
        return Math.max(1, prev + change);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Update equity curve
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      const openPnL = trades
        .filter(t => t.status === 'open')
        .reduce((sum, t) => {
          const pnl = t.type === 'long' 
            ? (currentPrice - t.entryPrice) * t.quantity
            : (t.entryPrice - currentPrice) * t.quantity;
          return sum + pnl;
        }, 0);

      setEquityCurve(prev => [
        ...prev.slice(-100),
        {
          time: new Date().toLocaleTimeString(),
          equity: balance + openPnL
        }
      ]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isSimulating, balance, trades, currentPrice]);

  const openTrade = (type: 'long' | 'short') => {
    const cost = currentPrice * quantity;
    if (cost > balance) {
      toast.error('Insufficient balance');
      return;
    }

    const trade: Trade = {
      id: Date.now().toString(),
      symbol,
      type,
      entryPrice: currentPrice,
      quantity,
      entryTime: new Date(),
      status: 'open'
    };

    setTrades(prev => [trade, ...prev]);
    setBalance(prev => prev - cost);
    toast.success(`Opened ${type.toUpperCase()} position: ${quantity} shares at $${currentPrice.toFixed(2)}`);
  };

  const closeTrade = (tradeId: string) => {
    setTrades(prev => prev.map(t => {
      if (t.id === tradeId && t.status === 'open') {
        const pnl = t.type === 'long'
          ? (currentPrice - t.entryPrice) * t.quantity
          : (t.entryPrice - currentPrice) * t.quantity;
        
        setBalance(b => b + (t.entryPrice * t.quantity) + pnl);
        
        return {
          ...t,
          exitPrice: currentPrice,
          exitTime: new Date(),
          pnl,
          status: 'closed' as const
        };
      }
      return t;
    }));
    toast.success('Position closed');
  };

  const resetSimulation = () => {
    setBalance(initialBalance);
    setTrades([]);
    setEquityCurve([]);
    setIsSimulating(false);
    setCurrentPrice(450);
  };

  const openTrades = trades.filter(t => t.status === 'open');
  const closedTrades = trades.filter(t => t.status === 'closed');
  
  const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const unrealizedPnL = openTrades.reduce((sum, t) => {
    const pnl = t.type === 'long'
      ? (currentPrice - t.entryPrice) * t.quantity
      : (t.entryPrice - currentPrice) * t.quantity;
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
        </div>

        <div className="flex items-center gap-2">
          <Label>Strategy</Label>
          <Select value={strategy} onValueChange={setStrategy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual Trading</SelectItem>
              <SelectItem value="ma_cross">MA Crossover</SelectItem>
              <SelectItem value="rsi">RSI Strategy</SelectItem>
              <SelectItem value="breakout">Breakout</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label>Quantity</Label>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-24"
            min={1}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
              <span className="text-sm text-muted-foreground">Current Price</span>
            </div>
            <p className="text-2xl font-bold">${currentPrice.toFixed(2)}</p>
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
              <span className="text-sm text-muted-foreground">Unrealized P&L</span>
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
      </div>

      {/* Trading Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Trade {symbol}</CardTitle>
          <CardDescription>Execute paper trades to test your strategy</CardDescription>
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

      {/* Trades */}
      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">Open Positions ({openTrades.length})</TabsTrigger>
          <TabsTrigger value="closed">Trade History ({closedTrades.length})</TabsTrigger>
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
                      <TableHead>Entry Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unrealized P&L</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {openTrades.map(trade => {
                      const pnl = trade.type === 'long'
                        ? (currentPrice - trade.entryPrice) * trade.quantity
                        : (trade.entryPrice - currentPrice) * trade.quantity;
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
                      <TableHead>Quantity</TableHead>
                      <TableHead>P&L</TableHead>
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
                      </TableRow>
                    ))}
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
