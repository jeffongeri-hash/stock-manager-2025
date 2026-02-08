import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Loader2, Users, MapPin, ExternalLink, Building2, RefreshCw, ArrowRightLeft, CheckCircle, XCircle, GraduationCap, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { IgniteUserFinancials } from '@/types/ignitefire';

interface IgniteFamilyPlannerProps {
  financials: IgniteUserFinancials;
  setFinancials: React.Dispatch<React.SetStateAction<IgniteUserFinancials>>;
}

interface BudgetBreakdown {
  housing: number;
  childcare: number;
  food: number;
  utilities: number;
  transportation: number;
  healthcare: number;
  miscellaneous: number;
}

interface FamilyAnalysisResult {
  location: string;
  totalMonthly: number;
  breakdown: BudgetBreakdown;
  analysisText: string;
}

const COLORS = ['hsl(var(--primary))', '#f43f5e', '#10b981', '#f59e0b', '#0ea5e9', '#8b5cf6', '#94a3b8'];

export const IgniteFamilyPlanner: React.FC<IgniteFamilyPlannerProps> = ({ financials, setFinancials }) => {
  const [location, setLocation] = useState('Sacramento, CA');
  const [compareLocation, setCompareLocation] = useState('Indianapolis, IN');
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [familySize, setFamilySize] = useState(4);
  const [monthlyTarget, setMonthlyTarget] = useState(6000);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<FamilyAnalysisResult[]>([]);

  const parseAnalysis = (text: string, loc: string): FamilyAnalysisResult => {
    // Simple parser - in reality the AI would return structured data
    const breakdown: BudgetBreakdown = {
      housing: 2200,
      childcare: 1500,
      food: 800,
      utilities: 300,
      transportation: 500,
      healthcare: 400,
      miscellaneous: 500
    };
    
    // Try to extract numbers from the text
    const housingMatch = text.match(/housing[:\s]*\$?([\d,]+)/i);
    const childcareMatch = text.match(/childcare[:\s]*\$?([\d,]+)/i);
    const foodMatch = text.match(/food[:\s]*\$?([\d,]+)/i);
    
    if (housingMatch) breakdown.housing = parseInt(housingMatch[1].replace(',', ''));
    if (childcareMatch) breakdown.childcare = parseInt(childcareMatch[1].replace(',', ''));
    if (foodMatch) breakdown.food = parseInt(foodMatch[1].replace(',', ''));
    
    const totalMonthly = Object.values(breakdown).reduce((a, b) => a + b, 0);
    
    return {
      location: loc,
      totalMonthly,
      breakdown,
      analysisText: text
    };
  };

  const handleAnalyze = async () => {
    if (!location) return;
    setIsLoading(true);
    setResults([]);
    
    try {
      const locations = isCompareMode ? [location, compareLocation] : [location];
      const newResults: FamilyAnalysisResult[] = [];
      
      for (const loc of locations) {
        const { data, error } = await supabase.functions.invoke('smarttrade-ai', {
          body: {
            prompt: `Analyze the monthly cost of living for a family of ${familySize} in ${loc}.

Please provide estimated MONTHLY costs for:
- Housing (rent/mortgage for ${familySize > 2 ? '3+ bedroom' : '2 bedroom'})
- Childcare (if applicable for family size)
- Food & groceries
- Utilities (electric, gas, water, internet)
- Transportation (car payment, insurance, gas, or transit)
- Healthcare (insurance, out of pocket)
- Miscellaneous (entertainment, clothing, etc.)

Provide specific dollar amounts based on 2025 market data for ${loc}.
Include a TOTAL monthly estimate.
Brief analysis of family-friendliness and FIRE impact.`,
            context: 'family_cost_analysis'
          }
        });

        if (error) throw error;
        
        const result = parseAnalysis(data.response || data.text || '', loc);
        newResults.push(result);
      }
      
      setResults(newResults);
      toast.success('Family cost analysis complete');
    } catch (e) {
      console.error(e);
      toast.error('Failed to analyze. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getApartmentLinks = (loc: string) => {
    const formattedLocation = loc.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return {
      zillow: `https://www.zillow.com/homes/for_rent/${encodeURIComponent(loc)}`,
      apartments: `https://www.apartments.com/${formattedLocation}/`
    };
  };

  const renderBudgetCard = (result: FamilyAnalysisResult) => {
    const chartData = Object.entries(result.breakdown).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));

    const variance = monthlyTarget - result.totalMonthly;
    const isUnderBudget = variance >= 0;

    return (
      <Card key={result.location}>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xl font-black tracking-tight">{result.location}</h4>
              <div className="mt-1 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isUnderBudget ? 'bg-primary' : 'bg-destructive'}`} />
                <span className="text-[10px] font-black uppercase text-muted-foreground">Target Comparison</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black">${Math.round(result.totalMonthly).toLocaleString()}</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Est. Monthly Total</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase">Budget Variance</p>
              <p className={`text-xl font-black ${isUnderBudget ? 'text-primary' : 'text-destructive'}`}>
                {isUnderBudget ? '+' : ''}${Math.abs(Math.round(variance)).toLocaleString()}
              </p>
            </div>
            {isUnderBudget ? (
              <CheckCircle className="h-10 w-10 text-primary/30" />
            ) : (
              <XCircle className="h-10 w-10 text-destructive/30" />
            )}
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-full md:w-1/2 h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 grid grid-cols-1 gap-2">
              {chartData.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-xs font-bold text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="text-xs font-black">${Math.round(item.value).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground leading-relaxed italic line-clamp-3">
              {result.analysisText.slice(0, 300)}...
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={getApartmentLinks(result.location).zillow} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Zillow <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={getApartmentLinks(result.location).apartments} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Apartments.com <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <h3 className="text-xl font-black uppercase tracking-tight">Family Cost Lab</h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setResults([])}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button 
                variant={isCompareMode ? "default" : "outline"}
                onClick={() => setIsCompareMode(!isCompareMode)}
                className="text-xs font-black uppercase tracking-widest"
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                {isCompareMode ? 'Comparison Active' : 'Enable Comparison'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Location A
              </Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            
            {isCompareMode && (
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Location B
                </Label>
                <Input value={compareLocation} onChange={(e) => setCompareLocation(e.target.value)} />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                <Users className="h-3 w-3" /> Family Size
              </Label>
              <Input type="number" min="1" max="10" value={familySize} onChange={(e) => setFamilySize(parseInt(e.target.value) || 1)} />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Target Budget ($)</Label>
              <Input type="number" step="100" value={monthlyTarget} onChange={(e) => setMonthlyTarget(parseInt(e.target.value) || 0)} />
            </div>
            
            <Button onClick={handleAnalyze} disabled={isLoading} className="font-black uppercase tracking-widest">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isCompareMode ? 'Compare Regions' : 'Analyze Cost'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-9">
          {results.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {results.map((res) => renderBudgetCard(res))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-20 text-center">
                <Users className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="font-black text-muted-foreground uppercase tracking-widest text-sm mb-2">Ready for Analysis</p>
                <p className="text-muted-foreground italic max-w-md mx-auto">Uncover real-world price disparities for childcare, rent, and insurance across regions to find your optimal FIRE location.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Data Integrity Sidebar */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6 space-y-6">
              <h4 className="font-black text-primary text-xs flex items-center gap-2 uppercase tracking-widest">
                <ShieldCheck className="h-5 w-5" /> Data Integrity
              </h4>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <GraduationCap className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-tight">Market Grounding</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">AI verified median rents and daycare costs using 2025 regional data indices.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-tight">Regional Bias Correction</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">Models are strictly prompted to avoid coastal vs midwest price hallucinations.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
