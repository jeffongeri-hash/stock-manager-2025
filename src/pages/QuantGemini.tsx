import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StockData, AnalysisState } from '@/types/quantgemini';
import InvestorCard from '@/components/quantgemini/InvestorCard';
import FundamentalTable from '@/components/quantgemini/FundamentalTable';
import CatalystList from '@/components/quantgemini/CatalystList';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Search, Bookmark, BookmarkCheck, Loader2, TrendingUp, TrendingDown, 
  Minus, Activity, RefreshCw, Zap, AlertCircle, Info, X
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, LineChart, Line, Legend
} from 'recharts';

const STORAGE_KEY = 'quant_gemini_last_analysis';
const HISTORY_KEY = 'quant_gemini_library';

const METRIC_DEFINITIONS: Record<string, string> = {
  "P/E Ratio": "Price-to-Earnings Ratio. Measures current share price relative to per-share earnings.",
  "P/B Ratio": "Price-to-Book Ratio. Compares a firm's market cap to its book value.",
  "PEG Ratio": "Price/Earnings to Growth. P/E divided by earnings growth rate. PEG < 1.0 is often undervalued.",
  "EPS Growth": "Earnings Per Share Growth. Vital for CAN SLIM strategy.",
  "ROE": "Return on Equity. Profitability relative to shareholder equity.",
  "ROA": "Return on Assets. Profitability relative to total assets.",
  "Profit Margin": "Percentage of revenue remaining as profit.",
  "Net Margin": "Net Profit Margin after all expenses.",
  "Operating Margin": "Profitability from core operations.",
  "Current Ratio": "Ability to pay short-term obligations.",
  "Quick Ratio": "Acid-Test Ratio. Liquidity excluding inventory.",
  "Debt/Equity": "Financial leverage ratio.",
  "FCF": "Free Cash Flow after capital expenditures.",
  "Market Cap": "Total market value of outstanding shares.",
};

const parseValue = (val: string | number | undefined): number => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  const cleaned = val.replace(/[^0-9.-]/g, '');
  return cleaned ? parseFloat(cleaned) : 0;
};

const getTrendIcon = (current: number, compare: number) => {
  if (current > compare) return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (current < compare) return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

const getSentimentDot = (sentiment: string) => {
  const s = sentiment.toLowerCase();
  if (s.includes('bull')) return 'bg-green-500';
  if (s.includes('bear')) return 'bg-red-500';
  return 'bg-muted-foreground';
};

const YOYMetricCard = ({ title, data, unit = '%' }: { title: string; data: { current: number; previous: number }; unit?: string }) => {
  const current = data?.current || 0;
  const previous = data?.previous || 0;
  const diff = current - previous;
  const isPositive = diff >= 0;
  const chartData = [
    { name: 'Previous', value: previous },
    { name: 'Current', value: current },
  ];

  return (
    <div className="bg-card/50 p-5 rounded-2xl border border-border hover:border-primary/30 transition-all">
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">{title}</p>
      <div className="flex justify-between items-end">
        <div>
          <span className="text-2xl font-black text-foreground">{current.toLocaleString()}{unit}</span>
          <div className={`text-[10px] font-bold mt-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? '▲' : '▼'} {Math.abs(diff).toFixed(2)}{unit}
          </div>
        </div>
        <div className="h-12 w-20">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index === 1 ? 'hsl(var(--primary))' : 'hsl(var(--muted))'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const MetricInfoPopup = ({ title, onClose }: { title: string; onClose: () => void }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
    <Card className="max-w-md shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">{title}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed">
          {METRIC_DEFINITIONS[title] || "Financial metric used for institutional grade equity valuation."}
        </p>
      </CardContent>
    </Card>
  </div>
);

const QuantGemini: React.FC = () => {
  const [ticker, setTicker] = useState('');
  const [library, setLibrary] = useState<StockData[]>([]);
  const [activeInfo, setActiveInfo] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [state, setState] = useState<AnalysisState>({
    isLoading: false,
    error: null,
    data: null
  });

  // Load saved data on mount
  useEffect(() => {
    const savedLibrary = localStorage.getItem(HISTORY_KEY);
    if (savedLibrary) {
      try {
        setLibrary(JSON.parse(savedLibrary));
      } catch (e) { console.error(e); }
    }

    const savedAnalysis = localStorage.getItem(STORAGE_KEY);
    if (savedAnalysis) {
      try {
        const data = JSON.parse(savedAnalysis);
        setState(prev => ({ ...prev, data }));
        setTicker(data.symbol);
      } catch (e) { console.error(e); }
    }
  }, []);

  const handleSearch = async (e?: React.FormEvent, manualTicker?: string) => {
    e?.preventDefault();
    const targetTicker = manualTicker || ticker;
    if (!targetTicker || targetTicker.trim() === "") return;

    setState({ isLoading: true, error: null, data: state.data });
    
    try {
      const { data, error } = await supabase.functions.invoke('quantgemini-analyze', {
        body: { ticker: targetTicker.toUpperCase() }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setState({ isLoading: false, error: null, data });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (!manualTicker) setTicker(targetTicker.toUpperCase());
      
      toast.success(`Analysis complete for ${targetTicker.toUpperCase()}`);
    } catch (err: any) {
      console.error(err);
      setState({ isLoading: false, error: err.message || 'Analysis failed', data: state.data });
      toast.error(err.message || 'Analysis failed');
    }
  };

  const refreshPrice = async () => {
    if (!state.data?.symbol) return;
    setIsRefreshing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('quantgemini-analyze', {
        body: { ticker: state.data.symbol, action: 'refresh_price' }
      });

      if (error) throw error;
      
      if (data.liveData) {
        setState(prev => ({
          ...prev,
          data: prev.data ? { ...prev.data, liveData: data.liveData } : null
        }));
        toast.success('Price updated');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to refresh price');
    } finally {
      setIsRefreshing(false);
    }
  };

  const saveToLibrary = () => {
    if (!state.data) return;
    const newLibrary = [state.data, ...library.filter(item => item.symbol !== state.data?.symbol)].slice(0, 10);
    setLibrary(newLibrary);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newLibrary));
    toast.success('Saved to library');
  };

  const loadFromLibrary = (data: StockData) => {
    setState({ isLoading: false, error: null, data });
    setTicker(data.symbol);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const removeFromLibrary = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    const newLibrary = library.filter(item => item.symbol !== symbol);
    setLibrary(newLibrary);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newLibrary));
    toast.success('Removed from library');
  };

  const isInLibrary = state.data ? library.some(item => item.symbol === state.data?.symbol) : false;

  const getInvestorData = (data: StockData) => [
    { name: "O'Neil", strategy: 'Growth + Momentum', ...data.investorScorecard.oneil, color: 'text-blue-400' },
    { name: 'Buffett', strategy: 'Value + Moat', ...data.investorScorecard.buffett, color: 'text-amber-400' },
    { name: 'Ackman', strategy: 'Activist Value', ...data.investorScorecard.ackman, color: 'text-emerald-400' },
    { name: 'Shkreli', strategy: 'Event-driven', ...data.investorScorecard.shkreli, color: 'text-fuchsia-400' },
    { name: 'Lynch', strategy: 'GARP', ...data.investorScorecard.lynch, color: 'text-sky-400' },
  ];

  const getSignal = (tech: StockData['technicalAnalysis']) => {
    if (!tech) return 'Neutral';
    const rsi = parseFloat(tech.rsi);
    if (rsi > 70) return 'Sell';
    if (rsi < 30) return 'Buy';
    return 'Neutral';
  };

  const curPriceNum = state.data?.liveData?.currentPrice || parseValue(state.data?.price || '0');

  const getAnalystDistribution = (ratings: { buy: number; hold: number; sell: number }) => [
    { name: 'Buy', value: ratings.buy, fill: 'hsl(142, 76%, 36%)' },
    { name: 'Hold', value: ratings.hold, fill: 'hsl(48, 96%, 53%)' },
    { name: 'Sell', value: ratings.sell, fill: 'hsl(0, 84%, 60%)' },
  ];

  return (
    <PageLayout title="QuantGemini - AI Equity Research">
      {activeInfo && <MetricInfoPopup title={activeInfo} onClose={() => setActiveInfo(null)} />}
      
      {/* Search Header */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="Enter ticker symbol (e.g., AAPL, MSFT)"
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={state.isLoading}>
                {state.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Analyze
                  </>
                )}
              </Button>
            </form>
            
            {library.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {library.slice(0, 5).map((item) => (
                  <Button
                    key={item.symbol}
                    variant="outline"
                    size="sm"
                    onClick={() => loadFromLibrary(item)}
                    className="group"
                  >
                    {item.symbol}
                    <X 
                      className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => removeFromLibrary(e, item.symbol)}
                    />
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {state.isLoading && (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="relative w-20 h-20 mb-8">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-primary font-bold uppercase tracking-widest">Analyzing with Gemini AI...</p>
          <p className="text-muted-foreground text-sm mt-2">Fetching live data and running investor scorecards</p>
        </div>
      )}

      {/* Error State */}
      {state.error && !state.isLoading && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <div>
              <h4 className="font-bold text-destructive">Analysis Failed</h4>
              <p className="text-muted-foreground">{state.error}</p>
            </div>
            <Button variant="outline" className="ml-auto" onClick={() => handleSearch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {state.data && !state.isLoading && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header with Live Price */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <Badge variant="secondary" className="text-xl font-mono font-bold px-4 py-2">
                  {state.data.symbol}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={saveToLibrary}
                  className={isInLibrary ? 'text-primary' : ''}
                >
                  {isInLibrary ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                </Button>
                {state.data.liveData && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
                    LIVE
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-muted-foreground text-sm font-bold uppercase tracking-widest">{state.data.sector}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground text-sm">{state.data.industry}</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-foreground tracking-tight">{state.data.name}</h2>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-4 justify-end mb-2">
                <span className="text-4xl lg:text-5xl font-black text-foreground">
                  {state.data.liveData ? `$${state.data.liveData.currentPrice.toFixed(2)}` : state.data.price}
                </span>
                <Button variant="ghost" size="icon" onClick={refreshPrice} disabled={isRefreshing}>
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <div className={`text-xl font-bold ${state.data.liveData?.changePercent && state.data.liveData.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {state.data.liveData 
                  ? `${state.data.liveData.changePercent >= 0 ? '+' : ''}${state.data.liveData.changePercent.toFixed(2)}%`
                  : state.data.change
                }
              </div>
              {state.data.liveData && (
                <div className="text-xs text-muted-foreground mt-2">
                  H: ${state.data.liveData.high.toFixed(2)} • L: ${state.data.liveData.low.toFixed(2)}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Sector Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <span className="w-1.5 h-8 bg-primary rounded-full" />
                    Sector Gap Matrix (5 Peers)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] w-full mb-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={[
                          { 
                            peer: state.data.symbol, 
                            PE: parseValue(state.data.fundamentals.peRatio),
                            Growth: parseValue(state.data.fundamentals.epsGrowth),
                            Margin: parseValue(state.data.fundamentals.profitMargin)
                          },
                          ...state.data.sectorComparison.map(p => ({ 
                            peer: p.peer, 
                            PE: parseValue(p.peRatio),
                            Growth: parseValue(p.revenueGrowth),
                            Margin: parseValue(p.profitMargin)
                          }))
                        ]}
                        margin={{ left: 0, bottom: 40, top: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" opacity={0.3} />
                        <XAxis dataKey="peer" className="text-xs fill-muted-foreground" interval={0} tickLine={false} axisLine={false} dy={15} />
                        <YAxis className="text-xs fill-muted-foreground" axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '12px'
                          }} 
                        />
                        <Legend verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                        <Bar dataKey="PE" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="P/E Ratio" />
                        <Bar dataKey="Growth" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} name="Revenue Growth (%)" />
                        <Bar dataKey="Margin" fill="hsl(48, 96%, 53%)" radius={[4, 4, 0, 0]} name="Profit Margin (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Analyst Sentiment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <span className="w-1.5 h-8 bg-primary rounded-full" />
                    Analyst Ratings & Sentiment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center mb-8">
                    <div className="flex flex-col items-center">
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getAnalystDistribution(state.data.analystSentiment.ratings)}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={75}
                              paddingAngle={10}
                              dataKey="value"
                            >
                              {getAnalystDistribution(state.data.analystSentiment.ratings).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="text-center mt-4">
                        <span className={`text-4xl font-black ${state.data.analystSentiment.score > 70 ? 'text-green-500' : 'text-yellow-500'}`}>
                          {state.data.analystSentiment.consensus}
                        </span>
                      </div>
                    </div>
                    
                    <div className="md:col-span-2 space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl text-center">
                          <p className="text-xs text-green-500 font-bold uppercase mb-1">Buy</p>
                          <p className="text-2xl font-black text-foreground">{state.data.analystSentiment.ratings.buy}</p>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl text-center">
                          <p className="text-xs text-yellow-500 font-bold uppercase mb-1">Hold</p>
                          <p className="text-2xl font-black text-foreground">{state.data.analystSentiment.ratings.hold}</p>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center">
                          <p className="text-xs text-red-500 font-bold uppercase mb-1">Sell</p>
                          <p className="text-2xl font-black text-foreground">{state.data.analystSentiment.ratings.sell}</p>
                        </div>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-xl">
                        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Analyst Summary</p>
                        <p className="text-sm text-muted-foreground italic">"{state.data.analystSentiment.summary || 'N/A'}"</p>
                      </div>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Major Analyst Reports</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {state.data.analystSentiment.reports.map((report, i) => (
                      <div key={i} className="p-4 bg-muted/30 rounded-xl border border-border hover:border-primary/30 transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-xs font-bold text-primary">{report.analystName}</span>
                          <span className="text-sm font-black">{report.target}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3">"{report.snippet}"</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Fundamentals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <span className="w-1.5 h-8 bg-primary rounded-full" />
                    Quantitative Core DNA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FundamentalTable fundamentals={state.data.fundamentals} onInfoClick={(m) => setActiveInfo(m)} />
                </CardContent>
              </Card>

              {/* Volatility */}
              {state.data.ivAnalysis?.volatilityHistory && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <span className="w-1.5 h-8 bg-primary rounded-full" />
                      Volatility Architecture (IV vs HV)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={state.data.ivAnalysis.volatilityHistory}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" opacity={0.3} />
                          <XAxis dataKey="date" className="text-xs fill-muted-foreground" tickLine={false} axisLine={false} />
                          <YAxis className="text-xs fill-muted-foreground" tickLine={false} axisLine={false} unit="%" />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="iv" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} name="Implied Volatility" />
                          <Line type="monotone" dataKey="hv" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Historical Volatility" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Intelligence & Catalysts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <span className="w-1.5 h-8 bg-primary rounded-full" />
                    Intelligence & Catalyst Pipeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">Upcoming Events</p>
                      <CatalystList catalysts={state.data.catalysts} />
                    </div>
                    <div className="border-l border-border pl-8">
                      <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">Live Market Stream</p>
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4">
                          {state.data.recentNews.map((news, i) => (
                            <div key={i} className="p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-all flex gap-4">
                              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getSentimentDot(news.sentiment)}`} />
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-xs text-muted-foreground font-mono">{news.date}</span>
                                  <span className="text-xs text-muted-foreground">{news.source}</span>
                                </div>
                                <p className="text-sm text-foreground">{news.headline}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Technical Pulse */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm uppercase tracking-widest">Technical Pulse</CardTitle>
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-1.5" />
                      Live
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-center">
                  <p className={`text-6xl font-black mb-4 ${
                    getSignal(state.data.technicalAnalysis) === 'Buy' ? 'text-green-500' : 
                    getSignal(state.data.technicalAnalysis) === 'Sell' ? 'text-red-500' : 'text-yellow-500'
                  }`}>
                    {getSignal(state.data.technicalAnalysis)}
                  </p>
                  <p className="text-sm text-muted-foreground uppercase tracking-widest mb-6">RSI Momentum Consensus</p>
                  
                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-xl">
                      <span className="text-xs font-bold text-muted-foreground uppercase">Support</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{state.data.technicalAnalysis.support}</span>
                        {getTrendIcon(curPriceNum, parseValue(state.data.technicalAnalysis.support))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-xl">
                      <span className="text-xs font-bold text-muted-foreground uppercase">Resistance</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{state.data.technicalAnalysis.resistance}</span>
                        {getTrendIcon(curPriceNum, parseValue(state.data.technicalAnalysis.resistance))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bull/Bear Cases */}
              <Card className="border-green-500/20 bg-green-500/5">
                <CardHeader>
                  <CardTitle className="text-green-500 text-sm uppercase tracking-widest">Institutional Bull Case</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {state.data.bullishBearish.bullCase.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-3">
                        <span className="text-green-500 font-bold mt-0.5">▲</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-red-500/20 bg-red-500/5">
                <CardHeader>
                  <CardTitle className="text-red-500 text-sm uppercase tracking-widest">Global Risk Matrix</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {state.data.bullishBearish.bearCase.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-3">
                        <span className="text-red-500 font-bold mt-0.5">▼</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* YOY Efficiency */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <span className="w-1.5 h-6 bg-primary rounded-full" />
                    Efficiency Delta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <YOYMetricCard 
                    title="Revenue Delta" 
                    data={state.data.yoyComparison.revenue} 
                    unit={` ${state.data.yoyComparison.revenue.unit}`}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <YOYMetricCard title="ROE" data={state.data.yoyComparison.roe} />
                    <YOYMetricCard title="ROA" data={state.data.yoyComparison.roa} />
                  </div>
                </CardContent>
              </Card>

              {/* Technical Profile */}
              <Card>
                <CardHeader>
                  <CardTitle>Technical Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-xs font-bold text-muted-foreground uppercase">50-Day MA</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold font-mono">{state.data.technicalAnalysis.ma50}</span>
                      {getTrendIcon(curPriceNum, parseValue(state.data.technicalAnalysis.ma50))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-xs font-bold text-muted-foreground uppercase">200-Day MA</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold font-mono">{state.data.technicalAnalysis.ma200}</span>
                      {getTrendIcon(curPriceNum, parseValue(state.data.technicalAnalysis.ma200))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-xs font-bold text-muted-foreground uppercase">RSI(14)</span>
                    <span className="text-sm font-bold font-mono">{state.data.technicalAnalysis.rsi}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-xs font-bold text-muted-foreground uppercase">MACD</span>
                    <span className="text-sm font-bold">{state.data.technicalAnalysis.macd}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Strategy Scorecard */}
          <div className="mt-16">
            <div className="flex items-center gap-8 mb-12">
              <h3 className="text-3xl lg:text-4xl font-black text-foreground tracking-tight uppercase">
                Strategy Alignment Scorecard
              </h3>
              <div className="h-0.5 flex-1 bg-border rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {getInvestorData(state.data).map((inv, i) => (
                <InvestorCard key={i} {...inv} />
              ))}
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default QuantGemini;
