import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { generatePriceHistory } from '@/utils/stocksApi';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { StockCard } from '@/components/stocks/StockCard';
import { StockChart } from '@/components/stocks/StockChart';
import { StatsCard } from '@/components/ui/StatsCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart3, TrendingDown, TrendingUp, Wallet2, Calculator, Target, Shield, DollarSign, TrendingUpIcon, Activity, Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  priceHistory?: number[];
  lastUpdated: Date;
}

export function Dashboard() {
  const { user } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [newSymbol, setNewSymbol] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWatchlist();
    }
  }, [user]);

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      // Fetch user's watchlist symbols
      const { data: watchlistData, error: watchlistError } = await supabase
        .from('watchlist')
        .select('symbol')
        .order('created_at', { ascending: true });

      if (watchlistError) throw watchlistError;

      if (!watchlistData || watchlistData.length === 0) {
        // Add default stocks if watchlist is empty
        const defaultSymbols = ['AAPL', 'MSFT', 'GOOGL'];
        for (const symbol of defaultSymbols) {
          await supabase.from('watchlist').insert({ user_id: user?.id, symbol });
        }
        await fetchStockData(defaultSymbols);
      } else {
        const symbols = watchlistData.map(item => item.symbol);
        await fetchStockData(symbols);
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      toast.error('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  const fetchStockData = async (symbols: string[]) => {
    try {
      const stockPromises = symbols.map(async (symbol) => {
        const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
          body: { symbol }
        });

        if (error || !data) {
          console.error(`Error fetching ${symbol}:`, error);
          return null;
        }

        return {
          symbol: data.symbol,
          name: data.name || symbol,
          price: data.currentPrice || 0,
          change: data.change || 0,
          changePercent: data.changePercent || 0,
          volume: data.volume || 0,
          marketCap: data.marketCap || 0,
          priceHistory: generatePriceHistory(30, data.currentPrice || 100, 2),
          lastUpdated: new Date()
        };
      });

      const stockData = (await Promise.all(stockPromises)).filter(Boolean) as StockData[];
      setStocks(stockData);
      
      if (stockData.length > 0 && !selectedStock) {
        setSelectedStock(stockData[0]);
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
      toast.error('Failed to fetch stock data');
    }
  };

  const addToWatchlist = async () => {
    if (!newSymbol.trim()) {
      toast.error('Please enter a stock symbol');
      return;
    }

    const symbol = newSymbol.toUpperCase().trim();
    
    try {
      const { error } = await supabase
        .from('watchlist')
        .insert({ user_id: user?.id, symbol });

      if (error) {
        if (error.code === '23505') {
          toast.error('Stock already in watchlist');
        } else {
          throw error;
        }
        return;
      }

      toast.success(`${symbol} added to watchlist`);
      setNewSymbol('');
      await fetchWatchlist();
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast.error('Failed to add to watchlist');
    }
  };

  const removeFromWatchlist = async (symbol: string) => {
    try {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('symbol', symbol);

      if (error) throw error;

      toast.success(`${symbol} removed from watchlist`);
      
      if (selectedStock?.symbol === symbol) {
        const remainingStocks = stocks.filter(s => s.symbol !== symbol);
        setSelectedStock(remainingStocks[0] || null);
      }
      
      await fetchWatchlist();
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast.error('Failed to remove from watchlist');
    }
  };
  
  // Calculate market statistics
  const gainers = stocks.filter(stock => stock.changePercent > 0);
  const losers = stocks.filter(stock => stock.changePercent < 0);
  
  const topGainer = stocks.length > 0 
    ? [...stocks].sort((a, b) => b.changePercent - a.changePercent)[0]
    : { symbol: 'N/A', name: 'N/A', changePercent: 0 };
  const topLoser = stocks.length > 0
    ? [...stocks].sort((a, b) => a.changePercent - b.changePercent)[0]
    : { symbol: 'N/A', name: 'N/A', changePercent: 0 };
  
  const totalMarketCap = stocks.reduce((sum, stock) => sum + stock.marketCap, 0);
  const totalVolume = stocks.reduce((sum, stock) => sum + stock.volume, 0);
  
  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex relative">
        {/* Sidebar - hidden on mobile by default */}
        <div className="hidden lg:block">
          <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        </div>
        
        <main className="flex-1 transition-all duration-300 w-full">
          <div className="container max-w-full p-3 sm:p-4 lg:p-6 animate-fade-in">
            <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Market Dashboard</h1>
            
            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6 animate-slide-up" style={{ '--delay': '100ms' } as React.CSSProperties}>
              <StatsCard 
                title="Market Cap" 
                value="$13.42T"
                trend={0.47}
                icon={<Wallet2 className="h-4 w-4 sm:h-5 sm:w-5" />}
                className="bg-primary/5"
              />
              <StatsCard 
                title="Trading Volume" 
                value="487.32M"
                description="Today's volume"
                icon={<BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />}
                className="bg-primary/5"
              />
              <StatsCard 
                title="Top Gainer" 
                value={topGainer.symbol}
                trend={topGainer.changePercent}
                trendLabel={topGainer.name}
                icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />}
                className="bg-success/5"
              />
              <StatsCard 
                title="Top Loser" 
                value={topLoser.symbol}
                trend={topLoser.changePercent}
                trendLabel={topLoser.name}
                icon={<TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />}
                className="bg-danger/5"
              />
            </div>
            
            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Left column - Stock list */}
              <div className="space-y-3 sm:space-y-4 animate-slide-up" style={{ '--delay': '200ms' } as React.CSSProperties}>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-semibold">Watchlist</h2>
                </div>
                
                {/* Add stock to watchlist */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add symbol (e.g., TSLA)"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && addToWatchlist()}
                    className="flex-1"
                  />
                  <Button onClick={addToWatchlist} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {loading ? (
                  <p className="text-muted-foreground text-center py-8">Loading watchlist...</p>
                ) : stocks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Add stocks to your watchlist</p>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {stocks.map((stock) => (
                      <div key={stock.symbol} className="relative group">
                        <StockCard 
                          stock={stock} 
                          priceHistory={stock.priceHistory || []}
                          onClick={() => setSelectedStock(stock)}
                          className={selectedStock?.symbol === stock.symbol ? "ring-2 ring-primary" : ""}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromWatchlist(stock.symbol);
                          }}
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Right column - Chart */}
              <div className="space-y-3 sm:space-y-4 animate-slide-up" style={{ '--delay': '300ms' } as React.CSSProperties}>
                {selectedStock ? (
                  <StockChart 
                    symbol={selectedStock.symbol} 
                    name={selectedStock.name} 
                    currentPrice={selectedStock.price}
                    volatility={2.5}
                  />
                ) : (
                  <Card>
                    <CardContent className="flex items-center justify-center h-96">
                      <p className="text-muted-foreground">Select a stock to view chart</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
            
            {/* Trading Tools Section */}
            <div className="mt-6 sm:mt-8">
              <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6">Trading Tools</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 animate-slide-up" style={{ '--delay': '500ms' } as React.CSSProperties}>
                <Link to="/trading-toolkit">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <Calculator className="h-8 w-8 text-primary mb-2" />
                      <CardTitle>Trading Toolkit</CardTitle>
                      <CardDescription>Position sizing, risk management, and profit calculators</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full">Open Toolkit</Button>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/options-premium">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <DollarSign className="h-8 w-8 text-primary mb-2" />
                      <CardTitle>Options Premium</CardTitle>
                      <CardDescription>Calculate theoretical prices and Greeks for options</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full">Calculate Premium</Button>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/expected-move">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <Target className="h-8 w-8 text-primary mb-2" />
                      <CardTitle>Expected Move</CardTitle>
                      <CardDescription>Predict stock price movements and ranges</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full">View Expected Move</Button>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/options-risk">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <Shield className="h-8 w-8 text-primary mb-2" />
                      <CardTitle>Options Risk</CardTitle>
                      <CardDescription>Monitor and analyze options position risk</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full">Check Risk</Button>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/portfolio">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <Activity className="h-8 w-8 text-primary mb-2" />
                      <CardTitle>Options Portfolio</CardTitle>
                      <CardDescription>Track and manage your options trades</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full">View Portfolio</Button>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/performance">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <TrendingUpIcon className="h-8 w-8 text-primary mb-2" />
                      <CardTitle>Performance</CardTitle>
                      <CardDescription>Analyze your trading performance and P&L</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full">View Performance</Button>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
