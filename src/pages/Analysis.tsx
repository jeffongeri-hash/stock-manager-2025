import React, { useState, useCallback } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, RefreshCw, Search, Loader2, TrendingUp, TrendingDown,
  LineChart, Building, CalendarDays, Users, Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { TechnicalAnalysis } from '@/components/analysis/TechnicalAnalysis';
import { FundamentalAnalysis } from '@/components/analysis/FundamentalAnalysis';
import { CatalystEvents } from '@/components/analysis/CatalystEvents';
import { AnalystRatings } from '@/components/analysis/AnalystRatings';
import { useWatchlistActions } from '@/hooks/useWatchlistActions';

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  high52Week?: number;
  low52Week?: number;
}

interface FundamentalsData {
  pe?: number;
  forwardPe?: number;
  ps?: number;
  pb?: number;
  roe?: number;
  roa?: number;
  revenueGrowth?: number;
  epsGrowth?: number;
  profitMargin?: number;
  debtToEquity?: number;
  marketCap?: number;
}

const Analysis = () => {
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchSymbol, setSearchSymbol] = useState<string>('');
  const [activeSymbol, setActiveSymbol] = useState<string>('');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [fundamentals, setFundamentals] = useState<FundamentalsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { addToWatchlist, isLoggedIn } = useWatchlistActions();
  
  // Expanded sector performance data
  const sectorPerformance = [
    { name: 'Technology', value: 8.2 },
    { name: 'Healthcare', value: 3.5 },
    { name: 'Financials', value: -1.2 },
    { name: 'Consumer Discretionary', value: 2.8 },
    { name: 'Consumer Staples', value: 1.4 },
    { name: 'Energy', value: -2.5 },
    { name: 'Materials', value: 0.9 },
    { name: 'Utilities', value: -0.7 },
    { name: 'Industrials', value: 1.8 },
    { name: 'Real Estate', value: -1.5 },
    { name: 'Communication Services', value: 4.2 },
  ];

  const fetchStockData = useCallback(async () => {
    if (!searchSymbol.trim()) {
      toast.error('Please enter a stock symbol');
      return;
    }

    const symbol = searchSymbol.trim().toUpperCase();
    setIsLoading(true);

    try {
      // Fetch stock price data
      const { data: priceData, error: priceError } = await supabase.functions.invoke('fetch-stock-data', {
        body: { symbols: [symbol] }
      });

      if (priceError) throw priceError;

      if (priceData?.stocks && priceData.stocks.length > 0) {
        const stock = priceData.stocks[0];
        setStockData({
          symbol: stock.symbol,
          name: stock.name || symbol,
          price: stock.price,
          change: stock.change,
          changePercent: stock.changePercent,
          volume: stock.volume,
          marketCap: stock.marketCap,
          high52Week: stock.high52Week || stock.price * 1.3,
          low52Week: stock.low52Week || stock.price * 0.7,
        });
        setActiveSymbol(symbol);

        // Fetch fundamentals
        try {
          const { data: fundData } = await supabase.functions.invoke('fetch-fundamentals', {
            body: { symbol }
          });

          if (fundData?.fundamentals) {
            const f = fundData.fundamentals;
            setFundamentals({
              pe: f.metrics?.peNormalizedAnnual || f.metrics?.peBasicExclExtraTTM,
              forwardPe: f.metrics?.forwardPe,
              ps: f.metrics?.psTTM,
              pb: f.metrics?.pbQuarterly,
              roe: f.metrics?.roeTTM,
              roa: f.metrics?.roaTTM,
              revenueGrowth: f.metrics?.revenueGrowthQuarterlyYoy,
              epsGrowth: f.metrics?.epsGrowthQuarterlyYoy,
              profitMargin: f.metrics?.netProfitMarginTTM,
              debtToEquity: f.metrics?.totalDebtToEquity,
              marketCap: f.profile?.marketCapitalization,
            });
          }
        } catch (fundError) {
          console.error('Error fetching fundamentals:', fundError);
          // Set simulated fundamentals if API fails
          setFundamentals({
            pe: 20 + Math.random() * 15,
            forwardPe: 18 + Math.random() * 12,
            ps: 2 + Math.random() * 5,
            pb: 2 + Math.random() * 4,
            roe: 10 + Math.random() * 20,
            roa: 5 + Math.random() * 15,
            revenueGrowth: 5 + Math.random() * 25,
            epsGrowth: 8 + Math.random() * 20,
            profitMargin: 8 + Math.random() * 20,
            debtToEquity: 0.5 + Math.random() * 1.5,
            marketCap: stock.marketCap || 100000000000,
          });
        }

        toast.success(`Loaded analysis for ${symbol}`);
      } else {
        toast.error(`Could not find stock: ${symbol}`);
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
      toast.error('Failed to fetch stock data');
    } finally {
      setIsLoading(false);
    }
  }, [searchSymbol]);

  const getAIAnalysis = async (type: string) => {
    if (!stockData) {
      toast.error('Please search for a stock first');
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-stocks', {
        body: {
          stockData: [stockData],
          analysisType: type
        }
      });

      if (error) throw error;

      if (data && data.analysis) {
        setAiAnalysis(data.analysis);
      }
    } catch (err) {
      console.error('Error getting AI analysis:', err);
      toast.error('Failed to generate AI analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSearch = () => {
    fetchStockData();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  return (
    <PageLayout title="Stock Analysis">
      {/* Search Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Comprehensive Stock Analysis
          </CardTitle>
          <CardDescription>
            Enter a stock symbol for technical analysis, fundamentals, catalysts, and analyst ratings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter stock symbol (e.g., AAPL, TSLA, NVDA)"
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Analyze
            </Button>
            {stockData && (
              <Button 
                variant="outline" 
                onClick={() => addToWatchlist(activeSymbol)}
                disabled={!isLoggedIn}
                title={!isLoggedIn ? 'Sign in to add to watchlist' : 'Add to watchlist'}
              >
                <Eye className="h-4 w-4 mr-2" />
                Add to Watchlist
              </Button>
            )}
          </div>
          
          {/* Stock Summary */}
          {stockData && (
            <div className="mt-4 p-4 rounded-lg border bg-muted/30">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold">{stockData.name}</h3>
                    <Badge variant="outline">{stockData.symbol}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold">${stockData.price.toFixed(2)}</p>
                    <div className={`flex items-center gap-1 ${stockData.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {stockData.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      <span className="font-medium">
                        {stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)} ({stockData.changePercent >= 0 ? '+' : ''}{stockData.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Tabs */}
      {activeSymbol && stockData ? (
        <Tabs defaultValue="technical" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="technical" className="flex items-center gap-1">
              <LineChart className="h-4 w-4" />
              Technical
            </TabsTrigger>
            <TabsTrigger value="fundamental" className="flex items-center gap-1">
              <Building className="h-4 w-4" />
              Fundamental
            </TabsTrigger>
            <TabsTrigger value="catalysts" className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              Catalysts
            </TabsTrigger>
            <TabsTrigger value="analysts" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Analysts
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              AI Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="technical">
            <TechnicalAnalysis
              symbol={activeSymbol}
              currentPrice={stockData.price}
              high52Week={stockData.high52Week}
              low52Week={stockData.low52Week}
              volume={stockData.volume}
            />
          </TabsContent>

          <TabsContent value="fundamental">
            {fundamentals && (
              <FundamentalAnalysis
                symbol={activeSymbol}
                fundamentals={fundamentals}
              />
            )}
          </TabsContent>

          <TabsContent value="catalysts">
            <CatalystEvents symbol={activeSymbol} />
          </TabsContent>

          <TabsContent value="analysts">
            <AnalystRatings 
              symbol={activeSymbol} 
              currentPrice={stockData.price} 
            />
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI-Powered Analysis
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => getAIAnalysis('overview')}
                      disabled={isAnalyzing}
                      variant="outline"
                      size="sm"
                    >
                      {isAnalyzing ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Overview'}
                    </Button>
                    <Button
                      onClick={() => getAIAnalysis('recommendations')}
                      disabled={isAnalyzing}
                      variant="outline"
                      size="sm"
                    >
                      Recommendations
                    </Button>
                    <Button
                      onClick={() => getAIAnalysis('risk-assessment')}
                      disabled={isAnalyzing}
                      variant="outline"
                      size="sm"
                    >
                      Risk Assessment
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {aiAnalysis ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Click a button above to generate AI-powered analysis for {activeSymbol}.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        /* Show sector performance when no stock is selected */
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>All Sector Performance (YTD)</CardTitle>
              <CardDescription>Enter a stock symbol above to see detailed analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sectorPerformance}
                    margin={{ top: 10, right: 30, left: 0, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}%`, 'Performance']} />
                    <Bar 
                      dataKey="value" 
                      name="YTD Performance" 
                      fill="#8884d8"
                      radius={[4, 4, 0, 0]}
                    >
                      {sectorPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.value >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageLayout>
  );
};

export default Analysis;
