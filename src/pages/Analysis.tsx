import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useStockData } from '@/hooks/useStockData';
import { toast } from 'sonner';

const Analysis = () => {
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customSymbols, setCustomSymbols] = useState<string>('');
  
  // Fetch live stock data
  const defaultSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'NFLX'];
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>(defaultSymbols);
  const { stocks: liveStocks, loading: stocksLoading } = useStockData(watchlistSymbols);
  
  // Expanded sector performance data - all major sectors
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

  const getAIAnalysis = async (type: string) => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-stocks', {
        body: {
          stockData: liveStocks,
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

  const handleCustomSymbols = () => {
    const symbols = customSymbols.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    if (symbols.length > 0) {
      setWatchlistSymbols(symbols);
      toast.success(`Analyzing ${symbols.length} stock(s)`);
    } else {
      toast.error('Please enter at least one stock symbol');
    }
  };
  
  return (
    <PageLayout title="Market Analysis">
      <div className="mb-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Custom Stock Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter stock symbols (e.g., AAPL, TSLA, NVDA)"
                value={customSymbols}
                onChange={(e) => setCustomSymbols(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleCustomSymbols} disabled={stocksLoading}>
                Analyze
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Current symbols: {watchlistSymbols.join(', ')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Market Analysis
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={() => getAIAnalysis('overview')}
                  disabled={isAnalyzing || stocksLoading}
                  variant="outline"
                  size="sm"
                >
                  {isAnalyzing ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Market Overview'}
                </Button>
                <Button
                  onClick={() => getAIAnalysis('recommendations')}
                  disabled={isAnalyzing || stocksLoading}
                  variant="outline"
                  size="sm"
                >
                  Recommendations
                </Button>
                <Button
                  onClick={() => getAIAnalysis('risk-assessment')}
                  disabled={isAnalyzing || stocksLoading}
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
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{aiAnalysis}</p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Click a button above to generate AI-powered market analysis based on live stock data from Finnhub.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-card rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">All Sector Performance (YTD)</h2>
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
                    <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#4ade80' : '#f87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Year-to-date performance across all major market sectors and industries.</p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Analysis;
