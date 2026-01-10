import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { 
  RefreshCw, TrendingUp, TrendingDown, Activity, Clock, DollarSign, 
  Loader2, Info, Shield, Filter, Plus, Star, ChevronDown, ChevronUp 
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface LeapsOption {
  symbol: string;
  stockPrice: number;
  strike: number;
  expiration: string;
  daysToExpiry: number;
  optionType: 'call' | 'put';
  bid: number;
  ask: number;
  lastPrice: number;
  impliedVolatility: number;
  openInterest: number;
  volume: number;
  delta: number;
  theta: number;
  breakeven: number;
  annualizedReturn: number;
}

interface CoveredCallOption {
  symbol: string;
  stockPrice: number;
  strike: number;
  expiration: string;
  daysToExpiry: number;
  premium: number;
  premiumPercent: number;
  annualizedReturn: number;
  downProtection: number;
  maxProfit: number;
  maxProfitPercent: number;
  openInterest: number;
  impliedVolatility: number;
}

interface LeapsFilters {
  optionType: 'all' | 'call' | 'put';
  minDelta: number;
  maxDelta: number;
  minOpenInterest: number;
  minAnnualizedReturn: number;
  maxIV: number;
}

interface LeapsFilterPreset {
  name: string;
  description: string;
  filters: Partial<LeapsFilters>;
}

interface CoveredCallFilterPreset {
  name: string;
  description: string;
  filters: Partial<CoveredCallFilters>;
}

const leapsPresets: LeapsFilterPreset[] = [
  {
    name: 'Deep ITM Calls',
    description: 'Delta 0.70+ for stock replacement',
    filters: { optionType: 'call', minDelta: 0.70, maxDelta: 1, minOpenInterest: 100 }
  },
  {
    name: 'ATM Calls',
    description: 'Delta 0.45-0.55 for balanced risk/reward',
    filters: { optionType: 'call', minDelta: 0.45, maxDelta: 0.55, minOpenInterest: 50 }
  },
  {
    name: 'OTM Calls',
    description: 'Delta 0.20-0.40 for leveraged upside',
    filters: { optionType: 'call', minDelta: 0.20, maxDelta: 0.40, minOpenInterest: 100 }
  },
  {
    name: 'Conservative Puts',
    description: 'Delta -0.30 to -0.40 for income',
    filters: { optionType: 'put', minDelta: 0.30, maxDelta: 0.40, minOpenInterest: 50 }
  },
  {
    name: 'Protective Puts',
    description: 'Delta -0.15 to -0.25 for portfolio hedge',
    filters: { optionType: 'put', minDelta: 0.15, maxDelta: 0.25, minOpenInterest: 100 }
  },
  {
    name: 'High Liquidity',
    description: 'Open Interest 500+ for easy fills',
    filters: { optionType: 'all', minOpenInterest: 500, minDelta: 0, maxDelta: 1 }
  },
  {
    name: 'Low IV',
    description: 'IV under 40% for cheaper options',
    filters: { optionType: 'all', maxIV: 40, minDelta: 0, maxDelta: 1 }
  }
];

const coveredCallPresets: CoveredCallFilterPreset[] = [
  {
    name: 'High Income',
    description: '30%+ annualized return for aggressive income',
    filters: { minAnnualizedReturn: 30, minOpenInterest: 50 }
  },
  {
    name: 'Conservative',
    description: 'High downside protection (8%+) for safety',
    filters: { minProtection: 8, minAnnualizedReturn: 10, maxDaysToExpiry: 45 }
  },
  {
    name: 'Weekly Expiries',
    description: '7-14 days for frequent premium collection',
    filters: { minDaysToExpiry: 7, maxDaysToExpiry: 14, minOpenInterest: 100 }
  },
  {
    name: 'Monthly Expiries',
    description: '25-35 days for standard monthly cycle',
    filters: { minDaysToExpiry: 25, maxDaysToExpiry: 35, minOpenInterest: 50 }
  },
  {
    name: 'Balanced',
    description: '15%+ return with 5%+ protection',
    filters: { minAnnualizedReturn: 15, minProtection: 5, minOpenInterest: 25 }
  },
  {
    name: 'Budget Stocks',
    description: 'Stocks under $10 for smaller accounts',
    filters: { maxStockPrice: 10, minOpenInterest: 50 }
  },
  {
    name: 'High Liquidity',
    description: 'Open Interest 200+ for easy entry/exit',
    filters: { minOpenInterest: 200 }
  }
];

interface CoveredCallFilters {
  minAnnualizedReturn: number;
  minOpenInterest: number;
  minProtection: number;
  maxDaysToExpiry: number;
  minDaysToExpiry: number;
  maxStockPrice: number;
}

const MarketScanner = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('leaps');
  const [scanning, setScanning] = useState(false);
  const [leapsData, setLeapsData] = useState<LeapsOption[]>([]);
  const [coveredCallsData, setCoveredCallsData] = useState<CoveredCallOption[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLiveData, setIsLiveData] = useState(false);
  const [showLeapsFilters, setShowLeapsFilters] = useState(false);
  const [showCCFilters, setShowCCFilters] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [addingToWatchlist, setAddingToWatchlist] = useState<string | null>(null);

  // LEAPS Filters
  const [leapsFilters, setLeapsFilters] = useState<LeapsFilters>({
    optionType: 'all',
    minDelta: 0,
    maxDelta: 1,
    minOpenInterest: 0,
    minAnnualizedReturn: 0,
    maxIV: 200
  });

  // Covered Call Filters
  const [ccFilters, setCCFilters] = useState<CoveredCallFilters>({
    minAnnualizedReturn: 0,
    minOpenInterest: 0,
    minProtection: 0,
    maxDaysToExpiry: 45,
    minDaysToExpiry: 14,
    maxStockPrice: 20
  });

  // Fetch user's watchlist
  const fetchWatchlist = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select('symbol')
        .eq('user_id', user.id);
      
      if (error) throw error;
      setWatchlist(data?.map(item => item.symbol) || []);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    }
  }, [user]);

  // Add to watchlist
  const addToWatchlist = async (symbol: string) => {
    if (!user) {
      toast.error('Please sign in to add to watchlist');
      return;
    }

    setAddingToWatchlist(symbol);
    try {
      if (watchlist.includes(symbol)) {
        // Remove from watchlist
        const { error } = await supabase
          .from('watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('symbol', symbol);
        
        if (error) throw error;
        setWatchlist(prev => prev.filter(s => s !== symbol));
        toast.success(`${symbol} removed from watchlist`);
      } else {
        // Add to watchlist
        const { error } = await supabase
          .from('watchlist')
          .insert({ user_id: user.id, symbol });
        
        if (error) throw error;
        setWatchlist(prev => [...prev, symbol]);
        toast.success(`${symbol} added to watchlist`);
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
      toast.error('Failed to update watchlist');
    } finally {
      setAddingToWatchlist(null);
    }
  };

  const scanOptions = useCallback(async (scanType: 'leaps' | 'covered_calls') => {
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('scan-options', {
        body: { scanType }
      });

      if (error) throw error;

      if (data?.success && data.data) {
        if (scanType === 'leaps') {
          setLeapsData(data.data);
        } else {
          setCoveredCallsData(data.data);
        }
        setIsLiveData(true);
        setLastUpdated(new Date());
        toast.success(`Found ${data.data.length} ${scanType === 'leaps' ? 'LEAPS' : 'covered call'} opportunities`);
      } else {
        throw new Error(data?.error || 'Failed to scan options');
      }
    } catch (error) {
      console.error('Error scanning options:', error);
      toast.error('Failed to scan options market');
      setIsLiveData(false);
    } finally {
      setScanning(false);
    }
  }, []);

  useEffect(() => {
    scanOptions('leaps');
    scanOptions('covered_calls');
    fetchWatchlist();
  }, [fetchWatchlist]);

  // Filtered LEAPS data
  const filteredLeapsData = useMemo(() => {
    return leapsData.filter(option => {
      if (leapsFilters.optionType !== 'all' && option.optionType !== leapsFilters.optionType) return false;
      const absDelta = Math.abs(option.delta);
      if (absDelta < leapsFilters.minDelta || absDelta > leapsFilters.maxDelta) return false;
      if (option.openInterest < leapsFilters.minOpenInterest) return false;
      if (option.annualizedReturn < leapsFilters.minAnnualizedReturn) return false;
      if (option.impliedVolatility > leapsFilters.maxIV) return false;
      return true;
    });
  }, [leapsData, leapsFilters]);

  // Filtered Covered Calls data
  const filteredCCData = useMemo(() => {
    return coveredCallsData.filter(option => {
      if (option.annualizedReturn < ccFilters.minAnnualizedReturn) return false;
      if (option.openInterest < ccFilters.minOpenInterest) return false;
      if (option.downProtection < ccFilters.minProtection) return false;
      if (option.daysToExpiry > ccFilters.maxDaysToExpiry) return false;
      if (option.daysToExpiry < ccFilters.minDaysToExpiry) return false;
      if (option.stockPrice > ccFilters.maxStockPrice) return false;
      return true;
    });
  }, [coveredCallsData, ccFilters]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: '2-digit' 
    });
  };

  const getReturnColor = (value: number) => {
    if (value >= 40) return 'text-chart-1 font-bold';
    if (value >= 25) return 'text-primary font-semibold';
    if (value >= 15) return 'text-foreground';
    return 'text-muted-foreground';
  };

  const applyLeapsPreset = (preset: LeapsFilterPreset) => {
    setLeapsFilters(prev => ({
      ...prev,
      optionType: preset.filters.optionType ?? prev.optionType,
      minDelta: preset.filters.minDelta ?? prev.minDelta,
      maxDelta: preset.filters.maxDelta ?? prev.maxDelta,
      minOpenInterest: preset.filters.minOpenInterest ?? prev.minOpenInterest,
      minAnnualizedReturn: preset.filters.minAnnualizedReturn ?? prev.minAnnualizedReturn,
      maxIV: preset.filters.maxIV ?? prev.maxIV
    }));
    setShowLeapsFilters(true);
    toast.success(`Applied "${preset.name}" preset`);
  };

  const resetLeapsFilters = () => {
    setLeapsFilters({
      optionType: 'all',
      minDelta: 0,
      maxDelta: 1,
      minOpenInterest: 0,
      minAnnualizedReturn: 0,
      maxIV: 200
    });
  };

  const applyCCPreset = (preset: CoveredCallFilterPreset) => {
    setCCFilters(prev => ({
      ...prev,
      minAnnualizedReturn: preset.filters.minAnnualizedReturn ?? prev.minAnnualizedReturn,
      minOpenInterest: preset.filters.minOpenInterest ?? prev.minOpenInterest,
      minProtection: preset.filters.minProtection ?? prev.minProtection,
      maxDaysToExpiry: preset.filters.maxDaysToExpiry ?? prev.maxDaysToExpiry,
      minDaysToExpiry: preset.filters.minDaysToExpiry ?? prev.minDaysToExpiry,
      maxStockPrice: preset.filters.maxStockPrice ?? prev.maxStockPrice
    }));
    setShowCCFilters(true);
    toast.success(`Applied "${preset.name}" preset`);
  };

  const resetCCFilters = () => {
    setCCFilters({
      minAnnualizedReturn: 0,
      minOpenInterest: 0,
      minProtection: 0,
      maxDaysToExpiry: 45,
      minDaysToExpiry: 14,
      maxStockPrice: 20
    });
  };

  return (
    <PageLayout title="Options Scanner">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="leaps" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              LEAPS Scanner
            </TabsTrigger>
            <TabsTrigger value="covered_calls" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Covered Calls &lt;$20
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3">
            <Badge variant={isLiveData ? 'default' : 'secondary'} className="text-xs">
              {isLiveData ? '🔴 Live' : '📦 Sample'}
            </Badge>
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button 
              onClick={() => scanOptions(activeTab as 'leaps' | 'covered_calls')} 
              disabled={scanning}
              size="sm"
            >
              {scanning ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {scanning ? 'Scanning...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* LEAPS Scanner Tab */}
        <TabsContent value="leaps" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  What are LEAPS?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Long-Term Equity Anticipation Securities (LEAPS) are options with expiration dates 
                  9+ months out. They provide leverage with less time decay pressure than short-term options.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-chart-1" />
                  LEAPS Calls
                </h3>
                <p className="text-sm text-muted-foreground">
                  Buy deep ITM calls as stock replacement. Target delta of 0.70+ for stock-like movement 
                  at a fraction of the cost.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  LEAPS Puts
                </h3>
                <p className="text-sm text-muted-foreground">
                  Sell cash-secured puts to accumulate shares at lower prices while collecting premium. 
                  Target strikes you'd want to own.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Strategy Presets */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Quick Presets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {leapsPresets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-1.5 px-3"
                    onClick={() => applyLeapsPreset(preset)}
                    title={preset.description}
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* LEAPS Filters */}
          <Collapsible open={showLeapsFilters} onOpenChange={setShowLeapsFilters}>
            <Card>
              <CardHeader className="pb-2">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filters
                      {(leapsFilters.optionType !== 'all' || leapsFilters.minDelta > 0 || leapsFilters.maxDelta < 1 || leapsFilters.minOpenInterest > 0 || leapsFilters.minAnnualizedReturn > 0 || leapsFilters.maxIV < 200) && (
                        <Badge variant="secondary" className="ml-2">Active</Badge>
                      )}
                    </CardTitle>
                    {showLeapsFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="space-y-2">
                      <Label>Option Type</Label>
                      <Select 
                        value={leapsFilters.optionType} 
                        onValueChange={(value: 'all' | 'call' | 'put') => 
                          setLeapsFilters(prev => ({ ...prev, optionType: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="call">Calls Only</SelectItem>
                          <SelectItem value="put">Puts Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Min Delta: {leapsFilters.minDelta.toFixed(2)}</Label>
                      <Slider
                        value={[leapsFilters.minDelta]}
                        onValueChange={([value]) => setLeapsFilters(prev => ({ ...prev, minDelta: value }))}
                        min={0}
                        max={1}
                        step={0.05}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Max Delta: {leapsFilters.maxDelta.toFixed(2)}</Label>
                      <Slider
                        value={[leapsFilters.maxDelta]}
                        onValueChange={([value]) => setLeapsFilters(prev => ({ ...prev, maxDelta: value }))}
                        min={0}
                        max={1}
                        step={0.05}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Min Open Interest</Label>
                      <Input
                        type="number"
                        value={leapsFilters.minOpenInterest}
                        onChange={(e) => setLeapsFilters(prev => ({ ...prev, minOpenInterest: Number(e.target.value) }))}
                        min={0}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Min Ann. Return %</Label>
                      <Input
                        type="number"
                        value={leapsFilters.minAnnualizedReturn}
                        onChange={(e) => setLeapsFilters(prev => ({ ...prev, minAnnualizedReturn: Number(e.target.value) }))}
                        min={0}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Max IV %</Label>
                      <Input
                        type="number"
                        value={leapsFilters.maxIV}
                        onChange={(e) => setLeapsFilters(prev => ({ ...prev, maxIV: Number(e.target.value) }))}
                        min={0}
                        max={500}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {filteredLeapsData.length} of {leapsData.length} results
                    </p>
                    <Button variant="outline" size="sm" onClick={resetLeapsFilters}>
                      Reset Filters
                    </Button>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                LEAPS Opportunities
              </CardTitle>
              <CardDescription>
                Options expiring in 9+ months • Sorted by annualized return potential
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredLeapsData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {scanning ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Scanning for LEAPS opportunities...
                    </div>
                  ) : leapsData.length > 0 ? (
                    'No results match your filters. Try adjusting the filter criteria.'
                  ) : (
                    'No LEAPS data available. Click Refresh to scan.'
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Strike</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Bid/Ask</TableHead>
                        <TableHead>IV</TableHead>
                        <TableHead>Delta</TableHead>
                        <TableHead>OI</TableHead>
                        <TableHead>Breakeven</TableHead>
                        <TableHead>Ann. Return</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeapsData.slice(0, 30).map((option, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => addToWatchlist(option.symbol)}
                              disabled={addingToWatchlist === option.symbol}
                            >
                              {addingToWatchlist === option.symbol ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : watchlist.includes(option.symbol) ? (
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-bold">{option.symbol}</TableCell>
                          <TableCell>
                            <Badge className={option.optionType === 'call' ? 'bg-chart-1/20 text-chart-1' : 'bg-destructive/20 text-destructive'}>
                              {option.optionType.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>${option.stockPrice.toFixed(2)}</TableCell>
                          <TableCell>${option.strike.toFixed(0)}</TableCell>
                          <TableCell>{formatDate(option.expiration)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{option.daysToExpiry}d</Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            ${option.bid.toFixed(2)} / ${option.ask.toFixed(2)}
                          </TableCell>
                          <TableCell>{option.impliedVolatility.toFixed(1)}%</TableCell>
                          <TableCell className={option.delta > 0 ? 'text-chart-1' : 'text-destructive'}>
                            {option.delta.toFixed(2)}
                          </TableCell>
                          <TableCell>{option.openInterest.toLocaleString()}</TableCell>
                          <TableCell>${option.breakeven.toFixed(2)}</TableCell>
                          <TableCell className={getReturnColor(option.annualizedReturn)}>
                            {option.annualizedReturn.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Covered Calls Tab */}
        <TabsContent value="covered_calls" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Covered Call Strategy
                </h3>
                <p className="text-sm text-muted-foreground">
                  Own 100 shares of stock and sell a call against it. Collect premium for income while 
                  providing downside protection. Max profit is capped at strike price.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-chart-1" />
                  Stocks Under $20
                </h3>
                <p className="text-sm text-muted-foreground">
                  Lower-priced stocks make covered calls more accessible. 100 shares costs less than $2,000, 
                  making it easier to start generating income.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-warning" />
                  Key Metrics
                </h3>
                <p className="text-sm text-muted-foreground">
                  Look for high annualized returns, reasonable downside protection, and 
                  sufficient open interest for liquidity.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Covered Call Strategy Presets */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Quick Presets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {coveredCallPresets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-1.5 px-3"
                    onClick={() => applyCCPreset(preset)}
                    title={preset.description}
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Covered Call Filters */}
          <Collapsible open={showCCFilters} onOpenChange={setShowCCFilters}>
            <Card>
              <CardHeader className="pb-2">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filters
                      {(ccFilters.minAnnualizedReturn > 0 || ccFilters.minOpenInterest > 0 || ccFilters.minProtection > 0 || ccFilters.maxDaysToExpiry !== 45 || ccFilters.minDaysToExpiry !== 14 || ccFilters.maxStockPrice !== 20) && (
                        <Badge variant="secondary" className="ml-2">Active</Badge>
                      )}
                    </CardTitle>
                    {showCCFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="space-y-2">
                      <Label>Min Ann. Return %</Label>
                      <Input
                        type="number"
                        value={ccFilters.minAnnualizedReturn}
                        onChange={(e) => setCCFilters(prev => ({ ...prev, minAnnualizedReturn: Number(e.target.value) }))}
                        min={0}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Min Open Interest</Label>
                      <Input
                        type="number"
                        value={ccFilters.minOpenInterest}
                        onChange={(e) => setCCFilters(prev => ({ ...prev, minOpenInterest: Number(e.target.value) }))}
                        min={0}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Min Protection %</Label>
                      <Input
                        type="number"
                        value={ccFilters.minProtection}
                        onChange={(e) => setCCFilters(prev => ({ ...prev, minProtection: Number(e.target.value) }))}
                        min={0}
                        step={0.5}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Min Days to Expiry</Label>
                      <Input
                        type="number"
                        value={ccFilters.minDaysToExpiry}
                        onChange={(e) => setCCFilters(prev => ({ ...prev, minDaysToExpiry: Number(e.target.value) }))}
                        min={1}
                        max={ccFilters.maxDaysToExpiry}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Max Days to Expiry</Label>
                      <Input
                        type="number"
                        value={ccFilters.maxDaysToExpiry}
                        onChange={(e) => setCCFilters(prev => ({ ...prev, maxDaysToExpiry: Number(e.target.value) }))}
                        min={ccFilters.minDaysToExpiry}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Max Stock Price $</Label>
                      <Input
                        type="number"
                        value={ccFilters.maxStockPrice}
                        onChange={(e) => setCCFilters(prev => ({ ...prev, maxStockPrice: Number(e.target.value) }))}
                        min={1}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {filteredCCData.length} of {coveredCallsData.length} results
                    </p>
                    <Button variant="outline" size="sm" onClick={resetCCFilters}>
                      Reset Filters
                    </Button>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Covered Call Opportunities (Stocks &lt;${ccFilters.maxStockPrice})
              </CardTitle>
              <CardDescription>
                OTM calls on affordable stocks • {ccFilters.minDaysToExpiry}-{ccFilters.maxDaysToExpiry} days to expiration • Sorted by annualized return
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredCCData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {scanning ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Scanning for covered call opportunities...
                    </div>
                  ) : coveredCallsData.length > 0 ? (
                    'No results match your filters. Try adjusting the filter criteria.'
                  ) : (
                    'No covered call data available. Click Refresh to scan.'
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Stock Price</TableHead>
                        <TableHead>Strike</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Premium</TableHead>
                        <TableHead>Premium %</TableHead>
                        <TableHead>Ann. Return</TableHead>
                        <TableHead>Protection</TableHead>
                        <TableHead>Max Profit</TableHead>
                        <TableHead>OI</TableHead>
                        <TableHead>IV</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCCData.slice(0, 30).map((option, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => addToWatchlist(option.symbol)}
                              disabled={addingToWatchlist === option.symbol}
                            >
                              {addingToWatchlist === option.symbol ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : watchlist.includes(option.symbol) ? (
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-bold">{option.symbol}</TableCell>
                          <TableCell>${option.stockPrice.toFixed(2)}</TableCell>
                          <TableCell>${option.strike.toFixed(2)}</TableCell>
                          <TableCell>{formatDate(option.expiration)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{option.daysToExpiry}d</Badge>
                          </TableCell>
                          <TableCell className="text-chart-1 font-semibold">
                            ${option.premium.toFixed(2)}
                          </TableCell>
                          <TableCell>{option.premiumPercent.toFixed(1)}%</TableCell>
                          <TableCell className={getReturnColor(option.annualizedReturn)}>
                            {option.annualizedReturn.toFixed(0)}%
                          </TableCell>
                          <TableCell className="text-primary">
                            {option.downProtection.toFixed(1)}%
                          </TableCell>
                          <TableCell>
                            ${option.maxProfit.toFixed(2)} ({option.maxProfitPercent.toFixed(1)}%)
                          </TableCell>
                          <TableCell>{option.openInterest.toLocaleString()}</TableCell>
                          <TableCell>{option.impliedVolatility.toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cost Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Cost Calculator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">$5 Stock</p>
                  <p className="font-bold">100 shares = $500</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">$10 Stock</p>
                  <p className="font-bold">100 shares = $1,000</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">$15 Stock</p>
                  <p className="font-bold">100 shares = $1,500</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">$20 Stock</p>
                  <p className="font-bold">100 shares = $2,000</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default MarketScanner;
