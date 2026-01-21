import React from 'react';

interface InvestorCardProps {
  name: string;
  strategy: string;
  score: number;
  verdict: string;
  details: string;
  color: string;
}

const InvestorCard: React.FC<InvestorCardProps> = ({ name, strategy, score, verdict, details, color }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500 border-green-500';
    if (score >= 60) return 'text-yellow-500 border-yellow-500';
    return 'text-red-500 border-red-500';
  };

  const getVerdictBg = (verdict: string) => {
    const v = verdict.toLowerCase();
    if (v.includes('strong buy')) return 'bg-green-500/20 text-green-400';
    if (v.includes('buy')) return 'bg-emerald-500/20 text-emerald-400';
    if (v.includes('hold')) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-400';
  };

  // Convert 0-100 score to display format (divide by 10 for original style)
  const displayScore = Math.round(score / 10);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-lg flex flex-col h-full transition-all hover:scale-[1.02] hover:border-primary/30">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-black text-foreground">{name}</h3>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{strategy}</p>
        </div>
        <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center font-black text-lg ${getScoreColor(score)}`}>
          {displayScore}/10
        </div>
      </div>
      
      <div className="mb-4">
        <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide ${getVerdictBg(verdict)}`}>
          {verdict}
        </span>
      </div>
      
      <p className="text-sm text-muted-foreground leading-relaxed flex-grow line-clamp-4">
        {details}
      </p>

      {/* Score bar */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default InvestorCard;
