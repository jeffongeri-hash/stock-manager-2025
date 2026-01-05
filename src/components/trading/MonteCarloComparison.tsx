import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Plus, Trash2, BarChart3, Play, DollarSign } from 'lucide-react';

interface SimulationConfig {
  id: string;
  name: string;
  initialCapital: number;
  timeHorizon: string;
  strategy: 'conservative' | 'moderate' | 'aggressive';
  color: string;
}

interface SimulationResult {
  id: string;
  name: string;
  color: string;
  data: Array<{ month: string; median: number; p10: number; p90: number }>;
  stats: {
    medianFinal: number;
    p5Final: number;
    p95Final: number;
    probProfit: number;
    probDouble: number;
  };
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const strategyReturns = {
  conservative: { monthly: 0.005, volatility: 0.02, label: 'Conservative' },
  moderate: { monthly: 0.008, volatility: 0.04, label: 'Moderate' },
  aggressive: { monthly: 0.015, volatility: 0.08, label: 'Aggressive' }
};

const MonteCarloComparison: React.FC = () => {
  const [simulations, setSimulations] = useState<SimulationConfig[]>([
    { id: '1', name: 'Portfolio A', initialCapital: 10000, timeHorizon: '12', strategy: 'moderate', color: COLORS[0] },
    { id: '2', name: 'Portfolio B', initialCapital: 10000, timeHorizon: '12', strategy: 'aggressive', color: COLORS[1] }
  ]);
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [numSimulations] = useState(1000);
  const [isRunning, setIsRunning] = useState(false);

  const gaussianRandom = useCallback(() => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }, []);

  const addSimulation = () => {
    const id = Date.now().toString();
    const colorIndex = simulations.length % COLORS.length;
    setSimulations([...simulations, {
      id,
      name: `Portfolio ${String.fromCharCode(65 + simulations.length)}`,
      initialCapital: 10000,
      timeHorizon: '12',
      strategy: 'moderate',
      color: COLORS[colorIndex]
    }]);
  };

  const removeSimulation = (id: string) => {
    if (simulations.length <= 2) return;
    setSimulations(simulations.filter(s => s.id !== id));
    setResults(results.filter(r => r.id !== id));
  };

  const updateSimulation = (id: string, updates: Partial<SimulationConfig>) => {
    setSimulations(simulations.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const runSimulations = () => {
    setIsRunning(true);
    
    setTimeout(() => {
      const newResults: SimulationResult[] = simulations.map(sim => {
        const months = parseInt(sim.timeHorizon);
        const selectedStrategy = strategyReturns[sim.strategy];
        const monthlyReturn = selectedStrategy.monthly;
        const monthlyVolatility = selectedStrategy.volatility;
        
        const allPaths: number[][] = [];
        
        for (let s = 0; s < numSimulations; s++) {
          const path = [sim.initialCapital];
          let value = sim.initialCapital;
          
          for (let month = 1; month <= months; month++) {
            const randomShock = gaussianRandom() * monthlyVolatility;
            const monthlyGrowth = monthlyReturn + randomShock;
            value = value * (1 + monthlyGrowth);
            value = Math.max(value, sim.initialCapital * 0.1);
            path.push(value);
          }
          
          allPaths.push(path);
        }
        
        const data: Array<{ month: string; median: number; p10: number; p90: number }> = [];
        
        for (let month = 0; month <= months; month++) {
          const monthValues = allPaths.map(path => path[month]).sort((a, b) => a - b);
          
          const percentile = (p: number) => {
            const index = Math.floor((p / 100) * monthValues.length);
            return monthValues[Math.min(index, monthValues.length - 1)];
          };
          
          data.push({
            month: month === 0 ? 'Start' : `M${month}`,
            median: percentile(50),
            p10: percentile(10),
            p90: percentile(90)
          });
        }
        
        const finalValues = allPaths.map(path => path[path.length - 1]);
        const sortedFinal = [...finalValues].sort((a, b) => a - b);
        
        return {
          id: sim.id,
          name: sim.name,
          color: sim.color,
          data,
          stats: {
            medianFinal: sortedFinal[Math.floor(sortedFinal.length / 2)],
            p5Final: sortedFinal[Math.floor(sortedFinal.length * 0.05)],
            p95Final: sortedFinal[Math.floor(sortedFinal.length * 0.95)],
            probProfit: finalValues.filter(v => v > sim.initialCapital).length / finalValues.length * 100,
            probDouble: finalValues.filter(v => v > sim.initialCapital * 2).length / finalValues.length * 100
          }
        };
      });
      
      setResults(newResults);
      setIsRunning(false);
    }, 100);
  };

  // Merge data for chart
  const chartData = useMemo(() => {
    if (results.length === 0) return [];
    
    const maxMonths = Math.max(...results.map(r => r.data.length));
    const merged: any[] = [];
    
    for (let i = 0; i < maxMonths; i++) {
      const point: any = { month: i === 0 ? 'Start' : `M${i}` };
      results.forEach(result => {
        if (result.data[i]) {
          point[`${result.name}_median`] = result.data[i].median;
          point[`${result.name}_p10`] = result.data[i].p10;
          point[`${result.name}_p90`] = result.data[i].p90;
        }
      });
      merged.push(point);
    }
    
    return merged;
  }, [results]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm mb-2">{label}</p>
          {payload.filter((p: any) => p.name.includes('median')).map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{entry.name.replace('_median', '')}:</span>
              <span className="font-semibold">${entry.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
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
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Monte Carlo Comparison
        </CardTitle>
        <CardDescription>
          Compare multiple portfolio scenarios side by side
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Simulation Configurations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Portfolios to Compare</Label>
            <Button variant="outline" size="sm" onClick={addSimulation} disabled={simulations.length >= 6}>
              <Plus className="h-4 w-4 mr-1" />
              Add Portfolio
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {simulations.map((sim) => (
              <div key={sim.id} className="p-4 border rounded-lg space-y-3" style={{ borderColor: sim.color }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sim.color }} />
                    <Input
                      value={sim.name}
                      onChange={(e) => updateSimulation(sim.id, { name: e.target.value })}
                      className="h-7 w-28 text-sm font-medium"
                    />
                  </div>
                  {simulations.length > 2 && (
                    <Button variant="ghost" size="sm" onClick={() => removeSimulation(sim.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs w-16">Capital</Label>
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input
                        type="number"
                        value={sim.initialCapital}
                        onChange={(e) => updateSimulation(sim.id, { initialCapital: parseInt(e.target.value) || 1000 })}
                        className="h-7 pl-6 text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label className="text-xs w-16">Horizon</Label>
                    <Select value={sim.timeHorizon} onValueChange={(v) => updateSimulation(sim.id, { timeHorizon: v })}>
                      <SelectTrigger className="h-7 text-sm flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6">6 months</SelectItem>
                        <SelectItem value="12">1 year</SelectItem>
                        <SelectItem value="24">2 years</SelectItem>
                        <SelectItem value="36">3 years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label className="text-xs w-16">Strategy</Label>
                    <Select value={sim.strategy} onValueChange={(v) => updateSimulation(sim.id, { strategy: v as any })}>
                      <SelectTrigger className="h-7 text-sm flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conservative">Conservative</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="aggressive">Aggressive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <Button onClick={runSimulations} disabled={isRunning} className="w-full">
            <Play className="h-4 w-4 mr-2" />
            {isRunning ? 'Running Simulations...' : `Run ${numSimulations.toLocaleString()} Simulations Each`}
          </Button>
        </div>

        {/* Results Chart */}
        {results.length > 0 && (
          <>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {results.map((result) => (
                    <React.Fragment key={result.id}>
                      <Area
                        type="monotone"
                        dataKey={`${result.name}_p90`}
                        name={`${result.name} (90th)`}
                        stroke={result.color}
                        fill={result.color}
                        fillOpacity={0.1}
                        strokeWidth={1}
                        strokeDasharray="3 3"
                      />
                      <Area
                        type="monotone"
                        dataKey={`${result.name}_median`}
                        name={`${result.name} (Median)`}
                        stroke={result.color}
                        fill="none"
                        strokeWidth={3}
                      />
                      <Area
                        type="monotone"
                        dataKey={`${result.name}_p10`}
                        name={`${result.name} (10th)`}
                        stroke={result.color}
                        fill="none"
                        strokeWidth={1}
                        strokeDasharray="3 3"
                      />
                    </React.Fragment>
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Comparison Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((result) => {
                const sim = simulations.find(s => s.id === result.id);
                return (
                  <div key={result.id} className="p-4 bg-muted/50 rounded-lg space-y-3" style={{ borderLeft: `4px solid ${result.color}` }}>
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{result.name}</h4>
                      <Badge variant="outline" style={{ borderColor: result.color, color: result.color }}>
                        {sim?.strategy}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Median Final</p>
                        <p className="font-semibold text-primary">
                          ${result.stats.medianFinal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Prob. Profit</p>
                        <p className="font-semibold text-green-500">{result.stats.probProfit.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Worst Case (5%)</p>
                        <p className="font-semibold text-red-500">
                          ${result.stats.p5Final.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Best Case (95%)</p>
                        <p className="font-semibold text-green-500">
                          ${result.stats.p95Final.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Compare Portfolio Scenarios</h3>
            <p className="text-muted-foreground text-sm max-w-md">
              Configure different portfolios above and run simulations to see how they compare over time.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MonteCarloComparison;
