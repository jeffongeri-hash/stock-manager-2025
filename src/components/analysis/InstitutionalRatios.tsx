import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Building2, Zap, TrendingUp, BarChart3, Briefcase, Heart } from 'lucide-react';

export interface RatioData {
  debtToEquity?: number;
  netDebtToEbitda?: number;
  debtToCapital?: number;
  currentRatio?: number;
  quickRatio?: number;
  cashRunwayMonths?: number;
  roic?: number;
  roe?: number;
  roa?: number;
  revenueCAGR?: number;
  fcfCAGR?: number;
  epsCAGR?: number;
  shareCountCAGR?: number;
  ocfToNetIncome?: number;
  fcfYield?: number;
  capexToRevenue?: number;
  evToEbitda?: number;
  priceToBook?: number;
  priceToSales?: number;
  interestCoverage?: number;
  fixedChargeCoverage?: number;
  assetTurnover?: number;
  incrementalRoic?: number;
  grossMargin?: number;
  fcfMargin?: number;
  tier1Capital?: number;
  efficiencyRatio?: number;
}

export type SectorType = 'utility' | 'energy-transition' | 'technology' | 'financials' | 'industrials' | 'healthcare' | 'general';
export type PhaseType = 'early' | 'growth' | 'mature';

interface InstitutionalRatiosProps {
  ratios: RatioData;
  sector?: SectorType;
  phase?: PhaseType;
  onSectorChange?: (sector: SectorType) => void;
  onPhaseChange?: (phase: PhaseType) => void;
}

type RatingLevel = 'good' | 'warning' | 'danger' | 'neutral' | 'na';

interface RatioConfig {
  label: string;
  value: number | undefined;
  format: (v: number) => string;
  getRating: (v: number, sector: SectorType, phase: PhaseType) => RatingLevel;
  description: string;
  getBenchmark: (sector: SectorType, phase: PhaseType) => string;
}

const getRatingColor = (rating: RatingLevel): string => {
  switch (rating) {
    case 'good': return 'text-green-500';
    case 'warning': return 'text-yellow-500';
    case 'danger': return 'text-red-500';
    case 'na': return 'text-muted-foreground italic';
    default: return 'text-muted-foreground';
  }
};

const getRatingBg = (rating: RatingLevel): string => {
  switch (rating) {
    case 'good': return 'bg-green-500/10 border-green-500/20';
    case 'warning': return 'bg-yellow-500/10 border-yellow-500/20';
    case 'danger': return 'bg-red-500/10 border-red-500/20';
    default: return 'bg-muted/30 border-border';
  }
};

const RatioCard: React.FC<{
  label: string;
  value: number | undefined;
  format: (v: number) => string;
  rating: RatingLevel;
  description: string;
  benchmark: string;
}> = ({ label, value, format, rating, description, benchmark }) => (
  <div className={cn(
    "p-4 rounded-lg border transition-all",
    getRatingBg(rating)
  )}>
    <div className="flex items-start justify-between mb-2">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
    </div>
    <p className={cn("text-xl font-bold", value !== undefined ? getRatingColor(rating) : 'text-muted-foreground')}>
      {value !== undefined ? format(value) : 'N/A'}
    </p>
    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{description}</p>
    <p className="text-xs text-primary/70 mt-1 font-medium">Benchmark: {benchmark}</p>
  </div>
);

const SectionHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="mb-4">
    <h3 className="text-sm font-bold text-foreground">{title}</h3>
    <p className="text-xs text-muted-foreground">{subtitle}</p>
  </div>
);

const sectorOptions: { value: SectorType; label: string; icon: React.ReactNode }[] = [
  { value: 'utility', label: 'Utilities', icon: <Building2 className="h-4 w-4" /> },
  { value: 'energy-transition', label: 'Energy Transition / Nuclear', icon: <Zap className="h-4 w-4" /> },
  { value: 'technology', label: 'Technology', icon: <TrendingUp className="h-4 w-4" /> },
  { value: 'financials', label: 'Financials', icon: <BarChart3 className="h-4 w-4" /> },
  { value: 'industrials', label: 'Industrials', icon: <Briefcase className="h-4 w-4" /> },
  { value: 'healthcare', label: 'Healthcare / Biotech', icon: <Heart className="h-4 w-4" /> },
  { value: 'general', label: 'General', icon: <BarChart3 className="h-4 w-4" /> },
];

const phaseOptions: { value: PhaseType; label: string }[] = [
  { value: 'early', label: 'Early Stage' },
  { value: 'growth', label: 'Growth / Build-Out' },
  { value: 'mature', label: 'Mature' },
];

// Ratio Appropriateness Matrix Data
const appropriatenessMatrix = {
  utility: {
    title: 'Utilities (Regulated, IPP, Nuclear)',
    rows: [
      { ratio: 'Debt / Equity', early: '0.0–0.3', growth: '0.5–1.2', mature: '0.8–1.8', earlyRating: 'good', growthRating: 'warning', matureRating: 'good', why: 'Leverage only works once cash flows stabilize' },
      { ratio: 'Net Debt / EBITDA', early: 'N/A', growth: '3–5×', mature: '3–4×', earlyRating: 'na', growthRating: 'warning', matureRating: 'good', why: 'Lenders price utilities on predictability' },
      { ratio: 'Current Ratio', early: '>2.0', growth: '1.2–2.0', mature: '0.8–1.3', earlyRating: 'good', growthRating: 'warning', matureRating: 'good', why: 'Excess liquidity early, efficiency later' },
      { ratio: 'ROIC', early: 'Negative', growth: '4–6%', mature: '6–9%', earlyRating: 'warning', growthRating: 'warning', matureRating: 'good', why: 'Must exceed WACC long-term' },
      { ratio: 'P/B', early: '>2.0', growth: '1.5–2.5', mature: '1.2–2.0', earlyRating: 'warning', growthRating: 'neutral', matureRating: 'neutral', why: 'Asset-based valuation dominates' },
      { ratio: 'EV / EBITDA', early: 'N/A', growth: '10–16×', mature: '8–12×', earlyRating: 'na', growthRating: 'neutral', matureRating: 'neutral', why: 'Regulated cash flows cap upside' },
      { ratio: 'Revenue CAGR', early: '0%', growth: '5–12%', mature: '2–6%', earlyRating: 'neutral', growthRating: 'neutral', matureRating: 'neutral', why: 'Utilities grow slowly by design' },
    ]
  },
  'energy-transition': {
    title: 'Energy Transition / Advanced Nuclear / SMR',
    rows: [
      { ratio: 'Debt / Equity', early: '0.0–0.2', growth: '0.3–0.7', mature: '0.8–1.5', earlyRating: 'good', growthRating: 'warning', matureRating: 'warning', why: 'Debt too early = dilution death spiral' },
      { ratio: 'Cash Runway', early: '>24 mo', growth: '18–24 mo', mature: '12+ mo', earlyRating: 'good', growthRating: 'neutral', matureRating: 'neutral', why: 'Regulatory timelines are long' },
      { ratio: 'Current Ratio', early: '>3.0', growth: '2.0–3.0', mature: '1.5–2.0', earlyRating: 'good', growthRating: 'neutral', matureRating: 'neutral', why: 'Optionality > efficiency' },
      { ratio: 'ROIC', early: 'N/A', growth: 'Target >8%', mature: '>10%', earlyRating: 'na', growthRating: 'neutral', matureRating: 'good', why: 'Must justify tech risk' },
      { ratio: 'P/S', early: '>10×', growth: '5–10×', mature: '3–6×', earlyRating: 'warning', growthRating: 'neutral', matureRating: 'neutral', why: 'Compression expected post-revenue' },
      { ratio: 'Share Dilution CAGR', early: '<10%', growth: '<7%', mature: '<5%', earlyRating: 'neutral', growthRating: 'neutral', matureRating: 'good', why: 'Silent value killer' },
      { ratio: 'Revenue CAGR', early: '0%', growth: '20–40%', mature: '10–15%', earlyRating: 'neutral', growthRating: 'good', matureRating: 'good', why: 'Must outgrow utilities' },
    ]
  },
  technology: {
    title: 'Technology (Software / Platforms)',
    rows: [
      { ratio: 'Debt / Equity', early: '0.0–0.4', growth: '0.2–0.8', mature: '0.5–1.0', earlyRating: 'neutral', growthRating: 'neutral', matureRating: 'neutral', why: 'Equity funds growth, not debt' },
      { ratio: 'Gross Margin', early: '60–80%', growth: '70–85%', mature: '75–90%', earlyRating: 'neutral', growthRating: 'good', matureRating: 'good', why: 'Pricing power signal' },
      { ratio: 'ROIC', early: 'Negative', growth: '>10%', mature: '>15%', earlyRating: 'neutral', growthRating: 'good', matureRating: 'good', why: 'Network effects' },
      { ratio: 'FCF Margin', early: 'Negative', growth: '10–25%', mature: '20–35%', earlyRating: 'neutral', growthRating: 'good', matureRating: 'good', why: 'Scalability' },
      { ratio: 'Revenue CAGR', early: '>30%', growth: '20–30%', mature: '8–15%', earlyRating: 'good', growthRating: 'good', matureRating: 'neutral', why: 'Growth decelerates naturally' },
      { ratio: 'P/S', early: '10–25×', growth: '6–12×', mature: '3–6×', earlyRating: 'warning', growthRating: 'neutral', matureRating: 'neutral', why: 'Compression is normal' },
    ]
  },
  financials: {
    title: 'Financials (Banks, Insurers)',
    rows: [
      { ratio: 'Debt / Equity', early: 'N/A', growth: 'N/A', mature: 'N/A', earlyRating: 'danger', growthRating: 'danger', matureRating: 'danger', why: 'Deposits ≠ debt (meaningless)' },
      { ratio: 'Tier 1 Capital', early: '>10%', growth: '>10%', mature: '>10%', earlyRating: 'good', growthRating: 'good', matureRating: 'good', why: 'Solvency requirement' },
      { ratio: 'ROE', early: '8–12%', growth: '10–15%', mature: '10–15%', earlyRating: 'neutral', growthRating: 'good', matureRating: 'good', why: 'Cost of capital benchmark' },
      { ratio: 'Efficiency Ratio', early: '<65%', growth: '<60%', mature: '<60%', earlyRating: 'neutral', growthRating: 'good', matureRating: 'good', why: 'Expense discipline' },
      { ratio: 'P/B', early: '0.8–1.2', growth: '0.8–1.5', mature: '0.8–1.5', earlyRating: 'neutral', growthRating: 'neutral', matureRating: 'neutral', why: 'Book value relevance' },
      { ratio: 'Revenue CAGR', early: '5–10%', growth: '3–8%', mature: '3–8%', earlyRating: 'neutral', growthRating: 'neutral', matureRating: 'neutral', why: 'Macro-linked growth' },
    ]
  },
  industrials: {
    title: 'Industrials / Infrastructure',
    rows: [
      { ratio: 'Debt / EBITDA', early: '1–2×', growth: '2–3×', mature: '2.5–4×', earlyRating: 'neutral', growthRating: 'warning', matureRating: 'neutral', why: 'Cyclical cash flows' },
      { ratio: 'ROIC', early: '>6%', growth: '>8%', mature: '>10%', earlyRating: 'neutral', growthRating: 'good', matureRating: 'good', why: 'Capital discipline' },
      { ratio: 'CapEx / Revenue', early: '8–15%', growth: '5–15%', mature: '3–8%', earlyRating: 'neutral', growthRating: 'neutral', matureRating: 'good', why: 'Asset intensity' },
      { ratio: 'Revenue CAGR', early: '8–15%', growth: '5–12%', mature: '3–6%', earlyRating: 'good', growthRating: 'neutral', matureRating: 'neutral', why: 'GDP-linked' },
    ]
  },
  healthcare: {
    title: 'Healthcare / Biotech',
    rows: [
      { ratio: 'Debt / Equity', early: '0.0–0.3', growth: '0.3–0.8', mature: '0.5–1.0', earlyRating: 'good', growthRating: 'neutral', matureRating: 'neutral', why: 'Binary risk' },
      { ratio: 'Cash Runway', early: '>18 mo', growth: '>12 mo', mature: '>12 mo', earlyRating: 'good', growthRating: 'neutral', matureRating: 'neutral', why: 'Trial duration' },
      { ratio: 'ROIC', early: 'N/A', growth: '>8%', mature: '>12%', earlyRating: 'na', growthRating: 'neutral', matureRating: 'good', why: 'Pricing power' },
      { ratio: 'P/S', early: '>15×', growth: '8–15×', mature: '5–8×', earlyRating: 'warning', growthRating: 'warning', matureRating: 'neutral', why: 'Risk compression' },
      { ratio: 'Revenue CAGR', early: '0%', growth: '20–40%', mature: '20–40%', earlyRating: 'neutral', growthRating: 'good', matureRating: 'good', why: 'Patent clock' },
    ]
  },
  general: {
    title: 'General Market',
    rows: [
      { ratio: 'Debt / Equity', early: '0.0–0.5', growth: '0.3–1.0', mature: '0.5–1.5', earlyRating: 'neutral', growthRating: 'neutral', matureRating: 'neutral', why: 'Varies by industry' },
      { ratio: 'Current Ratio', early: '>2.0', growth: '1.5–2.5', mature: '1.0–2.0', earlyRating: 'good', growthRating: 'neutral', matureRating: 'neutral', why: 'Liquidity baseline' },
      { ratio: 'ROIC', early: 'Negative OK', growth: '>8%', mature: '>10%', earlyRating: 'neutral', growthRating: 'good', matureRating: 'good', why: 'Value creation' },
      { ratio: 'Revenue CAGR', early: '>20%', growth: '10–20%', mature: '5–10%', earlyRating: 'good', growthRating: 'neutral', matureRating: 'neutral', why: 'Growth expectations' },
    ]
  }
};

const getRatingIcon = (rating: string) => {
  switch (rating) {
    case 'good': return <span className="text-green-500">●</span>;
    case 'warning': return <span className="text-yellow-500">●</span>;
    case 'danger': return <span className="text-red-500">●</span>;
    case 'na': return <span className="text-muted-foreground">○</span>;
    default: return <span className="text-muted-foreground">○</span>;
  }
};

export const InstitutionalRatios: React.FC<InstitutionalRatiosProps> = ({ 
  ratios, 
  sector: initialSector = 'general',
  phase: initialPhase = 'mature',
  onSectorChange,
  onPhaseChange
}) => {
  const [sector, setSector] = useState<SectorType>(initialSector);
  const [phase, setPhase] = useState<PhaseType>(initialPhase);

  const handleSectorChange = (value: SectorType) => {
    setSector(value);
    onSectorChange?.(value);
  };

  const handlePhaseChange = (value: PhaseType) => {
    setPhase(value);
    onPhaseChange?.(value);
  };

  // Capital Structure Ratios with sector/phase awareness
  const capitalStructureRatios: RatioConfig[] = [
    {
      label: 'Debt / Equity',
      value: ratios.debtToEquity,
      format: (v) => v.toFixed(2),
      getRating: (v, s, p) => {
        if (s === 'financials') return 'danger'; // Not applicable
        if (s === 'utility') {
          if (p === 'early') return v <= 0.3 ? 'good' : v <= 0.5 ? 'warning' : 'danger';
          if (p === 'growth') return v >= 0.5 && v <= 1.2 ? 'warning' : 'danger';
          return v >= 0.8 && v <= 1.8 ? 'good' : 'warning';
        }
        if (s === 'energy-transition') {
          if (p === 'early') return v <= 0.2 ? 'good' : v <= 0.3 ? 'warning' : 'danger';
          if (p === 'growth') return v >= 0.3 && v <= 0.7 ? 'warning' : 'danger';
          return v >= 0.8 && v <= 1.5 ? 'warning' : 'danger';
        }
        if (s === 'technology') return v <= 0.8 ? 'good' : v <= 1.0 ? 'warning' : 'danger';
        return v <= 1.0 ? 'good' : v <= 2.0 ? 'warning' : 'danger';
      },
      description: 'Financial leverage relative to shareholder capital. High D/E with unstable cash flows indicates equity optionality collapse risk.',
      getBenchmark: (s, p) => {
        if (s === 'financials') return 'Not applicable (deposits ≠ debt)';
        if (s === 'utility') {
          if (p === 'early') return '0.0–0.3';
          if (p === 'growth') return '0.5–1.2';
          return '0.8–1.8';
        }
        if (s === 'energy-transition') {
          if (p === 'early') return '0.0–0.2';
          if (p === 'growth') return '0.3–0.7';
          return '0.8–1.5';
        }
        return 'Early: 0–0.5, Growth: 0.3–1.0, Mature: 0.5–1.5';
      }
    },
    {
      label: 'Net Debt / EBITDA',
      value: ratios.netDebtToEbitda,
      format: (v) => `${v.toFixed(1)}×`,
      getRating: (v, s, p) => {
        if (p === 'early') return 'na';
        if (s === 'utility') return v <= 4 ? 'good' : v <= 5 ? 'warning' : 'danger';
        if (s === 'industrials') {
          if (p === 'growth') return v <= 3 ? 'good' : v <= 4 ? 'warning' : 'danger';
          return v <= 4 ? 'good' : v <= 5 ? 'warning' : 'danger';
        }
        return v <= 3 ? 'good' : v <= 4 ? 'warning' : 'danger';
      },
      description: 'Core solvency metric used by lenders. Measures debt load relative to operating cash earnings.',
      getBenchmark: (s, p) => {
        if (p === 'early') return 'N/A (pre-EBITDA)';
        if (s === 'utility') return p === 'growth' ? '3–5×' : '3–4×';
        if (s === 'industrials') return p === 'growth' ? '2–3×' : '2.5–4×';
        return '<3× conservative, 3–4× acceptable';
      }
    },
    {
      label: 'Debt / Capital',
      value: ratios.debtToCapital,
      format: (v) => `${(v * 100).toFixed(0)}%`,
      getRating: (v) => v <= 0.5 ? 'good' : v <= 0.6 ? 'warning' : 'danger',
      description: 'Debt ÷ (Debt + Equity). Preferred by credit analysts for capital structure assessment.',
      getBenchmark: () => 'Utilities norm: 40–60%'
    }
  ];

  // Liquidity & Solvency Ratios
  const liquidityRatios: RatioConfig[] = [
    {
      label: 'Current Ratio',
      value: ratios.currentRatio,
      format: (v) => v.toFixed(2),
      getRating: (v, s, p) => {
        if (s === 'energy-transition' || s === 'healthcare') {
          if (p === 'early') return v >= 3 ? 'good' : v >= 2 ? 'warning' : 'danger';
          if (p === 'growth') return v >= 2 ? 'good' : v >= 1.5 ? 'warning' : 'danger';
          return v >= 1.5 ? 'good' : v >= 1.2 ? 'warning' : 'danger';
        }
        if (s === 'utility') {
          if (p === 'early') return v >= 2 ? 'good' : v >= 1.5 ? 'warning' : 'danger';
          return v >= 0.8 && v <= 1.3 ? 'good' : 'warning';
        }
        if (p === 'early') return v >= 2 ? 'good' : v >= 1.5 ? 'warning' : 'danger';
        return v >= 1 ? 'good' : v >= 0.8 ? 'warning' : 'danger';
      },
      description: 'Current assets ÷ current liabilities. Too low = liquidity risk, too high = inefficient capital allocation.',
      getBenchmark: (s, p) => {
        if (s === 'energy-transition') {
          if (p === 'early') return '>3.0';
          if (p === 'growth') return '2.0–3.0';
          return '1.5–2.0';
        }
        if (s === 'utility') {
          if (p === 'early') return '>2.0';
          if (p === 'growth') return '1.2–2.0';
          return '0.8–1.3';
        }
        return p === 'early' ? '>2.0' : '1.0–2.0';
      }
    },
    {
      label: 'Quick Ratio',
      value: ratios.quickRatio,
      format: (v) => v.toFixed(2),
      getRating: (v, _s, p) => {
        if (p === 'early') return v >= 1.5 ? 'good' : v >= 1 ? 'warning' : 'danger';
        return v >= 1 ? 'good' : v >= 0.7 ? 'warning' : 'danger';
      },
      description: '(Cash + equivalents + receivables) ÷ current liabilities. Gold standard liquidity ratio for pre-revenue firms.',
      getBenchmark: () => '>1.0 preferred for stability'
    },
    {
      label: 'Cash Runway',
      value: ratios.cashRunwayMonths,
      format: (v) => `${v.toFixed(0)} mo`,
      getRating: (v, s, p) => {
        if (s === 'energy-transition' || s === 'healthcare') {
          if (p === 'early') return v >= 24 ? 'good' : v >= 18 ? 'warning' : 'danger';
          return v >= 18 ? 'good' : v >= 12 ? 'warning' : 'danger';
        }
        return v >= 24 ? 'good' : v >= 12 ? 'warning' : 'danger';
      },
      description: 'Cash ÷ annual operating cash burn. Institutions explicitly calculate this metric.',
      getBenchmark: (s) => {
        if (s === 'energy-transition') return 'Early: >24mo, Growth: 18–24mo';
        if (s === 'healthcare') return 'Pre-clinical: >18mo, Commercial: >12mo';
        return '<12mo = dilution risk, 24–36mo = strategic flexibility';
      }
    }
  ];

  // Profitability & Capital Efficiency
  const profitabilityRatios: RatioConfig[] = [
    {
      label: 'ROIC',
      value: ratios.roic,
      format: (v) => `${(v * 100).toFixed(1)}%`,
      getRating: (v, s, p) => {
        if (p === 'early' && (s === 'energy-transition' || s === 'healthcare')) return 'na';
        if (s === 'utility') {
          if (p === 'early') return v < 0 ? 'warning' : 'good';
          if (p === 'growth') return v >= 0.04 ? 'warning' : 'danger';
          return v >= 0.06 ? 'good' : v >= 0.04 ? 'warning' : 'danger';
        }
        if (s === 'technology') return v >= 0.15 ? 'good' : v >= 0.10 ? 'warning' : 'danger';
        if (s === 'industrials') return v >= 0.10 ? 'good' : v >= 0.08 ? 'warning' : 'danger';
        return v >= 0.10 ? 'good' : v >= 0.06 ? 'warning' : 'danger';
      },
      description: 'Most important long-term ratio. ROIC > WACC = value creation, ROIC < WACC = value destruction.',
      getBenchmark: (s, p) => {
        if (s === 'utility') return p === 'mature' ? '6–9%' : '4–6%';
        if (s === 'technology') return p === 'mature' ? '>15%' : '>10%';
        if (s === 'healthcare') return '>12%';
        return 'Must exceed WACC';
      }
    },
    {
      label: 'ROE',
      value: ratios.roe,
      format: (v) => `${(v * 100).toFixed(1)}%`,
      getRating: (v, s) => {
        if (s === 'financials') return v >= 0.10 ? 'good' : v >= 0.08 ? 'warning' : 'danger';
        return v >= 0.15 ? 'good' : v >= 0.10 ? 'warning' : 'danger';
      },
      description: 'Net income ÷ equity. Inflated by leverage—use carefully in utilities where leverage is structural.',
      getBenchmark: (s) => s === 'financials' ? '10–15%' : '>15% strong, 10–15% acceptable'
    },
    {
      label: 'ROA',
      value: ratios.roa,
      format: (v) => `${(v * 100).toFixed(1)}%`,
      getRating: (v, s) => {
        if (s === 'utility') return v >= 0.02 ? 'good' : v >= 0.01 ? 'warning' : 'danger';
        return v >= 0.05 ? 'good' : v >= 0.02 ? 'warning' : 'danger';
      },
      description: 'Profitability per dollar of assets. Useful for asset-heavy industries.',
      getBenchmark: (s) => s === 'utility' ? '2–5%' : '>5%'
    },
    {
      label: 'Incremental ROIC',
      value: ratios.incrementalRoic,
      format: (v) => `${(v * 100).toFixed(1)}%`,
      getRating: (v) => v >= 0.12 ? 'good' : v >= 0.08 ? 'warning' : 'danger',
      description: 'Return on new capital deployed. Separates good growth from bad growth.',
      getBenchmark: () => '>12% indicates quality capital allocation'
    }
  ];

  // Growth Metrics
  const growthRatios: RatioConfig[] = [
    {
      label: 'Revenue CAGR',
      value: ratios.revenueCAGR,
      format: (v) => `${(v * 100).toFixed(1)}%`,
      getRating: (v, s, p) => {
        if (s === 'utility') return v >= 0.02 ? 'good' : v >= 0 ? 'warning' : 'danger';
        if (s === 'technology') {
          if (p === 'early') return v >= 0.30 ? 'good' : v >= 0.20 ? 'warning' : 'danger';
          if (p === 'growth') return v >= 0.20 ? 'good' : v >= 0.10 ? 'warning' : 'danger';
          return v >= 0.08 ? 'good' : v >= 0.05 ? 'warning' : 'danger';
        }
        if (s === 'energy-transition' || s === 'healthcare') {
          if (p === 'growth' || p === 'mature') return v >= 0.20 ? 'good' : v >= 0.10 ? 'warning' : 'danger';
        }
        return v >= 0.10 ? 'good' : v >= 0.05 ? 'warning' : 'danger';
      },
      description: 'Business traction indicator. Growth without durability is speculation.',
      getBenchmark: (s, p) => {
        if (s === 'utility') return '2–6%';
        if (s === 'technology') return p === 'early' ? '>30%' : p === 'growth' ? '20–30%' : '8–15%';
        if (s === 'energy-transition') return p === 'growth' ? '20–40%' : '10–15%';
        return '5–15%';
      }
    },
    {
      label: 'FCF CAGR',
      value: ratios.fcfCAGR,
      format: (v) => `${(v * 100).toFixed(1)}%`,
      getRating: (v) => v >= 0.08 ? 'good' : v >= 0.03 ? 'warning' : 'danger',
      description: 'Business quality indicator. High CAGR + low ROIC = capital destruction.',
      getBenchmark: () => '>8% indicates compounding quality'
    },
    {
      label: 'EPS CAGR',
      value: ratios.epsCAGR,
      format: (v) => `${(v * 100).toFixed(1)}%`,
      getRating: (v) => v >= 0.08 ? 'good' : v >= 0.03 ? 'warning' : 'danger',
      description: 'Shareholder outcome metric. Always pair with share count CAGR.',
      getBenchmark: () => '>8% strong shareholder returns'
    },
    {
      label: 'Share Count CAGR',
      value: ratios.shareCountCAGR,
      format: (v) => `${(v * 100).toFixed(1)}%`,
      getRating: (v, s, p) => {
        if (s === 'energy-transition') {
          if (p === 'early') return v <= 0.10 ? 'good' : v <= 0.15 ? 'warning' : 'danger';
          if (p === 'growth') return v <= 0.07 ? 'good' : v <= 0.10 ? 'warning' : 'danger';
          return v <= 0.05 ? 'good' : v <= 0.08 ? 'warning' : 'danger';
        }
        return v <= 0.02 ? 'good' : v <= 0.05 ? 'warning' : 'danger';
      },
      description: 'Dilution indicator. If revenue grows 20% but shares grow 15%, real growth is 5%.',
      getBenchmark: (s) => s === 'energy-transition' ? 'Early: <10%, Growth: <7%, Mature: <5%' : '<2% minimal dilution'
    }
  ];

  // Cash Flow Ratios
  const cashFlowRatios: RatioConfig[] = [
    {
      label: 'OCF / Net Income',
      value: ratios.ocfToNetIncome,
      format: (v) => v.toFixed(2),
      getRating: (v) => v >= 1 ? 'good' : v >= 0.8 ? 'warning' : 'danger',
      description: 'Income statements can lie. Cash rarely does. <1 consistently = earnings quality problem.',
      getBenchmark: () => 'Should converge to ~1 over time'
    },
    {
      label: 'FCF Yield',
      value: ratios.fcfYield,
      format: (v) => `${(v * 100).toFixed(1)}%`,
      getRating: (v, _s, p) => {
        if (p === 'early') return v >= 0 ? 'neutral' : 'warning';
        return v >= 0.06 ? 'good' : v >= 0.04 ? 'warning' : v >= 0 ? 'neutral' : 'danger';
      },
      description: 'FCF ÷ market cap. Negative FCF acceptable only during build-out phase.',
      getBenchmark: () => 'Utilities: 4–8%'
    },
    {
      label: 'CapEx / Revenue',
      value: ratios.capexToRevenue,
      format: (v) => `${(v * 100).toFixed(0)}%`,
      getRating: (v, s, p) => {
        if (s === 'utility' || s === 'industrials') return v <= 0.15 ? 'good' : v <= 0.25 ? 'warning' : 'neutral';
        if (p === 'mature') return v <= 0.08 ? 'good' : v <= 0.15 ? 'warning' : 'neutral';
        return v <= 0.15 ? 'good' : v <= 0.25 ? 'warning' : 'neutral';
      },
      description: 'Capital intensity indicator. Watch maintenance vs growth CapEx once disclosed.',
      getBenchmark: (s, p) => {
        if (s === 'industrials') return p === 'mature' ? '3–8%' : '5–15%';
        return 'Utilities are inherently CapEx heavy';
      }
    }
  ];

  // Valuation Ratios
  const valuationRatios: RatioConfig[] = [
    {
      label: 'EV / EBITDA',
      value: ratios.evToEbitda,
      format: (v) => `${v.toFixed(1)}×`,
      getRating: (v, s, p) => {
        if (p === 'early') return 'na';
        if (s === 'utility') return v <= 12 ? 'good' : v <= 16 ? 'warning' : 'danger';
        return v <= 15 ? 'good' : v <= 25 ? 'warning' : 'danger';
      },
      description: 'Core utility valuation metric. Pre-revenue companies require narrative-driven valuation.',
      getBenchmark: (s, p) => {
        if (p === 'early') return 'N/A';
        if (s === 'utility') return p === 'growth' ? '10–16×' : '8–12×';
        return '8–15×';
      }
    },
    {
      label: 'Price / Book',
      value: ratios.priceToBook,
      format: (v) => `${v.toFixed(2)}×`,
      getRating: (v, s) => {
        if (s === 'financials') return v >= 0.8 && v <= 1.5 ? 'good' : v <= 2 ? 'warning' : 'danger';
        if (s === 'utility') return v <= 2 ? 'good' : v <= 2.5 ? 'warning' : 'danger';
        return v <= 4 ? 'good' : v <= 6 ? 'warning' : 'danger';
      },
      description: 'Works well for asset-heavy industries. Above benchmark requires growth optionality.',
      getBenchmark: (s) => {
        if (s === 'financials') return '0.8–1.5×';
        if (s === 'utility') return '1.2–2.0×';
        return '1.5–4.0×';
      }
    },
    {
      label: 'Price / Sales',
      value: ratios.priceToSales,
      format: (v) => `${v.toFixed(2)}×`,
      getRating: (v, s, p) => {
        if (s === 'technology') {
          if (p === 'early') return v <= 25 ? 'warning' : 'danger';
          if (p === 'growth') return v <= 12 ? 'good' : v <= 18 ? 'warning' : 'danger';
          return v <= 6 ? 'good' : v <= 10 ? 'warning' : 'danger';
        }
        if (s === 'energy-transition' || s === 'healthcare') {
          if (p === 'early') return v <= 15 ? 'warning' : 'danger';
          return v <= 8 ? 'good' : v <= 12 ? 'warning' : 'danger';
        }
        return v <= 3 ? 'good' : v <= 6 ? 'warning' : 'danger';
      },
      description: 'Used when earnings are absent. Dangerous if not paired with margin trajectory.',
      getBenchmark: (s, p) => {
        if (s === 'technology') return p === 'early' ? '10–25×' : p === 'growth' ? '6–12×' : '3–6×';
        if (s === 'healthcare') return p === 'early' ? '>15×' : '5–8×';
        return '2–5×';
      }
    }
  ];

  // Institutional Ratios
  const institutionalRatios: RatioConfig[] = [
    {
      label: 'Interest Coverage',
      value: ratios.interestCoverage,
      format: (v) => `${v.toFixed(1)}×`,
      getRating: (v) => v >= 3 ? 'good' : v >= 2 ? 'warning' : 'danger',
      description: 'EBIT ÷ interest expense. Critical for debt servicing capability.',
      getBenchmark: () => 'Utilities want >3×'
    },
    {
      label: 'Fixed-Charge Coverage',
      value: ratios.fixedChargeCoverage,
      format: (v) => `${v.toFixed(1)}×`,
      getRating: (v) => v >= 2.5 ? 'good' : v >= 1.5 ? 'warning' : 'danger',
      description: 'Includes lease obligations. Important for infrastructure firms.',
      getBenchmark: () => '>2.5× preferred'
    },
    {
      label: 'Asset Turnover',
      value: ratios.assetTurnover,
      format: (v) => `${v.toFixed(2)}×`,
      getRating: (v, s) => {
        if (s === 'utility') return v >= 0.2 ? 'good' : v >= 0.1 ? 'warning' : 'neutral';
        return v >= 0.5 ? 'good' : v >= 0.3 ? 'warning' : 'neutral';
      },
      description: 'Revenue ÷ assets. Utilities are low by design—but trend matters.',
      getBenchmark: (s) => s === 'utility' ? 'Low for utilities, trend is key' : '>0.5×'
    }
  ];

  const renderRatioSection = (ratiosList: RatioConfig[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {ratiosList.map((ratio, i) => (
        <RatioCard
          key={i}
          label={ratio.label}
          value={ratio.value}
          format={ratio.format}
          rating={ratio.value !== undefined ? ratio.getRating(ratio.value, sector, phase) : 'neutral'}
          description={ratio.description}
          benchmark={ratio.getBenchmark(sector, phase)}
        />
      ))}
    </div>
  );

  const currentMatrix = appropriatenessMatrix[sector] || appropriatenessMatrix.general;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="text-lg">Institutional-Grade Financial Ratios</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Comprehensive analysis framework used by institutional investors
              </p>
            </div>
          </div>
          
          {/* Sector and Phase Selectors */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Industry Sector
              </label>
              <Select value={sector} onValueChange={(v) => handleSectorChange(v as SectorType)}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Select sector" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {sectorOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        {opt.icon}
                        <span>{opt.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Company Phase
              </label>
              <Select value={phase} onValueChange={(v) => handlePhaseChange(v as PhaseType)}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Select phase" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {phaseOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Phase Context */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <p className="text-xs text-muted-foreground">
              {phase === 'early' && (
                <><span className="font-semibold text-foreground">Early Stage:</span> Liquidity {'>'} Efficiency. Balance sheet {'>'} income statement. CAGR meaningless without dilution math.</>
              )}
              {phase === 'growth' && (
                <><span className="font-semibold text-foreground">Build-Out:</span> ROIC trajectory {'>'} absolute ROIC. Debt must lag cash flow. Margin structure becomes visible.</>
              )}
              {phase === 'mature' && (
                <><span className="font-semibold text-foreground">Mature:</span> ROIC vs WACC dominates. FCF yield replaces revenue growth as key metric.</>
              )}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="capital" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 mb-6">
            <TabsTrigger value="capital" className="text-xs">Capital</TabsTrigger>
            <TabsTrigger value="liquidity" className="text-xs">Liquidity</TabsTrigger>
            <TabsTrigger value="profitability" className="text-xs">Profit</TabsTrigger>
            <TabsTrigger value="growth" className="text-xs">Growth</TabsTrigger>
            <TabsTrigger value="cashflow" className="text-xs">Cash Flow</TabsTrigger>
            <TabsTrigger value="valuation" className="text-xs">Valuation</TabsTrigger>
            <TabsTrigger value="institutional" className="text-xs">Other</TabsTrigger>
            <TabsTrigger value="matrix" className="text-xs">Matrix</TabsTrigger>
          </TabsList>

          <TabsContent value="capital" className="mt-0">
            <SectionHeader 
              title="Capital Structure Ratios" 
              subtitle="Who gets paid first, and how fragile is the equity?"
            />
            {renderRatioSection(capitalStructureRatios)}
          </TabsContent>

          <TabsContent value="liquidity" className="mt-0">
            <SectionHeader 
              title="Liquidity & Solvency Ratios" 
              subtitle="Can the company survive the next 12–24 months without external funding?"
            />
            {renderRatioSection(liquidityRatios)}
          </TabsContent>

          <TabsContent value="profitability" className="mt-0">
            <SectionHeader 
              title="Profitability & Capital Efficiency" 
              subtitle="How well does management turn capital into returns?"
            />
            {renderRatioSection(profitabilityRatios)}
          </TabsContent>

          <TabsContent value="growth" className="mt-0">
            <SectionHeader 
              title="Growth Metrics (CAGR & Quality)" 
              subtitle="Growth without durability is speculation"
            />
            {renderRatioSection(growthRatios)}
            <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Key insight:</span> High CAGR + low ROIC = capital destruction. Moderate CAGR + high ROIC = compounding machine.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="cashflow" className="mt-0">
            <SectionHeader 
              title="Cash Flow Ratios" 
              subtitle="Income statements can lie. Cash rarely does."
            />
            {renderRatioSection(cashFlowRatios)}
          </TabsContent>

          <TabsContent value="valuation" className="mt-0">
            <SectionHeader 
              title="Valuation Ratios" 
              subtitle="Contextual, not absolute—always consider sector norms"
            />
            {renderRatioSection(valuationRatios)}
          </TabsContent>

          <TabsContent value="institutional" className="mt-0">
            <SectionHeader 
              title="Ratios Institutional Investors Watch" 
              subtitle="Often missed by retail investors"
            />
            {renderRatioSection(institutionalRatios)}
          </TabsContent>

          <TabsContent value="matrix" className="mt-0">
            <SectionHeader 
              title={`Ratio Appropriateness Matrix: ${currentMatrix.title}`}
              subtitle="Is this ratio appropriate for this industry, phase, and capital structure?"
            />
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold">Ratio</TableHead>
                    <TableHead className="text-center">Early Stage</TableHead>
                    <TableHead className="text-center">Growth</TableHead>
                    <TableHead className="text-center">Mature</TableHead>
                    <TableHead>Why</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentMatrix.rows.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{row.ratio}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {getRatingIcon(row.earlyRating)}
                          <span className="text-sm">{row.early}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {getRatingIcon(row.growthRating)}
                          <span className="text-sm">{row.growth}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {getRatingIcon(row.matureRating)}
                          <span className="text-sm">{row.mature}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.why}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border bg-muted/30">
                <h4 className="text-sm font-bold mb-2">How Professionals Interpret</h4>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Instead of:</span> "This company has a high current ratio"
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Say:</span> "This current ratio is high relative to what is optimal at this phase, implying idle capital or pre-deployment cash."
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-lg border bg-muted/30">
                <h4 className="text-sm font-bold mb-2">ROIC Context</h4>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Instead of:</span> "ROIC is negative"
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Say:</span> "ROIC is negative before commercialization, which is acceptable if incremental ROIC inflects above WACC post-deployment."
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-green-500">●</span>
                <span className="text-muted-foreground">Expected / Healthy</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-500">●</span>
                <span className="text-muted-foreground">Context-Dependent</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-500">●</span>
                <span className="text-muted-foreground">Structural Red Flag</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">○</span>
                <span className="text-muted-foreground">N/A</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500/30 border border-green-500/50" />
            <span className="text-muted-foreground">Healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-500/30 border border-yellow-500/50" />
            <span className="text-muted-foreground">Caution</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500/30 border border-red-500/50" />
            <span className="text-muted-foreground">Concern</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
