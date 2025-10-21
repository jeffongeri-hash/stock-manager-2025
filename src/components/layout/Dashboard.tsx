import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  useStockData, 
  mockStocks, mockNews,
  generatePriceHistory 
} from '@/utils/stocksApi';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { StockCard } from '@/components/stocks/StockCard';
import { StockChart } from '@/components/stocks/StockChart';
import { NewsCard } from '@/components/news/NewsCard';
import { StatsCard } from '@/components/ui/StatsCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingDown, TrendingUp, Wallet2, Calculator, Target, Shield, DollarSign, TrendingUpIcon, Activity } from 'lucide-react';

export function Dashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedStock, setSelectedStock] = useState(mockStocks[0]);
  
  // Use our hooks to get real-time mock data
  const stocks = useStockData(mockStocks);
  
  // Generate chart data for the selected stock
  const selectedStockHistory = generatePriceHistory(30, selectedStock.price, 2);
  
  // Generate chart data for stock cards
  const stocksWithHistory = stocks.map(stock => {
    return {
      ...stock,
      priceHistory: generatePriceHistory(30, stock.price, 2)
    };
  });
  
  // Calculate market statistics
  const gainers = stocks.filter(stock => stock.changePercent > 0);
  const losers = stocks.filter(stock => stock.changePercent < 0);
  
  const topGainer = [...stocks].sort((a, b) => b.changePercent - a.changePercent)[0];
  const topLoser = [...stocks].sort((a, b) => a.changePercent - b.changePercent)[0];
  
  const totalMarketCap = stocks.reduce((sum, stock) => sum + stock.marketCap, 0);
  const totalVolume = stocks.reduce((sum, stock) => sum + stock.volume, 0);
  
  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        
        <main className="flex-1 transition-all duration-300">
          <div className="container max-w-full p-4 lg:p-6 animate-fade-in">
            <h1 className="text-2xl font-bold mb-6">Market Dashboard</h1>
            
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-slide-up" style={{ '--delay': '100ms' } as React.CSSProperties}>
              <StatsCard 
                title="Market Cap" 
                value="$13.42T"
                trend={0.47}
                icon={<Wallet2 />}
                className="bg-primary/5"
              />
              <StatsCard 
                title="Trading Volume" 
                value="487.32M"
                description="Today's volume"
                icon={<BarChart3 />}
                className="bg-primary/5"
              />
              <StatsCard 
                title="Top Gainer" 
                value={topGainer.symbol}
                trend={topGainer.changePercent}
                trendLabel={topGainer.name}
                icon={<TrendingUp />}
                className="bg-success/5"
              />
              <StatsCard 
                title="Top Loser" 
                value={topLoser.symbol}
                trend={topLoser.changePercent}
                trendLabel={topLoser.name}
                icon={<TrendingDown />}
                className="bg-danger/5"
              />
            </div>
            
            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column - Stock list */}
              <div className="lg:col-span-1 space-y-4 animate-slide-up" style={{ '--delay': '200ms' } as React.CSSProperties}>
                <h2 className="text-xl font-semibold">Watchlist</h2>
                <div className="space-y-4">
                  {stocksWithHistory.slice(0, 5).map((stock) => (
                    <StockCard 
                      key={stock.symbol} 
                      stock={stock} 
                      priceHistory={stock.priceHistory}
                      onClick={() => setSelectedStock(stock)}
                      className={selectedStock.symbol === stock.symbol ? "ring-2 ring-primary" : ""}
                    />
                  ))}
                </div>
              </div>
              
              {/* Middle column - Chart and news */}
              <div className="lg:col-span-2 space-y-4 animate-slide-up" style={{ '--delay': '300ms' } as React.CSSProperties}>
                <StockChart 
                  symbol={selectedStock.symbol} 
                  name={selectedStock.name} 
                  currentPrice={selectedStock.price}
                  volatility={2.5}
                />
                <NewsCard news={mockNews} className="mt-6" />
              </div>
            </div>
            
            {/* Trading Tools Section */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-6">Trading Tools</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up" style={{ '--delay': '500ms' } as React.CSSProperties}>
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
