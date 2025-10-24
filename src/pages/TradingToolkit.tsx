import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { useStockData } from '@/hooks/useStockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TradingToolkit = () => {
  const [symbol, setSymbol] = useState('AAPL');
  const { stocks, loading } = useStockData([symbol]);
  const currentPrice = stocks[0]?.price || 0;
  
  const [positionData, setPositionData] = useState({
    accountSize: 10000,
    riskPercentage: 2,
    entryPrice: 0,
    stopLoss: 0,
    confidence: 7
  });

  useEffect(() => {
    if (currentPrice) {
      setPositionData(prev => ({
        ...prev,
        entryPrice: currentPrice,
        stopLoss: currentPrice * 0.97
      }));
    }
  }, [currentPrice]);

  const [tradingRules, setTradingRules] = useState([
    { id: 1, rule: "Market trend aligns with trade direction", checked: false, weight: 10 },
    { id: 2, rule: "Volume is above average", checked: false, weight: 8 },
    { id: 3, rule: "Risk/Reward ratio is at least 1:2", checked: false, weight: 10 },
    { id: 4, rule: "Position size follows risk management rules", checked: false, weight: 10 },
    { id: 5, rule: "No major news/earnings in next 2 days", checked: false, weight: 7 },
    { id: 6, rule: "Technical indicators confirm entry", checked: false, weight: 8 },
    { id: 7, rule: "Emotionally calm and focused", checked: false, weight: 9 },
    { id: 8, rule: "Clear exit strategy defined", checked: false, weight: 10 }
  ]);

  const calculatePositionSize = () => {
    const riskAmount = (positionData.accountSize * positionData.riskPercentage) / 100;
    const riskPerShare = Math.abs(positionData.entryPrice - positionData.stopLoss);
    const baseShares = Math.floor(riskAmount / riskPerShare);
    const confidenceMultiplier = positionData.confidence / 10;
    const adjustedShares = Math.floor(baseShares * confidenceMultiplier);
    
    return {
      riskAmount,
      riskPerShare,
      baseShares,
      adjustedShares,
      totalCost: adjustedShares * positionData.entryPrice,
      maxLoss: adjustedShares * riskPerShare
    };
  };

  const calculateRulesScore = () => {
    const checkedRules = tradingRules.filter(rule => rule.checked);
    const totalWeight = tradingRules.reduce((sum, rule) => sum + rule.weight, 0);
    const checkedWeight = checkedRules.reduce((sum, rule) => sum + rule.weight, 0);
    return Math.round((checkedWeight / totalWeight) * 100);
  };

  const toggleRule = (id: number) => {
    setTradingRules(rules => rules.map(rule => 
      rule.id === id ? { ...rule, checked: !rule.checked } : rule
    ));
  };

  const positionSize = calculatePositionSize();
  const rulesScore = calculateRulesScore();

  return (
    <PageLayout title="Trading Toolkit">
      <Tabs defaultValue="position-sizing" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="position-sizing">Position Sizing</TabsTrigger>
          <TabsTrigger value="trading-rules">Trading Rules</TabsTrigger>
          <TabsTrigger value="greeks">Greeks Simulator</TabsTrigger>
          <TabsTrigger value="exit-strategy">Exit Strategy</TabsTrigger>
        </TabsList>

        <TabsContent value="position-sizing">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Position Size Calculator</CardTitle>
                <CardDescription>Calculate optimal position size based on live stock data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Stock Symbol</Label>
                  <Input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    placeholder="AAPL"
                  />
                  {currentPrice > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Current Price: ${currentPrice.toFixed(2)}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Account Size: ${positionData.accountSize.toLocaleString()}</Label>
                  <Input
                    type="number"
                    value={positionData.accountSize}
                    onChange={(e) => setPositionData({...positionData, accountSize: Number(e.target.value)})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Risk Percentage: {positionData.riskPercentage}%</Label>
                  <Slider
                    value={[positionData.riskPercentage]}
                    onValueChange={([value]) => setPositionData({...positionData, riskPercentage: value})}
                    max={10}
                    step={0.5}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Entry Price</Label>
                    <Input
                      type="number"
                      value={positionData.entryPrice}
                      onChange={(e) => setPositionData({...positionData, entryPrice: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stop Loss</Label>
                    <Input
                      type="number"
                      value={positionData.stopLoss}
                      onChange={(e) => setPositionData({...positionData, stopLoss: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Confidence Level: {positionData.confidence}/10</Label>
                  <Slider
                    value={[positionData.confidence]}
                    onValueChange={([value]) => setPositionData({...positionData, confidence: value})}
                    max={10}
                    step={1}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Risk Amount</p>
                    <p className="text-2xl font-bold">${positionSize.riskAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Risk Per Share</p>
                    <p className="text-2xl font-bold">${positionSize.riskPerShare.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Base Shares</p>
                    <p className="text-2xl font-bold">{positionSize.baseShares}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Adjusted Shares</p>
                    <p className="text-2xl font-bold text-primary">{positionSize.adjustedShares}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                    <p className="text-xl font-bold">${positionSize.totalCost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Max Loss</p>
                    <p className="text-xl font-bold text-destructive">${positionSize.maxLoss.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trading-rules">
          <Card>
            <CardHeader>
              <CardTitle>Pre-Trade Checklist</CardTitle>
              <CardDescription>Score: {rulesScore}%</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tradingRules.map((rule) => (
                  <div key={rule.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                    <Checkbox
                      checked={rule.checked}
                      onCheckedChange={() => toggleRule(rule.id)}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{rule.rule}</p>
                      <p className="text-sm text-muted-foreground">Weight: {rule.weight}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${rulesScore}%` }}
                  />
                </div>
                <p className="text-center mt-2 text-sm text-muted-foreground">
                  {rulesScore >= 80 ? 'Good to trade' : rulesScore >= 60 ? 'Proceed with caution' : 'Consider waiting'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="greeks">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Greeks Calculator</CardTitle>
                <CardDescription>Calculate option Greeks for your positions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Stock Symbol</Label>
                  <Input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    placeholder="AAPL"
                  />
                  {currentPrice > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Current Price: ${currentPrice.toFixed(2)}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Option Type</Label>
                  <Select defaultValue="call">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="put">Put</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Strike Price</Label>
                  <Input
                    type="number"
                    defaultValue={currentPrice || 150}
                    placeholder="150.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Days to Expiration</Label>
                  <Input
                    type="number"
                    defaultValue={30}
                    placeholder="30"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Implied Volatility (%)</Label>
                  <Input
                    type="number"
                    defaultValue={25}
                    placeholder="25"
                  />
                </div>

                <Button className="w-full">Calculate Greeks</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Greeks Results</CardTitle>
                <CardDescription>Option sensitivity metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Delta</p>
                    <p className="text-2xl font-bold">0.65</p>
                    <p className="text-xs text-muted-foreground mt-1">Price sensitivity</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Gamma</p>
                    <p className="text-2xl font-bold">0.03</p>
                    <p className="text-xs text-muted-foreground mt-1">Delta change rate</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Theta</p>
                    <p className="text-2xl font-bold text-red-500">-0.05</p>
                    <p className="text-xs text-muted-foreground mt-1">Time decay per day</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Vega</p>
                    <p className="text-2xl font-bold">0.12</p>
                    <p className="text-xs text-muted-foreground mt-1">IV sensitivity</p>
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">What These Mean:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• <strong>Delta:</strong> For every $1 move in stock, option moves $0.65</li>
                    <li>• <strong>Gamma:</strong> Delta changes by 0.03 for each $1 stock move</li>
                    <li>• <strong>Theta:</strong> Option loses $0.05 in value each day</li>
                    <li>• <strong>Vega:</strong> Option value changes $0.12 for each 1% IV change</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="exit-strategy">
          <Card>
            <CardHeader>
              <CardTitle>Exit Strategy Planner</CardTitle>
              <CardDescription>Define your exit criteria before entering the trade</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Profit Targets</h3>
                  
                  <div className="space-y-2">
                    <Label>Target 1 (Partial Exit %)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="number" placeholder="25" />
                      <Input type="number" placeholder="% gain" />
                    </div>
                    <p className="text-xs text-muted-foreground">Exit 25% of position at X% gain</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Target 2 (Partial Exit %)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="number" placeholder="50" />
                      <Input type="number" placeholder="% gain" />
                    </div>
                    <p className="text-xs text-muted-foreground">Exit 50% of remaining at X% gain</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Final Target (% Gain)</Label>
                    <Input type="number" placeholder="100" />
                    <p className="text-xs text-muted-foreground">Exit remaining position at X% gain</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Stop Loss & Risk Management</h3>
                  
                  <div className="space-y-2">
                    <Label>Stop Loss (% Loss)</Label>
                    <Input type="number" placeholder="20" />
                    <p className="text-xs text-muted-foreground">Exit entire position at -X% loss</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Time-Based Exit</Label>
                    <Input type="number" placeholder="30" />
                    <p className="text-xs text-muted-foreground">Days until forced exit</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Trailing Stop (%)</Label>
                    <Input type="number" placeholder="10" />
                    <p className="text-xs text-muted-foreground">Trail stop X% below high</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <h4 className="font-semibold mb-2">Exit Strategy Summary</h4>
                <ul className="text-sm space-y-1">
                  <li>• Exit 25% at 50% gain</li>
                  <li>• Exit 50% more at 100% gain</li>
                  <li>• Exit remaining at 200% gain or 30 days</li>
                  <li>• Stop loss: -20%</li>
                  <li>• Trailing stop: 10% from peak</li>
                </ul>
              </div>

              <Button className="w-full">Save Exit Strategy</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default TradingToolkit;
