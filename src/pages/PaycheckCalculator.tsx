import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DeductionRow } from '@/components/paycheck/DeductionRow';
import { PaycheckWaterfall } from '@/components/paycheck/PaycheckWaterfall';
import { RelatedTools } from '@/components/seo/RelatedTools';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Sparkles } from 'lucide-react';

interface Deduction {
  id: string;
  label: string;
  value: number;
  type: 'percentage' | 'amount';
}

const PRE_TAX_OPTIONS = [
  { value: '401(k)', label: '401(k)', icon: Sparkles },
  { value: 'HSA', label: 'HSA', icon: Sparkles },
  { value: 'FSA', label: 'FSA', icon: Sparkles },
  { value: 'Health Insurance', label: 'Health Insurance', icon: Sparkles },
  { value: 'Dental', label: 'Dental', icon: Sparkles },
  { value: 'Vision', label: 'Vision', icon: Sparkles },
];

const POST_TAX_OPTIONS = [
  { value: 'Roth 401(k)', label: 'Roth 401(k)', icon: Sparkles },
  { value: 'Roth IRA', label: 'Roth IRA', icon: Sparkles },
  { value: 'Brokerage', label: 'Brokerage', icon: Sparkles },
  { value: 'Garnishment', label: 'Garnishment', icon: Sparkles },
  { value: 'Charity', label: 'Charity', icon: Sparkles },
];

const PaycheckCalculator = () => {
  const { toast } = useToast();
  const [grossPay, setGrossPay] = useState<number>(5000);
  const [payFrequency, setPayFrequency] = useState('biweekly');
  const [zipCode, setZipCode] = useState('');
  const [filingStatus, setFilingStatus] = useState('single');
  const [allowances, setAllowances] = useState<number>(0);
  const [preTax, setPreTax] = useState<Deduction[]>([]);
  const [postTax, setPostTax] = useState<Deduction[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const updateDeduction = (list: Deduction[], setList: (d: Deduction[]) => void) =>
    (id: string, field: keyof Deduction, value: string | number) => {
      setList(list.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
    };

  const removeDeduction = (list: Deduction[], setList: (d: Deduction[]) => void) =>
    (id: string) => setList(list.filter((d) => d.id !== id));

  const addDeduction = (list: Deduction[], setList: (d: Deduction[]) => void) => {
    setList([...list, { id: crypto.randomUUID(), label: '', value: 0, type: 'amount' }]);
  };

  const handleCalculate = async () => {
    if (!/^\d{5}$/.test(zipCode)) {
      toast({ title: 'Invalid ZIP', description: 'Enter a 5-digit ZIP code.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const mapType = (t: 'percentage' | 'amount') => (t === 'percentage' ? 'percentage' : 'fixed');
      const { data, error } = await supabase.functions.invoke('calculate-paycheck', {
        body: {
          grossPay,
          payFrequency,
          zipCode,
          filingStatus,
          allowances,
          preTaxDeductions: preTax.map((d) => ({ name: d.label, type: mapType(d.type), value: d.value })),
          postTaxDeductions: postTax.map((d) => ({ name: d.label, type: mapType(d.type), value: d.value })),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      toast({
        title: 'Calculation failed',
        description: err?.message ?? 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-primary mb-2">
            <Sparkles className="h-3.5 w-3.5" /> Powered by Gemini AI
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
            Paycheck Calculator
          </h1>
          <p className="text-muted-foreground mt-2">
            AI-powered federal, state, and local tax estimates for your take-home pay.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Paycheck Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Gross Pay</Label>
                  <Input
                    type="number"
                    value={grossPay || ''}
                    onChange={(e) => setGrossPay(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Pay Frequency</Label>
                  <Select value={payFrequency} onValueChange={setPayFrequency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Biweekly</SelectItem>
                      <SelectItem value="semimonthly">Semimonthly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>ZIP Code</Label>
                  <Input
                    inputMode="numeric"
                    maxLength={5}
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    placeholder="10001"
                  />
                </div>
                <div>
                  <Label>Filing Status</Label>
                  <Select value={filingStatus} onValueChange={setFilingStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married Filing Jointly</SelectItem>
                      <SelectItem value="married_separately">Married Filing Separately</SelectItem>
                      <SelectItem value="head_of_household">Head of Household</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Allowances</Label>
                  <Input
                    type="number"
                    value={allowances || ''}
                    onChange={(e) => setAllowances(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Pre-Tax Deductions</Label>
                  <Button variant="outline" size="sm" onClick={() => addDeduction(preTax, setPreTax)}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {preTax.map((d) => (
                    <DeductionRow
                      key={d.id}
                      deduction={d}
                      isPretax
                      options={PRE_TAX_OPTIONS}
                      onUpdate={updateDeduction(preTax, setPreTax)}
                      onRemove={removeDeduction(preTax, setPreTax)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Post-Tax Deductions</Label>
                  <Button variant="outline" size="sm" onClick={() => addDeduction(postTax, setPostTax)}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {postTax.map((d) => (
                    <DeductionRow
                      key={d.id}
                      deduction={d}
                      isPretax={false}
                      options={POST_TAX_OPTIONS}
                      onUpdate={updateDeduction(postTax, setPostTax)}
                      onRemove={removeDeduction(postTax, setPostTax)}
                    />
                  ))}
                </div>
              </div>

              <Button onClick={handleCalculate} disabled={loading} className="w-full" size="lg">
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Calculating with Gemini AI…</> : 'Calculate Paycheck'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Results</CardTitle></CardHeader>
            <CardContent>
              {!result && !loading && (
                <p className="text-muted-foreground text-sm">Fill out the form and click Calculate to see your take-home pay.</p>
              )}
              {loading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Gemini is computing your taxes…
                </div>
              )}
              {result && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Stat label="Gross" value={result.grossPay} />
                    <Stat label="Net" value={result.netPay} highlight />
                    <Stat label="Total Taxes" value={result.totalTaxes} />
                    <Stat label="Pre-Tax" value={result.preTaxDeductions} />
                  </div>
                  <div className="border-t pt-4 space-y-1 text-sm">
                    <Row label={`Federal Tax`} value={result.taxes.federalTax} />
                    <Row label={`State Tax (${result.taxes.stateName})`} value={result.taxes.stateTax} />
                    {result.taxes.localTax > 0 && (
                      <Row label={`Local Tax${result.taxes.localTaxName ? ` (${result.taxes.localTaxName})` : ''}`} value={result.taxes.localTax} />
                    )}
                    <Row label="Social Security" value={result.taxes.socialSecurity} />
                    <Row label="Medicare" value={result.taxes.medicare} />
                  </div>
                  {result.taxes.notes && (
                    <p className="text-xs text-muted-foreground italic">{result.taxes.notes}</p>
                  )}
                  <PaycheckWaterfall
                    grossPay={result.breakdown.gross}
                    preTaxDeductions={result.breakdown.preTax}
                    federalTax={result.breakdown.federal}
                    stateTax={result.breakdown.state}
                    localTax={result.breakdown.local}
                    socialSecurity={result.breakdown.socialSecurity}
                    medicare={result.breakdown.medicare}
                    postTaxDeductions={result.breakdown.postTax}
                    netPay={result.breakdown.net}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <RelatedTools currentPath="/paycheck-calculator" />
      </div>
    </PageLayout>
  );
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n || 0);

const Stat = ({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) => (
  <div className={`rounded-lg p-3 ${highlight ? 'bg-primary/10 border border-primary/30' : 'bg-muted/50'}`}>
    <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
    <div className={`font-mono text-lg font-semibold ${highlight ? 'text-primary' : ''}`}>{fmt(value)}</div>
  </div>
);

const Row = ({ label, value }: { label: string; value: number }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-mono">{fmt(value)}</span>
  </div>
);

export default PaycheckCalculator;
