import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Search, RefreshCw, TrendingUp, TrendingDown, DollarSign, 
  Target, AlertTriangle, CheckCircle2, Info, Loader2, Star
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useStockData } from '@/hooks/useStockData';

interface WheelAnalysis {
  strikePrice: number;
  premium: number;
  delta: number;
  theta: number;
  iv: number;
  daysToExpiry: number;
  capitalRequired: number;
  maxProfit: number;
  annualizedReturn: number;
  breakeven: number;
  probProfit: number;
  riskReward: number;
  score: number;
  recommendation: 'excellent' | 'good' | 'neutral' | 'poor';
}

interface StrikeAnalysis {
  strike: number;
  cspAnalysis: WheelAnalysis | null;
  ccAnalysis: WheelAnalysis | null;
}

export const WheelStrategyAnalyzer = () => {
  const [symbol, setSymbol] = useState('');
  const [searchedSymbol, setSearchedSymbol] = useState('');
  const [expiration, setExpiration] = useState('');
  const [targetDelta, setTargetDelta] = useState('0.30');
  const [isLoading, setIsLoading] = useState(false);
  const [analyses, setAnalyses] = useState<StrikeAnalysis[]>([]);
  const [stockPrice, setStockPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [priceChangePercent, setPriceChangePercent] = useState(0);

  const { stocks, loading: stockLoading } = useStockData(searchedSymbol ? [searchedSymbol] : []);
  
  const daysToExpiration = (expirationDate: string) => {
    const today = new Date();
    const exp = new Date(expirationDate);
    const diffTime = exp.getTime() - today.getTime();
    return Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);
  };

  const calculateWheelScore = (analysis: Partial<WheelAnalysis>, type: 'csp' | 'cc'): number => {
    let score = 0;
    
    // Annualized return (max 30 points)
    score += Math.min(analysis.annualizedReturn || 0, 30);
    
    // Probability of profit (max 25 points)
    score += ((analysis.probProfit || 0) / 100) * 25;
    
    // Delta sweetspot (max 20 points) - ideal is 0.25-0.35
    const delta = Math.abs(analysis.delta || 0);
    if (delta >= 0.20 && delta <= 0.35) {
      score += 20;
    } else if (delta >= 0.15 && delta <= 0.40) {
      score += 15;
    } else if (delta >= 0.10 && delta <= 0.50) {
      score += 10;
    } else {
      score += 5;
    }
    
    // DTE sweetspot (max 15 points) - ideal is 30-45 days
    const dte = analysis.daysToExpiry || 0;
    if (dte >= 30 && dte <= 45) {
      score += 15;
    } else if (dte >= 21 && dte <= 60) {
      score += 10;
    } else if (dte >= 14 && dte <= 90) {
      score += 5;
    }
    
    // Risk/reward (max 10 points)
    const rr = analysis.riskReward || 0;
    if (rr >= 0.03) {
      score += 10;
    } else if (rr >= 0.02) {
      score += 7;
    } else if (rr >= 0.01) {
      score += 4;
    }
    
    return Math.round(score);
  };

  const getRecommendation = (score: number): WheelAnalysis['recommendation'] => {
    if (score >= 75) return 'excellent';
    if (score >= 55) return 'good';
    if (score >= 35) return 'neutral';
    return 'poor';
  };

  const analyzeWheel = async () => {
    if (!symbol || !expiration) {
      toast.error('Please enter a symbol and expiration date');
      return;
    }

    setIsLoading(true);
    setSearchedSymbol(symbol.toUpperCase());
    
    try {
      // Fetch current stock price
      const { data: stockData, error: stockError } = await supabase.functions.invoke('fetch-stock-data', {
        body: { symbol: symbol.toUpperCase() }
      });
      
      if (stockError) throw stockError;
      
      const currentPrice = stockData?.price || stockData?.currentPrice || 0;
      setStockPrice(currentPrice);
      setPriceChange(stockData?.change || 0);
      setPriceChangePercent(stockData?.changePercent || 0);
      
      if (!currentPrice) {
        toast.error('Could not fetch stock price');
        setIsLoading(false);
        return;
      }

      const dte = daysToExpiration(expiration);
      const targetDeltaNum = parseFloat(targetDelta);
      
      // Generate strike prices around current price (OTM for CSP, OTM for CC)
      const strikes: number[] = [];
      const roundTo = currentPrice > 100 ? 5 : currentPrice > 50 ? 2.5 : 1;
      const baseStrike = Math.round(currentPrice / roundTo) * roundTo;
      
      // CSP strikes (below current price)
      for (let i = 1; i <= 5; i++) {
        strikes.push(baseStrike - (i * roundTo));
      }
      // ATM
      strikes.push(baseStrike);
      // CC strikes (above current price)
      for (let i = 1; i <= 5; i++) {
        strikes.push(baseStrike + (i * roundTo));
      }
      
      strikes.sort((a, b) => a - b);
      
      const analysisResults: StrikeAnalysis[] = [];
      
      for (const strike of strikes) {
        // Analyze CSP (put)
        let cspAnalysis: WheelAnalysis | null = null;
        if (strike <= currentPrice) {
          try {
            const { data: putData } = await supabase.functions.invoke('fetch-options-data', {
              body: {
                symbol: symbol.toUpperCase(),
                stockPrice: currentPrice,
                strikePrice: strike,
                daysToExpiry: dte,
                volatility: 0.30, // Default IV
                optionType: 'put'
              }
            });
            
            if (putData?.greeks) {
              const premium = putData.price || (putData.greeks.delta ? Math.abs(putData.greeks.delta) * 5 : 0);
              const capitalRequired = strike * 100;
              const maxProfit = premium * 100;
              const annualizedReturn = capitalRequired > 0 
                ? ((maxProfit / capitalRequired) * (365 / dte) * 100) 
                : 0;
              const breakeven = strike - premium;
              const probProfit = (1 - Math.abs(putData.greeks.delta)) * 100;
              const riskReward = capitalRequired > 0 ? maxProfit / capitalRequired : 0;
              
              const partialAnalysis = {
                strikePrice: strike,
                premium,
                delta: putData.greeks.delta,
                theta: putData.greeks.theta,
                iv: 30,
                daysToExpiry: dte,
                capitalRequired,
                maxProfit,
                annualizedReturn,
                breakeven,
                probProfit,
                riskReward
              };
              
              const score = calculateWheelScore(partialAnalysis, 'csp');
              
              cspAnalysis = {
                ...partialAnalysis,
                score,
                recommendation: getRecommendation(score)
              };
            }
          } catch (e) {
            console.error('Error analyzing CSP:', e);
          }
        }
        
        // Analyze CC (call)
        let ccAnalysis: WheelAnalysis | null = null;
        if (strike >= currentPrice) {
          try {
            const { data: callData } = await supabase.functions.invoke('fetch-options-data', {
              body: {
                symbol: symbol.toUpperCase(),
                stockPrice: currentPrice,
                strikePrice: strike,
                daysToExpiry: dte,
                volatility: 0.30,
                optionType: 'call'
              }
            });
            
            if (callData?.greeks) {
              const premium = callData.price || (callData.greeks.delta ? callData.greeks.delta * 5 : 0);
              const capitalRequired = currentPrice * 100; // Cost of 100 shares
              const maxProfit = (premium * 100) + ((strike - currentPrice) * 100);
              const annualizedReturn = capitalRequired > 0 
                ? ((premium * 100 / capitalRequired) * (365 / dte) * 100) 
                : 0;
              const breakeven = currentPrice - premium;
              const probProfit = callData.greeks.delta * 100; // Prob of being called
              
              const partialAnalysis = {
                strikePrice: strike,
                premium,
                delta: callData.greeks.delta,
                theta: callData.greeks.theta,
                iv: 30,
                daysToExpiry: dte,
                capitalRequired,
                maxProfit,
                annualizedReturn,
                breakeven,
                probProfit: 100 - probProfit, // Prob of keeping shares
                riskReward: capitalRequired > 0 ? (premium * 100) / capitalRequired : 0
              };
              
              const score = calculateWheelScore(partialAnalysis, 'cc');
              
              ccAnalysis = {
                ...partialAnalysis,
                score,
                recommendation: getRecommendation(score)
              };
            }
          } catch (e) {
            console.error('Error analyzing CC:', e);
          }
        }
        
        if (cspAnalysis || ccAnalysis) {
          analysisResults.push({
            strike,
            cspAnalysis,
            ccAnalysis
          });
        }
      }
      
      setAnalyses(analysisResults);
      toast.success(`Analyzed ${analysisResults.length} strike prices for ${symbol.toUpperCase()}`);
      
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze wheel strategy');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (searchedSymbol && expiration) {
      analyzeWheel();
    }
  };

  const getScoreBadge = (score: number, recommendation: WheelAnalysis['recommendation']) => {
    const colors = {
      excellent: 'bg-green-500/20 text-green-500 border-green-500/50',
      good: 'bg-blue-500/20 text-blue-500 border-blue-500/50',
      neutral: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
      poor: 'bg-red-500/20 text-red-500 border-red-500/50'
    };
    
    return (
      <Badge className={colors[recommendation]}>
        {score}/100
      </Badge>
    );
  };

  const bestCSP = useMemo(() => {
    const cspAnalyses = analyses
      .filter(a => a.cspAnalysis)
      .map(a => a.cspAnalysis!)
      .sort((a, b) => b.score - a.score);
    return cspAnalyses[0] || null;
  }, [analyses]);

  const bestCC = useMemo(() => {
    const ccAnalyses = analyses
      .filter(a => a.ccAnalysis)
      .map(a => a.ccAnalysis!)
      .sort((a, b) => b.score - a.score);
    return ccAnalyses[0] || null;
  }, [analyses]);

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Wheel Strategy Analyzer
          </CardTitle>
          <CardDescription>
            Analyze which strike prices and expiration dates offer the best wheel opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Stock Symbol</Label>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="AAPL"
                onKeyDown={(e) => e.key === 'Enter' && analyzeWheel()}
              />
            </div>
            <div>
              <Label>Expiration Date</Label>
              <Input
                type="date"
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                Target Delta
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Lower delta = lower premium but higher probability of profit. 0.20-0.30 is typical for wheel strategy.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Select value={targetDelta} onValueChange={setTargetDelta}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.15">0.15 (Conservative)</SelectItem>
                  <SelectItem value="0.20">0.20 (Safe)</SelectItem>
                  <SelectItem value="0.25">0.25 (Balanced)</SelectItem>
                  <SelectItem value="0.30">0.30 (Standard)</SelectItem>
                  <SelectItem value="0.35">0.35 (Aggressive)</SelectItem>
                  <SelectItem value="0.40">0.40 (High Risk)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={analyzeWheel} disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Analyze
                  </>
                )}
              </Button>
              {searchedSymbol && (
                <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          </div>

          {stockPrice > 0 && (
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
              <div>
                <span className="text-sm text-muted-foreground">Current Price:</span>
                <span className="ml-2 font-bold text-lg">${stockPrice.toFixed(2)}</span>
              </div>
              <div className={`flex items-center gap-1 ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {priceChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="font-medium">
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                </span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Days to Expiry:</span>
                <span className="ml-2 font-medium">{daysToExpiration(expiration)} days</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Best Recommendations */}
      {(bestCSP || bestCC) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bestCSP && (
            <Card className="border-green-500/30 bg-green-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="h-5 w-5 text-green-500" />
                  Best Cash-Secured Put
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Strike Price</p>
                    <p className="text-2xl font-bold">${bestCSP.strikePrice}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Premium</p>
                    <p className="text-2xl font-bold text-green-500">${bestCSP.premium.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Annualized Return</p>
                    <p className="text-lg font-semibold text-primary">{bestCSP.annualizedReturn.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Prob. of Profit</p>
                    <p className="text-lg font-semibold">{bestCSP.probProfit.toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Delta</p>
                    <p className="text-lg font-semibold">{Math.abs(bestCSP.delta).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Score</p>
                    {getScoreBadge(bestCSP.score, bestCSP.recommendation)}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    <strong>Breakeven:</strong> ${bestCSP.breakeven.toFixed(2)} | 
                    <strong className="ml-2">Capital Req:</strong> ${bestCSP.capitalRequired.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {bestCC && (
            <Card className="border-blue-500/30 bg-blue-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="h-5 w-5 text-blue-500" />
                  Best Covered Call
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Strike Price</p>
                    <p className="text-2xl font-bold">${bestCC.strikePrice}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Premium</p>
                    <p className="text-2xl font-bold text-green-500">${bestCC.premium.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Annualized Return</p>
                    <p className="text-lg font-semibold text-primary">{bestCC.annualizedReturn.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Prob. Keep Shares</p>
                    <p className="text-lg font-semibold">{bestCC.probProfit.toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Delta</p>
                    <p className="text-lg font-semibold">{Math.abs(bestCC.delta).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Score</p>
                    {getScoreBadge(bestCC.score, bestCC.recommendation)}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    <strong>Max Profit:</strong> ${bestCC.maxProfit.toFixed(0)} | 
                    <strong className="ml-2">If Assigned at:</strong> ${bestCC.strikePrice}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Full Analysis Table */}
      {analyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Strike Price Analysis</CardTitle>
            <CardDescription>
              Compare all strike prices for {searchedSymbol} expiring {expiration}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Strike</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Premium</TableHead>
                    <TableHead>Delta</TableHead>
                    <TableHead>Ann. Return</TableHead>
                    <TableHead>Prob. Profit</TableHead>
                    <TableHead>Capital Req.</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyses.map((analysis) => (
                    <>
                      {analysis.cspAnalysis && (
                        <TableRow key={`csp-${analysis.strike}`} className="bg-blue-500/5">
                          <TableCell className="font-bold">${analysis.strike}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">CSP</Badge>
                          </TableCell>
                          <TableCell className="text-green-500 font-medium">
                            ${analysis.cspAnalysis.premium.toFixed(2)}
                          </TableCell>
                          <TableCell>{Math.abs(analysis.cspAnalysis.delta).toFixed(2)}</TableCell>
                          <TableCell className="font-medium text-primary">
                            {analysis.cspAnalysis.annualizedReturn.toFixed(1)}%
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={analysis.cspAnalysis.probProfit} className="w-16 h-2" />
                              <span>{analysis.cspAnalysis.probProfit.toFixed(0)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>${analysis.cspAnalysis.capitalRequired.toLocaleString()}</TableCell>
                          <TableCell>{getScoreBadge(analysis.cspAnalysis.score, analysis.cspAnalysis.recommendation)}</TableCell>
                          <TableCell>
                            {analysis.cspAnalysis.recommendation === 'excellent' && (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            )}
                            {analysis.cspAnalysis.recommendation === 'good' && (
                              <CheckCircle2 className="h-5 w-5 text-blue-500" />
                            )}
                            {analysis.cspAnalysis.recommendation === 'neutral' && (
                              <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            )}
                            {analysis.cspAnalysis.recommendation === 'poor' && (
                              <AlertTriangle className="h-5 w-5 text-red-500" />
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                      {analysis.ccAnalysis && (
                        <TableRow key={`cc-${analysis.strike}`} className="bg-green-500/5">
                          <TableCell className="font-bold">${analysis.strike}</TableCell>
                          <TableCell>
                            <Badge>CC</Badge>
                          </TableCell>
                          <TableCell className="text-green-500 font-medium">
                            ${analysis.ccAnalysis.premium.toFixed(2)}
                          </TableCell>
                          <TableCell>{Math.abs(analysis.ccAnalysis.delta).toFixed(2)}</TableCell>
                          <TableCell className="font-medium text-primary">
                            {analysis.ccAnalysis.annualizedReturn.toFixed(1)}%
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={analysis.ccAnalysis.probProfit} className="w-16 h-2" />
                              <span>{analysis.ccAnalysis.probProfit.toFixed(0)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>${analysis.ccAnalysis.capitalRequired.toLocaleString()}</TableCell>
                          <TableCell>{getScoreBadge(analysis.ccAnalysis.score, analysis.ccAnalysis.recommendation)}</TableCell>
                          <TableCell>
                            {analysis.ccAnalysis.recommendation === 'excellent' && (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            )}
                            {analysis.ccAnalysis.recommendation === 'good' && (
                              <CheckCircle2 className="h-5 w-5 text-blue-500" />
                            )}
                            {analysis.ccAnalysis.recommendation === 'neutral' && (
                              <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            )}
                            {analysis.ccAnalysis.recommendation === 'poor' && (
                              <AlertTriangle className="h-5 w-5 text-red-500" />
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scoring Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            How Scoring Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-1">Annualized Return (30pts)</h4>
              <p className="text-sm text-muted-foreground">Higher premium relative to capital = higher score</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-1">Prob. of Profit (25pts)</h4>
              <p className="text-sm text-muted-foreground">Based on delta - lower delta = higher probability</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-1">Delta Sweet Spot (20pts)</h4>
              <p className="text-sm text-muted-foreground">0.20-0.35 is ideal for wheel strategy</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-1">DTE Sweet Spot (15pts)</h4>
              <p className="text-sm text-muted-foreground">30-45 days optimal for theta decay</p>
            </div>
          </div>
          <div className="mt-4 flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500/20 text-green-500">75+</Badge>
              <span className="text-sm">Excellent</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500/20 text-blue-500">55-74</Badge>
              <span className="text-sm">Good</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-500/20 text-yellow-500">35-54</Badge>
              <span className="text-sm">Neutral</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-500/20 text-red-500">&lt;35</Badge>
              <span className="text-sm">Poor</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
