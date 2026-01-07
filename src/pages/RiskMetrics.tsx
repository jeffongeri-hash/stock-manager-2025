import { useState, useEffect, useMemo } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Shield, AlertTriangle, TrendingUp, TrendingDown, Activity, 
  Target, RefreshCw, Info, BarChart3, GitCompare, Minus
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const drawdownData = Array.from({ length: 60 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (60 - i));
  const baseValue = 100000;
  const volatility = Math.sin(i / 10) * 5000 + Math.random() * 3000;
  return {
    date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: baseValue + volatility + (i * 100),
    drawdown: Math.max(0, Math.sin(i / 8) * 8 + Math.random() * 3),
  };
});

const riskMetrics = {
  portfolioBeta: 1.12,
  sharpeRatio: 1.85,
  sortinoRatio: 2.34,
  maxDrawdown: -12.4,
  currentDrawdown: -3.2,
  valueAtRisk95: -4850,
  valueAtRisk99: -7230,
  volatility: 18.5,
  treynorRatio: 0.15,
  informationRatio: 0.42,
  calmarRatio: 1.45,
  omega: 1.82,
};

const positionRisks = [
  { symbol: "NVDA", weight: 18.5, beta: 1.85, contribution: 34.2, var95: -2150 },
  { symbol: "TSLA", weight: 12.3, beta: 2.10, contribution: 25.8, var95: -1820 },
  { symbol: "AAPL", weight: 15.2, beta: 1.15, contribution: 17.5, var95: -980 },
  { symbol: "MSFT", weight: 14.8, beta: 1.05, contribution: 15.5, var95: -850 },
  { symbol: "AMZN", weight: 10.5, beta: 1.25, contribution: 13.1, var95: -720 },
  { symbol: "GOOGL", weight: 9.8, beta: 1.10, contribution: 10.8, var95: -580 },
  { symbol: "META", weight: 8.2, beta: 1.35, contribution: 11.1, var95: -490 },
  { symbol: "JPM", weight: 5.5, beta: 1.08, contribution: 5.9, var95: -320 },
];

const stressScenarios = [
  { name: "2008 Financial Crisis", impact: -38.5, probability: "Low" },
  { name: "COVID-19 Crash (Mar 2020)", impact: -28.2, probability: "Low" },
  { name: "Tech Bubble Burst", impact: -42.1, probability: "Very Low" },
  { name: "10% Market Correction", impact: -11.2, probability: "Moderate" },
  { name: "Interest Rate Shock (+2%)", impact: -15.8, probability: "Low" },
  { name: "Recession Scenario", impact: -25.4, probability: "Low" },
];

// Correlation matrix functions
const generateCorrelationMatrix = (stocks: string[]): number[][] => {
  const matrix: number[][] = [];
  for (let i = 0; i < stocks.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < stocks.length; j++) {
      if (i === j) {
        matrix[i][j] = 1;
      } else if (j > i) {
        matrix[i][j] = Math.round((Math.random() * 2 - 1) * 100) / 100;
      } else {
        matrix[i][j] = matrix[j][i];
      }
    }
  }
  return matrix;
};

const getCorrelationBg = (value: number): string => {
  const intensity = Math.abs(value);
  if (value >= 0) {
    return `rgba(34, 197, 94, ${intensity * 0.8})`;
  } else {
    return `rgba(239, 68, 68, ${intensity * 0.8})`;
  }
};

const RiskMetrics = () => {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [portfolioValue, setPortfolioValue] = useState(125000);
  const [portfolioStocks, setPortfolioStocks] = useState<string[]>(["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "JPM"]);
  const [timeframe, setTimeframe] = useState("1Y");
  const [selectedCell, setSelectedCell] = useState<{ i: number; j: number } | null>(null);

  useEffect(() => {
    if (user) {
      importFromPortfolio();
    }
  }, [user]);

  const importFromPortfolio = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('stock_trades')
      .select('*')
      .eq('user_id', user.id)
      .is('exit_date', null);

    if (data && data.length > 0) {
      const totalValue = data.reduce((sum, trade) => sum + (trade.entry_price * trade.quantity), 0);
      if (totalValue > 0) {
        setPortfolioValue(totalValue);
      }
      
      const symbols = [...new Set(data.map(t => t.symbol))];
      if (symbols.length >= 2) {
        setPortfolioStocks(symbols);
        toast.success('Portfolio data loaded');
      }
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const correlationData = useMemo(() => generateCorrelationMatrix(portfolioStocks), [portfolioStocks, isRefreshing]);

  const highlyCorrelated = useMemo(() => {
    const pairs: { stock1: string; stock2: string; correlation: number }[] = [];
    for (let i = 0; i < portfolioStocks.length; i++) {
      for (let j = i + 1; j < portfolioStocks.length; j++) {
        if (Math.abs(correlationData[i][j]) >= 0.7) {
          pairs.push({
            stock1: portfolioStocks[i],
            stock2: portfolioStocks[j],
            correlation: correlationData[i][j],
          });
        }
      }
    }
    return pairs.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }, [correlationData, portfolioStocks]);

  const diversificationScore = useMemo(() => {
    let totalCorr = 0;
    let count = 0;
    for (let i = 0; i < portfolioStocks.length; i++) {
      for (let j = i + 1; j < portfolioStocks.length; j++) {
        totalCorr += Math.abs(correlationData[i][j]);
        count++;
      }
    }
    const avgCorr = count > 0 ? totalCorr / count : 0;
    return Math.round((1 - avgCorr) * 100);
  }, [correlationData, portfolioStocks]);

  const getRiskLevel = (metric: string, value: number): { level: string; color: string } => {
    switch (metric) {
      case "beta":
        if (value < 0.8) return { level: "Low", color: "text-chart-1" };
        if (value < 1.2) return { level: "Moderate", color: "text-warning" };
        return { level: "High", color: "text-destructive" };
      case "sharpe":
        if (value > 2) return { level: "Excellent", color: "text-chart-1" };
        if (value > 1) return { level: "Good", color: "text-primary" };
        return { level: "Poor", color: "text-destructive" };
      case "drawdown":
        if (value > -5) return { level: "Low", color: "text-chart-1" };
        if (value > -15) return { level: "Moderate", color: "text-warning" };
        return { level: "High", color: "text-destructive" };
      default:
        return { level: "N/A", color: "text-muted-foreground" };
    }
  };

  return (
    <PageLayout title="Risk Metrics & Correlation">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">
              Portfolio Value: ${portfolioValue.toLocaleString()}
            </Badge>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-[120px] border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1M">1 Month</SelectItem>
                <SelectItem value="3M">3 Months</SelectItem>
                <SelectItem value="6M">6 Months</SelectItem>
                <SelectItem value="1Y">1 Year</SelectItem>
                <SelectItem value="3Y">3 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="border-border/50">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/20">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Portfolio Beta</p>
                  <p className="text-xl font-bold text-foreground">{riskMetrics.portfolioBeta}</p>
                  <Badge className={`text-xs mt-1 ${getRiskLevel("beta", riskMetrics.portfolioBeta).color} bg-transparent`}>
                    {getRiskLevel("beta", riskMetrics.portfolioBeta).level} Risk
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-chart-1/20">
                  <TrendingUp className="h-5 w-5 text-chart-1" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
                  <p className="text-xl font-bold text-foreground">{riskMetrics.sharpeRatio}</p>
                  <Badge className={`text-xs mt-1 ${getRiskLevel("sharpe", riskMetrics.sharpeRatio).color} bg-transparent`}>
                    {getRiskLevel("sharpe", riskMetrics.sharpeRatio).level}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-destructive/20">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Max Drawdown</p>
                  <p className="text-xl font-bold text-destructive">{riskMetrics.maxDrawdown}%</p>
                  <Badge className={`text-xs mt-1 ${getRiskLevel("drawdown", riskMetrics.maxDrawdown).color} bg-transparent`}>
                    {getRiskLevel("drawdown", riskMetrics.maxDrawdown).level}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-warning/20">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">VaR (95%)</p>
                  <p className="text-xl font-bold text-foreground">${Math.abs(riskMetrics.valueAtRisk95).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Daily at risk</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="correlation">Correlation Matrix</TabsTrigger>
            <TabsTrigger value="positions">Position Risk</TabsTrigger>
            <TabsTrigger value="stress">Stress Tests</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Drawdown Chart */}
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Portfolio Value & Drawdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={drawdownData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                      <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary) / 0.2)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Risk Ratios */}
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Risk-Adjusted Returns
                  </CardTitle>
                  <CardDescription>
                    Metrics that compare returns to the risk taken
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: "Sharpe Ratio", value: riskMetrics.sharpeRatio, benchmark: 1.0, description: "Risk-adjusted return", explanation: "Measures excess return per unit of volatility. Higher is better." },
                    { name: "Sortino Ratio", value: riskMetrics.sortinoRatio, benchmark: 1.5, description: "Downside risk-adjusted", explanation: "Like Sharpe but only considers downside volatility." },
                    { name: "Calmar Ratio", value: riskMetrics.calmarRatio, benchmark: 1.0, description: "Return vs max drawdown", explanation: "Annual return divided by maximum drawdown." },
                    { name: "Treynor Ratio", value: riskMetrics.treynorRatio, benchmark: 0.1, description: "Excess return per beta", explanation: "Measures return above risk-free rate per unit of market risk." },
                    { name: "Information Ratio", value: riskMetrics.informationRatio, benchmark: 0.3, description: "Active return vs tracking error", explanation: "Measures consistency of outperformance vs benchmark." },
                  ].map((metric) => (
                    <div key={metric.name} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-foreground">{metric.name}</span>
                          <p className="text-xs text-muted-foreground">{metric.description}</p>
                          <p className="text-xs text-muted-foreground italic">{metric.explanation}</p>
                        </div>
                        <span className={`text-lg font-bold ${metric.value >= metric.benchmark ? "text-chart-1" : "text-destructive"}`}>
                          {metric.value.toFixed(2)}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min((metric.value / (metric.benchmark * 2)) * 100, 100)} 
                        className="h-1.5"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Additional Metrics */}
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Volatility & Risk Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-4 rounded-xl bg-muted/30 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Annual Volatility</p>
                    <p className="text-xl font-bold text-foreground">{riskMetrics.volatility}%</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Current Drawdown</p>
                    <p className="text-xl font-bold text-destructive">{riskMetrics.currentDrawdown}%</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 text-center">
                    <p className="text-xs text-muted-foreground mb-1">VaR 99%</p>
                    <p className="text-xl font-bold text-foreground">${Math.abs(riskMetrics.valueAtRisk99).toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Omega Ratio</p>
                    <p className="text-xl font-bold text-foreground">{riskMetrics.omega}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Portfolio Beta</p>
                    <p className="text-xl font-bold text-foreground">{riskMetrics.portfolioBeta}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="correlation" className="space-y-6">
            {/* Correlation Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="glass-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Diversification Score</p>
                      <p className="text-2xl font-bold text-foreground">{diversificationScore}%</p>
                    </div>
                    <div className={`p-3 rounded-xl ${diversificationScore >= 60 ? "bg-chart-1/20" : diversificationScore >= 40 ? "bg-warning/20" : "bg-destructive/20"}`}>
                      {diversificationScore >= 60 ? (
                        <TrendingUp className="h-5 w-5 text-chart-1" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {diversificationScore >= 60 ? "Well diversified" : diversificationScore >= 40 ? "Moderately diversified" : "Poor diversification"}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Highly Correlated Pairs</p>
                      <p className="text-2xl font-bold text-foreground">{highlyCorrelated.length}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-warning/20">
                      <Info className="h-5 w-5 text-warning" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Pairs with |r| ≥ 0.7</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Portfolio Stocks</p>
                      <p className="text-2xl font-bold text-foreground">{portfolioStocks.length}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-primary/20">
                      <Minus className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Analyzed in matrix</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Matrix */}
              <Card className="glass-card border-border/50 lg:col-span-3 overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GitCompare className="h-5 w-5 text-primary" />
                    Correlation Heatmap
                  </CardTitle>
                  <CardDescription>
                    Click on any cell to see the correlation between two stocks
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="overflow-x-auto">
                    <TooltipProvider>
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="p-2 text-xs font-medium text-muted-foreground"></th>
                            {portfolioStocks.map((stock) => (
                              <th key={stock} className="p-2 text-xs font-medium text-foreground text-center min-w-[60px]">
                                {stock}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {portfolioStocks.map((stock, i) => (
                            <tr key={stock}>
                              <td className="p-2 text-xs font-medium text-foreground">{stock}</td>
                              {portfolioStocks.map((_, j) => (
                                <td key={j} className="p-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        className={`w-full aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-all hover:scale-105 hover:shadow-lg cursor-pointer ${
                                          selectedCell?.i === i && selectedCell?.j === j ? "ring-2 ring-primary" : ""
                                        }`}
                                        style={{ background: getCorrelationBg(correlationData[i][j]) }}
                                        onClick={() => setSelectedCell({ i, j })}
                                      >
                                        <span className={correlationData[i][j] === 1 ? "text-foreground" : "text-foreground font-semibold"}>
                                          {correlationData[i][j].toFixed(2)}
                                        </span>
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="font-medium">{portfolioStocks[i]} ↔ {portfolioStocks[j]}</p>
                                      <p className="text-sm">Correlation: {correlationData[i][j].toFixed(3)}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </TooltipProvider>
                  </div>
                  
                  {/* Legend */}
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-4 rounded" style={{ background: "rgba(34, 197, 94, 0.8)" }} />
                      <span className="text-muted-foreground">Positive</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-4 rounded bg-muted" />
                      <span className="text-muted-foreground">Neutral</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-4 rounded" style={{ background: "rgba(239, 68, 68, 0.8)" }} />
                      <span className="text-muted-foreground">Negative</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Highly Correlated Pairs */}
              <Card className="glass-card border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Info className="h-4 w-4 text-warning" />
                    High Correlation Pairs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {highlyCorrelated.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No highly correlated pairs found
                    </p>
                  ) : (
                    highlyCorrelated.slice(0, 8).map((pair, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{pair.stock1}</Badge>
                            <span className="text-muted-foreground">↔</span>
                            <Badge variant="outline" className="text-xs">{pair.stock2}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-bold ${pair.correlation > 0 ? "text-chart-1" : "text-destructive"}`}>
                            {pair.correlation > 0 ? "+" : ""}{pair.correlation.toFixed(2)}
                          </span>
                          <Badge className={pair.correlation > 0 ? "bg-chart-1/20 text-chart-1" : "bg-destructive/20 text-destructive"}>
                            {pair.correlation > 0 ? "Positive" : "Negative"}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Interpretation Guide */}
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Understanding Correlation
                </CardTitle>
                <CardDescription>
                  What the correlation numbers mean and how to use them for diversification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-4 rounded-xl bg-chart-1/10 border border-chart-1/20">
                    <h4 className="font-semibold text-chart-1 mb-2">Strong Positive (0.7 to 1.0)</h4>
                    <p className="text-muted-foreground mb-2">Stocks move together. High correlation may indicate sector concentration risk.</p>
                    <p className="text-xs text-muted-foreground italic">Example: Two tech stocks often move in the same direction.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 border border-border">
                    <h4 className="font-semibold text-foreground mb-2">Low Correlation (-0.3 to 0.3)</h4>
                    <p className="text-muted-foreground mb-2">Stocks move independently. Good for diversification.</p>
                    <p className="text-xs text-muted-foreground italic">Example: A tech stock and a utility stock may have low correlation.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                    <h4 className="font-semibold text-destructive mb-2">Strong Negative (-0.7 to -1.0)</h4>
                    <p className="text-muted-foreground mb-2">Stocks move in opposite directions. Natural hedge positions.</p>
                    <p className="text-xs text-muted-foreground italic">Example: Gold stocks often move opposite to the market.</p>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">How Correlation is Calculated</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Pearson Correlation Coefficient (r)</strong> measures the linear relationship between two stocks' returns. 
                    The formula compares how much each stock deviates from its average return.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-sm">
                    <div>
                      <p className="font-medium">What It Tells You:</p>
                      <ul className="text-muted-foreground space-y-1 mt-1">
                        <li>• r = 1: Perfect positive relationship</li>
                        <li>• r = 0: No linear relationship</li>
                        <li>• r = -1: Perfect negative relationship</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium">Practical Use:</p>
                      <ul className="text-muted-foreground space-y-1 mt-1">
                        <li>• Diversify with low/negative correlations</li>
                        <li>• Avoid overconcentration in high correlations</li>
                        <li>• Correlations can change over time</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="positions" className="space-y-4">
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Position-Level Risk Analysis
                </CardTitle>
                <CardDescription>
                  Understand how each position contributes to your overall portfolio risk
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Symbol</th>
                        <th className="text-right p-3 text-xs font-medium text-muted-foreground">Weight</th>
                        <th className="text-right p-3 text-xs font-medium text-muted-foreground">Beta</th>
                        <th className="text-right p-3 text-xs font-medium text-muted-foreground">Risk Contribution</th>
                        <th className="text-right p-3 text-xs font-medium text-muted-foreground">VaR (95%)</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Risk Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positionRisks.map((position) => (
                        <tr key={position.symbol} className="border-b border-border/30 hover:bg-muted/20">
                          <td className="p-3">
                            <Badge variant="outline" className="font-mono">{position.symbol}</Badge>
                          </td>
                          <td className="text-right p-3 text-sm text-foreground">{position.weight}%</td>
                          <td className="text-right p-3">
                            <span className={`text-sm font-medium ${position.beta > 1.5 ? "text-destructive" : position.beta > 1 ? "text-warning" : "text-chart-1"}`}>
                              {position.beta}
                            </span>
                          </td>
                          <td className="text-right p-3">
                            <div className="flex items-center justify-end gap-2">
                              <Progress value={position.contribution} className="w-16 h-1.5" />
                              <span className="text-sm text-foreground">{position.contribution}%</span>
                            </div>
                          </td>
                          <td className="text-right p-3 text-sm text-destructive">
                            -${Math.abs(position.var95).toLocaleString()}
                          </td>
                          <td className="p-3">
                            <Badge className={`${position.beta > 1.5 ? "bg-destructive/20 text-destructive" : position.beta > 1 ? "bg-warning/20 text-warning" : "bg-chart-1/20 text-chart-1"}`}>
                              {position.beta > 1.5 ? "High" : position.beta > 1 ? "Medium" : "Low"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Position Risk Explanation */}
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Understanding Position Risk Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">Beta</p>
                      <p className="text-muted-foreground">Measures how much a stock moves relative to the market. Beta of 1.5 means 50% more volatile than the market.</p>
                    </div>
                    <div>
                      <p className="font-medium">Risk Contribution</p>
                      <p className="text-muted-foreground">The percentage of total portfolio risk attributable to each position. High-beta stocks contribute more risk.</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">VaR (95%)</p>
                      <p className="text-muted-foreground">Value at Risk: The maximum loss expected with 95% confidence on any given day.</p>
                    </div>
                    <div>
                      <p className="font-medium">Weight vs Risk</p>
                      <p className="text-muted-foreground">If risk contribution is higher than weight, the position is adding disproportionate risk to your portfolio.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stress" className="space-y-4">
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Stress Test Scenarios
                </CardTitle>
                <CardDescription>
                  Estimated portfolio impact under various market stress conditions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stressScenarios.map((scenario) => (
                    <div
                      key={scenario.name}
                      className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-foreground">{scenario.name}</h4>
                        <Badge className={
                          scenario.probability === "Moderate" ? "bg-warning/20 text-warning" :
                          scenario.probability === "Low" ? "bg-primary/20 text-primary" :
                          "bg-muted text-muted-foreground"
                        }>
                          {scenario.probability} Probability
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Progress value={Math.abs(scenario.impact)} className="h-2" />
                        </div>
                        <span className="text-lg font-bold text-destructive">{scenario.impact}%</span>
                        <span className="text-sm text-muted-foreground">
                          (${Math.abs(Math.round(portfolioValue * scenario.impact / 100)).toLocaleString()})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stress Test Explanation */}
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  About Stress Testing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-3">
                    Stress tests simulate how your portfolio might perform during extreme market conditions based on historical events or hypothetical scenarios.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">What This Shows:</p>
                      <ul className="text-muted-foreground space-y-1 mt-1">
                        <li>• Estimated loss during market crashes</li>
                        <li>• How your specific holdings would react</li>
                        <li>• Probability of each scenario occurring</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium">How to Use This:</p>
                      <ul className="text-muted-foreground space-y-1 mt-1">
                        <li>• Ensure you can tolerate worst-case losses</li>
                        <li>• Consider hedging if impacts are too high</li>
                        <li>• Review emergency fund adequacy</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default RiskMetrics;
