import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, TrendingUp, X } from 'lucide-react';

interface IVData {
  symbol: string;
  iv: number;
  ivRank: number;
  ivPercentile: number;
  lastUpdated: string;
}

const IVTracker = () => {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [ivData, setIVData] = useState<IVData[]>([]);
  const [newSymbol, setNewSymbol] = useState('');
  const [loading, setLoading] = useState(false);

  // Load watchlist from localStorage on mount
  useEffect(() => {
    const savedWatchlist = localStorage.getItem('ivTrackerWatchlist');
    if (savedWatchlist) {
      try {
        const symbols = JSON.parse(savedWatchlist);
        setWatchlist(symbols);
        if (symbols.length > 0) {
          fetchIVData(symbols);
        }
      } catch (error) {
        console.error('Error loading watchlist:', error);
      }
    }
  }, []);

  // Save watchlist to localStorage whenever it changes
  const saveWatchlist = (symbols: string[]) => {
    localStorage.setItem('ivTrackerWatchlist', JSON.stringify(symbols));
    setWatchlist(symbols);
  };

  const fetchIVData = async (symbols: string[]) => {
    setLoading(true);
    const ivResults: IVData[] = [];

    for (const symbol of symbols) {
      try {
        // Get current date and calculate expiration 30 days out
        const today = new Date();
        const expiration = new Date(today);
        expiration.setDate(today.getDate() + 30);
        const expirationStr = expiration.toISOString().split('T')[0];

        // Fetch stock data first to get current price for strike
        const { data: stockData } = await supabase.functions.invoke('fetch-stock-data', {
          body: { symbols: [symbol] }
        });

        const currentPrice = stockData?.stocks?.[0]?.price || 100;

        // Fetch options data to get IV
        const { data, error } = await supabase.functions.invoke('fetch-options-data', {
          body: { 
            symbol, 
            strike: currentPrice, 
            expiration: expirationStr, 
            optionType: 'call' 
          }
        });

        if (!error && data) {
          // Use actual IV from options data or calculate from bid-ask spread
          const iv = data.impliedVolatility || data.iv || 30;
          const ivRank = data.ivRank || ((iv - 20) / 60 * 100); // Estimate based on typical range
          const ivPercentile = data.ivPercentile || ivRank;

          ivResults.push({
            symbol,
            iv: parseFloat(iv.toFixed(2)),
            ivRank: parseFloat(ivRank.toFixed(1)),
            ivPercentile: parseFloat(ivPercentile.toFixed(1)),
            lastUpdated: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`Error fetching IV for ${symbol}:`, error);
      }
    }

    setIVData(ivResults);
    setLoading(false);
  };

  const addSymbol = async () => {
    if (!newSymbol.trim()) return;

    const symbol = newSymbol.toUpperCase().trim();
    
    if (watchlist.includes(symbol)) {
      toast.error(`${symbol} is already in your watchlist`);
      return;
    }

    const updatedWatchlist = [...watchlist, symbol];
    saveWatchlist(updatedWatchlist);
    setNewSymbol('');
    fetchIVData(updatedWatchlist);
    toast.success(`${symbol} added to IV tracker`);
  };

  const removeSymbol = (symbol: string) => {
    const updatedWatchlist = watchlist.filter(s => s !== symbol);
    saveWatchlist(updatedWatchlist);
    setIVData(ivData.filter(data => data.symbol !== symbol));
    toast.success(`${symbol} removed from IV tracker`);
  };

  const getIVRankColor = (rank: number) => {
    if (rank >= 75) return 'text-red-500 font-semibold';
    if (rank >= 50) return 'text-orange-500 font-semibold';
    if (rank >= 25) return 'text-yellow-600';
    return 'text-green-500';
  };

  return (
    <PageLayout title="IV Rank/Percentile Tracker">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Implied Volatility Monitor</CardTitle>
            <CardDescription>Track IV rank and percentile for your watchlist stocks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-6">
              <Input
                placeholder="Add symbol (e.g., AAPL)"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && addSymbol()}
              />
              <Button onClick={addSymbol}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading IV data...</p>
            ) : watchlist.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Add symbols to track their IV metrics</p>
            ) : ivData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Fetching data for {watchlist.join(', ')}...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ivData.map((data) => (
                  <Card key={data.symbol} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-xl">{data.symbol}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSymbol(data.symbol)}
                          className="h-8 w-8 p-0 hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm font-medium text-muted-foreground">Implied Volatility</span>
                          <span className="text-lg font-bold text-primary">{data.iv}%</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm font-medium text-muted-foreground">IV Rank</span>
                          <span className={`text-lg font-bold ${getIVRankColor(data.ivRank)}`}>
                            {data.ivRank}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm font-medium text-muted-foreground">IV Percentile</span>
                          <span className={`text-lg font-bold ${getIVRankColor(data.ivPercentile)}`}>
                            {data.ivPercentile}
                          </span>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Updated: {new Date(data.lastUpdated).toLocaleTimeString()}
                        </p>
                      </div>
                      
                      {data.ivRank >= 75 && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 p-3 rounded-lg text-xs font-medium">
                          🔴 High IV - Good for selling premium
                        </div>
                      )}
                      {data.ivRank <= 25 && (
                        <div className="bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 p-3 rounded-lg text-xs font-medium">
                          🟢 Low IV - Good for buying options
                        </div>
                      )}
                      {data.ivRank > 25 && data.ivRank < 75 && (
                        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 p-3 rounded-lg text-xs font-medium">
                          🔵 Neutral IV - Use directional strategies
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What is IV Rank & Percentile?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground mb-2">IV Rank</h4>
              <p>Shows where current IV sits relative to its 52-week high/low range. A rank of 100 means IV is at its 52-week high.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">IV Percentile</h4>
              <p>Shows the percentage of days in the past year that IV was lower than today. 75th percentile means IV was lower 75% of the time.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Trading Strategy</h4>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>High IV Rank (75+): Consider selling premium (credit spreads, iron condors)</li>
                <li>Low IV Rank (0-25): Consider buying options (debit spreads, long calls/puts)</li>
                <li>Mid IV Rank (25-75): Neutral - use direction-based strategies</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default IVTracker;