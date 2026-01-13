import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Minus, Building, DollarSign, BarChart2 } from 'lucide-react';

interface FundamentalsData {
  pe?: number;
  forwardPe?: number;
  ps?: number;
  pb?: number;
  roe?: number;
  roa?: number;
  revenueGrowth?: number;
  epsGrowth?: number;
  profitMargin?: number;
  debtToEquity?: number;
  currentRatio?: number;
  marketCap?: number;
}

interface FundamentalAnalysisProps {
  symbol: string;
  fundamentals: FundamentalsData;
  sectorAvg?: Partial<FundamentalsData>;
}

export const FundamentalAnalysis: React.FC<FundamentalAnalysisProps> = ({
  symbol,
  fundamentals,
  sectorAvg = {}
}) => {
  // Default sector averages if not provided
  const defaults: FundamentalsData = {
    pe: 22,
    forwardPe: 18,
    ps: 3.5,
    pb: 3.2,
    roe: 15,
    roa: 8,
    revenueGrowth: 10,
    epsGrowth: 12,
    profitMargin: 12,
    debtToEquity: 1.2,
    currentRatio: 1.5,
    ...sectorAvg
  };

  const compareValue = (value: number | undefined, benchmark: number | undefined, higherIsBetter: boolean = true) => {
    if (!value || !benchmark) return { color: 'text-muted-foreground', icon: Minus, label: 'N/A' };
    const diff = ((value - benchmark) / benchmark) * 100;
    const isGood = higherIsBetter ? diff > 0 : diff < 0;
    
    if (Math.abs(diff) < 10) return { color: 'text-yellow-500', icon: Minus, label: 'Average' };
    return isGood 
      ? { color: 'text-green-500', icon: TrendingUp, label: 'Above Avg' }
      : { color: 'text-red-500', icon: TrendingDown, label: 'Below Avg' };
  };

  const formatValue = (value: number | undefined, suffix: string = '', decimals: number = 2) => {
    if (value === undefined || value === null) return 'N/A';
    return `${value.toFixed(decimals)}${suffix}`;
  };

  const formatMarketCap = (value: number | undefined) => {
    if (!value) return 'N/A';
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toFixed(0)}`;
  };

  const metrics = [
    { 
      label: 'P/E Ratio', 
      value: fundamentals.pe, 
      benchmark: defaults.pe, 
      format: (v: number) => v.toFixed(2),
      higherIsBetter: false,
      description: 'Price to Earnings - lower may indicate undervaluation'
    },
    { 
      label: 'Forward P/E', 
      value: fundamentals.forwardPe, 
      benchmark: defaults.forwardPe, 
      format: (v: number) => v.toFixed(2),
      higherIsBetter: false,
      description: 'Expected P/E based on future earnings'
    },
    { 
      label: 'P/S Ratio', 
      value: fundamentals.ps, 
      benchmark: defaults.ps, 
      format: (v: number) => v.toFixed(2),
      higherIsBetter: false,
      description: 'Price to Sales'
    },
    { 
      label: 'P/B Ratio', 
      value: fundamentals.pb, 
      benchmark: defaults.pb, 
      format: (v: number) => v.toFixed(2),
      higherIsBetter: false,
      description: 'Price to Book Value'
    },
    { 
      label: 'ROE', 
      value: fundamentals.roe, 
      benchmark: defaults.roe, 
      format: (v: number) => `${v.toFixed(1)}%`,
      higherIsBetter: true,
      description: 'Return on Equity'
    },
    { 
      label: 'ROA', 
      value: fundamentals.roa, 
      benchmark: defaults.roa, 
      format: (v: number) => `${v.toFixed(1)}%`,
      higherIsBetter: true,
      description: 'Return on Assets'
    },
    { 
      label: 'Revenue Growth (YoY)', 
      value: fundamentals.revenueGrowth, 
      benchmark: defaults.revenueGrowth, 
      format: (v: number) => `${v.toFixed(1)}%`,
      higherIsBetter: true,
      description: 'Year over year revenue growth'
    },
    { 
      label: 'EPS Growth', 
      value: fundamentals.epsGrowth, 
      benchmark: defaults.epsGrowth, 
      format: (v: number) => `${v.toFixed(1)}%`,
      higherIsBetter: true,
      description: 'Earnings per share growth'
    },
    { 
      label: 'Profit Margin', 
      value: fundamentals.profitMargin, 
      benchmark: defaults.profitMargin, 
      format: (v: number) => `${v.toFixed(1)}%`,
      higherIsBetter: true,
      description: 'Net profit margin'
    },
    { 
      label: 'Debt/Equity', 
      value: fundamentals.debtToEquity, 
      benchmark: defaults.debtToEquity, 
      format: (v: number) => v.toFixed(2),
      higherIsBetter: false,
      description: 'Lower indicates less leverage'
    },
  ];

  // Calculate overall score
  const calculateScore = () => {
    let score = 0;
    let count = 0;
    
    metrics.forEach(m => {
      if (m.value !== undefined && m.benchmark !== undefined) {
        const diff = ((m.value - m.benchmark) / m.benchmark);
        const impact = m.higherIsBetter ? diff : -diff;
        score += impact > 0.1 ? 1 : impact < -0.1 ? -1 : 0;
        count++;
      }
    });
    
    if (count === 0) return 'N/A';
    const avg = score / count;
    if (avg > 0.3) return 'Strong';
    if (avg > 0) return 'Above Average';
    if (avg > -0.3) return 'Average';
    return 'Below Average';
  };

  const overallScore = calculateScore();
  const scoreColor = overallScore === 'Strong' ? 'bg-green-500' 
    : overallScore === 'Above Average' ? 'bg-green-400'
    : overallScore === 'Average' ? 'bg-yellow-500'
    : overallScore === 'Below Average' ? 'bg-red-500'
    : 'bg-muted';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Fundamental Analysis - {symbol}
            </CardTitle>
            <CardDescription>Valuation metrics vs sector average</CardDescription>
          </div>
          <Badge className={scoreColor}>
            {overallScore}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border bg-muted/50">
            <p className="text-xs text-muted-foreground">Market Cap</p>
            <p className="text-lg font-bold">{formatMarketCap(fundamentals.marketCap)}</p>
          </div>
          <div className="p-3 rounded-lg border bg-muted/50">
            <p className="text-xs text-muted-foreground">P/E Ratio</p>
            <p className="text-lg font-bold">{formatValue(fundamentals.pe)}</p>
          </div>
          <div className="p-3 rounded-lg border bg-muted/50">
            <p className="text-xs text-muted-foreground">ROE</p>
            <p className="text-lg font-bold">{formatValue(fundamentals.roe, '%', 1)}</p>
          </div>
          <div className="p-3 rounded-lg border bg-muted/50">
            <p className="text-xs text-muted-foreground">Revenue Growth</p>
            <p className="text-lg font-bold">{formatValue(fundamentals.revenueGrowth, '%', 1)}</p>
          </div>
        </div>

        {/* Detailed Metrics Table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Sector Avg</TableHead>
                <TableHead className="text-right">Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map((metric) => {
                const comparison = compareValue(metric.value, metric.benchmark, metric.higherIsBetter);
                return (
                  <TableRow key={metric.label}>
                    <TableCell className="font-medium">
                      {metric.label}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {metric.value !== undefined ? metric.format(metric.value) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {metric.benchmark !== undefined ? metric.format(metric.benchmark) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`flex items-center justify-end gap-1 ${comparison.color}`}>
                        <comparison.icon className="h-3 w-3" />
                        <span className="text-xs">{comparison.label}</span>
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <p className="text-xs text-muted-foreground">
          * Comparisons are made against sector averages. Green indicates favorable metrics, red indicates areas of concern.
        </p>
      </CardContent>
    </Card>
  );
};
