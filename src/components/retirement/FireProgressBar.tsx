import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, CheckCircle2, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FireProgressBarProps {
  currentSavings: number;
  fireNumber: number;
  leanFireNumber: number;
  fatFireNumber: number;
  yearsToRetirement: number;
  projectedAtRetirement: number;
  inflationRate: number;
}

export const FireProgressBar: React.FC<FireProgressBarProps> = ({
  currentSavings,
  fireNumber,
  leanFireNumber,
  fatFireNumber,
  yearsToRetirement,
  projectedAtRetirement,
  inflationRate
}) => {
  // Calculate inflation-adjusted FIRE numbers
  const inflationMultiplier = Math.pow(1 + inflationRate / 100, yearsToRetirement);
  const inflationAdjustedFireNumber = fireNumber * inflationMultiplier;
  const inflationAdjustedLeanFire = leanFireNumber * inflationMultiplier;
  const inflationAdjustedFatFire = fatFireNumber * inflationMultiplier;

  // Calculate progress percentages
  const currentProgress = Math.min((currentSavings / inflationAdjustedFireNumber) * 100, 100);
  const projectedProgress = Math.min((projectedAtRetirement / inflationAdjustedFireNumber) * 100, 150);
  
  // Milestone calculations
  const leanFireProgress = Math.min((currentSavings / inflationAdjustedLeanFire) * 100, 100);
  const regularFireProgress = currentProgress;
  const fatFireProgress = Math.min((currentSavings / inflationAdjustedFatFire) * 100, 100);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-emerald-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const milestones = [
    { label: 'Lean FIRE', target: inflationAdjustedLeanFire, progress: leanFireProgress, color: 'text-green-600 dark:text-green-400' },
    { label: 'Regular FIRE', target: inflationAdjustedFireNumber, progress: regularFireProgress, color: 'text-primary' },
    { label: 'Fat FIRE', target: inflationAdjustedFatFire, progress: fatFireProgress, color: 'text-purple-600 dark:text-purple-400' },
  ];

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-primary" />
          FIRE Progress Tracker
        </CardTitle>
        <CardDescription>
          Track your journey to financial independence with inflation-adjusted targets ({inflationRate}% annual inflation over {yearsToRetirement} years)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Progress Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-muted-foreground">Current Savings</span>
              <p className="text-2xl font-bold">{formatCurrency(currentSavings)}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <div className="text-right">
              <span className="text-sm text-muted-foreground">FIRE Target (Inflation-Adjusted)</span>
              <p className="text-2xl font-bold text-primary">{formatCurrency(inflationAdjustedFireNumber)}</p>
            </div>
          </div>
          
          <div className="relative">
            <div className="h-6 w-full overflow-hidden rounded-full bg-secondary">
              {/* Background gradient for visual appeal */}
              <div 
                className={`h-full transition-all duration-500 ease-out ${getProgressColor(currentProgress)}`}
                style={{ width: `${Math.min(currentProgress, 100)}%` }}
              />
            </div>
            {/* Progress percentage label */}
            <div 
              className="absolute top-0 h-6 flex items-center justify-center text-xs font-bold text-white"
              style={{ 
                left: `${Math.min(Math.max(currentProgress - 5, 2), 90)}%`,
              }}
            >
              {currentProgress.toFixed(1)}%
            </div>
          </div>

          {/* Progress Status */}
          <div className="flex items-center gap-2">
            {currentProgress >= 100 ? (
              <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                FIRE Achieved!
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                {formatCurrency(inflationAdjustedFireNumber - currentSavings)} remaining
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              Today's ${formatCurrency(fireNumber)} = {formatCurrency(inflationAdjustedFireNumber)} at retirement
            </span>
          </div>
        </div>

        {/* Projected vs Current */}
        <div className="p-4 rounded-lg bg-muted/50 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Projected at Retirement</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Projected Portfolio</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(projectedAtRetirement)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Projected Progress</p>
              <p className="text-xl font-bold">
                {projectedProgress >= 100 ? (
                  <span className="text-green-600 dark:text-green-400">{projectedProgress.toFixed(0)}% ✓</span>
                ) : (
                  <span className="text-orange-600 dark:text-orange-400">{projectedProgress.toFixed(0)}%</span>
                )}
              </p>
            </div>
          </div>
          {projectedProgress < 100 && (
            <p className="text-xs text-muted-foreground">
              Gap: {formatCurrency(inflationAdjustedFireNumber - projectedAtRetirement)} shortfall at current trajectory
            </p>
          )}
        </div>

        {/* FIRE Milestones */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">FIRE Milestones</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {milestones.map((milestone) => (
              <div key={milestone.label} className="p-3 rounded-lg bg-muted/30 border">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${milestone.color}`}>{milestone.label}</span>
                  <span className="text-xs text-muted-foreground">{milestone.progress.toFixed(0)}%</span>
                </div>
                <Progress value={milestone.progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Target: {formatCurrency(milestone.target)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
