import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  Plus, Trash2, Copy, Save, FileText, TrendingUp, DollarSign, 
  Clock, Target, ArrowRight, CheckCircle2, AlertCircle, Edit2
} from 'lucide-react';
import { toast } from 'sonner';

interface RetirementScenario {
  id: string;
  name: string;
  color: string;
  // Inputs
  currentAge: number;
  retirementAge: number;
  currentSavings: number;
  monthlyContribution: number;
  annualSpending: number;
  expectedReturn: number;
  inflationRate: number;
  socialSecurity: number;
  pension: number;
  // Calculated metrics (computed)
  fireNumber?: number;
  yearsToFire?: number;
  portfolioAtRetirement?: number;
  successProbability?: number;
  legacyAmount?: number;
}

const SCENARIO_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'
];

const defaultScenario: Omit<RetirementScenario, 'id' | 'name' | 'color'> = {
  currentAge: 35,
  retirementAge: 60,
  currentSavings: 200000,
  monthlyContribution: 3000,
  annualSpending: 60000,
  expectedReturn: 7,
  inflationRate: 2.5,
  socialSecurity: 24000,
  pension: 0
};

export const ScenarioComparison: React.FC = () => {
  const [scenarios, setScenarios] = useState<RetirementScenario[]>([
    {
      id: '1',
      name: 'Conservative',
      color: SCENARIO_COLORS[0],
      currentAge: 35,
      retirementAge: 65,
      currentSavings: 200000,
      monthlyContribution: 2000,
      annualSpending: 50000,
      expectedReturn: 5,
      inflationRate: 3,
      socialSecurity: 28000,
      pension: 0
    },
    {
      id: '2',
      name: 'Moderate',
      color: SCENARIO_COLORS[1],
      currentAge: 35,
      retirementAge: 60,
      currentSavings: 200000,
      monthlyContribution: 3000,
      annualSpending: 60000,
      expectedReturn: 7,
      inflationRate: 2.5,
      socialSecurity: 24000,
      pension: 0
    },
    {
      id: '3',
      name: 'Aggressive',
      color: SCENARIO_COLORS[2],
      currentAge: 35,
      retirementAge: 55,
      currentSavings: 200000,
      monthlyContribution: 4000,
      annualSpending: 70000,
      expectedReturn: 9,
      inflationRate: 2.5,
      socialSecurity: 20000,
      pension: 0
    }
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('comparison');

  // Calculate metrics for each scenario
  const scenariosWithMetrics = useMemo(() => {
    return scenarios.map(scenario => {
      const { 
        currentAge, retirementAge, currentSavings, monthlyContribution,
        annualSpending, expectedReturn, inflationRate, socialSecurity, pension
      } = scenario;

      const yearsToRetirement = retirementAge - currentAge;
      const monthlyReturn = expectedReturn / 100 / 12;
      
      // Calculate portfolio at retirement
      let portfolio = currentSavings;
      for (let month = 0; month < yearsToRetirement * 12; month++) {
        portfolio = portfolio * (1 + monthlyReturn) + monthlyContribution;
      }

      // FIRE number (25x spending minus guaranteed income)
      const netSpending = Math.max(0, annualSpending - socialSecurity - pension);
      const fireNumber = netSpending * 25;

      // Years to FIRE
      let yearsToFire = 0;
      let tempPortfolio = currentSavings;
      while (tempPortfolio < fireNumber && yearsToFire < 50) {
        for (let month = 0; month < 12; month++) {
          tempPortfolio = tempPortfolio * (1 + monthlyReturn) + monthlyContribution;
        }
        yearsToFire++;
      }
      if (tempPortfolio < fireNumber) yearsToFire = 99;

      // Simple success probability (based on 4% rule safety margin)
      const withdrawalRate = netSpending / portfolio * 100;
      let successProbability = 95;
      if (withdrawalRate > 4) successProbability -= (withdrawalRate - 4) * 15;
      if (withdrawalRate < 3) successProbability = 99;
      successProbability = Math.max(30, Math.min(99, successProbability));

      // Legacy at 90 (simplified)
      let legacy = portfolio;
      const realReturn = (expectedReturn - inflationRate) / 100;
      for (let year = 0; year < 90 - retirementAge; year++) {
        legacy = (legacy - netSpending) * (1 + realReturn);
        if (legacy < 0) {
          legacy = 0;
          break;
        }
      }

      return {
        ...scenario,
        fireNumber: Math.round(fireNumber),
        yearsToFire: Math.round(yearsToFire),
        portfolioAtRetirement: Math.round(portfolio),
        successProbability: Math.round(successProbability),
        legacyAmount: Math.round(Math.max(0, legacy))
      };
    });
  }, [scenarios]);

  const addScenario = () => {
    if (scenarios.length >= 7) {
      toast.error('Maximum 7 scenarios allowed');
      return;
    }
    const newScenario: RetirementScenario = {
      ...defaultScenario,
      id: Date.now().toString(),
      name: `Scenario ${scenarios.length + 1}`,
      color: SCENARIO_COLORS[scenarios.length % SCENARIO_COLORS.length]
    };
    setScenarios([...scenarios, newScenario]);
    setEditingId(newScenario.id);
    toast.success('New scenario added');
  };

  const duplicateScenario = (id: string) => {
    const source = scenarios.find(s => s.id === id);
    if (!source || scenarios.length >= 7) return;
    
    const newScenario: RetirementScenario = {
      ...source,
      id: Date.now().toString(),
      name: `${source.name} (Copy)`,
      color: SCENARIO_COLORS[scenarios.length % SCENARIO_COLORS.length]
    };
    setScenarios([...scenarios, newScenario]);
    toast.success('Scenario duplicated');
  };

  const deleteScenario = (id: string) => {
    if (scenarios.length <= 1) {
      toast.error('At least one scenario required');
      return;
    }
    setScenarios(scenarios.filter(s => s.id !== id));
    if (editingId === id) setEditingId(null);
    toast.success('Scenario deleted');
  };

  const updateScenario = (id: string, updates: Partial<RetirementScenario>) => {
    setScenarios(scenarios.map(s => 
      s.id === id ? { ...s, ...updates } : s
    ));
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  // Prepare comparison chart data
  const comparisonData = [
    { metric: 'Portfolio at Retirement', ...Object.fromEntries(scenariosWithMetrics.map(s => [s.name, s.portfolioAtRetirement])) },
    { metric: 'FIRE Number', ...Object.fromEntries(scenariosWithMetrics.map(s => [s.name, s.fireNumber])) },
    { metric: 'Legacy at 90', ...Object.fromEntries(scenariosWithMetrics.map(s => [s.name, s.legacyAmount])) },
  ];

  // Radar chart data
  const radarData = scenariosWithMetrics.map(s => ({
    scenario: s.name,
    'Success %': s.successProbability,
    'Years to FIRE': Math.max(0, 100 - s.yearsToFire! * 2),
    'Legacy Score': Math.min(100, s.legacyAmount! / 10000),
    'Retirement Age': 100 - s.retirementAge,
    'Savings Rate': Math.min(100, (s.monthlyContribution * 12 / (s.annualSpending + s.monthlyContribution * 12)) * 100)
  }));

  const editingScenario = scenarios.find(s => s.id === editingId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Retirement Scenario Comparison</h2>
            <p className="text-muted-foreground">Compare different retirement strategies side-by-side</p>
          </div>
        </div>
        <Button onClick={addScenario} disabled={scenarios.length >= 7}>
          <Plus className="h-4 w-4 mr-2" />
          Add Scenario
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="details">Edit Scenarios</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-6">
          {/* Scenario Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenariosWithMetrics.map((scenario) => (
              <Card key={scenario.id} className="relative overflow-hidden">
                <div 
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: scenario.color }}
                />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: scenario.color }}
                      />
                      {scenario.name}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => {
                          setEditingId(scenario.id);
                          setActiveTab('details');
                        }}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => duplicateScenario(scenario.id)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-destructive"
                        onClick={() => deleteScenario(scenario.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    Retire at {scenario.retirementAge} • {formatCurrency(scenario.annualSpending)}/yr spending
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 rounded bg-muted">
                      <p className="text-xs text-muted-foreground">FIRE Number</p>
                      <p className="font-bold">{formatCurrency(scenario.fireNumber!)}</p>
                    </div>
                    <div className="p-2 rounded bg-muted">
                      <p className="text-xs text-muted-foreground">Years to FIRE</p>
                      <p className="font-bold">{scenario.yearsToFire! < 50 ? scenario.yearsToFire : '50+'}</p>
                    </div>
                    <div className="p-2 rounded bg-muted">
                      <p className="text-xs text-muted-foreground">At Retirement</p>
                      <p className="font-bold">{formatCurrency(scenario.portfolioAtRetirement!)}</p>
                    </div>
                    <div className="p-2 rounded bg-muted">
                      <p className="text-xs text-muted-foreground">Success Rate</p>
                      <p className="font-bold">{scenario.successProbability}%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {scenario.successProbability! >= 90 ? (
                      <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        On Track
                      </Badge>
                    ) : scenario.successProbability! >= 70 ? (
                      <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        At Risk
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Needs Work
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Legacy: {formatCurrency(scenario.legacyAmount!)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Side-by-Side Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">Metric</th>
                      {scenariosWithMetrics.map(s => (
                        <th key={s.id} className="text-right py-2 px-3" style={{ color: s.color }}>
                          {s.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="py-2 px-3 text-muted-foreground">Retirement Age</td>
                      {scenariosWithMetrics.map(s => <td key={s.id} className="text-right py-2 px-3 font-medium">{s.retirementAge}</td>)}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-muted-foreground">Monthly Savings</td>
                      {scenariosWithMetrics.map(s => <td key={s.id} className="text-right py-2 px-3 font-medium">{formatCurrency(s.monthlyContribution)}</td>)}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-muted-foreground">Annual Spending</td>
                      {scenariosWithMetrics.map(s => <td key={s.id} className="text-right py-2 px-3 font-medium">{formatCurrency(s.annualSpending)}</td>)}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-muted-foreground">Expected Return</td>
                      {scenariosWithMetrics.map(s => <td key={s.id} className="text-right py-2 px-3 font-medium">{s.expectedReturn}%</td>)}
                    </tr>
                    <tr className="bg-muted/30">
                      <td className="py-2 px-3 font-medium">FIRE Number</td>
                      {scenariosWithMetrics.map(s => <td key={s.id} className="text-right py-2 px-3 font-bold">{formatCurrency(s.fireNumber!)}</td>)}
                    </tr>
                    <tr className="bg-muted/30">
                      <td className="py-2 px-3 font-medium">Years to FIRE</td>
                      {scenariosWithMetrics.map(s => <td key={s.id} className="text-right py-2 px-3 font-bold">{s.yearsToFire! < 50 ? s.yearsToFire : '50+'}</td>)}
                    </tr>
                    <tr className="bg-muted/30">
                      <td className="py-2 px-3 font-medium">Portfolio at Retirement</td>
                      {scenariosWithMetrics.map(s => <td key={s.id} className="text-right py-2 px-3 font-bold">{formatCurrency(s.portfolioAtRetirement!)}</td>)}
                    </tr>
                    <tr className="bg-muted/30">
                      <td className="py-2 px-3 font-medium">Success Probability</td>
                      {scenariosWithMetrics.map(s => (
                        <td key={s.id} className={`text-right py-2 px-3 font-bold ${
                          s.successProbability! >= 90 ? 'text-green-600' : 
                          s.successProbability! >= 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {s.successProbability}%
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-muted/30">
                      <td className="py-2 px-3 font-medium">Legacy at 90</td>
                      {scenariosWithMetrics.map(s => <td key={s.id} className="text-right py-2 px-3 font-bold">{formatCurrency(s.legacyAmount!)}</td>)}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Scenario List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Scenarios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {scenarios.map(s => (
                  <Button
                    key={s.id}
                    variant={editingId === s.id ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setEditingId(s.id)}
                  >
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: s.color }}
                    />
                    {s.name}
                  </Button>
                ))}
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={addScenario}
                  disabled={scenarios.length >= 7}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Scenario
                </Button>
              </CardContent>
            </Card>

            {/* Edit Form */}
            {editingScenario && (
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: editingScenario.color }}
                    />
                    Edit: {editingScenario.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Scenario Name</Label>
                      <Input
                        value={editingScenario.name}
                        onChange={(e) => updateScenario(editingScenario.id, { name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Current Age: {editingScenario.currentAge}</Label>
                      <Slider
                        value={[editingScenario.currentAge]}
                        onValueChange={(v) => updateScenario(editingScenario.id, { currentAge: v[0] })}
                        min={20}
                        max={65}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Retirement Age: {editingScenario.retirementAge}</Label>
                      <Slider
                        value={[editingScenario.retirementAge]}
                        onValueChange={(v) => updateScenario(editingScenario.id, { retirementAge: v[0] })}
                        min={40}
                        max={75}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Current Savings</Label>
                      <Input
                        type="number"
                        value={editingScenario.currentSavings}
                        onChange={(e) => updateScenario(editingScenario.id, { currentSavings: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Monthly Contribution</Label>
                      <Input
                        type="number"
                        value={editingScenario.monthlyContribution}
                        onChange={(e) => updateScenario(editingScenario.id, { monthlyContribution: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Annual Spending</Label>
                      <Input
                        type="number"
                        value={editingScenario.annualSpending}
                        onChange={(e) => updateScenario(editingScenario.id, { annualSpending: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Expected Return: {editingScenario.expectedReturn}%</Label>
                      <Slider
                        value={[editingScenario.expectedReturn]}
                        onValueChange={(v) => updateScenario(editingScenario.id, { expectedReturn: v[0] })}
                        min={3}
                        max={12}
                        step={0.5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Inflation Rate: {editingScenario.inflationRate}%</Label>
                      <Slider
                        value={[editingScenario.inflationRate]}
                        onValueChange={(v) => updateScenario(editingScenario.id, { inflationRate: v[0] })}
                        min={1}
                        max={5}
                        step={0.5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Social Security (annual)</Label>
                      <Input
                        type="number"
                        value={editingScenario.socialSecurity}
                        onChange={(e) => updateScenario(editingScenario.id, { socialSecurity: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pension (annual)</Label>
                      <Input
                        type="number"
                        value={editingScenario.pension}
                        onChange={(e) => updateScenario(editingScenario.id, { pension: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio & FIRE Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                      <YAxis type="category" dataKey="metric" width={150} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend />
                      {scenariosWithMetrics.map(s => (
                        <Bar key={s.id} dataKey={s.name} fill={s.color} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Metrics Radar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={[
                      { subject: 'Success %', fullMark: 100, ...Object.fromEntries(scenariosWithMetrics.map(s => [s.name, s.successProbability])) },
                      { subject: 'Early Retire', fullMark: 100, ...Object.fromEntries(scenariosWithMetrics.map(s => [s.name, Math.max(0, 100 - (s.retirementAge - 40) * 3)])) },
                      { subject: 'Savings Rate', fullMark: 100, ...Object.fromEntries(scenariosWithMetrics.map(s => [s.name, Math.min(100, (s.monthlyContribution * 12 / (s.annualSpending + s.monthlyContribution * 12)) * 100)])) },
                      { subject: 'Legacy', fullMark: 100, ...Object.fromEntries(scenariosWithMetrics.map(s => [s.name, Math.min(100, s.legacyAmount! / 20000)])) },
                      { subject: 'Speed to FIRE', fullMark: 100, ...Object.fromEntries(scenariosWithMetrics.map(s => [s.name, Math.max(0, 100 - s.yearsToFire! * 2)])) },
                    ]}>
                      <PolarGrid className="stroke-muted" />
                      <PolarAngleAxis dataKey="subject" className="text-xs" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      {scenariosWithMetrics.map(s => (
                        <Radar key={s.id} name={s.name} dataKey={s.name} stroke={s.color} fill={s.color} fillOpacity={0.2} />
                      ))}
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Portfolio Growth Projection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="age" type="number" domain={['dataMin', 'dataMax']} label={{ value: 'Age', position: 'bottom' }} />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                    {scenariosWithMetrics.map(scenario => {
                      // Generate projection data
                      const projectionData = [];
                      let portfolio = scenario.currentSavings;
                      const monthlyReturn = scenario.expectedReturn / 100 / 12;
                      
                      for (let age = scenario.currentAge; age <= 90; age++) {
                        projectionData.push({ age, value: Math.round(portfolio) });
                        
                        if (age < scenario.retirementAge) {
                          for (let m = 0; m < 12; m++) {
                            portfolio = portfolio * (1 + monthlyReturn) + scenario.monthlyContribution;
                          }
                        } else {
                          const netSpending = scenario.annualSpending - scenario.socialSecurity - scenario.pension;
                          portfolio = (portfolio - netSpending) * (1 + scenario.expectedReturn / 100 - scenario.inflationRate / 100);
                          if (portfolio < 0) portfolio = 0;
                        }
                      }
                      
                      return (
                        <Line
                          key={scenario.id}
                          data={projectionData}
                          dataKey="value"
                          name={scenario.name}
                          stroke={scenario.color}
                          strokeWidth={2}
                          dot={false}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Scenario Analysis Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {scenariosWithMetrics.map(scenario => {
                const bestMetrics: string[] = [];
                
                // Check if this scenario has the best of any metric
                const maxSuccess = Math.max(...scenariosWithMetrics.map(s => s.successProbability!));
                const minYears = Math.min(...scenariosWithMetrics.map(s => s.yearsToFire!));
                const maxLegacy = Math.max(...scenariosWithMetrics.map(s => s.legacyAmount!));
                const earliestRetire = Math.min(...scenariosWithMetrics.map(s => s.retirementAge));
                
                if (scenario.successProbability === maxSuccess) bestMetrics.push('Highest Success Rate');
                if (scenario.yearsToFire === minYears) bestMetrics.push('Fastest to FIRE');
                if (scenario.legacyAmount === maxLegacy) bestMetrics.push('Largest Legacy');
                if (scenario.retirementAge === earliestRetire) bestMetrics.push('Earliest Retirement');

                return (
                  <div key={scenario.id} className="p-4 rounded-lg border" style={{ borderColor: `${scenario.color}40` }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: scenario.color }}
                        />
                        <h3 className="font-bold text-lg">{scenario.name}</h3>
                      </div>
                      <div className="flex gap-1 flex-wrap justify-end">
                        {bestMetrics.map(metric => (
                          <Badge key={metric} variant="secondary" className="text-xs">
                            🏆 {metric}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Path to FIRE</p>
                        <p className="font-medium">
                          Age {scenario.currentAge} → {scenario.currentAge + scenario.yearsToFire!} 
                          <span className="text-muted-foreground"> ({scenario.yearsToFire} years)</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Retire at {scenario.retirementAge} with</p>
                        <p className="font-medium">{formatCurrency(scenario.portfolioAtRetirement!)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Withdrawal Rate</p>
                        <p className="font-medium">
                          {((scenario.annualSpending - scenario.socialSecurity - scenario.pension) / scenario.portfolioAtRetirement! * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Confidence Level</p>
                        <p className={`font-medium ${
                          scenario.successProbability! >= 90 ? 'text-green-600' : 
                          scenario.successProbability! >= 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {scenario.successProbability}% success
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
