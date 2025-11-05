import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface FundamentalsData {
  symbol: string;
  name: string;
  industry: string;
  marketCap: number;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  metrics: any;
  peers: string[];
  spxChange: number;
  profile: any;
  rankings: {
    peRatio: { rank: number | string; total: number | string };
    roe: { rank: number | string; total: number | string };
    roa: { rank: number | string; total: number | string };
  };
}

interface CompanyComparisonProps {
  stock1: FundamentalsData;
  stock2: FundamentalsData;
}

export function CompanyComparison({ stock1, stock2 }: CompanyComparisonProps) {
  const formatNumber = (num: number) => {
    if (!num || isNaN(num)) return 'N/A';
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    return `$${num.toFixed(2)}`;
  };

  const getRatioValue = (stock: FundamentalsData, key: string) => {
    return stock?.metrics[key] || 'N/A';
  };

  const compareValue = (val1: any, val2: any, higherIsBetter = true) => {
    const num1 = parseFloat(val1);
    const num2 = parseFloat(val2);
    if (isNaN(num1) || isNaN(num2)) return null;
    
    if (higherIsBetter) {
      if (num1 > num2) return 'stock1';
      if (num2 > num1) return 'stock2';
    } else {
      if (num1 < num2) return 'stock1';
      if (num2 < num1) return 'stock2';
    }
    return null;
  };

  const renderCell = (value: any, winner: string | null, stockId: string) => {
    const isWinner = winner === stockId;
    return (
      <TableCell className={`font-medium ${isWinner ? 'bg-green-500/10' : ''}`}>
        {value}
      </TableCell>
    );
  };

  const rows = [
    {
      metric: 'Current Price',
      stock1: `$${stock1.currentPrice?.toFixed(2)}`,
      stock2: `$${stock2.currentPrice?.toFixed(2)}`,
      winner: null
    },
    {
      metric: 'Market Cap',
      stock1: formatNumber(stock1.marketCap),
      stock2: formatNumber(stock2.marketCap),
      winner: compareValue(stock1.marketCap, stock2.marketCap, true)
    },
    {
      metric: 'Price Change %',
      stock1: `${stock1.priceChangePercent?.toFixed(2)}%`,
      stock2: `${stock2.priceChangePercent?.toFixed(2)}%`,
      winner: compareValue(stock1.priceChangePercent, stock2.priceChangePercent, true)
    },
    {
      metric: 'P/E Ratio',
      stock1: getRatioValue(stock1, 'peBasicExclExtraTTM'),
      stock2: getRatioValue(stock2, 'peBasicExclExtraTTM'),
      winner: compareValue(getRatioValue(stock1, 'peBasicExclExtraTTM'), getRatioValue(stock2, 'peBasicExclExtraTTM'), false)
    },
    {
      metric: 'P/B Ratio',
      stock1: getRatioValue(stock1, 'pbAnnual'),
      stock2: getRatioValue(stock2, 'pbAnnual'),
      winner: compareValue(getRatioValue(stock1, 'pbAnnual'), getRatioValue(stock2, 'pbAnnual'), false)
    },
    {
      metric: 'P/S Ratio',
      stock1: getRatioValue(stock1, 'psAnnual'),
      stock2: getRatioValue(stock2, 'psAnnual'),
      winner: compareValue(getRatioValue(stock1, 'psAnnual'), getRatioValue(stock2, 'psAnnual'), false)
    },
    {
      metric: 'ROE %',
      stock1: `${getRatioValue(stock1, 'roeRfy')}%`,
      stock2: `${getRatioValue(stock2, 'roeRfy')}%`,
      winner: compareValue(getRatioValue(stock1, 'roeRfy'), getRatioValue(stock2, 'roeRfy'), true)
    },
    {
      metric: 'ROA %',
      stock1: `${getRatioValue(stock1, 'roaRfy')}%`,
      stock2: `${getRatioValue(stock2, 'roaRfy')}%`,
      winner: compareValue(getRatioValue(stock1, 'roaRfy'), getRatioValue(stock2, 'roaRfy'), true)
    },
    {
      metric: 'Net Margin %',
      stock1: `${getRatioValue(stock1, 'netProfitMarginAnnual')}%`,
      stock2: `${getRatioValue(stock2, 'netProfitMarginAnnual')}%`,
      winner: compareValue(getRatioValue(stock1, 'netProfitMarginAnnual'), getRatioValue(stock2, 'netProfitMarginAnnual'), true)
    },
    {
      metric: 'Current Ratio',
      stock1: getRatioValue(stock1, 'currentRatioAnnual'),
      stock2: getRatioValue(stock2, 'currentRatioAnnual'),
      winner: compareValue(getRatioValue(stock1, 'currentRatioAnnual'), getRatioValue(stock2, 'currentRatioAnnual'), true)
    },
    {
      metric: 'Quick Ratio',
      stock1: getRatioValue(stock1, 'quickRatioAnnual'),
      stock2: getRatioValue(stock2, 'quickRatioAnnual'),
      winner: compareValue(getRatioValue(stock1, 'quickRatioAnnual'), getRatioValue(stock2, 'quickRatioAnnual'), true)
    },
    {
      metric: 'Debt/Equity',
      stock1: getRatioValue(stock1, 'totalDebt2TotalEquityAnnual'),
      stock2: getRatioValue(stock2, 'totalDebt2TotalEquityAnnual'),
      winner: compareValue(getRatioValue(stock1, 'totalDebt2TotalEquityAnnual'), getRatioValue(stock2, 'totalDebt2TotalEquityAnnual'), false)
    },
    {
      metric: 'Revenue Growth (1Y) %',
      stock1: `${getRatioValue(stock1, 'revenueGrowthTTMYoy')}%`,
      stock2: `${getRatioValue(stock2, 'revenueGrowthTTMYoy')}%`,
      winner: compareValue(getRatioValue(stock1, 'revenueGrowthTTMYoy'), getRatioValue(stock2, 'revenueGrowthTTMYoy'), true)
    },
    {
      metric: 'Revenue Growth (3Y) %',
      stock1: `${getRatioValue(stock1, 'revenueGrowth3Y')}%`,
      stock2: `${getRatioValue(stock2, 'revenueGrowth3Y')}%`,
      winner: compareValue(getRatioValue(stock1, 'revenueGrowth3Y'), getRatioValue(stock2, 'revenueGrowth3Y'), true)
    },
    {
      metric: 'Revenue Growth (5Y) %',
      stock1: `${getRatioValue(stock1, 'revenueGrowth5Y')}%`,
      stock2: `${getRatioValue(stock2, 'revenueGrowth5Y')}%`,
      winner: compareValue(getRatioValue(stock1, 'revenueGrowth5Y'), getRatioValue(stock2, 'revenueGrowth5Y'), true)
    },
    {
      metric: 'EPS Growth (1Y) %',
      stock1: `${getRatioValue(stock1, 'epsGrowthTTMYoy')}%`,
      stock2: `${getRatioValue(stock2, 'epsGrowthTTMYoy')}%`,
      winner: compareValue(getRatioValue(stock1, 'epsGrowthTTMYoy'), getRatioValue(stock2, 'epsGrowthTTMYoy'), true)
    },
    {
      metric: 'EPS Growth (3Y) %',
      stock1: `${getRatioValue(stock1, 'epsGrowth3Y')}%`,
      stock2: `${getRatioValue(stock2, 'epsGrowth3Y')}%`,
      winner: compareValue(getRatioValue(stock1, 'epsGrowth3Y'), getRatioValue(stock2, 'epsGrowth3Y'), true)
    },
    {
      metric: 'EPS Growth (5Y) %',
      stock1: `${getRatioValue(stock1, 'epsGrowth5Y')}%`,
      stock2: `${getRatioValue(stock2, 'epsGrowth5Y')}%`,
      winner: compareValue(getRatioValue(stock1, 'epsGrowth5Y'), getRatioValue(stock2, 'epsGrowth5Y'), true)
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Side-by-Side Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-secondary/50 rounded-lg">
            <h3 className="font-bold text-lg">{stock1.name}</h3>
            <p className="text-sm text-muted-foreground">{stock1.symbol}</p>
            <p className="text-xs text-muted-foreground mt-1">{stock1.industry}</p>
          </div>
          <div className="text-center p-4 bg-secondary/50 rounded-lg">
            <h3 className="font-bold text-lg">{stock2.name}</h3>
            <p className="text-sm text-muted-foreground">{stock2.symbol}</p>
            <p className="text-xs text-muted-foreground mt-1">{stock2.industry}</p>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Metric</TableHead>
                <TableHead className="text-center">{stock1.symbol}</TableHead>
                <TableHead className="text-center">{stock2.symbol}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{row.metric}</TableCell>
                  {renderCell(row.stock1, row.winner, 'stock1')}
                  {renderCell(row.stock2, row.winner, 'stock2')}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          <p>💡 Green highlighted cells indicate better performance for that metric</p>
        </div>
      </CardContent>
    </Card>
  );
}
