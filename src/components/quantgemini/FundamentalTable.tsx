import React from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FundamentalTableProps {
  fundamentals: {
    epsGrowth: string;
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
    { label: 'Net Margin', value: fundamentals.netMargin, key: 'Net Margin' },
    { label: 'Operating Margin', value: fundamentals.operatingMargin, key: 'Operating Margin' },
    { label: 'Profit Margin', value: fundamentals.profitMargin, key: 'Profit Margin' },
    { label: 'Current Ratio', value: fundamentals.currentRatio, key: 'Current Ratio' },
    { label: 'Quick Ratio', value: fundamentals.quickRatio, key: 'Quick Ratio' },
    { label: 'Debt/Equity', value: fundamentals.debtToEquity, key: 'Debt/Equity' },
    { label: 'FCF', value: fundamentals.fcf, key: 'FCF' },
    { label: 'Market Cap', value: fundamentals.marketCap, key: 'Market Cap' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {metrics.map((metric, i) => (
        <div 
          key={i} 
          className="bg-background/40 p-5 rounded-2xl border border-border hover:border-primary/30 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              {metric.label}
            </span>
            {onInfoClick && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onInfoClick(metric.key)}
              >
                <Info className="h-3 w-3 text-primary" />
              </Button>
            )}
          </div>
          <span className="text-xl font-black text-foreground">
            {metric.value || 'N/A'}
          </span>
        </div>
      ))}
    </div>
  );
};

export default FundamentalTable;
