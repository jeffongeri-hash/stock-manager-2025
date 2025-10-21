import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Position {
  ticker: string;
  type: string;
  strike: number;
  expiration: string;
  stockPrice: number;
  iv: number;
  hv: number;
}

export default function OptionsRisk() {
  const [portfolio, setPortfolio] = useState<Position[]>([]);
  const [ticker, setTicker] = useState('');
  const [type, setType] = useState('');
  const [strike, setStrike] = useState('');
  const [expiration, setExpiration] = useState('');
  const [stockPrice, setStockPrice] = useState('');
  const [iv, setIv] = useState('');
  const [hv, setHv] = useState('');

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

  const expectedMove = (stockPrice: number, ivPercent: number, days: number) => {
    const ivVal = ivPercent / 100;
    return stockPrice * ivVal * Math.sqrt(days / 365);
  };

  const probITM = (S: number, K: number, IV: number, tDays: number, optionType: string) => {
    const T = Math.max(tDays / 365, 0.0001);
    const sigma = IV / 100;
    const expectedMoveVal = S * sigma * Math.sqrt(T);
    const d = (S - K) / expectedMoveVal;
    const N = 0.5 * (1 + erf(d / Math.sqrt(2)));

    if (optionType.toLowerCase() === 'call') {
      return N;
    } else {
      return 1 - N;
    }
  };

  const daysToExpiration = (expirationDate: string) => {
    const today = new Date();
    const exp = new Date(expirationDate);
    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 0);
  };

  const getRiskFlag = (iv: number, hv: number, probItm: number) => {
    if (iv > hv && probItm < 0.3) {
      return 'Safe';
    } else if (iv < hv && probItm > 0.7) {
      return 'Risky';
    } else {
      return 'Neutral';
    }
  };

  const addPosition = () => {
    if (!ticker || !type || !strike || !expiration || !stockPrice || !iv || !hv) {
      alert('Please fill in all fields');
      return;
    }

    const position: Position = {
      ticker: ticker.toUpperCase(),
      type,
      strike: parseFloat(strike),
      expiration,
      stockPrice: parseFloat(stockPrice),
      iv: parseFloat(iv),
      hv: parseFloat(hv)
    };

    setPortfolio([...portfolio, position]);
    clearForm();
  };

  const clearForm = () => {
    setTicker('');
    setType('');
    setStrike('');
    setExpiration('');
    setStockPrice('');
    setIv('');
    setHv('');
  };

  const loadSampleData = () => {
    const sampleData: Position[] = [
      {
        ticker: 'AAPL',
        type: 'call',
        strike: 150,
        expiration: '2025-10-15',
        stockPrice: 155,
        iv: 28,
        hv: 22
      },
      {
        ticker: 'MSFT',
        type: 'put',
        strike: 300,
        expiration: '2025-11-20',
        stockPrice: 295,
        iv: 18,
        hv: 25
      },
      {
        ticker: 'TSLA',
        type: 'call',
        strike: 220,
        expiration: '2025-09-30',
        stockPrice: 215,
        iv: 52,
        hv: 48
      }
    ];
    setPortfolio(sampleData);
  };

  const clearPortfolio = () => {
    setPortfolio([]);
  };

  const riskCounts = portfolio.reduce((acc, position) => {
    const daysToExp = daysToExpiration(position.expiration);
    const probItm = probITM(position.stockPrice, position.strike, position.iv, daysToExp, position.type);
    const risk = getRiskFlag(position.iv, position.hv, probItm);
    acc[risk.toLowerCase()]++;
    return acc;
  }, { safe: 0, risky: 0, neutral: 0 });

  return (
    <PageLayout title="Options Risk Tracker">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Add Option Position</CardTitle>
            <CardDescription>Analyze volatility relationships and assess option risk using IV vs HV comparisons</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label htmlFor="ticker">Ticker Symbol</Label>
                <Input
                  id="ticker"
                  placeholder="e.g., AAPL"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="type">Option Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="put">Put</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="strike">Strike Price</Label>
                <Input
                  id="strike"
                  type="number"
                  placeholder="150.00"
                  step="0.01"
                  value={strike}
                  onChange={(e) => setStrike(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="expiration">Expiration Date</Label>
                <Input
                  id="expiration"
                  type="date"
                  value={expiration}
                  onChange={(e) => setExpiration(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="stockPrice">Current Stock Price</Label>
                <Input
                  id="stockPrice"
                  type="number"
                  placeholder="155.00"
                  step="0.01"
                  value={stockPrice}
                  onChange={(e) => setStockPrice(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="iv">Implied Volatility (%)</Label>
                <Input
                  id="iv"
                  type="number"
                  placeholder="25.0"
                  step="0.1"
                  value={iv}
                  onChange={(e) => setIv(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="hv">Historical Volatility (%)</Label>
                <Input
                  id="hv"
                  type="number"
                  placeholder="22.0"
                  step="0.1"
                  value={hv}
                  onChange={(e) => setHv(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={addPosition}>Add Position</Button>
              <Button onClick={loadSampleData} variant="secondary">Load Sample Data</Button>
              <Button onClick={clearPortfolio} variant="outline">Clear All</Button>
            </div>
          </CardContent>
        </Card>

        {portfolio.length > 0 && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-success/50 bg-success/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-3xl font-bold text-success">{riskCounts.safe}</CardTitle>
                  <CardDescription>Safe Positions</CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-danger/50 bg-danger/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-3xl font-bold text-danger">{riskCounts.risky}</CardTitle>
                  <CardDescription>Risky Positions</CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-warning/50 bg-warning/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-3xl font-bold text-warning">{riskCounts.neutral}</CardTitle>
                  <CardDescription>Neutral Positions</CardDescription>
                </CardHeader>
              </Card>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticker</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Strike</TableHead>
                        <TableHead>Days to Exp</TableHead>
                        <TableHead>Stock Price</TableHead>
                        <TableHead>IV (%)</TableHead>
                        <TableHead>HV (%)</TableHead>
                        <TableHead>Expected Move ±</TableHead>
                        <TableHead>Prob ITM (%)</TableHead>
                        <TableHead>Risk Flag</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {portfolio.map((position, index) => {
                        const daysToExp = daysToExpiration(position.expiration);
                        const move = expectedMove(position.stockPrice, position.iv, daysToExp);
                        const probItm = probITM(position.stockPrice, position.strike, position.iv, daysToExp, position.type);
                        const risk = getRiskFlag(position.iv, position.hv, probItm);

                        return (
                          <TableRow key={index}>
                            <TableCell className="font-bold">{position.ticker}</TableCell>
                            <TableCell className="uppercase">{position.type}</TableCell>
                            <TableCell>${position.strike}</TableCell>
                            <TableCell>{daysToExp}</TableCell>
                            <TableCell>${position.stockPrice}</TableCell>
                            <TableCell>{position.iv}%</TableCell>
                            <TableCell>{position.hv}%</TableCell>
                            <TableCell>${move.toFixed(2)}</TableCell>
                            <TableCell>{(probItm * 100).toFixed(1)}%</TableCell>
                            <TableCell>
                              <Badge variant={
                                risk === 'Safe' ? 'default' :
                                risk === 'Risky' ? 'destructive' :
                                'secondary'
                              }>
                                {risk}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PageLayout>
  );
}
