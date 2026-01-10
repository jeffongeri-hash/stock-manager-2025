import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Target, TrendingUp, DollarSign, PiggyBank, Sparkles, Shield } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PortfolioSuggestion {
  name: string;
  yield: number;
  growthRate: number;
  description: string;
  holdings: { symbol: string; allocation: number; yield: number; type: string }[];
  risk: 'Low' | 'Medium' | 'High';
  icon: React.ReactNode;
}

const PORTFOLIO_SUGGESTIONS: PortfolioSuggestion[] = [
  {
    name: 'Ultra High Yield',
    yield: 11,
    growthRate: -2,
    description: 'Maximum current income with covered call ETFs, BDCs, and mREITs. Higher risk of capital erosion.',
    risk: 'High',
    icon: <DollarSign className="h-5 w-5" />,
    holdings: [
      { symbol: 'QYLD', allocation: 20, yield: 12.0, type: 'Covered Call ETF' },
      { symbol: 'XYLD', allocation: 15, yield: 11.5, type: 'Covered Call ETF' },
      { symbol: 'AGNC', allocation: 15, yield: 14.5, type: 'mREIT' },
      { symbol: 'ARCC', allocation: 15, yield: 9.5, type: 'BDC' },
      { symbol: 'MAIN', allocation: 10, yield: 6.5, type: 'BDC' },
      { symbol: 'HTGC', allocation: 10, yield: 9.0, type: 'BDC' },
      { symbol: 'OXLC', allocation: 10, yield: 18.0, type: 'CLO Fund' },
      { symbol: 'PDI', allocation: 5, yield: 13.0, type: 'Bond CEF' },
    ],
  },
  {
    name: 'High Yield Income',
    yield: 8,
    growthRate: 1,
    description: 'Strong current income with premium income ETFs and REITs. Moderate capital preservation.',
    risk: 'Medium',
    icon: <PiggyBank className="h-5 w-5" />,
    holdings: [
      { symbol: 'JEPI', allocation: 25, yield: 8.0, type: 'Premium Income ETF' },
      { symbol: 'JEPQ', allocation: 20, yield: 9.0, type: 'Premium Income ETF' },
      { symbol: 'O', allocation: 15, yield: 5.6, type: 'REIT - Monthly' },
      { symbol: 'MAIN', allocation: 10, yield: 6.5, type: 'BDC - Monthly' },
      { symbol: 'STAG', allocation: 10, yield: 4.2, type: 'Industrial REIT' },
      { symbol: 'EPD', allocation: 10, yield: 7.5, type: 'MLP - Energy' },
      { symbol: 'SCHD', allocation: 10, yield: 3.5, type: 'Dividend ETF' },
    ],
  },
  {
    name: 'Dividend Aristocrats',
    yield: 3.2,
    growthRate: 8,
    description: 'Blue-chip companies with 25+ years of dividend increases. Stable and reliable.',
    risk: 'Low',
    icon: <Shield className="h-5 w-5" />,
    holdings: [
      { symbol: 'NOBL', allocation: 25, yield: 2.1, type: 'Aristocrats ETF' },
      { symbol: 'JNJ', allocation: 15, yield: 3.0, type: 'Healthcare - 62yr' },
      { symbol: 'PG', allocation: 12, yield: 2.4, type: 'Consumer - 68yr' },
      { symbol: 'KO', allocation: 12, yield: 3.0, type: 'Consumer - 62yr' },
      { symbol: 'MMM', allocation: 10, yield: 5.5, type: 'Industrial - 66yr' },
      { symbol: 'CL', allocation: 8, yield: 2.3, type: 'Consumer - 61yr' },
      { symbol: 'ED', allocation: 8, yield: 3.5, type: 'Utility - 50yr' },
      { symbol: 'PEP', allocation: 10, yield: 2.7, type: 'Consumer - 52yr' },
    ],
  },
  {
    name: 'Balanced Income',
    yield: 5,
    growthRate: 5,
    description: 'Mix of yield and growth with diversified ETFs and quality dividend stocks.',
    risk: 'Medium',
    icon: <TrendingUp className="h-5 w-5" />,
    holdings: [
      { symbol: 'SCHD', allocation: 25, yield: 3.5, type: 'Dividend ETF' },
      { symbol: 'JEPI', allocation: 20, yield: 8.0, type: 'Premium Income' },
      { symbol: 'VYM', allocation: 15, yield: 3.0, type: 'Value ETF' },
      { symbol: 'O', allocation: 10, yield: 5.6, type: 'REIT - Monthly' },
      { symbol: 'ABBV', allocation: 10, yield: 3.8, type: 'Healthcare' },
      { symbol: 'JPM', allocation: 10, yield: 2.5, type: 'Financials' },
      { symbol: 'VZ', allocation: 10, yield: 6.5, type: 'Telecom' },
    ],
  },
  {
    name: 'Dividend Growth',
    yield: 2.8,
    growthRate: 10,
    description: 'Focus on companies with strong dividend growth rates. Lower yield today, higher yield on cost later.',
    risk: 'Low',
    icon: <Sparkles className="h-5 w-5" />,
    holdings: [
      { symbol: 'VIG', allocation: 25, yield: 1.8, type: 'Dividend Growth ETF' },
      { symbol: 'DGRO', allocation: 20, yield: 2.3, type: 'Dividend Growth ETF' },
      { symbol: 'MSFT', allocation: 12, yield: 0.8, type: 'Tech - 20% growth' },
      { symbol: 'AVGO', allocation: 10, yield: 2.0, type: 'Tech - 14% growth' },
      { symbol: 'HD', allocation: 10, yield: 2.5, type: 'Retail - 15% growth' },
      { symbol: 'V', allocation: 8, yield: 0.8, type: 'Fintech - 17% growth' },
      { symbol: 'UNH', allocation: 8, yield: 1.4, type: 'Healthcare - 15% growth' },
      { symbol: 'LMT', allocation: 7, yield: 2.7, type: 'Defense - 10% growth' },
    ],
  },
];

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(142, 76%, 36%)', 'hsl(221, 83%, 53%)'];

export function ReverseDividendCalculator() {
  const [targetIncome, setTargetIncome] = useState(1000);
  const [incomeFrequency, setIncomeFrequency] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(null);
  const [customYield, setCustomYield] = useState(5);

  const annualTargetIncome = incomeFrequency === 'monthly' ? targetIncome * 12 : targetIncome;

  // Calculate required investment for each portfolio
  const portfolioCalculations = useMemo(() => {
    return PORTFOLIO_SUGGESTIONS.map(portfolio => {
      const requiredInvestment = annualTargetIncome / (portfolio.yield / 100);
      const futureIncome5Y = annualTargetIncome * Math.pow(1 + portfolio.growthRate / 100, 5);
      const futureIncome10Y = annualTargetIncome * Math.pow(1 + portfolio.growthRate / 100, 10);
      
      return {
        ...portfolio,
        requiredInvestment: Math.round(requiredInvestment),
        futureIncome5Y: Math.round(futureIncome5Y),
        futureIncome10Y: Math.round(futureIncome10Y),
      };
    });
  }, [annualTargetIncome]);

  // Custom yield calculation
  const customCalculation = useMemo(() => {
    const requiredInvestment = annualTargetIncome / (customYield / 100);
    return {
      yield: customYield,
      requiredInvestment: Math.round(requiredInvestment),
      monthlyIncome: Math.round(annualTargetIncome / 12),
    };
  }, [annualTargetIncome, customYield]);

  // Chart data for yield vs investment
  const yieldInvestmentData = useMemo(() => {
    const data = [];
    for (let y = 2; y <= 12; y += 0.5) {
      data.push({
        yield: y,
        investment: Math.round(annualTargetIncome / (y / 100)),
      });
    }
    return data;
  }, [annualTargetIncome]);

  const selectedPortfolioData = portfolioCalculations.find(p => p.name === selectedPortfolio);

  return (
    <div className="space-y-4">
      {/* Target Income Input */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Reverse Dividend Calculator
          </CardTitle>
          <CardDescription>
            Calculate how much you need to invest to achieve your desired dividend income
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <Label className="text-base font-medium">Target Income</Label>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-2xl">$</span>
                <Input
                  type="number"
                  value={targetIncome}
                  onChange={(e) => setTargetIncome(Number(e.target.value))}
                  className="text-2xl h-14 font-bold"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-base font-medium">Frequency</Label>
              <Tabs 
                value={incomeFrequency} 
                onValueChange={(v) => setIncomeFrequency(v as 'monthly' | 'annual')}
                className="mt-2"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="annual">Annual</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="flex flex-col justify-center">
              <p className="text-sm text-muted-foreground">Annual Target</p>
              <p className="text-3xl font-bold text-primary">
                ${annualTargetIncome.toLocaleString()}
                <span className="text-base font-normal text-muted-foreground">/year</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Yield Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Investment Calculator
          </CardTitle>
          <CardDescription>
            See how much you need based on different yield assumptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <Label>Portfolio Yield</Label>
                  <Badge variant="outline" className="text-lg px-3">
                    {customYield}%
                  </Badge>
                </div>
                <Slider
                  value={[customYield]}
                  onValueChange={(v) => setCustomYield(v[0])}
                  min={1}
                  max={15}
                  step={0.25}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>1%</span>
                  <span>15%</span>
                </div>
              </div>
              
              <div className="p-6 rounded-lg bg-primary/10 border border-primary/20 text-center">
                <p className="text-sm text-muted-foreground mb-1">Required Investment</p>
                <p className="text-4xl font-bold text-primary">
                  ${customCalculation.requiredInvestment.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  to generate ${customCalculation.monthlyIncome.toLocaleString()}/month
                </p>
              </div>
              
              <div className="mt-4 p-4 rounded-lg bg-muted/50 border">
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <p className="text-muted-foreground">At 4% Yield</p>
                    <p className="font-bold">${Math.round(annualTargetIncome / 0.04).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">At 6% Yield</p>
                    <p className="font-bold">${Math.round(annualTargetIncome / 0.06).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">At 10% Yield</p>
                    <p className="font-bold">${Math.round(annualTargetIncome / 0.10).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">Investment Required vs Yield</p>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yieldInvestmentData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="yield" 
                      tickFormatter={(v) => `${v}%`}
                      className="text-xs"
                    />
                    <YAxis 
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      className="text-xs"
                    />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Investment Needed']}
                      labelFormatter={(label) => `${label}% Yield`}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="investment" radius={[4, 4, 0, 0]}>
                      {yieldInvestmentData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.yield === customYield ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground)/0.3)'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            Portfolio Suggestions
          </CardTitle>
          <CardDescription>
            Choose a portfolio strategy based on your preference for income vs growth
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {portfolioCalculations.map((portfolio) => (
              <Card 
                key={portfolio.name}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedPortfolio === portfolio.name 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedPortfolio(portfolio.name)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-primary/10">
                      {portfolio.icon}
                    </div>
                    <Badge 
                      variant={
                        portfolio.risk === 'Low' ? 'default' : 
                        portfolio.risk === 'Medium' ? 'secondary' : 'destructive'
                      }
                    >
                      {portfolio.risk} Risk
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-2">{portfolio.name}</CardTitle>
                  <CardDescription className="text-xs">{portfolio.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Yield:</span>
                      <span className="font-medium text-success">{portfolio.yield}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Growth:</span>
                      <span className="font-medium">{portfolio.growthRate}%/yr</span>
                    </div>
                    <div className="pt-2 border-t mt-2">
                      <p className="text-xs text-muted-foreground">Required Investment</p>
                      <p className="text-xl font-bold text-primary">
                        ${portfolio.requiredInvestment.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selected Portfolio Details */}
          {selectedPortfolioData && (
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {selectedPortfolioData.icon}
                  {selectedPortfolioData.name} Portfolio Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Suggested Holdings</h4>
                    <div className="space-y-2">
                      {selectedPortfolioData.holdings.map((holding, i) => (
                        <div 
                          key={holding.symbol}
                          className="flex items-center justify-between p-3 rounded-lg bg-card border"
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[i % COLORS.length] }}
                            />
                            <div>
                              <p className="font-medium">{holding.symbol}</p>
                              <p className="text-xs text-muted-foreground">{holding.type}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{holding.allocation}%</p>
                            <p className="text-xs text-success">{holding.yield}% yield</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Investment Summary</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-card border text-center">
                        <p className="text-sm text-muted-foreground">Invest Today</p>
                        <p className="text-2xl font-bold text-primary">
                          ${selectedPortfolioData.requiredInvestment.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-success/10 border border-success/20 text-center">
                        <p className="text-sm text-muted-foreground">Monthly Income</p>
                        <p className="text-2xl font-bold text-success">
                          ${Math.round(annualTargetIncome / 12).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <h5 className="font-medium mb-2">Income Growth Projection</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Year 1:</span>
                          <span className="font-medium">${annualTargetIncome.toLocaleString()}/year</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Year 5:</span>
                          <span className="font-medium text-success">
                            ${selectedPortfolioData.futureIncome5Y.toLocaleString()}/year
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Year 10:</span>
                          <span className="font-medium text-success">
                            ${selectedPortfolioData.futureIncome10Y.toLocaleString()}/year
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <h5 className="font-medium mb-2">Dollar Allocation</h5>
                      <div className="space-y-1 text-sm">
                        {selectedPortfolioData.holdings.map(holding => (
                          <div key={holding.symbol} className="flex justify-between">
                            <span>{holding.symbol}:</span>
                            <span className="font-medium">
                              ${Math.round(selectedPortfolioData.requiredInvestment * holding.allocation / 100).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
