import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IgniteUserFinancials } from '@/types/ignitefire';

interface IgniteDashboardProps {
  financials: IgniteUserFinancials;
  setFinancials: React.Dispatch<React.SetStateAction<IgniteUserFinancials>>;
}

export const IgniteDashboard: React.FC<IgniteDashboardProps> = ({ financials, setFinancials }) => {
  const fireNumber = financials.annualSpending * 25;
  const progressPercent = Math.min(100, (financials.currentNetWorth / Math.max(1, fireNumber)) * 100);
  const savingsRate = Math.round((financials.annualSavings / Math.max(1, financials.grossAnnualIncome)) * 100);

  const handleChange = (field: keyof IgniteUserFinancials, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFinancials(prev => ({ ...prev, [field]: numValue }));
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Main Progress Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-muted-foreground uppercase tracking-widest text-[10px]">Financial Sustainability Progress</h3>
            <Badge className="text-[10px] font-black uppercase tracking-widest">Active Model</Badge>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-12">
            {/* SVG Progress Ring */}
            <div className="relative w-52 h-52 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle 
                  cx="50%" cy="50%" r="44%" 
                  stroke="currentColor" 
                  strokeWidth="12" 
                  fill="transparent" 
                  className="text-muted" 
                />
                <circle 
                  cx="50%" cy="50%" r="44%" 
                  stroke="currentColor" 
                  strokeWidth="12" 
                  fill="transparent" 
                  strokeDasharray="276"
                  strokeDashoffset={276 - (276 * progressPercent / 100)}
                  className="text-primary transition-all duration-1000 ease-out" 
                  strokeLinecap="round" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black tracking-tighter">{Math.round(progressPercent)}%</span>
                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">To Target</span>
              </div>
            </div>

            <div className="flex-1 w-full space-y-10">
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Consolidated Net Worth</p>
                <p className="text-5xl md:text-6xl font-black tracking-tighter">${financials.currentNetWorth.toLocaleString()}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 bg-muted rounded-2xl">
                  <p className="text-[10px] text-muted-foreground font-black uppercase mb-1">Savings Rate</p>
                  <p className="text-3xl font-black">{savingsRate}%</p>
                </div>
                <div className="p-6 bg-muted rounded-2xl">
                  <p className="text-[10px] text-muted-foreground font-black uppercase mb-1">FIRE Target ($)</p>
                  <p className="text-3xl font-black">${fireNumber.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Inputs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-primary uppercase tracking-widest text-[11px] font-black">Financial Inputs Control</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div>
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Current Assets ($)</Label>
                <Input 
                  type="number" 
                  value={financials.currentNetWorth} 
                  onChange={(e) => handleChange('currentNetWorth', e.target.value)}
                  className="font-bold text-xl h-14"
                />
              </div>
              <div>
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Est. Annual Spending ($)</Label>
                <Input 
                  type="number" 
                  value={financials.annualSpending} 
                  onChange={(e) => handleChange('annualSpending', e.target.value)}
                  className="font-bold text-xl h-14"
                />
              </div>
              <div>
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Annual Savings ($)</Label>
                <Input 
                  type="number" 
                  value={financials.annualSavings} 
                  onChange={(e) => handleChange('annualSavings', e.target.value)}
                  className="font-bold text-xl h-14"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Gross Annual Income ($)</Label>
                <Input 
                  type="number" 
                  value={financials.grossAnnualIncome} 
                  onChange={(e) => handleChange('grossAnnualIncome', e.target.value)}
                  className="font-bold text-xl h-14"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Current Age</Label>
                  <Input 
                    type="number" 
                    value={financials.currentAge} 
                    onChange={(e) => handleChange('currentAge', e.target.value)}
                    className="font-bold text-xl h-14"
                  />
                </div>
                <div>
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Target Age</Label>
                  <Input 
                    type="number" 
                    value={financials.retirementAge} 
                    onChange={(e) => handleChange('retirementAge', e.target.value)}
                    className="font-bold text-xl h-14"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Expected Return (%)</Label>
                  <Input 
                    type="number" 
                    value={financials.expectedReturn} 
                    onChange={(e) => handleChange('expectedReturn', e.target.value)}
                    className="font-bold text-xl h-14"
                  />
                </div>
                <div>
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Tax Rate (%)</Label>
                  <Input 
                    type="number" 
                    value={financials.taxRate} 
                    onChange={(e) => handleChange('taxRate', e.target.value)}
                    className="font-bold text-xl h-14"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
