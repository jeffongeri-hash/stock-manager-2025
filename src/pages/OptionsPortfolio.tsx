import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/utils/stocksApi';

interface Trade {
  ticker: string;
  type: string;
  strike: number;
  expiration: string;
  currentPrice: number;
  iv: number;
  entryPrice: number;
  buySell: string;
  contracts: number;
}

export default function OptionsPortfolio() {
  const [portfolio, setPortfolio] = useState<Trade[]>([]);
  const [ticker, setTicker] = useState('');
  const [type, setType] = useState('');
  const [strike, setStrike] = useState('');
  const [expiration, setExpiration] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [iv, setIv] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [buySell, setBuySell] = useState('');
  const [contracts, setContracts] = useState('');

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
    const T = tDays / 365;
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

  const addTrade = () => {
    if (!ticker || !type || !strike || !expiration || !currentPrice || !iv || !entryPrice || !buySell || !contracts) {
      alert('Please fill in all fields');
      return;
    }

    const trade: Trade = {
      ticker: ticker.toUpperCase(),
      type,
      strike: parseFloat(strike),
      expiration,
      currentPrice: parseFloat(currentPrice),
      iv: parseFloat(iv),
      entryPrice: parseFloat(entryPrice),
      buySell,
      contracts: parseInt(contracts)
    };

    setPortfolio([...portfolio, trade]);
    clearForm();
  };

  const clearForm = () => {
    setTicker('');
    setType('');
    setStrike('');
    setExpiration('');
    setCurrentPrice('');
    setIv('');
    setEntryPrice('');
    setBuySell('');
    setContracts('');
  };

  const loadSampleData = () => {
    const sampleData: Trade[] = [
      {
        ticker: 'AAPL',
        type: 'call',
        strike: 150,
        expiration: '2025-10-15',
        currentPrice: 155,
        iv: 25,
        entryPrice: 3.50,
        buySell: 'buy',
        contracts: 2
      },
      {
        ticker: 'MSFT',
        type: 'put',
        strike: 300,
        expiration: '2025-11-20',
        currentPrice: 295,
        iv: 30,
        entryPrice: 2.75,
        buySell: 'sell',
        contracts: 1
      },
      {
        ticker: 'TSLA',
        type: 'call',
        strike: 220,
        expiration: '2025-09-30',
        currentPrice: 215,
        iv: 45,
        entryPrice: 4.20,
        buySell: 'buy',
        contracts: 3
      }
    ];
    setPortfolio(sampleData);
  };

  const clearPortfolio = () => {
    setPortfolio([]);
  };

  const totalPL = portfolio.reduce((sum, trade) => {
    const multiplier = 100 * trade.contracts;
    let pl;
    if (trade.buySell.toLowerCase() === 'buy') {
      pl = (trade.currentPrice - trade.entryPrice) * multiplier;
    } else {
      pl = (trade.entryPrice - trade.currentPrice) * multiplier;
    }
    return sum + pl;
  }, 0);

  return (
    <PageLayout title="Options Portfolio Analyzer">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Add New Trade</CardTitle>
            <CardDescription>Track your options trades with real-time P&L and probability calculations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label htmlFor="ticker">Ticker</Label>
                <Input
                  id="ticker"
                  placeholder="e.g., AAPL"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
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
                <Label htmlFor="expiration">Expiration</Label>
                <Input
                  id="expiration"
                  type="date"
                  value={expiration}
                  onChange={(e) => setExpiration(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-5">
              <div>
                <Label htmlFor="currentPrice">Current Stock Price</Label>
                <Input
                  id="currentPrice"
                  type="number"
                  placeholder="155.00"
                  step="0.01"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="iv">IV (%)</Label>
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
                <Label htmlFor="entryPrice">Entry Price</Label>
                <Input
                  id="entryPrice"
                  type="number"
                  placeholder="3.50"
                  step="0.01"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="buySell">Buy/Sell</Label>
                <Select value={buySell} onValueChange={setBuySell}>
                  <SelectTrigger>
                    <SelectValue placeholder="Buy/Sell" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="contracts">Contracts</Label>
                <Input
                  id="contracts"
                  type="number"
                  placeholder="1"
                  min="1"
                  value={contracts}
                  onChange={(e) => setContracts(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={addTrade}>Add Trade</Button>
              <Button onClick={loadSampleData} variant="secondary">Load Sample Data</Button>
              <Button onClick={clearPortfolio} variant="outline">Clear All</Button>
            </div>
          </CardContent>
        </Card>

        {portfolio.length > 0 && (
          <>
            <Card className={totalPL >= 0 ? 'border-success/50 bg-success/5' : 'border-danger/50 bg-danger/5'}>
              <CardHeader>
                <CardTitle>Portfolio Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold ${totalPL >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatCurrency(totalPL)}
                </div>
              </CardContent>
            </Card>

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
                        <TableHead>Expected Move ±</TableHead>
                        <TableHead>Prob ITM (%)</TableHead>
                        <TableHead>Current P&L</TableHead>
                        <TableHead>Position</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {portfolio.map((trade, index) => {
                        const daysToExp = daysToExpiration(trade.expiration);
                        const move = expectedMove(trade.currentPrice, trade.iv, daysToExp);
                        const probItm = probITM(trade.currentPrice, trade.strike, trade.iv, daysToExp, trade.type);
                        const multiplier = 100 * trade.contracts;
                        let pl;
                        if (trade.buySell.toLowerCase() === 'buy') {
                          pl = (trade.currentPrice - trade.entryPrice) * multiplier;
                        } else {
                          pl = (trade.entryPrice - trade.currentPrice) * multiplier;
                        }

                        return (
                          <TableRow key={index}>
                            <TableCell className="font-bold">{trade.ticker}</TableCell>
                            <TableCell className="uppercase">{trade.type}</TableCell>
                            <TableCell>${trade.strike}</TableCell>
                            <TableCell>{daysToExp}</TableCell>
                            <TableCell>${move.toFixed(2)}</TableCell>
                            <TableCell>{(probItm * 100).toFixed(1)}%</TableCell>
                            <TableCell className={pl >= 0 ? 'text-success font-bold' : 'text-danger font-bold'}>
                              {formatCurrency(pl)}
                            </TableCell>
                            <TableCell className="uppercase">{trade.buySell} {trade.contracts}</TableCell>
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
