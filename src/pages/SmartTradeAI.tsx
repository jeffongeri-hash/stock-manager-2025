import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  ShieldAlert, 
  Target, 
  Wallet, 
  Search, 
  Percent, 
  Loader2,
  BarChart3,
  Zap,
  RefreshCw,
  Clock,
  Newspaper,
  Smile,
  Meh,
  Frown,
  Save,
  History,
  Trash2,
  X,
  DollarSign,
  Calculator,
  CheckCircle2,
  ArrowUpRight,
  Globe,
  MessageSquare,
  Share2,
  Activity,
  ArrowDownRight,
  Play,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine,
  LineChart,
  Line
} from 'recharts';

// --- Types ---
interface StaggeredExit {
  level: string;
  percentage: number;
  price: number;
  projectedPL: number;
  filled?: boolean;
}

interface NewsArticle {
  title: string;
  summary: string;
  source: string;
  time: string;
}

interface PlatformSentiment {
  platform: string;
  label: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  summary: string;
}

interface SentimentData {
  score: number;
  label: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  summary: string;
  detailedSocial: PlatformSentiment[];
  detailedNews: PlatformSentiment[];
  history: number[];
}

interface TradePlan {
  id: string;
  ticker: string;
  currentPrice: number;
  entryPrice: number;
  initialStopLoss: number;
  currentStopLoss: number;
  highestPriceReached: number;
  takeProfits: StaggeredExit[];
  positionSize: number;
  shares: number;
  reasoning: string;
  sentiment: SentimentData;
  newsArticles: NewsArticle[];
  portfolioSize: number;
  riskPercent: number;
  timestamp: number;
  projectedLoss: number;
}

interface PricePoint {
  time: string;
  price: number;
}

interface Headline {
  text: string;
  time: string;
}

interface SimulationState {
  isActive: boolean;
  currentPrice: number;
  remainingShares: number;
  realizedPL: number;
  history: PricePoint[];
  status: 'PENDING' | 'RUNNING' | 'STOPPED_OUT' | 'SUCCESS' | 'COMPLETED';
  fills: string[];
}

const STORAGE_KEY = 'smarttrade_saved_plans_v1';

// --- Sub Components ---

const SentimentSparkline = ({ history }: { history: number[] }) => {
  const data = useMemo(() => (history || []).map((val, i) => ({ val, i })), [history]);
  if (!data.length) return null;
  const isUp = history[history.length - 1] >= history[0];
  const color = isUp ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))';

  return (
    <div className="w-32 h-12">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="val" stroke={color} strokeWidth={2} dot={false} isAnimationActive={true} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const SimulationHub = ({ plan, sim, onStart, onReset }: { 
  plan: TradePlan; 
  sim: SimulationState; 
  onStart: () => void; 
  onReset: () => void;
}) => {
  const getStatusColor = () => {
    if (sim.status === 'SUCCESS' || sim.status === 'COMPLETED') return 'text-emerald-500';
    if (sim.status === 'STOPPED_OUT') return 'text-destructive';
    return 'text-primary';
  };

  return (
    <Card className="mt-6">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-primary" />
              Execution Simulation
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Live stress test & hypothetical ROI modeling</p>
          </div>
          <div className="flex items-center gap-2">
            {!sim.isActive && sim.status === 'PENDING' ? (
              <Button onClick={onStart} className="gap-2">
                <Play className="w-4 h-4" /> Start Simulation
              </Button>
            ) : (
              <Button onClick={onReset} variant="outline" className="gap-2">
                <RotateCcw className="w-4 h-4" /> Reset
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-muted/50 border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</span>
            <div className={`text-lg font-bold uppercase mt-1 ${getStatusColor()}`}>
              {sim.status === 'RUNNING' ? (
                <span className="flex items-center gap-2">
                  Live <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                </span>
              ) : sim.status}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current Price</span>
            <div className="text-xl font-bold font-mono mt-1">${sim.currentPrice.toFixed(2)}</div>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Realized P&L</span>
            <div className={`text-xl font-bold font-mono mt-1 ${sim.realizedPL >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
              {sim.realizedPL >= 0 ? '+' : ''}${Math.abs(sim.realizedPL).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Remaining</span>
            <div className="text-lg font-bold mt-1">
              {sim.remainingShares.toLocaleString()} Units
              <div className="w-full bg-muted h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-primary h-full transition-all duration-500" style={{ width: `${(sim.remainingShares / plan.shares) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {sim.fills.length > 0 && (
          <div className="mt-4 space-y-2">
            {sim.fills.map((fill, i) => (
              <div key={i} className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-500">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">{fill}</span>
              </div>
            ))}
            {sim.status === 'STOPPED_OUT' && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive">
                <ShieldAlert className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Liquidated: Stop Loss hit at ${sim.currentPrice.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const LivePriceChart = ({ plan, history, sim }: { 
  plan: TradePlan; 
  history: PricePoint[]; 
  sim?: SimulationState;
}) => {
  const chartData = useMemo(() => {
    const baseHistory = sim?.isActive ? sim.history : history;
    if (baseHistory.length === 0) return [];
    if (baseHistory.length === 1) return [{ ...baseHistory[0], time: 'START' }, { ...baseHistory[0], time: 'NOW' }];
    return baseHistory;
  }, [history, sim]);

  const yDomain = useMemo(() => {
    const levels = [plan.currentStopLoss, plan.entryPrice, ...plan.takeProfits.map(tp => tp.price)];
    const allPrices = [...levels, ...chartData.map(h => h.price)].filter(p => typeof p === 'number' && !isNaN(p));
    if (allPrices.length === 0) return [0, 100];
    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);
    const padding = (max - min) * 0.15 || max * 0.02;
    return [min - padding, max + padding];
  }, [plan, chartData]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <BarChart3 className="w-4 h-4 text-primary" />
          {sim?.isActive ? 'Simulation Mode' : 'Price Trajectory'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[350px] p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPriceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={sim?.isActive ? "hsl(var(--chart-2))" : "hsl(var(--primary))"} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={sim?.isActive ? "hsl(var(--chart-2))" : "hsl(var(--primary))"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis domain={yDomain} orientation="right" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={55} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  borderColor: 'hsl(var(--border))', 
                  borderRadius: '8px', 
                  fontSize: '12px' 
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke={sim?.isActive ? "hsl(var(--chart-2))" : "hsl(var(--primary))"} 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorPriceGrad)" 
                isAnimationActive={false} 
              />
              <ReferenceLine y={plan.currentStopLoss} stroke="hsl(var(--destructive))" strokeDasharray="4 4" strokeWidth={2} />
              <ReferenceLine y={plan.entryPrice} stroke="hsl(var(--primary))" strokeDasharray="4 4" strokeWidth={2} />
              {plan.takeProfits.map((tp, idx) => (
                <ReferenceLine key={idx} y={tp.price} stroke="hsl(var(--chart-2))" strokeDasharray="4 4" strokeWidth={2} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="px-4 pb-3 flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><div className="w-3 h-0.5 bg-destructive" /> Stop Loss</span>
            <span className="flex items-center gap-1"><div className="w-3 h-0.5 bg-primary" /> Entry</span>
            <span className="flex items-center gap-1"><div className="w-3 h-0.5 bg-emerald-500" /> Take Profits</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SentimentHub = ({ sentiment }: { sentiment: SentimentData }) => {
  const getBadgeVariant = (label: string): "default" | "secondary" | "destructive" => {
    switch (label) {
      case 'POSITIVE': return 'default';
      case 'NEGATIVE': return 'destructive';
      default: return 'secondary';
    }
  };

  const getSentimentIcon = (label: string) => {
    switch (label) {
      case 'POSITIVE': return <Smile className="w-4 h-4 text-emerald-500" />;
      case 'NEGATIVE': return <Frown className="w-4 h-4 text-destructive" />;
      default: return <Meh className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="w-5 h-5 text-primary" />
              Sentiment Intelligence
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Cross-platform social & news aggregator</p>
          </div>
          <SentimentSparkline history={sentiment.history} />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="social" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="social" className="gap-2">
              <MessageSquare className="w-4 h-4" /> Social
            </TabsTrigger>
            <TabsTrigger value="news" className="gap-2">
              <Newspaper className="w-4 h-4" /> News
            </TabsTrigger>
          </TabsList>
          <TabsContent value="social" className="space-y-3">
            {sentiment.detailedSocial?.map((s, i) => (
              <div key={i} className="p-4 border rounded-lg bg-muted/30">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    {s.platform.toLowerCase().includes('reddit') && <MessageSquare className="w-4 h-4 text-orange-500" />}
                    {s.platform.toLowerCase().includes('twitter') && <Share2 className="w-4 h-4 text-blue-400" />}
                    {s.platform.toLowerCase().includes('stocktwits') && <Activity className="w-4 h-4 text-green-400" />}
                    <span className="font-semibold text-sm">{s.platform}</span>
                  </div>
                  <Badge variant={getBadgeVariant(s.label)}>{s.label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground italic">"{s.summary}"</p>
              </div>
            ))}
          </TabsContent>
          <TabsContent value="news" className="space-y-3">
            {sentiment.detailedNews?.map((s, i) => (
              <div key={i} className="p-4 border rounded-lg bg-muted/30">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm">{s.platform}</span>
                  </div>
                  <Badge variant={getBadgeVariant(s.label)}>{s.label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{s.summary}</p>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const NewsIntelligence = ({ articles }: { articles: NewsArticle[] }) => {
  if (!articles || articles.length === 0) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Newspaper className="w-5 h-5 text-primary" />
          News Intelligence
        </CardTitle>
        <p className="text-xs text-muted-foreground">Market-moving headlines & analysis</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {articles.map((art, i) => (
            <div key={i} className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="outline" className="text-xs">{art.source}</Badge>
                <span className="text-xs text-muted-foreground">{art.time}</span>
              </div>
              <h5 className="font-semibold text-sm mb-2">{art.title}</h5>
              <p className="text-sm text-muted-foreground italic">"{art.summary}"</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// --- Main Component ---
const SmartTradeAI = () => {
  const [ticker, setTicker] = useState('NVDA');
  const [portfolioSize, setPortfolioSize] = useState(25000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [plan, setPlan] = useState<TradePlan | null>(null);
  const [savedPlans, setSavedPlans] = useState<TradePlan[]>([]);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [sim, setSim] = useState<SimulationState>({
    isActive: false,
    currentPrice: 0,
    remainingShares: 0,
    realizedPL: 0,
    history: [],
    status: 'PENDING',
    fills: []
  });

  const simInterval = useRef<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setSavedPlans(JSON.parse(saved)); } catch (e) { console.error("History parse failure."); }
    }
  }, []);

  const saveToLocalStorage = (plans: TradePlan[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    setSavedPlans(plans);
  };

  useEffect(() => {
    let intervalId: number | undefined;
    if (plan && !sim.isActive) intervalId = window.setInterval(() => refreshPrice(), 30000);
    return () => clearInterval(intervalId);
  }, [plan?.id, sim.isActive]);

  const refreshPrice = async () => {
    if (!plan || loading || refreshing) return;
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('smarttrade-ai', {
        body: { ticker: plan.ticker, action: 'refresh_price' }
      });

      if (error) throw error;
      
      const newPrice = data?.price;
      if (!isNaN(newPrice) && newPrice > 0) {
        setPlan(prev => {
          if (!prev) return null;
          let nextHighest = Math.max(prev.highestPriceReached, newPrice);
          let nextStopLoss = prev.currentStopLoss;
          const initialRiskGap = Math.abs(prev.entryPrice - prev.initialStopLoss);
          if (newPrice > prev.entryPrice) {
            nextStopLoss = Math.max(prev.currentStopLoss, nextHighest - initialRiskGap);
          }
          return { ...prev, currentPrice: newPrice, highestPriceReached: nextHighest, currentStopLoss: nextStopLoss };
        });
        setPriceHistory(prev => [...prev, { 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
          price: newPrice 
        }].slice(-200));
      }
    } catch (err) { 
      console.warn("Real-time tick failure"); 
    } finally { setRefreshing(false); }
  };

  const startSimulation = () => {
    if (!plan) return;
    setSim({
      isActive: true,
      currentPrice: plan.entryPrice,
      remainingShares: plan.shares,
      realizedPL: 0,
      history: [{ time: 'ENTRY', price: plan.entryPrice }],
      status: 'RUNNING',
      fills: []
    });

    let step = 0;
    let currentPrice = plan.entryPrice;
    let currentShares = plan.shares;
    let realizedPL = 0;
    let fills: string[] = [];
    let hitTPs = [false, false, false];

    simInterval.current = window.setInterval(() => {
      step++;
      let targetPrice = plan.takeProfits[2].price;
      if (!hitTPs[0]) targetPrice = plan.takeProfits[0].price;
      else if (!hitTPs[1]) targetPrice = plan.takeProfits[1].price;

      const move = (targetPrice - currentPrice) * 0.05 + (Math.random() - 0.5) * (plan.entryPrice * 0.002);
      currentPrice += move;

      const newPoint = { time: `T+${step}`, price: currentPrice };

      plan.takeProfits.forEach((tp, idx) => {
        if (!hitTPs[idx] && currentPrice >= tp.price) {
          hitTPs[idx] = true;
          const closedShares = Math.floor(plan.shares * (tp.percentage / 100));
          const profit = (currentPrice - plan.entryPrice) * closedShares;
          realizedPL += profit;
          currentShares -= closedShares;
          fills.push(`FILL: ${tp.level} hit at $${currentPrice.toFixed(2)} | Profit: +$${profit.toFixed(0)}`);
        }
      });

      if (currentPrice <= plan.currentStopLoss) {
        const loss = (currentPrice - plan.entryPrice) * currentShares;
        realizedPL += loss;
        currentShares = 0;
        clearInterval(simInterval.current!);
        setSim(prev => ({ 
          ...prev, 
          currentPrice, 
          remainingShares: 0, 
          realizedPL, 
          status: 'STOPPED_OUT',
          fills,
          history: [...prev.history, newPoint]
        }));
        return;
      }

      if (hitTPs[2]) {
        clearInterval(simInterval.current!);
        setSim(prev => ({ 
          ...prev, 
          currentPrice, 
          remainingShares: 0, 
          realizedPL, 
          status: 'COMPLETED',
          fills,
          history: [...prev.history, newPoint]
        }));
        return;
      }

      setSim(prev => ({
        ...prev,
        currentPrice,
        remainingShares: currentShares,
        realizedPL,
        fills: [...fills],
        history: [...prev.history, newPoint]
      }));

      if (step > 150) {
        clearInterval(simInterval.current!);
        setSim(prev => ({ ...prev, status: 'SUCCESS' }));
      }
    }, 150);
  };

  const resetSimulation = () => {
    if (simInterval.current) clearInterval(simInterval.current);
    setSim({
      isActive: false,
      currentPrice: 0,
      remainingShares: 0,
      realizedPL: 0,
      history: [],
      status: 'PENDING',
      fills: []
    });
  };

  const generateTradePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTicker = ticker.trim().toUpperCase();
    if (!cleanTicker) return;
    setLoading(true);
    setPriceHistory([]);
    setHeadlines([]);
    resetSimulation();

    try {
      const { data, error } = await supabase.functions.invoke('smarttrade-ai', {
        body: { ticker: cleanTicker, portfolioSize, riskPercent }
      });

      if (error) throw error;
      if (!data || !data.currentPrice) throw new Error(`Could not get market data for ${cleanTicker}`);

      const riskAmount = portfolioSize * (riskPercent / 100);
      const riskPerShare = Math.abs(data.entryPrice - data.stopLoss);
      let sharesCount = riskPerShare > 0.001 ? Math.floor(riskAmount / riskPerShare) : 0;
      sharesCount = Math.min(sharesCount, Math.floor(portfolioSize / data.entryPrice));

      const newPlan: TradePlan = {
        id: crypto.randomUUID(),
        ticker: cleanTicker,
        currentPrice: data.currentPrice,
        entryPrice: data.entryPrice,
        initialStopLoss: data.stopLoss,
        currentStopLoss: data.stopLoss,
        highestPriceReached: data.currentPrice,
        takeProfits: [
          { level: 'TP1 (50%)', percentage: 50, price: data.tp1, projectedPL: (data.tp1 - data.entryPrice) * (sharesCount * 0.5) },
          { level: 'TP2 (30%)', percentage: 30, price: data.tp2, projectedPL: (data.tp2 - data.entryPrice) * (sharesCount * 0.3) },
          { level: 'TP3 (20%)', percentage: 20, price: data.tp3, projectedPL: (data.tp3 - data.entryPrice) * (sharesCount * 0.2) },
        ],
        projectedLoss: (data.entryPrice - data.stopLoss) * sharesCount,
        positionSize: sharesCount * data.entryPrice,
        shares: sharesCount,
        reasoning: data.reasoning,
        sentiment: data.sentiment || {
          score: 0,
          label: 'NEUTRAL',
          summary: 'No sentiment data available',
          detailedSocial: [],
          detailedNews: [],
          history: []
        },
        newsArticles: data.newsArticles || [],
        portfolioSize,
        riskPercent,
        timestamp: Date.now()
      };

      setPlan(newPlan);
      setHeadlines(data.headlines || []);
      setPriceHistory([{ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), price: data.currentPrice }]);
      toast.success(`Trade plan generated for ${cleanTicker}`);
    } catch (err: any) {
      console.error(err);
      let msg = err.message || "An unexpected error occurred.";
      if (msg.includes("429")) msg = "Rate limit exceeded. Please wait and try again.";
      toast.error(msg);
    } finally { 
      setLoading(false); 
    }
  };

  const savePlan = () => {
    if (!plan) return;
    const updated = [plan, ...savedPlans.filter(p => p.id !== plan.id)].slice(0, 20);
    saveToLocalStorage(updated);
    toast.success('Trade plan saved');
  };

  const deletePlan = (id: string) => {
    const updated = savedPlans.filter(p => p.id !== id);
    saveToLocalStorage(updated);
    toast.success('Plan deleted');
  };

  const loadPlan = (p: TradePlan) => {
    setPlan(p);
    setTicker(p.ticker);
    setPortfolioSize(p.portfolioSize);
    setRiskPercent(p.riskPercent);
    setShowHistory(false);
    resetSimulation();
  };

  const projections = useMemo(() => {
    if (!plan) return null;
    const totalPotentialProfit = plan.takeProfits.reduce((acc, curr) => acc + curr.projectedPL, 0);
    return { totalPotentialProfit, riskReward: plan.projectedLoss > 0.01 ? totalPotentialProfit / plan.projectedLoss : 0 };
  }, [plan]);

  return (
    <PageLayout title="SmartTrade AI">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Control Panel */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Control Center
                </CardTitle>
                <Button variant="outline" size="icon" onClick={() => setShowHistory(!showHistory)}>
                  <History className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showHistory ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Saved Plans
                  </h4>
                  {savedPlans.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No saved plans yet</p>
                  ) : (
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {savedPlans.map(p => (
                          <div key={p.id} className="p-3 border rounded-lg flex justify-between items-center hover:bg-muted/50 transition-colors">
                            <button onClick={() => loadPlan(p)} className="flex-1 text-left">
                              <div className="font-mono font-bold">{p.ticker}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(p.timestamp).toLocaleDateString()}
                              </div>
                            </button>
                            <Button variant="ghost" size="icon" onClick={() => deletePlan(p.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              ) : (
                <form onSubmit={generateTradePlan} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ticker">Asset Symbol</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="ticker"
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value.toUpperCase())}
                        className="pl-10 font-mono uppercase"
                        placeholder="e.g. AAPL, NVDA, BTC"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portfolio">Portfolio Size ($)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="portfolio"
                        type="number"
                        value={portfolioSize}
                        onChange={(e) => setPortfolioSize(Number(e.target.value))}
                        className="pl-10 font-mono"
                        min={1000}
                        step={1000}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="risk">Risk per Trade (%)</Label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="risk"
                        type="number"
                        value={riskPercent}
                        onChange={(e) => setRiskPercent(Number(e.target.value))}
                        className="pl-10 font-mono"
                        min={0.1}
                        max={10}
                        step={0.1}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4" />
                        Generate Trade Plan
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats when plan exists */}
          {plan && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2 font-mono">{plan.ticker}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={savePlan}>
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={refreshPrice} disabled={refreshing}>
                      <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <div className="text-xs text-muted-foreground mb-1">Current Price</div>
                    <div className="text-xl font-bold font-mono">${plan.currentPrice.toFixed(2)}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <div className="text-xs text-muted-foreground mb-1">Entry</div>
                    <div className="text-xl font-bold font-mono text-primary">${plan.entryPrice.toFixed(2)}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Stop Loss
                    </div>
                    <div className="text-xl font-bold font-mono text-destructive">${plan.currentStopLoss.toFixed(2)}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Calculator className="w-3 h-3" /> Position
                    </div>
                    <div className="text-lg font-bold">{plan.shares.toLocaleString()} shares</div>
                  </div>
                </div>

                {/* Take Profits */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Target className="w-3 h-3" /> Take Profit Levels
                  </div>
                  {plan.takeProfits.map((tp, i) => (
                    <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-sm font-medium">{tp.level}</span>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-500">${tp.price.toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground ml-2">+${tp.projectedPL.toFixed(0)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Projections */}
                {projections && (
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Potential Profit</span>
                      <span className="font-mono font-bold text-emerald-500 flex items-center gap-1">
                        <ArrowUpRight className="w-4 h-4" />
                        +${projections.totalPotentialProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Max Loss</span>
                      <span className="font-mono font-bold text-destructive flex items-center gap-1">
                        <ArrowDownRight className="w-4 h-4" />
                        -${plan.projectedLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-primary/20">
                      <span className="text-sm font-semibold">Risk/Reward</span>
                      <Badge variant="outline" className="font-mono">
                        1:{projections.riskReward.toFixed(1)}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-6">
          {!plan ? (
            <Card className="py-20">
              <CardContent className="text-center">
                <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4">
                  <TrendingUp className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">SmartTrade AI Planner</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Enter a ticker symbol and portfolio parameters to generate an AI-powered institutional-grade trade plan with optimal entry, stop-loss, and staggered take-profit levels.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Headlines Ticker */}
              {headlines.length > 0 && (
                <Card className="overflow-hidden">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-4 overflow-x-auto">
                      <Badge variant="outline" className="shrink-0 gap-1">
                        <Activity className="w-3 h-3 animate-pulse text-primary" />
                        {plan.ticker} Intel
                      </Badge>
                      {headlines.map((h, i) => (
                        <div key={i} className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-medium">{h.text}</span>
                          <span className="text-xs text-muted-foreground">{h.time}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Price Chart */}
              <LivePriceChart plan={plan} history={priceHistory} sim={sim} />

              {/* Simulation Hub */}
              <SimulationHub plan={plan} sim={sim} onStart={startSimulation} onReset={resetSimulation} />

              {/* AI Reasoning */}
              {plan.reasoning && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Zap className="w-5 h-5 text-primary" />
                      AI Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{plan.reasoning}</p>
                  </CardContent>
                </Card>
              )}

              {/* Sentiment & News */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SentimentHub sentiment={plan.sentiment} />
                <NewsIntelligence articles={plan.newsArticles} />
              </div>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default SmartTradeAI;
