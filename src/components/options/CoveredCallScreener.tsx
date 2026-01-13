import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Search, Filter, TrendingUp, DollarSign, Target, Eye } from 'lucide-react';
import { useWatchlistActions } from '@/hooks/useWatchlistActions';

interface CoveredCallOpportunity {
  id: string;
  symbol: string;
  stockPrice: number;
  strikePrice: number;
  premium: number;
  expiration: string;
  daysToExpiry: number;
  delta: number;
  annualizedReturn: number;
  downProtection: number;
  maxProfit: number;
  breakeven: number;
}

export const CoveredCallScreener = () => {
  const { addToWatchlist, isLoggedIn } = useWatchlistActions();
  const [symbols, setSymbols] = useState('AAPL, MSFT, GOOGL, AMZN, NVDA');
  const [maxDelta, setMaxDelta] = useState([0.30]);
  const [minPremium, setMinPremium] = useState([2]);
  const [minAnnualizedReturn, setMinAnnualizedReturn] = useState([15]);
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<CoveredCallOpportunity[]>([]);

  // Mock data generator for demonstration
  const generateMockResults = (): CoveredCallOpportunity[] => {
    const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
    const mockResults: CoveredCallOpportunity[] = [];

    symbolList.forEach((symbol) => {
      const basePrice = Math.random() * 200 + 50;
      const strikes = [1.02, 1.05, 1.08, 1.10].map(mult => Math.round(basePrice * mult));

      strikes.forEach((strike, i) => {
        const daysToExpiry = [7, 14, 30, 45][i];
        const delta = Math.random() * 0.35 + 0.15;
        const premium = basePrice * (0.01 + Math.random() * 0.03);
        const annualizedReturn = (premium / basePrice) * (365 / daysToExpiry) * 100;

        if (delta <= maxDelta[0] && premium >= minPremium[0] && annualizedReturn >= minAnnualizedReturn[0]) {
          mockResults.push({
            id: `${symbol}-${strike}-${daysToExpiry}`,
            symbol,
            stockPrice: parseFloat(basePrice.toFixed(2)),
            strikePrice: strike,
            premium: parseFloat(premium.toFixed(2)),
            expiration: new Date(Date.now() + daysToExpiry * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            daysToExpiry,
            delta: parseFloat(delta.toFixed(2)),
            annualizedReturn: parseFloat(annualizedReturn.toFixed(1)),
            downProtection: parseFloat((premium / basePrice * 100).toFixed(2)),
            maxProfit: parseFloat(((strike - basePrice) + premium).toFixed(2)),
            breakeven: parseFloat((basePrice - premium).toFixed(2))
          });
        }
      });
    });

    return mockResults.sort((a, b) => b.annualizedReturn - a.annualizedReturn).slice(0, 20);
  };

  const handleScan = () => {
    setIsScanning(true);
    // Simulate API call
    setTimeout(() => {
      setResults(generateMockResults());
      setIsScanning(false);
    }, 1500);
  };

  const getDeltaColor = (delta: number) => {
    if (delta <= 0.20) return 'bg-green-500/10 text-green-500 border-green-500/50';
    if (delta <= 0.30) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50';
    return 'bg-red-500/10 text-red-500 border-red-500/50';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Covered Call Screener
          </CardTitle>
          <CardDescription>
            Find optimal covered call opportunities with delta ≤0.30 for higher probability trades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Stock Symbols (comma-separated)</Label>
              <Input
                value={symbols}
                onChange={(e) => setSymbols(e.target.value)}
                placeholder="AAPL, MSFT, GOOGL"
              />
            </div>

            <div className="space-y-2">
              <Label>Maximum Delta: {maxDelta[0]}</Label>
              <Slider
                value={maxDelta}
                onValueChange={setMaxDelta}
                min={0.10}
                max={0.50}
                step={0.05}
              />
              <p className="text-xs text-muted-foreground">
                Lower delta = higher probability of keeping premium (recommended ≤0.30)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Minimum Premium: ${minPremium[0]}</Label>
              <Slider
                value={minPremium}
                onValueChange={setMinPremium}
                min={0.5}
                max={10}
                step={0.5}
              />
            </div>

            <div className="space-y-2">
              <Label>Minimum Annualized Return: {minAnnualizedReturn[0]}%</Label>
              <Slider
                value={minAnnualizedReturn}
                onValueChange={setMinAnnualizedReturn}
                min={5}
                max={50}
                step={5}
              />
            </div>
          </div>

          <Button onClick={handleScan} disabled={isScanning} className="w-full">
            <Filter className="h-4 w-4 mr-2" />
            {isScanning ? 'Scanning...' : 'Scan for Opportunities'}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Screener Results ({results.length} opportunities)
            </CardTitle>
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
                    <TableHead>DTE</TableHead>
                    <TableHead>Delta</TableHead>
                    <TableHead>Annual Return</TableHead>
                    <TableHead>Downside Protection</TableHead>
                    <TableHead>Max Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((opp) => (
                    <TableRow key={opp.id}>
                      <TableCell className="font-bold">
                        <div className="flex items-center gap-2">
                          {opp.symbol}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => addToWatchlist(opp.symbol)}
                            disabled={!isLoggedIn}
                            title={!isLoggedIn ? 'Sign in to add to watchlist' : 'Add to watchlist'}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>${opp.stockPrice.toFixed(2)}</TableCell>
                      <TableCell>${opp.strikePrice}</TableCell>
                      <TableCell className="text-green-500 font-medium">
                        ${opp.premium.toFixed(2)}
                      </TableCell>
                      <TableCell>{opp.daysToExpiry}d</TableCell>
                      <TableCell>
                        <Badge className={getDeltaColor(opp.delta)}>
                          {opp.delta.toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-primary font-bold">
                        {opp.annualizedReturn.toFixed(1)}%
                      </TableCell>
                      <TableCell>{opp.downProtection.toFixed(2)}%</TableCell>
                      <TableCell>${opp.maxProfit.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Target className="h-4 w-4" />
                Covered Call Guidelines
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <strong>Delta ≤0.30:</strong> ~70% probability of expiring worthless (keeping premium)</li>
                <li>• <strong>Delta 0.20-0.25:</strong> Sweet spot for income generation vs capital appreciation</li>
                <li>• <strong>30-45 DTE:</strong> Optimal time decay (theta) without excessive gamma risk</li>
                <li>• <strong>OTM Strikes:</strong> 5-10% above current price for upside participation</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
