import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, ComposedChart, Bar, Line
} from 'recharts';
import { 
  Trash2, Plus, Zap, TrendingDown, Banknote, ShieldCheck, SlidersHorizontal,
  CreditCard, GraduationCap, Home, User, Calculator, Sparkles, Scale, ArrowRightLeft, 
  Lightbulb, ThumbsUp, AlertCircle, ArrowUpRight, Building2
} from 'lucide-react';
import { Debt, DebtPayoffStrategy } from '@/types/ignitefire';

const DEBT_TYPES = [
  { id: 'credit_card', name: 'Credit Card', icon: CreditCard },
  { id: 'student_loan', name: 'Student Loan', icon: GraduationCap },
  { id: 'car_loan', name: 'Car Loan', icon: Banknote },
  { id: 'mortgage', name: 'Mortgage', icon: Home },
  { id: 'personal_loan', name: 'Personal Loan', icon: User },
];

const MAJOR_BANKS = [
  { bank: 'Chase', avg: 24.49 },
  { bank: 'Amex', avg: 25.99 },
  { bank: 'Citi', avg: 26.24 },
  { bank: 'Capital One', avg: 27.99 },
  { bank: 'Discover', avg: 24.24 },
  { bank: 'Wells Fargo', avg: 25.24 },
  { bank: 'BofA', avg: 24.99 },
  { bank: 'Apple', avg: 23.24 },
];

const COLORS = ['hsl(var(--primary))', '#f43f5e', '#10b981', '#f59e0b', '#0ea5e9', '#8b5cf6'];

export const IgniteDebtPayoff: React.FC = () => {
  const [debts, setDebts] = useState<Debt[]>(() => {
    const saved = localStorage.getItem('ignite_debts_v2');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Chase Sapphire', balance: 4500, interestRate: 24.99, minPayment: 150, type: 'credit_card', creditLimit: 15000 },
      { id: '2', name: 'Auto Loan', balance: 18000, interestRate: 5.5, minPayment: 420, type: 'car_loan' },
      { id: '3', name: 'Federal Student Loan', balance: 25000, interestRate: 6.8, minPayment: 280, type: 'student_loan' }
    ];
  });

  const [activeSubTab, setActiveSubTab] = useState<'payoff' | 'cc_lab'>('payoff');
  const [extraPayment, setExtraPayment] = useState(500);
  const [strategy, setStrategy] = useState<DebtPayoffStrategy>('avalanche');
  
  // Balance Transfer State
  const [btAmount, setBtAmount] = useState(5000);
  const [btFeePct, setBtFeePct] = useState(3);
  const [btPromoMonths, setBtPromoMonths] = useState(18);

  useEffect(() => {
    localStorage.setItem('ignite_debts_v2', JSON.stringify(debts));
  }, [debts]);

  const addDebt = (prefill?: Partial<Debt>) => {
    const newDebt: Debt = {
      id: Date.now().toString(),
      name: prefill?.name || 'New Debt Source',
      balance: prefill?.balance || 0,
      interestRate: prefill?.interestRate || 15,
      minPayment: prefill?.minPayment || 0,
      type: prefill?.type || 'credit_card',
      creditLimit: prefill?.creditLimit || 5000
    };
    setDebts([...debts, newDebt]);
  };

  const updateDebt = (id: string, field: keyof Debt, value: any) => {
    setDebts(debts.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const removeDebt = (id: string) => {
    setDebts(debts.filter(d => d.id !== id));
  };

  const runSimulation = (simStrategy: DebtPayoffStrategy) => {
    let currentDebts = debts.map(d => ({ ...d }));
    let months = 0;
    let totalInterest = 0;
    const history = [];
    const MAX_MONTHS = 600;

    while (currentDebts.some(d => d.balance > 0) && months < MAX_MONTHS) {
      if (simStrategy === 'avalanche') {
        currentDebts.sort((a, b) => b.interestRate - a.interestRate);
      } else {
        currentDebts.sort((a, b) => a.balance - b.balance);
      }

      let availableExtra = extraPayment;
      currentDebts.forEach(d => {
        if (d.balance > 0) {
          const interest = (d.balance * (d.interestRate / 100)) / 12;
          totalInterest += interest;
          d.balance += interest;
          const pay = Math.min(d.balance, d.minPayment);
          d.balance -= pay;
        }
      });

      for (const d of currentDebts) {
        if (d.balance > 0) {
          const pay = Math.min(d.balance, availableExtra);
          d.balance -= pay;
          availableExtra -= pay;
          if (availableExtra <= 0) break;
        }
      }

      const monthlyTotalBalance = currentDebts.reduce((acc, d) => acc + d.balance, 0);
      history.push({ 
        month: months, 
        balance: Math.max(0, Math.round(monthlyTotalBalance)),
        year: (months / 12).toFixed(1)
      });
      months++;
    }
    return { history, totalInterest, months };
  };

  const avalancheSim = useMemo(() => runSimulation('avalanche'), [debts, extraPayment]);
  const snowballSim = useMemo(() => runSimulation('snowball'), [debts, extraPayment]);
  const activeSim = strategy === 'avalanche' ? avalancheSim : snowballSim;

  const creditCardPortfolio = useMemo(() => {
    const cards = debts.filter(d => d.type === 'credit_card');
    const totalBalance = cards.reduce((acc, c) => acc + c.balance, 0);
    const totalLimit = cards.reduce((acc, c) => acc + (c.creditLimit || 0), 0);
    const avgAPY = cards.length > 0 ? cards.reduce((acc, c) => acc + c.interestRate, 0) / cards.length : 0;
    const utilization = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;
    
    return { cards, totalBalance, totalLimit, avgAPY, utilization };
  }, [debts]);

  const btSavings = useMemo(() => {
    const fee = btAmount * (btFeePct / 100);
    const avgCCRate = creditCardPortfolio.avgAPY || 25; 
    const monthlyInterest = (btAmount * (avgCCRate / 100)) / 12;
    const totalInterestSaved = monthlyInterest * btPromoMonths;
    const netSavings = totalInterestSaved - fee;
    return { fee, totalInterestSaved, netSavings };
  }, [btAmount, btFeePct, btPromoMonths, creditCardPortfolio.avgAPY]);

  const totalCurrentDebt = debts.reduce((acc, d) => acc + d.balance, 0);
  const pieData = debts.map(d => ({ name: d.name, value: d.balance }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                <ShieldCheck className="h-7 w-7 text-primary" />
                Debt Destroyer Hub
              </h2>
              <p className="text-muted-foreground italic">Simulate aggressive payoff paths to accelerate your FIRE trajectory.</p>
            </div>
            <div className="flex bg-muted p-1 rounded-xl self-start">
              <Button 
                variant={activeSubTab === 'payoff' ? "default" : "ghost"}
                onClick={() => setActiveSubTab('payoff')}
                className="text-[10px] font-black uppercase tracking-widest"
              >
                Payoff Strategy
              </Button>
              <Button 
                variant={activeSubTab === 'cc_lab' ? "default" : "ghost"}
                onClick={() => setActiveSubTab('cc_lab')}
                className="text-[10px] font-black uppercase tracking-widest"
              >
                Credit Card Lab
              </Button>
            </div>
          </div>

          {activeSubTab === 'payoff' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-muted p-4 rounded-xl space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Monthly Snowball Extra ($)</Label>
                <div className="relative">
                  <Sparkles className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                  <Input 
                    type="number" 
                    value={extraPayment} 
                    onChange={(e) => setExtraPayment(parseFloat(e.target.value) || 0)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="bg-primary p-4 rounded-xl text-primary-foreground">
                <p className="text-[10px] font-black uppercase opacity-70 tracking-widest">Est. Interest Leakage</p>
                <p className="text-2xl font-black tracking-tight">${Math.round(activeSim.totalInterest).toLocaleString()}</p>
              </div>
              <div className="bg-primary p-4 rounded-xl text-primary-foreground">
                <p className="text-[10px] font-black uppercase opacity-70 tracking-widest">Time to Debt-Free</p>
                <p className="text-2xl font-black tracking-tight">{Math.floor(activeSim.months / 12)}y {activeSim.months % 12}m</p>
              </div>
              <div className="bg-card p-4 rounded-xl border flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Payoff Strategy</p>
                  <Select value={strategy} onValueChange={(v) => setStrategy(v as DebtPayoffStrategy)}>
                    <SelectTrigger className="border-0 p-0 h-auto font-black text-primary uppercase text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="avalanche">Avalanche (ROI)</SelectItem>
                      <SelectItem value="snowball">Snowball (Psych)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <SlidersHorizontal className="h-8 w-8 text-primary/20" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-destructive p-4 rounded-xl text-destructive-foreground">
                <p className="text-[10px] font-black uppercase opacity-70 tracking-widest">Total CC Debt</p>
                <p className="text-2xl font-black tracking-tight">${creditCardPortfolio.totalBalance.toLocaleString()}</p>
              </div>
              <div className="bg-card p-4 rounded-xl border">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Portfolio Limit</p>
                <p className="text-2xl font-black tracking-tight">${(creditCardPortfolio.totalLimit / 1000).toFixed(1)}k</p>
              </div>
              <div className="bg-amber-500 p-4 rounded-xl text-white">
                <p className="text-[10px] font-black uppercase opacity-70 tracking-widest">Weighted APR</p>
                <p className="text-2xl font-black tracking-tight">{creditCardPortfolio.avgAPY.toFixed(1)}%</p>
              </div>
              <div className={`p-4 rounded-xl text-white ${creditCardPortfolio.utilization > 30 ? 'bg-destructive' : 'bg-primary'}`}>
                <p className="text-[10px] font-black uppercase opacity-70 tracking-widest">Credit Utilization</p>
                <p className="text-2xl font-black tracking-tight">{creditCardPortfolio.utilization.toFixed(1)}%</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CC Lab Content */}
      {activeSubTab === 'cc_lab' && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" /> Portfolio Quick-Discovery
                </h3>
                <p className="text-xs text-muted-foreground italic">Select your primary bank to auto-load 2025 standard credit metrics.</p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {MAJOR_BANKS.map((bank) => (
                  <Button 
                    key={bank.bank}
                    variant="outline"
                    onClick={() => addDebt({ name: `${bank.bank} Card`, type: 'credit_card', interestRate: bank.avg })}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-black text-xs">
                      {bank.bank[0]}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-tight">{bank.bank}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-6">
              <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" /> Strategic Debt Playbook
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="p-6 bg-primary/5 border border-primary/10 rounded-xl space-y-3">
                  <div className="p-2 bg-primary rounded-xl w-fit text-primary-foreground"><TrendingDown className="h-5 w-5" /></div>
                  <h4 className="text-sm font-black uppercase tracking-tight">The Math Path (Avalanche)</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed italic">Highest APR first. Objectively the fastest way to stop 'interest leakage' and salvage your FIRE timeline.</p>
                </div>
                <div className="p-6 bg-primary/5 border border-primary/10 rounded-xl space-y-3">
                  <div className="p-2 bg-primary rounded-xl w-fit text-primary-foreground"><ThumbsUp className="h-5 w-5" /></div>
                  <h4 className="text-sm font-black uppercase tracking-tight">Psychological Wins (Snowball)</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed italic">Smallest balance first. Great for momentum and the dopamine of killing a card balance.</p>
                </div>
                <div className="p-6 bg-destructive/5 border border-destructive/10 rounded-xl space-y-3">
                  <div className="p-2 bg-destructive rounded-xl w-fit text-destructive-foreground"><AlertCircle className="h-5 w-5" /></div>
                  <h4 className="text-sm font-black uppercase tracking-tight">Stop the Bleed</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed italic">Unlink cards from digital wallets. You cannot out-invest a 25% APR drain.</p>
                </div>
                <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-3">
                  <div className="p-2 bg-amber-500 rounded-xl w-fit text-white"><ArrowRightLeft className="h-5 w-5" /></div>
                  <h4 className="text-sm font-black uppercase tracking-tight">The Arbitrage (Transfer)</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed italic">Move high-interest debt to 0% promo cards. 3-5% fee is worth it for balances over $2k.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payoff Chart */}
      {activeSubTab === 'payoff' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-8">
            <CardContent className="p-6 h-[400px]">
              <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-4">
                <Zap className="h-4 w-4 text-primary" /> Payoff Simulation
              </h3>
              <ResponsiveContainer width="100%" height="90%">
                <AreaChart>
                  <defs>
                    <linearGradient id="payoffGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" opacity={0.3} />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} className="fill-muted-foreground" />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} className="fill-muted-foreground" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'hsl(var(--card))' }} />
                  <Area type="monotone" data={avalancheSim.history} dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={4} fill="url(#payoffGrad)" name="Avalanche Path" />
                  <Area type="monotone" data={snowballSim.history} dataKey="balance" stroke="#f43f5e" strokeWidth={2} fill="transparent" strokeDasharray="5 5" name="Snowball Path" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-4">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Scale className="h-4 w-4" /> Debt Mix
              </h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'hsl(var(--card))' }} />
                    <Legend verticalAlign="bottom" iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="p-4 bg-muted rounded-xl">
                <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Total Outstanding</p>
                <p className="text-xl font-black">${totalCurrentDebt.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Debt Inventory */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <Calculator className="h-5 w-5 text-primary" /> Active Portfolio Inventory
            </h3>
            <Button onClick={() => addDebt()} className="font-black uppercase tracking-widest text-xs">
              <Plus className="h-4 w-4 mr-2" /> Add New Liability
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {debts.map(debt => {
              const DebtIcon = DEBT_TYPES.find(t => t.id === debt.type)?.icon || CreditCard;
              const utilization = debt.type === 'credit_card' && debt.creditLimit ? (debt.balance / debt.creditLimit) * 100 : 0;
              
              return (
                <div key={debt.id} className="p-5 bg-muted rounded-xl group hover:ring-2 ring-primary transition-all relative space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-card rounded-xl border">
                        <DebtIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <Input 
                          value={debt.name} 
                          onChange={(e) => updateDebt(debt.id, 'name', e.target.value)} 
                          className="bg-transparent font-black text-base outline-none border-0 p-0 h-auto focus-visible:ring-0" 
                        />
                        <Select value={debt.type} onValueChange={(v) => updateDebt(debt.id, 'type', v)}>
                          <SelectTrigger className="border-0 p-0 h-auto text-[10px] font-black uppercase text-muted-foreground focus:ring-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DEBT_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeDebt(debt.id)} 
                      className="opacity-0 group-hover:opacity-100 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black text-muted-foreground uppercase">Balance ($)</Label>
                      <Input 
                        type="number" 
                        value={debt.balance} 
                        onChange={(e) => updateDebt(debt.id, 'balance', parseFloat(e.target.value) || 0)} 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black text-muted-foreground uppercase">APR (%)</Label>
                      <Input 
                        type="number" 
                        step="0.1" 
                        value={debt.interestRate} 
                        onChange={(e) => updateDebt(debt.id, 'interestRate', parseFloat(e.target.value) || 0)} 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black text-muted-foreground uppercase">Min Payment ($)</Label>
                      <Input 
                        type="number" 
                        value={debt.minPayment} 
                        onChange={(e) => updateDebt(debt.id, 'minPayment', parseFloat(e.target.value) || 0)} 
                      />
                    </div>
                    {debt.type === 'credit_card' && (
                      <div className="space-y-1">
                        <Label className="text-[9px] font-black text-muted-foreground uppercase">Credit Limit ($)</Label>
                        <Input 
                          type="number" 
                          value={debt.creditLimit || 0} 
                          onChange={(e) => updateDebt(debt.id, 'creditLimit', parseFloat(e.target.value) || 0)} 
                        />
                      </div>
                    )}
                  </div>

                  {debt.type === 'credit_card' && debt.creditLimit && (
                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-[9px] font-black uppercase mb-1">
                        <span className="text-muted-foreground">Utilization</span>
                        <span className={utilization > 30 ? 'text-destructive' : 'text-primary'}>{utilization.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${utilization > 30 ? 'bg-destructive' : 'bg-primary'}`}
                          style={{ width: `${Math.min(100, utilization)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
