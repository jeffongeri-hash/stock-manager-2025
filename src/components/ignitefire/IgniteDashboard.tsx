import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, PiggyBank, Wallet, Calendar, DollarSign } from 'lucide-react';
import { IgniteUserFinancials, FireType } from '@/types/ignitefire';

interface IgniteDashboardProps {
  financials: IgniteUserFinancials;
  setFinancials: React.Dispatch<React.SetStateAction<IgniteUserFinancials>>;
}

export const IgniteDashboard: React.FC<IgniteDashboardProps> = ({ financials, setFinancials }) => {
  const yearsToRetirement = financials.retirementAge - financials.currentAge;
  const fireNumber = financials.annualSpending * 25; // 4% rule
  const progress = Math.min((financials.currentNetWorth / fireNumber) * 100, 100);
  const savingsRate = (financials.annualSavings / financials.grossAnnualIncome) * 100;
  
  // Simple FV calculation
  const futureValue = financials.currentNetWorth * Math.pow(1 + financials.expectedReturn / 100, yearsToRetirement) +
    financials.annualSavings * ((Math.pow(1 + financials.expectedReturn / 100, yearsToRetirement) - 1) / (financials.expectedReturn / 100));
  
  const onTrack = futureValue >= fireNumber;

  const handleChange = (field: keyof IgniteUserFinancials, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFinancials(prev => ({ ...prev, [field]: numValue }));
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                FIRE Progress
              </CardTitle>
              <CardDescription>Your journey to financial independence</CardDescription>
            </div>
            <Badge variant={onTrack ? "default" : "destructive"}>
              {onTrack ? "On Track" : "Needs Attention"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Current: ${financials.currentNetWorth.toLocaleString()}</span>
                <span>Target: ${fireNumber.toLocaleString()}</span>
              </div>
              <Progress value={progress} className="h-3" />
              <p className="text-sm text-muted-foreground mt-1">{progress.toFixed(1)}% to FIRE</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">{yearsToRetirement}</p>
                <p className="text-xs text-muted-foreground">Years to Target</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">{savingsRate.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Savings Rate</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">${(futureValue / 1000).toFixed(0)}K</p>
                <p className="text-xs text-muted-foreground">Projected Value</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">${(financials.annualSpending / 12).toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Monthly Need</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Current Age</Label>
                <Input 
                  type="number" 
                  value={financials.currentAge}
                  onChange={(e) => handleChange('currentAge', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Target Retirement Age</Label>
                <Input 
                  type="number" 
                  value={financials.retirementAge}
                  onChange={(e) => handleChange('retirementAge', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Gross Annual Income</Label>
              <Input 
                type="number" 
                value={financials.grossAnnualIncome}
                onChange={(e) => handleChange('grossAnnualIncome', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tax Rate (%)</Label>
              <Input 
                type="number" 
                value={financials.taxRate}
                onChange={(e) => handleChange('taxRate', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5" />
              Savings & Spending
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Current Net Worth</Label>
              <Input 
                type="number" 
                value={financials.currentNetWorth}
                onChange={(e) => handleChange('currentNetWorth', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Annual Spending</Label>
              <Input 
                type="number" 
                value={financials.annualSpending}
                onChange={(e) => handleChange('annualSpending', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Annual Savings</Label>
              <Input 
                type="number" 
                value={financials.annualSavings}
                onChange={(e) => handleChange('annualSavings', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Expected Annual Return (%)</Label>
              <Input 
                type="number" 
                value={financials.expectedReturn}
                onChange={(e) => handleChange('expectedReturn', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
