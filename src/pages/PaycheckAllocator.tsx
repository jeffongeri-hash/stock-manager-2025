import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calculator, DollarSign, Plus, Trash2, Loader2, 
  Percent, Building2, Landmark, Heart, Briefcase,
  PiggyBank, Shield, GraduationCap, Baby, Car
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Deduction {
  id: string;
  label: string;
  value: number;
  type: 'percentage' | 'amount';
}

interface PaycheckResult {
  grossPay: number;
  preTaxDeductions: number;
  taxableIncome: number;
  taxes: {
    federalTax: number;
    stateTax: number;
    stateName: string;
    localTax: number;
    localTaxName: string | null;
    socialSecurity: number;
    medicare: number;
    taxBreakdown: {
      federalRate: string;
      stateRate: string;
      localRate: string;
    };
    notes: string;
  };
  totalTaxes: number;
  postTaxDeductions: number;
  netPay: number;
}

const COMMON_PRETAX_DEDUCTIONS = [
  { value: '401k', label: '401(k) Contribution', icon: PiggyBank },
  { value: '403b', label: '403(b) Contribution', icon: PiggyBank },
  { value: 'hsa', label: 'HSA Contribution', icon: Heart },
  { value: 'fsa', label: 'FSA (Flexible Spending)', icon: Heart },
  { value: 'health', label: 'Health Insurance Premium', icon: Shield },
  { value: 'dental', label: 'Dental Insurance', icon: Shield },
  { value: 'vision', label: 'Vision Insurance', icon: Shield },
  { value: 'life', label: 'Life Insurance', icon: Shield },
  { value: 'commuter', label: 'Commuter Benefits', icon: Car },
  { value: 'dependent', label: 'Dependent Care FSA', icon: Baby },
  { value: 'custom', label: 'Custom Deduction', icon: DollarSign },
];

const COMMON_POSTTAX_DEDUCTIONS = [
  { value: 'roth401k', label: 'Roth 401(k)', icon: PiggyBank },
  { value: 'rothira', label: 'Roth IRA', icon: PiggyBank },
  { value: 'union', label: 'Union Dues', icon: Briefcase },
  { value: 'charity', label: 'Charitable Contributions', icon: Heart },
  { value: 'garnishment', label: 'Wage Garnishment', icon: Landmark },
  { value: 'studentloan', label: 'Student Loan Repayment', icon: GraduationCap },
  { value: 'aftertaxlife', label: 'After-Tax Life Insurance', icon: Shield },
  { value: 'disability', label: 'Disability Insurance', icon: Shield },
  { value: 'custom', label: 'Custom Deduction', icon: DollarSign },
];

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(142, 76%, 36%)',
  'hsl(280, 65%, 60%)',
  'hsl(30, 80%, 55%)',
];

export default function PaycheckAllocator() {
  const [grossPay, setGrossPay] = useState<number>(5000);
  const [payFrequency, setPayFrequency] = useState('biweekly');
  const [zipCode, setZipCode] = useState('');
  const [filingStatus, setFilingStatus] = useState('single');
  const [allowances, setAllowances] = useState<number>(0);
  
  const [preTaxDeductions, setPreTaxDeductions] = useState<Deduction[]>([]);
  const [postTaxDeductions, setPostTaxDeductions] = useState<Deduction[]>([]);
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<PaycheckResult | null>(null);

  const addDeduction = (isPretax: boolean) => {
    const newDeduction: Deduction = {
      id: crypto.randomUUID(),
      label: '',
      value: 0,
      type: 'amount',
    };
    
    if (isPretax) {
      setPreTaxDeductions([...preTaxDeductions, newDeduction]);
    } else {
      setPostTaxDeductions([...postTaxDeductions, newDeduction]);
    }
  };

  const updateDeduction = (id: string, field: keyof Deduction, value: string | number, isPretax: boolean) => {
    const deductions = isPretax ? preTaxDeductions : postTaxDeductions;
    const setDeductions = isPretax ? setPreTaxDeductions : setPostTaxDeductions;
    
    setDeductions(deductions.map(d => 
      d.id === id ? { ...d, [field]: value } : d
    ));
  };

  const removeDeduction = (id: string, isPretax: boolean) => {
    if (isPretax) {
      setPreTaxDeductions(preTaxDeductions.filter(d => d.id !== id));
    } else {
      setPostTaxDeductions(postTaxDeductions.filter(d => d.id !== id));
    }
  };

  const selectCommonDeduction = (commonValue: string, id: string, isPretax: boolean) => {
    const options = isPretax ? COMMON_PRETAX_DEDUCTIONS : COMMON_POSTTAX_DEDUCTIONS;
    const selected = options.find(o => o.value === commonValue);
    if (selected && selected.value !== 'custom') {
      updateDeduction(id, 'label', selected.label, isPretax);
    }
  };

  const calculatePaycheck = async () => {
    if (!zipCode || zipCode.length !== 5) {
      toast.error('Please enter a valid 5-digit ZIP code');
      return;
    }

    setIsCalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-paycheck', {
        body: {
          grossPay,
          payFrequency,
          zipCode,
          filingStatus,
          allowances,
          preTaxDeductions: preTaxDeductions.map(d => ({
            label: d.label,
            value: d.value,
            type: d.type,
          })),
          postTaxDeductions: postTaxDeductions.map(d => ({
            label: d.label,
            value: d.value,
            type: d.type,
          })),
        },
      });

      if (error) throw error;
      
      setResult(data);
      toast.success('Paycheck calculated successfully');
    } catch (error) {
      console.error('Error calculating paycheck:', error);
      toast.error('Failed to calculate paycheck');
    } finally {
      setIsCalculating(false);
    }
  };

  const getChartData = () => {
    if (!result) return [];
    
    const data = [
      { name: 'Federal Tax', value: result.taxes.federalTax },
      { name: 'State Tax', value: result.taxes.stateTax },
      { name: 'Social Security', value: result.taxes.socialSecurity },
      { name: 'Medicare', value: result.taxes.medicare },
    ];

    if (result.taxes.localTax > 0) {
      data.push({ name: 'Local Tax', value: result.taxes.localTax });
    }
    if (result.preTaxDeductions > 0) {
      data.push({ name: 'Pre-Tax Deductions', value: result.preTaxDeductions });
    }
    if (result.postTaxDeductions > 0) {
      data.push({ name: 'Post-Tax Deductions', value: result.postTaxDeductions });
    }
    data.push({ name: 'Net Pay', value: result.netPay });

    return data.filter(d => d.value > 0);
  };

  const DeductionRow = ({ deduction, isPretax }: { deduction: Deduction; isPretax: boolean }) => {
    const options = isPretax ? COMMON_PRETAX_DEDUCTIONS : COMMON_POSTTAX_DEDUCTIONS;
    
    return (
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
        <Select onValueChange={(v) => selectCommonDeduction(v, deduction.id, isPretax)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select type..." />
          </SelectTrigger>
          <SelectContent>
            {options.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                <div className="flex items-center gap-2">
                  <opt.icon className="h-4 w-4" />
                  {opt.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Input
          placeholder="Label"
          value={deduction.label}
          onChange={(e) => updateDeduction(deduction.id, 'label', e.target.value, isPretax)}
          className="flex-1"
        />
        
        <div className="flex items-center gap-1">
          <Select 
            value={deduction.type} 
            onValueChange={(v: 'percentage' | 'amount') => updateDeduction(deduction.id, 'type', v, isPretax)}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="amount">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Amount
                </div>
              </SelectItem>
              <SelectItem value="percentage">
                <div className="flex items-center gap-1">
                  <Percent className="h-3 w-3" />
                  Percent
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <div className="relative">
            {deduction.type === 'amount' && (
              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            )}
            <Input
              type="number"
              value={deduction.value || ''}
              onChange={(e) => updateDeduction(deduction.id, 'value', parseFloat(e.target.value) || 0, isPretax)}
              className={`w-[100px] ${deduction.type === 'amount' ? 'pl-7' : ''}`}
              placeholder="0"
            />
            {deduction.type === 'percentage' && (
              <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeDeduction(deduction.id, isPretax)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <PageLayout title="Paycheck Allocator">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Paycheck Details
              </CardTitle>
              <CardDescription>Enter your gross pay and location for tax calculations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grossPay">Gross Pay (per paycheck)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="grossPay"
                      type="number"
                      value={grossPay}
                      onChange={(e) => setGrossPay(parseFloat(e.target.value) || 0)}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="frequency">Pay Frequency</Label>
                  <Select value={payFrequency} onValueChange={setPayFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                      <SelectItem value="semimonthly">Semi-Monthly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="zipCode"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      placeholder="12345"
                      className="pl-8"
                      maxLength={5}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="filingStatus">Filing Status</Label>
                  <Select value={filingStatus} onValueChange={setFilingStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married Filing Jointly</SelectItem>
                      <SelectItem value="marriedSeparate">Married Filing Separately</SelectItem>
                      <SelectItem value="headOfHousehold">Head of Household</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="allowances">Withholding Allowances</Label>
                <Input
                  id="allowances"
                  type="number"
                  value={allowances}
                  onChange={(e) => setAllowances(parseInt(e.target.value) || 0)}
                  min={0}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pre-Tax Deductions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <PiggyBank className="h-5 w-5 text-green-500" />
                    Pre-Tax Deductions
                  </CardTitle>
                  <CardDescription>Deductions taken before taxes are calculated</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => addDeduction(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {preTaxDeductions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No pre-tax deductions added. Click "Add" to get started.
                </p>
              ) : (
                preTaxDeductions.map(d => (
                  <DeductionRow key={d.id} deduction={d} isPretax={true} />
                ))
              )}
            </CardContent>
          </Card>

          {/* Post-Tax Deductions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-blue-500" />
                    Post-Tax Deductions
                  </CardTitle>
                  <CardDescription>Deductions taken after taxes are calculated</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => addDeduction(false)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {postTaxDeductions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No post-tax deductions added. Click "Add" to get started.
                </p>
              ) : (
                postTaxDeductions.map(d => (
                  <DeductionRow key={d.id} deduction={d} isPretax={false} />
                ))
              )}
            </CardContent>
          </Card>

          <Button 
            className="w-full" 
            size="lg"
            onClick={calculatePaycheck}
            disabled={isCalculating}
          >
            {isCalculating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Calculating with Gemini AI...
              </>
            ) : (
              <>
                <Calculator className="h-5 w-5 mr-2" />
                Calculate Paycheck
              </>
            )}
          </Button>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {result ? (
            <>
              {/* Summary Card */}
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader>
                  <CardTitle>Paycheck Summary</CardTitle>
                  <CardDescription>
                    {result.taxes.stateName} • {zipCode}
                    {result.taxes.localTaxName && ` • ${result.taxes.localTaxName}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Gross Pay</p>
                      <p className="text-2xl font-bold">${result.grossPay.toFixed(2)}</p>
                    </div>
                    <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                      <p className="text-sm text-green-600 dark:text-green-400">Net Pay</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        ${result.netPay.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Paycheck Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getChartData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {getChartData().map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => `$${value.toFixed(2)}`}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Tax Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Gross Pay</span>
                      <span className="font-bold">${result.grossPay.toFixed(2)}</span>
                    </div>
                    
                    {result.preTaxDeductions > 0 && (
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>Pre-Tax Deductions</span>
                        <span>-${result.preTaxDeductions.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span>Taxable Income</span>
                      <span>${result.taxableIncome.toFixed(2)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Taxes</p>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Landmark className="h-4 w-4 text-red-500" />
                        <span>Federal Tax</span>
                        <Badge variant="outline" className="text-xs">
                          {result.taxes.taxBreakdown.federalRate}
                        </Badge>
                      </div>
                      <span className="text-red-500">-${result.taxes.federalTax.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-orange-500" />
                        <span>State Tax ({result.taxes.stateName})</span>
                        <Badge variant="outline" className="text-xs">
                          {result.taxes.taxBreakdown.stateRate}
                        </Badge>
                      </div>
                      <span className="text-orange-500">-${result.taxes.stateTax.toFixed(2)}</span>
                    </div>

                    {result.taxes.localTax > 0 && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-yellow-500" />
                          <span>Local Tax {result.taxes.localTaxName && `(${result.taxes.localTaxName})`}</span>
                          <Badge variant="outline" className="text-xs">
                            {result.taxes.taxBreakdown.localRate}
                          </Badge>
                        </div>
                        <span className="text-yellow-500">-${result.taxes.localTax.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-500" />
                        <span>Social Security</span>
                        <Badge variant="outline" className="text-xs">6.2%</Badge>
                      </div>
                      <span className="text-blue-500">-${result.taxes.socialSecurity.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-pink-500" />
                        <span>Medicare</span>
                        <Badge variant="outline" className="text-xs">1.45%</Badge>
                      </div>
                      <span className="text-pink-500">-${result.taxes.medicare.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center font-medium pt-2 border-t">
                      <span>Total Taxes</span>
                      <span className="text-red-500">-${result.totalTaxes.toFixed(2)}</span>
                    </div>
                  </div>

                  {result.postTaxDeductions > 0 && (
                    <>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span>Post-Tax Deductions</span>
                        <span>-${result.postTaxDeductions.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Net Pay (Take Home)</span>
                    <span className="text-green-500">${result.netPay.toFixed(2)}</span>
                  </div>

                  {result.taxes.notes && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        <strong>Note:</strong> {result.taxes.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <CardContent className="text-center">
                <Calculator className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Calculation Yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Enter your paycheck details and click "Calculate Paycheck" to see your tax breakdown and net pay.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
