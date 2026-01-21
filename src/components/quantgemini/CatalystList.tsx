import React from 'react';
import { Zap, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Catalyst {
  event: string;
  impact: string;
  timeline: string;
}

interface CatalystListProps {
  catalysts: Catalyst[];
}

const CatalystList: React.FC<CatalystListProps> = ({ catalysts }) => {
  const getImpactIcon = (impact: string) => {
    const i = impact.toLowerCase();
    if (i.includes('high')) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (i.includes('low')) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-yellow-500" />;
  };

  const getImpactColor = (impact: string) => {
    const i = impact.toLowerCase();
    if (i.includes('high')) return 'bg-green-500/10 border-green-500/20 text-green-400';
    if (i.includes('low')) return 'bg-red-500/10 border-red-500/20 text-red-400';
    return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
  };

  if (!catalysts || catalysts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No upcoming catalysts identified
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {catalysts.map((catalyst, i) => (
        <div 
          key={i} 
          className="bg-background/40 p-6 rounded-2xl border border-border hover:border-primary/30 transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h5 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                {catalyst.event}
              </h5>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getImpactColor(catalyst.impact)}`}>
                  {catalyst.impact}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {catalyst.timeline}
                </span>
              </div>
            </div>
            {getImpactIcon(catalyst.impact)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CatalystList;
