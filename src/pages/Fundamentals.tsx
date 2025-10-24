import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from 'react-markdown';

interface FundamentalsData {
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
  earnings: any[];
  rankings: {
    peRatio: { rank: number | string; total: number | string };
    roe: { rank: number | string; total: number | string };
    roa: { rank: number | string; total: number | string };
  };
}

export default function Fundamentals() {
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [fundamentals, setFundamentals] = useState<FundamentalsData | null>(null);
  const [analysis, setAnalysis] = useState('');
  const [sentiment, setSentiment] = useState<'BULLISH' | 'BEARISH' | 'NEUTRAL'>('NEUTRAL');

  const handleSearch = async () => {
    if (!symbol.trim()) {
      toast.error('Please enter a stock symbol');
      return;
    }

    setLoading(true);
    setAnalyzing(false);
    setAnalysis('');

    try {
      const { data, error } = await supabase.functions.invoke('fetch-fundamentals', {
        body: { symbol: symbol.toUpperCase() }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to fetch fundamentals');
      }

      console.log('Fundamentals data received:', data);

      if (data?.fundamentals) {
        setFundamentals(data.fundamentals);
        
        // Automatically analyze the fundamentals
        setAnalyzing(true);
        const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-fundamentals', {
          body: { fundamentals: data.fundamentals }
        });

        if (analysisError) throw analysisError;

        if (analysisData?.analysis) {
          setAnalysis(analysisData.analysis);
          setSentiment(analysisData.sentiment || 'NEUTRAL');
        }
        setAnalyzing(false);
      }
    } catch (err) {
      console.error('Error fetching fundamentals:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch fundamentals data';
      toast.error(errorMessage);
      setAnalyzing(false);
      setFundamentals(null);
    } finally {
      setLoading(false);
    }
  };

  const getRatioValue = (key: string) => {
    return fundamentals?.metrics[key] || 'N/A';
  };

  const formatNumber = (num: number) => {
    if (!num || isNaN(num)) return 'N/A';
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    return `$${num.toFixed(2)}`;
  };

  return (
    <PageLayout title="Fundamental Analysis">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Stock Search</CardTitle>
            <CardDescription>Enter a stock symbol to analyze its fundamentals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Enter stock symbol (e.g., AAPL)"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                Analyze
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {fundamentals && !loading && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{fundamentals.name} ({fundamentals.symbol})</CardTitle>
                <CardDescription>{fundamentals.industry}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Price</p>
                    <p className="text-2xl font-bold">${fundamentals.currentPrice?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Change</p>
                    <div className="flex items-center gap-1">
                      {fundamentals.priceChangePercent >= 0 ? (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      )}
                      <p className={`text-2xl font-bold ${fundamentals.priceChangePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {fundamentals.priceChangePercent?.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Market Cap</p>
                    <p className="text-2xl font-bold">{formatNumber(fundamentals.marketCap)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">vs S&P 500</p>
                    <div className="flex items-center gap-1">
                      {fundamentals.priceChangePercent >= fundamentals.spxChange ? (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      )}
                      <p className={`text-lg font-bold ${fundamentals.priceChangePercent >= fundamentals.spxChange ? 'text-green-500' : 'text-red-500'}`}>
                        {fundamentals.priceChangePercent >= fundamentals.spxChange ? 'Outperforming' : 'Underperforming'}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">SPX: {fundamentals.spxChange?.toFixed(2)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Financial Ratios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Valuation</p>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">P/E Ratio:</span>
                        <div className="text-right">
                          <span className="font-medium">{getRatioValue('peBasicExclExtraTTM')}</span>
                          {fundamentals.rankings?.peRatio && (
                            <p className="text-xs text-muted-foreground">
                              Rank {fundamentals.rankings.peRatio.rank}/{fundamentals.rankings.peRatio.total}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">P/B Ratio:</span>
                        <span className="font-medium">{getRatioValue('pbAnnual')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">P/S Ratio:</span>
                        <span className="font-medium">{getRatioValue('psAnnual')}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Profitability</p>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">ROE:</span>
                        <div className="text-right">
                          <span className="font-medium">{getRatioValue('roeRfy')}%</span>
                          {fundamentals.rankings?.roe && (
                            <p className="text-xs text-muted-foreground">
                              Rank {fundamentals.rankings.roe.rank}/{fundamentals.rankings.roe.total}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">ROA:</span>
                        <div className="text-right">
                          <span className="font-medium">{getRatioValue('roaRfy')}%</span>
                          {fundamentals.rankings?.roa && (
                            <p className="text-xs text-muted-foreground">
                              Rank {fundamentals.rankings.roa.rank}/{fundamentals.rankings.roa.total}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Net Margin:</span>
                        <span className="font-medium">{getRatioValue('netProfitMarginAnnual')}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Liquidity & Leverage</p>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Current Ratio:</span>
                        <span className="font-medium">{getRatioValue('currentRatioAnnual')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Quick Ratio:</span>
                        <span className="font-medium">{getRatioValue('quickRatioAnnual')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Debt/Equity:</span>
                        <span className="font-medium">{getRatioValue('totalDebt2TotalEquityAnnual')}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Growth Metrics</p>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Revenue Growth (1Y):</span>
                        <span className="font-medium">{getRatioValue('revenueGrowthTTMYoy')}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Revenue Growth (3Y):</span>
                        <span className="font-medium">{getRatioValue('revenueGrowth3Y')}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Revenue Growth (5Y):</span>
                        <span className="font-medium">{getRatioValue('revenueGrowth5Y')}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">EPS Growth (1Y):</span>
                        <span className="font-medium">{getRatioValue('epsGrowthTTMYoy')}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">EPS Growth (3Y):</span>
                        <span className="font-medium">{getRatioValue('epsGrowth3Y')}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">EPS Growth (5Y):</span>
                        <span className="font-medium">{getRatioValue('epsGrowth5Y')}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {fundamentals.peers && fundamentals.peers.length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Peer Companies</p>
                    <div className="flex flex-wrap gap-2">
                      {fundamentals.peers.map((peer) => (
                        <span key={peer} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">
                          {peer}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Analysis</CardTitle>
                <CardDescription>Comprehensive insights on fundamentals and market position</CardDescription>
              </CardHeader>
              <CardContent>
                {analyzing && (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                )}
                {analysis && !analyzing && (
                  <div className="space-y-4">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{analysis}</ReactMarkdown>
                    </div>
                    
                    <div className={`mt-6 p-6 rounded-lg border-2 ${
                      sentiment === 'BULLISH' 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : sentiment === 'BEARISH' 
                        ? 'bg-red-500/10 border-red-500/30' 
                        : 'bg-muted border-border'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Market Sentiment</h3>
                          <p className="text-sm text-muted-foreground">
                            Based on fundamentals, insider activity, and market conditions
                          </p>
                        </div>
                        <div className={`text-4xl font-bold ${
                          sentiment === 'BULLISH' 
                            ? 'text-green-500' 
                            : sentiment === 'BEARISH' 
                            ? 'text-red-500' 
                            : 'text-muted-foreground'
                        }`}>
                          {sentiment === 'BULLISH' && '📈'}
                          {sentiment === 'BEARISH' && '📉'}
                          {sentiment === 'NEUTRAL' && '➡️'}
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className={`text-2xl font-bold ${
                          sentiment === 'BULLISH' 
                            ? 'text-green-500' 
                            : sentiment === 'BEARISH' 
                            ? 'text-red-500' 
                            : 'text-muted-foreground'
                        }`}>
                          {sentiment}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PageLayout>
  );
}
