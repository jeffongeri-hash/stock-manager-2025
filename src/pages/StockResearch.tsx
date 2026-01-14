import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, TrendingUp, TrendingDown, BarChart3, MessageSquare, LineChart, Loader2, X, Plus, Check, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/hooks/useAuth';
import { TickerAutocomplete } from '@/components/trading/TickerAutocomplete';

interface StockData {
  symbol: string;
  name: string;
  industry: string;
  marketCap: number;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  metrics: any;
  peers: string[];
  spxChange: number;
  profile: any;
  insiderTransactions: any[];
  recentNews: any[];
}

interface StockResearchResult {
  data: StockData;
  fundamentalAnalysis: string;
  technicalAnalysis: string;
  sentimentAnalysis: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export default function StockResearch() {
  const [symbolInput, setSymbolInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<StockResearchResult[]>([]);
  const [addingToWatchlist, setAddingToWatchlist] = useState<string | null>(null);
  const [addedSymbols, setAddedSymbols] = useState<Set<string>>(new Set());
  const [lastSearchedSymbols, setLastSearchedSymbols] = useState<string[]>([]);
  const { user } = useAuth();

  const formatNumber = (num: number) => {
    if (!num || isNaN(num)) return 'N/A';
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    return `$${num.toFixed(2)}`;
  };

  const handleSearch = async () => {
    const input = symbolInput.trim();
    if (!input) {
      toast.error('Please enter stock symbol(s)');
      return;
    }

    // Parse comma-separated symbols
    const symbols = input
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0 && s.length <= 5);

    if (symbols.length === 0) {
      toast.error('Please enter valid stock symbols');
      return;
    }

    if (symbols.length > 5) {
      toast.error('Maximum 5 stocks at a time');
      return;
    }

    setLoading(true);
    setResults([]);
    setLastSearchedSymbols(symbols);

    try {
      const researchResults: StockResearchResult[] = [];

      for (const symbol of symbols) {
        toast.info(`Researching ${symbol}...`);

        // Fetch fundamentals
        const { data: fundData, error: fundError } = await supabase.functions.invoke('fetch-fundamentals', {
          body: { symbol }
        });

        if (fundError || !fundData?.fundamentals) {
          toast.error(`Failed to fetch data for ${symbol}`);
          continue;
        }

        const stockData = fundData.fundamentals;

        // Get fundamental analysis
        const { data: fundAnalysis } = await supabase.functions.invoke('analyze-fundamentals', {
          body: { fundamentals: stockData }
        });

        // Get technical analysis
        const { data: techAnalysis } = await supabase.functions.invoke('analyze-stocks', {
          body: { 
            stockData: {
              symbol: stockData.symbol,
              name: stockData.name,
              price: stockData.currentPrice,
              change: stockData.priceChange,
              changePercent: stockData.priceChangePercent,
              marketCap: stockData.marketCap
            },
            analysisType: 'risk-assessment'
          }
        });

        // Get sentiment analysis
        const { data: sentimentAnalysis } = await supabase.functions.invoke('analyze-stocks', {
          body: { 
            stockData: {
              symbol: stockData.symbol,
              name: stockData.name,
              price: stockData.currentPrice,
              change: stockData.priceChange,
              changePercent: stockData.priceChangePercent,
              recentNews: stockData.recentNews
            },
            analysisType: 'overview'
          }
        });

        researchResults.push({
          data: stockData,
          fundamentalAnalysis: fundAnalysis?.analysis || 'Analysis unavailable',
          technicalAnalysis: techAnalysis?.analysis || 'Analysis unavailable',
          sentimentAnalysis: sentimentAnalysis?.analysis || 'Analysis unavailable',
          sentiment: fundAnalysis?.sentiment || 'NEUTRAL'
        });
      }

      setResults(researchResults);
      
      if (researchResults.length > 0) {
        toast.success(`Research complete for ${researchResults.length} stock(s)`);
      }
    } catch (err) {
      console.error('Research error:', err);
      toast.error('Failed to complete research');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (lastSearchedSymbols.length > 0) {
      setSymbolInput(lastSearchedSymbols.join(', '));
      handleSearch();
    }
  };

  const removeResult = (symbol: string) => {
    setResults(results.filter(r => r.data.symbol !== symbol));
  };

  const getRatioValue = (metrics: any, key: string) => {
    return metrics?.[key] || 'N/A';
  };

  const addToWatchlist = async (symbol: string) => {
    if (!user) {
      toast.error('Please sign in to add to watchlist');
      return;
    }

    setAddingToWatchlist(symbol);
    try {
      // Check if already in watchlist
      const { data: existing } = await supabase
        .from('watchlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('symbol', symbol)
        .single();

      if (existing) {
        toast.info(`${symbol} is already in your watchlist`);
        setAddedSymbols(prev => new Set(prev).add(symbol));
        return;
      }

      const { error } = await supabase
        .from('watchlist')
        .insert({ user_id: user.id, symbol });

      if (error) throw error;

      setAddedSymbols(prev => new Set(prev).add(symbol));
      toast.success(`${symbol} added to watchlist`);
    } catch (error: any) {
      console.error('Watchlist error:', error);
      toast.error('Failed to add to watchlist');
    } finally {
      setAddingToWatchlist(null);
    }
  };

  return (
    <PageLayout title="Multi-Stock Research">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Stock Research
            </CardTitle>
            <CardDescription>
              Enter multiple stock symbols separated by commas (e.g., AAPL, MSFT, GOOGL)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <TickerAutocomplete
                value={symbolInput}
                onChange={setSymbolInput}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                label="Stock Symbols"
                placeholder="Enter symbols (e.g., AAPL, MSFT, GOOGL)"
                className="flex-1"
                isLoading={loading}
              />
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Research
              </Button>
              {lastSearchedSymbols.length > 0 && results.length > 0 && (
                <Button onClick={handleRefresh} disabled={loading} variant="outline" title="Refresh research">
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {/* Results Grid */}
        {results.length > 0 && (
          <div className="space-y-6">
            {/* Quick Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((result) => (
                <Card key={result.data.symbol} className="relative">
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addToWatchlist(result.data.symbol)}
                      disabled={addingToWatchlist === result.data.symbol || addedSymbols.has(result.data.symbol)}
                      title={addedSymbols.has(result.data.symbol) ? 'Added to watchlist' : 'Add to watchlist'}
                    >
                      {addingToWatchlist === result.data.symbol ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : addedSymbols.has(result.data.symbol) ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeResult(result.data.symbol)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between pr-16">
                      <div>
                        <CardTitle className="text-lg">{result.data.symbol}</CardTitle>
                        <CardDescription className="text-xs line-clamp-1">{result.data.name}</CardDescription>
                      </div>
                      <Badge className={
                        result.sentiment === 'BULLISH' 
                          ? 'bg-green-500/20 text-green-500' 
                          : result.sentiment === 'BEARISH' 
                          ? 'bg-red-500/20 text-red-500' 
                          : 'bg-muted text-muted-foreground'
                      }>
                        {result.sentiment}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Price</p>
                        <p className="font-semibold">${result.data.currentPrice?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Change</p>
                        <div className="flex items-center gap-1">
                          {result.data.priceChangePercent >= 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                          <span className={result.data.priceChangePercent >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {result.data.priceChangePercent?.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Market Cap</p>
                        <p className="font-semibold">{formatNumber(result.data.marketCap)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">P/E Ratio</p>
                        <p className="font-semibold">{getRatioValue(result.data.metrics, 'peBasicExclExtraTTM')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Detailed Analysis Tabs */}
            {results.map((result) => (
              <Card key={`detail-${result.data.symbol}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {result.data.symbol} - {result.data.name}
                    <Badge variant="outline">{result.data.industry}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="fundamental">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="fundamental" className="flex items-center gap-1">
                        <BarChart3 className="h-4 w-4" />
                        <span className="hidden sm:inline">Fundamental</span>
                      </TabsTrigger>
                      <TabsTrigger value="technical" className="flex items-center gap-1">
                        <LineChart className="h-4 w-4" />
                        <span className="hidden sm:inline">Technical</span>
                      </TabsTrigger>
                      <TabsTrigger value="sentiment" className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span className="hidden sm:inline">Sentiment</span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="fundamental" className="mt-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">P/E Ratio</p>
                          <p className="text-lg font-bold">{getRatioValue(result.data.metrics, 'peBasicExclExtraTTM')}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">ROE</p>
                          <p className="text-lg font-bold">{getRatioValue(result.data.metrics, 'roeRfy')}%</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Debt/Equity</p>
                          <p className="text-lg font-bold">{getRatioValue(result.data.metrics, 'totalDebt2TotalEquityAnnual')}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Net Margin</p>
                          <p className="text-lg font-bold">{getRatioValue(result.data.metrics, 'netProfitMarginAnnual')}%</p>
                        </div>
                      </div>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>{result.fundamentalAnalysis}</ReactMarkdown>
                      </div>
                    </TabsContent>

                    <TabsContent value="technical" className="mt-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">52W High</p>
                          <p className="text-lg font-bold">${result.data.metrics?.['52WeekHigh']?.toFixed(2) || 'N/A'}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">52W Low</p>
                          <p className="text-lg font-bold">${result.data.metrics?.['52WeekLow']?.toFixed(2) || 'N/A'}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Beta</p>
                          <p className="text-lg font-bold">{result.data.metrics?.beta?.toFixed(2) || 'N/A'}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">vs S&P 500</p>
                          <p className={`text-lg font-bold ${result.data.priceChangePercent >= result.data.spxChange ? 'text-green-500' : 'text-red-500'}`}>
                            {result.data.priceChangePercent >= result.data.spxChange ? 'Outperforming' : 'Underperforming'}
                          </p>
                        </div>
                      </div>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>{result.technicalAnalysis}</ReactMarkdown>
                      </div>
                    </TabsContent>

                    <TabsContent value="sentiment" className="mt-4">
                      <div className={`mb-4 p-4 rounded-lg border-2 ${
                        result.sentiment === 'BULLISH' 
                          ? 'bg-green-500/10 border-green-500/30' 
                          : result.sentiment === 'BEARISH' 
                          ? 'bg-red-500/10 border-red-500/30' 
                          : 'bg-muted border-border'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">Overall Sentiment</h3>
                            <p className="text-sm text-muted-foreground">Based on news and market analysis</p>
                          </div>
                          <div className={`text-2xl font-bold ${
                            result.sentiment === 'BULLISH' 
                              ? 'text-green-500' 
                              : result.sentiment === 'BEARISH' 
                              ? 'text-red-500' 
                              : 'text-muted-foreground'
                          }`}>
                            {result.sentiment === 'BULLISH' && '📈'}
                            {result.sentiment === 'BEARISH' && '📉'}
                            {result.sentiment === 'NEUTRAL' && '➡️'}
                            {' '}{result.sentiment}
                          </div>
                        </div>
                      </div>
                      
                      {result.data.recentNews && result.data.recentNews.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">Recent News</h4>
                          <div className="space-y-2">
                            {result.data.recentNews.slice(0, 3).map((news: any, i: number) => (
                              <a
                                key={i}
                                href={news.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-2 rounded-md bg-muted/50 hover:bg-muted text-sm"
                              >
                                <p className="font-medium line-clamp-1">{news.headline}</p>
                                <p className="text-xs text-muted-foreground">{news.source} • {new Date(news.datetime * 1000).toLocaleDateString()}</p>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>{result.sentimentAnalysis}</ReactMarkdown>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && results.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">Research Multiple Stocks</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Enter stock symbols separated by commas to get fundamental analysis, technical analysis, and social sentiment for multiple stocks at once.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
