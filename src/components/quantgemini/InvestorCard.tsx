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
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getVerdictBg = (verdict: string) => {
    const v = verdict.toLowerCase();
    if (v.includes('strong buy')) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (v.includes('buy')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (v.includes('hold')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  return (
    <div className="bg-card/50 backdrop-blur-xl rounded-3xl p-8 border border-border hover:border-primary/30 transition-all duration-300 group shadow-xl">
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center ${color}`}>
          <span className="text-xl font-black">{name.charAt(0)}</span>
        </div>
        <div>
          <h4 className="text-lg font-black text-foreground">{name}</h4>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{strategy}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className={`text-5xl font-black ${getScoreColor(score)}`}>{score}</span>
          <span className="text-muted-foreground text-sm font-bold">/100</span>
        </div>
        <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${getVerdictBg(verdict)}`}>
          {verdict}
        </span>
      </div>

      <div className="w-full bg-muted rounded-full h-2 mb-6">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${score}%` }}
        />
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors line-clamp-3">
        {details}
      </p>
    </div>
  );
};

export default InvestorCard;
