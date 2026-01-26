import { useState, useEffect, useCallback } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ScenarioComparison } from '@/components/paycheck/ScenarioComparison';
import { WhatIfSlider } from '@/components/paycheck/WhatIfSlider';
import { DeductionRow } from '@/components/paycheck/DeductionRow';
import { ScenarioInputs } from '@/components/paycheck/ScenarioInputs';
import { EmployerMatchProjection } from '@/components/paycheck/EmployerMatchProjection';
import { PaycheckWaterfall } from '@/components/paycheck/PaycheckWaterfall';
import {
  Calculator, DollarSign, Plus, Trash2, Loader2, 
  Percent, Building2, Landmark, Heart, Briefcase,
  PiggyBank, Shield, GraduationCap, Baby, Car,
  Save, FolderOpen, Calendar, TrendingUp, Star, StarOff,
  GitCompare, Copy
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

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

interface SavedConfiguration {
  id: string;
  name: string;
  gross_pay: number;
  pay_frequency: string;
  zip_code: string;
  filing_status: string;
  allowances: number;
  pre_tax_deductions: Deduction[];
  post_tax_deductions: Deduction[];
  is_default: boolean;
  created_at: string;
}

const COMMON_PRETAX_DEDUCTIONS = [
  { value: '401k', label: '401(k) Contribution', icon: PiggyBank },
  { value: '403b', label: '403(b) Contribution', icon: PiggyBank },
  { value: '457b', label: '457(b) Contribution', icon: PiggyBank },
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

// 2024 Federal Tax Brackets (Single)
const FEDERAL_TAX_BRACKETS_SINGLE = [
  { min: 0, max: 11600, rate: 10, label: '10%' },
  { min: 11600, max: 47150, rate: 12, label: '12%' },
  { min: 47150, max: 100525, rate: 22, label: '22%' },
  { min: 100525, max: 191950, rate: 24, label: '24%' },
  { min: 191950, max: 243725, rate: 32, label: '32%' },
  { min: 243725, max: 609350, rate: 35, label: '35%' },
  { min: 609350, max: Infinity, rate: 37, label: '37%' },
];

const FEDERAL_TAX_BRACKETS_MARRIED = [
  { min: 0, max: 23200, rate: 10, label: '10%' },
  { min: 23200, max: 94300, rate: 12, label: '12%' },
  { min: 94300, max: 201050, rate: 22, label: '22%' },
  { min: 201050, max: 383900, rate: 24, label: '24%' },
  { min: 383900, max: 487450, rate: 32, label: '32%' },
  { min: 487450, max: 731200, rate: 35, label: '35%' },
  { min: 731200, max: Infinity, rate: 37, label: '37%' },
];

const getPayPeriodsPerYear = (frequency: string): number => {
  switch (frequency) {
    case 'weekly': return 52;
    case 'biweekly': return 26;
    case 'semimonthly': return 24;
    case 'monthly': return 12;
    default: return 26;
  }
};

export default function PaycheckAllocator() {
  const { user } = useAuth();
  const [grossPay, setGrossPay] = useState<number>(5000);
  const [payFrequency, setPayFrequency] = useState('biweekly');
  const [zipCode, setZipCode] = useState('');
  const [filingStatus, setFilingStatus] = useState('single');
  const [allowances, setAllowances] = useState<number>(0);
  
  const [preTaxDeductions, setPreTaxDeductions] = useState<Deduction[]>([]);
  const [postTaxDeductions, setPostTaxDeductions] = useState<Deduction[]>([]);
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<PaycheckResult | null>(null);
  
  // Configuration management
  const [savedConfigurations, setSavedConfigurations] = useState<SavedConfiguration[]>([]);
  const [configName, setConfigName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  
  // Comparison mode
  const [comparisonMode, setComparisonMode] = useState(false);
  const [scenarioAName, setScenarioAName] = useState('Scenario A');
  const [scenarioBName, setScenarioBName] = useState('Scenario B');
  
  // Scenario B state
  const [grossPayB, setGrossPayB] = useState<number>(5000);
  const [payFrequencyB, setPayFrequencyB] = useState('biweekly');
  const [zipCodeB, setZipCodeB] = useState('');
  const [filingStatusB, setFilingStatusB] = useState('single');
  const [allowancesB, setAllowancesB] = useState<number>(0);
  const [preTaxDeductionsB, setPreTaxDeductionsB] = useState<Deduction[]>([]);
  const [postTaxDeductionsB, setPostTaxDeductionsB] = useState<Deduction[]>([]);
  const [isCalculatingB, setIsCalculatingB] = useState(false);
  const [resultB, setResultB] = useState<PaycheckResult | null>(null);
  
  // Load saved configurations on mount
  useEffect(() => {
    if (user) {
      loadConfigurations();
    }
  }, [user]);

  const loadConfigurations = async () => {
    if (!user) return;
    
    setIsLoadingConfigs(true);
    try {
      const { data, error } = await supabase
        .from('paycheck_configurations')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Type assertion for JSONB fields
      const configs = (data || []).map(config => ({
        ...config,
        pre_tax_deductions: config.pre_tax_deductions as unknown as Deduction[],
        post_tax_deductions: config.post_tax_deductions as unknown as Deduction[],
      }));
      
      setSavedConfigurations(configs);
      
      // Auto-load default configuration
      const defaultConfig = configs.find(c => c.is_default);
      if (defaultConfig) {
        applyConfiguration(defaultConfig);
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
    } finally {
      setIsLoadingConfigs(false);
    }
  };

  const saveConfiguration = async () => {
    if (!user) {
      toast.error('Please sign in to save configurations');
      return;
    }
    
    if (!configName.trim()) {
      toast.error('Please enter a configuration name');
      return;
    }
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('paycheck_configurations')
        .insert([{
          user_id: user.id,
          name: configName.trim(),
          gross_pay: grossPay,
          pay_frequency: payFrequency,
          zip_code: zipCode,
          filing_status: filingStatus,
          allowances: allowances,
          pre_tax_deductions: JSON.parse(JSON.stringify(preTaxDeductions)),
          post_tax_deductions: JSON.parse(JSON.stringify(postTaxDeductions)),
        }]);
      
      if (error) throw error;
      
      toast.success('Configuration saved successfully');
      setShowSaveDialog(false);
      setConfigName('');
      loadConfigurations();
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const applyConfiguration = (config: SavedConfiguration) => {
    setGrossPay(config.gross_pay);
    setPayFrequency(config.pay_frequency);
    setZipCode(config.zip_code);
    setFilingStatus(config.filing_status);
    setAllowances(config.allowances);
    setPreTaxDeductions(config.pre_tax_deductions || []);
    setPostTaxDeductions(config.post_tax_deductions || []);
    setShowLoadDialog(false);
    toast.success(`Loaded "${config.name}"`);
  };

  const toggleDefault = async (configId: string, currentDefault: boolean) => {
    if (!user) return;
    
    try {
      // First, remove default from all
      if (!currentDefault) {
        await supabase
          .from('paycheck_configurations')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }
      
      // Then set/unset the selected one
      await supabase
        .from('paycheck_configurations')
        .update({ is_default: !currentDefault })
        .eq('id', configId);
      
      loadConfigurations();
      toast.success(currentDefault ? 'Removed as default' : 'Set as default');
    } catch (error) {
      console.error('Error updating default:', error);
      toast.error('Failed to update default');
    }
  };

  const deleteConfiguration = async (configId: string) => {
    try {
      const { error } = await supabase
        .from('paycheck_configurations')
        .delete()
        .eq('id', configId);
      
      if (error) throw error;
      
      loadConfigurations();
      toast.success('Configuration deleted');
    } catch (error) {
      console.error('Error deleting configuration:', error);
      toast.error('Failed to delete configuration');
    }
  };

  const addDeduction = (isPretax: boolean, isScenarioB = false) => {
    const newDeduction: Deduction = {
      id: crypto.randomUUID(),
      label: '',
      value: 0,
      type: 'amount',
    };
    
    if (isScenarioB) {
      if (isPretax) {
        setPreTaxDeductionsB([...preTaxDeductionsB, newDeduction]);
      } else {
        setPostTaxDeductionsB([...postTaxDeductionsB, newDeduction]);
      }
    } else {
      if (isPretax) {
        setPreTaxDeductions([...preTaxDeductions, newDeduction]);
      } else {
        setPostTaxDeductions([...postTaxDeductions, newDeduction]);
      }
    }
  };

  const updateDeduction = useCallback((id: string, field: keyof Deduction, value: string | number, isPretax: boolean, isScenarioB = false) => {
    if (isScenarioB) {
      const setDeductions = isPretax ? setPreTaxDeductionsB : setPostTaxDeductionsB;
      setDeductions(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
    } else {
      const setDeductions = isPretax ? setPreTaxDeductions : setPostTaxDeductions;
      setDeductions(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
    }
  }, []);

  const removeDeduction = useCallback((id: string, isPretax: boolean, isScenarioB = false) => {
    if (isScenarioB) {
      if (isPretax) {
        setPreTaxDeductionsB(prev => prev.filter(d => d.id !== id));
      } else {
        setPostTaxDeductionsB(prev => prev.filter(d => d.id !== id));
      }
    } else {
      if (isPretax) {
        setPreTaxDeductions(prev => prev.filter(d => d.id !== id));
      } else {
        setPostTaxDeductions(prev => prev.filter(d => d.id !== id));
      }
    }
  }, []);

  const copyScenarioAToB = () => {
    setGrossPayB(grossPay);
    setPayFrequencyB(payFrequency);
    setZipCodeB(zipCode);
    setFilingStatusB(filingStatus);
    setAllowancesB(allowances);
    setPreTaxDeductionsB(preTaxDeductions.map(d => ({ ...d, id: crypto.randomUUID() })));
    setPostTaxDeductionsB(postTaxDeductions.map(d => ({ ...d, id: crypto.randomUUID() })));
    toast.success('Copied Scenario A to Scenario B');
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
      toast.success(`${comparisonMode ? scenarioAName : 'Paycheck'} calculated successfully`);
    } catch (error) {
      console.error('Error calculating paycheck:', error);
      toast.error('Failed to calculate paycheck');
    } finally {
      setIsCalculating(false);
    }
  };

  const calculatePaycheckB = async () => {
    if (!zipCodeB || zipCodeB.length !== 5) {
      toast.error('Please enter a valid 5-digit ZIP code for Scenario B');
      return;
    }

    setIsCalculatingB(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-paycheck', {
        body: {
          grossPay: grossPayB,
          payFrequency: payFrequencyB,
          zipCode: zipCodeB,
          filingStatus: filingStatusB,
          allowances: allowancesB,
          preTaxDeductions: preTaxDeductionsB.map(d => ({
            label: d.label,
            value: d.value,
            type: d.type,
          })),
          postTaxDeductions: postTaxDeductionsB.map(d => ({
            label: d.label,
            value: d.value,
            type: d.type,
          })),
        },
      });

      if (error) throw error;
      
      setResultB(data);
      toast.success(`${scenarioBName} calculated successfully`);
    } catch (error) {
      console.error('Error calculating paycheck B:', error);
      toast.error('Failed to calculate Scenario B');
    } finally {
      setIsCalculatingB(false);
    }
  };

  const calculateBothScenarios = async () => {
    await Promise.all([calculatePaycheck(), calculatePaycheckB()]);
  };

  // Yearly projection calculations
  const getYearlyProjection = () => {
    if (!result) return null;
    
    const periods = getPayPeriodsPerYear(payFrequency);
    
    return {
      grossIncome: result.grossPay * periods,
      preTaxDeductions: result.preTaxDeductions * periods,
      taxableIncome: result.taxableIncome * periods,
      federalTax: result.taxes.federalTax * periods,
      stateTax: result.taxes.stateTax * periods,
      localTax: result.taxes.localTax * periods,
      socialSecurity: Math.min(result.taxes.socialSecurity * periods, 168600 * 0.062),
      medicare: result.taxes.medicare * periods,
      totalTaxes: result.totalTaxes * periods,
      postTaxDeductions: result.postTaxDeductions * periods,
      netPay: result.netPay * periods,
    };
  };

  const getTaxBracketData = () => {
    const yearly = getYearlyProjection();
    if (!yearly) return [];
    
    const brackets = filingStatus === 'married' || filingStatus === 'marriedSeparate' 
      ? FEDERAL_TAX_BRACKETS_MARRIED 
      : FEDERAL_TAX_BRACKETS_SINGLE;
    
    const taxableIncome = yearly.taxableIncome;
    
    return brackets.map(bracket => {
      const bracketMin = bracket.min;
      const bracketMax = bracket.max === Infinity ? bracketMin + 200000 : bracket.max;
      const bracketSize = bracketMax - bracketMin;
      
      let taxableInBracket = 0;
      if (taxableIncome > bracket.min) {
        taxableInBracket = Math.min(taxableIncome - bracket.min, bracket.max === Infinity ? taxableIncome - bracket.min : bracketSize);
      }
      
      const isCurrentBracket = taxableIncome > bracket.min && (bracket.max === Infinity || taxableIncome <= bracket.max);
      
      return {
        bracket: bracket.label,
        range: bracket.max === Infinity ? `$${bracket.min.toLocaleString()}+` : `$${bracket.min.toLocaleString()} - $${bracket.max.toLocaleString()}`,
        taxable: taxableInBracket,
        taxAmount: taxableInBracket * (bracket.rate / 100),
        isCurrent: isCurrentBracket,
        rate: bracket.rate,
      };
    }).filter(b => b.taxable > 0 || b.isCurrent);
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


  const yearlyProjection = getYearlyProjection();
  const taxBracketData = getTaxBracketData();

  return (
    <PageLayout title="Paycheck Allocator">
      {/* Comparison Mode Toggle */}
      <div className="flex items-center justify-between mb-6 p-4 rounded-lg border bg-card">
        <div className="flex items-center gap-3">
          <GitCompare className="h-5 w-5 text-muted-foreground" />
          <div>
            <Label htmlFor="comparison-mode" className="font-medium">Comparison Mode</Label>
            <p className="text-sm text-muted-foreground">Compare two paycheck scenarios side-by-side</p>
          </div>
        </div>
        <Switch
          id="comparison-mode"
          checked={comparisonMode}
          onCheckedChange={setComparisonMode}
        />
      </div>

      {comparisonMode ? (
        <ComparisonModeUI />
      ) : (
        <StandardModeUI />
      )}
    </PageLayout>
  );

  function ComparisonModeUI() {
    return (
      <div className="space-y-6">
        {/* Scenario Names */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Scenario A Name</Label>
            <Input 
              value={scenarioAName} 
              onChange={(e) => setScenarioAName(e.target.value)}
              placeholder="e.g., Current Job"
            />
          </div>
          <div className="space-y-2">
            <Label>Scenario B Name</Label>
            <div className="flex gap-2">
              <Input 
                value={scenarioBName} 
                onChange={(e) => setScenarioBName(e.target.value)}
                placeholder="e.g., With 401k"
              />
              <Button variant="outline" size="icon" onClick={copyScenarioAToB} title="Copy Scenario A to B">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Side by Side Scenarios */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scenario A */}
          <Card className="border-chart-1/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline" className="bg-chart-1/10 border-chart-1/30">{scenarioAName}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScenarioInputs
                grossPay={grossPay}
                setGrossPay={setGrossPay}
                payFrequency={payFrequency}
                setPayFrequency={setPayFrequency}
                zipCode={zipCode}
                setZipCode={setZipCode}
                filingStatus={filingStatus}
                setFilingStatus={setFilingStatus}
                allowances={allowances}
                setAllowances={setAllowances}
                preTaxDeductions={preTaxDeductions}
                postTaxDeductions={postTaxDeductions}
                onAddDeduction={(isPretax) => addDeduction(isPretax, false)}
                onUpdateDeduction={(id, field, value, isPretax) => updateDeduction(id, field, value, isPretax, false)}
                onRemoveDeduction={(id, isPretax) => removeDeduction(id, isPretax, false)}
              />
              <Button 
                className="w-full" 
                onClick={calculatePaycheck}
                disabled={isCalculating}
              >
                {isCalculating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calculator className="h-4 w-4 mr-2" />}
                Calculate {scenarioAName}
              </Button>
              {result && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                  <p className="text-sm text-muted-foreground">Net Pay</p>
                  <p className="text-2xl font-bold text-green-500">${result.netPay.toFixed(2)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scenario B */}
          <Card className="border-chart-2/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline" className="bg-chart-2/10 border-chart-2/30">{scenarioBName}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScenarioInputs
                grossPay={grossPayB}
                setGrossPay={setGrossPayB}
                payFrequency={payFrequencyB}
                setPayFrequency={setPayFrequencyB}
                zipCode={zipCodeB}
                setZipCode={setZipCodeB}
                filingStatus={filingStatusB}
                setFilingStatus={setFilingStatusB}
                allowances={allowancesB}
                setAllowances={setAllowancesB}
                preTaxDeductions={preTaxDeductionsB}
                postTaxDeductions={postTaxDeductionsB}
                onAddDeduction={(isPretax) => addDeduction(isPretax, true)}
                onUpdateDeduction={(id, field, value, isPretax) => updateDeduction(id, field, value, isPretax, true)}
                onRemoveDeduction={(id, isPretax) => removeDeduction(id, isPretax, true)}
              />
              <Button 
                className="w-full" 
                onClick={calculatePaycheckB}
                disabled={isCalculatingB}
              >
                {isCalculatingB ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calculator className="h-4 w-4 mr-2" />}
                Calculate {scenarioBName}
              </Button>
              {resultB && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                  <p className="text-sm text-muted-foreground">Net Pay</p>
                  <p className="text-2xl font-bold text-green-500">${resultB.netPay.toFixed(2)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Calculate Both Button */}
        <Button 
          className="w-full" 
          size="lg"
          onClick={calculateBothScenarios}
          disabled={isCalculating || isCalculatingB}
        >
          {(isCalculating || isCalculatingB) ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <GitCompare className="h-5 w-5 mr-2" />
          )}
          Calculate & Compare Both Scenarios
        </Button>

        {/* Comparison Results */}
        <ScenarioComparison
          scenarioA={{ name: scenarioAName, result, payFrequency }}
          scenarioB={{ name: scenarioBName, result: resultB, payFrequency: payFrequencyB }}
        />
      </div>
    );
  }


  function StandardModeUI() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          {/* Configuration Actions */}
          <div className="flex gap-2">
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1" disabled={!user}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Paycheck Configuration</DialogTitle>
                  <DialogDescription>
                    Save your current settings for quick access later.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="configName">Configuration Name</Label>
                    <Input
                      id="configName"
                      placeholder="e.g., Main Job, Side Gig"
                      value={configName}
                      onChange={(e) => setConfigName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveConfiguration} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1" disabled={!user}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Load Configuration
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Load Saved Configuration</DialogTitle>
                  <DialogDescription>
                    Select a saved configuration to load.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {isLoadingConfigs ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : savedConfigurations.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No saved configurations yet.
                    </p>
                  ) : (
                    savedConfigurations.map(config => (
                      <div
                        key={config.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 cursor-pointer" onClick={() => applyConfiguration(config)}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{config.name}</span>
                            {config.is_default && (
                              <Badge variant="secondary" className="text-xs">Default</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            ${config.gross_pay.toLocaleString()} • {config.pay_frequency} • {config.zip_code}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDefault(config.id, config.is_default);
                            }}
                            title={config.is_default ? 'Remove as default' : 'Set as default'}
                          >
                            {config.is_default ? (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            ) : (
                              <StarOff className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConfiguration(config.id);
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {!user && (
            <p className="text-sm text-muted-foreground text-center">
              Sign in to save and load configurations.
            </p>
          )}

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
                      <SelectItem value="weekly">Weekly (52/year)</SelectItem>
                      <SelectItem value="biweekly">Bi-Weekly (26/year)</SelectItem>
                      <SelectItem value="semimonthly">Semi-Monthly (24/year)</SelectItem>
                      <SelectItem value="monthly">Monthly (12/year)</SelectItem>
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
                  <DeductionRow 
                    key={d.id} 
                    deduction={d} 
                    isPretax={true}
                    options={COMMON_PRETAX_DEDUCTIONS}
                    onUpdate={(id, field, value) => updateDeduction(id, field, value, true, false)}
                    onRemove={(id) => removeDeduction(id, true, false)}
                  />
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
                  <DeductionRow 
                    key={d.id} 
                    deduction={d} 
                    isPretax={false}
                    options={COMMON_POSTTAX_DEDUCTIONS}
                    onUpdate={(id, field, value) => updateDeduction(id, field, value, false, false)}
                    onRemove={(id) => removeDeduction(id, false, false)}
                  />
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
            <Tabs defaultValue="paycheck" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="paycheck">Per Paycheck</TabsTrigger>
                <TabsTrigger value="yearly">
                  <Calendar className="h-4 w-4 mr-1" />
                  Yearly Projection
                </TabsTrigger>
              </TabsList>

              <TabsContent value="paycheck" className="space-y-6">
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

                {/* Paycheck Flow Waterfall */}
                <PaycheckWaterfall
                  grossPay={result.grossPay}
                  preTaxDeductions={result.preTaxDeductions}
                  federalTax={result.taxes.federalTax}
                  stateTax={result.taxes.stateTax}
                  localTax={result.taxes.localTax}
                  socialSecurity={result.taxes.socialSecurity}
                  medicare={result.taxes.medicare}
                  postTaxDeductions={result.postTaxDeductions}
                  netPay={result.netPay}
                />

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

                {/* What-If Slider */}
                <WhatIfSlider 
                  result={result} 
                  grossPay={grossPay} 
                  payFrequency={payFrequency} 
                />
              </TabsContent>

              <TabsContent value="yearly" className="space-y-6">
                {yearlyProjection && (
                  <>
                    {/* Yearly Summary */}
                    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Annual Projection
                        </CardTitle>
                        <CardDescription>
                          Based on {getPayPeriodsPerYear(payFrequency)} pay periods per year ({payFrequency})
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Annual Gross</p>
                            <p className="text-2xl font-bold">${yearlyProjection.grossIncome.toLocaleString()}</p>
                          </div>
                          <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                            <p className="text-sm text-green-600 dark:text-green-400">Annual Net</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                              ${yearlyProjection.netPay.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Tax Brackets */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Federal Tax Brackets</CardTitle>
                        <CardDescription>
                          Your taxable income: ${yearlyProjection.taxableIncome.toLocaleString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={taxBracketData} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                              <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                              <YAxis type="category" dataKey="bracket" width={50} />
                              <Tooltip 
                                formatter={(value: number) => `$${value.toLocaleString()}`}
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--card))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                }}
                              />
                              <Bar 
                                dataKey="taxable" 
                                name="Taxable Amount"
                                fill="hsl(var(--chart-1))"
                                radius={[0, 4, 4, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="mt-4 space-y-2">
                          {taxBracketData.map((bracket, index) => (
                            <div 
                              key={index}
                              className={`flex justify-between items-center p-2 rounded ${
                                bracket.isCurrent ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                              }`}
                            >
                              <div>
                                <span className="font-medium">{bracket.bracket} Bracket</span>
                                {bracket.isCurrent && (
                                  <Badge variant="default" className="ml-2 text-xs">Current</Badge>
                                )}
                                <p className="text-xs text-muted-foreground">{bracket.range}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">${bracket.taxable.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">
                                  Tax: ${bracket.taxAmount.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Annual Breakdown */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Annual Tax Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span>Gross Income</span>
                          <span className="font-medium">${yearlyProjection.grossIncome.toLocaleString()}</span>
                        </div>
                        {yearlyProjection.preTaxDeductions > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>Pre-Tax Deductions</span>
                            <span>-${yearlyProjection.preTaxDeductions.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Taxable Income</span>
                          <span className="font-medium">${yearlyProjection.taxableIncome.toLocaleString()}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-red-500">
                          <span>Federal Tax</span>
                          <span>-${yearlyProjection.federalTax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-orange-500">
                          <span>State Tax</span>
                          <span>-${yearlyProjection.stateTax.toLocaleString()}</span>
                        </div>
                        {yearlyProjection.localTax > 0 && (
                          <div className="flex justify-between text-yellow-500">
                            <span>Local Tax</span>
                            <span>-${yearlyProjection.localTax.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-blue-500">
                          <span>Social Security</span>
                          <span>-${yearlyProjection.socialSecurity.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-pink-500">
                          <span>Medicare</span>
                          <span>-${yearlyProjection.medicare.toLocaleString()}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Total Annual Taxes</span>
                          <span className="text-red-500">-${yearlyProjection.totalTaxes.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Effective Tax Rate</span>
                          <span>{((yearlyProjection.totalTaxes / yearlyProjection.grossIncome) * 100).toFixed(1)}%</span>
                        </div>
                        {yearlyProjection.postTaxDeductions > 0 && (
                          <>
                            <Separator />
                            <div className="flex justify-between">
                              <span>Post-Tax Deductions</span>
                              <span>-${yearlyProjection.postTaxDeductions.toLocaleString()}</span>
                            </div>
                          </>
                        )}
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Annual Net Income</span>
                          <span className="text-green-500">${yearlyProjection.netPay.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Monthly Take-Home</span>
                          <span>${(yearlyProjection.netPay / 12).toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Employer Match & Retirement Projection */}
                    <EmployerMatchProjection
                      grossPay={grossPay}
                      payFrequency={payFrequency}
                      preTaxDeductions={preTaxDeductions}
                      postTaxDeductions={postTaxDeductions}
                    />
                  </>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <CardContent className="text-center">
                <Calculator className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Calculation Yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Enter your paycheck details and click "Calculate Paycheck" to see your tax breakdown, net pay, and yearly projection.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }
}
