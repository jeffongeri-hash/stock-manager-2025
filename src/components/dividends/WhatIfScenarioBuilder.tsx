import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, GitCompare, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Scenario {
  id: string;
  name: string;
  monthlyContribution: number;
  dividendGrowthRate: number;
  startingValue: number;
  avgYield: number;
}

interface ScenarioResult {
  year: number;
  [key: string]: number;
}

interface WhatIfScenarioBuilderProps {
  initialPortfolioValue: number;
  initialAnnualIncome: number;
  currentYield: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(142, 76%, 36%)'];

export function WhatIfScenarioBuilder({ 
  initialPortfolioValue, 
  initialAnnualIncome,
  currentYield 
}: WhatIfScenarioBuilderProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([
    {
      id: '1',
      name: 'Conservative',
      monthlyContribution: 500,
      dividendGrowthRate: 3,
      startingValue: initialPortfolioValue,
      avgYield: currentYield || 4,
    },
    {
      id: '2',
      name: 'Moderate',
      monthlyContribution: 1000,
      dividendGrowthRate: 5,
      startingValue: initialPortfolioValue,
      avgYield: currentYield || 4,
    },
    {
      id: '3',
      name: 'Aggressive',
      monthlyContribution: 2000,
      dividendGrowthRate: 7,
      startingValue: initialPortfolioValue,
      avgYield: currentYield || 4,
    },
  ]);
  const [projectionYears, setProjectionYears] = useState(20);

  const addScenario = () => {
    if (scenarios.length >= 4) return;
    const newScenario: Scenario = {
      id: Date.now().toString(),
      name: `Scenario ${scenarios.length + 1}`,
      monthlyContribution: 1000,
      dividendGrowthRate: 5,
      startingValue: initialPortfolioValue,
      avgYield: currentYield || 4,
    };
    setScenarios([...scenarios, newScenario]);
  };

  const removeScenario = (id: string) => {
    if (scenarios.length <= 1) return;
    setScenarios(scenarios.filter(s => s.id !== id));
  };

  const updateScenario = (id: string, field: keyof Scenario, value: number | string) => {
    setScenarios(scenarios.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  // Calculate projections for all scenarios
  const projectionData = useMemo(() => {
    const data: ScenarioResult[] = [];
    
    for (let year = 0; year <= projectionYears; year++) {
      const yearData: ScenarioResult = { year };
      
      scenarios.forEach(scenario => {
        let portfolioValue = scenario.startingValue;
        let annualDividend = portfolioValue * (scenario.avgYield / 100);
        
        for (let y = 0; y < year; y++) {
          // Add monthly contributions
          const yearlyContribution = scenario.monthlyContribution * 12;
          portfolioValue += yearlyContribution;
          
          // Reinvest dividends
          portfolioValue += annualDividend;
          
          // Apply dividend growth
          annualDividend = portfolioValue * (scenario.avgYield / 100);
          annualDividend *= (1 + scenario.dividendGrowthRate / 100);
        }
        
        yearData[`${scenario.name}_value`] = Math.round(portfolioValue);
        yearData[`${scenario.name}_income`] = Math.round(annualDividend);
      });
      
      data.push(yearData);
    }
    
    return data;
  }, [scenarios, projectionYears]);

  // Final year comparison
  const finalComparison = useMemo(() => {
    const finalData = projectionData[projectionData.length - 1];
    if (!finalData) return [];
    
    return scenarios.map((scenario, i) => {
      const finalValue = finalData[`${scenario.name}_value`] || 0;
      const finalIncome = finalData[`${scenario.name}_income`] || 0;
      const totalContributed = scenario.startingValue + (scenario.monthlyContribution * 12 * projectionYears);
      
      return {
        ...scenario,
        finalValue,
        finalIncome,
        totalContributed,
        totalGain: finalValue - totalContributed,
        color: COLORS[i % COLORS.length],
      };
    });
  }, [scenarios, projectionData, projectionYears]);

  return (
    <div className="space-y-4">
      {/* Scenario Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitCompare className="h-5 w-5" />
                What-If Scenario Builder
              </CardTitle>
              <CardDescription>
                Compare different contribution and growth assumptions side by side
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Years:</Label>
                <Input
                  type="number"
                  value={projectionYears}
                  onChange={(e) => setProjectionYears(Math.min(50, Math.max(5, Number(e.target.value))))}
                  className="w-20"
                />
              </div>
              <Button 
                onClick={addScenario} 
                size="sm"
                disabled={scenarios.length >= 4}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Scenario
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {scenarios.map((scenario, i) => (
              <Card 
                key={scenario.id} 
                className="border-2"
                style={{ borderColor: COLORS[i % COLORS.length] }}
              >
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <Input
                      value={scenario.name}
                      onChange={(e) => updateScenario(scenario.id, 'name', e.target.value)}
                      className="h-7 text-sm font-medium border-none p-0 focus-visible:ring-0"
                    />
                    {scenarios.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => removeScenario(scenario.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 px-4 pb-4">
                  <div>
                    <Label className="text-xs">Monthly Contribution</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">$</span>
                      <Input
                        type="number"
                        value={scenario.monthlyContribution}
                        onChange={(e) => updateScenario(scenario.id, 'monthlyContribution', Number(e.target.value))}
                        className="h-8"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs">Dividend Growth Rate</Label>
                      <span className="text-xs font-medium">{scenario.dividendGrowthRate}%</span>
                    </div>
                    <Slider
                      value={[scenario.dividendGrowthRate]}
                      onValueChange={(v) => updateScenario(scenario.id, 'dividendGrowthRate', v[0])}
                      min={0}
                      max={15}
                      step={0.5}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs">Average Yield</Label>
                      <span className="text-xs font-medium">{scenario.avgYield}%</span>
                    </div>
                    <Slider
                      value={[scenario.avgYield]}
                      onValueChange={(v) => updateScenario(scenario.id, 'avgYield', v[0])}
                      min={1}
                      max={15}
                      step={0.25}
                      className="mt-2"
                    />
                  </div>

                  <div className="pt-2 border-t text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Yearly contribution:</span>
                      <span className="font-medium">${(scenario.monthlyContribution * 12).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total over {projectionYears}y:</span>
                      <span className="font-medium">${(scenario.monthlyContribution * 12 * projectionYears).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Value Projection</CardTitle>
          <CardDescription>Compare how your portfolio grows under different scenarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData}>
                <defs>
                  {scenarios.map((scenario, i) => (
                    <linearGradient 
                      key={scenario.id} 
                      id={`gradient-${scenario.id}`} 
                      x1="0" y1="0" x2="0" y2="1"
                    >
                      <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="year" 
                  tickFormatter={(v) => `Year ${v}`}
                  className="text-xs"
                />
                <YAxis 
                  tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                  className="text-xs"
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `$${value.toLocaleString()}`,
                    name.replace('_value', '')
                  ]}
                  labelFormatter={(label) => `Year ${label}`}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                {scenarios.map((scenario, i) => (
                  <Area
                    key={scenario.id}
                    type="monotone"
                    dataKey={`${scenario.name}_value`}
                    name={scenario.name}
                    stroke={COLORS[i % COLORS.length]}
                    fill={`url(#gradient-${scenario.id})`}
                    strokeWidth={2}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Final Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {projectionYears}-Year Outcome Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scenario</TableHead>
                <TableHead className="text-right">Monthly Contrib.</TableHead>
                <TableHead className="text-right">Total Invested</TableHead>
                <TableHead className="text-right">Final Value</TableHead>
                <TableHead className="text-right">Annual Income</TableHead>
                <TableHead className="text-right">Monthly Income</TableHead>
                <TableHead className="text-right">Total Gain</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finalComparison.map((scenario) => (
                <TableRow key={scenario.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: scenario.color }}
                      />
                      <span className="font-medium">{scenario.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">${scenario.monthlyContribution.toLocaleString()}</TableCell>
                  <TableCell className="text-right">${scenario.totalContributed.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-bold">${scenario.finalValue.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-success font-medium">
                    ${scenario.finalIncome.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-success">
                    ${Math.round(scenario.finalIncome / 12).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={scenario.totalGain > 0 ? 'default' : 'destructive'}>
                      +${scenario.totalGain.toLocaleString()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
