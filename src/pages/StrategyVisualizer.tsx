import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface Leg {
  id: string;
  type: 'call' | 'put';
  action: 'buy' | 'sell';
  strike: number;
  premium: number;
  quantity: number;
}

const StrategyVisualizer = () => {
  const [legs, setLegs] = useState<Leg[]>([]);
  const [stockPrice, setStockPrice] = useState(100);
  const [newLeg, setNewLeg] = useState({
    type: 'call' as 'call' | 'put',
    action: 'buy' as 'buy' | 'sell',
    strike: 100,
    premium: 5,
    quantity: 1
  });

  const addLeg = () => {
    const leg: Leg = {
      id: Date.now().toString(),
      ...newLeg
    };
    setLegs([...legs, leg]);
  };

  const removeLeg = (id: string) => {
    setLegs(legs.filter(leg => leg.id !== id));
  };

  const calculatePnL = (price: number): number => {
    let totalPnL = 0;

    legs.forEach(leg => {
      const multiplier = leg.action === 'buy' ? 1 : -1;
      let legPnL = 0;

      if (leg.type === 'call') {
        // Call option value at expiration
        const intrinsicValue = Math.max(0, price - leg.strike);
        legPnL = (intrinsicValue - leg.premium) * multiplier * leg.quantity * 100;
      } else {
        // Put option value at expiration
        const intrinsicValue = Math.max(0, leg.strike - price);
        legPnL = (intrinsicValue - leg.premium) * multiplier * leg.quantity * 100;
      }

      totalPnL += legPnL;
    });

    return totalPnL;
  };

  const generateChartData = () => {
    const data = [];
    const minStrike = Math.min(...legs.map(l => l.strike), stockPrice) * 0.8;
    const maxStrike = Math.max(...legs.map(l => l.strike), stockPrice) * 1.2;
    const step = (maxStrike - minStrike) / 50;

    for (let price = minStrike; price <= maxStrike; price += step) {
      data.push({
        price: parseFloat(price.toFixed(2)),
        pnl: parseFloat(calculatePnL(price).toFixed(2))
      });
    }

    return data;
  };

  const chartData = legs.length > 0 ? generateChartData() : [];
  const maxProfit = chartData.length > 0 ? Math.max(...chartData.map(d => d.pnl)) : 0;
  const maxLoss = chartData.length > 0 ? Math.min(...chartData.map(d => d.pnl)) : 0;
  const breakevens = chartData.filter((d, i, arr) => 
    i > 0 && ((d.pnl >= 0 && arr[i-1].pnl < 0) || (d.pnl <= 0 && arr[i-1].pnl > 0))
  );

  return (
    <PageLayout title="Strategy Visualizer">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Option Leg</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Stock Price</Label>
                <Input
                  type="number"
                  value={stockPrice}
                  onChange={(e) => setStockPrice(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={newLeg.type} onValueChange={(value: 'call' | 'put') => setNewLeg({ ...newLeg, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="put">Put</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Action</Label>
                <Select value={newLeg.action} onValueChange={(value: 'buy' | 'sell') => setNewLeg({ ...newLeg, action: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Strike Price</Label>
                <Input
                  type="number"
                  value={newLeg.strike}
                  onChange={(e) => setNewLeg({ ...newLeg, strike: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Premium</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newLeg.premium}
                  onChange={(e) => setNewLeg({ ...newLeg, premium: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={newLeg.quantity}
                  onChange={(e) => setNewLeg({ ...newLeg, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <Button onClick={addLeg} className="w-full">Add Leg</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Legs</CardTitle>
            </CardHeader>
            <CardContent>
              {legs.length === 0 ? (
                <p className="text-muted-foreground text-sm">No legs added yet</p>
              ) : (
                <div className="space-y-2">
                  {legs.map((leg) => (
                    <div key={leg.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="text-sm">
                        <span className={leg.action === 'buy' ? 'text-green-500' : 'text-red-500'}>
                          {leg.action.toUpperCase()}
                        </span>
                        {' '}{leg.quantity}x {leg.type.toUpperCase()} ${leg.strike} @ ${leg.premium}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeLeg(leg.id)}>×</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>P&L Diagram</CardTitle>
              <CardDescription>Profit/Loss at expiration across different stock prices</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="h-96 flex items-center justify-center text-muted-foreground">
                  Add option legs to visualize the strategy
                </div>
              ) : (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="price" 
                        label={{ value: 'Stock Price', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        label={{ value: 'P&L ($)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value) => [`$${typeof value === 'number' ? value.toFixed(2) : value}`, 'P&L']}
                      />
                      <Legend />
                      <ReferenceLine y={0} stroke="gray" strokeDasharray="3 3" />
                      <ReferenceLine x={stockPrice} stroke="blue" strokeDasharray="3 3" label="Current" />
                      <Line 
                        type="monotone" 
                        dataKey="pnl" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        dot={false}
                        name="Strategy P&L"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {legs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Strategy Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Max Profit</p>
                    <p className="text-xl font-bold text-green-500">
                      {maxProfit === Infinity ? 'Unlimited' : `$${maxProfit.toFixed(2)}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Max Loss</p>
                    <p className="text-xl font-bold text-red-500">
                      {maxLoss === -Infinity ? 'Unlimited' : `$${maxLoss.toFixed(2)}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current P&L</p>
                    <p className={`text-xl font-bold ${calculatePnL(stockPrice) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      ${calculatePnL(stockPrice).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Breakeven(s)</p>
                    <p className="text-sm font-semibold">
                      {breakevens.length > 0 
                        ? breakevens.map(be => `$${be.price.toFixed(2)}`).join(', ')
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default StrategyVisualizer;