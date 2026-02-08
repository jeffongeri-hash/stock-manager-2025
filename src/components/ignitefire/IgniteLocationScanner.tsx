import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Loader2, MapPin, Search, ExternalLink, Building2, Clock, Trash2, Zap, Globe, Scale } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { IgniteUserFinancials, LocationCostData } from '@/types/ignitefire';

export const IgniteLocationScanner: React.FC = () => {
  const [location, setLocation] = useState('Austin, TX');
  const [job, setJob] = useState('Software Engineer');
  const [familySize, setFamilySize] = useState(2);
  const [hasPets, setHasPets] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentData, setCurrentData] = useState<LocationCostData | null>(null);
  const [history, setHistory] = useState<LocationCostData[]>([]);

  const [targetSalary, setTargetSalary] = useState(120000);
  const [targetSpending, setTargetSpending] = useState(55000);
  const [targetTaxRate, setTargetTaxRate] = useState(22);

  const [financials, setFinancials] = useState<IgniteUserFinancials | null>(null);

  useEffect(() => {
    const savedFin = localStorage.getItem('ignite_fire_data');
    if (savedFin) setFinancials(JSON.parse(savedFin));

    const saved = localStorage.getItem('ignite_geo_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load geo history");
      }
    }
  }, []);

  const handleScan = async () => {
    if (!location.trim() || !job.trim()) {
      toast.error('Please enter both location and job title');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('smarttrade-ai', {
        body: {
          prompt: `Analyze cost of living and salary for a ${job} in ${location} with family size of ${familySize}${hasPets ? ' with pets' : ''}.

Please provide in MARKDOWN TABLE FORMAT:
1. Estimated salary range for this role (entry, mid, senior)
2. Housing costs breakdown (1BR, 2BR, 3BR apartments/homes)
3. Monthly cost breakdown table with: Rent, Utilities, Food, Transportation, Healthcare, Childcare (if applicable), Miscellaneous
4. Total estimated monthly and annual costs
5. Quality of life factors
6. FIRE impact analysis (savings potential, years to FIRE at different saving rates)

Use real 2025 market data and include specific dollar amounts.`,
          context: 'location_analysis'
        }
      });

      if (error) throw error;

      const newData: LocationCostData = {
        location,
        jobTitle: job,
        text: data.response || data.text || 'Analysis completed',
        sources: [],
        timestamp: Date.now()
      };

      setCurrentData(newData);
      const newHistory = [newData, ...history].slice(0, 10);
      setHistory(newHistory);
      localStorage.setItem('ignite_geo_history', JSON.stringify(newHistory));
      toast.success('Location analysis complete');
    } catch (error) {
      console.error('Error scanning location:', error);
      toast.error('Failed to analyze location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const deltaAnalysis = useMemo(() => {
    if (!financials) return null;
    
    const currentTax = financials.grossAnnualIncome * (financials.taxRate / 100);
    const currentNetIncome = financials.grossAnnualIncome - currentTax;
    const currentSavings = currentNetIncome - financials.annualSpending;

    const targetTax = targetSalary * (targetTaxRate / 100);
    const targetNetIncome = targetSalary - targetTax;
    const targetSavings = targetNetIncome - targetSpending;

    const monthlySavingsDiff = (targetSavings - currentSavings) / 12;
    const fireTarget = financials.annualSpending * 25;
    const currentVelocityYears = currentSavings > 0 ? (fireTarget - financials.currentNetWorth) / currentSavings : 99;
    const targetVelocityYears = targetSavings > 0 ? (fireTarget - financials.currentNetWorth) / targetSavings : 99;
    
    const yearsSaved = Math.max(0, currentVelocityYears - targetVelocityYears);

    return {
      currentNetIncome,
      targetNetIncome,
      currentSavings,
      targetSavings,
      incomeDelta: targetSalary - financials.grossAnnualIncome,
      spendingDelta: targetSpending - financials.annualSpending,
      taxDelta: targetTax - currentTax,
      netMonthlyDelta: monthlySavingsDiff,
      yearsSaved: Math.round(yearsSaved * 10) / 10,
      isPositive: monthlySavingsDiff > 0
    };
  }, [financials, targetSalary, targetSpending, targetTaxRate]);

  const getApartmentLinks = (loc: string) => {
    const encodedLocation = encodeURIComponent(loc);
    const formattedLocation = loc.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return {
      zillow: `https://www.zillow.com/homes/for_rent/${encodedLocation}`,
      apartments: `https://www.apartments.com/${formattedLocation}/`
    };
  };

  const renderTextContent = (rawText: string) => {
    const lines = rawText.split('\n');
    const elements: React.ReactNode[] = [];
    let currentTable: string[][] = [];
    let isInsideTable = false;

    lines.forEach((line, idx) => {
      const isTableLine = line.trim().startsWith('|');

      if (isTableLine) {
        if (!isInsideTable) {
          isInsideTable = true;
          currentTable = [];
        }
        const cells = line.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
        const isSeparator = cells.every(c => c.match(/^-+$/));
        if (!isSeparator) {
          currentTable.push(cells);
        }
      } else {
        if (isInsideTable && currentTable.length > 0) {
          elements.push(renderTable(currentTable, `table-${idx}`));
          isInsideTable = false;
          currentTable = [];
        }
        if (line.trim()) {
          if (line.startsWith('##')) {
            elements.push(<h3 key={`h-${idx}`} className="text-lg font-black mt-6 mb-2">{line.replace(/^#+\s*/, '')}</h3>);
          } else if (line.startsWith('#')) {
            elements.push(<h2 key={`h-${idx}`} className="text-xl font-black mt-6 mb-2">{line.replace(/^#+\s*/, '')}</h2>);
          } else {
            elements.push(<p key={`p-${idx}`} className="mb-3 text-muted-foreground leading-relaxed">{line}</p>);
          }
        }
      }
    });

    if (isInsideTable && currentTable.length > 0) {
      elements.push(renderTable(currentTable, `table-last`));
    }

    return elements;
  };

  const renderTable = (rows: string[][], key: string) => {
    if (rows.length === 0) return null;
    const [header, ...body] = rows;

    return (
      <div key={key} className="my-6 overflow-hidden rounded-xl border">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted">
              {header.map((cell, i) => (
                <th key={i} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {body.map((row, i) => (
              <tr key={i} className="hover:bg-muted/50 transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className={`px-4 py-3 text-sm font-medium ${cell.toLowerCase().includes('total') ? 'text-primary font-black' : ''}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Relocation Destination</Label>
              <div className="relative">
                <MapPin className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="e.g. Austin, TX"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Target Market Role</Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="e.g. Software Engineer"
                  value={job}
                  onChange={(e) => setJob(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-24 space-y-2">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Family</Label>
              <Input 
                type="number"
                min="1"
                max="10"
                value={familySize}
                onChange={(e) => setFamilySize(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="pets"
                checked={hasPets}
                onCheckedChange={(checked) => setHasPets(checked === true)}
              />
              <Label htmlFor="pets" className="text-xs">Pets</Label>
            </div>
            <Button onClick={handleScan} disabled={isLoading} className="font-black uppercase tracking-widest">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Start Geo-Scan
            </Button>
          </div>

          {location && (
            <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={getApartmentLinks(location).zillow} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Zillow <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={getApartmentLinks(location).apartments} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Apartments.com <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* Arbitrage Lab */}
          {currentData && deltaAnalysis && (
            <Card className="bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black uppercase text-primary tracking-widest flex items-center gap-2">
                    <Zap className="h-5 w-5" /> Comparative Arbitrage Lab
                  </h3>
                  <Badge variant={deltaAnalysis.isPositive ? "default" : "destructive"}>
                    {deltaAnalysis.isPositive ? 'Shaving' : 'Adding'} {Math.abs(deltaAnalysis.yearsSaved)} Years {deltaAnalysis.isPositive ? 'Off' : 'To'} FIRE
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-black uppercase text-muted-foreground">
                        <span>Target Annual Salary</span>
                        <span>${targetSalary.toLocaleString()}</span>
                      </div>
                      <Slider 
                        value={[targetSalary]} 
                        onValueChange={(v) => setTargetSalary(v[0])} 
                        min={30000} 
                        max={500000} 
                        step={5000} 
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-black uppercase text-muted-foreground">
                        <span>Target Total Spend</span>
                        <span>${targetSpending.toLocaleString()}</span>
                      </div>
                      <Slider 
                        value={[targetSpending]} 
                        onValueChange={(v) => setTargetSpending(v[0])} 
                        min={10000} 
                        max={250000} 
                        step={1000} 
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-black uppercase text-muted-foreground">
                        <span>Est. Effective Tax Rate</span>
                        <span>{targetTaxRate}%</span>
                      </div>
                      <Slider 
                        value={[targetTaxRate]} 
                        onValueChange={(v) => setTargetTaxRate(v[0])} 
                        min={0} 
                        max={50} 
                        step={1} 
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center text-center p-6 bg-muted rounded-xl">
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">Net Savings Velocity Shift</p>
                    <p className={`text-4xl font-black tracking-tighter ${deltaAnalysis.isPositive ? 'text-primary' : 'text-destructive'}`}>
                      {deltaAnalysis.isPositive ? '+' : ''}${Math.round(deltaAnalysis.netMonthlyDelta).toLocaleString()}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase">Extra Capital Reinvested Monthly</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 bg-muted rounded-xl">
                    <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Income Delta</p>
                    <p className={`text-lg font-black ${deltaAnalysis.incomeDelta >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {deltaAnalysis.incomeDelta >= 0 ? '+' : ''}${Math.round(deltaAnalysis.incomeDelta/1000)}k/yr
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-xl">
                    <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Tax Delta</p>
                    <p className={`text-lg font-black ${deltaAnalysis.taxDelta <= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {deltaAnalysis.taxDelta > 0 ? '+' : ''}${Math.round(deltaAnalysis.taxDelta/1000)}k/yr
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-xl">
                    <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Cost Delta</p>
                    <p className={`text-lg font-black ${deltaAnalysis.spendingDelta <= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {deltaAnalysis.spendingDelta > 0 ? '+' : ''}${Math.round(deltaAnalysis.spendingDelta/1000)}k/yr
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {currentData ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="uppercase tracking-tight">Geo-Scan: {currentData.location}</CardTitle>
                    <CardDescription className="uppercase tracking-widest text-xs">{currentData.jobTitle} Market Report</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" asChild>
                      <a href={getApartmentLinks(currentData.location).zillow} target="_blank"><Building2 className="h-4 w-4" /></a>
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <a href={getApartmentLinks(currentData.location).apartments} target="_blank"><Building2 className="h-4 w-4" /></a>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {renderTextContent(currentData.text)}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-20 text-center">
                <Globe className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground italic">Initiate a Geo-Scan to uncover localized tax, salary, and lifestyle deltas for your FIRE trajectory.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* History Sidebar */}
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Clock className="h-4 w-4" /> Search History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {history.map((item, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setCurrentData(item)}
                    className={`w-full text-left p-4 rounded-xl transition-all border flex flex-col gap-1 ${
                      currentData?.timestamp === item.timestamp 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted hover:bg-accent'
                    }`}
                  >
                    <p className="font-black text-sm uppercase tracking-tight">{item.location}</p>
                    <p className={`text-[10px] font-bold uppercase ${currentData?.timestamp === item.timestamp ? 'opacity-70' : 'text-muted-foreground'}`}>{item.jobTitle}</p>
                  </button>
                ))}
                {history.length === 0 && <p className="text-xs text-muted-foreground italic text-center py-10">No recent scans.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
