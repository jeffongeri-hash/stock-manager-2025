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
import { AlertCircle, CheckCircle2, XCircle, BarChart3, PieChart, TrendingUp, RefreshCw, BookOpen, Lightbulb, Bot } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import MonteCarloComparison from '@/components/trading/MonteCarloComparison';
import { PortfolioOptimizer } from '@/components/trading/PortfolioOptimizer';
import { TradeIdeasPanel } from '@/components/trading/TradeIdeasPanel';
import { TradeJournalPanel } from '@/components/trading/TradeJournalPanel';
import { AIAssistantPanel } from '@/components/trading/AIAssistantPanel';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

  // Greeks calculator state
  const [greeksData, setGreeksData] = useState({
    symbol: 'AAPL',
    optionType: 'call',
    strikePrice: 0,
    daysToExpiration: 30,
    impliedVolatility: 25
  });

  const [greeksResults, setGreeksResults] = useState({
    delta: 0,
    gamma: 0,
    theta: 0,
    vega: 0
  });

  // Exit strategy state
  const [exitStrategy, setExitStrategy] = useState({
    symbol: 'AAPL',
    entryPrice: 0,
    target1Percent: 25,
    target1Gain: 10,
    target2Percent: 50,
    target2Gain: 20,
    finalTargetGain: 50,
    stopLossPercent: 5,
    timeBasedExit: 30,
    trailingStopPercent: 10
  });

  // Expected move state
  const [expectedMoveData, setExpectedMoveData] = useState({
    daysToExpiry: 30,
    volatility: 0.25
  });
  const [optionsData, setOptionsData] = useState<any>(null);
  const [expectedMoveLoading, setExpectedMoveLoading] = useState(false);

  const fetchExpectedMove = async () => {
    if (!currentPrice) {
      toast.error('Please enter a valid symbol');
      return;
    }

    setExpectedMoveLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-options-data', {
        body: {
          symbol,
          stockPrice: currentPrice,
          strikePrice: currentPrice,
          daysToExpiry: expectedMoveData.daysToExpiry,
          volatility: expectedMoveData.volatility,
          optionType: 'call'
        }
      });

      if (error) throw error;
      setOptionsData(data);
    } catch (err) {
      console.error('Error fetching expected move:', err);
      toast.error('Failed to calculate expected move');
    } finally {
      setExpectedMoveLoading(false);
    }
  };

  useEffect(() => {
    if (currentPrice > 0) {
      setPositionData(prev => ({
        ...prev,
        entryPrice: currentPrice,
        stopLoss: Number((currentPrice * 0.97).toFixed(2))
      }));
      setGreeksData(prev => ({
        ...prev,
        strikePrice: currentPrice
      }));
      setExitStrategy(prev => ({
        ...prev,
        entryPrice: currentPrice
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
    
    if (riskPerShare === 0) {
      return {
        riskAmount: 0,
        riskPerShare: 0,
        baseShares: 0,
        adjustedShares: 0,
        totalCost: 0,
        maxLoss: 0
      };
    }
    
    const baseShares = Math.floor(riskAmount / riskPerShare);
    const confidenceMultiplier = positionData.confidence / 10;
    const adjustedShares = Math.floor(baseShares * confidenceMultiplier);
    
    return {
      riskAmount: Number(riskAmount.toFixed(2)),
      riskPerShare: Number(riskPerShare.toFixed(2)),
      baseShares,
      adjustedShares,
      totalCost: Number((adjustedShares * positionData.entryPrice).toFixed(2)),
      maxLoss: Number((adjustedShares * riskPerShare).toFixed(2))
    };
  };

  const calculateGreeks = () => {
    const S = currentPrice || greeksData.strikePrice;
    const K = greeksData.strikePrice;
    const T = greeksData.daysToExpiration / 365;
    const sigma = greeksData.impliedVolatility / 100;
    const r = 0.05;
    
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
    
    const delta = greeksData.optionType === 'call' 
      ? normCDF(d1) 
      : normCDF(d1) - 1;
    
    const gamma = Math.exp(-d1 * d1 / 2) / (S * sigma * Math.sqrt(2 * Math.PI * T));
    const theta = -(S * sigma * Math.exp(-d1 * d1 / 2)) / (2 * Math.sqrt(2 * Math.PI * T)) / 365;
    const vega = S * Math.sqrt(T) * Math.exp(-d1 * d1 / 2) / Math.sqrt(2 * Math.PI) / 100;
    
    setGreeksResults({
      delta: Number(delta.toFixed(4)),
      gamma: Number(gamma.toFixed(4)),
      theta: Number(theta.toFixed(4)),
      vega: Number(vega.toFixed(4))
    });
  };

  const normCDF = (x: number) => {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
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
        <TabsList className="flex flex-wrap h-auto gap-1 w-full">
          <TabsTrigger value="position-sizing">Position Sizing</TabsTrigger>
          <TabsTrigger value="expected-move" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span className="hidden lg:inline">Expected Move</span>
          </TabsTrigger>
          <TabsTrigger value="trading-rules">Trading Rules</TabsTrigger>
          <TabsTrigger value="greeks">Greeks</TabsTrigger>
          <TabsTrigger value="exit-strategy">Exit Strategy</TabsTrigger>
          <TabsTrigger value="monte-carlo" className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            <span className="hidden lg:inline">Monte Carlo</span>
          </TabsTrigger>
          <TabsTrigger value="optimizer" className="flex items-center gap-1">
            <PieChart className="h-3 w-3" />
            <span className="hidden lg:inline">Optimizer</span>
          </TabsTrigger>
          <TabsTrigger value="trade-ideas" className="flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            <span className="hidden lg:inline">Trade Ideas</span>
          </TabsTrigger>
          <TabsTrigger value="trade-journal" className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            <span className="hidden lg:inline">Journal</span>
          </TabsTrigger>
          <TabsTrigger value="ai-assistant" className="flex items-center gap-1">
            <Bot className="h-3 w-3" />
            <span className="hidden lg:inline">AI Assistant</span>
          </TabsTrigger>
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

        <TabsContent value="expected-move">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Expected Move Calculator
                </CardTitle>
                <CardDescription>Calculate expected price movement based on implied volatility</CardDescription>
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
                  <Label>Days to Expiration</Label>
                  <Input
                    type="number"
                    value={expectedMoveData.daysToExpiry}
                    onChange={(e) => setExpectedMoveData({...expectedMoveData, daysToExpiry: Number(e.target.value)})}
                    placeholder="30"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Implied Volatility (decimal)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={expectedMoveData.volatility}
                    onChange={(e) => setExpectedMoveData({...expectedMoveData, volatility: Number(e.target.value)})}
                    placeholder="0.25"
                  />
                  <p className="text-xs text-muted-foreground">
                    0.25 = 25% IV
                  </p>
                </div>

                <Button onClick={fetchExpectedMove} disabled={expectedMoveLoading} className="w-full">
                  {expectedMoveLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                  Calculate Expected Move
                </Button>
              </CardContent>
            </Card>

            {optionsData ? (
              <Card>
                <CardHeader>
                  <CardTitle>Expected Price Movement for {symbol}</CardTitle>
                  <CardDescription>One standard deviation move (68% probability)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-card rounded-lg border text-center">
                      <p className="text-sm text-muted-foreground mb-2">Current Price</p>
                      <p className="text-2xl font-bold">${currentPrice.toFixed(2)}</p>
                    </div>

                    <div className="p-4 bg-green-500/10 border-green-500/50 rounded-lg border text-center">
                      <p className="text-sm text-muted-foreground mb-2">Upper Bound</p>
                      <p className="text-2xl font-bold text-green-500">
                        ${optionsData.expectedMove?.upperBound}
                      </p>
                    </div>

                    <div className="p-4 bg-red-500/10 border-red-500/50 rounded-lg border text-center">
                      <p className="text-sm text-muted-foreground mb-2">Lower Bound</p>
                      <p className="text-2xl font-bold text-red-500">
                        ${optionsData.expectedMove?.lowerBound}
                      </p>
                    </div>

                    <div className="p-4 bg-primary/10 border-primary/50 rounded-lg border text-center">
                      <p className="text-sm text-muted-foreground mb-2">Expected Move</p>
                      <p className="text-2xl font-bold">±${optionsData.expectedMove?.amount}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        ±{optionsData.expectedMove?.percent}%
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">What This Means:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• There's a 68% probability the stock will stay between ${optionsData.expectedMove?.lowerBound} and ${optionsData.expectedMove?.upperBound}</li>
                      <li>• Based on {(expectedMoveData.volatility * 100).toFixed(0)}% implied volatility over {expectedMoveData.daysToExpiry} days</li>
                      <li>• Use this to size option positions and set strike prices</li>
                      <li>• Higher volatility = larger expected moves</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Suggested Trading Strategies</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-card rounded-lg border">
                        <h5 className="font-medium text-green-600 mb-1">Bullish</h5>
                        <p className="text-sm text-muted-foreground">
                          Sell put spreads below ${optionsData.expectedMove?.lowerBound}
                        </p>
                      </div>
                      <div className="p-3 bg-card rounded-lg border">
                        <h5 className="font-medium text-red-600 mb-1">Bearish</h5>
                        <p className="text-sm text-muted-foreground">
                          Sell call spreads above ${optionsData.expectedMove?.upperBound}
                        </p>
                      </div>
                      <div className="p-3 bg-card rounded-lg border">
                        <h5 className="font-medium text-blue-600 mb-1">Neutral</h5>
                        <p className="text-sm text-muted-foreground">
                          Iron condor with short strikes outside expected move
                        </p>
                      </div>
                      <div className="p-3 bg-card rounded-lg border">
                        <h5 className="font-medium text-purple-600 mb-1">High Volatility</h5>
                        <p className="text-sm text-muted-foreground">
                          Straddles if expecting move beyond ±{optionsData.expectedMove?.percent}%
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-full min-h-[300px]">
                  <p className="text-muted-foreground text-center">
                    Enter a symbol and calculate to see expected move data
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="trading-rules">
          <Card>
            <CardHeader>
              <CardTitle>Pre-Trade Checklist</CardTitle>
              <CardDescription>Ensure all criteria are met before entering a trade</CardDescription>
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
                      <p className="text-sm text-muted-foreground">Weight: {rule.weight}/10</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Trade Readiness Score:</span>
                    <span className="text-2xl font-bold">{rulesScore}%</span>
                  </div>
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        rulesScore >= 80 ? 'bg-green-500' : rulesScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${rulesScore}%` }}
                    />
                  </div>
                </div>

                {rulesScore >= 80 && (
                  <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      <strong>Good to Trade!</strong> You've met {rulesScore}% of the criteria. Your setup looks solid with proper risk management and market alignment. You're ready to execute this trade.
                    </AlertDescription>
                  </Alert>
                )}

                {rulesScore >= 60 && rulesScore < 80 && (
                  <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                      <strong>Proceed with Caution.</strong> You've met {rulesScore}% of the criteria. Consider reviewing the unchecked items. While this trade might work, you could improve your odds by addressing missing criteria.
                    </AlertDescription>
                  </Alert>
                )}

                {rulesScore < 60 && (
                  <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      <strong>Consider Waiting.</strong> Only {rulesScore}% of criteria are met. This trade has significant gaps in your preparation. Missing key criteria like risk management or technical confirmation could lead to losses. Wait for a better setup.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="greeks">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Greeks Calculator</CardTitle>
                <CardDescription>Calculate real-time option Greeks for your positions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Stock Symbol</Label>
                  <Input
                    type="text"
                    value={greeksData.symbol}
                    onChange={(e) => setGreeksData({...greeksData, symbol: e.target.value.toUpperCase()})}
                    onBlur={() => setSymbol(greeksData.symbol)}
                    placeholder="AAPL"
                  />
                  {currentPrice > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Current Stock Price: ${currentPrice.toFixed(2)}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Option Type</Label>
                  <Select 
                    value={greeksData.optionType}
                    onValueChange={(value) => setGreeksData({...greeksData, optionType: value})}
                  >
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
                    value={greeksData.strikePrice}
                    onChange={(e) => setGreeksData({...greeksData, strikePrice: Number(e.target.value)})}
                    placeholder="150.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Days to Expiration</Label>
                  <Input
                    type="number"
                    value={greeksData.daysToExpiration}
                    onChange={(e) => setGreeksData({...greeksData, daysToExpiration: Number(e.target.value)})}
                    placeholder="30"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Implied Volatility (%)</Label>
                  <Input
                    type="number"
                    value={greeksData.impliedVolatility}
                    onChange={(e) => setGreeksData({...greeksData, impliedVolatility: Number(e.target.value)})}
                    placeholder="25"
                  />
                </div>

                <Button className="w-full" onClick={calculateGreeks}>Calculate Greeks</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Greeks Results</CardTitle>
                <CardDescription>Live option sensitivity metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Delta</p>
                    <p className="text-2xl font-bold">{greeksResults.delta.toFixed(4)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Price sensitivity</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Gamma</p>
                    <p className="text-2xl font-bold">{greeksResults.gamma.toFixed(4)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Delta change rate</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Theta</p>
                    <p className="text-2xl font-bold text-red-500">{greeksResults.theta.toFixed(4)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Time decay per day</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Vega</p>
                    <p className="text-2xl font-bold">{greeksResults.vega.toFixed(4)}</p>
                    <p className="text-xs text-muted-foreground mt-1">IV sensitivity</p>
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">What These Mean:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• <strong>Delta ({greeksResults.delta.toFixed(2)}):</strong> For every $1 move in stock, option moves ${Math.abs(greeksResults.delta).toFixed(2)}</li>
                    <li>• <strong>Gamma ({greeksResults.gamma.toFixed(4)}):</strong> Delta changes by {greeksResults.gamma.toFixed(4)} for each $1 stock move</li>
                    <li>• <strong>Theta ({greeksResults.theta.toFixed(2)}):</strong> Option loses ${Math.abs(greeksResults.theta).toFixed(2)} in value each day</li>
                    <li>• <strong>Vega ({greeksResults.vega.toFixed(2)}):</strong> Option value changes ${greeksResults.vega.toFixed(2)} for each 1% IV change</li>
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
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Stock Symbol</Label>
                  <Input
                    type="text"
                    value={exitStrategy.symbol}
                    onChange={(e) => setExitStrategy({...exitStrategy, symbol: e.target.value.toUpperCase()})}
                    onBlur={() => setSymbol(exitStrategy.symbol)}
                    placeholder="AAPL"
                  />
                  {currentPrice > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Current Price: ${currentPrice.toFixed(2)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Entry Price</Label>
                  <Input
                    type="number"
                    value={exitStrategy.entryPrice}
                    onChange={(e) => setExitStrategy({...exitStrategy, entryPrice: Number(e.target.value)})}
                    placeholder="150.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Profit Targets</h3>
                  
                  <div className="space-y-2">
                    <Label>Target 1 (Exit % at % Gain)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input 
                        type="number" 
                        placeholder="25"
                        value={exitStrategy.target1Percent}
                        onChange={(e) => setExitStrategy({...exitStrategy, target1Percent: Number(e.target.value)})}
                      />
                      <Input 
                        type="number" 
                        placeholder="10"
                        value={exitStrategy.target1Gain}
                        onChange={(e) => setExitStrategy({...exitStrategy, target1Gain: Number(e.target.value)})}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Price: ${(exitStrategy.entryPrice * (1 + exitStrategy.target1Gain / 100)).toFixed(2)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Target 2 (Exit % at % Gain)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input 
                        type="number" 
                        placeholder="50"
                        value={exitStrategy.target2Percent}
                        onChange={(e) => setExitStrategy({...exitStrategy, target2Percent: Number(e.target.value)})}
                      />
                      <Input 
                        type="number" 
                        placeholder="20"
                        value={exitStrategy.target2Gain}
                        onChange={(e) => setExitStrategy({...exitStrategy, target2Gain: Number(e.target.value)})}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Price: ${(exitStrategy.entryPrice * (1 + exitStrategy.target2Gain / 100)).toFixed(2)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Final Target (% Gain)</Label>
                    <Input 
                      type="number" 
                      placeholder="50"
                      value={exitStrategy.finalTargetGain}
                      onChange={(e) => setExitStrategy({...exitStrategy, finalTargetGain: Number(e.target.value)})}
                    />
                    <p className="text-xs text-muted-foreground">
                      Price: ${(exitStrategy.entryPrice * (1 + exitStrategy.finalTargetGain / 100)).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Stop Loss & Risk Management</h3>
                  
                  <div className="space-y-2">
                    <Label>Stop Loss (% Loss)</Label>
                    <Input 
                      type="number" 
                      placeholder="5"
                      value={exitStrategy.stopLossPercent}
                      onChange={(e) => setExitStrategy({...exitStrategy, stopLossPercent: Number(e.target.value)})}
                    />
                    <p className="text-xs text-muted-foreground">
                      Price: ${(exitStrategy.entryPrice * (1 - exitStrategy.stopLossPercent / 100)).toFixed(2)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Time-Based Exit (Days)</Label>
                    <Input 
                      type="number" 
                      placeholder="30"
                      value={exitStrategy.timeBasedExit}
                      onChange={(e) => setExitStrategy({...exitStrategy, timeBasedExit: Number(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Trailing Stop (%)</Label>
                    <Input 
                      type="number" 
                      placeholder="10"
                      value={exitStrategy.trailingStopPercent}
                      onChange={(e) => setExitStrategy({...exitStrategy, trailingStopPercent: Number(e.target.value)})}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <h4 className="font-semibold mb-2">Exit Strategy Summary</h4>
                <ul className="text-sm space-y-1">
                  <li>• Exit {exitStrategy.target1Percent}% at ${(exitStrategy.entryPrice * (1 + exitStrategy.target1Gain / 100)).toFixed(2)} (+{exitStrategy.target1Gain}%)</li>
                  <li>• Exit {exitStrategy.target2Percent}% more at ${(exitStrategy.entryPrice * (1 + exitStrategy.target2Gain / 100)).toFixed(2)} (+{exitStrategy.target2Gain}%)</li>
                  <li>• Final exit at ${(exitStrategy.entryPrice * (1 + exitStrategy.finalTargetGain / 100)).toFixed(2)} (+{exitStrategy.finalTargetGain}%)</li>
                  <li className="text-red-600">• Stop loss at ${(exitStrategy.entryPrice * (1 - exitStrategy.stopLossPercent / 100)).toFixed(2)} (-{exitStrategy.stopLossPercent}%)</li>
                  <li>• Trail stop {exitStrategy.trailingStopPercent}% below high</li>
                  <li>• Force exit after {exitStrategy.timeBasedExit} days if targets not hit</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monte-carlo">
          <MonteCarloComparison />
        </TabsContent>

        <TabsContent value="optimizer">
          <PortfolioOptimizer />
        </TabsContent>

        <TabsContent value="trade-ideas">
          <TradeIdeasPanel />
        </TabsContent>

        <TabsContent value="trade-journal">
          <TradeJournalPanel />
        </TabsContent>

        <TabsContent value="ai-assistant">
          <AIAssistantPanel />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default TradingToolkit;
