import { useState, useMemo } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Info, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const portfolioStocks = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "JPM", "V", "UNH"];

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

const getCorrelationColor = (value: number): string => {
  if (value >= 0.7) return "bg-chart-1 text-chart-1-foreground";
  if (value >= 0.4) return "bg-chart-1/60 text-foreground";
  if (value >= 0.1) return "bg-chart-1/30 text-foreground";
  if (value > -0.1) return "bg-muted text-muted-foreground";
  if (value > -0.4) return "bg-chart-2/30 text-foreground";
  if (value > -0.7) return "bg-chart-2/60 text-foreground";
  return "bg-chart-2 text-chart-2-foreground";
};

const getCorrelationBg = (value: number): string => {
  const intensity = Math.abs(value);
  if (value >= 0) {
    return `rgba(34, 197, 94, ${intensity * 0.8})`;
  } else {
    return `rgba(239, 68, 68, ${intensity * 0.8})`;
  }
};

const CorrelationMatrix = () => {
  const [timeframe, setTimeframe] = useState("1Y");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ i: number; j: number } | null>(null);

  const correlationData = useMemo(() => generateCorrelationMatrix(portfolioStocks), []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

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
  }, [correlationData]);

  const diversificationScore = useMemo(() => {
    let totalCorr = 0;
    let count = 0;
    for (let i = 0; i < portfolioStocks.length; i++) {
      for (let j = i + 1; j < portfolioStocks.length; j++) {
        totalCorr += Math.abs(correlationData[i][j]);
        count++;
      }
    }
    const avgCorr = totalCorr / count;
    return Math.round((1 - avgCorr) * 100);
  }, [correlationData]);

  return (
    <PageLayout title="Correlation Matrix">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-3">
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
            <Button variant="outline" size="icon" onClick={handleRefresh} className="border-border/50">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
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
        </div>

        {/* Stats Cards */}
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
              <CardTitle className="text-lg">Correlation Heatmap</CardTitle>
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
              Interpretation Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 rounded-xl bg-chart-1/10 border border-chart-1/20">
                <h4 className="font-semibold text-chart-1 mb-2">Strong Positive (0.7 to 1.0)</h4>
                <p className="text-muted-foreground">Stocks move together. High correlation may indicate sector concentration risk.</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 border border-border">
                <h4 className="font-semibold text-foreground mb-2">Low Correlation (-0.3 to 0.3)</h4>
                <p className="text-muted-foreground">Stocks move independently. Good for diversification.</p>
              </div>
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                <h4 className="font-semibold text-destructive mb-2">Strong Negative (-0.7 to -1.0)</h4>
                <p className="text-muted-foreground">Stocks move in opposite directions. Natural hedge positions.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default CorrelationMatrix;
