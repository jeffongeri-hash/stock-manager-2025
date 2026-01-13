import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { Calculator, Shield, Target, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';

export const IronCondorBuilder = () => {
  const [symbol, setSymbol] = useState('SPY');
  const [stockPrice, setStockPrice] = useState(500);
  const [daysToExpiry, setDaysToExpiry] = useState(30);
  
  // Iron Condor legs
  const [putBuyStrike, setPutBuyStrike] = useState([485]);
  const [putSellStrike, setPutSellStrike] = useState([490]);
  const [callSellStrike, setCallSellStrike] = useState([510]);
  const [callBuyStrike, setCallBuyStrike] = useState([515]);
  
  // Premiums (simplified)
  const [putBuyPremium, setPutBuyPremium] = useState(1.50);
  const [putSellPremium, setPutSellPremium] = useState(2.50);
  const [callSellPremium, setCallSellPremium] = useState(2.50);
  const [callBuyPremium, setCallBuyPremium] = useState(1.50);
  const [contracts, setContracts] = useState(1);

  // Calculate Iron Condor metrics
  const metrics = useMemo(() => {
    const netCredit = (putSellPremium - putBuyPremium + callSellPremium - callBuyPremium) * 100 * contracts;
    const putSpreadWidth = putSellStrike[0] - putBuyStrike[0];
    const callSpreadWidth = callBuyStrike[0] - callSellStrike[0];
    const maxRisk = Math.max(putSpreadWidth, callSpreadWidth) * 100 * contracts - netCredit;
    const breakEvenLower = putSellStrike[0] - (netCredit / (100 * contracts));
    const breakEvenUpper = callSellStrike[0] + (netCredit / (100 * contracts));
    const profitZoneWidth = breakEvenUpper - breakEvenLower;
    const probProfit = Math.min(95, Math.max(30, (profitZoneWidth / stockPrice) * 500));
    
    return {
      netCredit,
      maxRisk,
      maxProfit: netCredit,
      breakEvenLower,
      breakEvenUpper,
      profitZoneWidth,
      probProfit,
      returnOnRisk: (netCredit / maxRisk) * 100,
      returnOnCapital: (netCredit / (maxRisk + netCredit)) * 100
    };
  }, [putBuyStrike, putSellStrike, callSellStrike, callBuyStrike, putBuyPremium, putSellPremium, callSellPremium, callBuyPremium, contracts, stockPrice]);

  // Generate P/L chart data
  const plData = useMemo(() => {
    const data = [];
    const range = stockPrice * 0.15;
    
    for (let price = stockPrice - range; price <= stockPrice + range; price += range / 50) {
      let pl = 0;
      
      // Put spread P/L
      if (price <= putBuyStrike[0]) {
        pl += (putSellStrike[0] - putBuyStrike[0]) * -100 * contracts;
      } else if (price <= putSellStrike[0]) {
        pl += (putSellStrike[0] - price) * -100 * contracts;
      }
      
      // Call spread P/L
      if (price >= callBuyStrike[0]) {
        pl += (callBuyStrike[0] - callSellStrike[0]) * -100 * contracts;
      } else if (price >= callSellStrike[0]) {
        pl += (callSellStrike[0] - price) * 100 * contracts;
      }
      
      // Add net credit received
      pl += metrics.netCredit;
      
      data.push({
        price: parseFloat(price.toFixed(2)),
        pl: parseFloat(pl.toFixed(2)),
        profit: pl > 0 ? pl : 0,
        loss: pl < 0 ? pl : 0
      });
    }
    
    return data;
  }, [stockPrice, putBuyStrike, putSellStrike, callSellStrike, callBuyStrike, metrics.netCredit, contracts]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Iron Condor Builder
          </CardTitle>
          <CardDescription>
            Build a defined-risk, range-bound strategy with automatic P/L visualization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Symbol</Label>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="SPY"
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
                onChange={(e) => setDaysToExpiry(parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Contracts</Label>
              <Input
                type="number"
                value={contracts}
                onChange={(e) => setContracts(parseInt(e.target.value) || 1)}
                min={1}
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Put Spread (Lower) */}
            <div className="space-y-4 p-4 bg-red-500/5 rounded-lg border border-red-500/20">
              <h3 className="font-semibold flex items-center gap-2 text-red-500">
                <TrendingDown className="h-4 w-4" />
                Put Spread (Lower Wing)
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label>Buy Put Strike: ${putBuyStrike[0]}</Label>
                  <Slider
                    value={putBuyStrike}
                    onValueChange={setPutBuyStrike}
                    min={stockPrice * 0.85}
                    max={putSellStrike[0] - 1}
                    step={1}
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-muted-foreground">Premium Paid:</span>
                    <Input
                      type="number"
                      value={putBuyPremium}
                      onChange={(e) => setPutBuyPremium(parseFloat(e.target.value) || 0)}
                      className="w-24 h-7 text-sm"
                      step="0.10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Sell Put Strike: ${putSellStrike[0]}</Label>
                  <Slider
                    value={putSellStrike}
                    onValueChange={setPutSellStrike}
                    min={putBuyStrike[0] + 1}
                    max={stockPrice * 0.98}
                    step={1}
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-muted-foreground">Premium Received:</span>
                    <Input
                      type="number"
                      value={putSellPremium}
                      onChange={(e) => setPutSellPremium(parseFloat(e.target.value) || 0)}
                      className="w-24 h-7 text-sm"
                      step="0.10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Call Spread (Upper) */}
            <div className="space-y-4 p-4 bg-green-500/5 rounded-lg border border-green-500/20">
              <h3 className="font-semibold flex items-center gap-2 text-green-500">
                <TrendingUp className="h-4 w-4" />
                Call Spread (Upper Wing)
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label>Sell Call Strike: ${callSellStrike[0]}</Label>
                  <Slider
                    value={callSellStrike}
                    onValueChange={setCallSellStrike}
                    min={stockPrice * 1.02}
                    max={callBuyStrike[0] - 1}
                    step={1}
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-muted-foreground">Premium Received:</span>
                    <Input
                      type="number"
                      value={callSellPremium}
                      onChange={(e) => setCallSellPremium(parseFloat(e.target.value) || 0)}
                      className="w-24 h-7 text-sm"
                      step="0.10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Buy Call Strike: ${callBuyStrike[0]}</Label>
                  <Slider
                    value={callBuyStrike}
                    onValueChange={setCallBuyStrike}
                    min={callSellStrike[0] + 1}
                    max={stockPrice * 1.15}
                    step={1}
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-muted-foreground">Premium Paid:</span>
                    <Input
                      type="number"
                      value={callBuyPremium}
                      onChange={(e) => setCallBuyPremium(parseFloat(e.target.value) || 0)}
                      className="w-24 h-7 text-sm"
                      step="0.10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Net Credit / Max Profit</p>
            <p className="text-2xl font-bold text-green-500">${metrics.netCredit.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Max Risk</p>
            <p className="text-2xl font-bold text-red-500">${metrics.maxRisk.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Breakeven Range</p>
            <p className="text-lg font-bold">
              ${metrics.breakEvenLower.toFixed(2)} - ${metrics.breakEvenUpper.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Return on Risk</p>
            <p className="text-2xl font-bold text-primary">{metrics.returnOnRisk.toFixed(1)}%</p>
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
          <CardDescription>
            Profit zone: ${metrics.breakEvenLower.toFixed(2)} to ${metrics.breakEvenUpper.toFixed(2)} 
            ({metrics.profitZoneWidth.toFixed(2)} points wide)
          </CardDescription>
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
                <ReferenceLine x={metrics.breakEvenLower} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
                <ReferenceLine x={metrics.breakEvenUpper} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
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

      {/* Strategy Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Iron Condor Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Entry Criteria</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Short strikes at <strong>Delta ≤0.16</strong> (~84% probability OTM)</li>
                <li>• <strong>30-45 DTE</strong> for optimal theta decay</li>
                <li>• Aim for <strong>1/3 width</strong> credit (33% max profit)</li>
                <li>• Enter when <strong>IV Rank &gt;30</strong> for better premiums</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Management Rules</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Take profit at <strong>50% of max profit</strong></li>
                <li>• Cut losses at <strong>2x credit received</strong></li>
                <li>• Roll untested side if threatened</li>
                <li>• Close at <strong>21 DTE</strong> to avoid gamma risk</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
