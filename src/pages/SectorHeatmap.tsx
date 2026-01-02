
import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SectorData {
  name: string;
  symbol: string;
  change: number;
  marketCap: string;
  volume: string;
  topStocks: string[];
}

const SECTOR_DATA: SectorData[] = [
  { name: 'Technology', symbol: 'XLK', change: 1.45, marketCap: '$15.2T', volume: '89M', topStocks: ['AAPL', 'MSFT', 'NVDA'] },
  { name: 'Healthcare', symbol: 'XLV', change: 0.82, marketCap: '$8.1T', volume: '45M', topStocks: ['JNJ', 'UNH', 'PFE'] },
  { name: 'Financials', symbol: 'XLF', change: -0.34, marketCap: '$9.3T', volume: '67M', topStocks: ['JPM', 'BAC', 'WFC'] },
  { name: 'Consumer Discretionary', symbol: 'XLY', change: 0.56, marketCap: '$6.8T', volume: '34M', topStocks: ['AMZN', 'TSLA', 'HD'] },
  { name: 'Communication Services', symbol: 'XLC', change: 2.12, marketCap: '$5.4T', volume: '28M', topStocks: ['META', 'GOOGL', 'NFLX'] },
  { name: 'Industrials', symbol: 'XLI', change: -0.18, marketCap: '$5.9T', volume: '31M', topStocks: ['CAT', 'UPS', 'BA'] },
  { name: 'Consumer Staples', symbol: 'XLP', change: -0.45, marketCap: '$4.2T', volume: '22M', topStocks: ['PG', 'KO', 'PEP'] },
  { name: 'Energy', symbol: 'XLE', change: -1.23, marketCap: '$3.8T', volume: '56M', topStocks: ['XOM', 'CVX', 'COP'] },
  { name: 'Utilities', symbol: 'XLU', change: 0.23, marketCap: '$1.6T', volume: '18M', topStocks: ['NEE', 'DUK', 'SO'] },
  { name: 'Real Estate', symbol: 'XLRE', change: -0.67, marketCap: '$1.4T', volume: '15M', topStocks: ['PLD', 'AMT', 'EQIX'] },
  { name: 'Materials', symbol: 'XLB', change: 0.89, marketCap: '$1.8T', volume: '19M', topStocks: ['LIN', 'APD', 'SHW'] },
];

const getHeatmapColor = (change: number) => {
  if (change >= 2) return 'bg-green-500 hover:bg-green-400';
  if (change >= 1) return 'bg-green-600/80 hover:bg-green-500/80';
  if (change >= 0.5) return 'bg-green-700/60 hover:bg-green-600/60';
  if (change >= 0) return 'bg-green-800/40 hover:bg-green-700/40';
  if (change >= -0.5) return 'bg-red-800/40 hover:bg-red-700/40';
  if (change >= -1) return 'bg-red-700/60 hover:bg-red-600/60';
  if (change >= -2) return 'bg-red-600/80 hover:bg-red-500/80';
  return 'bg-red-500 hover:bg-red-400';
};

const getTextColor = (change: number) => {
  if (Math.abs(change) >= 1) return 'text-white';
  return 'text-foreground';
};

export default function SectorHeatmap() {
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState<SectorData | null>(null);

  useEffect(() => {
    // Simulate loading with slight variations
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Add some randomness to make it feel live
      const updatedSectors = SECTOR_DATA.map(sector => ({
        ...sector,
        change: sector.change + (Math.random() - 0.5) * 0.3,
      }));
      
      setSectors(updatedSectors.sort((a, b) => b.change - a.change));
      setLoading(false);
    };
    
    loadData();
  }, []);

  const refresh = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const updatedSectors = SECTOR_DATA.map(sector => ({
      ...sector,
      change: sector.change + (Math.random() - 0.5) * 0.5,
    }));
    
    setSectors(updatedSectors.sort((a, b) => b.change - a.change));
    setLoading(false);
  };

  const marketSentiment = sectors.reduce((acc, s) => acc + s.change, 0) / sectors.length;

  return (
    <PageLayout title="Sector Heatmap">
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Card className="px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Market Sentiment:</span>
                <Badge variant={marketSentiment >= 0 ? 'default' : 'destructive'} className="gap-1">
                  {marketSentiment >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {marketSentiment >= 0 ? 'Bullish' : 'Bearish'} ({marketSentiment.toFixed(2)}%)
                </Badge>
              </div>
            </Card>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Heatmap Grid */}
        <Card>
          <CardHeader>
            <CardTitle>S&P 500 Sector Performance</CardTitle>
            <CardDescription>Real-time sector performance with color-coded gains and losses</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array(11).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {sectors.map((sector, i) => (
                  <div
                    key={sector.symbol}
                    className={cn(
                      'relative p-4 rounded-xl cursor-pointer transition-all duration-300',
                      'transform hover:scale-105 hover:shadow-lg hover:z-10',
                      getHeatmapColor(sector.change),
                      getTextColor(sector.change),
                      selectedSector?.symbol === sector.symbol && 'ring-2 ring-primary ring-offset-2'
                    )}
                    onClick={() => setSelectedSector(sector)}
                    style={{
                      animationDelay: `${i * 50}ms`,
                    }}
                  >
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        <p className="font-semibold text-sm truncate">{sector.name}</p>
                        <p className="text-xs opacity-80">{sector.symbol}</p>
                      </div>
                      <div className="mt-2">
                        <p className="text-2xl font-bold">
                          {sector.change >= 0 ? '+' : ''}{sector.change.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Sector Details */}
        {selectedSector && (
          <Card className="animate-fade-in border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedSector.name}</CardTitle>
                  <CardDescription>{selectedSector.symbol} ETF</CardDescription>
                </div>
                <Badge variant={selectedSector.change >= 0 ? 'default' : 'destructive'} className="text-lg px-3 py-1">
                  {selectedSector.change >= 0 ? '+' : ''}{selectedSector.change.toFixed(2)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Market Cap</p>
                  <p className="text-xl font-bold">{selectedSector.marketCap}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Volume</p>
                  <p className="text-xl font-bold">{selectedSector.volume}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Top Holdings</p>
                  <div className="flex gap-2 mt-1">
                    {selectedSector.topStocks.map(stock => (
                      <Badge key={stock} variant="outline">{stock}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legend */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground mr-2">Performance Scale:</span>
              <div className="flex items-center gap-1">
                <div className="w-6 h-4 rounded bg-red-500" />
                <span className="text-xs">-2%+</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-4 rounded bg-red-600/80" />
                <span className="text-xs">-1%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-4 rounded bg-red-700/60" />
                <span className="text-xs">-0.5%</span>
              </div>
              <div className="w-4 h-4 border-l border-muted-foreground" />
              <div className="flex items-center gap-1">
                <div className="w-6 h-4 rounded bg-green-800/40" />
                <span className="text-xs">0%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-4 rounded bg-green-700/60" />
                <span className="text-xs">+0.5%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-4 rounded bg-green-600/80" />
                <span className="text-xs">+1%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-4 rounded bg-green-500" />
                <span className="text-xs">+2%+</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
