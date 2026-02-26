import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Search, RefreshCw, TrendingUp, Clock, Shield, Zap, ArrowRight, BarChart3, RotateCcw, Plus, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Area, ComposedChart, Bar, Label as RechartsLabel
} from 'recharts';

interface OptionLeg {
  longStrike: number;
  longExpiry: string;
  longPremium: number;
  longDelta: number;
  shortStrike: number;
  shortExpiry: string;
  shortPremium: number;
  netDebit: number;
  breakEven: number;
  potentialAnnualReturn?: number;
  description: string;
}

interface ScanResult {
  ticker: string;
  stockPrice: number;
  strategies: OptionLeg[];
  generalAnalysis: string;
  timestamp: number;
  criteria: any;
}

const IgniteOptionsScanner: React.FC = () => {
  const [ticker, setTicker] = useState('SPY');
  const [loading, setLoading] = useState(false);
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [selectedStrategyIdx, setSelectedStrategyIdx] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState('scanner');

  // Scanner criteria
  const [expiryRange, setExpiryRange] = useState(12);
  const [targetDelta, setTargetDelta] = useState(0.80);
  const [maxOtmPct, setMaxOtmPct] = useState(10);
  const [minVolume, setMinVolume] = useState(1000000);

  // Rolling Lab
  const [rollTicker, setRollTicker] = useState('SPY');
  const [rollStrike, setRollStrike] = useState(450);
  const [rollingResults, setRollingResults] = useState<any | null>(null);
  const [scanningRoll, setScanningRoll] = useState(false);

  // Manual Calculator
  const [btcCost, setBtcCost] = useState(2.50);
  const [stoCredit, setStoCredit] = useState(3.80);
  const [contractCount, setContractCount] = useState(1);
  const [rollDte, setRollDte] = useState(30);

  useEffect(() => {
    const saved = localStorage.getItem('ignite_options_live_v2');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const handleAnalyze = async () => {
    if (!ticker) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ignite-options-scanner', {
        body: { action: 'analyze', ticker, criteria: { expiryRange, targetDelta, maxOtmPct, minVolume } }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const newItem: ScanResult = {
        ticker,
        stockPrice: data.stockPrice,
        strategies: data.strategies || [],
        generalAnalysis: data.generalAnalysis || '',
        timestamp: Date.now(),
        criteria: { expiryRange, targetDelta, maxOtmPct, minVolume }
      };
      setCurrentScan(newItem);
      setSelectedStrategyIdx(0);
      const updatedHistory = [newItem, ...history].slice(0, 10);
      setHistory(updatedHistory);
      localStorage.setItem('ignite_options_live_v2', JSON.stringify(updatedHistory));
      toast.success(`PMCC analysis complete for ${ticker}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to analyze options');
    } finally {
      setLoading(false);
    }
  };

  const handleScanRoll = async () => {
    if (!rollTicker || !rollStrike) return;
    setScanningRoll(true);
    try {
      const { data, error } = await supabase.functions.invoke('ignite-options-scanner', {
        body: { action: 'roll', ticker: rollTicker, currentStrike: rollStrike }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setRollingResults(data);
      toast.success('Rolling opportunities found');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to scan rolls');
    } finally {
      setScanningRoll(false);
    }
  };

  const currentStrategy = useMemo(() => {
    if (!currentScan || !currentScan.strategies[selectedStrategyIdx]) return null;
    return currentScan.strategies[selectedStrategyIdx];
  }, [currentScan, selectedStrategyIdx]);

  const simulationData = useMemo(() => {
    if (!currentScan || !currentStrategy) return [];
    const stockPrice = currentScan.stockPrice;
    const data = [];
    const { longStrike, longPremium, shortStrike, shortPremium } = currentStrategy;
    const startPrice = stockPrice * 0.70;
    const endPrice = stockPrice * 1.30;
    const step = (endPrice - startPrice) / 60;

    for (let price = startPrice; price <= endPrice; price += step) {
      const plLong = Math.max(0, price - longStrike) - longPremium;
      const plShort = shortPremium - Math.max(0, price - shortStrike);
      const totalPL = (plLong + plShort) * 100;
      const dist = Math.exp(-Math.pow(price - stockPrice, 2) / (2 * Math.pow(stockPrice * 0.1, 2)));
      data.push({ price: Math.round(price), profit: Math.round(totalPL), density: dist * 100 });
    }
    return data;
  }, [currentScan, currentStrategy]);

  const rollingAnalysis = useMemo(() => {
    const netPerShare = stoCredit - btcCost;
    const totalNet = netPerShare * contractCount * 100;
    const isPositive = totalNet >= 0;
    const basis = currentStrategy?.netDebit || 50;
    const annualizedYield = rollDte > 0 ? (netPerShare / basis) * (365 / rollDte) * 100 : 0;
    return { totalNet, netPerShare, isPositive, annualizedYield, outcome: isPositive ? 'Yield Enhancement' : 'Defensive Position' };
  }, [btcCost, stoCredit, contractCount, rollDte, currentStrategy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary rounded-xl">
                  <BarChart3 className="h-6 w-6 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold">Options Risk Lab</h2>
              </div>
              <p className="text-muted-foreground text-sm">AI-Augmented LEAP Discovery & Greek Risk Engine</p>
            </div>
            <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
              <TabsList>
                <TabsTrigger value="scanner" className="flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5" /> Alpha Scan
                </TabsTrigger>
                <TabsTrigger value="risk" className="flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5" /> Risk Model
                </TabsTrigger>
                <TabsTrigger value="rolling" className="flex items-center gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" /> Rolling Lab
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* Scanner Tab */}
          {activeSubTab === 'scanner' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle>PMCC Discovery Scan</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">Leveraging LEAPs to simulate equity ownership</p>
                    </div>
                    <div className="flex items-center gap-3 bg-muted p-2 rounded-xl">
                      <div className="flex flex-col items-center border-r border-border pr-3">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">Ticker</span>
                        <Input
                          value={ticker}
                          onChange={(e) => setTicker(e.target.value.toUpperCase())}
                          className="bg-transparent font-bold text-primary border-none w-16 text-center text-lg uppercase p-0 h-auto"
                        />
                      </div>
                      {currentScan && (
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase">Price</span>
                          <span className="font-bold text-lg">${currentScan.stockPrice.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium text-muted-foreground">
                        <span>DTE Months</span>
                        <span className="text-primary font-bold">{expiryRange}m</span>
                      </div>
                      <Slider value={[expiryRange]} onValueChange={([v]) => setExpiryRange(v)} min={6} max={36} step={3} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium text-muted-foreground">
                        <span>Target Delta</span>
                        <span className="text-primary font-bold">{targetDelta.toFixed(2)}</span>
                      </div>
                      <Slider value={[targetDelta * 100]} onValueChange={([v]) => setTargetDelta(v / 100)} min={50} max={95} step={5} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium text-muted-foreground">
                        <span>Short OTM %</span>
                        <span className="text-primary font-bold">{maxOtmPct}%</span>
                      </div>
                      <Slider value={[maxOtmPct]} onValueChange={([v]) => setMaxOtmPct(v)} min={2} max={25} step={1} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium text-muted-foreground">
                        <span>Min Vol (M)</span>
                        <span className="text-primary font-bold">{(minVolume / 1000000).toFixed(1)}</span>
                      </div>
                      <Slider value={[minVolume / 100000]} onValueChange={([v]) => setMinVolume(v * 100000)} min={1} max={50} step={1} />
                    </div>
                  </div>
                  <Button onClick={handleAnalyze} disabled={loading} className="w-full" size="lg">
                    {loading ? <RefreshCw className="h-5 w-5 animate-spin mr-2" /> : <Search className="h-5 w-5 mr-2" />}
                    {loading ? 'Crunching Option Grids...' : 'Run Deep LEAP Analysis'}
                  </Button>
                </CardContent>
              </Card>

              {currentScan && currentScan.strategies.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {currentScan.strategies.map((strat, i) => (
                    <Card
                      key={i}
                      className={`cursor-pointer transition-all hover:shadow-md ${selectedStrategyIdx === i ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => { setSelectedStrategyIdx(i); setActiveSubTab('risk'); }}
                    >
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <Badge variant={i === 0 ? 'secondary' : i === 1 ? 'default' : 'destructive'}>
                            {i === 0 ? 'Conservative' : i === 1 ? 'Balanced' : 'Aggressive'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">${currentScan.stockPrice}</span>
                        </div>
                        <p className="text-lg font-bold mb-3">${strat.longStrike} LEAP / ${strat.shortStrike} S</p>
                        <div className="flex justify-between items-end border-t pt-3">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase">Entry Debit</p>
                            <p className="text-lg font-bold text-primary">${(strat.netDebit * 100).toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground uppercase">Delta</p>
                            <p className="text-sm font-bold text-green-500">{(strat.longDelta * 100).toFixed(0)} shares</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {currentScan && (
                <Card>
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground">{currentScan.generalAnalysis}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Risk Model Tab */}
          {activeSubTab === 'risk' && currentStrategy && currentScan && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Visual Risk Simulator</CardTitle>
                      <p className="text-xs text-muted-foreground">Profit/Loss vs Market Distribution</p>
                    </div>
                    <Badge variant="outline" className="text-sm">Breakeven: ${currentStrategy.breakEven.toLocaleString()}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={simulationData}>
                        <defs>
                          <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.2} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="price" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}>
                          <RechartsLabel value="Stock Price at Expiry" offset={-10} position="insideBottom" fill="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} />
                        </XAxis>
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `$${v}`} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--popover))' }} />
                        <Area type="monotone" dataKey="profit" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#riskGrad)" />
                        <Bar dataKey="density" barSize={8} fill="hsl(var(--primary))" opacity={0.05} />
                        <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
                        <ReferenceLine x={currentStrategy.breakEven} stroke="hsl(var(--chart-4))" strokeWidth={2} label={{ value: 'BREAKEVEN', position: 'top', fill: 'hsl(var(--chart-4))', fontSize: 9, fontWeight: '700' }} />
                        <ReferenceLine x={currentScan.stockPrice} stroke="hsl(var(--primary))" strokeDasharray="3 3" label={{ value: 'CURRENT', position: 'insideBottomLeft', fill: 'hsl(var(--primary))', fontSize: 9, fontWeight: '700' }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-primary text-primary-foreground">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-80">
                      <Zap className="h-4 w-4" /> Delta Engine
                    </div>
                    <p className="text-3xl font-bold">{(currentStrategy.longDelta * 100).toFixed(0)}</p>
                    <p className="text-xs opacity-70">Synthetic Share Equivalent</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                      <Clock className="h-4 w-4" /> Theta Harvest
                    </div>
                    <p className="text-3xl font-bold">Positive</p>
                    <p className="text-xs text-muted-foreground">Time-Decay Net Direction</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-500">
                      <Shield className="h-4 w-4" /> Max Exposure
                    </div>
                    <p className="text-3xl font-bold text-destructive">${(currentStrategy.netDebit * 100).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Strict Capital-at-Risk</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeSubTab === 'risk' && !currentStrategy && (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Run a scan first, then select a strategy to view the risk model.</p>
              </CardContent>
            </Card>
          )}

          {/* Rolling Lab Tab */}
          {activeSubTab === 'rolling' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500 rounded-xl">
                      <RotateCcw className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle>Manual Rolling Lab</CardTitle>
                      <p className="text-xs text-muted-foreground">Cost-Basis & Yield Optimization</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1">
                        <Minus className="h-3 w-3 text-destructive" /> BTC Cost ($)
                      </Label>
                      <Input type="number" step="0.05" value={btcCost} onChange={(e) => setBtcCost(parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1">
                        <Plus className="h-3 w-3 text-green-500" /> STO Credit ($)
                      </Label>
                      <Input type="number" step="0.05" value={stoCredit} onChange={(e) => setStoCredit(parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                  <Card className="bg-primary text-primary-foreground">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs uppercase opacity-70">Net Flow</p>
                          <p className={`text-4xl font-bold ${rollingAnalysis.isPositive ? 'text-green-300' : 'text-red-300'}`}>
                            {rollingAnalysis.isPositive ? '+' : ''}${rollingAnalysis.totalNet.toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">{rollingAnalysis.outcome}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    AI Roll Optimizer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Ticker" value={rollTicker} onChange={(e) => setRollTicker(e.target.value.toUpperCase())} />
                    <Input type="number" placeholder="Strike" value={rollStrike} onChange={(e) => setRollStrike(parseFloat(e.target.value) || 0)} />
                  </div>
                  <Button onClick={handleScanRoll} disabled={scanningRoll} className="w-full">
                    {scanningRoll ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                    {scanningRoll ? 'Scanning...' : 'Fetch Optimal Rolls'}
                  </Button>
                  {rollingResults && (
                    <div className="space-y-3 mt-4">
                      {rollingResults.opportunities?.map((opp: any, i: number) => (
                        <Card key={i} className="bg-muted/50">
                          <CardContent className="p-4">
                            <p className="font-medium text-sm">{opp.action}</p>
                            <p className="text-xs text-muted-foreground mt-1">{opp.rationale}</p>
                            <div className="flex gap-3 mt-2">
                              <Badge variant="outline">Strike: ${opp.newStrike}</Badge>
                              <Badge variant="outline" className="text-green-500">Credit: ${opp.estimatedCredit}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {rollingResults.summary && (
                        <p className="text-xs text-muted-foreground italic">{rollingResults.summary}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" /> Recent Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {history.map((item, idx) => (
                <Button
                  key={idx}
                  variant={currentScan?.timestamp === item.timestamp ? 'default' : 'ghost'}
                  className="w-full justify-between"
                  onClick={() => { setCurrentScan(item); setTicker(item.ticker); setActiveSubTab('scanner'); }}
                >
                  <div className="text-left">
                    <p className="font-bold text-sm">{item.ticker}</p>
                    <p className="text-[10px] text-muted-foreground">@ ${item.stockPrice}</p>
                  </div>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ))}
              {history.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">No recent scans.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider">Leveraging PMCCs</h4>
              <p className="text-xs opacity-80 leading-relaxed">
                A PMCC uses a deep ITM LEAP as a stock substitute and sells short-dated OTM calls to generate income — reducing cost basis over time while maintaining upside exposure.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IgniteOptionsScanner;
