import React from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis } from 'recharts';

interface FundamentalTableProps {
  fundamentals: {
    epsGrowth: string;
    epsGrowthHistory?: { year: string; value: number }[];
    roe: string;
    roa: string;
    netMargin: string;
    operatingMargin: string;
    currentRatio: string;
    quickRatio: string;
    fcf: string;
    pegRatio: string;
    debtToEquity: string;
    marketCap: string;
    peRatio: string;
    pbRatio: string;
    profitMargin: string;
  };
  onInfoClick?: (metric: string) => void;
}

const FundamentalTable: React.FC<FundamentalTableProps> = ({ fundamentals, onInfoClick }) => {
  const metrics = [
    { label: 'P/E Ratio', value: fundamentals.peRatio, key: 'P/E Ratio' },
    { label: 'P/B Ratio', value: fundamentals.pbRatio, key: 'P/B Ratio' },
    { label: 'PEG Ratio', value: fundamentals.pegRatio, key: 'PEG Ratio' },
    { label: 'EPS Growth', value: fundamentals.epsGrowth, key: 'EPS Growth' },
    { label: 'ROE', value: fundamentals.roe, key: 'ROE' },
    { label: 'ROA', value: fundamentals.roa, key: 'ROA' },
    { label: 'Profit Margin', value: fundamentals.profitMargin, key: 'Profit Margin' },
    { label: 'Net Margin', value: fundamentals.netMargin, key: 'Net Margin' },
    { label: 'Operating Margin', value: fundamentals.operatingMargin, key: 'Operating Margin' },
    { label: 'Current Ratio', value: fundamentals.currentRatio, key: 'Current Ratio' },
    { label: 'Quick Ratio', value: fundamentals.quickRatio, key: 'Quick Ratio' },
    { label: 'Debt/Equity', value: fundamentals.debtToEquity, key: 'Debt/Equity' },
    { label: 'FCF', value: fundamentals.fcf, key: 'FCF' },
    { label: 'Market Cap', value: fundamentals.marketCap, key: 'Market Cap' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {metrics.map((metric, i) => (
          <div 
            key={i} 
            className="bg-muted/30 p-4 rounded-xl border border-border hover:border-primary/30 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                {metric.label}
              </span>
              {onInfoClick && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onInfoClick(metric.key)}
                >
                  <Info className="h-3 w-3 text-primary" />
                </Button>
              )}
            </div>
            <span className="text-lg font-bold text-foreground truncate block">
              {metric.value || 'N/A'}
            </span>
          </div>
        ))}
      </div>

      {/* EPS Growth Trend Chart */}
      {fundamentals.epsGrowthHistory && fundamentals.epsGrowthHistory.length > 0 && (
        <div className="bg-muted/30 p-5 rounded-xl border border-border">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">
            EPS Growth Trend (5Y)
          </p>
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fundamentals.epsGrowthHistory}>
                <XAxis dataKey="year" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.1} 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between mt-3 px-1">
            {fundamentals.epsGrowthHistory.map((d, i) => (
              <div key={i} className="text-center">
                <span className="text-[10px] text-muted-foreground font-mono block">{d.year}</span>
                <span className="text-xs font-bold text-foreground">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FundamentalTable;
