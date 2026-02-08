import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calculator, TrendingUp, Coffee, Mountain, Zap } from 'lucide-react';
import { IgniteUserFinancials, FireType } from '@/types/ignitefire';

interface IgniteFIRECalculatorsProps {
  financials: IgniteUserFinancials;
}

export const IgniteFIRECalculators: React.FC<IgniteFIRECalculatorsProps> = ({ financials }) => {
  const [coastAge, setCoastAge] = useState(65);
  const [baristaIncome, setBaristaIncome] = useState(25000);
  
  // FIRE calculations
  const leanFIRE = financials.annualSpending * 0.6 * 25; // 60% of spending
  const regularFIRE = financials.annualSpending * 25;
  const fatFIRE = financials.annualSpending * 1.5 * 25; // 150% of spending
  
  // Coast FIRE: Amount needed now to reach target by coastAge with no more contributions
  const yearsToCoast = coastAge - financials.currentAge;
  const coastNumber = regularFIRE / Math.pow(1 + financials.expectedReturn / 100, yearsToCoast);
  const coastProgress = Math.min((financials.currentNetWorth / coastNumber) * 100, 100);
  const coastReached = financials.currentNetWorth >= coastNumber;
  
  // Barista FIRE: Working part-time while investments grow
  const yearsToBarista = financials.retirementAge - financials.currentAge;
  const baristaNeed = (financials.annualSpending - baristaIncome) * 25;
  const baristaProgress = Math.min((financials.currentNetWorth / baristaNeed) * 100, 100);

  // Years to reach each FIRE type
  const calculateYearsToTarget = (target: number) => {
    if (financials.currentNetWorth >= target) return 0;
    const r = financials.expectedReturn / 100;
    const pv = financials.currentNetWorth;
    const pmt = financials.annualSavings;
    
    // Solve for n: FV = PV(1+r)^n + PMT*((1+r)^n - 1)/r = target
    // Using iterative approach
    let years = 0;
    let currentValue = pv;
    while (currentValue < target && years < 100) {
      currentValue = currentValue * (1 + r) + pmt;
      years++;
    }
    return years;
  };

  const fireTypes = [
    { 
      type: FireType.LEAN, 
      target: leanFIRE, 
      years: calculateYearsToTarget(leanFIRE),
      description: "Minimal lifestyle, covering only essential expenses",
      icon: <Zap className="h-5 w-5" />,
      color: "text-yellow-500"
    },
    { 
      type: FireType.STANDARD, 
      target: regularFIRE, 
      years: calculateYearsToTarget(regularFIRE),
      description: "Maintain your current lifestyle in retirement",
      icon: <TrendingUp className="h-5 w-5" />,
      color: "text-primary"
    },
    { 
      type: FireType.FAT, 
      target: fatFIRE, 
      years: calculateYearsToTarget(fatFIRE),
      description: "Enhanced lifestyle with extra cushion",
      icon: <Mountain className="h-5 w-5" />,
      color: "text-green-500"
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            FIRE Path Calculator
          </CardTitle>
          <CardDescription>Compare different paths to financial independence</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {fireTypes.map((fire) => {
              const progress = Math.min((financials.currentNetWorth / fire.target) * 100, 100);
              return (
                <div key={fire.type} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={fire.color}>{fire.icon}</span>
                      <span className="font-semibold">{fire.type}</span>
                    </div>
                    <Badge variant={progress >= 100 ? "default" : "secondary"}>
                      {progress >= 100 ? "Achieved!" : `${fire.years} years`}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{fire.description}</p>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Target</span>
                      <span className="font-medium">${fire.target.toLocaleString()}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{progress.toFixed(1)}% complete</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Coast FIRE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coffee className="h-5 w-5" />
            Coast FIRE Calculator
          </CardTitle>
          <CardDescription>
            How much you need saved now to let compound growth handle the rest
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Traditional Retirement Age</Label>
              <Input 
                type="number" 
                value={coastAge}
                onChange={(e) => setCoastAge(parseInt(e.target.value) || 65)}
              />
              <p className="text-xs text-muted-foreground">Age when you'd like to fully retire</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Coast FIRE Number</p>
              <p className="text-2xl font-bold text-primary">${coastNumber.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">
                Amount needed today to reach ${regularFIRE.toLocaleString()} by age {coastAge}
              </p>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex justify-between text-sm mb-2">
              <span>Current: ${financials.currentNetWorth.toLocaleString()}</span>
              <span>Coast Target: ${coastNumber.toLocaleString()}</span>
            </div>
            <Progress value={coastProgress} className="h-3" />
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm text-muted-foreground">{coastProgress.toFixed(1)}% to Coast FIRE</p>
            {coastReached && (
              <Badge className="bg-primary text-primary-foreground">You've Reached Coast FIRE!</Badge>
            )}
          </div>
          {coastReached && (
            <p className="text-sm text-primary mt-2">
              You can stop saving aggressively and let your investments grow to reach FIRE by age {coastAge}!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Barista FIRE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coffee className="h-5 w-5" />
            Barista FIRE Calculator
          </CardTitle>
          <CardDescription>
            Part-time work covers some expenses while investments grow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Part-Time Annual Income</Label>
              <Input 
                type="number" 
                value={baristaIncome}
                onChange={(e) => setBaristaIncome(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">Expected income from part-time work</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Barista FIRE Number</p>
              <p className="text-2xl font-bold text-primary">${baristaNeed.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">
                Portfolio needed to cover ${(financials.annualSpending - baristaIncome).toLocaleString()}/year gap
              </p>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex justify-between text-sm mb-2">
              <span>Current: ${financials.currentNetWorth.toLocaleString()}</span>
              <span>Barista Target: ${baristaNeed.toLocaleString()}</span>
            </div>
            <Progress value={baristaProgress} className="h-3" />
            <p className="text-sm text-muted-foreground mt-1">{baristaProgress.toFixed(1)}% to Barista FIRE</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
