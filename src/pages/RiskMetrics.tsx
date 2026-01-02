import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, AlertTriangle, TrendingUp, TrendingDown, Activity, 
  Target, RefreshCw, Info, ChevronRight, BarChart3
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine } from "recharts";

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

const RiskMetrics = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const portfolioValue = 125000;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

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
    <PageLayout title="Risk Metrics">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">
              Portfolio Value: ${portfolioValue.toLocaleString()}
            </Badge>
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
                      <Tooltip
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
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: "Sharpe Ratio", value: riskMetrics.sharpeRatio, benchmark: 1.0, description: "Risk-adjusted return" },
                    { name: "Sortino Ratio", value: riskMetrics.sortinoRatio, benchmark: 1.5, description: "Downside risk-adjusted" },
                    { name: "Calmar Ratio", value: riskMetrics.calmarRatio, benchmark: 1.0, description: "Return vs max drawdown" },
                    { name: "Treynor Ratio", value: riskMetrics.treynorRatio, benchmark: 0.1, description: "Excess return per beta" },
                    { name: "Information Ratio", value: riskMetrics.informationRatio, benchmark: 0.3, description: "Active return vs tracking error" },
                  ].map((metric) => (
                    <div key={metric.name} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-foreground">{metric.name}</span>
                          <p className="text-xs text-muted-foreground">{metric.description}</p>
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

          <TabsContent value="positions" className="space-y-4">
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Position-Level Risk Analysis
                </CardTitle>
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
          </TabsContent>

          <TabsContent value="stress" className="space-y-4">
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Stress Test Scenarios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stressScenarios.map((scenario) => (
                  <div
                    key={scenario.name}
                    className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-foreground">{scenario.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {scenario.probability}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Estimated Impact</p>
                        <p className="text-xl font-bold text-destructive">{scenario.impact}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Portfolio Loss</p>
                        <p className="text-xl font-bold text-destructive">
                          -${Math.abs(Math.round(portfolioValue * (scenario.impact / 100))).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Progress 
                      value={Math.abs(scenario.impact)} 
                      className="h-1.5 mt-3"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default RiskMetrics;
