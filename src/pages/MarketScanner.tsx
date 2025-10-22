import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RefreshCw, TrendingUp, Activity } from 'lucide-react';

interface UnusualActivity {
  symbol: string;
  currentPrice: number;
  volumeRatio: number;
  optionsVolume: number;
  callPutRatio: number;
  ivChange: number;
  timestamp: string;
}

const MarketScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [activities, setActivities] = useState<UnusualActivity[]>([]);

  useEffect(() => {
    scanMarket();
  }, []);

  const scanMarket = async () => {
    setScanning(true);
    toast.info('Scanning for unusual options activity...');

    // Simulate market scanning (in production, this would query real market data)
    await new Promise(resolve => setTimeout(resolve, 2000));

    const symbols = ['AAPL', 'TSLA', 'NVDA', 'SPY', 'QQQ', 'META', 'AMZN', 'GOOGL', 'MSFT'];
    const mockActivities: UnusualActivity[] = symbols.map(symbol => ({
      symbol,
      currentPrice: 100 + Math.random() * 200,
      volumeRatio: 1 + Math.random() * 4, // 1x to 5x normal volume
      optionsVolume: Math.floor(Math.random() * 50000) + 10000,
      callPutRatio: Math.random() * 3, // 0 to 3
      ivChange: (Math.random() * 60) - 30, // -30% to +30%
      timestamp: new Date().toISOString()
    })).filter(activity => activity.volumeRatio > 2 || Math.abs(activity.ivChange) > 15); // Only show significant activity

    setActivities(mockActivities.sort((a, b) => b.volumeRatio - a.volumeRatio));
    setScanning(false);
    toast.success(`Found ${mockActivities.length} stocks with unusual activity`);
  };

  const getSignificanceColor = (volumeRatio: number) => {
    if (volumeRatio >= 4) return 'bg-red-500';
    if (volumeRatio >= 3) return 'bg-orange-500';
    return 'bg-yellow-500';
  };

  const getSentiment = (callPutRatio: number) => {
    if (callPutRatio > 1.5) return { label: 'Bullish', color: 'bg-green-500/20 text-green-700 dark:text-green-400' };
    if (callPutRatio < 0.67) return { label: 'Bearish', color: 'bg-red-500/20 text-red-700 dark:text-red-400' };
    return { label: 'Neutral', color: 'bg-gray-500/20 text-gray-700 dark:text-gray-400' };
  };

  return (
    <PageLayout title="Market Scanner">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Unusual Options Activity</CardTitle>
              <CardDescription>Real-time monitoring of significant options flow and unusual volume</CardDescription>
            </div>
            <Button onClick={scanMarket} disabled={scanning}>
              <RefreshCw className={`h-4 w-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Scanning...' : 'Scan Market'}
            </Button>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No unusual activity detected. Click "Scan Market" to start monitoring.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Volume Ratio</TableHead>
                    <TableHead>Options Vol</TableHead>
                    <TableHead>C/P Ratio</TableHead>
                    <TableHead>Sentiment</TableHead>
                    <TableHead>IV Change</TableHead>
                    <TableHead>Detected</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity, index) => {
                    const sentiment = getSentiment(activity.callPutRatio);
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-bold">{activity.symbol}</TableCell>
                        <TableCell>${activity.currentPrice.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={getSignificanceColor(activity.volumeRatio)}>
                              {activity.volumeRatio.toFixed(1)}x
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{(activity.optionsVolume / 1000).toFixed(0)}K</TableCell>
                        <TableCell>{activity.callPutRatio.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={sentiment.color}>{sentiment.label}</Badge>
                        </TableCell>
                        <TableCell className={activity.ivChange >= 0 ? 'text-green-500 font-semibold' : 'text-red-500 font-semibold'}>
                          {activity.ivChange >= 0 ? '+' : ''}{activity.ivChange.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                What to Look For
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="space-y-2">
                <li>• <strong>Volume Ratio &gt; 3x:</strong> Extremely unusual activity</li>
                <li>• <strong>Call/Put Ratio &gt; 2:</strong> Strong bullish sentiment</li>
                <li>• <strong>IV Change &gt; +20%:</strong> Anticipation of big move</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Trading Signals
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="space-y-2">
                <li>• Large call buying = Potential breakout</li>
                <li>• Large put buying = Potential breakdown</li>
                <li>• High volume + IV spike = Earnings/news</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Risk Warning</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Unusual options activity doesn't guarantee price movement. Always combine with your own analysis and risk management.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default MarketScanner;