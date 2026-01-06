import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend
} from 'recharts';
import { Landmark, TrendingUp, AlertCircle, Info } from 'lucide-react';

// 2024 bend points for PIA calculation
const BEND_POINT_1 = 1174;
const BEND_POINT_2 = 7078;

// Full retirement age by birth year
const getFullRetirementAge = (birthYear: number): number => {
  if (birthYear <= 1937) return 65;
  if (birthYear === 1938) return 65 + 2/12;
  if (birthYear === 1939) return 65 + 4/12;
  if (birthYear === 1940) return 65 + 6/12;
  if (birthYear === 1941) return 65 + 8/12;
  if (birthYear === 1942) return 65 + 10/12;
  if (birthYear >= 1943 && birthYear <= 1954) return 66;
  if (birthYear === 1955) return 66 + 2/12;
  if (birthYear === 1956) return 66 + 4/12;
  if (birthYear === 1957) return 66 + 6/12;
  if (birthYear === 1958) return 66 + 8/12;
  if (birthYear === 1959) return 66 + 10/12;
  return 67;
};

// Calculate adjustment for claiming age
const getClaimingAdjustment = (claimingAge: number, fra: number): number => {
  const monthsFromFRA = (claimingAge - fra) * 12;
  
  if (monthsFromFRA === 0) return 1;
  
  if (monthsFromFRA < 0) {
    // Early claiming - reduction
    const monthsEarly = Math.abs(monthsFromFRA);
    const first36Months = Math.min(monthsEarly, 36);
    const additionalMonths = Math.max(0, monthsEarly - 36);
    
    const reduction = (first36Months * 5/9 + additionalMonths * 5/12) / 100;
    return 1 - reduction;
  } else {
    // Delayed claiming - increase (8% per year)
    const yearsDelayed = monthsFromFRA / 12;
    return 1 + (yearsDelayed * 0.08);
  }
};

export const SocialSecurityEstimator: React.FC = () => {
  const [averageIncome, setAverageIncome] = useState(75000);
  const [birthYear, setBirthYear] = useState(1985);
  const [claimingAge, setClaimingAge] = useState(67);
  const [workYears, setWorkYears] = useState(35);

  const calculations = useMemo(() => {
    // Calculate AIME (Average Indexed Monthly Earnings)
    // Simplified: using current income as average over work years
    const annualEarnings = Math.min(averageIncome, 168600); // 2024 wage base cap
    const totalEarnings = annualEarnings * Math.min(workYears, 35);
    const aime = totalEarnings / (35 * 12); // Always divide by 35 years (420 months)

    // Calculate PIA using bend points
    let pia = 0;
    if (aime <= BEND_POINT_1) {
      pia = aime * 0.9;
    } else if (aime <= BEND_POINT_2) {
      pia = (BEND_POINT_1 * 0.9) + ((aime - BEND_POINT_1) * 0.32);
    } else {
      pia = (BEND_POINT_1 * 0.9) + ((BEND_POINT_2 - BEND_POINT_1) * 0.32) + ((aime - BEND_POINT_2) * 0.15);
    }

    const fra = getFullRetirementAge(birthYear);
    const adjustment = getClaimingAdjustment(claimingAge, fra);
    const monthlyBenefit = Math.round(pia * adjustment);
    const annualBenefit = monthlyBenefit * 12;

    // Calculate benefits at different ages
    const benefitsByAge = [];
    for (let age = 62; age <= 70; age++) {
      const adj = getClaimingAdjustment(age, fra);
      const monthly = Math.round(pia * adj);
      benefitsByAge.push({
        age,
        monthly,
        annual: monthly * 12,
        adjustment: Math.round(adj * 100),
        isFRA: Math.abs(age - fra) < 0.5,
        isSelected: age === claimingAge
      });
    }

    // Cumulative benefits over time
    const cumulativeData = [];
    for (let yearsAfter62 = 0; yearsAfter62 <= 30; yearsAfter62++) {
      const currentAge = 62 + yearsAfter62;
      
      // Calculate cumulative for each claiming age
      const at62 = currentAge >= 62 ? Math.max(0, currentAge - 62) * benefitsByAge[0].annual : 0;
      const atFRA = currentAge >= Math.round(fra) ? Math.max(0, currentAge - Math.round(fra)) * benefitsByAge.find(b => b.isFRA)?.annual || 0 : 0;
      const at70 = currentAge >= 70 ? Math.max(0, currentAge - 70) * benefitsByAge[8].annual : 0;
      
      cumulativeData.push({
        age: currentAge,
        'Claim at 62': at62,
        [`Claim at ${Math.round(fra)}`]: atFRA,
        'Claim at 70': at70
      });
    }

    return {
      aime: Math.round(aime),
      pia: Math.round(pia),
      fra,
      monthlyBenefit,
      annualBenefit,
      adjustment: Math.round(adjustment * 100),
      benefitsByAge,
      cumulativeData
    };
  }, [averageIncome, birthYear, claimingAge, workYears]);

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Input Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5" />
              Social Security Estimator
            </CardTitle>
            <CardDescription>
              Estimate your Social Security benefits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Average Annual Income (35 highest years)</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={averageIncome}
                  onChange={(e) => setAverageIncome(Number(e.target.value))}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                2024 wage cap: $168,600
              </p>
            </div>

            <div className="space-y-2">
              <Label>Birth Year</Label>
              <Select 
                value={birthYear.toString()} 
                onValueChange={(val) => setBirthYear(Number(val))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 50 }, (_, i) => 1955 + i).map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Years Worked: {workYears}</Label>
              <Slider
                value={[workYears]}
                onValueChange={(value) => setWorkYears(value[0])}
                min={10}
                max={45}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Claiming Age: {claimingAge}</Label>
              <Slider
                value={[claimingAge]}
                onValueChange={(value) => setClaimingAge(value[0])}
                min={62}
                max={70}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Earliest: 62</span>
                <span>FRA: {Math.round(calculations.fra)}</span>
                <span>Maximum: 70</span>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg space-y-3">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Estimated Monthly Benefit</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(calculations.monthlyBenefit)}
                </p>
                <Badge variant={calculations.adjustment >= 100 ? 'default' : 'secondary'} className="mt-1">
                  {calculations.adjustment}% of full benefit
                </Badge>
              </div>
              <div className="border-t border-blue-500/20 pt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Annual Benefit:</span>
                  <span className="font-medium">{formatCurrency(calculations.annualBenefit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Full Retirement Age:</span>
                  <span className="font-medium">{calculations.fra.toFixed(1)} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PIA (at FRA):</span>
                  <span className="font-medium">{formatCurrency(calculations.pia)}/mo</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                This is an estimate. Actual benefits depend on your complete earnings history. 
                Visit ssa.gov for an official estimate.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Benefits by Claiming Age Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Benefits by Claiming Age</CardTitle>
            <CardDescription>
              See how your monthly benefit changes based on when you claim
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={calculations.benefitsByAge}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="age" />
                  <YAxis tickFormatter={(value) => `$${(value/1000).toFixed(1)}k`} />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Monthly Benefit']}
                    labelFormatter={(label) => `Claiming Age: ${label}`}
                  />
                  <Bar dataKey="monthly" radius={[4, 4, 0, 0]}>
                    {calculations.benefitsByAge.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={entry.isSelected 
                          ? 'hsl(var(--primary))' 
                          : entry.isFRA 
                            ? '#22c55e' 
                            : 'hsl(var(--muted-foreground))'
                        }
                        fillOpacity={entry.isSelected ? 1 : 0.6}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              {[62, Math.round(calculations.fra), 70].map((age) => {
                const benefit = calculations.benefitsByAge.find(b => b.age === age);
                return benefit ? (
                  <div 
                    key={age}
                    className={`p-3 rounded-lg text-center ${
                      age === claimingAge 
                        ? 'bg-primary/10 border-2 border-primary' 
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-xs text-muted-foreground">
                      Age {age} {age === Math.round(calculations.fra) && '(FRA)'}
                    </p>
                    <p className="text-lg font-bold">{formatCurrency(benefit.monthly)}/mo</p>
                    <p className="text-xs text-muted-foreground">{benefit.adjustment}%</p>
                  </div>
                ) : null;
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cumulative Benefits Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Cumulative Lifetime Benefits
          </CardTitle>
          <CardDescription>
            Compare total benefits received based on different claiming ages (break-even analysis)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={calculations.cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="age" 
                  label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
                />
                <YAxis tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Claim at 62"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey={`Claim at ${Math.round(calculations.fra)}`}
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Claim at 70"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Break-Even Analysis</p>
                <p>
                  If you delay claiming from 62 to your FRA ({Math.round(calculations.fra)}), you'll break even around age {Math.round(78 + (calculations.fra - 66))}. 
                  Delaying to 70 typically breaks even around age {Math.round(82 + (calculations.fra - 66))}. 
                  If you expect to live longer, delaying usually results in higher lifetime benefits.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialSecurityEstimator;
