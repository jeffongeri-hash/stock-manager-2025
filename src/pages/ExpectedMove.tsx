import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatPercentage } from '@/utils/stocksApi';

interface MoveResults {
  expectedMove: number;
  lowerBound: number;
  upperBound: number;
}

interface PopResults {
  expectedMove: number;
  probITM: number;
  pop: number;
  thetaDecayImpact: number;
  days: number;
}

export default function ExpectedMove() {
  const [stockPrice1, setStockPrice1] = useState('100');
  const [iv1, setIv1] = useState('20');
  const [days1, setDays1] = useState('30');
  const [results1, setResults1] = useState<MoveResults | null>(null);

  const [stockPrice2, setStockPrice2] = useState('100');
  const [strikePrice, setStrikePrice] = useState('105');
  const [iv2, setIv2] = useState('20');
  const [days2, setDays2] = useState('30');
  const [optionType, setOptionType] = useState('call');
  const [theta, setTheta] = useState('0.05');
  const [results2, setResults2] = useState<PopResults | null>(null);

  const expectedMove = (stockPrice: number, ivPercent: number, days: number) => {
    const iv = ivPercent / 100;
    const move = stockPrice * iv * Math.sqrt(days / 365);
    const lower = stockPrice - move;
    const upper = stockPrice + move;

    return {
      expectedMove: parseFloat(move.toFixed(2)),
      lowerBound: parseFloat(lower.toFixed(2)),
      upperBound: parseFloat(upper.toFixed(2))
    };
  };

  const erf = (x: number): number => {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  };

  const optionPopTheta = (S: number, K: number, IV: number, T: number, optionType: string, thetaPerDay: number) => {
    const T_years = T / 365;
    const expected_move = S * IV * Math.sqrt(T_years);

    const d1 = (Math.log(S / K) + (0.5 * IV * IV) * T_years) / (IV * Math.sqrt(T_years));
    const N = 0.5 * (1 + erf(d1 / Math.sqrt(2)));

    let prob_ITM;
    if (optionType === 'call') {
      prob_ITM = 1 - N;
    } else {
      prob_ITM = N;
    }

    const pop = (1 - prob_ITM) * 100;
    const breakeven_shift = thetaPerDay * T;

    return {
      expectedMove: parseFloat(expected_move.toFixed(2)),
      probITM: parseFloat((prob_ITM * 100).toFixed(1)),
      pop: parseFloat(pop.toFixed(1)),
      thetaDecayImpact: parseFloat(breakeven_shift.toFixed(2)),
      days: T
    };
  };

  const handleCalculate1 = () => {
    const price = parseFloat(stockPrice1);
    const volatility = parseFloat(iv1);
    const daysVal = parseInt(days1);

    if (price && volatility && daysVal) {
      setResults1(expectedMove(price, volatility, daysVal));
    }
  };

  const handleCalculate2 = () => {
    const S = parseFloat(stockPrice2);
    const K = parseFloat(strikePrice);
    const volatility = parseFloat(iv2) / 100;
    const daysVal = parseInt(days2);
    const thetaVal = parseFloat(theta);

    if (S && K && volatility && daysVal) {
      setResults2(optionPopTheta(S, K, volatility, daysVal, optionType, thetaVal));
    }
  };

  return (
    <PageLayout title="Expected Move Calculator">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Expected Move Calculator</CardTitle>
            <CardDescription>Calculate expected price movements based on implied volatility</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="stockPrice1">Current Stock Price</Label>
              <Input
                id="stockPrice1"
                type="number"
                placeholder="100.00"
                step="0.01"
                value={stockPrice1}
                onChange={(e) => setStockPrice1(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="iv1">Implied Volatility (%)</Label>
              <Input
                id="iv1"
                type="number"
                placeholder="20.0"
                step="0.1"
                value={iv1}
                onChange={(e) => setIv1(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="days1">Days to Expiration</Label>
              <Input
                id="days1"
                type="number"
                placeholder="30"
                min="1"
                value={days1}
                onChange={(e) => setDays1(e.target.value)}
              />
            </div>
            <Button onClick={handleCalculate1} className="w-full">
              Calculate Expected Move
            </Button>
            
            {results1 && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Expected Move (±)</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(results1.expectedMove)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Lower Bound</span>
                  <span className="text-lg font-bold text-danger">{formatCurrency(results1.lowerBound)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Upper Bound</span>
                  <span className="text-lg font-bold text-success">{formatCurrency(results1.upperBound)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Option POP & Theta Calculator</CardTitle>
            <CardDescription>Analyze probability of profit and theta decay impact</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="stockPrice2">Stock Price</Label>
                <Input
                  id="stockPrice2"
                  type="number"
                  placeholder="100.00"
                  step="0.01"
                  value={stockPrice2}
                  onChange={(e) => setStockPrice2(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="strikePrice">Strike Price</Label>
                <Input
                  id="strikePrice"
                  type="number"
                  placeholder="105.00"
                  step="0.01"
                  value={strikePrice}
                  onChange={(e) => setStrikePrice(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="iv2">Implied Volatility (%)</Label>
                <Input
                  id="iv2"
                  type="number"
                  placeholder="20.0"
                  step="0.1"
                  value={iv2}
                  onChange={(e) => setIv2(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="days2">Days to Expiration</Label>
                <Input
                  id="days2"
                  type="number"
                  placeholder="30"
                  min="1"
                  value={days2}
                  onChange={(e) => setDays2(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="optionType">Option Type</Label>
                <Select value={optionType} onValueChange={setOptionType}>
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
                <Label htmlFor="theta">Theta per Day</Label>
                <Input
                  id="theta"
                  type="number"
                  placeholder="0.05"
                  step="0.01"
                  value={theta}
                  onChange={(e) => setTheta(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleCalculate2} className="w-full">
              Calculate POP & Theta
            </Button>
            
            {results2 && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Expected Move (±)</span>
                  <span className="text-base font-bold">{formatCurrency(results2.expectedMove)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Prob ITM</span>
                  <span className="text-base font-bold">{results2.probITM}%</span>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="text-xs text-center text-muted-foreground mb-1">Probability of Profit</div>
                  <div className="text-2xl font-bold text-center text-primary">{results2.pop}%</div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Theta Decay Impact</span>
                  <span className="text-base font-bold text-warning">{formatCurrency(results2.thetaDecayImpact)} over {results2.days}d</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
