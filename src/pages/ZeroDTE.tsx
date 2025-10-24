import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/stocksApi';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search } from 'lucide-react';

interface Results {
  stockPrice: number;
  strike: number;
  premium: number;
  expectedMove: number;
  probITM: number;
  POPBuyer: number;
  thetaImpact: number;
  breakeven: number;
  delta: number;
  gamma: number;
  hourlyTheta: number;
  intrinsicValue: number;
  timeValue: number;
}

export default function ZeroDTE() {
  const [symbol, setSymbol] = useState('');
  const [stockPrice, setStockPrice] = useState('100');
  const [strikePrice, setStrikePrice] = useState('101');
  const [impliedVol, setImpliedVol] = useState('0.25');
  const [premium, setPremium] = useState('0.8');
  const [thetaPerHour, setThetaPerHour] = useState('0.1');
  const [results, setResults] = useState<Results | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  const erf = (x: number): number => {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  };

  const zeroDTECallPOP = (S: number, K: number, IV: number, premium: number, thetaPerHour: number) => {
    const T_years = 1 / 365; // 1 day
    const sigma = IV;
    const expectedMove = S * sigma * Math.sqrt(T_years);

    // Probability ITM
    const d = (S - K) / expectedMove;
    const N = 0.5 * (1 + erf(d / Math.sqrt(2)));
    const probITM = N;

    // Probability of Profit (breakeven)
    const breakeven = K + premium;
    const d_breakeven = (S - breakeven) / expectedMove;
    const N_be = 0.5 * (1 + erf(d_breakeven / Math.sqrt(2)));
    const POPBuyer = N_be;

    // Calculate Delta
    const delta = probITM;

    // Calculate Gamma
    const pdf = Math.exp(-0.5 * d * d) / Math.sqrt(2 * Math.PI);
    const gamma = pdf / expectedMove;

    // Theta calculations
    const thetaImpact = thetaPerHour * 6.5; // 6.5 trading hours
    const hourlyTheta = thetaPerHour;

    // Calculate time value
    const intrinsicValue = Math.max(0, S - K);
    const timeValue = premium - intrinsicValue;

    return {
      stockPrice: S,
      strike: K,
      premium: premium,
      expectedMove: expectedMove,
      probITM: probITM,
      POPBuyer: POPBuyer,
      thetaImpact: thetaImpact,
      breakeven: breakeven,
      delta: delta,
      gamma: gamma,
      hourlyTheta: hourlyTheta,
      intrinsicValue: intrinsicValue,
      timeValue: timeValue
    };
  };

  const calculateAndVisualize = () => {
    const S = parseFloat(stockPrice);
    const K = parseFloat(strikePrice);
    const IV = parseFloat(impliedVol);
    const prem = parseFloat(premium);
    const theta = parseFloat(thetaPerHour);

    if (S && K && IV && prem) {
      const calc = zeroDTECallPOP(S, K, IV, prem, theta || 0);
      setResults(calc);
    }
  };

  useEffect(() => {
    calculateAndVisualize();
  }, []);

  const fetchStockPrice = async () => {
    if (!symbol.trim()) {
      toast.error('Please enter a stock symbol');
      return;
    }

    setLoadingPrice(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
        body: { symbols: [symbol.toUpperCase()] }
      });

      if (error) throw error;

      if (data?.stocks && data.stocks.length > 0) {
        const stock = data.stocks[0];
        setStockPrice(stock.price.toString());
        toast.success(`Updated price for ${stock.name}: $${stock.price}`);
      }
    } catch (err) {
      console.error('Error fetching stock price:', err);
      toast.error('Failed to fetch stock price');
    } finally {
      setLoadingPrice(false);
    }
  };

  const getRiskLevel = () => {
    if (!results) return 'medium';
    if (results.POPBuyer > 60) return 'low';
    if (results.POPBuyer < 30) return 'high';
    return 'medium';
  };

  const riskLevel = getRiskLevel();

  return (
    <PageLayout title="0 DTE Call Option Calculator">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Option Parameters</CardTitle>
              <CardDescription>Analyze same-day expiring call options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="symbol">Stock Symbol</Label>
                <div className="flex gap-2">
                  <Input
                    id="symbol"
                    type="text"
                    placeholder="e.g., AAPL"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  />
                  <Button onClick={fetchStockPrice} disabled={loadingPrice} size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="stockPrice">Stock Price ($)</Label>
                <Input
                  id="stockPrice"
                  type="number"
                  step="0.01"
                  value={stockPrice}
                  onChange={(e) => setStockPrice(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="strikePrice">Strike Price ($)</Label>
                <Input
                  id="strikePrice"
                  type="number"
                  step="0.01"
                  value={strikePrice}
                  onChange={(e) => setStrikePrice(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="impliedVol">Implied Volatility (decimal)</Label>
                <Input
                  id="impliedVol"
                  type="number"
                  step="0.01"
                  value={impliedVol}
                  onChange={(e) => setImpliedVol(e.target.value)}
                  placeholder="e.g., 0.25 = 25%"
                />
              </div>
              <div>
                <Label htmlFor="premium">Option Premium ($)</Label>
                <Input
                  id="premium"
                  type="number"
                  step="0.01"
                  value={premium}
                  onChange={(e) => setPremium(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="thetaPerHour">Theta per Hour ($)</Label>
                <Input
                  id="thetaPerHour"
                  type="number"
                  step="0.01"
                  value={thetaPerHour}
                  onChange={(e) => setThetaPerHour(e.target.value)}
                />
              </div>
              <Button onClick={calculateAndVisualize} className="w-full">
                Calculate Probabilities
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {results && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-success/50 bg-success/10">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-xs">Probability of Profit</CardDescription>
                    <CardTitle className="text-3xl text-success">
                      {(results.POPBuyer * 100).toFixed(1)}%
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card className="border-primary/50 bg-primary/10">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-xs">Probability ITM</CardDescription>
                    <CardTitle className="text-3xl text-primary">
                      {(results.probITM * 100).toFixed(1)}%
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card className="border-warning/50 bg-warning/10">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-xs">Expected Move (±)</CardDescription>
                    <CardTitle className="text-3xl text-warning">
                      {formatCurrency(results.expectedMove)}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription className="text-xs">Daily Theta Decay</CardDescription>
                    <CardTitle className="text-2xl text-danger">
                      {formatCurrency(results.thetaImpact)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription className="text-xs">Current Delta</CardDescription>
                    <CardTitle className="text-2xl text-primary">
                      {results.delta.toFixed(3)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription className="text-xs">Gamma Risk</CardDescription>
                    <CardTitle className="text-2xl">
                      {results.gamma.toFixed(4)}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Trade Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className={`p-4 rounded-lg border-2 ${
                      riskLevel === 'low' ? 'bg-success/10 border-success/50' :
                      riskLevel === 'high' ? 'bg-danger/10 border-danger/50' :
                      'bg-warning/10 border-warning/50'
                    }`}>
                      <p className="font-semibold mb-2">
                        Risk Level: <span className="uppercase">{riskLevel}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {riskLevel === 'low' && 'Favorable probability of profit. Monitor for volatility changes.'}
                        {riskLevel === 'medium' && 'Moderate risk. Position requires active management.'}
                        {riskLevel === 'high' && 'High risk position. Consider reducing size or hedging.'}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Breakeven Price:</p>
                        <p className="font-semibold text-lg">{formatCurrency(results.breakeven)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Intrinsic Value:</p>
                        <p className="font-semibold text-lg">{formatCurrency(results.intrinsicValue)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Time Value:</p>
                        <p className="font-semibold text-lg">{formatCurrency(results.timeValue)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Hourly Theta:</p>
                        <p className="font-semibold text-lg">{formatCurrency(results.hourlyTheta)}/hr</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-base">Greeks Analysis for 0 DTE Options</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p><strong>Delta ({results.delta.toFixed(3)}):</strong> Approximates the probability the option finishes ITM. For 0 DTE, delta changes rapidly.</p>
                  <p><strong>Gamma ({results.gamma.toFixed(4)}):</strong> Extremely high near ATM for 0 DTE. Small price moves cause large delta changes.</p>
                  <p><strong>Theta ({formatCurrency(results.hourlyTheta)}/hr):</strong> Time decay accelerates dramatically on expiration day. Monitor hourly.</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
