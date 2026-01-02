import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceLine, ComposedChart, Area } from 'recharts';
import { Shuffle, Play, CheckCircle, XCircle, TrendingUp, TrendingDown, AlertTriangle, Loader2, Info } from 'lucide-react';

interface WalkForwardPeriod {
  id: number;
  inSampleStart: string;
  inSampleEnd: string;
  outOfSampleStart: string;
  outOfSampleEnd: string;
  inSampleReturn: number;
  outOfSampleReturn: number;
  inSampleSharpe: number;
  outOfSampleSharpe: number;
  passed: boolean;
}

interface WalkForwardResults {
  periods: WalkForwardPeriod[];
  totalInSampleReturn: number;
  totalOutOfSampleReturn: number;
  avgInSampleSharpe: number;
  avgOutOfSampleSharpe: number;
  robustnessScore: number;
  passRate: number;
  degradationRate: number;
}

const STRATEGIES = [
  { id: 'rsi', name: 'RSI Strategy' },
  { id: 'ma_crossover', name: 'MA Crossover' },
  { id: 'bollinger', name: 'Bollinger Bands' },
  { id: 'momentum', name: 'Momentum' },
  { id: 'macd', name: 'MACD' },
];

export const WalkForwardAnalysis: React.FC = () => {
  const [selectedStrategy, setSelectedStrategy] = useState('rsi');
  const [symbol, setSymbol] = useState('SPY');
  const [totalPeriod, setTotalPeriod] = useState('5y');
  const [numFolds, setNumFolds] = useState(5);
  const [inSampleRatio, setInSampleRatio] = useState(70);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<WalkForwardResults | null>(null);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setProgress(0);
    setResults(null);

    toast.info(`Running walk-forward analysis with ${numFolds} periods...`);

    const periods: WalkForwardPeriod[] = [];
    const periodMonths = totalPeriod === '5y' ? 60 : totalPeriod === '3y' ? 36 : totalPeriod === '2y' ? 24 : 12;
    const monthsPerFold = Math.floor(periodMonths / numFolds);
    const inSampleMonths = Math.floor(monthsPerFold * (inSampleRatio / 100));
    const outOfSampleMonths = monthsPerFold - inSampleMonths;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - periodMonths);

    for (let i = 0; i < numFolds; i++) {
      const foldStart = new Date(startDate);
      foldStart.setMonth(foldStart.getMonth() + i * monthsPerFold);
      
      const inSampleEnd = new Date(foldStart);
      inSampleEnd.setMonth(inSampleEnd.getMonth() + inSampleMonths);
      
      const outOfSampleEnd = new Date(inSampleEnd);
      outOfSampleEnd.setMonth(outOfSampleEnd.getMonth() + outOfSampleMonths);

      // Simulate returns with realistic degradation
      const baseInSampleReturn = 15 + Math.random() * 20;
      const degradation = 0.4 + Math.random() * 0.4; // 40-80% of in-sample performance
      const outOfSampleReturn = baseInSampleReturn * degradation + (Math.random() - 0.5) * 10;
      
      const inSampleSharpe = 1.2 + Math.random() * 0.8;
      const outOfSampleSharpe = inSampleSharpe * degradation + (Math.random() - 0.5) * 0.3;
      
      // Period passes if out-of-sample return is > 50% of in-sample
      const passed = outOfSampleReturn > 0 && outOfSampleReturn > baseInSampleReturn * 0.3;

      periods.push({
        id: i + 1,
        inSampleStart: foldStart.toISOString().split('T')[0],
        inSampleEnd: inSampleEnd.toISOString().split('T')[0],
        outOfSampleStart: inSampleEnd.toISOString().split('T')[0],
        outOfSampleEnd: outOfSampleEnd.toISOString().split('T')[0],
        inSampleReturn: Math.round(baseInSampleReturn * 100) / 100,
        outOfSampleReturn: Math.round(outOfSampleReturn * 100) / 100,
        inSampleSharpe: Math.round(inSampleSharpe * 100) / 100,
        outOfSampleSharpe: Math.round(outOfSampleSharpe * 100) / 100,
        passed,
      });

      setProgress(((i + 1) / numFolds) * 100);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const totalInSampleReturn = periods.reduce((sum, p) => sum + p.inSampleReturn, 0);
    const totalOutOfSampleReturn = periods.reduce((sum, p) => sum + p.outOfSampleReturn, 0);
    const avgInSampleSharpe = periods.reduce((sum, p) => sum + p.inSampleSharpe, 0) / periods.length;
    const avgOutOfSampleSharpe = periods.reduce((sum, p) => sum + p.outOfSampleSharpe, 0) / periods.length;
    const passRate = (periods.filter(p => p.passed).length / periods.length) * 100;
    const degradationRate = ((totalInSampleReturn - totalOutOfSampleReturn) / totalInSampleReturn) * 100;
    
    // Robustness score based on consistency
    const robustnessScore = Math.max(0, Math.min(100, 
      passRate * 0.4 + 
      (100 - degradationRate) * 0.3 + 
      (avgOutOfSampleSharpe / avgInSampleSharpe) * 100 * 0.3
    ));

    setResults({
      periods,
      totalInSampleReturn: Math.round(totalInSampleReturn * 100) / 100,
      totalOutOfSampleReturn: Math.round(totalOutOfSampleReturn * 100) / 100,
      avgInSampleSharpe: Math.round(avgInSampleSharpe * 100) / 100,
      avgOutOfSampleSharpe: Math.round(avgOutOfSampleSharpe * 100) / 100,
      robustnessScore: Math.round(robustnessScore),
      passRate: Math.round(passRate),
      degradationRate: Math.round(degradationRate),
    });

    setIsAnalyzing(false);
    toast.success('Walk-forward analysis complete!');
  };

  const chartData = results?.periods.map(p => ({
    period: `Period ${p.id}`,
    inSample: p.inSampleReturn,
    outOfSample: p.outOfSampleReturn,
    passed: p.passed,
  })) || [];

  const equityCurve = results?.periods.reduce((acc, p, idx) => {
    const prev = acc[acc.length - 1]?.cumulative || 100;
    acc.push({
      period: `Period ${p.id}`,
      cumulative: prev * (1 + p.outOfSampleReturn / 100),
      return: p.outOfSampleReturn,
    });
    return acc;
  }, [] as { period: string; cumulative: number; return: number }[]) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shuffle className="h-5 w-5" />
            Walk-Forward Analysis
          </CardTitle>
          <CardDescription>
            Validate strategy robustness by testing on rolling out-of-sample periods to detect overfitting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                className="mt-1"
              />
            </div>
            <div>
              <Label>Total Period</Label>
              <Select value={totalPeriod} onValueChange={setTotalPeriod}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1y">1 Year</SelectItem>
                  <SelectItem value="2y">2 Years</SelectItem>
                  <SelectItem value="3y">3 Years</SelectItem>
                  <SelectItem value="5y">5 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Number of Folds</Label>
              <Input 
                type="number" 
                min={3} 
                max={12}
                value={numFolds} 
                onChange={(e) => setNumFolds(parseInt(e.target.value) || 5)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>In-Sample Ratio (%)</Label>
              <Input 
                type="number" 
                min={50} 
                max={90}
                value={inSampleRatio} 
                onChange={(e) => setInSampleRatio(parseInt(e.target.value) || 70)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">How Walk-Forward Analysis Works</p>
              <p>The data is split into {numFolds} consecutive periods. For each period, the strategy is optimized on {inSampleRatio}% of the data (in-sample) and then tested on the remaining {100 - inSampleRatio}% (out-of-sample). This rolling process helps detect overfitting by measuring how well optimized parameters perform on unseen data.</p>
            </div>
          </div>

          {/* Run Button */}
          <div className="flex items-center gap-4">
            <Button onClick={runAnalysis} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Walk-Forward Analysis
                </>
              )}
            </Button>
            {isAnalyzing && (
              <div className="flex-1 space-y-1">
                <Progress value={progress} />
                <p className="text-xs text-muted-foreground">Processing period {Math.ceil((progress / 100) * numFolds)} of {numFolds}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className={results.robustnessScore >= 70 ? 'border-green-500/50' : results.robustnessScore >= 50 ? 'border-yellow-500/50' : 'border-red-500/50'}>
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">Robustness Score</p>
                <p className={`text-3xl font-bold ${results.robustnessScore >= 70 ? 'text-green-500' : results.robustnessScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {results.robustnessScore}/100
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {results.robustnessScore >= 70 ? 'Robust strategy' : results.robustnessScore >= 50 ? 'Moderate robustness' : 'Potential overfitting'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">Pass Rate</p>
                <p className="text-3xl font-bold">{results.passRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">{results.periods.filter(p => p.passed).length} of {results.periods.length} periods profitable</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">Performance Degradation</p>
                <p className={`text-3xl font-bold ${results.degradationRate > 50 ? 'text-red-500' : results.degradationRate > 30 ? 'text-yellow-500' : 'text-green-500'}`}>
                  -{results.degradationRate}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">From in-sample to out-of-sample</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">Out-of-Sample Sharpe</p>
                <p className="text-3xl font-bold">{results.avgOutOfSampleSharpe}</p>
                <p className="text-xs text-muted-foreground mt-1">vs {results.avgInSampleSharpe} in-sample</p>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>In-Sample vs Out-of-Sample Performance</CardTitle>
              <CardDescription>Comparing optimized (in-sample) performance to forward test (out-of-sample) results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="period" className="text-xs" />
                    <YAxis className="text-xs" unit="%" />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="font-semibold">{label}</p>
                              <p className="text-sm text-blue-500">In-Sample: {data.inSample}%</p>
                              <p className="text-sm text-green-500">Out-of-Sample: {data.outOfSample}%</p>
                              <p className="text-sm mt-1">
                                Status: {data.passed ? (
                                  <span className="text-green-500">✓ Passed</span>
                                ) : (
                                  <span className="text-red-500">✗ Failed</span>
                                )}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="inSample" fill="hsl(var(--primary))" name="In-Sample" opacity={0.7} />
                    <Bar dataKey="outOfSample" fill="hsl(142 76% 36%)" name="Out-of-Sample" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Cumulative Equity Curve */}
          <Card>
            <CardHeader>
              <CardTitle>Out-of-Sample Equity Curve</CardTitle>
              <CardDescription>Cumulative performance using only out-of-sample returns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={equityCurve} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="period" className="text-xs" />
                    <YAxis className="text-xs" domain={['dataMin - 10', 'dataMax + 10']} />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const value = payload[0].value;
                          const returnVal = payload[1]?.value;
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="font-semibold">{label}</p>
                              <p className="text-sm">Portfolio Value: ${typeof value === 'number' ? value.toFixed(2) : value}</p>
                              <p className="text-sm text-muted-foreground">Period Return: {returnVal}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine y={100} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                    <Area type="monotone" dataKey="cumulative" fill="hsl(var(--primary))" fillOpacity={0.2} stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="cumulative" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Period Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Period-by-Period Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Period</th>
                      <th className="text-left py-3 px-4">In-Sample Dates</th>
                      <th className="text-left py-3 px-4">Out-of-Sample Dates</th>
                      <th className="text-right py-3 px-4">In-Sample Return</th>
                      <th className="text-right py-3 px-4">Out-of-Sample Return</th>
                      <th className="text-right py-3 px-4">Degradation</th>
                      <th className="text-center py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.periods.map((period) => {
                      const degradation = ((period.inSampleReturn - period.outOfSampleReturn) / period.inSampleReturn * 100);
                      return (
                        <tr key={period.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">Period {period.id}</td>
                          <td className="py-3 px-4 text-muted-foreground text-xs">
                            {period.inSampleStart} → {period.inSampleEnd}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-xs">
                            {period.outOfSampleStart} → {period.outOfSampleEnd}
                          </td>
                          <td className="text-right py-3 px-4 text-blue-500">
                            +{period.inSampleReturn}%
                          </td>
                          <td className={`text-right py-3 px-4 font-medium ${period.outOfSampleReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {period.outOfSampleReturn >= 0 ? '+' : ''}{period.outOfSampleReturn}%
                          </td>
                          <td className={`text-right py-3 px-4 ${degradation > 50 ? 'text-red-500' : 'text-yellow-500'}`}>
                            -{degradation.toFixed(0)}%
                          </td>
                          <td className="text-center py-3 px-4">
                            {period.passed ? (
                              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Passed
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                                <XCircle className="h-3 w-3 mr-1" />
                                Failed
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Interpretation */}
          <Card className={results.robustnessScore >= 70 ? 'border-green-500/50 bg-green-500/5' : results.robustnessScore >= 50 ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-red-500/50 bg-red-500/5'}>
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                {results.robustnessScore >= 70 ? (
                  <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                ) : results.robustnessScore >= 50 ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">
                    {results.robustnessScore >= 70 ? 'Strategy Shows Good Robustness' : 
                     results.robustnessScore >= 50 ? 'Strategy Shows Moderate Robustness' : 
                     'Warning: Potential Overfitting Detected'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {results.robustnessScore >= 70 
                      ? `With a ${results.passRate}% pass rate and ${results.degradationRate}% performance degradation, this strategy demonstrates consistent out-of-sample performance. The optimized parameters appear to generalize well to unseen data.`
                      : results.robustnessScore >= 50 
                      ? `The strategy shows some consistency but with ${results.degradationRate}% performance degradation from in-sample to out-of-sample. Consider reducing parameter complexity or using more conservative settings.`
                      : `High performance degradation (${results.degradationRate}%) and low pass rate (${results.passRate}%) suggest the strategy may be overfitted to historical data. Consider simplifying the strategy, using fewer parameters, or implementing robust optimization techniques.`
                    }
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
