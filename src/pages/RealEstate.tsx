import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Calculator, TrendingUp, DollarSign, Home, Percent, MapPin, Loader2, Send, Bot, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

interface PropertyAnalysis {
  estimatedValue: number;
  rentEstimate: number;
  comparables: Array<{
    address: string;
    price: number;
    sqft: number;
    beds: number;
    baths: number;
  }>;
  marketTrend: string;
  recommendation: string;
}

export default function RealEstate() {
  // Investment Calculator State
  const [purchasePrice, setPurchasePrice] = useState('300000');
  const [downPaymentPercent, setDownPaymentPercent] = useState('20');
  const [interestRate, setInterestRate] = useState('6.5');
  const [loanTerm, setLoanTerm] = useState('30');
  const [monthlyRent, setMonthlyRent] = useState('2000');
  const [propertyTaxRate, setPropertyTaxRate] = useState('1.2');
  const [insuranceAnnual, setInsuranceAnnual] = useState('1500');
  const [maintenancePercent, setMaintenancePercent] = useState('1');
  const [vacancyRate, setVacancyRate] = useState('5');
  const [appreciationRate, setAppreciationRate] = useState('3');

  // Mortgage Calculator State
  const [mortgagePrice, setMortgagePrice] = useState('400000');
  const [mortgageDown, setMortgageDown] = useState('80000');
  const [mortgageRate, setMortgageRate] = useState('6.5');
  const [mortgageTerm, setMortgageTerm] = useState('30');

  // Property Comparison State
  const [zipCode, setZipCode] = useState('');
  const [propertyType, setPropertyType] = useState('single-family');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [propertyAnalysis, setPropertyAnalysis] = useState<PropertyAnalysis | null>(null);

  // Rent vs Buy Calculator State
  const [rentAmount, setRentAmount] = useState('2000');
  const [rentIncrease, setRentIncrease] = useState('3');
  const [buyPrice, setBuyPrice] = useState('400000');
  const [buyDown, setBuyDown] = useState('20');
  const [buyRate, setBuyRate] = useState('6.5');
  const [investmentReturn, setInvestmentReturn] = useState('7');

  // Home Affordability Calculator State
  const [annualIncome, setAnnualIncome] = useState('100000');
  const [monthlyDebts, setMonthlyDebts] = useState('500');
  const [affordDownPayment, setAffordDownPayment] = useState('50000');
  const [affordRate, setAffordRate] = useState('6.5');
  const [affordTerm, setAffordTerm] = useState('30');
  const [dtiLimit, setDtiLimit] = useState('36');

  // Calculate Investment Returns
  const calculateInvestment = () => {
    const price = parseFloat(purchasePrice) || 0;
    const downPayment = (parseFloat(downPaymentPercent) / 100) * price;
    const loanAmount = price - downPayment;
    const monthlyRate = (parseFloat(interestRate) / 100) / 12;
    const numPayments = parseFloat(loanTerm) * 12;
    
    // Monthly mortgage payment
    const monthlyMortgage = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    // Monthly expenses
    const monthlyPropertyTax = (price * (parseFloat(propertyTaxRate) / 100)) / 12;
    const monthlyInsurance = parseFloat(insuranceAnnual) / 12;
    const monthlyMaintenance = (price * (parseFloat(maintenancePercent) / 100)) / 12;
    
    // Effective rental income after vacancy
    const effectiveRent = parseFloat(monthlyRent) * (1 - parseFloat(vacancyRate) / 100);
    
    // Monthly cash flow
    const totalExpenses = monthlyMortgage + monthlyPropertyTax + monthlyInsurance + monthlyMaintenance;
    const monthlyCashFlow = effectiveRent - totalExpenses;
    const annualCashFlow = monthlyCashFlow * 12;
    
    // Cap rate
    const NOI = (effectiveRent * 12) - ((monthlyPropertyTax + monthlyInsurance + monthlyMaintenance) * 12);
    const capRate = (NOI / price) * 100;
    
    // Cash on cash return
    const cashOnCash = (annualCashFlow / downPayment) * 100;
    
    // Generate projection data
    const projectionData = [];
    let currentValue = price;
    let totalEquity = downPayment;
    let remainingLoan = loanAmount;
    
    for (let year = 0; year <= 10; year++) {
      projectionData.push({
        year,
        propertyValue: Math.round(currentValue),
        equity: Math.round(totalEquity),
        cashFlow: Math.round(annualCashFlow * year)
      });
      
      currentValue *= (1 + parseFloat(appreciationRate) / 100);
      // Simplified equity buildup
      const yearlyPrincipal = loanAmount / parseFloat(loanTerm);
      totalEquity = currentValue - remainingLoan + yearlyPrincipal;
      remainingLoan -= yearlyPrincipal;
    }

    return {
      monthlyMortgage,
      totalExpenses,
      monthlyCashFlow,
      annualCashFlow,
      capRate,
      cashOnCash,
      downPayment,
      loanAmount,
      projectionData
    };
  };

  // Calculate Mortgage Payment
  const calculateMortgage = () => {
    const price = parseFloat(mortgagePrice) || 0;
    const down = parseFloat(mortgageDown) || 0;
    const rate = parseFloat(mortgageRate) || 0;
    const term = parseFloat(mortgageTerm) || 30;
    
    const loanAmount = price - down;
    const monthlyRate = (rate / 100) / 12;
    const numPayments = term * 12;
    
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    const totalPayment = monthlyPayment * numPayments;
    const totalInterest = totalPayment - loanAmount;
    
    // Amortization schedule
    const amortizationData = [];
    let balance = loanAmount;
    let totalPrincipalPaid = 0;
    let totalInterestPaid = 0;
    
    for (let year = 1; year <= term; year++) {
      let yearlyPrincipal = 0;
      let yearlyInterest = 0;
      
      for (let month = 0; month < 12; month++) {
        const interestPayment = balance * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;
        yearlyInterest += interestPayment;
        yearlyPrincipal += principalPayment;
        balance -= principalPayment;
      }
      
      totalPrincipalPaid += yearlyPrincipal;
      totalInterestPaid += yearlyInterest;
      
      amortizationData.push({
        year,
        principal: Math.round(yearlyPrincipal),
        interest: Math.round(yearlyInterest),
        balance: Math.max(0, Math.round(balance)),
        totalPaid: Math.round(totalPrincipalPaid + totalInterestPaid)
      });
    }

    return {
      loanAmount,
      monthlyPayment,
      totalPayment,
      totalInterest,
      downPaymentPercent: (down / price) * 100,
      amortizationData
    };
  };

  // Calculate Rent vs Buy
  const calculateRentVsBuy = () => {
    const rent = parseFloat(rentAmount) || 0;
    const rentInc = parseFloat(rentIncrease) / 100 || 0;
    const price = parseFloat(buyPrice) || 0;
    const down = (parseFloat(buyDown) / 100) * price;
    const rate = parseFloat(buyRate) / 100 || 0;
    const investReturn = parseFloat(investmentReturn) / 100 || 0;
    
    const loanAmount = price - down;
    const monthlyRate = rate / 12;
    const numPayments = 360;
    const monthlyMortgage = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    const comparisonData = [];
    let totalRentPaid = 0;
    let currentRent = rent;
    let investmentValue = down; // If renting, invest the down payment
    let homeEquity = down;
    let homeValue = price;
    let loanBalance = loanAmount;
    
    for (let year = 1; year <= 10; year++) {
      // Renting path
      const yearlyRent = currentRent * 12;
      totalRentPaid += yearlyRent;
      investmentValue *= (1 + investReturn);
      currentRent *= (1 + rentInc);
      
      // Buying path
      homeValue *= 1.03; // 3% appreciation
      let yearlyPrincipal = 0;
      for (let month = 0; month < 12; month++) {
        const interest = loanBalance * monthlyRate;
        const principal = monthlyMortgage - interest;
        yearlyPrincipal += principal;
        loanBalance -= principal;
      }
      homeEquity = homeValue - Math.max(0, loanBalance);
      
      comparisonData.push({
        year,
        rentWealth: Math.round(investmentValue - totalRentPaid),
        buyWealth: Math.round(homeEquity),
        totalRentPaid: Math.round(totalRentPaid),
        homeValue: Math.round(homeValue)
      });
    }

    return { comparisonData, monthlyMortgage };
  };

  // Calculate Home Affordability
  const calculateAffordability = () => {
    const income = parseFloat(annualIncome) || 0;
    const debts = parseFloat(monthlyDebts) || 0;
    const down = parseFloat(affordDownPayment) || 0;
    const rate = parseFloat(affordRate) / 100 / 12;
    const term = parseFloat(affordTerm) * 12;
    const maxDti = parseFloat(dtiLimit) / 100;

    const monthlyIncome = income / 12;
    const maxTotalDebt = monthlyIncome * maxDti;
    const maxHousingPayment = maxTotalDebt - debts;
    
    // Conservative estimate (28% front-end ratio)
    const conservativePayment = monthlyIncome * 0.28;
    
    // Calculate max loan from payment
    const calculateLoanFromPayment = (payment: number) => {
      if (payment <= 0 || rate <= 0) return 0;
      return payment * ((Math.pow(1 + rate, term) - 1) / (rate * Math.pow(1 + rate, term)));
    };

    const maxLoan = calculateLoanFromPayment(maxHousingPayment);
    const conservativeLoan = calculateLoanFromPayment(conservativePayment);
    
    const maxHomePrice = maxLoan + down;
    const conservativePrice = conservativeLoan + down;

    // Monthly costs breakdown for max price
    const estimatedTax = (maxHomePrice * 0.012) / 12;
    const estimatedInsurance = 150;
    const estimatedPMI = down < maxHomePrice * 0.2 ? (maxLoan * 0.005) / 12 : 0;
    
    return {
      maxHomePrice,
      conservativePrice,
      maxLoan,
      maxHousingPayment,
      conservativePayment,
      monthlyIncome,
      currentDti: ((debts / monthlyIncome) * 100),
      projectedDti: (((debts + maxHousingPayment) / monthlyIncome) * 100),
      breakdown: {
        principal: maxHousingPayment - estimatedTax - estimatedInsurance - estimatedPMI,
        tax: estimatedTax,
        insurance: estimatedInsurance,
        pmi: estimatedPMI
      }
    };
  };

  // AI Property Analysis
  const analyzeProperty = async () => {
    if (!zipCode) {
      toast.error('Please enter a ZIP code');
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-real-estate', {
        body: {
          zipCode,
          propertyType,
          purchasePrice: parseFloat(purchasePrice) || 300000
        }
      });

      if (error) throw error;

      setPropertyAnalysis(data);
      toast.success('Property analysis complete!');
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || 'Failed to analyze property');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const investment = calculateInvestment();
  const mortgage = calculateMortgage();
  const rentVsBuy = calculateRentVsBuy();
  const affordability = calculateAffordability();

  return (
    <PageLayout title="Real Estate Investment">
      <Tabs defaultValue="investment" className="space-y-6">
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 gap-2">
          <TabsTrigger value="investment" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Investment</span>
          </TabsTrigger>
          <TabsTrigger value="mortgage" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Mortgage</span>
          </TabsTrigger>
          <TabsTrigger value="affordability" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Affordability</span>
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">AI Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="rent-vs-buy" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Rent vs Buy</span>
          </TabsTrigger>
          <TabsTrigger value="more" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">More Tools</span>
          </TabsTrigger>
        </TabsList>

        {/* Investment Calculator Tab */}
        <TabsContent value="investment" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Purchase Price ($)</Label>
                  <Input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Down Payment (%)</Label>
                  <Input type="number" value={downPaymentPercent} onChange={(e) => setDownPaymentPercent(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Interest Rate (%)</Label>
                  <Input type="number" step="0.1" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Loan Term (Years)</Label>
                  <Select value={loanTerm} onValueChange={setLoanTerm}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 Years</SelectItem>
                      <SelectItem value="20">20 Years</SelectItem>
                      <SelectItem value="30">30 Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Monthly Rent ($)</Label>
                  <Input type="number" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Property Tax Rate (%)</Label>
                  <Input type="number" step="0.1" value={propertyTaxRate} onChange={(e) => setPropertyTaxRate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Annual Insurance ($)</Label>
                  <Input type="number" value={insuranceAnnual} onChange={(e) => setInsuranceAnnual(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Maintenance (%/year)</Label>
                  <Input type="number" step="0.1" value={maintenancePercent} onChange={(e) => setMaintenancePercent(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Vacancy Rate (%)</Label>
                  <Input type="number" value={vacancyRate} onChange={(e) => setVacancyRate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Appreciation Rate (%/year)</Label>
                  <Input type="number" step="0.1" value={appreciationRate} onChange={(e) => setAppreciationRate(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Investment Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Monthly Cash Flow</p>
                    <p className={`text-2xl font-bold ${investment.monthlyCashFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      ${investment.monthlyCashFlow.toFixed(0)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Cap Rate</p>
                    <p className="text-2xl font-bold">{investment.capRate.toFixed(2)}%</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Cash on Cash</p>
                    <p className={`text-2xl font-bold ${investment.cashOnCash >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {investment.cashOnCash.toFixed(2)}%
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Monthly Mortgage</p>
                    <p className="text-2xl font-bold">${investment.monthlyMortgage.toFixed(0)}</p>
                  </div>
                </div>

                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={investment.projectionData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="year" label={{ value: 'Years', position: 'bottom' }} />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                      <Legend />
                      <Line type="monotone" dataKey="propertyValue" name="Property Value" stroke="hsl(var(--primary))" strokeWidth={2} />
                      <Line type="monotone" dataKey="equity" name="Equity" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Mortgage Calculator Tab */}
        <TabsContent value="mortgage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Mortgage Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Home Price ($)</Label>
                  <Input type="number" value={mortgagePrice} onChange={(e) => setMortgagePrice(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Down Payment ($)</Label>
                  <Input type="number" value={mortgageDown} onChange={(e) => setMortgageDown(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Interest Rate (%)</Label>
                  <Input type="number" step="0.125" value={mortgageRate} onChange={(e) => setMortgageRate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Loan Term</Label>
                  <Select value={mortgageTerm} onValueChange={setMortgageTerm}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 Years</SelectItem>
                      <SelectItem value="20">20 Years</SelectItem>
                      <SelectItem value="30">30 Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Payment Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Monthly Payment</p>
                    <p className="text-2xl font-bold text-primary">${mortgage.monthlyPayment.toFixed(0)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Loan Amount</p>
                    <p className="text-2xl font-bold">${mortgage.loanAmount.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Total Interest</p>
                    <p className="text-2xl font-bold text-destructive">${mortgage.totalInterest.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Down Payment</p>
                    <p className="text-2xl font-bold">{mortgage.downPaymentPercent.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mortgage.amortizationData.filter((_, i) => i % 5 === 0 || i === mortgage.amortizationData.length - 1)}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="principal" name="Principal" fill="hsl(var(--primary))" stackId="a" />
                      <Bar dataKey="interest" name="Interest" fill="hsl(var(--destructive))" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Affordability Calculator Tab */}
        <TabsContent value="affordability" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Your Finances
                </CardTitle>
                <CardDescription>
                  Calculate how much home you can afford
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Annual Income ($)</Label>
                  <Input type="number" value={annualIncome} onChange={(e) => setAnnualIncome(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Monthly Debts ($)</Label>
                  <Input type="number" value={monthlyDebts} onChange={(e) => setMonthlyDebts(e.target.value)} placeholder="Car, student loans, credit cards" />
                </div>
                <div className="space-y-2">
                  <Label>Down Payment Available ($)</Label>
                  <Input type="number" value={affordDownPayment} onChange={(e) => setAffordDownPayment(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Interest Rate (%)</Label>
                  <Input type="number" step="0.125" value={affordRate} onChange={(e) => setAffordRate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Loan Term</Label>
                  <Select value={affordTerm} onValueChange={setAffordTerm}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 Years</SelectItem>
                      <SelectItem value="20">20 Years</SelectItem>
                      <SelectItem value="30">30 Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max DTI Ratio (%)</Label>
                  <Select value={dtiLimit} onValueChange={setDtiLimit}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="28">28% (Conservative)</SelectItem>
                      <SelectItem value="36">36% (Standard)</SelectItem>
                      <SelectItem value="43">43% (Aggressive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>How Much Home Can You Afford?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 rounded-lg bg-primary/10 border-2 border-primary">
                    <p className="text-sm text-muted-foreground">Maximum Home Price</p>
                    <p className="text-3xl font-bold text-primary">${affordability.maxHomePrice.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">Based on {dtiLimit}% DTI limit</p>
                  </div>
                  <div className="p-6 rounded-lg bg-green-500/10 border-2 border-green-500">
                    <p className="text-sm text-muted-foreground">Conservative Price</p>
                    <p className="text-3xl font-bold text-green-500">${affordability.conservativePrice.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">Based on 28% front-end ratio</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Max Loan Amount</p>
                    <p className="text-xl font-bold">${affordability.maxLoan.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Monthly Payment</p>
                    <p className="text-xl font-bold">${affordability.maxHousingPayment.toFixed(0)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Current DTI</p>
                    <p className="text-xl font-bold">{affordability.currentDti.toFixed(1)}%</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Projected DTI</p>
                    <p className={`text-xl font-bold ${affordability.projectedDti > 43 ? 'text-destructive' : 'text-green-500'}`}>
                      {affordability.projectedDti.toFixed(1)}%
                    </p>
                  </div>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Monthly Payment Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Principal & Interest</span>
                        <span className="font-bold">${affordability.breakdown.principal.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Property Tax (est.)</span>
                        <span className="font-bold">${affordability.breakdown.tax.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Homeowners Insurance (est.)</span>
                        <span className="font-bold">${affordability.breakdown.insurance.toFixed(0)}</span>
                      </div>
                      {affordability.breakdown.pmi > 0 && (
                        <div className="flex justify-between p-2 bg-muted rounded">
                          <span>PMI (less than 20% down)</span>
                          <span className="font-bold">${affordability.breakdown.pmi.toFixed(0)}</span>
                        </div>
                      )}
                      <div className="flex justify-between p-2 bg-primary/10 rounded font-bold">
                        <span>Total Monthly Payment</span>
                        <span>${affordability.maxHousingPayment.toFixed(0)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">💡 Affordability Tips</p>
                  <ul className="text-sm space-y-1">
                    <li>• Lenders typically prefer a DTI ratio below 36%</li>
                    <li>• Consider leaving room for maintenance costs (1-2% of home value/year)</li>
                    <li>• A larger down payment reduces monthly payments and may eliminate PMI</li>
                    <li>• Don't forget closing costs (typically 2-5% of home price)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Property Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Property Analysis
              </CardTitle>
              <CardDescription>
                Enter a ZIP code to get AI-powered property insights and comparables
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>ZIP Code</Label>
                  <Input 
                    placeholder="e.g., 90210" 
                    value={zipCode} 
                    onChange={(e) => setZipCode(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Property Type</Label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single-family">Single Family</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="multi-family">Multi-Family</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={analyzeProperty} disabled={isAnalyzing} className="w-full">
                    {isAnalyzing ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
                    ) : (
                      <><Send className="h-4 w-4 mr-2" /> Analyze Market</>
                    )}
                  </Button>
                </div>
              </div>

              {propertyAnalysis && (
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground">Estimated Value</p>
                      <p className="text-2xl font-bold">${propertyAnalysis.estimatedValue.toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground">Rent Estimate</p>
                      <p className="text-2xl font-bold">${propertyAnalysis.rentEstimate.toLocaleString()}/mo</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground">Market Trend</p>
                      <p className="text-2xl font-bold">{propertyAnalysis.marketTrend}</p>
                    </div>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Comparable Properties</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {propertyAnalysis.comparables.map((comp, i) => (
                          <div key={i} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <div>
                              <p className="font-medium">{comp.address}</p>
                              <p className="text-sm text-muted-foreground">{comp.beds} bed • {comp.baths} bath • {comp.sqft.toLocaleString()} sqft</p>
                            </div>
                            <p className="font-bold">${comp.price.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">AI Recommendation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{propertyAnalysis.recommendation}</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rent vs Buy Tab */}
        <TabsContent value="rent-vs-buy" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Rent vs Buy Comparison</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Monthly Rent ($)</Label>
                  <Input type="number" value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Annual Rent Increase (%)</Label>
                  <Input type="number" step="0.5" value={rentIncrease} onChange={(e) => setRentIncrease(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Home Purchase Price ($)</Label>
                  <Input type="number" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Down Payment (%)</Label>
                  <Input type="number" value={buyDown} onChange={(e) => setBuyDown(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Mortgage Rate (%)</Label>
                  <Input type="number" step="0.125" value={buyRate} onChange={(e) => setBuyRate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Investment Return (%)</Label>
                  <Input type="number" step="0.5" value={investmentReturn} onChange={(e) => setInvestmentReturn(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>10-Year Wealth Comparison</CardTitle>
                <CardDescription>
                  Comparing net wealth: Renting + Investing vs Buying
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={rentVsBuy.comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                      <Legend />
                      <Line type="monotone" dataKey="rentWealth" name="Rent + Invest" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                      <Line type="monotone" dataKey="buyWealth" name="Buy (Equity)" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* More Tools Tab */}
        <TabsContent value="more" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Closing Costs Calculator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Closing Costs Estimator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Based on your ${parseFloat(purchasePrice).toLocaleString()} purchase:
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span>Loan Origination (1%)</span>
                    <span>${((parseFloat(purchasePrice) * 0.8) * 0.01).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span>Title Insurance</span>
                    <span>${(parseFloat(purchasePrice) * 0.005).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span>Appraisal</span>
                    <span>$500</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span>Home Inspection</span>
                    <span>$400</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span>Recording Fees</span>
                    <span>$200</span>
                  </div>
                  <div className="flex justify-between p-2 bg-primary/10 rounded font-bold">
                    <span>Total Estimated</span>
                    <span>${(
                      ((parseFloat(purchasePrice) * 0.8) * 0.01) +
                      (parseFloat(purchasePrice) * 0.005) +
                      1100
                    ).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ROI Calculator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Quick ROI Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Annual Net Operating Income</p>
                    <p className="text-xl font-bold">
                      ${((parseFloat(monthlyRent) * 12 * 0.95) - 
                        (parseFloat(purchasePrice) * parseFloat(propertyTaxRate) / 100) -
                        parseFloat(insuranceAnnual) -
                        (parseFloat(purchasePrice) * parseFloat(maintenancePercent) / 100)
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Gross Rent Multiplier</p>
                    <p className="text-xl font-bold">
                      {(parseFloat(purchasePrice) / (parseFloat(monthlyRent) * 12)).toFixed(1)}x
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">1% Rule Check</p>
                    <p className="text-xl font-bold">
                      {((parseFloat(monthlyRent) / parseFloat(purchasePrice)) * 100).toFixed(2)}%
                      {parseFloat(monthlyRent) >= parseFloat(purchasePrice) * 0.01 ? 
                        <span className="text-green-500 ml-2">✓ Passes</span> : 
                        <span className="text-yellow-500 ml-2">Below 1%</span>
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
