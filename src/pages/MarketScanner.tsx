import React, { useState, useEffect, useCallback } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RefreshCw, TrendingUp, TrendingDown, Activity, Clock, DollarSign, Loader2, Info, Shield } from 'lucide-react';

interface LeapsOption {
  symbol: string;
  stockPrice: number;
  strike: number;
  expiration: string;
  daysToExpiry: number;
  optionType: 'call' | 'put';
  bid: number;
  ask: number;
  lastPrice: number;
  impliedVolatility: number;
  openInterest: number;
  volume: number;
  delta: number;
  theta: number;
  breakeven: number;
  annualizedReturn: number;
}

interface CoveredCallOption {
  symbol: string;
  stockPrice: number;
  strike: number;
  expiration: string;
  daysToExpiry: number;
  premium: number;
  premiumPercent: number;
  annualizedReturn: number;
  downProtection: number;
  maxProfit: number;
  maxProfitPercent: number;
  openInterest: number;
  impliedVolatility: number;
}

const MarketScanner = () => {
  const [activeTab, setActiveTab] = useState('leaps');
  const [scanning, setScanning] = useState(false);
  const [leapsData, setLeapsData] = useState<LeapsOption[]>([]);
  const [coveredCallsData, setCoveredCallsData] = useState<CoveredCallOption[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLiveData, setIsLiveData] = useState(false);

  const scanOptions = useCallback(async (scanType: 'leaps' | 'covered_calls') => {
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('scan-options', {
        body: { scanType }
      });

      if (error) throw error;

      if (data?.success && data.data) {
        if (scanType === 'leaps') {
          setLeapsData(data.data);
        } else {
          setCoveredCallsData(data.data);
        }
        setIsLiveData(true);
        setLastUpdated(new Date());
        toast.success(`Found ${data.data.length} ${scanType === 'leaps' ? 'LEAPS' : 'covered call'} opportunities`);
      } else {
        throw new Error(data?.error || 'Failed to scan options');
      }
    } catch (error) {
      console.error('Error scanning options:', error);
      toast.error('Failed to scan options market');
      setIsLiveData(false);
    } finally {
      setScanning(false);
    }
  }, []);

  useEffect(() => {
    scanOptions('leaps');
    scanOptions('covered_calls');
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: '2-digit' 
    });
  };

  const getReturnColor = (value: number) => {
    if (value >= 40) return 'text-chart-1 font-bold';
    if (value >= 25) return 'text-primary font-semibold';
    if (value >= 15) return 'text-foreground';
    return 'text-muted-foreground';
  };

  return (
    <PageLayout title="Options Scanner">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="leaps" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              LEAPS Scanner
            </TabsTrigger>
            <TabsTrigger value="covered_calls" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Covered Calls &lt;$20
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3">
            <Badge variant={isLiveData ? 'default' : 'secondary'} className="text-xs">
              {isLiveData ? '🔴 Live' : '📦 Sample'}
            </Badge>
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button 
              onClick={() => scanOptions(activeTab as 'leaps' | 'covered_calls')} 
              disabled={scanning}
              size="sm"
            >
              {scanning ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {scanning ? 'Scanning...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* LEAPS Scanner Tab */}
        <TabsContent value="leaps" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  What are LEAPS?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Long-Term Equity Anticipation Securities (LEAPS) are options with expiration dates 
                  9+ months out. They provide leverage with less time decay pressure than short-term options.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-chart-1" />
                  LEAPS Calls
                </h3>
                <p className="text-sm text-muted-foreground">
                  Buy deep ITM calls as stock replacement. Target delta of 0.70+ for stock-like movement 
                  at a fraction of the cost.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  LEAPS Puts
                </h3>
                <p className="text-sm text-muted-foreground">
                  Sell cash-secured puts to accumulate shares at lower prices while collecting premium. 
                  Target strikes you'd want to own.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                LEAPS Opportunities
              </CardTitle>
              <CardDescription>
                Options expiring in 9+ months • Sorted by annualized return potential
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leapsData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {scanning ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Scanning for LEAPS opportunities...
                    </div>
                  ) : (
                    'No LEAPS data available. Click Refresh to scan.'
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Strike</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Bid/Ask</TableHead>
                        <TableHead>IV</TableHead>
                        <TableHead>Delta</TableHead>
                        <TableHead>Breakeven</TableHead>
                        <TableHead>Ann. Return</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leapsData.slice(0, 30).map((option, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-bold">{option.symbol}</TableCell>
                          <TableCell>
                            <Badge className={option.optionType === 'call' ? 'bg-chart-1/20 text-chart-1' : 'bg-destructive/20 text-destructive'}>
                              {option.optionType.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>${option.stockPrice.toFixed(2)}</TableCell>
                          <TableCell>${option.strike.toFixed(0)}</TableCell>
                          <TableCell>{formatDate(option.expiration)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{option.daysToExpiry}d</Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            ${option.bid.toFixed(2)} / ${option.ask.toFixed(2)}
                          </TableCell>
                          <TableCell>{option.impliedVolatility.toFixed(1)}%</TableCell>
                          <TableCell className={option.delta > 0 ? 'text-chart-1' : 'text-destructive'}>
                            {option.delta.toFixed(2)}
                          </TableCell>
                          <TableCell>${option.breakeven.toFixed(2)}</TableCell>
                          <TableCell className={getReturnColor(option.annualizedReturn)}>
                            {option.annualizedReturn.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Covered Calls Tab */}
        <TabsContent value="covered_calls" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Covered Call Strategy
                </h3>
                <p className="text-sm text-muted-foreground">
                  Own 100 shares of stock and sell a call against it. Collect premium for income while 
                  providing downside protection. Max profit is capped at strike price.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-chart-1" />
                  Stocks Under $20
                </h3>
                <p className="text-sm text-muted-foreground">
                  Lower-priced stocks make covered calls more accessible. 100 shares costs less than $2,000, 
                  making it easier to start generating income.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-warning" />
                  Key Metrics
                </h3>
                <p className="text-sm text-muted-foreground">
                  Look for high annualized returns, reasonable downside protection, and 
                  sufficient open interest for liquidity.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Covered Call Opportunities (Stocks &lt;$20)
              </CardTitle>
              <CardDescription>
                OTM calls on affordable stocks • 14-45 days to expiration • Sorted by annualized return
              </CardDescription>
            </CardHeader>
            <CardContent>
              {coveredCallsData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {scanning ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Scanning for covered call opportunities...
                    </div>
                  ) : (
                    'No covered call data available. Click Refresh to scan.'
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Stock Price</TableHead>
                        <TableHead>Strike</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Premium</TableHead>
                        <TableHead>Premium %</TableHead>
                        <TableHead>Ann. Return</TableHead>
                        <TableHead>Protection</TableHead>
                        <TableHead>Max Profit</TableHead>
                        <TableHead>IV</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coveredCallsData.slice(0, 30).map((option, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-bold">{option.symbol}</TableCell>
                          <TableCell>${option.stockPrice.toFixed(2)}</TableCell>
                          <TableCell>${option.strike.toFixed(2)}</TableCell>
                          <TableCell>{formatDate(option.expiration)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{option.daysToExpiry}d</Badge>
                          </TableCell>
                          <TableCell className="text-chart-1 font-semibold">
                            ${option.premium.toFixed(2)}
                          </TableCell>
                          <TableCell>{option.premiumPercent.toFixed(1)}%</TableCell>
                          <TableCell className={getReturnColor(option.annualizedReturn)}>
                            {option.annualizedReturn.toFixed(0)}%
                          </TableCell>
                          <TableCell className="text-primary">
                            {option.downProtection.toFixed(1)}%
                          </TableCell>
                          <TableCell>
                            ${option.maxProfit.toFixed(2)} ({option.maxProfitPercent.toFixed(1)}%)
                          </TableCell>
                          <TableCell>{option.impliedVolatility.toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cost Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Cost Calculator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">$5 Stock</p>
                  <p className="font-bold">100 shares = $500</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">$10 Stock</p>
                  <p className="font-bold">100 shares = $1,000</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">$15 Stock</p>
                  <p className="font-bold">100 shares = $1,500</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">$20 Stock</p>
                  <p className="font-bold">100 shares = $2,000</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default MarketScanner;
