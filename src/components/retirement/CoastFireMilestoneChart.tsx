import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, Area, ComposedChart
} from 'recharts';
import { Trophy, Target, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';

interface CoastFireMilestone {
  amount: number;
  label: string;
  color: string;
}

const DEFAULT_MILESTONES: CoastFireMilestone[] = [
  { amount: 50000, label: '$50K', color: '#22c55e' },
  { amount: 100000, label: '$100K', color: '#06b6d4' },
  { amount: 250000, label: '$250K', color: '#8b5cf6' },
  { amount: 500000, label: '$500K', color: '#f59e0b' },
  { amount: 750000, label: '$750K', color: '#ec4899' },
  { amount: 1000000, label: '$1M', color: '#ef4444' },
];

interface CoastFireMilestoneChartProps {
  currentSavings: number;
  currentAge: number;
  targetRetirementAge?: number;
  expectedReturn?: number;
  monthlyContribution?: number;
  annualSpending?: number;
  milestones?: CoastFireMilestone[];
}

export const CoastFireMilestoneChart: React.FC<CoastFireMilestoneChartProps> = ({
  currentSavings,
  currentAge,
  targetRetirementAge = 65,
  expectedReturn = 7,
  monthlyContribution = 1000,
  annualSpending = 60000,
  milestones = DEFAULT_MILESTONES,
}) => {
  const fireNumber = annualSpending * 25; // 4% rule

  // Calculate at what age each milestone enables Coast FIRE
  const milestoneData = useMemo(() => {
    const monthlyReturn = expectedReturn / 100 / 12;
    
    return milestones.map(milestone => {
      // Calculate how long it takes for this milestone to grow to FIRE number
      // FV = PV * (1 + r)^n => n = ln(FV/PV) / ln(1+r)
      const yearsToGrow = Math.log(fireNumber / milestone.amount) / Math.log(1 + expectedReturn / 100);
      const coastFireAge = Math.round(targetRetirementAge - yearsToGrow);
      
      // Calculate when the user will reach this milestone
      let savings = currentSavings;
      let monthsToReach = 0;
      const maxMonths = 600; // 50 years max
      
      if (currentSavings >= milestone.amount) {
        monthsToReach = 0;
      } else {
        while (savings < milestone.amount && monthsToReach < maxMonths) {
          savings = savings * (1 + monthlyReturn) + monthlyContribution;
          monthsToReach++;
        }
      }
      
      const ageAtMilestone = currentSavings >= milestone.amount 
        ? currentAge 
        : currentAge + (monthsToReach / 12);
      
      const isAchieved = currentSavings >= milestone.amount;
      const yearsUntilMilestone = isAchieved ? 0 : monthsToReach / 12;
      
      return {
        ...milestone,
        coastFireAge: Math.max(18, coastFireAge),
        ageAtMilestone: Math.round(ageAtMilestone * 10) / 10,
        yearsUntilMilestone: Math.round(yearsUntilMilestone * 10) / 10,
        isAchieved,
        yearsToGrow: Math.round(yearsToGrow * 10) / 10,
      };
    });
  }, [currentSavings, currentAge, targetRetirementAge, expectedReturn, monthlyContribution, milestones, fireNumber]);

  // Calculate projection data for chart
  const projectionData = useMemo(() => {
    const data = [];
    let savings = currentSavings;
    const monthlyReturn = expectedReturn / 100 / 12;
    
    for (let age = currentAge; age <= Math.min(targetRetirementAge + 5, 80); age++) {
      // Calculate what Coast FIRE target would be at this age
      const yearsToRetirement = targetRetirementAge - age;
      const coastTarget = yearsToRetirement > 0 
        ? fireNumber / Math.pow(1 + expectedReturn / 100, yearsToRetirement)
        : fireNumber;
      
      const isCoastFire = savings >= coastTarget;
      
      data.push({
        age,
        savings: Math.round(savings),
        coastTarget: Math.round(coastTarget),
        fireNumber,
        isCoastFire,
      });
      
      // Grow savings for next year
      for (let month = 0; month < 12; month++) {
        savings = savings * (1 + monthlyReturn) + monthlyContribution;
      }
    }
    
    return data;
  }, [currentSavings, currentAge, targetRetirementAge, expectedReturn, monthlyContribution, fireNumber]);

  // Find the age at which user reaches Coast FIRE
  const coastFireAchievedAge = projectionData.find(d => d.isCoastFire)?.age || null;
  const currentCoastTarget = milestoneData.find(m => !m.isAchieved);
  const achievedMilestones = milestoneData.filter(m => m.isAchieved);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Coast FIRE Milestones
        </CardTitle>
        <CardDescription>
          Track when your savings enable you to "coast" to retirement - where your investments grow to your FIRE number without additional contributions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Achievement Banner */}
        {coastFireAchievedAge && coastFireAchievedAge <= currentAge && (
          <div className="p-4 bg-gradient-to-r from-green-500/20 to-cyan-500/20 border border-green-500/30 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="font-bold text-lg text-green-700 dark:text-green-400">
                  🎉 You've Reached Coast FIRE!
                </p>
                <p className="text-sm text-muted-foreground">
                  Your current savings of {formatCurrency(currentSavings)} will grow to your FIRE number 
                  of {formatCurrency(fireNumber)} by age {targetRetirementAge} without any additional contributions!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Milestone Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {milestoneData.map((milestone) => (
            <div 
              key={milestone.amount}
              className={`p-3 rounded-lg border text-center transition-all ${
                milestone.isAchieved 
                  ? 'bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30 shadow-sm' 
                  : 'bg-muted/30 border-muted'
              }`}
            >
              {milestone.isAchieved && (
                <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto mb-1" />
              )}
              <p className="font-bold text-lg" style={{ color: milestone.isAchieved ? milestone.color : undefined }}>
                {milestone.label}
              </p>
              <p className="text-xs text-muted-foreground">
                Coast @ Age {milestone.coastFireAge}
              </p>
              {!milestone.isAchieved && (
                <p className="text-xs text-muted-foreground mt-1">
                  ~{milestone.yearsUntilMilestone.toFixed(1)} yrs
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Encouragement Message */}
        {achievedMilestones.length > 0 && !coastFireAchievedAge && (
          <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">
                  Amazing Progress! You've hit {achievedMilestones.length} milestone{achievedMilestones.length > 1 ? 's' : ''}!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  With {formatCurrency(currentSavings)} invested, you've already unlocked Coast FIRE starting at age {achievedMilestones[achievedMilestones.length - 1].coastFireAge}. 
                  {currentCoastTarget && (
                    <> Keep going! Next milestone: {currentCoastTarget.label} in ~{currentCoastTarget.yearsUntilMilestone.toFixed(1)} years.</>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="age" 
                label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === 'savings' ? 'Your Savings' : 
                  name === 'coastTarget' ? 'Coast FIRE Target' :
                  'FIRE Number'
                ]}
                labelFormatter={(label) => `Age ${label}`}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Area
                type="monotone"
                dataKey="savings"
                name="Your Savings"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="coastTarget"
                name="Coast FIRE Target"
                stroke="#06b6d4"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
              <ReferenceLine 
                y={fireNumber} 
                stroke="#f59e0b" 
                strokeDasharray="3 3" 
                label={{ 
                  value: `FIRE: ${formatCurrency(fireNumber)}`, 
                  position: 'right',
                  fill: '#f59e0b',
                  fontSize: 11
                }} 
              />
              <ReferenceLine 
                x={currentAge} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="3 3"
                label={{
                  value: 'Today',
                  position: 'top',
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 11
                }}
              />
              {coastFireAchievedAge && coastFireAchievedAge > currentAge && (
                <ReferenceLine 
                  x={coastFireAchievedAge} 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  label={{
                    value: `Coast FIRE @ ${coastFireAchievedAge}`,
                    position: 'top',
                    fill: '#22c55e',
                    fontSize: 11
                  }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span>Your Savings Projection</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#06b6d4]"></div>
            <span>Coast FIRE Target (declining over time)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
            <span>Full FIRE Number ({formatCurrency(fireNumber)})</span>
          </div>
        </div>

        {/* Explanation */}
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Target className="h-4 w-4" />
            How Coast FIRE Works
          </h4>
          <p className="text-sm text-muted-foreground">
            Coast FIRE means you have enough invested that compound growth will carry you to your full FIRE number by retirement age, 
            even if you stop contributing. The Coast FIRE target line shows the minimum you need at each age - 
            <strong> when your savings cross above it, you've reached Coast FIRE!</strong> This is a powerful milestone that means 
            you could switch to lower-paying work you love or reduce hours without jeopardizing your retirement.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Based on {expectedReturn}% expected returns and a FIRE number of {formatCurrency(fireNumber)} 
            (25x your ${(annualSpending / 1000).toFixed(0)}K annual spending).
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CoastFireMilestoneChart;
