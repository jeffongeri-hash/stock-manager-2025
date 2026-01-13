import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { Plus, Trash2, Calculator, Layers, TrendingUp, TrendingDown, Zap } from 'lucide-react';

interface OptionLeg {
  id: string;
  type: 'call' | 'put';
  action: 'buy' | 'sell';
  strike: number;
  premium: number;
  quantity: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

const STRATEGY_TEMPLATES = {
  'long-call': {
    name: 'Long Call',
    legs: [{ type: 'call', action: 'buy', strikeOffset: 0, premiumRatio: 1 }],
    description: 'Bullish strategy with unlimited upside, limited downside'
  },
  'long-put': {
    name: 'Long Put',
    legs: [{ type: 'put', action: 'buy', strikeOffset: 0, premiumRatio: 1 }],
    description: 'Bearish strategy profiting from downward moves'
  },
  'covered-call': {
    name: 'Covered Call',
    legs: [{ type: 'call', action: 'sell', strikeOffset: 5, premiumRatio: 0.8 }],
    description: 'Income strategy on existing stock position'
  },
  'bull-call-spread': {
    name: 'Bull Call Spread',
    legs: [
      { type: 'call', action: 'buy', strikeOffset: 0, premiumRatio: 1 },
      { type: 'call', action: 'sell', strikeOffset: 10, premiumRatio: 0.5 }
    ],
    description: 'Bullish debit spread with defined risk'
  },
  'bear-put-spread': {
    name: 'Bear Put Spread',
    legs: [
      { type: 'put', action: 'buy', strikeOffset: 0, premiumRatio: 1 },
      { type: 'put', action: 'sell', strikeOffset: -10, premiumRatio: 0.5 }
    ],
    description: 'Bearish debit spread with defined risk'
  },
  'straddle': {
    name: 'Long Straddle',
    legs: [
      { type: 'call', action: 'buy', strikeOffset: 0, premiumRatio: 1 },
      { type: 'put', action: 'buy', strikeOffset: 0, premiumRatio: 1 }
    ],
    description: 'Profits from large moves in either direction'
  },
  'strangle': {
    name: 'Long Strangle',
    legs: [
      { type: 'call', action: 'buy', strikeOffset: 5, premiumRatio: 0.7 },
      { type: 'put', action: 'buy', strikeOffset: -5, premiumRatio: 0.7 }
    ],
    description: 'Cheaper than straddle, needs larger move to profit'
  },
  'iron-butterfly': {
    name: 'Iron Butterfly',
    legs: [
      { type: 'put', action: 'buy', strikeOffset: -10, premiumRatio: 0.3 },
      { type: 'put', action: 'sell', strikeOffset: 0, premiumRatio: 1 },
      { type: 'call', action: 'sell', strikeOffset: 0, premiumRatio: 1 },
      { type: 'call', action: 'buy', strikeOffset: 10, premiumRatio: 0.3 }
    ],
    description: 'Max profit if stock expires at short strikes'
  },
  'jade-lizard': {
    name: 'Jade Lizard',
    legs: [
      { type: 'put', action: 'sell', strikeOffset: -5, premiumRatio: 0.8 },
      { type: 'call', action: 'sell', strikeOffset: 5, premiumRatio: 0.6 },
      { type: 'call', action: 'buy', strikeOffset: 10, premiumRatio: 0.3 }
    ],
    description: 'No upside risk, collect premium if stock rises'
  }
};

export const OptionsStrategyBuilder = () => {
  const [symbol, setSymbol] = useState('AAPL');
  const [stockPrice, setStockPrice] = useState(185);
  const [daysToExpiry, setDaysToExpiry] = useState(30);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [legs, setLegs] = useState<OptionLeg[]>([]);

  // Calculate Greeks (simplified Black-Scholes approximation)
  const calculateGreeks = (leg: Partial<OptionLeg>): Partial<OptionLeg> => {
    const moneyness = ((leg.strike || stockPrice) - stockPrice) / stockPrice;
    const timeRatio = daysToExpiry / 365;
    const iv = 0.25;
    
    let delta = leg.type === 'call' 
      ? Math.max(0.01, Math.min(0.99, 0.5 - moneyness * 2))
      : Math.max(-0.99, Math.min(-0.01, -0.5 - moneyness * 2));
    
    if (leg.action === 'sell') delta = -delta;
    delta *= (leg.quantity || 1);
    
    const gamma = Math.exp(-moneyness * moneyness * 10) * 0.05 * (leg.quantity || 1);
    const theta = -stockPrice * iv * Math.sqrt(timeRatio) * 0.01 * (leg.action === 'sell' ? 1 : -1) * (leg.quantity || 1);
    const vega = stockPrice * Math.sqrt(timeRatio) * 0.01 * (leg.action === 'sell' ? -1 : 1) * (leg.quantity || 1);
    
    return { delta, gamma, theta, vega };
  };

  const addLeg = () => {
    const newLeg: OptionLeg = {
      id: Date.now().toString(),
      type: 'call',
      action: 'buy',
      strike: stockPrice,
      premium: 5,
      quantity: 1,
      ...calculateGreeks({ type: 'call', action: 'buy', strike: stockPrice, quantity: 1 })
    } as OptionLeg;
    setLegs([...legs, newLeg]);
  };

  const removeLeg = (id: string) => {
    setLegs(legs.filter(l => l.id !== id));
  };

  const updateLeg = (id: string, field: keyof OptionLeg, value: any) => {
    setLegs(legs.map(leg => {
      if (leg.id !== id) return leg;
      const updated = { ...leg, [field]: value };
      const greeks = calculateGreeks(updated);
      return { ...updated, ...greeks };
    }));
  };

  const applyTemplate = (templateKey: string) => {
    const template = STRATEGY_TEMPLATES[templateKey as keyof typeof STRATEGY_TEMPLATES];
    if (!template) return;
    
    const newLegs = template.legs.map((legTemplate, i) => {
      const strike = stockPrice + legTemplate.strikeOffset;
      const leg: OptionLeg = {
        id: Date.now().toString() + i,
        type: legTemplate.type as 'call' | 'put',
        action: legTemplate.action as 'buy' | 'sell',
        strike,
        premium: 5 * legTemplate.premiumRatio,
        quantity: 1,
        delta: 0,
        gamma: 0,
        theta: 0,
        vega: 0
      };
      const greeks = calculateGreeks(leg);
      return { ...leg, ...greeks };
    });
    
    setLegs(newLegs);
    setSelectedTemplate(templateKey);
  };

  // Calculate strategy totals
  const strategyMetrics = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;
    let netDelta = 0;
    let netGamma = 0;
    let netTheta = 0;
    let netVega = 0;

    legs.forEach(leg => {
      const legValue = leg.premium * 100 * leg.quantity;
      if (leg.action === 'buy') {
        totalDebit += legValue;
      } else {
        totalCredit += legValue;
      }
      netDelta += leg.delta;
      netGamma += leg.gamma;
      netTheta += leg.theta;
      netVega += leg.vega;
    });

    return {
      netCost: totalDebit - totalCredit,
      maxRisk: totalDebit,
      netDelta: parseFloat(netDelta.toFixed(3)),
      netGamma: parseFloat(netGamma.toFixed(4)),
      netTheta: parseFloat(netTheta.toFixed(2)),
      netVega: parseFloat(netVega.toFixed(2)),
      isCredit: totalCredit > totalDebit
    };
  }, [legs]);

  // Generate P/L chart data
  const plData = useMemo(() => {
    const data = [];
    const range = stockPrice * 0.25;
    
    for (let price = stockPrice - range; price <= stockPrice + range; price += range / 50) {
      let pl = 0;
      
      legs.forEach(leg => {
        const intrinsicValue = leg.type === 'call'
          ? Math.max(0, price - leg.strike)
          : Math.max(0, leg.strike - price);
        
        const legPL = leg.action === 'buy'
          ? (intrinsicValue - leg.premium) * 100 * leg.quantity
          : (leg.premium - intrinsicValue) * 100 * leg.quantity;
        
        pl += legPL;
      });
      
      data.push({
        price: parseFloat(price.toFixed(2)),
        pl: parseFloat(pl.toFixed(2)),
        profit: pl > 0 ? pl : 0,
        loss: pl < 0 ? pl : 0
      });
    }
    
    return data;
  }, [legs, stockPrice]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Options Strategy Builder
          </CardTitle>
          <CardDescription>
            Build multi-leg strategies with real-time P/L visualization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Symbol</Label>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="AAPL"
              />
            </div>
            <div>
              <Label>Stock Price</Label>
              <Input
                type="number"
                value={stockPrice}
                onChange={(e) => setStockPrice(parseFloat(e.target.value) || 0)}
                step="0.01"
              />
            </div>
            <div>
              <Label>Days to Expiry</Label>
              <Input
                type="number"
                value={daysToExpiry}
                onChange={(e) => setDaysToExpiry(parseInt(e.target.value) || 30)}
              />
            </div>
            <div>
              <Label>Strategy Template</Label>
              <Select value={selectedTemplate} onValueChange={applyTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a strategy..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STRATEGY_TEMPLATES).map(([key, template]) => (
                    <SelectItem key={key} value={key}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedTemplate && (
            <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm">
                {STRATEGY_TEMPLATES[selectedTemplate as keyof typeof STRATEGY_TEMPLATES]?.description}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Strategy Legs</CardTitle>
            <Button onClick={addLeg} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Leg
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {legs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No legs added. Select a template or add legs manually.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Strike</TableHead>
                    <TableHead>Premium</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Delta</TableHead>
                    <TableHead>Theta</TableHead>
                    <TableHead>Cost/Credit</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {legs.map((leg) => (
                    <TableRow key={leg.id}>
                      <TableCell>
                        <Select 
                          value={leg.type} 
                          onValueChange={(v) => updateLeg(leg.id, 'type', v)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="call">Call</SelectItem>
                            <SelectItem value="put">Put</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={leg.action} 
                          onValueChange={(v) => updateLeg(leg.id, 'action', v)}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="buy">Buy</SelectItem>
                            <SelectItem value="sell">Sell</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={leg.strike}
                          onChange={(e) => updateLeg(leg.id, 'strike', parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={leg.premium}
                          onChange={(e) => updateLeg(leg.id, 'premium', parseFloat(e.target.value) || 0)}
                          className="w-20"
                          step="0.10"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={leg.quantity}
                          onChange={(e) => updateLeg(leg.id, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-16"
                          min={1}
                        />
                      </TableCell>
                      <TableCell className={leg.delta > 0 ? 'text-green-500' : 'text-red-500'}>
                        {leg.delta.toFixed(2)}
                      </TableCell>
                      <TableCell className={leg.theta > 0 ? 'text-green-500' : 'text-red-500'}>
                        ${leg.theta.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={leg.action === 'buy' ? 'destructive' : 'default'}>
                          {leg.action === 'buy' ? '-' : '+'}${(leg.premium * 100 * leg.quantity).toFixed(0)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => removeLeg(leg.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {legs.length > 0 && (
        <>
          {/* Strategy Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card className={strategyMetrics.isCredit ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Net Cost/Credit</p>
                <p className={`text-xl font-bold ${strategyMetrics.isCredit ? 'text-green-500' : 'text-red-500'}`}>
                  {strategyMetrics.isCredit ? '+' : '-'}${Math.abs(strategyMetrics.netCost).toFixed(0)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Net Delta</p>
                <p className={`text-xl font-bold ${strategyMetrics.netDelta > 0 ? 'text-green-500' : strategyMetrics.netDelta < 0 ? 'text-red-500' : ''}`}>
                  {strategyMetrics.netDelta > 0 ? '+' : ''}{strategyMetrics.netDelta}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Net Gamma</p>
                <p className="text-xl font-bold">{strategyMetrics.netGamma}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Net Theta</p>
                <p className={`text-xl font-bold ${strategyMetrics.netTheta > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ${strategyMetrics.netTheta}/day
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Net Vega</p>
                <p className="text-xl font-bold">${strategyMetrics.netVega}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Direction</p>
                <div className="flex items-center gap-2">
                  {strategyMetrics.netDelta > 0.1 ? (
                    <>
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <span className="font-bold text-green-500">Bullish</span>
                    </>
                  ) : strategyMetrics.netDelta < -0.1 ? (
                    <>
                      <TrendingDown className="h-5 w-5 text-red-500" />
                      <span className="font-bold text-red-500">Bearish</span>
                    </>
                  ) : (
                    <span className="font-bold">Neutral</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* P/L Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Profit/Loss at Expiration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={plData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="price" 
                      tickFormatter={(v) => `$${v}`}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tickFormatter={(v) => `$${v}`}
                      className="text-muted-foreground"
                    />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'P/L']}
                      labelFormatter={(label) => `Stock Price: $${label}`}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                    />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                    <ReferenceLine x={stockPrice} stroke="hsl(var(--primary))" label="Current" />
                    <Area 
                      type="monotone" 
                      dataKey="profit" 
                      fill="hsl(142, 76%, 36%)" 
                      fillOpacity={0.3}
                      stroke="none"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="loss" 
                      fill="hsl(0, 84%, 60%)" 
                      fillOpacity={0.3}
                      stroke="none"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="pl" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
