import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useStockData } from '@/hooks/useStockData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ExpectedMove() {
  const [symbol, setSymbol] = useState('AAPL');
  const [daysToExpiry, setDaysToExpiry] = useState('30');
  const [volatility, setVolatility] = useState('0.25');
  const [optionsData, setOptionsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const { stocks } = useStockData([symbol]);
  const stockPrice = stocks[0]?.price || 0;

  const fetchExpectedMove = async () => {
    if (!stockPrice || !daysToExpiry) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-options-data', {
        body: {
          symbol,
          stockPrice,
          strikePrice: stockPrice, // Use ATM for expected move
          daysToExpiry: parseInt(daysToExpiry),
          volatility: parseFloat(volatility),
          optionType: 'call'
        }
      });

      if (error) throw error;
      setOptionsData(data);
    } catch (err) {
      console.error('Error fetching expected move:', err);
      toast.error('Failed to calculate expected move');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stockPrice && daysToExpiry) {
      fetchExpectedMove();
    }
  }, [symbol, stockPrice]);

  return (
    <PageLayout title="Expected Move Calculator">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Calculate Expected Stock Movement</CardTitle>
            <CardDescription>Based on implied volatility and time to expiration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="symbol">Stock Symbol</Label>
                <Input
                  id="symbol"
                  type="text"
                  placeholder="AAPL"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  onBlur={fetchExpectedMove}
                />
                {stockPrice > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Current: ${stockPrice.toFixed(2)}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="days">Days to Expiration</Label>
                <Input
                  id="days"
                  type="number"
                  placeholder="30"
                  value={daysToExpiry}
                  onChange={(e) => setDaysToExpiry(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="vol">Implied Volatility</Label>
                <Input
                  id="vol"
                  type="number"
                  step="0.01"
                  placeholder="0.25"
                  value={volatility}
                  onChange={(e) => setVolatility(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">0.25 = 25%</p>
              </div>
            </div>

            <Button onClick={fetchExpectedMove} disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Calculate
            </Button>
          </CardContent>
        </Card>

        {optionsData && (
          <Card>
            <CardHeader>
              <CardTitle>Expected Price Movement for {symbol}</CardTitle>
              <CardDescription>One standard deviation move (68% probability)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 bg-card rounded-lg border text-center">
                  <p className="text-sm text-muted-foreground mb-2">Current Price</p>
                  <p className="text-3xl font-bold">${stockPrice.toFixed(2)}</p>
                </div>

                <div className="p-6 bg-green-500/10 border-green-500/50 rounded-lg border text-center">
                  <p className="text-sm text-muted-foreground mb-2">Upper Bound</p>
                  <p className="text-3xl font-bold text-green-500">
                    ${optionsData.expectedMove.upperBound}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    +{((optionsData.expectedMove.upperBound - stockPrice) / stockPrice * 100).toFixed(2)}%
                  </p>
                </div>

                <div className="p-6 bg-red-500/10 border-red-500/50 rounded-lg border text-center">
                  <p className="text-sm text-muted-foreground mb-2">Lower Bound</p>
                  <p className="text-3xl font-bold text-red-500">
                    ${optionsData.expectedMove.lowerBound}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {((optionsData.expectedMove.lowerBound - stockPrice) / stockPrice * 100).toFixed(2)}%
                  </p>
                </div>

                <div className="p-6 bg-primary/10 border-primary/50 rounded-lg border text-center">
                  <p className="text-sm text-muted-foreground mb-2">Expected Move</p>
                  <p className="text-3xl font-bold">±${optionsData.expectedMove.amount}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    ±{optionsData.expectedMove.percent}%
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold mb-2">What This Means:</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• There's a 68% probability the stock will stay between ${optionsData.expectedMove.lowerBound} and ${optionsData.expectedMove.upperBound}</li>
                  <li>• Based on {(parseFloat(volatility) * 100).toFixed(0)}% implied volatility over {daysToExpiry} days</li>
                  <li>• Use this to size option positions and set strike prices</li>
                  <li>• Higher volatility = larger expected moves</li>
                </ul>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold mb-3">Suggested Trading Strategies</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-card rounded-lg border">
                    <h4 className="font-medium text-green-600 mb-2">Bullish Outlook</h4>
                    <p className="text-sm text-muted-foreground">
                      Consider selling put spreads below ${optionsData.expectedMove.lowerBound} or buying calls near the money
                    </p>
                  </div>
                  <div className="p-4 bg-card rounded-lg border">
                    <h4 className="font-medium text-red-600 mb-2">Bearish Outlook</h4>
                    <p className="text-sm text-muted-foreground">
                      Consider selling call spreads above ${optionsData.expectedMove.upperBound} or buying puts near the money
                    </p>
                  </div>
                  <div className="p-4 bg-card rounded-lg border">
                    <h4 className="font-medium text-blue-600 mb-2">Neutral/Range Bound</h4>
                    <p className="text-sm text-muted-foreground">
                      Consider iron condors with short strikes outside the expected move range
                    </p>
                  </div>
                  <div className="p-4 bg-card rounded-lg border">
                    <h4 className="font-medium text-purple-600 mb-2">High Volatility Play</h4>
                    <p className="text-sm text-muted-foreground">
                      Consider straddles/strangles if you expect movement beyond ±{optionsData.expectedMove.percent}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
