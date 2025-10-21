import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const TradingToolkit = () => {
  const [positionData, setPositionData] = useState({
    accountSize: 10000,
    riskPercentage: 2,
    entryPrice: 150,
    stopLoss: 145,
    confidence: 7
  });

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
                <CardDescription>Calculate optimal position size based on risk parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
          <Card>
            <CardHeader>
              <CardTitle>Options Greeks Simulator</CardTitle>
              <CardDescription>Simulate option Greeks for different scenarios</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Greeks simulation coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exit-strategy">
          <Card>
            <CardHeader>
              <CardTitle>Exit Strategy Planner</CardTitle>
              <CardDescription>Plan your exit strategies before entering trades</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Exit strategy planner coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default TradingToolkit;
