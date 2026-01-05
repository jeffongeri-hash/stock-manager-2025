import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Plus, X, Calculator, TrendingUp, Shield, Target } from 'lucide-react';
import { toast } from 'sonner';

interface Stock {
  symbol: string;
  expectedReturn: number;
  volatility: number;
  weight?: number;
}

interface PortfolioPoint {
  risk: number;
  return: number;
  weights: number[];
  sharpe: number;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(142, 76%, 36%)', 'hsl(280, 65%, 60%)', 'hsl(25, 95%, 53%)'];

const DEFAULT_STOCKS: Stock[] = [
  { symbol: 'AAPL', expectedReturn: 12, volatility: 25 },
  { symbol: 'GOOGL', expectedReturn: 15, volatility: 30 },
  { symbol: 'MSFT', expectedReturn: 11, volatility: 22 },
];

export const PortfolioOptimizer = () => {
  const [stocks, setStocks] = useState<Stock[]>(DEFAULT_STOCKS);
  const [newStock, setNewStock] = useState({ symbol: '', expectedReturn: '', volatility: '' });
  const [riskTolerance, setRiskTolerance] = useState([50]);
  const [riskFreeRate, setRiskFreeRate] = useState(4.5);
  const [correlationMatrix, setCorrelationMatrix] = useState<number[][]>([]);
  const [useCustomCorrelations, setUseCustomCorrelations] = useState(false);

  // Generate default correlation matrix (moderate correlations)
  const defaultCorrelationMatrix = useMemo(() => {
    const n = stocks.length;
    const matrix: number[][] = [];
    for (let i = 0; i < n; i++) {
      matrix[i] = [];
      for (let j = 0; j < n; j++) {
        if (i === j) matrix[i][j] = 1;
        else matrix[i][j] = 0.3 + Math.random() * 0.3; // Random correlations between 0.3-0.6
      }
    }
    // Make symmetric
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        matrix[j][i] = matrix[i][j];
      }
    }
    return matrix;
  }, [stocks.length]);

  const activeCorrelations = useCustomCorrelations && correlationMatrix.length === stocks.length 
    ? correlationMatrix 
    : defaultCorrelationMatrix;

  // Calculate portfolio variance
  const calculatePortfolioVariance = (weights: number[], volatilities: number[], correlations: number[][]) => {
    let variance = 0;
    const n = weights.length;
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        variance += weights[i] * weights[j] * (volatilities[i] / 100) * (volatilities[j] / 100) * correlations[i][j];
      }
    }
    
    return variance;
  };

  // Calculate portfolio return
  const calculatePortfolioReturn = (weights: number[], returns: number[]) => {
    return weights.reduce((sum, w, i) => sum + w * returns[i], 0);
  };

  // Generate efficient frontier points
  const efficientFrontier = useMemo(() => {
    if (stocks.length < 2) return [];

    const returns = stocks.map(s => s.expectedReturn);
    const volatilities = stocks.map(s => s.volatility);
    const n = stocks.length;
    const points: PortfolioPoint[] = [];

    // Generate random portfolios to approximate efficient frontier
    for (let i = 0; i < 1000; i++) {
      // Generate random weights
      const rawWeights = Array(n).fill(0).map(() => Math.random());
      const sum = rawWeights.reduce((a, b) => a + b, 0);
      const weights = rawWeights.map(w => w / sum);

      const portfolioReturn = calculatePortfolioReturn(weights, returns);
      const portfolioVariance = calculatePortfolioVariance(weights, volatilities, activeCorrelations);
      const portfolioRisk = Math.sqrt(portfolioVariance) * 100;
      const sharpe = (portfolioReturn - riskFreeRate) / portfolioRisk;

      points.push({
        risk: portfolioRisk,
        return: portfolioReturn,
        weights,
        sharpe
      });
    }

    // Sort by risk and filter for efficient frontier (highest return for each risk level)
    points.sort((a, b) => a.risk - b.risk);
    
    const frontier: PortfolioPoint[] = [];
    let maxReturn = -Infinity;
    
    for (const point of points) {
      if (point.return > maxReturn) {
        frontier.push(point);
        maxReturn = point.return;
      }
    }

    return frontier;
  }, [stocks, activeCorrelations, riskFreeRate]);

  // Find optimal portfolio based on risk tolerance
  const optimalPortfolio = useMemo(() => {
    if (efficientFrontier.length === 0) return null;

    // Risk tolerance 0 = minimum risk, 100 = maximum return
    const tolerance = riskTolerance[0] / 100;
    
    // Find the portfolio that maximizes Sharpe ratio within risk tolerance
    const minRisk = Math.min(...efficientFrontier.map(p => p.risk));
    const maxRisk = Math.max(...efficientFrontier.map(p => p.risk));
    const targetRisk = minRisk + tolerance * (maxRisk - minRisk);

    // Find portfolio closest to target risk with best Sharpe ratio
    const candidates = efficientFrontier.filter(p => p.risk <= targetRisk * 1.1);
    
    if (candidates.length === 0) return efficientFrontier[0];
    
    return candidates.reduce((best, current) => 
      current.sharpe > best.sharpe ? current : best
    );
  }, [efficientFrontier, riskTolerance]);

  // Maximum Sharpe ratio portfolio
  const maxSharpePortfolio = useMemo(() => {
    if (efficientFrontier.length === 0) return null;
    return efficientFrontier.reduce((best, current) => 
      current.sharpe > best.sharpe ? current : best
    );
  }, [efficientFrontier]);

  // Minimum variance portfolio
  const minVariancePortfolio = useMemo(() => {
    if (efficientFrontier.length === 0) return null;
    return efficientFrontier.reduce((best, current) => 
      current.risk < best.risk ? current : best
    );
  }, [efficientFrontier]);

  const addStock = () => {
    if (!newStock.symbol || !newStock.expectedReturn || !newStock.volatility) {
      toast.error('Please fill all fields');
      return;
    }

    if (stocks.find(s => s.symbol.toUpperCase() === newStock.symbol.toUpperCase())) {
      toast.error('Stock already added');
      return;
    }

    setStocks([...stocks, {
      symbol: newStock.symbol.toUpperCase(),
      expectedReturn: parseFloat(newStock.expectedReturn),
      volatility: parseFloat(newStock.volatility)
    }]);
    setNewStock({ symbol: '', expectedReturn: '', volatility: '' });
    toast.success(`Added ${newStock.symbol.toUpperCase()}`);
  };

  const removeStock = (symbol: string) => {
    if (stocks.length <= 2) {
      toast.error('Need at least 2 stocks for optimization');
      return;
    }
    setStocks(stocks.filter(s => s.symbol !== symbol));
  };

  const pieData = optimalPortfolio ? stocks.map((stock, i) => ({
    name: stock.symbol,
    value: Math.round(optimalPortfolio.weights[i] * 1000) / 10
  })).filter(d => d.value > 0.5) : [];

  const scatterData = efficientFrontier.map(p => ({
    x: p.risk,
    y: p.return,
    sharpe: p.sharpe
  }));

  const getRiskLabel = (value: number) => {
    if (value < 25) return 'Conservative';
    if (value < 50) return 'Moderate';
    if (value < 75) return 'Growth';
    return 'Aggressive';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Assets
            </CardTitle>
            <CardDescription>Add stocks with expected returns and volatility</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Symbol</Label>
                <Input
                  value={newStock.symbol}
                  onChange={(e) => setNewStock({ ...newStock, symbol: e.target.value })}
                  placeholder="TSLA"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Return %</Label>
                <Input
                  type="number"
                  value={newStock.expectedReturn}
                  onChange={(e) => setNewStock({ ...newStock, expectedReturn: e.target.value })}
                  placeholder="15"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Vol %</Label>
                <Input
                  type="number"
                  value={newStock.volatility}
                  onChange={(e) => setNewStock({ ...newStock, volatility: e.target.value })}
                  placeholder="35"
                  className="h-8"
                />
              </div>
            </div>
            <Button onClick={addStock} size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-1" /> Add Asset
            </Button>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {stocks.map((stock, i) => (
                <div key={stock.symbol} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="font-medium">{stock.symbol}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{stock.expectedReturn}% ret</span>
                    <span>{stock.volatility}% vol</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeStock(stock.symbol)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t space-y-3">
              <div>
                <Label className="text-xs">Risk-Free Rate (%)</Label>
                <Input
                  type="number"
                  value={riskFreeRate}
                  onChange={(e) => setRiskFreeRate(parseFloat(e.target.value) || 0)}
                  className="h-8"
                  step="0.1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Tolerance & Optimal Weights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Risk Profile
            </CardTitle>
            <CardDescription>Adjust your risk tolerance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Risk Tolerance</Label>
                <Badge variant="outline">{getRiskLabel(riskTolerance[0])}</Badge>
              </div>
              <Slider
                value={riskTolerance}
                onValueChange={setRiskTolerance}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Conservative</span>
                <span>Aggressive</span>
              </div>
            </div>

            {optimalPortfolio && (
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Optimal Allocation
                </h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                        labelLine={false}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Portfolio Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Portfolio Metrics
            </CardTitle>
            <CardDescription>Expected performance statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {optimalPortfolio ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground">Expected Return</div>
                    <div className="text-xl font-bold text-primary">
                      {optimalPortfolio.return.toFixed(2)}%
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground">Expected Risk</div>
                    <div className="text-xl font-bold">
                      {optimalPortfolio.risk.toFixed(2)}%
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground">Sharpe Ratio</div>
                    <div className="text-xl font-bold text-chart-2">
                      {optimalPortfolio.sharpe.toFixed(3)}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground">Return/Risk</div>
                    <div className="text-xl font-bold">
                      {(optimalPortfolio.return / optimalPortfolio.risk).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <h4 className="font-medium text-sm">Recommended Weights</h4>
                  {stocks.map((stock, i) => {
                    const weight = optimalPortfolio.weights[i] * 100;
                    if (weight < 0.5) return null;
                    return (
                      <div key={stock.symbol} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="flex-1 text-sm">{stock.symbol}</span>
                        <span className="font-medium">{weight.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Add at least 2 stocks to optimize
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Efficient Frontier Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Efficient Frontier</CardTitle>
          <CardDescription>
            Risk vs. Return tradeoff for all possible portfolio combinations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="x" 
                  type="number" 
                  name="Risk" 
                  unit="%" 
                  domain={['dataMin - 2', 'dataMax + 2']}
                  label={{ value: 'Risk (Volatility %)', position: 'bottom', offset: 0 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  dataKey="y" 
                  type="number" 
                  name="Return" 
                  unit="%" 
                  domain={['dataMin - 2', 'dataMax + 2']}
                  label={{ value: 'Expected Return %', angle: -90, position: 'insideLeft' }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (!payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                        <div className="text-sm">Return: {data.y.toFixed(2)}%</div>
                        <div className="text-sm">Risk: {data.x.toFixed(2)}%</div>
                        <div className="text-sm">Sharpe: {data.sharpe.toFixed(3)}</div>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Scatter 
                  name="Portfolio Options" 
                  data={scatterData} 
                  fill="hsl(var(--chart-1))"
                  opacity={0.6}
                />
                {optimalPortfolio && (
                  <Scatter
                    name="Your Portfolio"
                    data={[{ x: optimalPortfolio.risk, y: optimalPortfolio.return, sharpe: optimalPortfolio.sharpe }]}
                    fill="hsl(var(--primary))"
                    shape="star"
                  />
                )}
                {maxSharpePortfolio && (
                  <Scatter
                    name="Max Sharpe"
                    data={[{ x: maxSharpePortfolio.risk, y: maxSharpePortfolio.return, sharpe: maxSharpePortfolio.sharpe }]}
                    fill="hsl(var(--chart-2))"
                    shape="diamond"
                  />
                )}
                {minVariancePortfolio && (
                  <Scatter
                    name="Min Variance"
                    data={[{ x: minVariancePortfolio.risk, y: minVariancePortfolio.return, sharpe: minVariancePortfolio.sharpe }]}
                    fill="hsl(var(--chart-3))"
                    shape="triangle"
                  />
                )}
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Special Portfolios Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-4 border-t">
            {minVariancePortfolio && (
              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-chart-3" />
                  <span className="font-medium">Minimum Variance</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Return: {minVariancePortfolio.return.toFixed(2)}% | Risk: {minVariancePortfolio.risk.toFixed(2)}%
                </div>
              </div>
            )}
            {maxSharpePortfolio && (
              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-chart-2" />
                  <span className="font-medium">Maximum Sharpe</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Return: {maxSharpePortfolio.return.toFixed(2)}% | Sharpe: {maxSharpePortfolio.sharpe.toFixed(3)}
                </div>
              </div>
            )}
            {optimalPortfolio && (
              <div className="p-4 rounded-lg border bg-primary/10 border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="font-medium">Your Optimal</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Based on {getRiskLabel(riskTolerance[0]).toLowerCase()} risk profile
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
