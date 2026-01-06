import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { 
  Home, Heart, Plane, ShoppingCart, Car, Utensils, 
  Tv, Gift, Wifi, DollarSign, TrendingUp, AlertCircle
} from 'lucide-react';

interface SpendingCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  amount: number;
  color: string;
  inflationRate: number; // Category-specific inflation rate
}

interface SpendingBreakdownCalculatorProps {
  annualSpending: number;
  onSpendingChange: (total: number) => void;
  generalInflationRate: number;
  yearsToRetirement: number;
}

const defaultCategories: SpendingCategory[] = [
  { id: 'housing', name: 'Housing', icon: Home, amount: 18000, color: '#3b82f6', inflationRate: 3.5 },
  { id: 'healthcare', name: 'Healthcare', icon: Heart, amount: 12000, color: '#ef4444', inflationRate: 5.5 },
  { id: 'travel', name: 'Travel & Leisure', icon: Plane, amount: 8000, color: '#8b5cf6', inflationRate: 3.0 },
  { id: 'food', name: 'Food & Dining', icon: Utensils, amount: 7200, color: '#f59e0b', inflationRate: 3.5 },
  { id: 'transportation', name: 'Transportation', icon: Car, amount: 6000, color: '#10b981', inflationRate: 3.0 },
  { id: 'utilities', name: 'Utilities & Internet', icon: Wifi, amount: 4800, color: '#06b6d4', inflationRate: 2.5 },
  { id: 'entertainment', name: 'Entertainment', icon: Tv, amount: 3600, color: '#ec4899', inflationRate: 2.5 },
  { id: 'shopping', name: 'Shopping & Personal', icon: ShoppingCart, amount: 4200, color: '#84cc16', inflationRate: 2.0 },
  { id: 'gifts', name: 'Gifts & Donations', icon: Gift, amount: 2400, color: '#f97316', inflationRate: 2.5 },
  { id: 'misc', name: 'Miscellaneous', icon: DollarSign, amount: 3800, color: '#64748b', inflationRate: 2.5 },
];

export const SpendingBreakdownCalculator: React.FC<SpendingBreakdownCalculatorProps> = ({
  annualSpending,
  onSpendingChange,
  generalInflationRate,
  yearsToRetirement
}) => {
  const [categories, setCategories] = useState<SpendingCategory[]>(() => {
    // Initialize with default categories, scaled to match annualSpending
    const defaultTotal = defaultCategories.reduce((sum, cat) => sum + cat.amount, 0);
    const scale = annualSpending / defaultTotal;
    return defaultCategories.map(cat => ({
      ...cat,
      amount: Math.round(cat.amount * scale)
    }));
  });

  // Calculate totals
  const currentTotal = useMemo(() => 
    categories.reduce((sum, cat) => sum + cat.amount, 0), 
    [categories]
  );

  // Calculate inflation-adjusted spending by category
  const inflationAdjustedCategories = useMemo(() => 
    categories.map(cat => ({
      ...cat,
      futureAmount: cat.amount * Math.pow(1 + cat.inflationRate / 100, yearsToRetirement)
    })), 
    [categories, yearsToRetirement]
  );

  const futureTotal = useMemo(() => 
    inflationAdjustedCategories.reduce((sum, cat) => sum + cat.futureAmount, 0), 
    [inflationAdjustedCategories]
  );

  // Weighted average inflation
  const weightedInflation = useMemo(() => {
    if (currentTotal === 0) return generalInflationRate;
    return categories.reduce((sum, cat) => sum + (cat.inflationRate * cat.amount / currentTotal), 0);
  }, [categories, currentTotal, generalInflationRate]);

  // Update parent when total changes
  useEffect(() => {
    if (Math.abs(currentTotal - annualSpending) > 100) {
      onSpendingChange(currentTotal);
    }
  }, [currentTotal, annualSpending, onSpendingChange]);

  const updateCategory = (id: string, amount: number) => {
    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, amount: Math.max(0, amount) } : cat
    ));
  };

  const updateCategoryInflation = (id: string, rate: number) => {
    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, inflationRate: rate } : cat
    ));
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  // Pie chart data
  const pieData = categories
    .filter(cat => cat.amount > 0)
    .map(cat => ({
      name: cat.name,
      value: cat.amount,
      color: cat.color
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          Retirement Spending Breakdown
        </CardTitle>
        <CardDescription>
          Estimate your retirement expenses by category with individual inflation rates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs text-muted-foreground">Current Annual</p>
            <p className="text-xl font-bold">{formatCurrency(currentTotal)}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(currentTotal / 12)}/mo</p>
          </div>
          <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <p className="text-xs text-muted-foreground">Future Annual ({yearsToRetirement}yr)</p>
            <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(futureTotal)}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(futureTotal / 12)}/mo</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">Weighted Inflation</p>
            <p className="text-xl font-bold">{weightedInflation.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">avg across categories</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">FIRE Number (25x)</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(currentTotal * 25)}</p>
            <p className="text-xs text-muted-foreground">today's dollars</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category Inputs */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {categories.map((category) => {
              const Icon = category.icon;
              const futureAmount = category.amount * Math.pow(1 + category.inflationRate / 100, yearsToRetirement);
              
              return (
                <div key={category.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="p-1.5 rounded-md"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: category.color }} />
                    </div>
                    <span className="text-sm font-medium flex-1">{category.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {((category.amount / currentTotal) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Annual ($)</Label>
                      <Input
                        type="number"
                        value={category.amount}
                        onChange={(e) => updateCategory(category.id, Number(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Inflation ({category.inflationRate}%)</Label>
                      <Slider
                        value={[category.inflationRate]}
                        onValueChange={(value) => updateCategoryInflation(category.id, value[0])}
                        min={0}
                        max={10}
                        step={0.5}
                        className="mt-2"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed">
                    <span className="text-xs text-muted-foreground">In {yearsToRetirement} years:</span>
                    <span className="text-xs font-medium" style={{ color: category.color }}>
                      {formatCurrency(futureAmount)} (+{((futureAmount / category.amount - 1) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Healthcare Warning */}
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-400">Healthcare Inflation Alert</p>
            <p className="text-xs text-muted-foreground mt-1">
              Healthcare costs historically increase faster than general inflation (5-7% vs 2-3%). 
              Your healthcare spending of {formatCurrency(categories.find(c => c.id === 'healthcare')?.amount || 0)}/year 
              could grow to {formatCurrency((categories.find(c => c.id === 'healthcare')?.amount || 0) * Math.pow(1.055, yearsToRetirement))} 
              by retirement. Consider HSA contributions and Medicare planning.
            </p>
          </div>
        </div>

        {/* Inflation Impact Summary */}
        <div className="p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">Inflation Impact Summary</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{formatCurrency(futureTotal - currentTotal)}</p>
              <p className="text-xs text-muted-foreground">Total increase</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{((futureTotal / currentTotal - 1) * 100).toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">Percentage increase</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(futureTotal * 25)}</p>
              <p className="text-xs text-muted-foreground">Future FIRE number</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
