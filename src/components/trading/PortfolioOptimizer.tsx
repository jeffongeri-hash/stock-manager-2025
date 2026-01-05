import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Plus, X, Calculator, TrendingUp, Shield, Target, Grid3X3, Save, FolderOpen, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Preset {
  id: string;
  name: string;
  stocks: Stock[];
  correlationMatrix: number[][];
  riskTolerance: number;
  riskFreeRate: number;
  createdAt: string;
}

const PRESET_STORAGE_KEY = 'portfolio-optimizer-presets';

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
  const [correlationMatrix, setCorrelationMatrix] = useState<number[][]>(() => {
    // Initialize with default correlations
    const n = DEFAULT_STOCKS.length;
    const matrix: number[][] = [];
    for (let i = 0; i < n; i++) {
      matrix[i] = [];
      for (let j = 0; j < n; j++) {
        if (i === j) matrix[i][j] = 1;
        else matrix[i][j] = 0.4;
      }
    }
    return matrix;
  });
  const [presets, setPresets] = useState<Preset[]>(() => {
    try {
      const saved = localStorage.getItem(PRESET_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [presetName, setPresetName] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);

  // Initialize correlation matrix when stocks change
  useEffect(() => {
    if (correlationMatrix.length !== stocks.length) {
      const n = stocks.length;
      const newMatrix: number[][] = [];
      for (let i = 0; i < n; i++) {
        newMatrix[i] = [];
        for (let j = 0; j < n; j++) {
          if (i === j) newMatrix[i][j] = 1;
          else if (correlationMatrix[i]?.[j] !== undefined) newMatrix[i][j] = correlationMatrix[i][j];
          else newMatrix[i][j] = 0.4;
        }
      }
      setCorrelationMatrix(newMatrix);
    }
  }, [stocks.length]);

  // Save presets to localStorage when they change
  useEffect(() => {
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
  }, [presets]);
  // Update correlation matrix value (symmetric)
  const updateCorrelation = (i: number, j: number, value: number) => {
    const clampedValue = Math.max(-1, Math.min(1, value));
    const newMatrix = correlationMatrix.map((row, ri) =>
      row.map((cell, ci) => {
        if (ri === i && ci === j) return clampedValue;
        if (ri === j && ci === i) return clampedValue; // Mirror for symmetry
        return cell;
      })
    );
    setCorrelationMatrix(newMatrix);
  };

  // Preset management functions
  const savePreset = () => {
    if (!presetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }
    
    const newPreset: Preset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      stocks: stocks.map(s => ({ ...s })),
      correlationMatrix: correlationMatrix.map(row => [...row]),
      riskTolerance: riskTolerance[0],
      riskFreeRate,
      createdAt: new Date().toISOString(),
    };
    
    setPresets(prev => [...prev, newPreset]);
    setPresetName('');
    setSaveDialogOpen(false);
    toast.success(`Saved preset "${newPreset.name}"`);
  };

  const loadPreset = (preset: Preset) => {
    setStocks(preset.stocks.map(s => ({ ...s })));
    setCorrelationMatrix(preset.correlationMatrix.map(row => [...row]));
    setRiskTolerance([preset.riskTolerance]);
    setRiskFreeRate(preset.riskFreeRate);
    setLoadDialogOpen(false);
    toast.success(`Loaded preset "${preset.name}"`);
  };

  const deletePreset = (id: string, name: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
    toast.success(`Deleted preset "${name}"`);
  };

  // Calculate portfolio variance
  const calculatePortfolioVariance = (weights: number[], volatilities: number[], correlations: number[][]) => {
    let variance = 0;
    const n = weights.length;
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const corr = correlations[i]?.[j] ?? (i === j ? 1 : 0);
        variance += weights[i] * weights[j] * (volatilities[i] / 100) * (volatilities[j] / 100) * corr;
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
      const portfolioVariance = calculatePortfolioVariance(weights, volatilities, correlationMatrix);
      const portfolioRisk = Math.sqrt(Math.max(0, portfolioVariance)) * 100;
      const sharpe = portfolioRisk > 0 ? (portfolioReturn - riskFreeRate) / portfolioRisk : 0;

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
  }, [stocks, correlationMatrix, riskFreeRate]);

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
      {/* Header with Save/Load Presets */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Portfolio Optimizer</h2>
          <p className="text-sm text-muted-foreground">Modern Portfolio Theory-based allocation</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Preset
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Portfolio Preset</DialogTitle>
                <DialogDescription>
                  Save current configuration for quick access later
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="preset-name">Preset Name</Label>
                  <Input
                    id="preset-name"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="e.g., Conservative Growth"
                  />
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="font-medium">This will save:</p>
                  <ul className="list-disc list-inside">
                    <li>{stocks.length} assets with returns & volatility</li>
                    <li>Correlation matrix ({stocks.length}×{stocks.length})</li>
                    <li>Risk tolerance: {riskTolerance[0]}%</li>
                    <li>Risk-free rate: {riskFreeRate}%</li>
                  </ul>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
                <Button onClick={savePreset}>Save Preset</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FolderOpen className="h-4 w-4 mr-2" />
                Load Preset
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Load Portfolio Preset</DialogTitle>
                <DialogDescription>
                  Select a saved configuration to load
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                {presets.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No saved presets yet</p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {presets.map((preset) => (
                      <div key={preset.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium">{preset.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {preset.stocks.length} assets • Risk: {preset.riskTolerance}% • {new Date(preset.createdAt).toLocaleDateString()}
                          </p>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {preset.stocks.slice(0, 5).map((s) => (
                              <Badge key={s.symbol} variant="secondary" className="text-xs">{s.symbol}</Badge>
                            ))}
                            {preset.stocks.length > 5 && (
                              <Badge variant="outline" className="text-xs">+{preset.stocks.length - 5}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => loadPreset(preset)}>Load</Button>
                          <Button size="sm" variant="ghost" onClick={() => deletePreset(preset.id, preset.name)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="assets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assets">Assets & Optimization</TabsTrigger>
          <TabsTrigger value="correlations">
            <Grid3X3 className="h-4 w-4 mr-2" />
            Correlation Matrix
          </TabsTrigger>
          <TabsTrigger value="frontier">Efficient Frontier</TabsTrigger>
        </TabsList>

        <TabsContent value="assets">
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
        </TabsContent>

        <TabsContent value="correlations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5" />
                Correlation Matrix Editor
              </CardTitle>
              <CardDescription>
                Edit correlations between assets (-1 to 1). Matrix is symmetric - editing one cell updates its mirror.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stocks.length < 2 ? (
                <p className="text-center text-muted-foreground py-8">Add at least 2 assets to edit correlations</p>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="p-2 text-left text-sm font-medium"></th>
                          {stocks.map((s) => (
                            <th key={s.symbol} className="p-2 text-center text-sm font-mono font-medium min-w-[70px]">
                              {s.symbol}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {stocks.map((rowStock, i) => (
                          <tr key={rowStock.symbol}>
                            <td className="p-2 text-sm font-mono font-medium">{rowStock.symbol}</td>
                            {stocks.map((colStock, j) => (
                              <td key={colStock.symbol} className="p-1">
                                {i === j ? (
                                  <div className="w-16 h-8 flex items-center justify-center bg-muted rounded text-sm font-medium mx-auto">
                                    1.00
                                  </div>
                                ) : (
                                  <Input
                                    type="number"
                                    min="-1"
                                    max="1"
                                    step="0.05"
                                    value={correlationMatrix[i]?.[j]?.toFixed(2) ?? '0.40'}
                                    onChange={(e) => updateCorrelation(i, j, parseFloat(e.target.value) || 0)}
                                    className={`w-16 h-8 text-center text-sm mx-auto ${
                                      (correlationMatrix[i]?.[j] ?? 0) > 0.3
                                        ? 'border-green-500/50'
                                        : (correlationMatrix[i]?.[j] ?? 0) < -0.1
                                        ? 'border-red-500/50'
                                        : ''
                                    }`}
                                  />
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newMatrix = stocks.map((_, i) =>
                          stocks.map((_, j) => (i === j ? 1 : 0))
                        );
                        setCorrelationMatrix(newMatrix);
                        toast.success('Set all correlations to 0');
                      }}
                    >
                      Set All to 0
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newMatrix = stocks.map((_, i) =>
                          stocks.map((_, j) => (i === j ? 1 : 0.3))
                        );
                        setCorrelationMatrix(newMatrix);
                        toast.success('Set all correlations to 0.3');
                      }}
                    >
                      Low (0.3)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newMatrix = stocks.map((_, i) =>
                          stocks.map((_, j) => (i === j ? 1 : 0.6))
                        );
                        setCorrelationMatrix(newMatrix);
                        toast.success('Set all correlations to 0.6');
                      }}
                    >
                      High (0.6)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newMatrix = stocks.map((_, i) =>
                          stocks.map((_, j) => (i === j ? 1 : -0.2))
                        );
                        setCorrelationMatrix(newMatrix);
                        toast.success('Set negative correlations');
                      }}
                    >
                      Negative (-0.2)
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><span className="font-medium">Correlation guide:</span></p>
                    <p>• <span className="text-green-600">1.0</span>: Perfect positive correlation (assets move together)</p>
                    <p>• <span className="text-muted-foreground">0.0</span>: No correlation (independent movement)</p>
                    <p>• <span className="text-red-600">-1.0</span>: Perfect negative correlation (assets move opposite)</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="frontier">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};
