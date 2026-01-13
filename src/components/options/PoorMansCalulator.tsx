import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { Calculator, DollarSign, TrendingUp, Clock, Shield, Target, AlertTriangle, Zap } from 'lucide-react';

export const PoorMansCalculator = () => {
  const [symbol, setSymbol] = useState('AAPL');
  const [stockPrice, setStockPrice] = useState(185);
  
  // LEAPS (long call)
  const [leapsDelta, setLeapsDelta] = useState([0.75]);
  const [leapsStrike, setLeapsStrike] = useState(160);
  const [leapsPremium, setLeapsPremium] = useState(32);
  const [leapsDTE, setLeapsDTE] = useState(365);
  
  // Short call
  const [shortDelta, setShortDelta] = useState([0.25]);
  const [shortStrike, setShortStrike] = useState(195);
  const [shortPremium, setShortPremium] = useState(3.50);
  const [shortDTE, setShortDTE] = useState(30);

  // Auto-calculate strikes based on delta
  useMemo(() => {
    // Approximate strike based on delta for LEAPS
    const leapsMultiplier = 1 - (leapsDelta[0] - 0.5) * 0.4;
    setLeapsStrike(Math.round(stockPrice * leapsMultiplier / 5) * 5);
  }, [stockPrice, leapsDelta]);

  useMemo(() => {
    // Approximate strike based on delta for short call
    const shortMultiplier = 1 + (0.5 - shortDelta[0]) * 0.3;
    setShortStrike(Math.round(stockPrice * shortMultiplier / 5) * 5);
  }, [stockPrice, shortDelta]);

  // Calculate PMCC metrics
  const metrics = useMemo(() => {
    const leapsCost = leapsPremium * 100;
    const shortCredit = shortPremium * 100;
    const netDebit = leapsCost - shortCredit;
    
    // Intrinsic value of LEAPS
    const leapsIntrinsic = Math.max(0, stockPrice - leapsStrike);
    const leapsExtrinsic = leapsPremium - leapsIntrinsic;
    
    // Max profit if short call expires worthless
    const maxProfitPerCycle = shortCredit;
    
    // Annualized return from selling calls
    const cyclesPerYear = 365 / shortDTE;
    const annualIncomeEstimate = maxProfitPerCycle * cyclesPerYear;
    const annualizedROI = (annualIncomeEstimate / leapsCost) * 100;
    
    // Breakeven at short expiration
    const breakeven = leapsStrike + leapsPremium - shortPremium;
    
    // Max loss (LEAPS expires worthless)
    const maxLoss = netDebit;
    
    // Capital requirement comparison
    const stockCost = stockPrice * 100;
    const capitalSavings = stockCost - leapsCost;
    const capitalSavingsPercent = (capitalSavings / stockCost) * 100;
    
    // Risk if assigned on short call
    const assignmentRisk = shortStrike > leapsStrike;
    const spreadWidth = shortStrike - leapsStrike;
    const maxProfitIfAssigned = (spreadWidth * 100) - netDebit + shortCredit;

    return {
      leapsCost,
      shortCredit,
      netDebit,
      leapsIntrinsic,
      leapsExtrinsic,
      maxProfitPerCycle,
      cyclesPerYear: Math.floor(cyclesPerYear),
      annualIncomeEstimate,
      annualizedROI,
      breakeven,
      maxLoss,
      stockCost,
      capitalSavings,
      capitalSavingsPercent,
      assignmentRisk,
      spreadWidth,
      maxProfitIfAssigned
    };
  }, [stockPrice, leapsStrike, leapsPremium, shortStrike, shortPremium, shortDTE]);

  // Generate P/L chart data at short call expiration
  const plData = useMemo(() => {
    const data = [];
    const range = stockPrice * 0.30;
    
    for (let price = stockPrice - range; price <= stockPrice + range; price += range / 50) {
      // LEAPS value at short expiration (simplified - using intrinsic + some extrinsic)
      const leapsIntrinsic = Math.max(0, price - leapsStrike);
      const remainingDTE = leapsDTE - shortDTE;
      const extrinsicRatio = Math.sqrt(remainingDTE / leapsDTE);
      const leapsValue = leapsIntrinsic + (metrics.leapsExtrinsic * extrinsicRatio);
      
      // Short call value
      const shortValue = Math.max(0, price - shortStrike);
      
      // Net P/L
      const pl = ((leapsValue - leapsPremium) - (shortValue - shortPremium)) * 100;
      
      data.push({
        price: parseFloat(price.toFixed(2)),
        pl: parseFloat(pl.toFixed(2)),
        profit: pl > 0 ? pl : 0,
        loss: pl < 0 ? pl : 0
      });
    }
    
    return data;
  }, [stockPrice, leapsStrike, leapsPremium, shortStrike, shortPremium, leapsDTE, shortDTE, metrics]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Poor Man's Covered Call Calculator
          </CardTitle>
          <CardDescription>
            Use LEAPS instead of stock for covered calls - requires less capital with similar income potential
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Symbol</Label>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="AAPL"
              />
            </div>
            <div>
              <Label>Current Stock Price</Label>
              <Input
                type="number"
                value={stockPrice}
                onChange={(e) => setStockPrice(parseFloat(e.target.value) || 0)}
                step="0.01"
              />
            </div>
            <div className="flex items-end">
              <div className="p-3 bg-primary/10 rounded-lg w-full">
                <p className="text-xs text-muted-foreground">Stock Cost (100 shares)</p>
                <p className="text-xl font-bold">${metrics.stockCost.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEAPS Configuration */}
        <Card className="border-green-500/30">
          <CardHeader className="bg-green-500/5">
            <CardTitle className="flex items-center gap-2 text-green-500">
              <Clock className="h-5 w-5" />
              LEAPS (Long Call)
            </CardTitle>
            <CardDescription>
              Buy a deep ITM LEAPS call instead of 100 shares
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Target Delta: {leapsDelta[0].toFixed(2)}</Label>
              <Slider
                value={leapsDelta}
                onValueChange={setLeapsDelta}
                min={0.60}
                max={0.85}
                step={0.05}
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 0.70-0.80 for stock-like behavior
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Strike Price</Label>
                <Input
                  type="number"
                  value={leapsStrike}
                  onChange={(e) => setLeapsStrike(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Premium (per share)</Label>
                <Input
                  type="number"
                  value={leapsPremium}
                  onChange={(e) => setLeapsPremium(parseFloat(e.target.value) || 0)}
                  step="0.10"
                />
              </div>
            </div>

            <div>
              <Label>Days to Expiry</Label>
              <Input
                type="number"
                value={leapsDTE}
                onChange={(e) => setLeapsDTE(parseInt(e.target.value) || 365)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Recommended: 12+ months (365+ days)
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">LEAPS Cost:</span>
                <span className="font-bold text-red-500">-${metrics.leapsCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Intrinsic Value:</span>
                <span>${(metrics.leapsIntrinsic * 100).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Extrinsic Value:</span>
                <span>${(metrics.leapsExtrinsic * 100).toFixed(0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Short Call Configuration */}
        <Card className="border-blue-500/30">
          <CardHeader className="bg-blue-500/5">
            <CardTitle className="flex items-center gap-2 text-blue-500">
              <TrendingUp className="h-5 w-5" />
              Short Call (Sell Monthly)
            </CardTitle>
            <CardDescription>
              Sell OTM calls against your LEAPS for income
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Target Delta: {shortDelta[0].toFixed(2)}</Label>
              <Slider
                value={shortDelta}
                onValueChange={setShortDelta}
                min={0.15}
                max={0.35}
                step={0.05}
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 0.20-0.30 for ~70-80% win rate
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Strike Price</Label>
                <Input
                  type="number"
                  value={shortStrike}
                  onChange={(e) => setShortStrike(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Premium (per share)</Label>
                <Input
                  type="number"
                  value={shortPremium}
                  onChange={(e) => setShortPremium(parseFloat(e.target.value) || 0)}
                  step="0.10"
                />
              </div>
            </div>

            <div>
              <Label>Days to Expiry</Label>
              <Input
                type="number"
                value={shortDTE}
                onChange={(e) => setShortDTE(parseInt(e.target.value) || 30)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Recommended: 30-45 days for optimal theta decay
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Premium Collected:</span>
                <span className="font-bold text-green-500">+${metrics.shortCredit.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cycles Per Year:</span>
                <span>~{metrics.cyclesPerYear}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Est. Annual Income:</span>
                <span className="font-bold text-green-500">${metrics.annualIncomeEstimate.toFixed(0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-green-500">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">Capital Savings</span>
            </div>
            <p className="text-2xl font-bold mt-1">${metrics.capitalSavings.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">{metrics.capitalSavingsPercent.toFixed(0)}% less capital</p>
          </CardContent>
        </Card>

        <Card className="bg-primary/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Annualized ROI</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-primary">{metrics.annualizedROI.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">On LEAPS cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="text-sm font-medium">Breakeven</span>
            </div>
            <p className="text-2xl font-bold mt-1">${metrics.breakeven.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">At short expiry</p>
          </CardContent>
        </Card>

        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Max Loss</span>
            </div>
            <p className="text-2xl font-bold mt-1">${metrics.maxLoss.toFixed(0)}</p>
            <p className="text-sm text-muted-foreground">LEAPS expires worthless</p>
          </CardContent>
        </Card>
      </div>

      {/* P/L Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            P/L at Short Call Expiration
          </CardTitle>
          <CardDescription>
            Profit zone: Stock above ${metrics.breakeven.toFixed(2)} at short expiration
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
                <ReferenceLine x={shortStrike} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label="Short Strike" />
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

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            PMCC vs Traditional Covered Call
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Traditional CC (100 shares)</TableHead>
                <TableHead>Poor Man's CC (LEAPS)</TableHead>
                <TableHead>Advantage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Capital Required</TableCell>
                <TableCell>${metrics.stockCost.toLocaleString()}</TableCell>
                <TableCell className="text-green-500 font-bold">${metrics.leapsCost.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge className="bg-green-500/20 text-green-500">
                    Save ${metrics.capitalSavings.toLocaleString()}
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Max Loss</TableCell>
                <TableCell className="text-red-500">${metrics.stockCost.toLocaleString()}</TableCell>
                <TableCell>${metrics.leapsCost.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge className="bg-green-500/20 text-green-500">
                    Limited risk
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Monthly Income</TableCell>
                <TableCell>${metrics.shortCredit.toFixed(0)}</TableCell>
                <TableCell>${metrics.shortCredit.toFixed(0)}</TableCell>
                <TableCell>
                  <Badge variant="outline">Same</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">ROI on Capital</TableCell>
                <TableCell>{((metrics.shortCredit / metrics.stockCost) * 100).toFixed(2)}%</TableCell>
                <TableCell className="text-green-500 font-bold">
                  {((metrics.shortCredit / metrics.leapsCost) * 100).toFixed(2)}%
                </TableCell>
                <TableCell>
                  <Badge className="bg-green-500/20 text-green-500">
                    Higher ROI
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Dividends</TableCell>
                <TableCell className="text-green-500">Yes</TableCell>
                <TableCell className="text-red-500">No</TableCell>
                <TableCell>
                  <Badge className="bg-red-500/20 text-red-500">
                    CC advantage
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Time Decay Risk</TableCell>
                <TableCell className="text-green-500">None</TableCell>
                <TableCell className="text-yellow-500">LEAPS loses extrinsic</TableCell>
                <TableCell>
                  <Badge className="bg-yellow-500/20 text-yellow-500">
                    CC advantage
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-2">
            <h4 className="font-semibold">PMCC Best Practices:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• <strong>LEAPS Delta ≥ 0.70:</strong> Ensures stock-like price movement</li>
              <li>• <strong>Short Delta ≤ 0.30:</strong> 70%+ probability of keeping premium</li>
              <li>• <strong>Short strike &gt; LEAPS strike:</strong> Creates a debit spread if assigned</li>
              <li>• <strong>Roll LEAPS at 90-120 DTE:</strong> Avoid accelerated time decay</li>
              <li>• <strong>Roll short call at 50% profit:</strong> Lock in gains, reduce gamma risk</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
