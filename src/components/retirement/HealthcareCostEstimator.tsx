import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { Heart, DollarSign, TrendingUp, AlertTriangle, Info, Calculator, Shield } from 'lucide-react';

// 2024 Medicare costs (updated annually)
const MEDICARE_COSTS_2024 = {
  partA: {
    premium: 0, // Most people don't pay (40+ quarters of work)
    premiumNoCredits: 505, // Monthly if < 30 quarters
    deductible: 1632, // Per benefit period
    coinsurance: {
      days1to60: 0,
      days61to90: 408, // Per day
      days91to150: 816, // Lifetime reserve days
    }
  },
  partB: {
    standardPremium: 174.70, // Monthly for 2024
    deductible: 240, // Annual
    coinsurance: 0.20, // 20% after deductible
    irmaaThresholds: [
      { single: 103000, married: 206000, premium: 174.70 },
      { single: 129000, married: 258000, premium: 244.60 },
      { single: 161000, married: 322000, premium: 349.40 },
      { single: 193000, married: 386000, premium: 454.20 },
      { single: 500000, married: 750000, premium: 559.00 },
      { single: Infinity, married: Infinity, premium: 594.00 },
    ]
  },
  partD: {
    averagePremium: 55.50, // National average
    deductible: 545, // Maximum for 2024
    donutHole: {
      start: 5030,
      end: 8000,
      genericDiscount: 0.25,
      brandDiscount: 0.25
    },
    catastrophicThreshold: 8000,
    irmaaThresholds: [
      { single: 103000, married: 206000, surcharge: 0 },
      { single: 129000, married: 258000, surcharge: 12.90 },
      { single: 161000, married: 322000, surcharge: 33.30 },
      { single: 193000, married: 386000, surcharge: 53.80 },
      { single: 500000, married: 750000, surcharge: 74.20 },
      { single: Infinity, married: Infinity, surcharge: 81.00 },
    ]
  },
  medigap: {
    planF: { average: 180, range: [120, 350] },
    planG: { average: 150, range: [100, 300] },
    planN: { average: 120, range: [80, 250] },
  }
};

const HEALTHCARE_INFLATION = 0.055; // 5.5% average healthcare inflation

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function HealthcareCostEstimator() {
  const [currentAge, setCurrentAge] = useState(55);
  const [retirementAge, setRetirementAge] = useState(65);
  const [lifeExpectancy, setLifeExpectancy] = useState(90);
  const [annualIncome, setAnnualIncome] = useState(80000);
  const [filingStatus, setFilingStatus] = useState<'single' | 'married'>('married');
  const [healthStatus, setHealthStatus] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [medigapPlan, setMedigapPlan] = useState<'none' | 'planF' | 'planG' | 'planN'>('planG');
  const [includeVision, setIncludeVision] = useState(true);
  const [includeDental, setIncludeDental] = useState(true);
  const [includeHearing, setIncludeHearing] = useState(false);
  const [prescriptionTier, setPrescriptionTier] = useState<'low' | 'medium' | 'high'>('medium');
  const [longTermCareInsurance, setLongTermCareInsurance] = useState(false);

  const calculations = useMemo(() => {
    // Calculate IRMAA surcharges
    const getPartBPremium = () => {
      for (const tier of MEDICARE_COSTS_2024.partB.irmaaThresholds) {
        const threshold = filingStatus === 'single' ? tier.single : tier.married;
        if (annualIncome <= threshold) return tier.premium;
      }
      return MEDICARE_COSTS_2024.partB.irmaaThresholds[5].premium;
    };

    const getPartDSurcharge = () => {
      for (const tier of MEDICARE_COSTS_2024.partD.irmaaThresholds) {
        const threshold = filingStatus === 'single' ? tier.single : tier.married;
        if (annualIncome <= threshold) return tier.surcharge;
      }
      return MEDICARE_COSTS_2024.partD.irmaaThresholds[5].surcharge;
    };

    // Health status multipliers for out-of-pocket costs
    const healthMultipliers = {
      excellent: 0.7,
      good: 1.0,
      fair: 1.4,
      poor: 2.0
    };

    // Prescription costs by tier
    const prescriptionCosts = {
      low: 600,
      medium: 1800,
      high: 4500
    };

    // Base annual costs
    const partBPremium = getPartBPremium() * 12;
    const partDPremium = (MEDICARE_COSTS_2024.partD.averagePremium + getPartDSurcharge()) * 12;
    
    const medigapPremium = medigapPlan !== 'none' 
      ? MEDICARE_COSTS_2024.medigap[medigapPlan].average * 12 
      : 0;

    // Out-of-pocket estimates
    const baseOutOfPocket = 2500 * healthMultipliers[healthStatus];
    const prescriptionOutOfPocket = prescriptionCosts[prescriptionTier] * healthMultipliers[healthStatus];
    
    // Additional coverage
    const visionCost = includeVision ? 300 : 0;
    const dentalCost = includeDental ? 600 : 0;
    const hearingCost = includeHearing ? 400 : 0;
    const ltcCost = longTermCareInsurance ? 3000 : 0;

    // Pre-65 costs (if retiring before Medicare eligibility)
    const yearsBeforeMedicare = Math.max(0, 65 - retirementAge);
    const marketplacePremium = 800 * 12; // Average ACA premium estimate
    const pre65AnnualCost = marketplacePremium + 3000; // Premium + out-of-pocket

    // Total first year Medicare costs
    const firstYearMedicareCosts = 
      partBPremium + 
      partDPremium + 
      medigapPremium + 
      baseOutOfPocket + 
      prescriptionOutOfPocket +
      visionCost + 
      dentalCost + 
      hearingCost +
      ltcCost;

    // Project costs over retirement
    const projectedCosts = [];
    let cumulativeTotal = 0;
    const yearsInRetirement = lifeExpectancy - retirementAge;

    for (let year = 0; year <= yearsInRetirement; year++) {
      const age = retirementAge + year;
      const yearsFromNow = year;
      
      let annualCost;
      if (age < 65) {
        // Pre-Medicare costs
        annualCost = pre65AnnualCost * Math.pow(1 + HEALTHCARE_INFLATION, yearsFromNow);
      } else {
        // Medicare costs with inflation
        const medicareYears = age - 65;
        annualCost = firstYearMedicareCosts * Math.pow(1 + HEALTHCARE_INFLATION, medicareYears + yearsFromNow);
      }
      
      // Add age-related healthcare increase (costs tend to rise with age)
      const ageMultiplier = 1 + (Math.max(0, age - 75) * 0.02);
      annualCost *= ageMultiplier;
      
      cumulativeTotal += annualCost;
      
      projectedCosts.push({
        age,
        year: new Date().getFullYear() + yearsFromNow,
        annualCost: Math.round(annualCost),
        cumulativeCost: Math.round(cumulativeTotal),
        monthly: Math.round(annualCost / 12)
      });
    }

    // Cost breakdown for pie chart
    const costBreakdown = [
      { name: 'Part B Premium', value: Math.round(partBPremium), color: CHART_COLORS[0] },
      { name: 'Part D Premium', value: Math.round(partDPremium), color: CHART_COLORS[1] },
      { name: 'Medigap', value: Math.round(medigapPremium), color: CHART_COLORS[2] },
      { name: 'Out-of-Pocket', value: Math.round(baseOutOfPocket + prescriptionOutOfPocket), color: CHART_COLORS[3] },
      { name: 'Other Coverage', value: Math.round(visionCost + dentalCost + hearingCost + ltcCost), color: CHART_COLORS[4] },
    ].filter(item => item.value > 0);

    return {
      partBPremium,
      partDPremium,
      medigapPremium,
      baseOutOfPocket,
      prescriptionOutOfPocket,
      visionCost,
      dentalCost,
      hearingCost,
      ltcCost,
      firstYearMedicareCosts,
      pre65AnnualCost,
      yearsBeforeMedicare,
      projectedCosts,
      costBreakdown,
      lifetimeTotal: cumulativeTotal,
      hasIRMAA: annualIncome > (filingStatus === 'single' ? 103000 : 206000)
    };
  }, [currentAge, retirementAge, lifeExpectancy, annualIncome, filingStatus, healthStatus, medigapPlan, includeVision, includeDental, includeHearing, prescriptionTier, longTermCareInsurance]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Healthcare Cost Estimator</h2>
      </div>
      
      <p className="text-muted-foreground">
        Estimate your healthcare costs in retirement, including Medicare premiums, supplemental insurance, and out-of-pocket expenses.
      </p>

      <Tabs defaultValue="inputs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inputs">Your Info</TabsTrigger>
          <TabsTrigger value="medicare">Medicare Details</TabsTrigger>
          <TabsTrigger value="projections">Cost Projections</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="inputs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Age: {currentAge}</Label>
                  <Slider
                    value={[currentAge]}
                    onValueChange={(v) => setCurrentAge(v[0])}
                    min={40}
                    max={80}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Retirement Age: {retirementAge}</Label>
                  <Slider
                    value={[retirementAge]}
                    onValueChange={(v) => setRetirementAge(v[0])}
                    min={55}
                    max={75}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Life Expectancy: {lifeExpectancy}</Label>
                  <Slider
                    value={[lifeExpectancy]}
                    onValueChange={(v) => setLifeExpectancy(v[0])}
                    min={75}
                    max={100}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Annual Income in Retirement</Label>
                  <Input
                    type="number"
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(Number(e.target.value))}
                    placeholder="80000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used to calculate IRMAA surcharges for Medicare Parts B & D
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Filing Status</Label>
                  <Select value={filingStatus} onValueChange={(v) => setFilingStatus(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married Filing Jointly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Health Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Health Status</Label>
                  <Select value={healthStatus} onValueChange={(v) => setHealthStatus(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Affects estimated out-of-pocket medical costs
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Prescription Drug Usage</Label>
                  <Select value={prescriptionTier} onValueChange={(v) => setPrescriptionTier(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (generic only, few medications)</SelectItem>
                      <SelectItem value="medium">Medium (some brand-name, regular use)</SelectItem>
                      <SelectItem value="high">High (specialty drugs, multiple medications)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Medigap (Supplement) Plan</Label>
                  <Select value={medigapPlan} onValueChange={(v) => setMedigapPlan(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Medigap (Original Medicare only)</SelectItem>
                      <SelectItem value="planG">Plan G (Most popular, ~$150/mo)</SelectItem>
                      <SelectItem value="planN">Plan N (Lower premium, copays)</SelectItem>
                      <SelectItem value="planF">Plan F (Most comprehensive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 pt-2">
                  <Label>Additional Coverage</Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant={includeVision ? "default" : "outline"} 
                      className="cursor-pointer"
                      onClick={() => setIncludeVision(!includeVision)}
                    >
                      Vision (~$300/yr)
                    </Badge>
                    <Badge 
                      variant={includeDental ? "default" : "outline"} 
                      className="cursor-pointer"
                      onClick={() => setIncludeDental(!includeDental)}
                    >
                      Dental (~$600/yr)
                    </Badge>
                    <Badge 
                      variant={includeHearing ? "default" : "outline"} 
                      className="cursor-pointer"
                      onClick={() => setIncludeHearing(!includeHearing)}
                    >
                      Hearing (~$400/yr)
                    </Badge>
                    <Badge 
                      variant={longTermCareInsurance ? "default" : "outline"} 
                      className="cursor-pointer"
                      onClick={() => setLongTermCareInsurance(!longTermCareInsurance)}
                    >
                      Long-Term Care (~$3,000/yr)
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">First Year Medicare Costs</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(calculations.firstYearMedicareCosts)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(calculations.firstYearMedicareCosts / 12)}/month
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Lifetime Healthcare Costs</p>
                  <p className="text-3xl font-bold text-destructive">
                    {formatCurrency(calculations.lifetimeTotal)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Over {lifeExpectancy - retirementAge} years
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Monthly Part B Premium</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(calculations.partBPremium / 12)}
                  </p>
                  {calculations.hasIRMAA && (
                    <Badge variant="destructive" className="mt-1">IRMAA Surcharge</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Pre-65 Annual Cost</p>
                  <p className="text-3xl font-bold text-yellow-500">
                    {calculations.yearsBeforeMedicare > 0 
                      ? formatCurrency(calculations.pre65AnnualCost)
                      : 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {calculations.yearsBeforeMedicare > 0 
                      ? `${calculations.yearsBeforeMedicare} years before Medicare`
                      : 'Medicare eligible at retirement'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cost Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Annual Cost Breakdown (at Medicare Age)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={calculations.costBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {calculations.costBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medicare" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Medicare Part A (Hospital)
                </CardTitle>
                <CardDescription>Most people don't pay a premium if they worked 40+ quarters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Monthly Premium</p>
                    <p className="font-medium">{formatCurrency(MEDICARE_COSTS_2024.partA.premium)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Deductible (per benefit period)</p>
                    <p className="font-medium">{formatCurrency(MEDICARE_COSTS_2024.partA.deductible)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Days 1-60 Coinsurance</p>
                    <p className="font-medium">{formatCurrency(MEDICARE_COSTS_2024.partA.coinsurance.days1to60)}/day</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Days 61-90 Coinsurance</p>
                    <p className="font-medium">{formatCurrency(MEDICARE_COSTS_2024.partA.coinsurance.days61to90)}/day</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Medicare Part B (Medical)
                </CardTitle>
                <CardDescription>Covers doctor visits, outpatient care, preventive services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Standard Premium</p>
                    <p className="font-medium">{formatCurrency(MEDICARE_COSTS_2024.partB.standardPremium)}/mo</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Your Premium</p>
                    <p className="font-medium text-primary">{formatCurrency(calculations.partBPremium / 12)}/mo</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Annual Deductible</p>
                    <p className="font-medium">{formatCurrency(MEDICARE_COSTS_2024.partB.deductible)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Coinsurance</p>
                    <p className="font-medium">20% after deductible</p>
                  </div>
                </div>
                
                {calculations.hasIRMAA && (
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <p className="text-sm font-medium text-destructive">IRMAA Surcharge Applied</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your income exceeds the threshold, resulting in higher premiums.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Medicare Part D (Prescription Drugs)
                </CardTitle>
                <CardDescription>Optional coverage for prescription medications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Average Premium</p>
                    <p className="font-medium">{formatCurrency(MEDICARE_COSTS_2024.partD.averagePremium)}/mo</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Maximum Deductible</p>
                    <p className="font-medium">{formatCurrency(MEDICARE_COSTS_2024.partD.deductible)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Donut Hole Starts</p>
                    <p className="font-medium">{formatCurrency(MEDICARE_COSTS_2024.partD.donutHole.start)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Catastrophic Threshold</p>
                    <p className="font-medium">{formatCurrency(MEDICARE_COSTS_2024.partD.catastrophicThreshold)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  IRMAA Thresholds (2024)
                </CardTitle>
                <CardDescription>Income-Related Monthly Adjustment Amount</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Single</th>
                        <th className="text-left py-2">Married</th>
                        <th className="text-right py-2">Part B</th>
                        <th className="text-right py-2">Part D+</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MEDICARE_COSTS_2024.partB.irmaaThresholds.slice(0, 5).map((tier, i) => (
                        <tr key={i} className="border-b">
                          <td className="py-2">≤{formatCurrency(tier.single)}</td>
                          <td className="py-2">≤{formatCurrency(tier.married)}</td>
                          <td className="text-right py-2">{formatCurrency(tier.premium)}</td>
                          <td className="text-right py-2">+{formatCurrency(MEDICARE_COSTS_2024.partD.irmaaThresholds[i].surcharge)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Healthcare Costs Over Retirement
              </CardTitle>
              <CardDescription>
                Projected annual and cumulative healthcare expenses (assumes {(HEALTHCARE_INFLATION * 100).toFixed(1)}% healthcare inflation)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={calculations.projectedCosts}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="age" label={{ value: 'Age', position: 'bottom', offset: -5 }} />
                    <YAxis 
                      yAxisId="left"
                      tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        formatCurrency(value as number), 
                        name === 'annualCost' ? 'Annual Cost' : 'Cumulative Cost'
                      ]}
                    />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="annualCost" 
                      name="Annual Cost"
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="cumulativeCost" 
                      name="Cumulative Cost"
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost Projection by Age</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Age</th>
                      <th className="text-left py-2">Year</th>
                      <th className="text-right py-2">Annual Cost</th>
                      <th className="text-right py-2">Monthly</th>
                      <th className="text-right py-2">Cumulative</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculations.projectedCosts
                      .filter((_, i) => i % 5 === 0 || i === calculations.projectedCosts.length - 1)
                      .map((row) => (
                        <tr key={row.age} className="border-b">
                          <td className="py-2 font-medium">{row.age}</td>
                          <td className="py-2">{row.year}</td>
                          <td className="text-right py-2">{formatCurrency(row.annualCost)}</td>
                          <td className="text-right py-2">{formatCurrency(row.monthly)}</td>
                          <td className="text-right py-2 font-medium">{formatCurrency(row.cumulativeCost)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-primary/5">
              <CardContent className="pt-6">
                <div className="text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Cost at Age 70</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(calculations.projectedCosts.find(c => c.age === 70)?.annualCost || 0)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5">
              <CardContent className="pt-6">
                <div className="text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Cost at Age 80</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(calculations.projectedCosts.find(c => c.age === 80)?.annualCost || 0)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5">
              <CardContent className="pt-6">
                <div className="text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Cost at Age 90</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(calculations.projectedCosts.find(c => c.age === 90)?.annualCost || 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Medicare Enrollment Periods</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">Initial Enrollment Period (IEP)</p>
                  <p className="text-sm text-muted-foreground">
                    7-month period: 3 months before, the month of, and 3 months after your 65th birthday.
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">General Enrollment Period</p>
                  <p className="text-sm text-muted-foreground">
                    January 1 - March 31 each year. Coverage starts July 1. May have late penalties.
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">Special Enrollment Period (SEP)</p>
                  <p className="text-sm text-muted-foreground">
                    If you have employer coverage, you can enroll within 8 months of losing that coverage.
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">Medicare Advantage Open Enrollment</p>
                  <p className="text-sm text-muted-foreground">
                    October 15 - December 7 each year for the following year.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost-Saving Strategies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline">1</Badge>
                  <div>
                    <p className="font-medium">Manage IRMAA</p>
                    <p className="text-sm text-muted-foreground">
                      Plan Roth conversions and income timing to stay below IRMAA thresholds.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline">2</Badge>
                  <div>
                    <p className="font-medium">Compare Plans Annually</p>
                    <p className="text-sm text-muted-foreground">
                      Review Part D and Medicare Advantage plans each year during open enrollment.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline">3</Badge>
                  <div>
                    <p className="font-medium">Use Preventive Care</p>
                    <p className="text-sm text-muted-foreground">
                      Most preventive services are free under Medicare. Stay ahead of health issues.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline">4</Badge>
                  <div>
                    <p className="font-medium">Consider HSA Contributions</p>
                    <p className="text-sm text-muted-foreground">
                      Max out HSA before retirement to pay for qualified medical expenses tax-free.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline">5</Badge>
                  <div>
                    <p className="font-medium">Shop for Medigap Early</p>
                    <p className="text-sm text-muted-foreground">
                      Enroll during your open enrollment period for guaranteed issue and best rates.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Other Retirement Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span>Housing (mortgage/rent, maintenance)</span>
                    <span className="font-medium">25-35% of budget</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span>Food & Groceries</span>
                    <span className="font-medium">10-15% of budget</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span>Transportation</span>
                    <span className="font-medium">10-15% of budget</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span>Utilities & Insurance</span>
                    <span className="font-medium">5-10% of budget</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span>Travel & Entertainment</span>
                    <span className="font-medium">5-15% of budget</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span>Healthcare (covered above)</span>
                    <span className="font-medium">10-20% of budget</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Helpful Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <a 
                  href="https://www.medicare.gov" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <p className="font-medium text-primary">Medicare.gov</p>
                  <p className="text-sm text-muted-foreground">Official Medicare website</p>
                </a>
                <a 
                  href="https://www.ssa.gov" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <p className="font-medium text-primary">Social Security Administration</p>
                  <p className="text-sm text-muted-foreground">Benefits and enrollment information</p>
                </a>
                <a 
                  href="https://www.healthcare.gov" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <p className="font-medium text-primary">Healthcare.gov</p>
                  <p className="text-sm text-muted-foreground">Marketplace plans for pre-65 retirees</p>
                </a>
                <a 
                  href="https://www.shiphelp.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <p className="font-medium text-primary">SHIP (State Health Insurance Program)</p>
                  <p className="text-sm text-muted-foreground">Free Medicare counseling</p>
                </a>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
