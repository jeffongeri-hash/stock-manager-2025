import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useStockData } from '@/hooks/useStockData';
import { Search, TrendingUp, DollarSign, Target, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface OptionsData {
  symbol: string;
  stockPrice: number;
  strike: number;
  premium: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  daysToExpiry: number;
  annualizedReturn: number;
  downProtection: number;
  maxProfit: number;
  breakeven: number;
  iv: number;
}

export const CoveredCallAnalyzer = () => {
  const [symbols, setSymbols] = useState('AAPL, MSFT, GOOGL');
  const [targetDelta, setTargetDelta] = useState([0.25]);
  const [daysToExpiry, setDaysToExpiry] = useState([30]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<OptionsData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const symbolList = symbols.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
  const { stocks, loading: stocksLoading } = useStockData(symbolList);

  const fetchOptionsData = async () => {
    if (symbolList.length === 0) {
      toast.error('Please enter at least one symbol');
      return;
    }

    setIsLoading(true);
    setError(null);
    const optionsResults: OptionsData[] = [];

    try {
      for (const symbol of symbolList) {
        const stockData = stocks.find(s => s.symbol === symbol);
        const stockPrice = stockData?.price || 0;

        if (stockPrice === 0) continue;

        // Calculate strike based on target delta (OTM)
        const strikeMultiplier = 1 + (0.30 - targetDelta[0]) * 0.5; // Higher delta = closer to ATM
        const strike = Math.round(stockPrice * strikeMultiplier / 2.5) * 2.5; // Round to nearest $2.50

        const { data, error: fetchError } = await supabase.functions.invoke('fetch-options-data', {
          body: {
            symbol,
            stockPrice,
            strikePrice: strike,
            daysToExpiry: daysToExpiry[0],
            volatility: 0.25, // Default IV
            optionType: 'call'
          }
        });

        if (fetchError) {
          console.error(`Error fetching options for ${symbol}:`, fetchError);
          continue;
        }

        const premium = data.theoreticalPrice || data.price || 0;
        const annualizedReturn = stockPrice > 0 ? (premium / stockPrice) * (365 / daysToExpiry[0]) * 100 : 0;

        optionsResults.push({
          symbol,
          stockPrice,
          strike,
          premium: parseFloat(premium.toFixed(2)),
          delta: Math.abs(data.greeks?.delta || 0),
          gamma: data.greeks?.gamma || 0,
          theta: data.greeks?.theta || 0,
          vega: data.greeks?.vega || 0,
          daysToExpiry: daysToExpiry[0],
          annualizedReturn: parseFloat(annualizedReturn.toFixed(1)),
          downProtection: parseFloat(((premium / stockPrice) * 100).toFixed(2)),
          maxProfit: parseFloat(((strike - stockPrice + premium) * 100).toFixed(2)),
          breakeven: parseFloat((stockPrice - premium).toFixed(2)),
          iv: (data.iv || 0.25) * 100
        });
      }

      setResults(optionsResults.sort((a, b) => b.annualizedReturn - a.annualizedReturn));
      
      if (optionsResults.length === 0) {
        setError('No options data found. Make sure symbols have valid stock prices.');
      } else {
        toast.success(`Analyzed ${optionsResults.length} covered call opportunities`);
      }
    } catch (err) {
      console.error('Error analyzing options:', err);
      setError('Failed to fetch options data. Please try again.');
      toast.error('Failed to analyze options');
    } finally {
      setIsLoading(false);
    }
  };

  const getDeltaColor = (delta: number) => {
    if (delta <= 0.20) return 'bg-green-500/10 text-green-500 border-green-500/50';
    if (delta <= 0.30) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50';
    return 'bg-red-500/10 text-red-500 border-red-500/50';
  };

  const getReturnColor = (annualizedReturn: number) => {
    if (annualizedReturn >= 25) return 'text-green-500 font-bold';
    if (annualizedReturn >= 15) return 'text-primary font-semibold';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Covered Call Analyzer
          </CardTitle>
          <CardDescription>
            Fetch real options data and calculate optimal covered call opportunities for your stocks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2 space-y-2">
              <Label>Stock Symbols (comma-separated)</Label>
              <Input
                value={symbols}
                onChange={(e) => setSymbols(e.target.value)}
                placeholder="AAPL, MSFT, GOOGL, NVDA"
              />
              <p className="text-xs text-muted-foreground">
                Enter watchlist symbols to analyze covered call opportunities
              </p>
            </div>

            <div className="space-y-2">
              <Label>Target Delta: {targetDelta[0].toFixed(2)}</Label>
              <Slider
                value={targetDelta}
                onValueChange={setTargetDelta}
                min={0.10}
                max={0.40}
                step={0.05}
              />
              <p className="text-xs text-muted-foreground">
                {targetDelta[0] <= 0.20 ? '~80% OTM prob' : targetDelta[0] <= 0.30 ? '~70% OTM prob' : '~60% OTM prob'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Days to Expiry: {daysToExpiry[0]}</Label>
              <Slider
                value={daysToExpiry}
                onValueChange={setDaysToExpiry}
                min={7}
                max={60}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                {daysToExpiry[0] <= 14 ? 'Weekly' : daysToExpiry[0] <= 35 ? 'Monthly (optimal)' : 'Extended'}
              </p>
            </div>
          </div>

          <Button 
            onClick={fetchOptionsData} 
            disabled={isLoading || stocksLoading} 
            className="w-full"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyzing Options...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Analyze Covered Calls
              </>
            )}
          </Button>

          {stocksLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading stock prices...
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {results.length > 0 && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Analysis Results ({results.length} stocks)
            </CardTitle>
            <CardDescription>
              Sorted by annualized return. Green delta values indicate higher probability trades.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Stock Price</TableHead>
                    <TableHead>Strike</TableHead>
                    <TableHead>Premium</TableHead>
                    <TableHead>Delta</TableHead>
                    <TableHead>Theta</TableHead>
                    <TableHead>IV</TableHead>
                    <TableHead>DTE</TableHead>
                    <TableHead>Annual Return</TableHead>
                    <TableHead>Protection</TableHead>
                    <TableHead>Breakeven</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((option) => (
                    <TableRow key={option.symbol}>
                      <TableCell className="font-bold">{option.symbol}</TableCell>
                      <TableCell>${option.stockPrice.toFixed(2)}</TableCell>
                      <TableCell>${option.strike.toFixed(2)}</TableCell>
                      <TableCell className="text-green-500 font-medium">
                        ${option.premium.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getDeltaColor(option.delta)}>
                          {option.delta.toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-green-500">
                        ${option.theta.toFixed(2)}/day
                      </TableCell>
                      <TableCell>{option.iv.toFixed(0)}%</TableCell>
                      <TableCell>{option.daysToExpiry}d</TableCell>
                      <TableCell className={getReturnColor(option.annualizedReturn)}>
                        {option.annualizedReturn.toFixed(1)}%
                      </TableCell>
                      <TableCell>{option.downProtection.toFixed(2)}%</TableCell>
                      <TableCell>${option.breakeven.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-500/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="font-semibold text-green-500">Top Premium</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  ${Math.max(...results.map(r => r.premium)).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {results.find(r => r.premium === Math.max(...results.map(r => r.premium)))?.symbol}
                </p>
              </div>

              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Best Annual Return</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {Math.max(...results.map(r => r.annualizedReturn)).toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {results.find(r => r.annualizedReturn === Math.max(...results.map(r => r.annualizedReturn)))?.symbol}
                </p>
              </div>

              <div className="p-4 bg-blue-500/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold text-blue-500">Avg Delta</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {(results.reduce((sum, r) => sum + r.delta, 0) / results.length).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {(1 - results.reduce((sum, r) => sum + r.delta, 0) / results.length) * 100 | 0}% prob OTM
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
