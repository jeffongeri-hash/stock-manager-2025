import React, { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calculator, TrendingUp, TrendingDown, DollarSign, 
  Clock, Target, AlertTriangle, CheckCircle2, Info,
  ArrowUpRight, ArrowDownRight, Scale, Search, Loader2
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GreeksData {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

interface CalculationResult {
  stockCost: number;
  optionCost: number;
  intrinsicValue: number;
  timeValue: number;
  breakeven: number;
  leverage: number;
  maxLoss: {
    stock: number;
    option: number;
  };
  profitAtTarget: {
    stock: number;
    option: number;
  };
  roi: {
    stock: number;
    option: number;
  };
  recommendation: 'stock' | 'option' | 'neutral';
  reasons: string[];
}

// Standard normal CDF approximation
const normCDF = (x: number): number => {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
};

// Black-Scholes Greeks calculation
const calculateGreeks = (
  stockPrice: number,
  strikePrice: number,
  timeToExpiry: number, // in years
  riskFreeRate: number, // decimal
  volatility: number, // decimal
  isCall: boolean
): GreeksData => {
  const S = stockPrice;
  const K = strikePrice;
  const T = timeToExpiry;
  const r = riskFreeRate;
  const sigma = volatility;

  // Guard against invalid inputs that would cause NaN/Infinity
  if (T <= 0 || S <= 0 || K <= 0 || sigma <= 0 || !isFinite(S) || !isFinite(K) || !isFinite(T) || !isFinite(sigma)) {
    return { delta: isCall ? 1 : -1, gamma: 0, theta: 0, vega: 0, rho: 0 };
  }

  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;

  // Guard against NaN from calculations
  if (!isFinite(d1) || !isFinite(d2)) {
    return { delta: isCall ? 1 : -1, gamma: 0, theta: 0, vega: 0, rho: 0 };
  }

  const Nd1 = normCDF(d1);
  const Nd2 = normCDF(d2);
  const NNd1 = normCDF(-d1);
  const NNd2 = normCDF(-d2);

  // PDF of standard normal
  const nprime = Math.exp(-d1 * d1 / 2) / Math.sqrt(2 * Math.PI);

  // Delta
  const delta = isCall ? Nd1 : Nd1 - 1;

  // Gamma - guard against division by zero
  const gammaDenom = S * sigma * sqrtT;
  const gamma = gammaDenom > 0 ? nprime / gammaDenom : 0;

  // Theta (per day)
  const expRT = Math.exp(-r * T);
  const thetaCall = (-(S * nprime * sigma) / (2 * sqrtT) - r * K * expRT * Nd2) / 365;
  const thetaPut = (-(S * nprime * sigma) / (2 * sqrtT) + r * K * expRT * NNd2) / 365;
  const theta = isCall ? thetaCall : thetaPut;

  // Vega (per 1% change in volatility)
  const vega = (S * nprime * sqrtT) / 100;

  // Rho (per 1% change in interest rate)
  const rho = isCall 
    ? (K * T * expRT * Nd2) / 100 
    : (-K * T * expRT * NNd2) / 100;

  // Final safety check - return zeros if any result is NaN
  if (!isFinite(delta) || !isFinite(gamma) || !isFinite(theta) || !isFinite(vega) || !isFinite(rho)) {
    return { delta: isCall ? 1 : -1, gamma: 0, theta: 0, vega: 0, rho: 0 };
  }

  return { delta, gamma, theta, vega, rho };
};

export const ITMOptionCalculator: React.FC = () => {
  // Ticker search states
  const [tickerSymbol, setTickerSymbol] = useState("");
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [stockName, setStockName] = useState<string | null>(null);
  const [lastFetchedSymbol, setLastFetchedSymbol] = useState<string | null>(null);

  // Input states
  const [stockPrice, setStockPrice] = useState(150);
  const [strikePrice, setStrikePrice] = useState(140);
  const [optionPremium, setOptionPremium] = useState(15);
  const [daysToExpiry, setDaysToExpiry] = useState(45);
  const [contracts, setContracts] = useState(1);
  const [targetPrice, setTargetPrice] = useState(165);
  const [volatility, setVolatility] = useState(30);
  const [riskFreeRate, setRiskFreeRate] = useState(5);
  const [optionType, setOptionType] = useState<'call' | 'put'>('call');

  // Fetch stock price by ticker
  const fetchStockPrice = useCallback(async () => {
    if (!tickerSymbol.trim()) {
      toast.error("Please enter a ticker symbol");
      return;
    }

    const symbol = tickerSymbol.trim().toUpperCase();
    setIsLoadingPrice(true);

    try {
      const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
        body: { symbols: [symbol] }
      });

      if (error) throw error;

      if (data?.stocks && data.stocks.length > 0) {
        const stock = data.stocks[0];
        if (stock.price && stock.price > 0) {
          setStockPrice(parseFloat(stock.price.toFixed(2)));
          setStockName(stock.name || symbol);
          setLastFetchedSymbol(symbol);
          // Set reasonable defaults based on price
          setStrikePrice(Math.round(stock.price * 0.95 * 2) / 2); // 5% ITM, rounded to 0.50
          setTargetPrice(Math.round(stock.price * 1.1 * 2) / 2); // 10% gain target
          toast.success(`Loaded ${symbol} at $${stock.price.toFixed(2)}`);
        } else {
          toast.error(`No price data available for ${symbol}`);
        }
      } else {
        toast.error(`Could not find stock: ${symbol}`);
      }
    } catch (error) {
      console.error('Error fetching stock price:', error);
      toast.error("Failed to fetch stock price. Please try again.");
    } finally {
      setIsLoadingPrice(false);
    }
  }, [tickerSymbol]);

  const handleTickerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      fetchStockPrice();
    }
  };

  const isITM = optionType === 'call' 
    ? stockPrice > strikePrice 
    : stockPrice < strikePrice;

  const greeks = useMemo(() => {
    return calculateGreeks(
      stockPrice,
      strikePrice,
      daysToExpiry / 365,
      riskFreeRate / 100,
      volatility / 100,
      optionType === 'call'
    );
  }, [stockPrice, strikePrice, daysToExpiry, riskFreeRate, volatility, optionType]);

  const calculation = useMemo((): CalculationResult => {
    const sharesEquivalent = contracts * 100;
    const stockCost = stockPrice * sharesEquivalent;
    const optionCost = optionPremium * contracts * 100;

    // Intrinsic value
    let intrinsicValue: number;
    if (optionType === 'call') {
      intrinsicValue = Math.max(0, stockPrice - strikePrice);
    } else {
      intrinsicValue = Math.max(0, strikePrice - stockPrice);
    }
    const timeValue = optionPremium - intrinsicValue;

    // Breakeven
    const breakeven = optionType === 'call' 
      ? strikePrice + optionPremium 
      : strikePrice - optionPremium;

    // Leverage
    const leverage = stockCost / optionCost;

    // Max loss
    const maxLossStock = stockCost; // Technically stock to 0
    const maxLossOption = optionCost; // Premium paid

    // Profit at target
    let stockProfit: number;
    let optionProfit: number;

    if (optionType === 'call') {
      stockProfit = (targetPrice - stockPrice) * sharesEquivalent;
      const optionValueAtTarget = Math.max(0, targetPrice - strikePrice);
      optionProfit = (optionValueAtTarget * sharesEquivalent) - optionCost;
    } else {
      stockProfit = (stockPrice - targetPrice) * sharesEquivalent;
      const optionValueAtTarget = Math.max(0, strikePrice - targetPrice);
      optionProfit = (optionValueAtTarget * sharesEquivalent) - optionCost;
    }

    // ROI
    const stockROI = (stockProfit / stockCost) * 100;
    const optionROI = (optionProfit / optionCost) * 100;

    // Recommendation logic
    const reasons: string[] = [];
    let recommendation: 'stock' | 'option' | 'neutral' = 'neutral';

    // Time decay consideration
    if (daysToExpiry < 21) {
      reasons.push("⚠️ Short time to expiry - theta decay accelerates");
      recommendation = 'stock';
    }

    // Deep ITM options act like stock with leverage
    if (isITM && intrinsicValue / optionPremium > 0.8) {
      reasons.push("✅ Deep ITM - option behaves like leveraged stock");
      recommendation = 'option';
    }

    // High time value = expensive option
    if (timeValue / optionPremium > 0.3) {
      reasons.push("⚠️ High time value - paying significant premium for time");
    }

    // Leverage consideration
    if (leverage > 5) {
      reasons.push(`✅ High leverage (${leverage.toFixed(1)}x) - efficient capital use`);
      if (recommendation !== 'stock') recommendation = 'option';
    }

    // Delta consideration
    if (Math.abs(greeks.delta) > 0.7) {
      reasons.push(`✅ High delta (${(Math.abs(greeks.delta) * 100).toFixed(0)}%) - moves closely with stock`);
    } else if (Math.abs(greeks.delta) < 0.4) {
      reasons.push(`⚠️ Low delta (${(Math.abs(greeks.delta) * 100).toFixed(0)}%) - less responsive to stock movement`);
    }

    // ROI comparison
    if (optionROI > stockROI * 2) {
      reasons.push("✅ Option ROI significantly higher at target price");
      if (recommendation === 'neutral') recommendation = 'option';
    } else if (stockROI > optionROI) {
      reasons.push("⚠️ Stock ROI higher - consider stock purchase");
      recommendation = 'stock';
    }

    // Volatility consideration
    if (volatility > 40) {
      reasons.push("⚠️ High volatility - options more expensive");
    }

    return {
      stockCost,
      optionCost,
      intrinsicValue,
      timeValue,
      breakeven,
      leverage,
      maxLoss: { stock: maxLossStock, option: maxLossOption },
      profitAtTarget: { stock: stockProfit, option: optionProfit },
      roi: { stock: stockROI, option: optionROI },
      recommendation,
      reasons,
    };
  }, [stockPrice, strikePrice, optionPremium, daysToExpiry, contracts, targetPrice, optionType, greeks, isITM, volatility]);

  // Profit/Loss chart data
  const profitData = useMemo(() => {
    const data = [];
    const minPrice = Math.max(0, stockPrice * 0.7);
    const maxPrice = stockPrice * 1.3;
    const sharesEquivalent = contracts * 100;

    for (let price = minPrice; price <= maxPrice; price += (maxPrice - minPrice) / 50) {
      let optionValue: number;
      if (optionType === 'call') {
        optionValue = Math.max(0, price - strikePrice);
      } else {
        optionValue = Math.max(0, strikePrice - price);
      }

      const stockPL = optionType === 'call' 
        ? (price - stockPrice) * sharesEquivalent 
        : (stockPrice - price) * sharesEquivalent;
      const optionPL = (optionValue * sharesEquivalent) - calculation.optionCost;

      data.push({
        price: price.toFixed(2),
        stockPL: Math.round(stockPL),
        optionPL: Math.round(optionPL),
      });
    }
    return data;
  }, [stockPrice, strikePrice, optionPremium, contracts, optionType, calculation.optionCost]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          ITM Option vs Stock Calculator
        </CardTitle>
        <CardDescription>
          Compare buying in-the-money options versus buying stock outright
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="calculator" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="greeks">Greeks Analysis</TabsTrigger>
            <TabsTrigger value="chart">P/L Chart</TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Input Section */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">Option Details</h3>
                
                {/* Ticker Symbol Search */}
                <div className="space-y-2">
                  <Label>Search by Ticker Symbol</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="text" 
                        value={tickerSymbol}
                        onChange={(e) => setTickerSymbol(e.target.value.toUpperCase())}
                        onKeyDown={handleTickerKeyDown}
                        placeholder="e.g. AAPL, TSLA, MSFT"
                        className="pl-9"
                        maxLength={10}
                      />
                    </div>
                    <Button 
                      onClick={fetchStockPrice} 
                      disabled={isLoadingPrice || !tickerSymbol.trim()}
                      size="default"
                    >
                      {isLoadingPrice ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Get Price"
                      )}
                    </Button>
                  </div>
                  {lastFetchedSymbol && stockName && (
                    <p className="text-xs text-muted-foreground">
                      Loaded: <span className="font-medium text-foreground">{stockName}</span> ({lastFetchedSymbol})
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Option Type</Label>
                    <Select value={optionType} onValueChange={(v: 'call' | 'put') => setOptionType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="call">Call Option</SelectItem>
                        <SelectItem value="put">Put Option</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Contracts</Label>
                    <Input 
                      type="number" 
                      value={contracts} 
                      onChange={(e) => setContracts(Number(e.target.value))}
                      min={1}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Current Stock Price</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">$</span>
                      <Input 
                        type="number" 
                        value={stockPrice} 
                        onChange={(e) => setStockPrice(Number(e.target.value))}
                        step={0.01}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Strike Price</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">$</span>
                      <Input 
                        type="number" 
                        value={strikePrice} 
                        onChange={(e) => setStrikePrice(Number(e.target.value))}
                        step={0.5}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Option Premium</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">$</span>
                      <Input 
                        type="number" 
                        value={optionPremium} 
                        onChange={(e) => setOptionPremium(Number(e.target.value))}
                        step={0.05}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Days to Expiry</Label>
                    <Input 
                      type="number" 
                      value={daysToExpiry} 
                      onChange={(e) => setDaysToExpiry(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Target Price (for comparison)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">$</span>
                    <Input 
                      type="number" 
                      value={targetPrice} 
                      onChange={(e) => setTargetPrice(Number(e.target.value))}
                      step={0.5}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Implied Volatility: {volatility}%</Label>
                  <Slider
                    value={[volatility]}
                    onValueChange={(v) => setVolatility(v[0])}
                    min={10}
                    max={100}
                    step={1}
                  />
                </div>

                {/* ITM Status */}
                <div className={`p-3 rounded-lg border ${isITM ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                  <div className="flex items-center gap-2">
                    {isITM ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className="font-medium">
                      {isITM ? 'In The Money' : 'Out of The Money'}
                    </span>
                    <Badge variant={isITM ? 'default' : 'secondary'}>
                      {optionType === 'call' ? 'CALL' : 'PUT'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Results Section */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">Comparison Results</h3>

                {/* Value Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Intrinsic Value</p>
                    <p className="text-lg font-bold">{formatCurrency(calculation.intrinsicValue)}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Time Value</p>
                    <p className="text-lg font-bold">{formatCurrency(calculation.timeValue)}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Breakeven</p>
                    <p className="text-lg font-bold">{formatCurrency(calculation.breakeven)}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Leverage</p>
                    <p className="text-lg font-bold">{calculation.leverage.toFixed(1)}x</p>
                  </div>
                </div>

                {/* Cost Comparison */}
                <div className="p-4 border rounded-lg space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Capital Required
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Stock ({contracts * 100} shares)</p>
                      <p className="text-xl font-bold">{formatCurrency(calculation.stockCost)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Options ({contracts} contracts)</p>
                      <p className="text-xl font-bold text-primary">{formatCurrency(calculation.optionCost)}</p>
                    </div>
                  </div>
                </div>

                {/* Profit at Target */}
                <div className="p-4 border rounded-lg space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Profit at ${targetPrice}
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Stock Profit</p>
                      <p className={`text-xl font-bold ${calculation.profitAtTarget.stock >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(calculation.profitAtTarget.stock)}
                      </p>
                      <p className="text-sm text-muted-foreground">{formatPercent(calculation.roi.stock)} ROI</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Option Profit</p>
                      <p className={`text-xl font-bold ${calculation.profitAtTarget.option >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(calculation.profitAtTarget.option)}
                      </p>
                      <p className="text-sm text-muted-foreground">{formatPercent(calculation.roi.option)} ROI</p>
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                <div className={`p-4 rounded-lg border-2 ${
                  calculation.recommendation === 'option' 
                    ? 'bg-primary/10 border-primary/50' 
                    : calculation.recommendation === 'stock'
                      ? 'bg-blue-500/10 border-blue-500/50'
                      : 'bg-muted border-muted-foreground/30'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Scale className="h-5 w-5" />
                    <span className="font-medium">
                      Recommendation: {calculation.recommendation === 'option' 
                        ? 'Consider ITM Option' 
                        : calculation.recommendation === 'stock'
                          ? 'Consider Stock'
                          : 'Evaluate Both'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {calculation.reasons.map((reason, i) => (
                      <p key={i} className="text-sm text-muted-foreground">{reason}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="greeks" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Delta (Δ)</p>
                    <p className="text-2xl font-bold">{(greeks.delta * 100).toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Price sensitivity
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Gamma (Γ)</p>
                    <p className="text-2xl font-bold">{greeks.gamma.toFixed(4)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Delta change rate
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Theta (Θ)</p>
                    <p className="text-2xl font-bold text-red-500">{formatCurrency(greeks.theta * 100 * contracts)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Daily decay
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Vega (ν)</p>
                    <p className="text-2xl font-bold">${(greeks.vega * contracts).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Per 1% IV change
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Rho (ρ)</p>
                    <p className="text-2xl font-bold">${(greeks.rho * contracts).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Per 1% rate change
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Greeks Interpretation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Delta Analysis</h4>
                    <p className="text-sm text-muted-foreground">
                      {Math.abs(greeks.delta) > 0.7 
                        ? `High delta (${(Math.abs(greeks.delta) * 100).toFixed(0)}%) - This deep ITM option moves nearly dollar-for-dollar with the stock. Great for stock replacement strategy.`
                        : Math.abs(greeks.delta) > 0.4
                          ? `Moderate delta (${(Math.abs(greeks.delta) * 100).toFixed(0)}%) - Option moves about ${(Math.abs(greeks.delta) * 100).toFixed(0)} cents for every $1 stock move.`
                          : `Low delta (${(Math.abs(greeks.delta) * 100).toFixed(0)}%) - This option has limited stock price tracking. Consider a deeper ITM strike.`
                      }
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Time Decay Impact</h4>
                    <p className="text-sm text-muted-foreground">
                      You're losing approximately {formatCurrency(Math.abs(greeks.theta * 100 * contracts))} per day to theta decay.
                      {daysToExpiry < 21 
                        ? " ⚠️ Decay accelerates in the final 3 weeks!"
                        : " Decay is manageable with this time to expiry."
                      }
                    </p>
                  </div>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time Value Analysis
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Of your ${optionPremium} premium, ${calculation.intrinsicValue.toFixed(2)} is intrinsic value 
                    and ${calculation.timeValue.toFixed(2)} is time value ({((calculation.timeValue / optionPremium) * 100).toFixed(0)}%).
                    {calculation.timeValue / optionPremium < 0.2 
                      ? " Excellent - minimal time premium being paid."
                      : calculation.timeValue / optionPremium < 0.35
                        ? " Reasonable time premium for this expiry."
                        : " Consider a deeper ITM option to reduce time value cost."
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chart" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profit/Loss Comparison</CardTitle>
                <CardDescription>Stock vs Option P/L across price range at expiration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={profitData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="price" 
                        tickFormatter={(v) => `$${v}`}
                        interval="preserveStartEnd"
                      />
                      <YAxis tickFormatter={(v) => `$${v.toLocaleString()}`} />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          formatCurrency(value),
                          name === 'stockPL' ? 'Stock P/L' : 'Option P/L'
                        ]}
                        labelFormatter={(label) => `Stock Price: $${label}`}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                      <ReferenceLine x={stockPrice.toFixed(2)} stroke="hsl(var(--primary))" strokeDasharray="5 5" label="Current" />
                      <ReferenceLine x={calculation.breakeven.toFixed(2)} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label="Breakeven" />
                      <Area
                        type="monotone"
                        dataKey="stockPL"
                        name="Stock P/L"
                        stroke="hsl(var(--chart-1))"
                        fill="hsl(var(--chart-1))"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="optionPL"
                        name="Option P/L"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Max Loss (Stock)</p>
                      <p className="text-lg font-bold">{formatCurrency(calculation.stockCost)}</p>
                      <p className="text-xs text-muted-foreground">If stock goes to $0</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <TrendingDown className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Max Loss (Option)</p>
                      <p className="text-lg font-bold">{formatCurrency(calculation.optionCost)}</p>
                      <p className="text-xs text-muted-foreground">Limited to premium</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Capital Saved</p>
                      <p className="text-lg font-bold">{formatCurrency(calculation.stockCost - calculation.optionCost)}</p>
                      <p className="text-xs text-muted-foreground">Using options vs stock</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ITMOptionCalculator;
