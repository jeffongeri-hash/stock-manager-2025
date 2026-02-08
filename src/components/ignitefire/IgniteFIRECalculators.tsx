import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, ReferenceLine, LineChart, Line, Legend 
} from 'recharts';
import { TrendingUp, Briefcase, SlidersHorizontal, Zap, UserPlus, Flame, ShieldAlert, HelpCircle } from 'lucide-react';
import { IgniteUserFinancials } from '@/types/ignitefire';

interface IgniteFIRECalculatorsProps {
  financials: IgniteUserFinancials;
}

export const IgniteFIRECalculators: React.FC<IgniteFIRECalculatorsProps> = ({ financials }) => {
  const [activeTab, setActiveTab] = useState<'milestones' | 'barista' | 'sensitivity' | 'whatif'>('milestones');
  
  // Barista Lab States
  const [baristaAge, setBaristaAge] = useState(financials.retirementAge);
  const [baristaIncome, setBaristaIncome] = useState(30000);
  const [baristaSpend, setBaristaSpend] = useState(financials.annualSpending);

  // SWR / Sensitivity States
  const [crashMagnitude, setCrashMagnitude] = useState(25);
  const [sorrPortfolioVal, setSorrPortfolioVal] = useState(financials.currentNetWorth || 1000000);
  const [simRetireAge, setSimRetireAge] = useState(financials.currentAge + 5);
  const [simAnnualSpend, setSimAnnualSpend] = useState(financials.annualSpending);
  const [ssIncome, setSsIncome] = useState(24000);
  const [ssAge, setSsAge] = useState(67);
  const [inflation, setInflation] = useState(2.8);
  const [simReturn, setSimReturn] = useState(6.5);

  // Simulation Overrides for Trajectory/Milestones
  const [simSavings, setSimSavings] = useState(financials.annualSavings);
  const [simReturnRate, setSimReturnRate] = useState(financials.expectedReturn);
  const [simSpending, setSimSpending] = useState(financials.annualSpending);

  // What-If States
  const [wiNW, setWiNW] = useState(financials.currentNetWorth);
  const [wiMonthlySave, setWiMonthlySave] = useState(4000);
  const [wiRate, setWiRate] = useState(7.0);
  const [wiMode, setWiMode] = useState<'target' | 'time'>('target');
  const [wiTargetVal, setWiTargetVal] = useState(1000000);
  const [wiDurationYrs, setWiDurationYrs] = useState(10);

  useEffect(() => {
    setSimSavings(financials.annualSavings);
    setSimReturnRate(financials.expectedReturn);
    setSimSpending(financials.annualSpending);
  }, [financials.annualSavings, financials.expectedReturn, financials.annualSpending]);

  const milestonesData = useMemo(() => {
    const data = [];
    let netWorth = financials.currentNetWorth;
    const maxAge = 85;
    for (let age = financials.currentAge; age <= maxAge; age++) {
      if (age > financials.currentAge) {
        netWorth = netWorth * (1 + simReturnRate / 100);
        if (age <= financials.retirementAge) netWorth += simSavings;
        else netWorth -= simSpending;
      }
      data.push({ age, netWorth: Math.max(0, Math.round(netWorth)) });
    }
    return data;
  }, [financials.currentAge, financials.currentNetWorth, financials.retirementAge, simReturnRate, simSavings, simSpending]);

  const baristaData = useMemo(() => {
    const data = [];
    let netWorth = financials.currentNetWorth;
    const maxAge = 85;
    for (let age = financials.currentAge; age <= maxAge; age++) {
      if (age > financials.currentAge) {
        netWorth = netWorth * (1 + financials.expectedReturn / 100);
        if (age < baristaAge) {
          netWorth += financials.annualSavings;
        } else if (age >= baristaAge && age < financials.retirementAge) {
          const netBarista = baristaIncome - baristaSpend;
          netWorth += netBarista;
        } else {
          netWorth -= financials.annualSpending;
        }
      }
      data.push({ age, netWorth: Math.max(0, Math.round(netWorth)) });
    }
    return data;
  }, [financials, baristaAge, baristaIncome, baristaSpend]);

  const sorrSimData = useMemo(() => {
    const generatePath = (crashYear: number | null) => {
      const path = [];
      let balance = sorrPortfolioVal;
      let spend = simAnnualSpend;
      for (let yr = 0; yr <= 35; yr++) {
        const age = simRetireAge + yr;
        const income = age >= ssAge ? ssIncome : 0;
        let yearlyReturn = simReturn / 100;
        if (crashYear !== null && yr === crashYear) yearlyReturn = -(crashMagnitude / 100);
        path.push({ age, balance: Math.max(0, balance) });
        balance = (balance * (1 + yearlyReturn)) - (spend - income);
        spend = spend * (1 + inflation / 100);
      }
      return path;
    };
    const early = generatePath(1);
    const mid = generatePath(15);
    const steady = generatePath(null);
    return steady.map((s, i) => ({
      age: s.age,
      "Steady Growth": Math.round(s.balance),
      "Year 1 Shock": Math.round(early[i].balance),
      "Year 15 Shock": Math.round(mid[i].balance),
    }));
  }, [sorrPortfolioVal, simRetireAge, simAnnualSpend, simReturn, crashMagnitude, inflation, ssIncome, ssAge]);

  const whatIfCalculation = useMemo(() => {
    const monthlyRate = Math.max(0.00001, wiRate / 100 / 12);
    const p = Math.max(0, wiNW);
    const c = Math.max(0, wiMonthlySave);
    const MAX_MONTHS = 600;

    if (wiMode === 'target') {
      const fv = Math.max(p + 1, wiTargetVal);
      const n = Math.log((fv + c / monthlyRate) / (p + c / monthlyRate)) / Math.log(1 + monthlyRate);
      const totalMonths = Math.min(MAX_MONTHS, Math.ceil(n));
      const chartData = [];
      let currentNW = p;
      for (let m = 0; m <= totalMonths; m++) {
        if (m > 0) currentNW = currentNW * (1 + monthlyRate) + c;
        if (m % 12 === 0 || m === totalMonths) {
          chartData.push({ month: m, year: m/12, nw: Math.round(currentNW) });
        }
      }
      return { years: Math.floor(totalMonths / 12), months: totalMonths % 12, finalNW: Math.round(currentNW), chartData };
    } else {
      const n = Math.min(MAX_MONTHS, wiDurationYrs * 12);
      const chartData = [];
      let currentNW = p;
      for (let m = 0; m <= n; m++) {
        if (m > 0) currentNW = currentNW * (1 + monthlyRate) + c;
        if (m % 12 === 0 || m === n) {
          chartData.push({ month: m, year: m/12, nw: Math.round(currentNW) });
        }
      }
      return { years: Math.floor(n / 12), months: 0, finalNW: Math.round(currentNW), chartData };
    }
  }, [wiNW, wiMonthlySave, wiRate, wiMode, wiTargetVal, wiDurationYrs]);

  const tabs = [
    { id: 'milestones', name: 'Trajectory', icon: Flame },
    { id: 'whatif', name: 'What-If Lab', icon: HelpCircle },
    { id: 'barista', name: 'Barista Lab', icon: Briefcase },
    { id: 'sensitivity', name: 'SWR Sensitivity', icon: ShieldAlert },
  ];

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-black tracking-tight">FIRE Simulation Suite</CardTitle>
              <p className="text-muted-foreground text-sm italic">High-fidelity path modeling for aggressive decumulation.</p>
            </div>
            <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-xl">
              {tabs.map(tab => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(tab.id as any)}
                  className="text-[10px] font-black uppercase tracking-widest"
                >
                  <tab.icon className="h-4 w-4 mr-1" />
                  {tab.name}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {activeTab === 'milestones' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-4 bg-card border-border">
            <CardContent className="p-6 space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Flame className="h-5 w-5" /> Trajectory Lab
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Annual Savings ($)</Label>
                  <Input type="number" value={simSavings} onChange={(e) => setSimSavings(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Return Rate (%)</Label>
                  <Input type="number" value={simReturnRate} onChange={(e) => setSimReturnRate(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Retirement Spend ($)</Label>
                  <Input type="number" value={simSpending} onChange={(e) => setSimSpending(Number(e.target.value))} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="lg:col-span-8 h-[500px]">
            <CardContent className="p-6 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={milestonesData}>
                  <defs>
                    <linearGradient id="firePathGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" opacity={0.3} />
                  <XAxis dataKey="age" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} className="fill-muted-foreground" />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} className="fill-muted-foreground" tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'hsl(var(--card))' }} />
                  <Area type="monotone" dataKey="netWorth" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#firePathGrad)" />
                  <ReferenceLine x={financials.retirementAge} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'whatif' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-4">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Zap className="h-5 w-5" /> What-If Lab
                </h3>
                <div className="flex bg-muted p-1 rounded-lg">
                  <Button size="sm" variant={wiMode === 'target' ? 'default' : 'ghost'} onClick={() => setWiMode('target')} className="text-[8px] font-black uppercase px-2">Target</Button>
                  <Button size="sm" variant={wiMode === 'time' ? 'default' : 'ghost'} onClick={() => setWiMode('time')} className="text-[8px] font-black uppercase px-2">Time</Button>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Starting Portfolio ($)</Label>
                  <Input type="number" value={wiNW} onChange={(e) => setWiNW(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Monthly Addition ($)</Label>
                  <Input type="number" value={wiMonthlySave} onChange={(e) => setWiMonthlySave(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Expected Rate (%)</Label>
                  <Input type="number" value={wiRate} onChange={(e) => setWiRate(Number(e.target.value))} />
                </div>
                {wiMode === 'target' ? (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Target Net Worth ($)</Label>
                    <Input type="number" value={wiTargetVal} onChange={(e) => setWiTargetVal(Number(e.target.value))} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Years to Run</Label>
                    <Input type="number" value={wiDurationYrs} onChange={(e) => setWiDurationYrs(Number(e.target.value))} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="lg:col-span-8 h-[500px]">
            <CardContent className="p-6 h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Growth Forecast</span>
                <span className="text-xl font-black text-primary">
                  {wiMode === 'target' ? `Years to Target: ${whatIfCalculation.years}y ${whatIfCalculation.months}m` : `Result: $${whatIfCalculation.finalNW.toLocaleString()}`}
                </span>
              </div>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={whatIfCalculation.chartData}>
                    <defs>
                      <linearGradient id="wiGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" opacity={0.3} />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} className="fill-muted-foreground" />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} className="fill-muted-foreground" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'hsl(var(--card))' }} />
                    <Area type="monotone" dataKey="nw" stroke="hsl(var(--primary))" strokeWidth={4} fill="url(#wiGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'barista' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-4">
            <CardContent className="p-6 space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Briefcase className="h-5 w-5" /> Semi-Retirement Strategy
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Barista Phase Start Age</Label>
                  <Input type="number" value={baristaAge} onChange={(e) => setBaristaAge(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Part-Time Income ($/yr)</Label>
                  <Input type="number" value={baristaIncome} onChange={(e) => setBaristaIncome(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Total Spend during Barista ($/yr)</Label>
                  <Input type="number" value={baristaSpend} onChange={(e) => setBaristaSpend(Number(e.target.value))} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="lg:col-span-8 h-[500px]">
            <CardContent className="p-6 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={baristaData}>
                  <defs>
                    <linearGradient id="baristaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" opacity={0.3} />
                  <XAxis dataKey="age" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} className="fill-muted-foreground" />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} className="fill-muted-foreground" tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'hsl(var(--card))' }} />
                  <Area type="monotone" dataKey="netWorth" stroke="#10b981" strokeWidth={4} fill="url(#baristaGrad)" />
                  <ReferenceLine x={baristaAge} stroke="#f59e0b" strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'sensitivity' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-4">
            <CardContent className="p-6 space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" /> SWR / SORR Tool
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Crash Magnitude (%)</Label>
                  <Input type="number" value={crashMagnitude} onChange={(e) => setCrashMagnitude(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Retirement Balance ($)</Label>
                  <Input type="number" value={sorrPortfolioVal} onChange={(e) => setSorrPortfolioVal(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Annual Withdrawal ($)</Label>
                  <Input type="number" value={simAnnualSpend} onChange={(e) => setSimAnnualSpend(Number(e.target.value))} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="lg:col-span-8 h-[500px]">
            <CardContent className="p-6 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sorrSimData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" opacity={0.3} />
                  <XAxis dataKey="age" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} className="fill-muted-foreground" />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} className="fill-muted-foreground" tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'hsl(var(--card))' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Line type="monotone" dataKey="Steady Growth" stroke="#10b981" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="Year 1 Shock" stroke="#f43f5e" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="Year 15 Shock" stroke="#f59e0b" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
