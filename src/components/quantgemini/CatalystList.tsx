import React from 'react';
import { Zap } from 'lucide-react';

interface Catalyst {
  event: string;
  impact: string;
  timeline: string;
}

interface CatalystListProps {
  catalysts: Catalyst[];
}

const CatalystList: React.FC<CatalystListProps> = ({ catalysts }) => {
  const getImpactColor = (impact: string) => {
    const i = impact.toLowerCase();
    if (i.includes('high')) return 'border-l-green-500';
    if (i.includes('low')) return 'border-l-red-500';
    return 'border-l-yellow-500';
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
          className={`flex gap-4 p-4 bg-muted/30 rounded-xl border-l-4 ${getImpactColor(catalyst.impact)} hover:bg-muted/50 transition-all`}
        >
          <div className="flex-1">
            <h4 className="font-bold text-foreground mb-1">{catalyst.event}</h4>
            <p className="text-sm text-muted-foreground">{catalyst.impact}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-xs font-mono text-primary bg-primary/10 px-3 py-1.5 rounded-lg">
              {catalyst.timeline}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CatalystList;
