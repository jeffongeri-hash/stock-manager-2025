import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface RatioData {
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
}

interface InstitutionalRatiosProps {
  ratios: RatioData;
  sector?: 'utility' | 'infrastructure' | 'growth' | 'general';
}

type RatingLevel = 'good' | 'warning' | 'danger' | 'neutral';

interface RatioConfig {
  label: string;
  value: number | undefined;
  format: (v: number) => string;
  getRating: (v: number, sector: string) => RatingLevel;
  description: string;
  benchmark: string;
}

const getRatingColor = (rating: RatingLevel): string => {
  switch (rating) {
    case 'good': return 'text-green-500';
    case 'warning': return 'text-yellow-500';
    case 'danger': return 'text-red-500';
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

export const InstitutionalRatios: React.FC<InstitutionalRatiosProps> = ({ 
  ratios, 
  sector = 'general' 
}) => {
  // Capital Structure Ratios
  const capitalStructureRatios: RatioConfig[] = [
    {
      label: 'Debt / Equity',
      value: ratios.debtToEquity,
      format: (v) => v.toFixed(2),
      getRating: (v, s) => {
        if (s === 'utility') return v <= 1.5 ? 'good' : v <= 2.5 ? 'warning' : 'danger';
        if (s === 'growth') return v <= 0.3 ? 'good' : v <= 0.8 ? 'warning' : 'danger';
        return v <= 1.0 ? 'good' : v <= 2.0 ? 'warning' : 'danger';
      },
      description: 'Financial leverage relative to shareholder capital. High D/E with unstable cash flows indicates equity optionality collapse risk.',
      benchmark: 'Utilities: 0.8-1.5, Pre-revenue: <0.3'
    },
    {
      label: 'Net Debt / EBITDA',
      value: ratios.netDebtToEbitda,
      format: (v) => `${v.toFixed(1)}×`,
      getRating: (v) => v <= 3 ? 'good' : v <= 4 ? 'warning' : 'danger',
      description: 'Core solvency metric used by lenders. Measures debt load relative to operating cash earnings.',
      benchmark: '<3× conservative, 3-4× acceptable, >5× distress risk'
    },
    {
      label: 'Debt / Capital',
      value: ratios.debtToCapital,
      format: (v) => `${(v * 100).toFixed(0)}%`,
      getRating: (v) => v <= 0.5 ? 'good' : v <= 0.6 ? 'warning' : 'danger',
      description: 'Debt ÷ (Debt + Equity). Preferred by credit analysts for capital structure assessment.',
      benchmark: 'Utilities norm: 40-60%'
    }
  ];

  // Liquidity & Solvency Ratios
  const liquidityRatios: RatioConfig[] = [
    {
      label: 'Current Ratio',
      value: ratios.currentRatio,
      format: (v) => v.toFixed(2),
      getRating: (v, s) => {
        if (s === 'growth') return v >= 2 ? 'good' : v >= 1.5 ? 'warning' : 'danger';
        return v >= 0.8 && v <= 1.3 ? 'good' : v >= 0.6 ? 'warning' : 'danger';
      },
      description: 'Current assets ÷ current liabilities. Too low = liquidity risk, too high = inefficient capital allocation.',
      benchmark: 'Utilities: 0.8-1.3, Early-stage: >2'
    },
    {
      label: 'Quick Ratio',
      value: ratios.quickRatio,
      format: (v) => v.toFixed(2),
      getRating: (v) => v >= 1 ? 'good' : v >= 0.7 ? 'warning' : 'danger',
      description: '(Cash + equivalents + receivables) ÷ current liabilities. Gold standard liquidity ratio for pre-revenue firms.',
      benchmark: '>1.0 preferred for stability'
    },
    {
      label: 'Cash Runway',
      value: ratios.cashRunwayMonths,
      format: (v) => `${v.toFixed(0)} mo`,
      getRating: (v) => v >= 24 ? 'good' : v >= 12 ? 'warning' : 'danger',
      description: 'Cash ÷ annual operating cash burn. Institutions explicitly calculate this metric.',
      benchmark: '<12mo = dilution risk, 24-36mo = strategic flexibility'
    }
  ];

  // Profitability & Capital Efficiency
  const profitabilityRatios: RatioConfig[] = [
    {
      label: 'ROIC',
      value: ratios.roic,
      format: (v) => `${(v * 100).toFixed(1)}%`,
      getRating: (v, s) => {
        if (s === 'utility') return v >= 0.06 ? 'good' : v >= 0.04 ? 'warning' : 'danger';
        return v >= 0.10 ? 'good' : v >= 0.06 ? 'warning' : 'danger';
      },
      description: 'Most important long-term ratio. ROIC > WACC = value creation, ROIC < WACC = value destruction.',
      benchmark: 'Utilities: 6-9%, Growth: >10% required'
    },
    {
      label: 'ROE',
      value: ratios.roe,
      format: (v) => `${(v * 100).toFixed(1)}%`,
      getRating: (v) => v >= 0.15 ? 'good' : v >= 0.10 ? 'warning' : 'danger',
      description: 'Net income ÷ equity. Inflated by leverage—use carefully in utilities where leverage is structural.',
      benchmark: '>15% strong, 10-15% acceptable'
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
      benchmark: 'Utilities: 2-5%'
    },
    {
      label: 'Incremental ROIC',
      value: ratios.incrementalRoic,
      format: (v) => `${(v * 100).toFixed(1)}%`,
      getRating: (v) => v >= 0.12 ? 'good' : v >= 0.08 ? 'warning' : 'danger',
      description: 'Return on new capital deployed. Separates good growth from bad growth.',
      benchmark: '>12% indicates quality capital allocation'
    }
  ];

  // Growth Metrics
  const growthRatios: RatioConfig[] = [
    {
      label: 'Revenue CAGR',
      value: ratios.revenueCAGR,
      format: (v) => `${(v * 100).toFixed(1)}%`,
      getRating: (v, s) => {
        if (s === 'utility') return v >= 0.02 ? 'good' : v >= 0 ? 'warning' : 'danger';
        return v >= 0.10 ? 'good' : v >= 0.05 ? 'warning' : 'danger';
      },
      description: 'Business traction indicator. Growth without durability is speculation.',
      benchmark: 'Utilities: 2-6%, Growth: >10%'
    },
    {
      label: 'FCF CAGR',
      value: ratios.fcfCAGR,
      format: (v) => `${(v * 100).toFixed(1)}%`,
      getRating: (v) => v >= 0.08 ? 'good' : v >= 0.03 ? 'warning' : 'danger',
      description: 'Business quality indicator. High CAGR + low ROIC = capital destruction.',
      benchmark: '>8% indicates compounding quality'
    },
    {
      label: 'EPS CAGR',
      value: ratios.epsCAGR,
      format: (v) => `${(v * 100).toFixed(1)}%`,
      getRating: (v) => v >= 0.08 ? 'good' : v >= 0.03 ? 'warning' : 'danger',
      description: 'Shareholder outcome metric. Always pair with share count CAGR.',
      benchmark: '>8% strong shareholder returns'
    },
    {
      label: 'Share Count CAGR',
      value: ratios.shareCountCAGR,
      format: (v) => `${(v * 100).toFixed(1)}%`,
      getRating: (v) => v <= 0.02 ? 'good' : v <= 0.05 ? 'warning' : 'danger',
      description: 'Dilution indicator. If revenue grows 20% but shares grow 15%, real growth is 5%.',
      benchmark: '<2% minimal dilution'
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
      benchmark: 'Should converge to ~1 over time'
    },
    {
      label: 'FCF Yield',
      value: ratios.fcfYield,
      format: (v) => `${(v * 100).toFixed(1)}%`,
      getRating: (v) => v >= 0.06 ? 'good' : v >= 0.04 ? 'warning' : v >= 0 ? 'neutral' : 'danger',
      description: 'FCF ÷ market cap. Negative FCF acceptable only during build-out phase.',
      benchmark: 'Utilities: 4-8%'
    },
    {
      label: 'CapEx / Revenue',
      value: ratios.capexToRevenue,
      format: (v) => `${(v * 100).toFixed(0)}%`,
      getRating: (v, s) => {
        if (s === 'utility') return v <= 0.25 ? 'good' : v <= 0.40 ? 'warning' : 'neutral';
        return v <= 0.15 ? 'good' : v <= 0.25 ? 'warning' : 'neutral';
      },
      description: 'Capital intensity indicator. Watch maintenance vs growth CapEx once disclosed.',
      benchmark: 'Utilities are inherently CapEx heavy'
    }
  ];

  // Valuation Ratios
  const valuationRatios: RatioConfig[] = [
    {
      label: 'EV / EBITDA',
      value: ratios.evToEbitda,
      format: (v) => `${v.toFixed(1)}×`,
      getRating: (v, s) => {
        if (s === 'utility') return v <= 12 ? 'good' : v <= 18 ? 'warning' : 'danger';
        return v <= 15 ? 'good' : v <= 25 ? 'warning' : 'danger';
      },
      description: 'Core utility valuation metric. Pre-revenue companies require narrative-driven valuation.',
      benchmark: 'Regulated utilities: 8-12×, Growth: 12-18×'
    },
    {
      label: 'Price / Book',
      value: ratios.priceToBook,
      format: (v) => `${v.toFixed(2)}×`,
      getRating: (v) => v <= 2.5 ? 'good' : v <= 4 ? 'warning' : 'danger',
      description: 'Works well for asset-heavy industries. Above benchmark requires growth optionality.',
      benchmark: 'Utilities: 1.2-2.5×'
    },
    {
      label: 'Price / Sales',
      value: ratios.priceToSales,
      format: (v) => `${v.toFixed(2)}×`,
      getRating: (v) => v <= 3 ? 'good' : v <= 6 ? 'warning' : 'danger',
      description: 'Used when earnings are absent. Dangerous if not paired with margin trajectory.',
      benchmark: 'Pair with: What will steady-state margins be?'
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
      benchmark: 'Utilities want >3×'
    },
    {
      label: 'Fixed-Charge Coverage',
      value: ratios.fixedChargeCoverage,
      format: (v) => `${v.toFixed(1)}×`,
      getRating: (v) => v >= 2.5 ? 'good' : v >= 1.5 ? 'warning' : 'danger',
      description: 'Includes lease obligations. Important for infrastructure firms.',
      benchmark: '>2.5× preferred'
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
      benchmark: 'Low for utilities, trend is key'
    }
  ];

  const renderRatioSection = (ratios: RatioConfig[], sectorType: string) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {ratios.map((ratio, i) => (
        <RatioCard
          key={i}
          label={ratio.label}
          value={ratio.value}
          format={ratio.format}
          rating={ratio.value !== undefined ? ratio.getRating(ratio.value, sectorType) : 'neutral'}
          description={ratio.description}
          benchmark={ratio.benchmark}
        />
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Institutional-Grade Financial Ratios</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Comprehensive analysis framework used by institutional investors
            </p>
          </div>
          <Badge variant="outline" className="capitalize">{sector}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="capital" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 mb-6">
            <TabsTrigger value="capital" className="text-xs">Capital</TabsTrigger>
            <TabsTrigger value="liquidity" className="text-xs">Liquidity</TabsTrigger>
            <TabsTrigger value="profitability" className="text-xs">Profit</TabsTrigger>
            <TabsTrigger value="growth" className="text-xs">Growth</TabsTrigger>
            <TabsTrigger value="cashflow" className="text-xs">Cash Flow</TabsTrigger>
            <TabsTrigger value="valuation" className="text-xs">Valuation</TabsTrigger>
            <TabsTrigger value="institutional" className="text-xs">Other</TabsTrigger>
          </TabsList>

          <TabsContent value="capital" className="mt-0">
            <SectionHeader 
              title="Capital Structure Ratios" 
              subtitle="Who gets paid first, and how fragile is the equity?"
            />
            {renderRatioSection(capitalStructureRatios, sector)}
          </TabsContent>

          <TabsContent value="liquidity" className="mt-0">
            <SectionHeader 
              title="Liquidity & Solvency Ratios" 
              subtitle="Can the company survive the next 12–24 months without external funding?"
            />
            {renderRatioSection(liquidityRatios, sector)}
          </TabsContent>

          <TabsContent value="profitability" className="mt-0">
            <SectionHeader 
              title="Profitability & Capital Efficiency" 
              subtitle="How well does management turn capital into returns?"
            />
            {renderRatioSection(profitabilityRatios, sector)}
          </TabsContent>

          <TabsContent value="growth" className="mt-0">
            <SectionHeader 
              title="Growth Metrics (CAGR & Quality)" 
              subtitle="Growth without durability is speculation"
            />
            {renderRatioSection(growthRatios, sector)}
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
            {renderRatioSection(cashFlowRatios, sector)}
          </TabsContent>

          <TabsContent value="valuation" className="mt-0">
            <SectionHeader 
              title="Valuation Ratios" 
              subtitle="Contextual, not absolute—always consider sector norms"
            />
            {renderRatioSection(valuationRatios, sector)}
          </TabsContent>

          <TabsContent value="institutional" className="mt-0">
            <SectionHeader 
              title="Ratios Institutional Investors Watch" 
              subtitle="Often missed by retail investors"
            />
            {renderRatioSection(institutionalRatios, sector)}
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
