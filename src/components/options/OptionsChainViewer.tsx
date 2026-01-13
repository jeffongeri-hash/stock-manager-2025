import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Layers, TrendingUp, TrendingDown, Target } from 'lucide-react';

interface OptionData {
  strike: number;
  callBid: number;
  callAsk: number;
  callDelta: number;
  callGamma: number;
  callTheta: number;
  callVega: number;
  callOI: number;
  callVolume: number;
  putBid: number;
  putAsk: number;
  putDelta: number;
  putGamma: number;
  putTheta: number;
  putVega: number;
  putOI: number;
  putVolume: number;
  itm: 'call' | 'put' | 'atm';
}

export const OptionsChainViewer = () => {
  const [symbol, setSymbol] = useState('AAPL');
  const [stockPrice, setStockPrice] = useState(185.50);
  const [expiration, setExpiration] = useState('2024-02-16');
  const [viewType, setViewType] = useState<'straddle' | 'calls' | 'puts'>('straddle');

  // Generate mock options chain data
  const optionsChain: OptionData[] = useMemo(() => {
    const strikes: OptionData[] = [];
    const baseStrike = Math.floor(stockPrice / 5) * 5;
    
    for (let i = -10; i <= 10; i++) {
      const strike = baseStrike + (i * 2.5);
      const moneyness = (strike - stockPrice) / stockPrice;
      const iv = 0.25 + Math.abs(moneyness) * 0.1;
      const timeToExpiry = 30 / 365;
      
      // Simplified Black-Scholes approximations
      const callDelta = Math.max(0.01, Math.min(0.99, 0.5 - moneyness * 2));
      const putDelta = callDelta - 1;
      const gamma = Math.exp(-moneyness * moneyness * 10) * 0.05;
      const theta = -stockPrice * iv * Math.sqrt(timeToExpiry) * 0.01;
      const vega = stockPrice * Math.sqrt(timeToExpiry) * 0.01;
      
      const callPrice = Math.max(0.01, stockPrice * callDelta * 0.15 + (strike < stockPrice ? stockPrice - strike : 0));
      const putPrice = Math.max(0.01, stockPrice * Math.abs(putDelta) * 0.15 + (strike > stockPrice ? strike - stockPrice : 0));
      
      strikes.push({
        strike,
        callBid: parseFloat((callPrice * 0.98).toFixed(2)),
        callAsk: parseFloat((callPrice * 1.02).toFixed(2)),
        callDelta: parseFloat(callDelta.toFixed(3)),
        callGamma: parseFloat(gamma.toFixed(4)),
        callTheta: parseFloat(theta.toFixed(3)),
        callVega: parseFloat(vega.toFixed(3)),
        callOI: Math.floor(Math.random() * 10000),
        callVolume: Math.floor(Math.random() * 2000),
        putBid: parseFloat((putPrice * 0.98).toFixed(2)),
        putAsk: parseFloat((putPrice * 1.02).toFixed(2)),
        putDelta: parseFloat(putDelta.toFixed(3)),
        putGamma: parseFloat(gamma.toFixed(4)),
        putTheta: parseFloat(theta.toFixed(3)),
        putVega: parseFloat(vega.toFixed(3)),
        putOI: Math.floor(Math.random() * 8000),
        putVolume: Math.floor(Math.random() * 1500),
        itm: strike < stockPrice ? 'call' : strike > stockPrice ? 'put' : 'atm'
      });
    }
    
    return strikes;
  }, [stockPrice]);

  const getRowHighlight = (option: OptionData) => {
    if (option.itm === 'atm') return 'bg-primary/10';
    if (option.itm === 'call') return 'bg-green-500/5';
    return '';
  };

  const getDeltaColor = (delta: number) => {
    const absDelta = Math.abs(delta);
    if (absDelta >= 0.7) return 'text-green-500 font-bold';
    if (absDelta >= 0.5) return 'text-yellow-500';
    if (absDelta >= 0.3) return 'text-orange-500';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Options Chain Viewer
          </CardTitle>
          <CardDescription>
            View real-time options chain with Greeks and volume analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Symbol</Label>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="AAPL"
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
              <Label>Expiration</Label>
              <Input
                type="date"
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Load Chain
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>{symbol} Options Chain</CardTitle>
              <CardDescription>
                Stock Price: ${stockPrice.toFixed(2)} | Expiration: {expiration}
              </CardDescription>
            </div>
            <Tabs value={viewType} onValueChange={(v) => setViewType(v as any)}>
              <TabsList>
                <TabsTrigger value="straddle">Straddle View</TabsTrigger>
                <TabsTrigger value="calls">Calls Only</TabsTrigger>
                <TabsTrigger value="puts">Puts Only</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {(viewType === 'straddle' || viewType === 'calls') && (
                    <>
                      <TableHead className="text-center bg-green-500/10">Call Vol</TableHead>
                      <TableHead className="text-center bg-green-500/10">Call OI</TableHead>
                      <TableHead className="text-center bg-green-500/10">Bid</TableHead>
                      <TableHead className="text-center bg-green-500/10">Ask</TableHead>
                      <TableHead className="text-center bg-green-500/10">Delta</TableHead>
                    </>
                  )}
                  <TableHead className="text-center bg-primary/20 font-bold">Strike</TableHead>
                  {(viewType === 'straddle' || viewType === 'puts') && (
                    <>
                      <TableHead className="text-center bg-red-500/10">Delta</TableHead>
                      <TableHead className="text-center bg-red-500/10">Bid</TableHead>
                      <TableHead className="text-center bg-red-500/10">Ask</TableHead>
                      <TableHead className="text-center bg-red-500/10">Put OI</TableHead>
                      <TableHead className="text-center bg-red-500/10">Put Vol</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {optionsChain.map((option) => (
                  <TableRow key={option.strike} className={getRowHighlight(option)}>
                    {(viewType === 'straddle' || viewType === 'calls') && (
                      <>
                        <TableCell className="text-center">{option.callVolume}</TableCell>
                        <TableCell className="text-center">{option.callOI.toLocaleString()}</TableCell>
                        <TableCell className="text-center text-green-500">${option.callBid}</TableCell>
                        <TableCell className="text-center text-green-600">${option.callAsk}</TableCell>
                        <TableCell className={`text-center ${getDeltaColor(option.callDelta)}`}>
                          {option.callDelta.toFixed(2)}
                        </TableCell>
                      </>
                    )}
                    <TableCell className="text-center font-bold bg-muted/50">
                      <div className="flex items-center justify-center gap-1">
                        ${option.strike}
                        {option.itm === 'atm' && (
                          <Badge variant="outline" className="text-xs">ATM</Badge>
                        )}
                        {option.strike < stockPrice && viewType !== 'puts' && (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        )}
                        {option.strike > stockPrice && viewType !== 'calls' && (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    {(viewType === 'straddle' || viewType === 'puts') && (
                      <>
                        <TableCell className={`text-center ${getDeltaColor(option.putDelta)}`}>
                          {option.putDelta.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center text-red-500">${option.putBid}</TableCell>
                        <TableCell className="text-center text-red-600">${option.putAsk}</TableCell>
                        <TableCell className="text-center">{option.putOI.toLocaleString()}</TableCell>
                        <TableCell className="text-center">{option.putVolume}</TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-500/10 rounded-lg">
              <h4 className="font-semibold text-green-500 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Call Options (ITM)
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Strikes below ${stockPrice.toFixed(2)} are in-the-money for calls
              </p>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg">
              <h4 className="font-semibold flex items-center gap-2">
                <Target className="h-4 w-4" />
                At-The-Money (ATM)
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Highest gamma and theta decay at ATM strikes
              </p>
            </div>
            <div className="p-4 bg-red-500/10 rounded-lg">
              <h4 className="font-semibold text-red-500 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Put Options (ITM)
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Strikes above ${stockPrice.toFixed(2)} are in-the-money for puts
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
