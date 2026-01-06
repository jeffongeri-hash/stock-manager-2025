import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, Calculator, Search, TrendingDown, DollarSign, Loader2, Bot, MapPin, Fuel, Gauge } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

interface CarDeal {
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  dealer: string;
  location: string;
  monthlyPayment: number;
  totalCost: number;
  savings: string;
}

interface AISearchResult {
  deals: CarDeal[];
  marketInsight: string;
  recommendation: string;
  averagePrice: number;
}

export default function CarFinance() {
  // Car Payment Calculator State
  const [carPrice, setCarPrice] = useState('35000');
  const [downPayment, setDownPayment] = useState('5000');
  const [interestRate, setInterestRate] = useState('6.5');
  const [loanTerm, setLoanTerm] = useState('60');
  const [tradeInValue, setTradeInValue] = useState('0');
  const [salesTax, setSalesTax] = useState('6');

  // AI Car Search State
  const [searchMake, setSearchMake] = useState('');
  const [searchModel, setSearchModel] = useState('');
  const [maxPrice, setMaxPrice] = useState('40000');
  const [maxMileage, setMaxMileage] = useState('50000');
  const [searchZipCode, setSearchZipCode] = useState('');
  const [searchRadius, setSearchRadius] = useState('50');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<AISearchResult | null>(null);

  // Depreciation Calculator State
  const [purchaseValue, setPurchaseValue] = useState('35000');
  const [carAge, setCarAge] = useState('0');
  const [carType, setCarType] = useState('sedan');

  // Lease vs Buy State
  const [leaseMonthly, setLeaseMonthly] = useState('400');
  const [leaseTerm, setLeaseTerm] = useState('36');
  const [leaseDownPayment, setLeaseDownPayment] = useState('2000');
  const [buyPrice, setBuyPrice] = useState('35000');
  const [buyDownPayment, setBuyDownPayment] = useState('5000');
  const [buyRate, setBuyRate] = useState('6.5');
  const [buyTerm, setBuyTerm] = useState('60');
  const [residualValue, setResidualValue] = useState('20000');

  // Calculate Car Payment
  const calculatePayment = () => {
    const price = parseFloat(carPrice) || 0;
    const down = parseFloat(downPayment) || 0;
    const tradeIn = parseFloat(tradeInValue) || 0;
    const rate = parseFloat(interestRate) / 100 / 12;
    const term = parseFloat(loanTerm) || 60;
    const tax = parseFloat(salesTax) / 100;

    const taxableAmount = price - tradeIn;
    const totalTax = taxableAmount * tax;
    const amountFinanced = price + totalTax - down - tradeIn;
    
    const monthlyPayment = amountFinanced * (rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1);
    const totalPayment = monthlyPayment * term;
    const totalInterest = totalPayment - amountFinanced;

    // Amortization schedule
    const schedule = [];
    let balance = amountFinanced;
    for (let month = 1; month <= term; month++) {
      const interest = balance * rate;
      const principal = monthlyPayment - interest;
      balance -= principal;
      
      if (month % 12 === 0 || month === term) {
        schedule.push({
          month,
          year: Math.ceil(month / 12),
          balance: Math.max(0, Math.round(balance)),
          totalPaid: Math.round(monthlyPayment * month)
        });
      }
    }

    return {
      monthlyPayment,
      amountFinanced,
      totalPayment,
      totalInterest,
      totalTax,
      schedule
    };
  };

  // Calculate Depreciation
  const calculateDepreciation = () => {
    const value = parseFloat(purchaseValue) || 0;
    const age = parseFloat(carAge) || 0;
    
    // Depreciation rates by year (approximations)
    const depreciationRates: Record<string, number[]> = {
      sedan: [0.20, 0.15, 0.13, 0.12, 0.10, 0.08, 0.07, 0.06, 0.05, 0.05],
      suv: [0.18, 0.14, 0.12, 0.11, 0.10, 0.08, 0.07, 0.06, 0.05, 0.05],
      truck: [0.15, 0.12, 0.10, 0.09, 0.08, 0.07, 0.06, 0.05, 0.04, 0.04],
      luxury: [0.25, 0.18, 0.15, 0.13, 0.11, 0.09, 0.08, 0.07, 0.06, 0.05],
      electric: [0.22, 0.16, 0.14, 0.12, 0.10, 0.08, 0.07, 0.06, 0.05, 0.05]
    };

    const rates = depreciationRates[carType] || depreciationRates.sedan;
    const projections = [];
    let currentValue = value;
    
    for (let year = 0; year <= 10; year++) {
      if (year >= age) {
        projections.push({
          year,
          value: Math.round(currentValue),
          depreciation: year > 0 ? Math.round(value - currentValue) : 0,
          percentRemaining: Math.round((currentValue / value) * 100)
        });
      }
      if (year < 10) {
        currentValue *= (1 - rates[year]);
      }
    }

    return projections;
  };

  // Calculate Lease vs Buy
  const calculateLeaseVsBuy = () => {
    const leaseTotal = (parseFloat(leaseMonthly) * parseFloat(leaseTerm)) + parseFloat(leaseDownPayment);
    
    const price = parseFloat(buyPrice);
    const down = parseFloat(buyDownPayment);
    const rate = parseFloat(buyRate) / 100 / 12;
    const term = parseFloat(buyTerm);
    const residual = parseFloat(residualValue);
    
    const amountFinanced = price - down;
    const monthlyBuy = amountFinanced * (rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1);
    const totalBuyPayments = (monthlyBuy * term) + down;
    const buyEquity = residual; // Value of car after loan term
    const netBuyCost = totalBuyPayments - buyEquity;

    const comparison = [];
    let leaseAccumulated = parseFloat(leaseDownPayment);
    let buyAccumulated = down;
    
    for (let month = 1; month <= Math.max(parseFloat(leaseTerm), term); month++) {
      if (month <= parseFloat(leaseTerm)) {
        leaseAccumulated += parseFloat(leaseMonthly);
      }
      if (month <= term) {
        buyAccumulated += monthlyBuy;
      }
      
      if (month % 12 === 0) {
        comparison.push({
          year: month / 12,
          leaseCost: Math.round(leaseAccumulated),
          buyCost: Math.round(buyAccumulated),
          buyEquity: month >= term ? residual : 0
        });
      }
    }

    return {
      leaseTotal,
      netBuyCost,
      monthlyBuy,
      comparison,
      recommendation: leaseTotal < netBuyCost ? 
        "Leasing appears more cost-effective for your situation." :
        "Buying appears more cost-effective, especially if you keep the car long-term."
    };
  };

  // AI Car Search
  const searchCars = async () => {
    if (!searchZipCode) {
      toast.error('Please enter a ZIP code');
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-car-deals', {
        body: {
          make: searchMake,
          model: searchModel,
          maxPrice: parseFloat(maxPrice),
          maxMileage: parseFloat(maxMileage),
          zipCode: searchZipCode,
          radius: parseFloat(searchRadius),
          interestRate: parseFloat(interestRate),
          loanTerm: parseFloat(loanTerm),
          downPayment: parseFloat(downPayment)
        }
      });

      if (error) throw error;

      setSearchResults(data);
      toast.success('Found car deals in your area!');
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error(error.message || 'Failed to search for cars');
    } finally {
      setIsSearching(false);
    }
  };

  const payment = calculatePayment();
  const depreciation = calculateDepreciation();
  const leaseVsBuy = calculateLeaseVsBuy();

  return (
    <PageLayout title="Car Finance">
      <Tabs defaultValue="calculator" className="space-y-6">
        <TabsList className="grid grid-cols-2 lg:grid-cols-5 gap-2">
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Payment</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">AI Search</span>
          </TabsTrigger>
          <TabsTrigger value="depreciation" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            <span className="hidden sm:inline">Depreciation</span>
          </TabsTrigger>
          <TabsTrigger value="lease-vs-buy" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            <span className="hidden sm:inline">Lease vs Buy</span>
          </TabsTrigger>
          <TabsTrigger value="costs" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">True Costs</span>
          </TabsTrigger>
        </TabsList>

        {/* Payment Calculator Tab */}
        <TabsContent value="calculator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Loan Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Vehicle Price ($)</Label>
                  <Input type="number" value={carPrice} onChange={(e) => setCarPrice(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Down Payment ($)</Label>
                  <Input type="number" value={downPayment} onChange={(e) => setDownPayment(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Trade-In Value ($)</Label>
                  <Input type="number" value={tradeInValue} onChange={(e) => setTradeInValue(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Interest Rate (APR %)</Label>
                  <Input type="number" step="0.1" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Loan Term (Months)</Label>
                  <Select value={loanTerm} onValueChange={setLoanTerm}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24 months</SelectItem>
                      <SelectItem value="36">36 months</SelectItem>
                      <SelectItem value="48">48 months</SelectItem>
                      <SelectItem value="60">60 months</SelectItem>
                      <SelectItem value="72">72 months</SelectItem>
                      <SelectItem value="84">84 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sales Tax (%)</Label>
                  <Input type="number" step="0.1" value={salesTax} onChange={(e) => setSalesTax(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Payment Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-primary/10">
                    <p className="text-sm text-muted-foreground">Monthly Payment</p>
                    <p className="text-2xl font-bold text-primary">${payment.monthlyPayment.toFixed(0)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Amount Financed</p>
                    <p className="text-2xl font-bold">${payment.amountFinanced.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Total Interest</p>
                    <p className="text-2xl font-bold text-destructive">${payment.totalInterest.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                    <p className="text-2xl font-bold">${payment.totalPayment.toLocaleString()}</p>
                  </div>
                </div>

                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={payment.schedule}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="year" label={{ value: 'Year', position: 'bottom' }} />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                      <Legend />
                      <Line type="monotone" dataKey="balance" name="Remaining Balance" stroke="hsl(var(--destructive))" strokeWidth={2} />
                      <Line type="monotone" dataKey="totalPaid" name="Total Paid" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Car Search Tab */}
        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI-Powered Car Deal Finder
              </CardTitle>
              <CardDescription>
                Find the best car deals in your area based on your preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Make (Optional)</Label>
                  <Input placeholder="e.g., Toyota" value={searchMake} onChange={(e) => setSearchMake(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Model (Optional)</Label>
                  <Input placeholder="e.g., Camry" value={searchModel} onChange={(e) => setSearchModel(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Max Price ($)</Label>
                  <Input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Max Mileage</Label>
                  <Input type="number" value={maxMileage} onChange={(e) => setMaxMileage(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>ZIP Code</Label>
                  <Input placeholder="e.g., 90210" value={searchZipCode} onChange={(e) => setSearchZipCode(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Search Radius (miles)</Label>
                  <Select value={searchRadius} onValueChange={setSearchRadius}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 miles</SelectItem>
                      <SelectItem value="50">50 miles</SelectItem>
                      <SelectItem value="100">100 miles</SelectItem>
                      <SelectItem value="200">200 miles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end md:col-span-2">
                  <Button onClick={searchCars} disabled={isSearching} className="w-full">
                    {isSearching ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Searching...</>
                    ) : (
                      <><Search className="h-4 w-4 mr-2" /> Find Best Deals</>
                    )}
                  </Button>
                </div>
              </div>

              {searchResults && (
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground">Average Market Price</p>
                      <p className="text-2xl font-bold">${searchResults.averagePrice.toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted md:col-span-2">
                      <p className="text-sm text-muted-foreground">Market Insight</p>
                      <p className="font-medium">{searchResults.marketInsight}</p>
                    </div>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Top Deals Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {searchResults.deals.map((deal, i) => (
                          <div key={i} className="p-4 bg-muted rounded-lg">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                              <div>
                                <p className="font-bold text-lg">{deal.year} {deal.make} {deal.model}</p>
                                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
                                  <span className="flex items-center gap-1">
                                    <Gauge className="h-4 w-4" />
                                    {deal.mileage.toLocaleString()} mi
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {deal.location}
                                  </span>
                                  <span>{deal.dealer}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-primary">${deal.price.toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground">${deal.monthlyPayment}/mo est.</p>
                                {deal.savings && (
                                  <p className="text-sm text-green-500 font-medium">{deal.savings}</p>
                                )}
                              </div>
                            </div>
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
                      <p className="text-muted-foreground">{searchResults.recommendation}</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Depreciation Tab */}
        <TabsContent value="depreciation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Depreciation Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Purchase Price ($)</Label>
                  <Input type="number" value={purchaseValue} onChange={(e) => setPurchaseValue(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Current Age (Years)</Label>
                  <Input type="number" value={carAge} onChange={(e) => setCarAge(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Type</Label>
                  <Select value={carType} onValueChange={setCarType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedan">Sedan</SelectItem>
                      <SelectItem value="suv">SUV / Crossover</SelectItem>
                      <SelectItem value="truck">Truck</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                      <SelectItem value="electric">Electric</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Value Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={depreciation}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="year" label={{ value: 'Year', position: 'bottom' }} />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          name === 'value' ? `$${value.toLocaleString()}` : `${value}%`,
                          name === 'value' ? 'Value' : 'Remaining %'
                        ]} 
                      />
                      <Legend />
                      <Line type="monotone" dataKey="value" name="Vehicle Value" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Lease vs Buy Tab */}
        <TabsContent value="lease-vs-buy" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Lease Option</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Monthly Lease Payment ($)</Label>
                  <Input type="number" value={leaseMonthly} onChange={(e) => setLeaseMonthly(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Lease Term (Months)</Label>
                  <Select value={leaseTerm} onValueChange={setLeaseTerm}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24 months</SelectItem>
                      <SelectItem value="36">36 months</SelectItem>
                      <SelectItem value="48">48 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Due at Signing ($)</Label>
                  <Input type="number" value={leaseDownPayment} onChange={(e) => setLeaseDownPayment(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Buy Option</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Purchase Price ($)</Label>
                  <Input type="number" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Down Payment ($)</Label>
                  <Input type="number" value={buyDownPayment} onChange={(e) => setBuyDownPayment(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Interest Rate (%)</Label>
                  <Input type="number" step="0.1" value={buyRate} onChange={(e) => setBuyRate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Loan Term (Months)</Label>
                  <Select value={buyTerm} onValueChange={setBuyTerm}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="48">48 months</SelectItem>
                      <SelectItem value="60">60 months</SelectItem>
                      <SelectItem value="72">72 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Residual Value After Term ($)</Label>
                  <Input type="number" value={residualValue} onChange={(e) => setResidualValue(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comparison</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Total Lease Cost</p>
                  <p className="text-2xl font-bold">${leaseVsBuy.leaseTotal.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">No ownership at end</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Net Buy Cost</p>
                  <p className="text-2xl font-bold">${leaseVsBuy.netBuyCost.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">After selling car</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10">
                  <p className="text-sm font-medium">{leaseVsBuy.recommendation}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* True Costs Tab */}
        <TabsContent value="costs" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fuel className="h-5 w-5" />
                  Fuel Cost Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Assuming 12,000 miles/year</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg flex justify-between">
                    <span>25 MPG @ $3.50/gal</span>
                    <span className="font-bold">$1,680/yr</span>
                  </div>
                  <div className="p-3 bg-muted rounded-lg flex justify-between">
                    <span>30 MPG @ $3.50/gal</span>
                    <span className="font-bold">$1,400/yr</span>
                  </div>
                  <div className="p-3 bg-muted rounded-lg flex justify-between">
                    <span>40 MPG @ $3.50/gal</span>
                    <span className="font-bold">$1,050/yr</span>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-lg flex justify-between">
                    <span>Electric ($.13/kWh)</span>
                    <span className="font-bold text-green-500">$520/yr</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Insurance Estimates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Based on ${parseFloat(carPrice).toLocaleString()} vehicle</p>
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg flex justify-between">
                    <span>Liability Only</span>
                    <span className="font-bold">$80-120/mo</span>
                  </div>
                  <div className="p-3 bg-muted rounded-lg flex justify-between">
                    <span>Full Coverage</span>
                    <span className="font-bold">$150-250/mo</span>
                  </div>
                  <div className="p-3 bg-muted rounded-lg flex justify-between">
                    <span>Premium Coverage</span>
                    <span className="font-bold">$200-350/mo</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Maintenance Costs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Typical annual costs</p>
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg flex justify-between">
                    <span>Oil Changes (3x)</span>
                    <span className="font-bold">$150-300</span>
                  </div>
                  <div className="p-3 bg-muted rounded-lg flex justify-between">
                    <span>Tires (every 3 yrs)</span>
                    <span className="font-bold">$200-400/yr</span>
                  </div>
                  <div className="p-3 bg-muted rounded-lg flex justify-between">
                    <span>Brakes (every 3 yrs)</span>
                    <span className="font-bold">$100-200/yr</span>
                  </div>
                  <div className="p-3 bg-muted rounded-lg flex justify-between">
                    <span>Registration & Fees</span>
                    <span className="font-bold">$100-300</span>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg flex justify-between font-bold">
                    <span>Total Annual Est.</span>
                    <span>$550-1,200</span>
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
