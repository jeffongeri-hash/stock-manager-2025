import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { generatePriceHistory } from '@/utils/stocksApi';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { GuestModeBanner } from '@/components/layout/GuestModeBanner';
import { StockCard } from '@/components/stocks/StockCard';
import { AnimatedStatsCard } from '@/components/ui/AnimatedStatsCard';
import { TradingToolCard } from '@/components/dashboard/TradingToolCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { BarChart3, TrendingDown, TrendingUp, Wallet2, Calculator, Target, Shield, DollarSign, TrendingUpIcon, Activity, Plus, X, BookOpen, Clock, Newspaper, PieChart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [newSymbol, setNewSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [tradeStats, setTradeStats] = useState({
    totalPnL: 0,
    unrealizedPnL: 0,
    openPositions: 0,
    winRate: 0,
    totalTrades: 0
  });

  const handleRefresh = useCallback(async () => {
    if (user) {
      await Promise.all([fetchWatchlist(), fetchTradeStats()]);
      toast.success('Data refreshed');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchWatchlist();
      fetchTradeStats();
    }
  }, [user]);

  const fetchTradeStats = async () => {
    try {
      // Fetch stock trades for P&L
      const { data: stockTrades, error: stockError } = await supabase
        .from('stock_trades')
        .select('*');

      // Fetch options trades
      const { data: optionsTrades, error: optionsError } = await supabase
        .from('trades')
        .select('*');

      if (stockError) throw stockError;

      let totalPnL = 0;
      let unrealizedPnL = 0;
      let openPositions = 0;
      let closedTrades = 0;
      let winningTrades = 0;

      // Get unique symbols for open positions to fetch current prices
      const openSymbols = stockTrades
        ?.filter(trade => !trade.exit_price && !trade.exit_date)
        .map(trade => trade.symbol) || [];
      const uniqueOpenSymbols = Array.from(new Set(openSymbols));

      // Fetch current prices for open positions
      let currentPrices: { [symbol: string]: number } = {};
      if (uniqueOpenSymbols.length > 0) {
        try {
          const { data: stockData } = await supabase.functions.invoke('fetch-stock-data', {
            body: { symbols: uniqueOpenSymbols }
          });
          if (stockData?.stocks) {
            stockData.stocks.forEach((stock: any) => {
              currentPrices[stock.symbol] = stock.price || 0;
            });
          }
        } catch (err) {
          console.error('Error fetching stock prices:', err);
        }
      }

      // Calculate stock trades P&L
      if (stockTrades) {
        stockTrades.forEach(trade => {
          if (trade.exit_price) {
            // Closed position
            const pnl = (trade.exit_price - trade.entry_price) * trade.quantity;
            totalPnL += pnl;
            closedTrades++;
            if (pnl > 0) winningTrades++;
          } else {
            // Open position - use current price if available
            openPositions++;
            const currentPrice = currentPrices[trade.symbol];
            if (currentPrice) {
              const pnl = (currentPrice - trade.entry_price) * trade.quantity;
              totalPnL += pnl;
              unrealizedPnL += pnl;
            }
          }
        });
      }

      // Calculate options trades P&L
      if (optionsTrades) {
        optionsTrades.forEach(trade => {
          const value = trade.total_value || 0;
          if (trade.action === 'buy') {
            totalPnL -= value;
          } else {
            totalPnL += value;
          }
          closedTrades++;
          if ((trade.action === 'sell' && value > 0) || (trade.action === 'buy' && value < 0)) {
            winningTrades++;
          }
        });
      }

      const winRate = closedTrades > 0 ? (winningTrades / closedTrades) * 100 : 0;

      setTradeStats({
        totalPnL,
        unrealizedPnL,
        openPositions,
        winRate,
        totalTrades: closedTrades + openPositions
      });
    } catch (error) {
      console.error('Error fetching trade stats:', error);
    }
  };

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
      const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
        body: { symbols }
      });

      if (error) {
        console.error('Error fetching stock data:', error);
        toast.error('Failed to fetch stock data');
        return;
      }

      if (!data || !data.stocks) {
        console.error('No stock data returned');
        return;
      }

      const stockData = data.stocks.map((stock: any) => ({
        symbol: stock.symbol,
        name: stock.name || stock.symbol,
        price: stock.price || 0,
        change: stock.change || 0,
        changePercent: stock.changePercent || 0,
        volume: stock.volume || 0,
        marketCap: stock.marketCap || 0,
        priceHistory: generatePriceHistory(30, stock.price || 100, 2),
        lastUpdated: new Date()
      }));

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
  
  // Calculate market statistics (kept for potential future use, but removed from stats)
  const gainers = stocks.filter(stock => stock.changePercent > 0);
  const losers = stocks.filter(stock => stock.changePercent < 0);
  
  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <GuestModeBanner />
      <Navbar />
      
      <div className="flex-1 flex relative">
        {/* Sidebar - hidden on mobile by default */}
        <div className="hidden lg:block">
          <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        </div>
        
        <main className="flex-1 transition-all duration-300 w-full overflow-hidden">
          <PullToRefresh onRefresh={handleRefresh} className="h-full overflow-y-auto">
            <div className="container max-w-full p-3 sm:p-4 lg:p-6 animate-fade-in">
              <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Market Dashboard</h1>
            
            {/* Stats Row - Trading Performance with Sparklines */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6 stagger-animation">
              <AnimatedStatsCard 
                title="Total P&L" 
                value={`$${tradeStats.totalPnL.toFixed(2)}`}
                trend={tradeStats.totalPnL}
                trendLabel="all time"
                icon={<DollarSign className="h-full w-full" />}
                variant={tradeStats.totalPnL >= 0 ? "success" : "danger"}
                sparklineData={generatePriceHistory(20, Math.abs(tradeStats.totalPnL) || 100, 5)}
                delay={0}
              />
              <AnimatedStatsCard 
                title="Unrealized P&L" 
                value={`$${tradeStats.unrealizedPnL.toFixed(2)}`}
                description="Open positions"
                icon={<TrendingUpIcon className="h-full w-full" />}
                variant={tradeStats.unrealizedPnL >= 0 ? "success" : "danger"}
                sparklineData={generatePriceHistory(20, Math.abs(tradeStats.unrealizedPnL) || 50, 3)}
                delay={50}
              />
              <AnimatedStatsCard 
                title="Open Positions" 
                value={tradeStats.openPositions.toString()}
                description="Active trades"
                icon={<Activity className="h-full w-full" />}
                variant="primary"
                delay={100}
              />
              <AnimatedStatsCard 
                title="Win Rate" 
                value={`${tradeStats.winRate.toFixed(1)}%`}
                description="Success rate"
                icon={<Target className="h-full w-full" />}
                variant={tradeStats.winRate >= 50 ? "success" : "warning"}
                sparklineData={generatePriceHistory(15, tradeStats.winRate || 50, 10)}
                delay={150}
              />
              <AnimatedStatsCard 
                title="Total Trades" 
                value={tradeStats.totalTrades.toString()}
                description="All time"
                icon={<BarChart3 className="h-full w-full" />}
                variant="primary"
                delay={200}
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
              
              {/* Right column - Stock Details */}
              <div className="space-y-3 sm:space-y-4 animate-slide-up" style={{ '--delay': '300ms' } as React.CSSProperties}>
                {selectedStock ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>{selectedStock.symbol}</CardTitle>
                      <CardDescription>{selectedStock.name}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Current Price</p>
                          <p className="text-2xl font-bold">${selectedStock.price.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Change</p>
                          <p className={`text-2xl font-bold ${selectedStock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {selectedStock.change >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Volume</p>
                          <p className="text-lg font-medium">{(selectedStock.volume / 1000000).toFixed(2)}M</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Market Cap</p>
                          <p className="text-lg font-medium">${(selectedStock.marketCap / 1000000000).toFixed(2)}B</p>
                        </div>
                      </div>
                      <div className="pt-4 border-t">
                        <p className="text-xs text-muted-foreground">Last updated: {selectedStock.lastUpdated.toLocaleTimeString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="flex items-center justify-center h-96">
                      <p className="text-muted-foreground">Select a stock to view details</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
            
            {/* Trading Tools Section */}
            <div className="mt-6 sm:mt-8">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-2xl font-bold">Trading Tools</h2>
                <span className="text-sm text-muted-foreground">Essential investor resources</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 stagger-animation">
                <TradingToolCard
                  to="/trading-toolkit"
                  icon={<Calculator className="h-full w-full" />}
                  title="Trading Toolkit"
                  description="Position sizing, risk management, and profit calculators"
                  buttonText="Open Toolkit"
                  gradient="purple"
                  delay={0}
                />

                <TradingToolCard
                  to="/expected-move"
                  icon={<Target className="h-full w-full" />}
                  title="Expected Move"
                  description="Predict stock price movements and ranges"
                  buttonText="View Expected Move"
                  gradient="blue"
                  delay={50}
                />

                <TradingToolCard
                  to="/options-risk"
                  icon={<Shield className="h-full w-full" />}
                  title="Options Risk"
                  description="Monitor and analyze options position risk"
                  buttonText="Check Risk"
                  gradient="orange"
                  delay={100}
                />

                <TradingToolCard
                  to="/portfolio"
                  icon={<Activity className="h-full w-full" />}
                  title="Options Portfolio"
                  description="Track and manage your options trades"
                  buttonText="View Portfolio"
                  gradient="green"
                  delay={150}
                />

                <TradingToolCard
                  to="/performance"
                  icon={<TrendingUpIcon className="h-full w-full" />}
                  title="Performance"
                  description="Analyze your trading performance and P&L"
                  buttonText="View Performance"
                  gradient="pink"
                  delay={200}
                />

                <TradingToolCard
                  to="/fundamentals"
                  icon={<BookOpen className="h-full w-full" />}
                  title="Fundamentals"
                  description="Deep dive into company financials and metrics"
                  buttonText="Analyze"
                  gradient="blue"
                  delay={250}
                />
              </div>
            </div>
          </div>
          </PullToRefresh>
        </main>
      </div>
    </div>
  );
}
