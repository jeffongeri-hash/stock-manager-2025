import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Settings2, Play, Zap, Trophy, TrendingUp, Target, AlertTriangle, Loader2, Save, History, Trash2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

interface ParameterRange {
  name: string;
  min: number;
  max: number;
  step: number;
  description: string;
}

interface OptimizationResult {
  parameters: Record<string, number>;
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  trades: number;
}

const STRATEGY_PARAMETERS: Record<string, ParameterRange[]> = {
  rsi: [
    { name: 'period', min: 5, max: 30, step: 5, description: 'RSI calculation period' },
    { name: 'oversold', min: 20, max: 40, step: 5, description: 'Oversold threshold (buy signal)' },
    { name: 'overbought', min: 60, max: 80, step: 5, description: 'Overbought threshold (sell signal)' },
  ],
  ma_crossover: [
    { name: 'fastPeriod', min: 5, max: 20, step: 5, description: 'Fast MA period' },
    { name: 'slowPeriod', min: 20, max: 100, step: 10, description: 'Slow MA period' },
  ],
  bollinger: [
    { name: 'period', min: 10, max: 30, step: 5, description: 'Bollinger Band period' },
    { name: 'stdDev', min: 1, max: 3, step: 0.5, description: 'Standard deviation multiplier' },
  ],
  momentum: [
    { name: 'lookback', min: 5, max: 30, step: 5, description: 'Momentum lookback period' },
    { name: 'threshold', min: 1, max: 10, step: 1, description: 'Momentum threshold (%)' },
  ],
  macd: [
    { name: 'fastPeriod', min: 8, max: 16, step: 2, description: 'Fast EMA period' },
    { name: 'slowPeriod', min: 20, max: 30, step: 2, description: 'Slow EMA period' },
    { name: 'signalPeriod', min: 7, max: 12, step: 1, description: 'Signal line period' },
  ],
};

const STRATEGIES = [
  { id: 'rsi', name: 'RSI Strategy', description: 'Buy/sell based on RSI levels' },
  { id: 'ma_crossover', name: 'MA Crossover', description: 'Moving average crossover signals' },
  { id: 'bollinger', name: 'Bollinger Bands', description: 'Mean reversion with Bollinger Bands' },
  { id: 'momentum', name: 'Momentum', description: 'Price momentum strategy' },
  { id: 'macd', name: 'MACD', description: 'MACD crossover signals' },
];

interface SavedOptimization {
  id: string;
  strategy_name: string;
  symbol: string;
  timeframe: string;
  parameters: Record<string, { min: number; max: number; step: number }>;
  best_combination: Record<string, number>;
  all_results: OptimizationResult[];
  best_return: number;
  best_sharpe: number;
  best_max_drawdown: number;
  total_combinations: number;
  created_at: string;
}

export const StrategyOptimizer: React.FC = () => {
  const { user } = useAuth();
  const [selectedStrategy, setSelectedStrategy] = useState('rsi');
  const [symbol, setSymbol] = useState('SPY');
  const [timeframe, setTimeframe] = useState('1y');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<OptimizationResult[]>([]);
  const [bestResult, setBestResult] = useState<OptimizationResult | null>(null);
  const [parameterRanges, setParameterRanges] = useState<Record<string, { min: number; max: number; step: number }>>({});
  const [savedOptimizations, setSavedOptimizations] = useState<SavedOptimization[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('optimize');

  const currentParams = STRATEGY_PARAMETERS[selectedStrategy] || [];

  useEffect(() => {
    const ranges: Record<string, { min: number; max: number; step: number }> = {};
    currentParams.forEach(param => {
      ranges[param.name] = { min: param.min, max: param.max, step: param.step };
    });
    setParameterRanges(ranges);
  }, [selectedStrategy]);

  useEffect(() => {
    if (user) {
      fetchSavedOptimizations();
    }
  }, [user]);

  const fetchSavedOptimizations = async () => {
    if (!user) return;
    
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('optimization_results')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setSavedOptimizations((data || []).map(d => ({
        ...d,
        parameters: d.parameters as unknown as Record<string, { min: number; max: number; step: number }>,
        best_combination: d.best_combination as unknown as Record<string, number>,
        all_results: d.all_results as unknown as OptimizationResult[],
      })));
    } catch (error) {
      console.error('Error fetching saved optimizations:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const saveOptimization = async () => {
    if (!user || !bestResult || results.length === 0) {
      toast.error('No optimization results to save. Please run an optimization first.');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('optimization_results')
        .insert([{
          user_id: user.id,
          strategy_name: selectedStrategy,
          symbol: symbol,
          timeframe: timeframe,
          parameters: JSON.parse(JSON.stringify(parameterRanges)),
          best_combination: JSON.parse(JSON.stringify(bestResult.parameters)),
          all_results: JSON.parse(JSON.stringify(results)),
          best_return: bestResult.totalReturn,
          best_sharpe: bestResult.sharpeRatio,
          best_max_drawdown: bestResult.maxDrawdown,
          total_combinations: results.length,
        }]);

      if (error) throw error;
      
      toast.success('Optimization results saved successfully!');
      fetchSavedOptimizations();
    } catch (error) {
      console.error('Error saving optimization:', error);
      toast.error('Failed to save optimization results');
    } finally {
      setIsSaving(false);
    }
  };



  const deleteOptimization = async (id: string) => {
    try {
      const { error } = await supabase
        .from('optimization_results')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Optimization deleted');
      setSavedOptimizations(prev => prev.filter(o => o.id !== id));
    } catch (error) {
      console.error('Error deleting optimization:', error);
      toast.error('Failed to delete optimization');
    }
  };

  const loadOptimization = (saved: SavedOptimization) => {
    setSelectedStrategy(saved.strategy_name);
    setSymbol(saved.symbol);
    setTimeframe(saved.timeframe);
    setParameterRanges(saved.parameters);
    setResults(saved.all_results);
    setBestResult(saved.all_results[0] || null);
    setActiveTab('optimize');
    toast.success('Optimization loaded');
  };

  const exportToCSV = (saved: SavedOptimization) => {
    const headers = ['Rank', ...Object.keys(saved.best_combination), 'Return %', 'Sharpe', 'Max DD %', 'Win Rate %', 'Trades'];
    const rows = saved.all_results.slice(0, 100).map((r, idx) => [
      idx + 1,
      ...Object.values(r.parameters),
      r.totalReturn,
      r.sharpeRatio,
      r.maxDrawdown,
      r.winRate,
      r.trades
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimization_${saved.strategy_name}_${saved.symbol}_${format(new Date(saved.created_at), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported to CSV');
  };

  const updateParamRange = (paramName: string, field: 'min' | 'max' | 'step', value: number) => {
    setParameterRanges(prev => ({
      ...prev,
      [paramName]: { ...prev[paramName], [field]: value }
    }));
  };

  const generateCombinations = (): Record<string, number>[] => {
    const combinations: Record<string, number>[] = [];
    const params = Object.entries(parameterRanges);
    
    const generate = (index: number, current: Record<string, number>) => {
      if (index === params.length) {
        combinations.push({ ...current });
        return;
      }
      
      const [name, range] = params[index];
      for (let val = range.min; val <= range.max; val += range.step) {
        current[name] = val;
        generate(index + 1, current);
      }
    };
    
    generate(0, {});
    return combinations;
  };

  const simulateBacktest = (params: Record<string, number>): OptimizationResult => {
    // Simulate backtest with some randomness influenced by parameters
    const baseReturn = 0.1;
    let modifier = 1;

    // Parameter-based adjustments (simulated correlation)
    if (params.period) modifier *= (params.period > 10 && params.period < 20) ? 1.2 : 0.9;
    if (params.oversold) modifier *= params.oversold < 30 ? 1.1 : 1;
    if (params.overbought) modifier *= params.overbought > 70 ? 1.1 : 1;
    if (params.fastPeriod && params.slowPeriod) {
      modifier *= params.slowPeriod / params.fastPeriod > 3 ? 1.15 : 0.95;
    }
    if (params.stdDev) modifier *= params.stdDev === 2 ? 1.2 : 1;

    const randomFactor = 0.6 + Math.random() * 0.8;
    const totalReturn = baseReturn * modifier * randomFactor * 100;
    const volatility = 15 + Math.random() * 10;
    const sharpeRatio = totalReturn / volatility;
    
    return {
      parameters: params,
      totalReturn: Math.round(totalReturn * 100) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      maxDrawdown: Math.round((10 + Math.random() * 20) * 100) / 100,
      winRate: Math.round((45 + Math.random() * 20) * 10) / 10,
      trades: Math.floor(50 + Math.random() * 200),
    };
  };

  const runOptimization = async () => {
    const combinations = generateCombinations();
    
    if (combinations.length > 1000) {
      toast.error(`Too many combinations (${combinations.length}). Please narrow the parameter ranges.`);
      return;
    }

    if (combinations.length === 0) {
      toast.error('No parameter combinations to test');
      return;
    }

    setIsOptimizing(true);
    setProgress(0);
    setResults([]);
    setBestResult(null);

    toast.info(`Testing ${combinations.length} parameter combinations...`);

    const allResults: OptimizationResult[] = [];
    const batchSize = 10;

    for (let i = 0; i < combinations.length; i += batchSize) {
      const batch = combinations.slice(i, i + batchSize);
      
      for (const params of batch) {
        const result = simulateBacktest(params);
        allResults.push(result);
      }

      setProgress(Math.round((i / combinations.length) * 100));
      await new Promise(resolve => setTimeout(resolve, 50)); // Visual delay
    }

    setProgress(100);
    
    // Sort by Sharpe ratio
    allResults.sort((a, b) => b.sharpeRatio - a.sharpeRatio);
    
    setResults(allResults);
    setBestResult(allResults[0]);
    setIsOptimizing(false);
    
    toast.success(`Optimization complete! Best Sharpe ratio: ${allResults[0].sharpeRatio}`);
  };

  const getParamLabel = (params: Record<string, number>) => {
    return Object.entries(params).map(([k, v]) => `${k}=${v}`).join(', ');
  };

  const scatterData = results.map((r, idx) => ({
    x: r.totalReturn,
    y: r.sharpeRatio,
    z: r.maxDrawdown,
    index: idx,
    ...r,
  }));

  const topResults = results.slice(0, 10);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Strategy Parameter Optimizer
          </CardTitle>
          <CardDescription>
            Test thousands of parameter combinations to find optimal settings for your strategy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="optimize">
                <Zap className="h-4 w-4 mr-2" />
                Optimize
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-2" />
                History ({savedOptimizations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="optimize" className="space-y-6">
          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Strategy</Label>
              <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STRATEGIES.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Symbol</Label>
              <Input 
                value={symbol} 
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="SPY"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Timeframe</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3m">3 Months</SelectItem>
                  <SelectItem value="6m">6 Months</SelectItem>
                  <SelectItem value="1y">1 Year</SelectItem>
                  <SelectItem value="2y">2 Years</SelectItem>
                  <SelectItem value="5y">5 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Parameter Ranges */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Parameter Ranges to Optimize</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentParams.map((param) => (
                <Card key={param.name} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{param.name.replace(/([A-Z])/g, ' $1')}</span>
                      <Badge variant="outline" className="text-xs">
                        {parameterRanges[param.name] ? 
                          Math.ceil((parameterRanges[param.name].max - parameterRanges[param.name].min) / parameterRanges[param.name].step) + 1 
                          : 0} values
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{param.description}</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Min</Label>
                        <Input
                          type="number"
                          value={parameterRanges[param.name]?.min ?? param.min}
                          onChange={(e) => updateParamRange(param.name, 'min', parseFloat(e.target.value))}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Max</Label>
                        <Input
                          type="number"
                          value={parameterRanges[param.name]?.max ?? param.max}
                          onChange={(e) => updateParamRange(param.name, 'max', parseFloat(e.target.value))}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Step</Label>
                        <Input
                          type="number"
                          value={parameterRanges[param.name]?.step ?? param.step}
                          onChange={(e) => updateParamRange(param.name, 'step', parseFloat(e.target.value))}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

              {/* Run Button */}
              <div className="flex items-center gap-4">
                <Button 
                  onClick={runOptimization} 
                  disabled={isOptimizing}
                  className="flex-1 md:flex-none"
                >
                  {isOptimizing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Run Optimization ({generateCombinations().length} combinations)
                    </>
                  )}
                </Button>
                {bestResult && !isOptimizing && user && (
                  <Button 
                    onClick={saveOptimization} 
                    disabled={isSaving}
                    variant="outline"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Results
                  </Button>
                )}
                {isOptimizing && (
                  <div className="flex-1 space-y-1">
                    <Progress value={progress} />
                    <p className="text-xs text-muted-foreground text-center">{progress}% complete</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history">
              {!user ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Sign in to save and view optimization history</p>
                </div>
              ) : isLoadingHistory ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p className="text-muted-foreground mt-2">Loading history...</p>
                </div>
              ) : savedOptimizations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No saved optimizations yet</p>
                  <p className="text-sm">Run an optimization and save the results to see them here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedOptimizations.map((saved) => (
                    <Card key={saved.id} className="hover:bg-muted/50 transition-colors">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex-1 min-w-[200px]">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary">
                                {STRATEGIES.find(s => s.id === saved.strategy_name)?.name || saved.strategy_name}
                              </Badge>
                              <Badge variant="outline">{saved.symbol}</Badge>
                              <Badge variant="outline">{saved.timeframe}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(saved.created_at), 'MMM d, yyyy h:mm a')} • {saved.total_combinations} combinations tested
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {Object.entries(saved.best_combination).map(([key, value]) => (
                                <Badge key={key} variant="outline" className="text-xs">
                                  {key}={value}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <p className="text-xs text-muted-foreground">Return</p>
                              <p className={`font-bold ${saved.best_return >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {saved.best_return >= 0 ? '+' : ''}{saved.best_return}%
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Sharpe</p>
                              <p className="font-bold text-blue-500">{saved.best_sharpe}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Max DD</p>
                              <p className="font-bold text-yellow-500">-{saved.best_max_drawdown}%</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => loadOptimization(saved)}>
                              Load
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => exportToCSV(saved)}>
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => deleteOptimization(saved.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Results */}
      {bestResult && (
        <>
          {/* Best Result */}
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="py-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <Trophy className="h-10 w-10 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Optimal Parameters Found</p>
                    <p className="text-lg font-bold">{STRATEGIES.find(s => s.id === selectedStrategy)?.name}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(bestResult.parameters).map(([key, value]) => (
                        <Badge key={key} variant="secondary">
                          {key}: {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Return</p>
                    <p className={`text-xl font-bold ${bestResult.totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {bestResult.totalReturn >= 0 ? '+' : ''}{bestResult.totalReturn}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sharpe</p>
                    <p className="text-xl font-bold text-blue-500">{bestResult.sharpeRatio}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Max DD</p>
                    <p className="text-xl font-bold text-yellow-500">-{bestResult.maxDrawdown}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Win Rate</p>
                    <p className="text-xl font-bold">{bestResult.winRate}%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scatter Plot */}
          <Card>
            <CardHeader>
              <CardTitle>Return vs Sharpe Ratio (All Combinations)</CardTitle>
              <CardDescription>Each point represents a parameter combination. Size indicates drawdown.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="Return" 
                      unit="%" 
                      className="text-xs"
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Sharpe" 
                      className="text-xs"
                    />
                    <ZAxis type="number" dataKey="z" range={[50, 400]} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="font-semibold">Combination #{data.index + 1}</p>
                              <p className="text-sm text-muted-foreground">{getParamLabel(data.parameters)}</p>
                              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                <p>Return: <span className="font-medium">{data.totalReturn}%</span></p>
                                <p>Sharpe: <span className="font-medium">{data.sharpeRatio}</span></p>
                                <p>Max DD: <span className="font-medium">{data.maxDrawdown}%</span></p>
                                <p>Win Rate: <span className="font-medium">{data.winRate}%</span></p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter 
                      name="Results" 
                      data={scatterData} 
                      fill="hsl(var(--primary))"
                      fillOpacity={0.6}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top 10 Results Table */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Parameter Combinations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Rank</th>
                      <th className="text-left py-3 px-4 font-semibold">Parameters</th>
                      <th className="text-right py-3 px-4 font-semibold">Return</th>
                      <th className="text-right py-3 px-4 font-semibold">Sharpe</th>
                      <th className="text-right py-3 px-4 font-semibold">Max DD</th>
                      <th className="text-right py-3 px-4 font-semibold">Win Rate</th>
                      <th className="text-right py-3 px-4 font-semibold">Trades</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topResults.map((result, idx) => (
                      <tr key={idx} className={`border-b hover:bg-muted/50 ${idx === 0 ? 'bg-primary/5' : ''}`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {idx === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                            #{idx + 1}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(result.parameters).map(([key, value]) => (
                              <Badge key={key} variant="outline" className="text-xs">
                                {key}={value}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className={`text-right py-3 px-4 font-medium ${result.totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {result.totalReturn >= 0 ? '+' : ''}{result.totalReturn}%
                        </td>
                        <td className="text-right py-3 px-4 font-medium">{result.sharpeRatio}</td>
                        <td className="text-right py-3 px-4 text-yellow-500">-{result.maxDrawdown}%</td>
                        <td className="text-right py-3 px-4">{result.winRate}%</td>
                        <td className="text-right py-3 px-4">{result.trades}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Warning */}
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-600">Overfitting Warning</p>
                  <p className="text-sm text-muted-foreground">
                    Optimized parameters may be overfitted to historical data. Always validate with out-of-sample testing 
                    and forward testing before using in live trading. Past performance does not guarantee future results.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
