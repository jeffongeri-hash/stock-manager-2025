import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Plus, Trash2, TrendingDown, Calculator, Zap } from 'lucide-react';
import { Debt, DebtPayoffStrategy } from '@/types/ignitefire';
import { toast } from 'sonner';

export const IgniteDebtPayoff: React.FC = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [strategy, setStrategy] = useState<DebtPayoffStrategy>('avalanche');
  const [extraPayment, setExtraPayment] = useState(0);
  
  const [newDebt, setNewDebt] = useState<Partial<Debt>>({
    name: '',
    balance: 0,
    interestRate: 0,
    minPayment: 0,
    type: 'credit_card'
  });

  const addDebt = () => {
    if (!newDebt.name || !newDebt.balance) {
      toast.error('Please fill in debt name and balance');
      return;
    }
    
    const debt: Debt = {
      id: Date.now().toString(),
      name: newDebt.name!,
      balance: newDebt.balance!,
      interestRate: newDebt.interestRate || 0,
      minPayment: newDebt.minPayment || 0,
      type: newDebt.type as Debt['type'] || 'credit_card'
    };
    
    setDebts(prev => [...prev, debt]);
    setNewDebt({ name: '', balance: 0, interestRate: 0, minPayment: 0, type: 'credit_card' });
    toast.success('Debt added');
  };

  const removeDebt = (id: string) => {
    setDebts(prev => prev.filter(d => d.id !== id));
  };

  // Calculate payoff order based on strategy
  const getSortedDebts = () => {
    return [...debts].sort((a, b) => {
      if (strategy === 'avalanche') {
        return b.interestRate - a.interestRate; // Highest interest first
      } else {
        return a.balance - b.balance; // Lowest balance first (snowball)
      }
    });
  };

  // Calculate total debt and payments
  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
  const totalMinPayment = debts.reduce((sum, d) => sum + d.minPayment, 0);
  const weightedAvgRate = totalDebt > 0 
    ? debts.reduce((sum, d) => sum + (d.interestRate * d.balance), 0) / totalDebt 
    : 0;

  // Simple payoff calculation
  const calculatePayoffMonths = () => {
    if (debts.length === 0) return 0;
    
    let totalMonths = 0;
    let remainingDebts = getSortedDebts().map(d => ({ ...d }));
    const monthlyPayment = totalMinPayment + extraPayment;
    
    while (remainingDebts.some(d => d.balance > 0) && totalMonths < 600) {
      totalMonths++;
      let available = monthlyPayment;
      
      // Pay minimums first
      remainingDebts.forEach(debt => {
        if (debt.balance > 0) {
          const interest = (debt.balance * debt.interestRate / 100) / 12;
          const payment = Math.min(debt.minPayment, debt.balance + interest);
          debt.balance = debt.balance + interest - payment;
          available -= payment;
        }
      });
      
      // Apply extra to first debt with balance
      for (const debt of remainingDebts) {
        if (debt.balance > 0 && available > 0) {
          const payment = Math.min(available, debt.balance);
          debt.balance -= payment;
          available -= payment;
          break;
        }
      }
    }
    
    return totalMonths;
  };

  const payoffMonths = calculatePayoffMonths();
  const payoffYears = Math.floor(payoffMonths / 12);
  const payoffRemainingMonths = payoffMonths % 12;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Debt</p>
              <p className="text-2xl font-bold text-destructive">${totalDebt.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Monthly Payment</p>
              <p className="text-2xl font-bold">${(totalMinPayment + extraPayment).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Avg Interest Rate</p>
              <p className="text-2xl font-bold">{weightedAvgRate.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Payoff Time</p>
              <p className="text-2xl font-bold text-primary">
                {payoffYears > 0 ? `${payoffYears}y ` : ''}{payoffRemainingMonths}m
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Debt */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Debt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input 
                placeholder="e.g., Chase Credit Card"
                value={newDebt.name}
                onChange={(e) => setNewDebt(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Balance</Label>
              <Input 
                type="number"
                placeholder="5000"
                value={newDebt.balance || ''}
                onChange={(e) => setNewDebt(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Interest Rate (%)</Label>
              <Input 
                type="number"
                placeholder="18.99"
                value={newDebt.interestRate || ''}
                onChange={(e) => setNewDebt(prev => ({ ...prev, interestRate: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Min Payment</Label>
              <Input 
                type="number"
                placeholder="150"
                value={newDebt.minPayment || ''}
                onChange={(e) => setNewDebt(prev => ({ ...prev, minPayment: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select 
                value={newDebt.type} 
                onValueChange={(v) => setNewDebt(prev => ({ ...prev, type: v as Debt['type'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="student_loan">Student Loan</SelectItem>
                  <SelectItem value="car_loan">Car Loan</SelectItem>
                  <SelectItem value="mortgage">Mortgage</SelectItem>
                  <SelectItem value="personal_loan">Personal Loan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={addDebt} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Debt
          </Button>
        </CardContent>
      </Card>

      {/* Strategy Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Payoff Strategy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                strategy === 'avalanche' ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => setStrategy('avalanche')}
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-5 w-5 text-primary" />
                <span className="font-semibold">Avalanche Method</span>
                {strategy === 'avalanche' && <Badge>Selected</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                Pay highest interest rate first. Saves the most money on interest.
              </p>
            </div>
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                strategy === 'snowball' ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => setStrategy('snowball')}
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-primary" />
                <span className="font-semibold">Snowball Method</span>
                {strategy === 'snowball' && <Badge>Selected</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                Pay smallest balance first. Quick wins for motivation.
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Extra Monthly Payment</Label>
            <Input 
              type="number"
              placeholder="0"
              value={extraPayment || ''}
              onChange={(e) => setExtraPayment(parseFloat(e.target.value) || 0)}
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground">Additional amount to pay beyond minimums</p>
          </div>
        </CardContent>
      </Card>

      {/* Debt List */}
      {debts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Payoff Order ({strategy === 'avalanche' ? 'Highest Interest First' : 'Smallest Balance First'})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Interest</TableHead>
                  <TableHead className="text-right">Min Payment</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getSortedDebts().map((debt, index) => (
                  <TableRow key={debt.id}>
                    <TableCell>
                      <Badge variant={index === 0 ? "default" : "secondary"}>{index + 1}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{debt.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{debt.type.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell className="text-right">${debt.balance.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{debt.interestRate}%</TableCell>
                    <TableCell className="text-right">${debt.minPayment}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeDebt(debt.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {debts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No debts added yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add your debts above to create a payoff plan
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
