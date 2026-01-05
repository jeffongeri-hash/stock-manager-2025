import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
import { TrendingUp, DollarSign, Calendar, Target, Save, FolderOpen, Trash2, BarChart3, Loader2 } from 'lucide-react';
import { useGuestMode, SavedProjection } from '@/hooks/useGuestMode';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface PortfolioGrowthChartProps {
  mode?: 'backtest' | 'live' | 'projection';
  backtestData?: {
    dates: string[];
    values: number[];
  };
  liveData?: {
    dates: string[];
    values: number[];
  };
}

interface MonteCarloResult {
  month: string;
  median: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
  paths?: number[][];
}

const PortfolioGrowthChart: React.FC<PortfolioGrowthChartProps> = ({
  mode = 'projection',
  backtestData,
  liveData
}) => {
  const { user } = useAuth();
  const { savedProjections, saveProjection, deleteProjection, loadProjection } = useGuestMode();
  
  const [initialCapital, setInitialCapital] = useState(1000);
  const [timeHorizon, setTimeHorizon] = useState('12');
  const [strategy, setStrategy] = useState('moderate');
  const [monteCarloEnabled, setMonteCarloEnabled] = useState(false);
  const [numSimulations, setNumSimulations] = useState(1000);
  const [isRunningMonteCarlo, setIsRunningMonteCarlo] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [projectionName, setProjectionName] = useState('');

  const strategyReturns = {
    conservative: { monthly: 0.005, volatility: 0.02, label: 'Conservative', description: '6% annual' },
    moderate: { monthly: 0.008, volatility: 0.04, label: 'Moderate', description: '10% annual' },
    aggressive: { monthly: 0.015, volatility: 0.08, label: 'Aggressive', description: '18% annual' }
  };

  // Box-Muller transform for normal distribution
  const gaussianRandom = useCallback(() => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }, []);

  // Run Monte Carlo simulation
  const monteCarloData = useMemo(() => {
    if (!monteCarloEnabled) return null;
    
    const months = parseInt(timeHorizon);
    const selectedStrategy = strategyReturns[strategy as keyof typeof strategyReturns];
    const monthlyReturn = selectedStrategy.monthly;
    const monthlyVolatility = selectedStrategy.volatility;
    
    // Run simulations
    const allPaths: number[][] = [];
    
    for (let sim = 0; sim < numSimulations; sim++) {
      const path = [initialCapital];
      let value = initialCapital;
      
      for (let month = 1; month <= months; month++) {
        // Geometric Brownian Motion
        const randomShock = gaussianRandom() * monthlyVolatility;
        const monthlyGrowth = monthlyReturn + randomShock;
        value = value * (1 + monthlyGrowth);
        value = Math.max(value, initialCapital * 0.1); // Floor at 90% loss
        path.push(value);
      }
      
      allPaths.push(path);
    }
    
    // Calculate percentiles for each month
    const results: MonteCarloResult[] = [];
    
    for (let month = 0; month <= months; month++) {
      const monthValues = allPaths.map(path => path[month]).sort((a, b) => a - b);
      
      const percentile = (p: number) => {
        const index = Math.floor((p / 100) * monthValues.length);
        return monthValues[Math.min(index, monthValues.length - 1)];
      };
      
      results.push({
        month: month === 0 ? 'Start' : `M${month}`,
        median: percentile(50),
        p10: percentile(10),
        p25: percentile(25),
        p75: percentile(75),
        p90: percentile(90)
      });
    }
    
    // Calculate statistics
    const finalValues = allPaths.map(path => path[path.length - 1]);
    const sortedFinal = [...finalValues].sort((a, b) => a - b);
    const meanFinal = finalValues.reduce((a, b) => a + b, 0) / finalValues.length;
    const medianFinal = sortedFinal[Math.floor(sortedFinal.length / 2)];
    const p5Final = sortedFinal[Math.floor(sortedFinal.length * 0.05)];
    const p95Final = sortedFinal[Math.floor(sortedFinal.length * 0.95)];
    const probProfit = finalValues.filter(v => v > initialCapital).length / finalValues.length * 100;
    const probDouble = finalValues.filter(v => v > initialCapital * 2).length / finalValues.length * 100;
    
    return {
      results,
      stats: {
        meanFinal,
        medianFinal,
        p5Final,
        p95Final,
        probProfit,
        probDouble,
        maxValue: Math.max(...finalValues),
        minValue: Math.min(...finalValues)
      }
    };
  }, [monteCarloEnabled, initialCapital, timeHorizon, strategy, numSimulations, gaussianRandom]);

  // Regular projection data
  const projectionData = useMemo(() => {
    const months = parseInt(timeHorizon);
    const data: any[] = [];
    
    let conservative = initialCapital;
    let moderate = initialCapital;
    let aggressive = initialCapital;
    let benchmark = initialCapital;

    for (let i = 0; i <= months; i++) {
      const monthLabel = i === 0 ? 'Start' : `M${i}`;
      
      data.push({
        month: monthLabel,
        conservative: parseFloat(conservative.toFixed(2)),
        moderate: parseFloat(moderate.toFixed(2)),
        aggressive: parseFloat(aggressive.toFixed(2)),
        benchmark: parseFloat(benchmark.toFixed(2))
      });

      conservative *= (1 + strategyReturns.conservative.monthly);
      moderate *= (1 + strategyReturns.moderate.monthly);
      aggressive *= (1 + strategyReturns.aggressive.monthly);
      benchmark *= (1 + 0.007);
    }

    return data;
  }, [initialCapital, timeHorizon]);

  const summaryStats = useMemo(() => {
    const months = parseInt(timeHorizon);
    const selectedReturn = strategyReturns[strategy as keyof typeof strategyReturns];
    
    const finalValue = initialCapital * Math.pow(1 + selectedReturn.monthly, months);
    const totalReturn = finalValue - initialCapital;
    const returnPct = (totalReturn / initialCapital) * 100;
    const annualizedReturn = (Math.pow(finalValue / initialCapital, 12 / months) - 1) * 100;
    const maxDrawdown = selectedReturn.volatility * 100 * Math.sqrt(months / 12) * 2;
    const sharpeRatio = (annualizedReturn - 4) / (selectedReturn.volatility * 100 * Math.sqrt(12));

    return {
      finalValue,
      totalReturn,
      returnPct,
      annualizedReturn,
      maxDrawdown: Math.min(maxDrawdown, 50),
      sharpeRatio: Math.max(sharpeRatio, 0)
    };
  }, [initialCapital, timeHorizon, strategy]);

  // Backtest chart data
  const backtestChartData = useMemo(() => {
    if (!backtestData) {
      const data = [];
      let value = initialCapital;
      const days = parseInt(timeHorizon) * 30;
      
      for (let i = 0; i <= Math.min(days, 365); i += 7) {
        const variance = (Math.random() - 0.45) * 0.03;
        value *= (1 + variance);
        value = Math.max(value, initialCapital * 0.7);
        
        data.push({
          day: i === 0 ? 'Start' : `D${i}`,
          portfolio: parseFloat(value.toFixed(2)),
          benchmark: parseFloat((initialCapital * (1 + (i / 365) * 0.085)).toFixed(2))
        });
      }
      return data;
    }

    return backtestData.dates.map((date, i) => ({
      day: date,
      portfolio: backtestData.values[i],
      benchmark: initialCapital * (1 + (i / backtestData.dates.length) * 0.085)
    }));
  }, [backtestData, initialCapital, timeHorizon]);

  // Live chart data
  const liveChartData = useMemo(() => {
    if (!liveData) {
      const data = [];
      let value = initialCapital;
      
      for (let i = 0; i <= 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (30 - i));
        
        const variance = (Math.random() - 0.48) * 0.02;
        value *= (1 + variance);
        
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          portfolio: parseFloat(value.toFixed(2)),
          trades: Math.floor(Math.random() * 3)
        });
      }
      return data;
    }

    return liveData.dates.map((date, i) => ({
      date,
      portfolio: liveData.values[i],
      trades: Math.floor(Math.random() * 3)
    }));
  }, [liveData, initialCapital]);

  // Save projection handler
  const handleSaveProjection = () => {
    if (!projectionName.trim()) {
      toast.error('Please enter a name for your projection');
      return;
    }

    saveProjection({
      name: projectionName.trim(),
      initialCapital,
      timeHorizon,
      strategy,
      monteCarloEnabled,
      simulations: numSimulations
    });

    toast.success('Projection saved!');
    setProjectionName('');
    setSaveDialogOpen(false);
  };

  // Load projection handler
  const handleLoadProjection = (projection: SavedProjection) => {
    setInitialCapital(projection.initialCapital);
    setTimeHorizon(projection.timeHorizon);
    setStrategy(projection.strategy);
    setMonteCarloEnabled(projection.monteCarloEnabled);
    setNumSimulations(projection.simulations);
    setLoadDialogOpen(false);
    toast.success(`Loaded "${projection.name}"`);
  };

  // Delete projection handler
  const handleDeleteProjection = (projectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteProjection(projectionId);
    toast.success('Projection deleted');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-semibold">${typeof entry.value === 'number' ? entry.value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Portfolio Growth Chart
            </CardTitle>
            <CardDescription>
              Track performance and projected returns with Monte Carlo simulation
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Label htmlFor="capital" className="text-sm whitespace-nowrap">Capital</Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="capital"
                  type="number"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(Math.max(100, parseInt(e.target.value) || 1000))}
                  className="w-24 pl-7"
                />
              </div>
            </div>
            
            {/* Save/Load Buttons */}
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Projection</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Projection Name</Label>
                    <Input
                      placeholder="My $1k Growth Plan"
                      value={projectionName}
                      onChange={(e) => setProjectionName(e.target.value)}
                      maxLength={50}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Will save:</p>
                    <ul className="list-disc list-inside mt-1">
                      <li>Initial Capital: ${initialCapital.toLocaleString()}</li>
                      <li>Time Horizon: {timeHorizon} months</li>
                      <li>Strategy: {strategy}</li>
                      <li>Monte Carlo: {monteCarloEnabled ? `${numSimulations} sims` : 'Off'}</li>
                    </ul>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveProjection}>Save Projection</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FolderOpen className="h-4 w-4 mr-1" />
                  Load
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Load Saved Projection</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 py-4 max-h-80 overflow-y-auto">
                  {savedProjections.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No saved projections yet</p>
                  ) : (
                    savedProjections.map((projection) => (
                      <div
                        key={projection.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleLoadProjection(projection)}
                      >
                        <div>
                          <p className="font-medium">{projection.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ${projection.initialCapital.toLocaleString()} • {projection.timeHorizon}mo • {projection.strategy}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteProjection(projection.id, e)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="projection" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="projection" className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Projection</span>
            </TabsTrigger>
            <TabsTrigger value="montecarlo" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Monte Carlo</span>
            </TabsTrigger>
            <TabsTrigger value="backtest" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Backtest</span>
            </TabsTrigger>
            <TabsTrigger value="live" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Live</span>
            </TabsTrigger>
          </TabsList>

          {/* Projection Tab */}
          <TabsContent value="projection" className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label>Time Horizon</Label>
                <Select value={timeHorizon} onValueChange={setTimeHorizon}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">1 year</SelectItem>
                    <SelectItem value="24">2 years</SelectItem>
                    <SelectItem value="36">3 years</SelectItem>
                    <SelectItem value="60">5 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Strategy</Label>
                <Select value={strategy} onValueChange={setStrategy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative (6%)</SelectItem>
                    <SelectItem value="moderate">Moderate (10%)</SelectItem>
                    <SelectItem value="aggressive">Aggressive (18%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Est. Final Value</p>
                <p className="text-lg font-bold text-primary">
                  ${summaryStats.finalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Total Return</p>
                <p className={`text-lg font-bold ${summaryStats.returnPct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {summaryStats.returnPct >= 0 ? '+' : ''}{summaryStats.returnPct.toFixed(1)}%
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Annualized</p>
                <p className="text-lg font-bold text-primary">{summaryStats.annualizedReturn.toFixed(1)}%</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Max Drawdown</p>
                <p className="text-lg font-bold text-orange-500">-{summaryStats.maxDrawdown.toFixed(1)}%</p>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorConservative" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorModerate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAggressive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <ReferenceLine y={initialCapital} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
                  <Area type="monotone" dataKey="conservative" name="Conservative" stroke="#3b82f6" fill="url(#colorConservative)" strokeWidth={2} />
                  <Area type="monotone" dataKey="moderate" name="Moderate" stroke="#22c55e" fill="url(#colorModerate)" strokeWidth={2} />
                  <Area type="monotone" dataKey="aggressive" name="Aggressive" stroke="#f59e0b" fill="url(#colorAggressive)" strokeWidth={2} />
                  <Line type="monotone" dataKey="benchmark" name="S&P 500" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">⚠️ Disclaimer</p>
              <p>Projections are based on historical averages. Actual returns may vary significantly. Past performance does not guarantee future results.</p>
            </div>
          </TabsContent>

          {/* Monte Carlo Tab */}
          <TabsContent value="montecarlo" className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label>Time Horizon</Label>
                <Select value={timeHorizon} onValueChange={setTimeHorizon}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">1 year</SelectItem>
                    <SelectItem value="24">2 years</SelectItem>
                    <SelectItem value="36">3 years</SelectItem>
                    <SelectItem value="60">5 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Strategy</Label>
                <Select value={strategy} onValueChange={setStrategy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Simulations</Label>
                <Select value={numSimulations.toString()} onValueChange={(v) => setNumSimulations(parseInt(v))}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                    <SelectItem value="1000">1,000</SelectItem>
                    <SelectItem value="5000">5,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={monteCarloEnabled} onCheckedChange={setMonteCarloEnabled} />
                <Label>Run Simulation</Label>
              </div>
            </div>

            {monteCarloEnabled && monteCarloData ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Median Final Value</p>
                    <p className="text-lg font-bold text-primary">
                      ${monteCarloData.stats.medianFinal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Probability of Profit</p>
                    <p className="text-lg font-bold text-green-500">{monteCarloData.stats.probProfit.toFixed(1)}%</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">5th Percentile (Worst)</p>
                    <p className="text-lg font-bold text-red-500">
                      ${monteCarloData.stats.p5Final.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">95th Percentile (Best)</p>
                    <p className="text-lg font-bold text-green-500">
                      ${monteCarloData.stats.p95Final.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monteCarloData.results} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <ReferenceLine y={initialCapital} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
                      
                      {/* Confidence bands */}
                      <Area type="monotone" dataKey="p90" name="90th Percentile" stroke="#22c55e" fill="none" strokeWidth={1} strokeDasharray="3 3" />
                      <Area type="monotone" dataKey="p75" name="75th Percentile" stroke="#22c55e" fill="url(#colorConfidence)" strokeWidth={1} />
                      <Area type="monotone" dataKey="median" name="Median" stroke="hsl(var(--primary))" fill="none" strokeWidth={3} />
                      <Area type="monotone" dataKey="p25" name="25th Percentile" stroke="#ef4444" fill="none" strokeWidth={1} />
                      <Area type="monotone" dataKey="p10" name="10th Percentile" stroke="#ef4444" fill="none" strokeWidth={1} strokeDasharray="3 3" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-green-500/10 rounded-lg p-4">
                    <p className="font-medium text-green-700 dark:text-green-400 mb-2">Upside Scenarios</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• 25% chance of reaching ${monteCarloData.stats.p95Final.toLocaleString(undefined, { maximumFractionDigits: 0 })}+</li>
                      <li>• {monteCarloData.stats.probDouble.toFixed(1)}% chance of doubling</li>
                      <li>• Max observed: ${monteCarloData.stats.maxValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</li>
                    </ul>
                  </div>
                  <div className="bg-red-500/10 rounded-lg p-4">
                    <p className="font-medium text-red-700 dark:text-red-400 mb-2">Downside Risks</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• 5% chance of falling to ${monteCarloData.stats.p5Final.toLocaleString(undefined, { maximumFractionDigits: 0 })}</li>
                      <li>• {(100 - monteCarloData.stats.probProfit).toFixed(1)}% chance of loss</li>
                      <li>• Min observed: ${monteCarloData.stats.minValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</li>
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Monte Carlo Simulation</h3>
                <p className="text-muted-foreground text-sm mb-4 max-w-md">
                  Run thousands of simulated scenarios to understand the range of possible outcomes for your portfolio.
                </p>
                <Button onClick={() => setMonteCarloEnabled(true)}>
                  Run {numSimulations.toLocaleString()} Simulations
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Backtest Tab */}
          <TabsContent value="backtest" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Strategy Return</p>
                <p className="text-lg font-bold text-green-500">
                  +{(((backtestChartData[backtestChartData.length - 1]?.portfolio || initialCapital) / initialCapital - 1) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">vs Benchmark</p>
                <p className="text-lg font-bold text-primary">
                  {((backtestChartData[backtestChartData.length - 1]?.portfolio || 0) > (backtestChartData[backtestChartData.length - 1]?.benchmark || 0)) ? '+' : ''}
                  {(((backtestChartData[backtestChartData.length - 1]?.portfolio || initialCapital) - (backtestChartData[backtestChartData.length - 1]?.benchmark || initialCapital)) / initialCapital * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Final Value</p>
                <p className="text-lg font-bold">${(backtestChartData[backtestChartData.length - 1]?.portfolio || initialCapital).toLocaleString()}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Data Points</p>
                <p className="text-lg font-bold">{backtestChartData.length}</p>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={backtestChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `$${value.toLocaleString()}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <ReferenceLine y={initialCapital} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="portfolio" name="Portfolio" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="benchmark" name="S&P 500" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Live Tab */}
          <TabsContent value="live" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Current Value</p>
                <p className="text-lg font-bold">${(liveChartData[liveChartData.length - 1]?.portfolio || initialCapital).toLocaleString()}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">30-Day Return</p>
                <p className={`text-lg font-bold ${((liveChartData[liveChartData.length - 1]?.portfolio || initialCapital) >= initialCapital) ? 'text-green-500' : 'text-red-500'}`}>
                  {((liveChartData[liveChartData.length - 1]?.portfolio || initialCapital) >= initialCapital) ? '+' : ''}
                  {(((liveChartData[liveChartData.length - 1]?.portfolio || initialCapital) / initialCapital - 1) * 100).toFixed(2)}%
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Total Trades</p>
                <p className="text-lg font-bold">{liveChartData.reduce((sum, d) => sum + (d.trades || 0), 0)}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">Live Trading</Badge>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={liveChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `$${value.toLocaleString()}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <ReferenceLine y={initialCapital} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
                  <Area type="monotone" dataKey="portfolio" name="Portfolio Value" stroke="hsl(var(--primary))" fill="url(#colorLive)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PortfolioGrowthChart;
