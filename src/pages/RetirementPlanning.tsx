import React, { useState, useMemo, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, ComposedChart, ReferenceLine
} from 'recharts';
import { 
  Target, TrendingUp, DollarSign, Calculator, PiggyBank, 
  Clock, Percent, ArrowRight, CheckCircle2, AlertCircle, Sparkles,
  Landmark, Wallet, Flame, Save, RotateCcw, Loader2
} from 'lucide-react';
import { SocialSecurityEstimator } from '@/components/retirement/SocialSecurityEstimator';
import { RetirementIncomeBreakdown } from '@/components/retirement/RetirementIncomeBreakdown';
import { FireTypesCalculator } from '@/components/retirement/FireTypesCalculator';
import { RothConversionCalculator } from '@/components/retirement/RothConversionCalculator';
import { RMDCalculator } from '@/components/retirement/RMDCalculator';
import { HealthcareCostEstimator } from '@/components/retirement/HealthcareCostEstimator';
import { WithdrawalStrategyPlanner } from '@/components/retirement/WithdrawalStrategyPlanner';
import { HSACalculator } from '@/components/retirement/HSACalculator';
import { FireProgressBar } from '@/components/retirement/FireProgressBar';
import { SpendingBreakdownCalculator } from '@/components/retirement/SpendingBreakdownCalculator';
import { TaxAwareWithdrawalOptimizer } from '@/components/retirement/TaxAwareWithdrawalOptimizer';
import { ScenarioComparison } from '@/components/retirement/ScenarioComparison';
import { useUserSettings } from '@/hooks/useUserSettings';

interface RetirementSettings {
  // Annual Spending Post-Retirement (drives FIRE & projection calculations)
  annualSpendingPostRetirement: number;
  // Crossover Point
  monthlyExpenses: number;
  monthlyInvestment: number;
  currentSavings: number;
  expectedReturn: number;
  withdrawalRate: number;
  // Wealth Multiplier
  currentAge: number;
  retirementAge: number;
  annualContribution: number;
  // Retirement Projections
  projCurrentAge: number;
  projRetirementAge: number;
  projCurrentSavings: number;
  projMonthlyContrib: number;
  projExpectedReturn: number;
  projInflation: number;
}

const defaultSettings: RetirementSettings = {
  annualSpendingPostRetirement: 60000,
  monthlyExpenses: 5000,
  monthlyInvestment: 1500,
  currentSavings: 50000,
  expectedReturn: 7,
  withdrawalRate: 4,
  currentAge: 30,
  retirementAge: 65,
  annualContribution: 10000,
  projCurrentAge: 30,
  projRetirementAge: 65,
  projCurrentSavings: 50000,
  projMonthlyContrib: 1000,
  projExpectedReturn: 7,
  projInflation: 2.5,
};

// Money Guy Show Wealth Multiplier Table
const WEALTH_MULTIPLIERS: Record<number, number> = {
  20: 88,
  21: 83,
  22: 79,
  23: 74,
  24: 70,
  25: 66,
  26: 63,
  27: 59,
  28: 56,
  29: 53,
  30: 50,
  31: 47,
  32: 44,
  33: 42,
  34: 40,
  35: 37,
  36: 35,
  37: 33,
  38: 31,
  39: 30,
  40: 28,
  41: 26,
  42: 25,
  43: 23,
  44: 22,
  45: 21,
  46: 19,
  47: 18,
  48: 17,
  49: 16,
  50: 15,
  51: 14,
  52: 13,
  53: 13,
  54: 12,
  55: 11,
  56: 10,
  57: 10,
  58: 9,
  59: 9,
  60: 8,
  61: 8,
  62: 7,
  63: 7,
  64: 6,
  65: 6
};

const RetirementPlanning = () => {
  // Use the settings hook for persistence
  const {
    settings,
    updateSetting,
    saveSettings,
    resetSettings,
    isLoading,
    isSaving,
    lastSaved,
    isAuthenticated
  } = useUserSettings<RetirementSettings>({
    pageName: 'retirement-planning',
    defaultSettings
  });

  // Destructure settings for easier access
  const {
    annualSpendingPostRetirement,
    monthlyExpenses,
    monthlyInvestment,
    currentSavings,
    expectedReturn,
    withdrawalRate,
    currentAge,
    retirementAge,
    annualContribution,
    projCurrentAge,
    projRetirementAge,
    projCurrentSavings,
    projMonthlyContrib,
    projExpectedReturn,
    projInflation
  } = settings;

  // Calculate crossover point data
  const crossoverData = useMemo(() => {
    const data = [];
    let savings = currentSavings;
    const annualExpenses = monthlyExpenses * 12;
    const monthlyReturn = expectedReturn / 100 / 12;
    const targetSavings = annualExpenses / (withdrawalRate / 100);
    
    let crossoverYear = null;
    
    for (let year = 0; year <= 40; year++) {
      const passiveIncome = savings * (withdrawalRate / 100);
      
      if (passiveIncome >= annualExpenses && crossoverYear === null) {
        crossoverYear = year;
      }
      
      data.push({
        year,
        savings: Math.round(savings),
        passiveIncome: Math.round(passiveIncome),
        expenses: annualExpenses,
        targetSavings: Math.round(targetSavings)
      });
      
      // Compound growth
      for (let month = 0; month < 12; month++) {
        savings = savings * (1 + monthlyReturn) + monthlyInvestment;
      }
    }
    
    return { data, crossoverYear };
  }, [currentSavings, monthlyExpenses, monthlyInvestment, expectedReturn, withdrawalRate]);

  // Calculate wealth multiplier projection
  const wealthMultiplierData = useMemo(() => {
    const data = [];
    const multiplier = WEALTH_MULTIPLIERS[currentAge] || 50;
    const futureValue = annualContribution * multiplier;
    
    // Build projection data
    let accumulated = 0;
    const yearlyReturn = 0.10; // 10% assumed for wealth multiplier
    
    for (let age = currentAge; age <= retirementAge; age++) {
      accumulated = accumulated * (1 + yearlyReturn) + annualContribution;
      data.push({
        age,
        accumulated: Math.round(accumulated),
        contributions: (age - currentAge + 1) * annualContribution
      });
    }
    
    return { data, multiplier, futureValue };
  }, [currentAge, retirementAge, annualContribution]);

  // Calculate retirement projection - now uses annualSpendingPostRetirement
  const retirementProjection = useMemo(() => {
    const data = [];
    let savings = projCurrentSavings;
    const monthlyReturn = projExpectedReturn / 100 / 12;
    const realReturn = projExpectedReturn - projInflation;
    
    for (let age = projCurrentAge; age <= projRetirementAge + 30; age++) {
      const isRetired = age >= projRetirementAge;
      
      data.push({
        age,
        portfolio: Math.round(savings),
        phase: isRetired ? 'Retirement' : 'Accumulation'
      });
      
      if (!isRetired) {
        // Accumulation phase
        for (let month = 0; month < 12; month++) {
          savings = savings * (1 + monthlyReturn) + projMonthlyContrib;
        }
      } else {
        // Retirement phase - use user-defined annual spending adjusted for inflation
        const yearsRetired = age - projRetirementAge;
        const adjustedSpending = annualSpendingPostRetirement * Math.pow(1 + projInflation / 100, yearsRetired);
        savings = (savings - adjustedSpending) * (1 + (realReturn / 100));
        if (savings < 0) savings = 0;
      }
    }
    
    return data;
  }, [projCurrentAge, projRetirementAge, projCurrentSavings, projMonthlyContrib, projExpectedReturn, projInflation, annualSpendingPostRetirement]);

  // Calculate retirement readiness metrics - now uses user's spending goal
  const retirementMetrics = useMemo(() => {
    const yearsToRetirement = projRetirementAge - projCurrentAge;
    const monthlyReturn = projExpectedReturn / 100 / 12;
    let futureValue = projCurrentSavings;
    
    for (let month = 0; month < yearsToRetirement * 12; month++) {
      futureValue = futureValue * (1 + monthlyReturn) + projMonthlyContrib;
    }
    
    // Use user's annual spending goal instead of 4% withdrawal
    const annualWithdrawal = annualSpendingPostRetirement;
    const monthlyIncome = annualWithdrawal / 12;
    const portfolioCanSupport = futureValue >= annualSpendingPostRetirement * 25;
    
    return {
      portfolioAtRetirement: futureValue,
      annualWithdrawal,
      monthlyIncome,
      yearsToRetirement,
      portfolioCanSupport
    };
  }, [projCurrentAge, projRetirementAge, projCurrentSavings, projMonthlyContrib, projExpectedReturn, annualSpendingPostRetirement]);

  // FIRE number calculation - now based on post-retirement spending
  const fireNumber = useMemo(() => {
    return annualSpendingPostRetirement * 25; // 25x annual expenses (4% rule)
  }, [annualSpendingPostRetirement]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <PageLayout title="Retirement Planning">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Target className="h-8 w-8 text-primary" />
              Retirement Planning
            </h1>
            <p className="text-muted-foreground">
              Calculate your crossover point, use the wealth multiplier, and project your retirement portfolio
            </p>
          </div>
          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-xs text-muted-foreground">
                Last saved: {lastSaved.toLocaleDateString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={resetSettings}
              disabled={isLoading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={() => saveSettings(settings)}
              disabled={isSaving || isLoading}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">FIRE Number</p>
                  <p className="text-2xl font-bold">{formatCurrency(fireNumber)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Clock className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Years to Crossover</p>
                  <p className="text-2xl font-bold">
                    {crossoverData.crossoverYear !== null ? `${crossoverData.crossoverYear} years` : '40+ years'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Wealth Multiplier</p>
                  <p className="text-2xl font-bold">{wealthMultiplierData.multiplier}x</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <DollarSign className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Projected at Retirement</p>
                  <p className="text-2xl font-bold">{formatCurrency(retirementMetrics.portfolioAtRetirement)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Annual Spending Goal Section */}
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5 text-primary" />
              Annual Spending in Retirement
            </CardTitle>
            <CardDescription>
              Set your expected annual spending to calculate your savings goals. This drives your FIRE number and portfolio projection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="annualSpending">Annual Spending Goal</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">$</span>
                  <Input
                    id="annualSpending"
                    type="number"
                    value={annualSpendingPostRetirement}
                    onChange={(e) => updateSetting('annualSpendingPostRetirement', Number(e.target.value))}
                    className="text-lg font-semibold"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Monthly: {formatCurrency(annualSpendingPostRetirement / 12)}
                </p>
              </div>
              
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">FIRE Number (25x)</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(fireNumber)}</p>
                <p className="text-xs text-muted-foreground">Target savings</p>
              </div>
              
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Lean FIRE (20x)</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(annualSpendingPostRetirement * 20)}</p>
                <p className="text-xs text-muted-foreground">5% withdrawal</p>
              </div>
              
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Fat FIRE (33x)</p>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(annualSpendingPostRetirement * 33.33)}</p>
                <p className="text-xs text-muted-foreground">3% withdrawal</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FIRE Progress Bar */}
        <FireProgressBar
          currentSavings={projCurrentSavings}
          fireNumber={fireNumber}
          leanFireNumber={annualSpendingPostRetirement * 20}
          fatFireNumber={annualSpendingPostRetirement * 33.33}
          yearsToRetirement={projRetirementAge - projCurrentAge}
          projectedAtRetirement={retirementMetrics.portfolioAtRetirement}
          inflationRate={projInflation}
        />

        <Tabs defaultValue="crossover" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="crossover">Crossover</TabsTrigger>
            <TabsTrigger value="multiplier">Wealth Multiplier</TabsTrigger>
            <TabsTrigger value="projection">Projection</TabsTrigger>
            <TabsTrigger value="spending">Spending Breakdown</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
            <TabsTrigger value="tax-optimizer">Tax Optimizer</TabsTrigger>
            <TabsTrigger value="social-security">Social Security</TabsTrigger>
            <TabsTrigger value="income">Income Sources</TabsTrigger>
            <TabsTrigger value="fire">FIRE Types</TabsTrigger>
            <TabsTrigger value="roth">Roth Conversion</TabsTrigger>
            <TabsTrigger value="rmd">RMD</TabsTrigger>
            <TabsTrigger value="healthcare">Healthcare</TabsTrigger>
            <TabsTrigger value="withdrawal">Withdrawal Strategy</TabsTrigger>
            <TabsTrigger value="hsa">HSA</TabsTrigger>
            <TabsTrigger value="calculators">Calculators</TabsTrigger>
          </TabsList>

          {/* Crossover Point Tab */}
          <TabsContent value="crossover" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Crossover Calculator
                  </CardTitle>
                  <CardDescription>
                    Find when your passive income exceeds expenses
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Monthly Expenses</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">$</span>
                      <Input
                        type="number"
                        value={monthlyExpenses}
                        onChange={(e) => updateSetting('monthlyExpenses', Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Monthly Investment</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">$</span>
                      <Input
                        type="number"
                        value={monthlyInvestment}
                        onChange={(e) => updateSetting('monthlyInvestment', Number(e.target.value))}
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
                        onChange={(e) => updateSetting('currentSavings', Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Expected Annual Return: {expectedReturn}%</Label>
                    <Slider
                      value={[expectedReturn]}
                      onValueChange={(value) => updateSetting('expectedReturn', value[0])}
                      min={1}
                      max={15}
                      step={0.5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Safe Withdrawal Rate: {withdrawalRate}%</Label>
                    <Slider
                      value={[withdrawalRate]}
                      onValueChange={(value) => updateSetting('withdrawalRate', value[0])}
                      min={2}
                      max={6}
                      step={0.25}
                    />
                  </div>

                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>FIRE Number (25x expenses):</span>
                      <span className="font-bold">{formatCurrency(fireNumber)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Annual Expenses:</span>
                      <span className="font-bold">{formatCurrency(monthlyExpenses * 12)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Savings Rate:</span>
                      <span className="font-bold">
                        {((monthlyInvestment / (monthlyExpenses + monthlyInvestment)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Crossover Point Chart</CardTitle>
                  <CardDescription>
                    When your passive income (green) crosses your expenses (red), you've reached financial independence
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={crossoverData.data}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="year" 
                          label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis 
                          tickFormatter={(value) => formatCurrency(value)}
                        />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          labelFormatter={(label) => `Year ${label}`}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="savings"
                          name="Total Savings"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.2}
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="passiveIncome"
                          name="Passive Income"
                          stroke="#22c55e"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="expenses"
                          name="Annual Expenses"
                          stroke="#ef4444"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                        />
                        {crossoverData.crossoverYear !== null && (
                          <ReferenceLine
                            x={crossoverData.crossoverYear}
                            stroke="#22c55e"
                            strokeWidth={2}
                            label={{ value: 'Crossover!', fill: '#22c55e', fontSize: 12 }}
                          />
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {crossoverData.crossoverYear !== null && (
                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium text-green-700 dark:text-green-400">
                          Crossover Point: Year {crossoverData.crossoverYear}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Your passive income will exceed your expenses in {crossoverData.crossoverYear} years!
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Wealth Multiplier Tab */}
          <TabsContent value="multiplier" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Wealth Multiplier
                  </CardTitle>
                  <CardDescription>
                    Based on "The Money Guy Show" - See how $1 invested today grows by retirement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Your Current Age: {currentAge}</Label>
                    <Slider
                      value={[currentAge]}
                      onValueChange={(value) => updateSetting('currentAge', value[0])}
                      min={20}
                      max={65}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Retirement Age: {retirementAge}</Label>
                    <Slider
                      value={[retirementAge]}
                      onValueChange={(value) => updateSetting('retirementAge', value[0])}
                      min={55}
                      max={75}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Annual Contribution</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">$</span>
                      <Input
                        type="number"
                        value={annualContribution}
                        onChange={(e) => updateSetting('annualContribution', Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg space-y-3">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Your Wealth Multiplier at Age {currentAge}</p>
                      <p className="text-5xl font-bold text-primary">{wealthMultiplierData.multiplier}x</p>
                    </div>
                    <div className="border-t border-primary/20 pt-3">
                      <p className="text-sm text-center text-muted-foreground">
                        Every ${annualContribution.toLocaleString()} invested now becomes
                      </p>
                      <p className="text-2xl font-bold text-center text-primary">
                        {formatCurrency(wealthMultiplierData.futureValue)}
                      </p>
                      <p className="text-xs text-center text-muted-foreground mt-1">
                        by age 65 (assuming 10% annual return)
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      💡 The wealth multiplier shows how much each dollar invested today will be worth at retirement. 
                      The younger you start, the higher your multiplier due to compound growth!
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Wealth Multiplier by Age</CardTitle>
                  <CardDescription>
                    How your investment grows based on when you start
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={Object.entries(WEALTH_MULTIPLIERS).map(([age, mult]) => ({
                          age: Number(age),
                          multiplier: mult,
                          isCurrentAge: Number(age) === currentAge
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="age" label={{ value: 'Starting Age', position: 'insideBottom', offset: -5 }} />
                        <YAxis label={{ value: 'Multiplier', angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                          formatter={(value: number) => [`${value}x`, 'Multiplier']}
                          labelFormatter={(label) => `Starting Age: ${label}`}
                        />
                        <Bar 
                          dataKey="multiplier" 
                          fill="hsl(var(--primary))"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Your Growth Projection</h4>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={wealthMultiplierData.data}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="age" />
                          <YAxis tickFormatter={(value) => formatCurrency(value)} />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="accumulated"
                            name="Portfolio Value"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.3}
                            stroke="hsl(var(--primary))"
                          />
                          <Area
                            type="monotone"
                            dataKey="contributions"
                            name="Total Contributions"
                            fill="#94a3b8"
                            fillOpacity={0.3}
                            stroke="#94a3b8"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Multiplier Reference Table */}
            <Card>
              <CardHeader>
                <CardTitle>Wealth Multiplier Reference Table</CardTitle>
                <CardDescription>
                  Based on a 10% average annual return compounded to age 65
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {Object.entries(WEALTH_MULTIPLIERS).slice(0, 20).map(([age, mult]) => (
                    <div 
                      key={age}
                      className={`p-2 rounded-lg text-center ${
                        Number(age) === currentAge 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-xs text-muted-foreground">Age {age}</p>
                      <p className="font-bold">{mult}x</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Portfolio Projection Tab */}
          <TabsContent value="projection" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Retirement Projection
                  </CardTitle>
                  <CardDescription>
                    See how your portfolio grows through retirement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Age: {projCurrentAge}</Label>
                    <Slider
                      value={[projCurrentAge]}
                      onValueChange={(value) => updateSetting('projCurrentAge', value[0])}
                      min={18}
                      max={60}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Retirement Age: {projRetirementAge}</Label>
                    <Slider
                      value={[projRetirementAge]}
                      onValueChange={(value) => updateSetting('projRetirementAge', value[0])}
                      min={50}
                      max={75}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Current Savings</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">$</span>
                      <Input
                        type="number"
                        value={projCurrentSavings}
                        onChange={(e) => updateSetting('projCurrentSavings', Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Monthly Contribution</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">$</span>
                      <Input
                        type="number"
                        value={projMonthlyContrib}
                        onChange={(e) => updateSetting('projMonthlyContrib', Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Expected Return: {projExpectedReturn}%</Label>
                    <Slider
                      value={[projExpectedReturn]}
                      onValueChange={(value) => updateSetting('projExpectedReturn', value[0])}
                      min={3}
                      max={12}
                      step={0.5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Inflation Rate: {projInflation}%</Label>
                    <Slider
                      value={[projInflation]}
                      onValueChange={(value) => updateSetting('projInflation', value[0])}
                      min={1}
                      max={5}
                      step={0.5}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Portfolio Projection Through Retirement</CardTitle>
                  <CardDescription>
                    Accumulation phase (blue) vs Retirement phase (green) with 4% withdrawal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={retirementProjection}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="age" 
                          label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          labelFormatter={(label) => `Age ${label}`}
                        />
                        <ReferenceLine
                          x={projRetirementAge}
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          label={{ value: 'Retirement', fill: 'hsl(var(--primary))', fontSize: 12 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="portfolio"
                          name="Portfolio Value"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Years to Retirement</p>
                      <p className="text-xl font-bold">{retirementMetrics.yearsToRetirement}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Portfolio at {projRetirementAge}</p>
                      <p className="text-xl font-bold">{formatCurrency(retirementMetrics.portfolioAtRetirement)}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Annual Withdrawal (4%)</p>
                      <p className="text-xl font-bold">{formatCurrency(retirementMetrics.annualWithdrawal)}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Monthly Income</p>
                      <p className="text-xl font-bold">{formatCurrency(retirementMetrics.monthlyIncome)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Spending Breakdown Tab */}
          <TabsContent value="spending" className="space-y-4">
            <SpendingBreakdownCalculator
              annualSpending={annualSpendingPostRetirement}
              onSpendingChange={(total) => updateSetting('annualSpendingPostRetirement', total)}
              generalInflationRate={projInflation}
              yearsToRetirement={projRetirementAge - projCurrentAge}
            />
          </TabsContent>

          {/* Additional Calculators Tab */}
          <TabsContent value="calculators" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Compound Interest Calculator */}
              <CompoundInterestCalculator />
              
              {/* Rule of 72 */}
              <RuleOf72Calculator />
              
              {/* Coast FIRE Calculator */}
              <CoastFireCalculator />
            </div>
          </TabsContent>

          {/* Social Security Tab */}
          <TabsContent value="social-security" className="space-y-4">
            <SocialSecurityEstimator />
          </TabsContent>

          {/* Income Sources Tab */}
          <TabsContent value="income" className="space-y-4">
            <RetirementIncomeBreakdown />
          </TabsContent>

          {/* FIRE Types Tab */}
          <TabsContent value="fire" className="space-y-4">
            <FireTypesCalculator annualSpendingPostRetirement={annualSpendingPostRetirement} />
          </TabsContent>

          {/* Roth Conversion Tab */}
          <TabsContent value="roth" className="space-y-4">
            <RothConversionCalculator />
          </TabsContent>

          {/* RMD Tab */}
          <TabsContent value="rmd" className="space-y-4">
            <RMDCalculator />
          </TabsContent>

          {/* Healthcare Tab */}
          <TabsContent value="healthcare" className="space-y-4">
            <HealthcareCostEstimator />
          </TabsContent>

          {/* Withdrawal Strategy Tab */}
          <TabsContent value="withdrawal" className="space-y-4">
            <WithdrawalStrategyPlanner />
          </TabsContent>

          {/* HSA Tab */}
          <TabsContent value="hsa" className="space-y-4">
            <HSACalculator />
          </TabsContent>

          {/* Scenario Comparison Tab */}
          <TabsContent value="scenarios" className="space-y-4">
            <ScenarioComparison />
          </TabsContent>

          {/* Tax-Aware Withdrawal Optimizer Tab */}
          <TabsContent value="tax-optimizer" className="space-y-4">
            <TaxAwareWithdrawalOptimizer />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

// Compound Interest Calculator Component
const CompoundInterestCalculator = () => {
  const [principal, setPrincipal] = useState(10000);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(30);
  const [monthlyAdd, setMonthlyAdd] = useState(500);

  const result = useMemo(() => {
    const monthlyRate = rate / 100 / 12;
    let total = principal;
    
    for (let month = 0; month < years * 12; month++) {
      total = total * (1 + monthlyRate) + monthlyAdd;
    }
    
    const totalContributions = principal + (monthlyAdd * years * 12);
    const interestEarned = total - totalContributions;
    
    return { total, totalContributions, interestEarned };
  }, [principal, rate, years, monthlyAdd]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PiggyBank className="h-5 w-5" />
          Compound Interest
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Principal</Label>
            <Input
              type="number"
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Monthly Add</Label>
            <Input
              type="number"
              value={monthlyAdd}
              onChange={(e) => setMonthlyAdd(Number(e.target.value))}
              className="h-8"
            />
          </div>
        </div>
        
        <div className="space-y-1">
          <Label className="text-xs">Annual Return: {rate}%</Label>
          <Slider
            value={[rate]}
            onValueChange={(value) => setRate(value[0])}
            min={1}
            max={15}
            step={0.5}
          />
        </div>
        
        <div className="space-y-1">
          <Label className="text-xs">Years: {years}</Label>
          <Slider
            value={[years]}
            onValueChange={(value) => setYears(value[0])}
            min={1}
            max={50}
            step={1}
          />
        </div>
        
        <div className="p-3 bg-primary/10 rounded-lg space-y-1">
          <div className="flex justify-between text-sm">
            <span>Total Value:</span>
            <span className="font-bold">${result.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Contributions:</span>
            <span>${result.totalContributions.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs text-green-600">
            <span>Interest Earned:</span>
            <span>${result.interestEarned.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Rule of 72 Calculator
const RuleOf72Calculator = () => {
  const [rate, setRate] = useState(7);
  const [targetAmount, setTargetAmount] = useState(1000000);
  const [currentAmount, setCurrentAmount] = useState(100000);

  const doublingTime = useMemo(() => {
    return 72 / rate;
  }, [rate]);

  const timesToDouble = useMemo(() => {
    return Math.log2(targetAmount / currentAmount);
  }, [targetAmount, currentAmount]);

  const yearsToTarget = useMemo(() => {
    return doublingTime * timesToDouble;
  }, [doublingTime, timesToDouble]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Percent className="h-5 w-5" />
          Rule of 72
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label className="text-xs">Annual Return: {rate}%</Label>
          <Slider
            value={[rate]}
            onValueChange={(value) => setRate(value[0])}
            min={1}
            max={20}
            step={0.5}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Current Amount</Label>
            <Input
              type="number"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(Number(e.target.value))}
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Target Amount</Label>
            <Input
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(Number(e.target.value))}
              className="h-8"
            />
          </div>
        </div>
        
        <div className="p-3 bg-primary/10 rounded-lg space-y-2">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Money doubles every</p>
            <p className="text-2xl font-bold">{doublingTime.toFixed(1)} years</p>
          </div>
          <div className="border-t border-primary/20 pt-2 text-center">
            <p className="text-xs text-muted-foreground">Time to reach ${(targetAmount/1000).toFixed(0)}K</p>
            <p className="text-xl font-bold">{yearsToTarget.toFixed(1)} years</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Coast FIRE Calculator
const CoastFireCalculator = () => {
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(65);
  const [targetNestEgg, setTargetNestEgg] = useState(1500000);
  const [expectedReturn, setExpectedReturn] = useState(7);

  const coastNumber = useMemo(() => {
    const years = retirementAge - currentAge;
    const rate = expectedReturn / 100;
    return targetNestEgg / Math.pow(1 + rate, years);
  }, [currentAge, retirementAge, targetNestEgg, expectedReturn]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Coast FIRE
        </CardTitle>
        <CardDescription className="text-xs">
          Amount needed now to coast to retirement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Current Age: {currentAge}</Label>
            <Slider
              value={[currentAge]}
              onValueChange={(value) => setCurrentAge(value[0])}
              min={20}
              max={55}
              step={1}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Retire at: {retirementAge}</Label>
            <Slider
              value={[retirementAge]}
              onValueChange={(value) => setRetirementAge(value[0])}
              min={55}
              max={75}
              step={1}
            />
          </div>
        </div>
        
        <div className="space-y-1">
          <Label className="text-xs">Target Nest Egg at Retirement</Label>
          <Input
            type="number"
            value={targetNestEgg}
            onChange={(e) => setTargetNestEgg(Number(e.target.value))}
            className="h-8"
          />
        </div>
        
        <div className="space-y-1">
          <Label className="text-xs">Expected Return: {expectedReturn}%</Label>
          <Slider
            value={[expectedReturn]}
            onValueChange={(value) => setExpectedReturn(value[0])}
            min={3}
            max={12}
            step={0.5}
          />
        </div>
        
        <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-lg text-center">
          <p className="text-xs text-muted-foreground">Your Coast FIRE Number</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            ${coastNumber.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Save this much, then let compound growth do the rest!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RetirementPlanning;
