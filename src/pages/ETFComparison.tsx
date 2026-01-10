import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plus, Trash2, TrendingUp, TrendingDown, BarChart3, PieChart, Scale, Info, RefreshCw, Loader2, Save, FolderOpen, Star } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

interface ETFData {
  symbol: string;
  name: string;
  price: number;
  change?: number;
  changePercent?: number;
  expenseRatio: number;
  aum?: number;
  holdings: { symbol: string; name: string; weight: number }[];
  performance: { [key: string]: number };
}

interface SavedComparison {
  id: string;
  name: string;
  symbols: string[];
  created_at: string;
}

// Fallback data for when API fails or for unsupported symbols
const fallbackETFData: { [key: string]: ETFData } = {
  'SPY': {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    price: 478.52,
    expenseRatio: 0.09,
    holdings: [
      { symbol: 'AAPL', name: 'Apple Inc.', weight: 7.2 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', weight: 6.8 },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', weight: 3.4 },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', weight: 3.2 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', weight: 2.1 },
    ],
    performance: { 'YTD': 12.5, '1Y': 24.8, '2Y': 8.2, '3Y': 32.4, '5Y': 78.5, '10Y': 215.6, 'All': 580.2 }
  },
  'QQQ': {
    symbol: 'QQQ',
    name: 'Invesco QQQ Trust',
    price: 405.23,
    expenseRatio: 0.20,
    holdings: [
      { symbol: 'AAPL', name: 'Apple Inc.', weight: 11.2 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', weight: 10.5 },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', weight: 5.8 },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', weight: 5.2 },
      { symbol: 'META', name: 'Meta Platforms Inc.', weight: 4.8 },
    ],
    performance: { 'YTD': 18.2, '1Y': 42.5, '2Y': 12.8, '3Y': 45.2, '5Y': 145.8, '10Y': 425.6, 'All': 1250.8 }
  },
  'VTI': {
    symbol: 'VTI',
    name: 'Vanguard Total Stock Market ETF',
    price: 245.12,
    expenseRatio: 0.03,
    holdings: [
      { symbol: 'AAPL', name: 'Apple Inc.', weight: 6.5 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', weight: 6.1 },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', weight: 2.9 },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', weight: 2.8 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', weight: 1.8 },
    ],
    performance: { 'YTD': 11.8, '1Y': 23.5, '2Y': 7.5, '3Y': 30.2, '5Y': 72.8, '10Y': 198.5, 'All': 520.4 }
  },
  'VOO': {
    symbol: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    price: 440.85,
    expenseRatio: 0.03,
    holdings: [
      { symbol: 'AAPL', name: 'Apple Inc.', weight: 7.2 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', weight: 6.8 },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', weight: 3.4 },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', weight: 3.2 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', weight: 2.1 },
    ],
    performance: { 'YTD': 12.6, '1Y': 24.9, '2Y': 8.3, '3Y': 32.5, '5Y': 78.8, '10Y': 216.2, 'All': 320.5 }
  },
  'IWM': {
    symbol: 'IWM',
    name: 'iShares Russell 2000 ETF',
    price: 198.45,
    expenseRatio: 0.19,
    holdings: [
      { symbol: 'SMCI', name: 'Super Micro Computer Inc.', weight: 0.8 },
      { symbol: 'MSTR', name: 'MicroStrategy Inc.', weight: 0.7 },
      { symbol: 'TOST', name: 'Toast Inc.', weight: 0.5 },
      { symbol: 'APP', name: 'AppLovin Corp.', weight: 0.5 },
      { symbol: 'INSM', name: 'Insmed Inc.', weight: 0.4 },
    ],
    performance: { 'YTD': 4.2, '1Y': 12.8, '2Y': -2.5, '3Y': 8.5, '5Y': 35.2, '10Y': 85.6, 'All': 245.8 }
  },
  'VUG': {
    symbol: 'VUG',
    name: 'Vanguard Growth ETF',
    price: 342.18,
    expenseRatio: 0.04,
    holdings: [
      { symbol: 'AAPL', name: 'Apple Inc.', weight: 12.5 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', weight: 11.8 },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', weight: 5.2 },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', weight: 4.8 },
      { symbol: 'META', name: 'Meta Platforms Inc.', weight: 3.5 },
    ],
    performance: { 'YTD': 16.5, '1Y': 38.2, '2Y': 10.5, '3Y': 38.5, '5Y': 115.2, '10Y': 295.8, 'All': 580.2 }
  }
};

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(142, 76%, 36%)', 'hsl(221, 83%, 53%)', 'hsl(262, 83%, 58%)'];

const ETFComparison = () => {
  const { user } = useAuth();
  const [selectedETFs, setSelectedETFs] = useState<string[]>(['SPY', 'QQQ']);
  const [newETF, setNewETF] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1Y');
  const [etfData, setEtfData] = useState<ETFData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLiveData, setIsLiveData] = useState(false);
  
  // Saved comparisons state
  const [savedComparisons, setSavedComparisons] = useState<SavedComparison[]>([]);
  const [saveName, setSaveName] = useState('');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const timeframes = [
    { value: 'YTD', label: 'YTD' },
    { value: '1Y', label: '1 Year' },
    { value: '2Y', label: '2 Years' },
    { value: '3Y', label: '3 Years' },
    { value: '5Y', label: '5 Years' },
    { value: '10Y', label: '10 Years' },
    { value: 'All', label: 'All Time' },
  ];

  // Fetch saved comparisons
  const fetchSavedComparisons = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('saved_etf_comparisons')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setSavedComparisons(data as SavedComparison[]);
    }
  }, [user]);

  useEffect(() => {
    fetchSavedComparisons();
  }, [fetchSavedComparisons]);

  const saveComparison = async () => {
    if (!user) {
      toast.error('Please sign in to save comparisons');
      return;
    }
    if (!saveName.trim()) {
      toast.error('Please enter a name for this comparison');
      return;
    }
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('saved_etf_comparisons')
        .insert({
          user_id: user.id,
          name: saveName.trim(),
          symbols: selectedETFs
        });
      
      if (error) throw error;
      
      toast.success('Comparison saved!');
      setSaveName('');
      setIsSaveDialogOpen(false);
      fetchSavedComparisons();
    } catch (error) {
      console.error('Error saving comparison:', error);
      toast.error('Failed to save comparison');
    } finally {
      setIsSaving(false);
    }
  };

  const loadComparison = (comparison: SavedComparison) => {
    setSelectedETFs(comparison.symbols);
    setIsLoadDialogOpen(false);
    toast.success(`Loaded "${comparison.name}"`);
  };

  const deleteComparison = async (id: string) => {
    const { error } = await supabase
      .from('saved_etf_comparisons')
      .delete()
      .eq('id', id);
    
    if (!error) {
      toast.success('Comparison deleted');
      fetchSavedComparisons();
    }
  };

  const fetchETFData = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-etf-data', {
        body: { symbols }
      });

      if (error) throw error;

      if (data?.success && data.data) {
        setEtfData(data.data);
        setIsLiveData(true);
        setLastUpdated(new Date());
      } else {
        throw new Error(data?.error || 'Failed to fetch ETF data');
      }
    } catch (error) {
      console.error('Error fetching ETF data:', error);
      // Fall back to local data
      const fallbackData = symbols.map(symbol => fallbackETFData[symbol]).filter(Boolean);
      setEtfData(fallbackData);
      setIsLiveData(false);
      toast.error('Using cached data - live API unavailable');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchETFData(selectedETFs);
  }, [selectedETFs, fetchETFData]);

  const addETF = () => {
    const symbol = newETF.toUpperCase().trim();
    if (!symbol) {
      toast.error('Please enter an ETF symbol');
      return;
    }
    if (selectedETFs.includes(symbol)) {
      toast.error('ETF already added');
      return;
    }
    if (selectedETFs.length >= 5) {
      toast.error('Maximum 5 ETFs can be compared');
      return;
    }
    setSelectedETFs([...selectedETFs, symbol]);
    setNewETF('');
    toast.success(`Added ${symbol}`);
  };

  const removeETF = (symbol: string) => {
    if (selectedETFs.length <= 1) {
      toast.error('At least one ETF is required');
      return;
    }
    setSelectedETFs(selectedETFs.filter(s => s !== symbol));
    toast.success(`Removed ${symbol}`);
  };

  // Find overlapping holdings
  const holdingsOverlap = useMemo(() => {
    if (etfData.length < 2) return [];
    
    const holdingCounts: { [symbol: string]: { name: string; etfs: { symbol: string; weight: number }[] } } = {};
    
    etfData.forEach(etf => {
      etf.holdings.forEach(holding => {
        if (!holdingCounts[holding.symbol]) {
          holdingCounts[holding.symbol] = { name: holding.name, etfs: [] };
        }
        holdingCounts[holding.symbol].etfs.push({ symbol: etf.symbol, weight: holding.weight });
      });
    });

    return Object.entries(holdingCounts)
      .filter(([_, data]) => data.etfs.length > 1)
      .map(([symbol, data]) => ({
        symbol,
        name: data.name,
        etfs: data.etfs,
        totalWeight: data.etfs.reduce((sum, e) => sum + e.weight, 0)
      }))
      .sort((a, b) => b.etfs.length - a.etfs.length || b.totalWeight - a.totalWeight);
  }, [etfData]);

  // Performance comparison data for chart
  const performanceChartData = useMemo(() => {
    return timeframes.map(tf => {
      const dataPoint: any = { timeframe: tf.label };
      etfData.forEach(etf => {
        dataPoint[etf.symbol] = etf.performance[tf.value] || 0;
      });
      return dataPoint;
    });
  }, [etfData, timeframes]);

  // Get best performer for selected timeframe
  const getBestPerformer = (timeframe: string) => {
    if (etfData.length === 0) return null;
    return etfData.reduce((best, etf) => {
      if (!best || (etf.performance[timeframe] || 0) > (best.performance[timeframe] || 0)) {
        return etf;
      }
      return best;
    }, null as ETFData | null);
  };

  const formatAUM = (aum?: number) => {
    if (!aum) return 'N/A';
    if (aum >= 1000000000000) return `$${(aum / 1000000000000).toFixed(1)}T`;
    if (aum >= 1000000000) return `$${(aum / 1000000000).toFixed(0)}B`;
    return `$${(aum / 1000000).toFixed(0)}M`;
  };

  return (
    <PageLayout title="ETF Comparison">
      <Tabs defaultValue="performance" className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="holdings">Holdings Overlap</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2 items-center flex-wrap">
            <Input
              placeholder="Add ETF (e.g., VOO)"
              value={newETF}
              onChange={(e) => setNewETF(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && addETF()}
              className="w-40"
            />
            <Button onClick={addETF} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
            <Button 
              onClick={() => fetchETFData(selectedETFs)} 
              size="sm" 
              variant="outline"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            
            {/* Save Dialog */}
            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" disabled={!user}>
                  <Save className="h-4 w-4 mr-1" /> Save
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save ETF Comparison</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Comparison Name</Label>
                    <Input
                      placeholder="e.g., Tech ETFs, Growth Portfolio"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>ETFs</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedETFs.map(symbol => (
                        <Badge key={symbol} variant="secondary">{symbol}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveComparison} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Load Dialog */}
            <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" disabled={!user || savedComparisons.length === 0}>
                  <FolderOpen className="h-4 w-4 mr-1" /> Load
                  {savedComparisons.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {savedComparisons.length}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Load Saved Comparison</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 py-4 max-h-[400px] overflow-y-auto">
                  {savedComparisons.map(comparison => (
                    <div 
                      key={comparison.id} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 cursor-pointer" onClick={() => loadComparison(comparison)}>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-primary" />
                          <span className="font-medium">{comparison.name}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {comparison.symbols.map(symbol => (
                            <Badge key={symbol} variant="outline" className="text-xs">{symbol}</Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(comparison.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteComparison(comparison.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {savedComparisons.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No saved comparisons yet
                    </p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Data Source Indicator */}
        <div className="flex items-center gap-2 text-sm">
          <Badge variant={isLiveData ? 'default' : 'secondary'} className="text-xs">
            {isLiveData ? '🔴 Live Data' : '📦 Cached Data'}
          </Badge>
          {lastUpdated && (
            <span className="text-muted-foreground text-xs">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          {isLoading && (
            <span className="text-muted-foreground text-xs flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading...
            </span>
          )}
        </div>

        {/* Selected ETFs badges */}
        <div className="flex flex-wrap gap-2">
          {selectedETFs.map((symbol, index) => (
            <Badge 
              key={symbol} 
              variant="secondary" 
              className="flex items-center gap-2 py-1.5 px-3"
              style={{ borderColor: COLORS[index % COLORS.length] }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              {symbol}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => removeETF(symbol)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>

        <TabsContent value="performance" className="space-y-6">
          {/* Timeframe selector */}
          <div className="flex items-center gap-4">
            <Label>Timeframe:</Label>
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeframes.map(tf => (
                  <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Performance Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {etfData.map((etf, index) => {
              const perf = etf.performance[selectedTimeframe] || 0;
              const isBest = getBestPerformer(selectedTimeframe)?.symbol === etf.symbol;
              return (
                <Card key={etf.symbol} className={`glass-card ${isBest ? 'border-chart-1/50 bg-chart-1/5' : 'border-border/50'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="font-bold">{etf.symbol}</span>
                      {isBest && <Badge className="text-xs bg-chart-1/20 text-chart-1">Best</Badge>}
                    </div>
                    <p className={`text-2xl font-bold ${perf >= 0 ? 'text-chart-1' : 'text-destructive'}`}>
                      {perf >= 0 ? '+' : ''}{perf.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">{timeframes.find(t => t.value === selectedTimeframe)?.label}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Comparison
              </CardTitle>
              <CardDescription>Returns across all timeframes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tickFormatter={(v) => `${v}%`} stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="timeframe" type="category" width={80} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    {selectedETFs.map((symbol, index) => (
                      <Bar key={symbol} dataKey={symbol} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ETF</TableHead>
                    <TableHead>YTD</TableHead>
                    <TableHead>1Y</TableHead>
                    <TableHead>2Y</TableHead>
                    <TableHead>3Y</TableHead>
                    <TableHead>5Y</TableHead>
                    <TableHead>10Y</TableHead>
                    <TableHead>All Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {etfData.map((etf, index) => (
                    <TableRow key={etf.symbol}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="font-medium">{etf.symbol}</span>
                        </div>
                      </TableCell>
                      {['YTD', '1Y', '2Y', '3Y', '5Y', '10Y', 'All'].map(tf => {
                        const perf = etf.performance[tf] || 0;
                        return (
                          <TableCell key={tf} className={perf >= 0 ? 'text-chart-1' : 'text-destructive'}>
                            {perf >= 0 ? '+' : ''}{perf.toFixed(1)}%
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holdings" className="space-y-6">
          {/* Overlap Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-chart-1/20">
                    <Scale className="h-5 w-5 text-chart-1" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Overlapping Holdings</p>
                    <p className="text-2xl font-bold">{holdingsOverlap.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/20">
                    <PieChart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ETFs Compared</p>
                    <p className="text-2xl font-bold">{selectedETFs.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-warning/20">
                    <Info className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Overlap Concentration</p>
                    <p className="text-2xl font-bold">
                      {holdingsOverlap.length > 0 
                        ? `${(holdingsOverlap.slice(0, 5).reduce((sum, h) => sum + h.totalWeight, 0) / selectedETFs.length).toFixed(1)}%`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Explanation Card */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Understanding Holdings Overlap
              </h3>
              <p className="text-sm text-muted-foreground">
                Holdings overlap shows which stocks appear in multiple ETFs you're comparing. High overlap means you may have 
                unintentional concentration in certain stocks. For example, if both SPY and QQQ hold Apple at 7% and 11% 
                respectively, your actual Apple exposure may be higher than intended if you hold both ETFs equally.
              </p>
            </CardContent>
          </Card>

          {/* Overlapping Holdings Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Overlapping Holdings
              </CardTitle>
              <CardDescription>
                Stocks that appear in multiple selected ETFs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {holdingsOverlap.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {selectedETFs.length < 2 ? 'Add at least 2 ETFs to see overlap' : 'No overlapping holdings found'}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>In ETFs</TableHead>
                      {selectedETFs.map(symbol => (
                        <TableHead key={symbol}>{symbol} Weight</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holdingsOverlap.map(holding => (
                      <TableRow key={holding.symbol}>
                        <TableCell className="font-medium">{holding.symbol}</TableCell>
                        <TableCell className="text-muted-foreground">{holding.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{holding.etfs.length} ETFs</Badge>
                        </TableCell>
                        {selectedETFs.map(etfSymbol => {
                          const weight = holding.etfs.find(e => e.symbol === etfSymbol)?.weight;
                          return (
                            <TableCell key={etfSymbol}>
                              {weight ? `${weight.toFixed(1)}%` : '-'}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Individual ETF Holdings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {etfData.map((etf, index) => (
              <Card key={etf.symbol}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    {etf.symbol} Top Holdings
                  </CardTitle>
                  <CardDescription>{etf.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Weight</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {etf.holdings.map(holding => (
                        <TableRow key={holding.symbol}>
                          <TableCell className="font-medium">{holding.symbol}</TableCell>
                          <TableCell className="text-muted-foreground">{holding.name}</TableCell>
                          <TableCell className="text-right">{holding.weight.toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          {/* ETF Details Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {etfData.map((etf, index) => (
              <Card key={etf.symbol} className="glass-card border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <CardTitle>{etf.symbol}</CardTitle>
                  </div>
                  <CardDescription>{etf.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="text-lg font-bold">${etf.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Expense Ratio</p>
                      <p className="text-lg font-bold">{(etf.expenseRatio).toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">AUM</p>
                      <p className="text-lg font-bold">{formatAUM(etf.aum)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">1Y Return</p>
                      <p className={`text-lg font-bold ${(etf.performance?.['1Y'] ?? 0) >= 0 ? 'text-chart-1' : 'text-destructive'}`}>
                        {(etf.performance?.['1Y'] ?? 0) >= 0 ? '+' : ''}{(etf.performance?.['1Y'] ?? 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Side-by-Side Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    {etfData.map((etf, index) => (
                      <TableHead key={etf.symbol}>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          {etf.symbol}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Price</TableCell>
                    {etfData.map(etf => (
                      <TableCell key={etf.symbol}>${etf.price.toFixed(2)}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Expense Ratio</TableCell>
                    {etfData.map(etf => (
                      <TableCell key={etf.symbol}>{etf.expenseRatio.toFixed(2)}%</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">AUM</TableCell>
                    {etfData.map(etf => (
                      <TableCell key={etf.symbol}>{formatAUM(etf.aum)}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Top Holding</TableCell>
                    {etfData.map(etf => (
                      <TableCell key={etf.symbol}>
                        {etf.holdings?.[0]?.symbol ?? 'N/A'} ({etf.holdings?.[0]?.weight != null ? etf.holdings[0].weight.toFixed(1) : '0'}%)
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Expense Ratio Explanation */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Understanding Expense Ratios
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                The expense ratio is the annual fee charged by the ETF, expressed as a percentage of your investment. 
                For example, a 0.03% expense ratio on a $10,000 investment costs you $3/year.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-background/50 p-2 rounded">
                  <p className="text-chart-1 font-medium">Very Low: &lt;0.10%</p>
                  <p className="text-muted-foreground">Index funds, Vanguard</p>
                </div>
                <div className="bg-background/50 p-2 rounded">
                  <p className="text-primary font-medium">Low: 0.10-0.25%</p>
                  <p className="text-muted-foreground">Most passive ETFs</p>
                </div>
                <div className="bg-background/50 p-2 rounded">
                  <p className="text-warning font-medium">Moderate: 0.25-0.75%</p>
                  <p className="text-muted-foreground">Active or niche ETFs</p>
                </div>
                <div className="bg-background/50 p-2 rounded">
                  <p className="text-destructive font-medium">High: &gt;0.75%</p>
                  <p className="text-muted-foreground">Actively managed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default ETFComparison;
