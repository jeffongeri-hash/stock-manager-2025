import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { 
  Flame, Leaf, Crown, Scale, ExternalLink, BookOpen, Target, 
  TrendingUp, DollarSign, CheckCircle2, Circle
} from 'lucide-react';

interface FireType {
  name: string;
  multiplier: number;
  description: string;
  lifestyle: string;
  icon: React.ElementType;
  color: string;
  annualSpending: string;
}

const FIRE_TYPES: FireType[] = [
  {
    name: 'Lean FIRE',
    multiplier: 25,
    description: 'Minimal lifestyle with tight budget control',
    lifestyle: 'Frugal living, shared housing, minimal discretionary spending',
    icon: Leaf,
    color: '#22c55e',
    annualSpending: '$20,000 - $40,000'
  },
  {
    name: 'Regular FIRE',
    multiplier: 25,
    description: 'Comfortable middle-class lifestyle',
    lifestyle: 'Modest home, occasional travel, balanced spending',
    icon: Flame,
    color: '#f59e0b',
    annualSpending: '$40,000 - $80,000'
  },
  {
    name: 'Fat FIRE',
    multiplier: 25,
    description: 'Luxurious lifestyle without financial constraints',
    lifestyle: 'Premium housing, frequent travel, full lifestyle freedom',
    icon: Crown,
    color: '#8b5cf6',
    annualSpending: '$100,000 - $200,000+'
  },
  {
    name: 'Barista FIRE',
    multiplier: 20,
    description: 'Part-time work covers some expenses',
    lifestyle: 'Flexible work schedule, supplemental income, earlier freedom',
    icon: Scale,
    color: '#ec4899',
    annualSpending: 'Variable (part-time income supplements)'
  },
  {
    name: 'Coast FIRE',
    multiplier: 0,
    description: 'Enough saved to coast to traditional retirement',
    lifestyle: 'Cover current expenses only, let investments grow',
    icon: Target,
    color: '#06b6d4',
    annualSpending: 'N/A (investments compound to retirement)'
  }
];

const FIRE_RESOURCES = [
  {
    title: 'Mr. Money Mustache',
    url: 'https://www.mrmoneymustache.com/',
    description: 'The godfather of FIRE blogging - focuses on frugality and mustachian principles'
  },
  {
    title: 'ChooseFI',
    url: 'https://www.choosefi.com/',
    description: 'Podcast and community focused on practical FIRE strategies'
  },
  {
    title: 'The Simple Path to Wealth',
    url: 'https://jlcollinsnh.com/',
    description: 'JL Collins\' blog on simple, effective investing for FIRE'
  },
  {
    title: 'Mad Fientist',
    url: 'https://www.madfientist.com/',
    description: 'Tax optimization and financial strategies for early retirement'
  },
  {
    title: 'Early Retirement Now',
    url: 'https://earlyretirementnow.com/',
    description: 'Deep dive into safe withdrawal rates and the 4% rule'
  },
  {
    title: 'r/financialindependence',
    url: 'https://www.reddit.com/r/financialindependence/',
    description: 'Active Reddit community discussing FIRE strategies'
  }
];

interface FireTypesCalculatorProps {
  annualSpendingPostRetirement?: number;
}

export const FireTypesCalculator: React.FC<FireTypesCalculatorProps> = ({ 
  annualSpendingPostRetirement 
}) => {
  const [annualExpenses, setAnnualExpenses] = useState(annualSpendingPostRetirement || 60000);
  const [currentSavings, setCurrentSavings] = useState(200000);
  const [monthlyContribution, setMonthlyContribution] = useState(2000);
  const [expectedReturn, setExpectedReturn] = useState(7);
  const [currentAge, setCurrentAge] = useState(30);

  // Sync with parent prop when it changes
  React.useEffect(() => {
    if (annualSpendingPostRetirement !== undefined) {
      setAnnualExpenses(annualSpendingPostRetirement);
    }
  }, [annualSpendingPostRetirement]);

  const calculations = useMemo(() => {
    const leanExpenses = 30000;
    const regularExpenses = annualExpenses;
    const fatExpenses = 150000;
    const baristaExpenses = annualExpenses * 0.6; // Part-time covers 40%

    const leanFIRE = leanExpenses * 25;
    const regularFIRE = regularExpenses * 25;
    const fatFIRE = fatExpenses * 25;
    const baristaFIRE = baristaExpenses * 20;

    // Coast FIRE calculation (need enough now to grow to regular FIRE by 65)
    const yearsToRetirement = 65 - currentAge;
    const coastFIRE = regularFIRE / Math.pow(1 + (expectedReturn / 100), yearsToRetirement);

    const fireNumbers = [
      { name: 'Lean FIRE', target: leanFIRE, expenses: leanExpenses, color: '#22c55e' },
      { name: 'Coast FIRE', target: coastFIRE, expenses: 0, color: '#06b6d4' },
      { name: 'Barista FIRE', target: baristaFIRE, expenses: baristaExpenses, color: '#ec4899' },
      { name: 'Regular FIRE', target: regularFIRE, expenses: regularExpenses, color: '#f59e0b' },
      { name: 'Fat FIRE', target: fatFIRE, expenses: fatExpenses, color: '#8b5cf6' },
    ];

    // Calculate years to each FIRE level
    const yearsToFIRE = fireNumbers.map(fire => {
      if (currentSavings >= fire.target) {
        return { ...fire, years: 0, progress: 100 };
      }

      const monthlyReturn = expectedReturn / 100 / 12;
      let savings = currentSavings;
      let months = 0;
      const maxMonths = 600; // 50 years max

      while (savings < fire.target && months < maxMonths) {
        savings = savings * (1 + monthlyReturn) + monthlyContribution;
        months++;
      }

      const years = months < maxMonths ? months / 12 : null;
      const progress = Math.min(100, (currentSavings / fire.target) * 100);

      return { ...fire, years, progress };
    });

    // Determine current FIRE status
    const achievedLevels = yearsToFIRE.filter(f => f.progress >= 100);
    const closestLevel = yearsToFIRE.reduce((prev, curr) => 
      (prev.progress > curr.progress) ? prev : curr
    );

    // Calculate Coast FIRE by age (what you need at each age to coast to regular FIRE by 65)
    const coastFireByAge = [];
    for (let age = 20; age <= 55; age++) {
      const yearsToGrow = 65 - age;
      const coastAmount = regularFIRE / Math.pow(1 + (expectedReturn / 100), yearsToGrow);
      coastFireByAge.push({
        age,
        coastAmount: Math.round(coastAmount),
        yearsToGrow
      });
    }

    return {
      fireNumbers,
      yearsToFIRE,
      achievedLevels,
      closestLevel,
      leanFIRE,
      regularFIRE,
      fatFIRE,
      coastFIRE,
      baristaFIRE,
      coastFireByAge
    };
  }, [annualExpenses, currentSavings, monthlyContribution, expectedReturn, currentAge]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="space-y-4">
      {/* FIRE Types Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {FIRE_TYPES.map((type, index) => (
          <Card key={type.name} className="relative overflow-hidden">
            <div 
              className="absolute top-0 left-0 right-0 h-1" 
              style={{ backgroundColor: type.color }}
            />
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <type.icon className="h-5 w-5" style={{ color: type.color }} />
                <span className="font-medium text-sm">{type.name}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{type.description}</p>
              <p className="text-xs font-medium">{type.annualSpending}/year</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calculator Inputs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              FIRE Calculator
            </CardTitle>
            <CardDescription>
              Calculate your path to financial independence
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Current Age: {currentAge}</Label>
              <Slider
                value={[currentAge]}
                onValueChange={(value) => setCurrentAge(value[0])}
                min={18}
                max={60}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Annual Expenses</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={annualExpenses}
                  onChange={(e) => setAnnualExpenses(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Current Savings</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={currentSavings}
                  onChange={(e) => setCurrentSavings(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Monthly Contribution</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Expected Return: {expectedReturn}%</Label>
              <Slider
                value={[expectedReturn]}
                onValueChange={(value) => setExpectedReturn(value[0])}
                min={3}
                max={12}
                step={0.5}
              />
            </div>

            {/* Status Badge */}
            <div className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Your FIRE Number (25x expenses)</p>
              <p className="text-2xl font-bold">{formatCurrency(calculations.regularFIRE)}</p>
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Progress</span>
                  <span>{calculations.closestLevel.progress.toFixed(1)}%</span>
                </div>
                <Progress value={calculations.closestLevel.progress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FIRE Numbers Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your Path to Each FIRE Level</CardTitle>
            <CardDescription>
              Target amounts and years to reach each FIRE milestone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={calculations.fireNumbers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    type="number" 
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="target" radius={[0, 4, 4, 0]}>
                    {calculations.fireNumbers.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Years to FIRE */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
              {calculations.yearsToFIRE.map((fire) => (
                <div 
                  key={fire.name}
                  className="p-3 rounded-lg text-center"
                  style={{ backgroundColor: `${fire.color}15` }}
                >
                  <p className="text-xs font-medium truncate">{fire.name}</p>
                  <p className="text-lg font-bold" style={{ color: fire.color }}>
                    {fire.progress >= 100 ? (
                      <span className="flex items-center justify-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Done!
                      </span>
                    ) : fire.years !== null ? (
                      `${fire.years.toFixed(1)}y`
                    ) : (
                      '50+y'
                    )}
                  </p>
                  <Progress 
                    value={fire.progress} 
                    className="h-1 mt-1"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coast FIRE by Age Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-cyan-500" />
            Coast FIRE by Age
          </CardTitle>
          <CardDescription>
            How much you need invested at each age to reach your FIRE number ({formatCurrency(calculations.regularFIRE)}) by age 65, assuming {expectedReturn}% annual returns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {calculations.coastFireByAge
              .filter(item => item.age % 5 === 0 || item.age === currentAge)
              .map((item) => (
                <div 
                  key={item.age}
                  className={`p-3 rounded-lg text-center border ${
                    item.age === currentAge 
                      ? 'border-cyan-500 bg-cyan-500/10' 
                      : currentSavings >= item.coastAmount && item.age <= currentAge
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-muted bg-muted/30'
                  }`}
                >
                  <p className="text-xs text-muted-foreground">Age {item.age}</p>
                  <p className={`text-lg font-bold ${
                    item.age === currentAge ? 'text-cyan-500' : 
                    currentSavings >= item.coastAmount && item.age <= currentAge ? 'text-green-500' : ''
                  }`}>
                    {formatCurrency(item.coastAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.yearsToGrow} yrs to grow</p>
                </div>
              ))}
          </div>
          
          {/* Current status indicator */}
          <div className="mt-4 p-4 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 rounded-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Your Coast FIRE Status (Age {currentAge})</p>
                <p className="text-xs text-muted-foreground">
                  You need {formatCurrency(calculations.coastFIRE)} to coast to retirement
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Current Savings</p>
                <p className="text-2xl font-bold">{formatCurrency(currentSavings)}</p>
                {currentSavings >= calculations.coastFIRE ? (
                  <Badge variant="default" className="bg-green-500 mt-1">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Coast FIRE Achieved!
                  </Badge>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(calculations.coastFIRE - currentSavings)} more needed
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Example milestones */}
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2 text-sm">Coast FIRE Milestones (at {expectedReturn}% returns)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">At age 25:</span>
                <span className="font-medium">{formatCurrency(calculations.coastFireByAge.find(c => c.age === 25)?.coastAmount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">At age 30:</span>
                <span className="font-medium">{formatCurrency(calculations.coastFireByAge.find(c => c.age === 30)?.coastAmount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">At age 35:</span>
                <span className="font-medium">{formatCurrency(calculations.coastFireByAge.find(c => c.age === 35)?.coastAmount || 0)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FIRE Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            FIRE Movement Resources
          </CardTitle>
          <CardDescription>
            Essential reading and communities for your financial independence journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {FIRE_RESOURCES.map((resource, index) => (
              <a 
                key={index}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium group-hover:text-primary transition-colors">
                    {resource.title}
                  </h4>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="text-sm text-muted-foreground">{resource.description}</p>
              </a>
            ))}
          </div>

          {/* Additional FIRE Concepts */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Key FIRE Concepts
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-primary">The 4% Rule</p>
                <p className="text-muted-foreground">
                  Withdraw 4% of your portfolio annually (adjusted for inflation) with a high probability 
                  of not running out of money over 30 years.
                </p>
              </div>
              <div>
                <p className="font-medium text-primary">25x Rule</p>
                <p className="text-muted-foreground">
                  Multiply your annual expenses by 25 to find your FIRE number. 
                  This is the inverse of the 4% withdrawal rate.
                </p>
              </div>
              <div>
                <p className="font-medium text-primary">Savings Rate</p>
                <p className="text-muted-foreground">
                  Your savings rate is the most important factor in how quickly you reach FIRE. 
                  A 50% savings rate can lead to retirement in ~17 years.
                </p>
              </div>
              <div>
                <p className="font-medium text-primary">Sequence of Returns Risk</p>
                <p className="text-muted-foreground">
                  Poor market returns early in retirement can significantly impact portfolio longevity. 
                  Consider flexible withdrawal strategies.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FireTypesCalculator;
