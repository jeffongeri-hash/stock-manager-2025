import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useStockData } from '@/hooks/useStockData';
import { toast } from 'sonner';

export default function OptionsPremium() {
  const [symbol, setSymbol] = useState('AAPL');
  const [strikePrice, setStrikePrice] = useState('');
  const [daysToExpiry, setDaysToExpiry] = useState('30');
  const [optionType, setOptionType] = useState<'call' | 'put'>('call');
  const [volatility, setVolatility] = useState('0.25');
  const [optionsData, setOptionsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const { stocks } = useStockData([symbol]);
  const stockPrice = stocks[0]?.price || 0;
  
  const fetchOptionsData = async () => {
    if (!stockPrice || !strikePrice || !daysToExpiry) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-options-data', {
        body: {
          symbol,
          stockPrice,
          strikePrice: parseFloat(strikePrice),
          daysToExpiry: parseInt(daysToExpiry),
          volatility: parseFloat(volatility),
          optionType
        }
      });

      if (error) throw error;
      setOptionsData(data);
    } catch (err) {
      console.error('Error fetching options data:', err);
      toast.error('Failed to fetch options data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stockPrice && !strikePrice) {
      setStrikePrice(stockPrice.toString());
    }
  }, [stockPrice]);

  useEffect(() => {
    if (stockPrice && strikePrice && daysToExpiry) {
      fetchOptionsData();
    }
  }, [symbol, stockPrice]);

  return (
    <PageLayout title="Options Premium Calculator">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Option Parameters</CardTitle>
            <CardDescription>Configure options parameters with live stock data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="symbol">Stock Symbol</Label>
              <Input
                id="symbol"
                type="text"
                placeholder="AAPL"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                onBlur={fetchOptionsData}
              />
              {stockPrice > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Current Price: ${stockPrice.toFixed(2)}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="optionType">Option Type</Label>
              <Select value={optionType} onValueChange={(value: 'call' | 'put') => setOptionType(value)}>
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
              <Label htmlFor="strike">Strike Price</Label>
              <Input
                id="strike"
                type="number"
                step="0.01"
                placeholder="150.00"
                value={strikePrice}
                onChange={(e) => setStrikePrice(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="dte">Days to Expiration</Label>
              <Input
                id="dte"
                type="number"
                placeholder="30"
                value={daysToExpiry}
                onChange={(e) => setDaysToExpiry(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="vol">Implied Volatility (decimal)</Label>
              <Input
                id="vol"
                type="number"
                step="0.01"
                placeholder="0.25"
                value={volatility}
                onChange={(e) => setVolatility(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Example: 0.25 = 25% volatility
              </p>
            </div>

            <Button onClick={fetchOptionsData} className="w-full" disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Calculate
            </Button>
          </CardContent>
        </Card>

        {optionsData && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Option Pricing</CardTitle>
                <CardDescription>Theoretical price and Greeks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Theoretical Price</p>
                  <p className="text-3xl font-bold">${optionsData.greeks.price}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Delta</p>
                    <p className="text-xl">{optionsData.greeks.delta}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Gamma</p>
                    <p className="text-xl">{optionsData.greeks.gamma}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Theta</p>
                    <p className="text-xl">{optionsData.greeks.theta}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Vega</p>
                    <p className="text-xl">{optionsData.greeks.vega}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Expected Move</CardTitle>
                <CardDescription>Projected price movement based on volatility</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-card rounded-lg border">
                    <p className="text-sm text-muted-foreground">Expected Move</p>
                    <p className="text-2xl font-bold">±${optionsData.expectedMove.amount}</p>
                    <p className="text-sm text-muted-foreground">±{optionsData.expectedMove.percent}%</p>
                  </div>
                  <div className="p-4 bg-card rounded-lg border">
                    <p className="text-sm text-muted-foreground">Upper Bound</p>
                    <p className="text-2xl font-bold text-green-500">${optionsData.expectedMove.upperBound}</p>
                  </div>
                  <div className="p-4 bg-card rounded-lg border">
                    <p className="text-sm text-muted-foreground">Lower Bound</p>
                    <p className="text-2xl font-bold text-red-500">${optionsData.expectedMove.lowerBound}</p>
                  </div>
                  <div className="p-4 bg-card rounded-lg border">
                    <p className="text-sm text-muted-foreground">Current Price</p>
                    <p className="text-2xl font-bold">${stockPrice.toFixed(2)}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm font-medium mb-2">Suggested Strike Prices</p>
                  <div className="flex flex-wrap gap-2">
                    {optionsData.suggestedStrikes.map((strike: number) => (
                      <Button
                        key={strike}
                        variant={strike === parseFloat(strikePrice) ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStrikePrice(strike.toString())}
                      >
                        ${strike}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PageLayout>
  );
}
