import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Baby, GraduationCap, Heart, ExternalLink, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { IgniteUserFinancials } from '@/types/ignitefire';

interface IgniteFamilyPlannerProps {
  financials: IgniteUserFinancials;
  setFinancials: React.Dispatch<React.SetStateAction<IgniteUserFinancials>>;
}

export const IgniteFamilyPlanner: React.FC<IgniteFamilyPlannerProps> = ({ financials, setFinancials }) => {
  const [numberOfChildren, setNumberOfChildren] = useState('1');
  const [childcareType, setChildcareType] = useState('daycare');
  const [location, setLocation] = useState(financials.zipCode || '');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!location.trim()) {
      toast.error('Please enter a location');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('smarttrade-ai', {
        body: {
          prompt: `Analyze the cost of raising ${numberOfChildren} child(ren) in ${location} with ${childcareType} childcare. Include:
1. Annual childcare costs by age group (infant, toddler, preschool, school-age)
2. Healthcare costs (insurance, out-of-pocket)
3. Food and clothing estimates
4. Education costs (K-12 and college savings recommendations)
5. Housing adjustment needs (larger home, bedroom requirements)
6. Activities and enrichment costs
7. Total annual and 18-year cost projection
8. Impact on FIRE timeline (with current income of $${financials.grossAnnualIncome}/year)
9. Recommended adjustments to savings rate

Be specific with dollar amounts and provide a monthly budget breakdown.`,
          context: 'family_cost_analysis'
        }
      });

      if (error) throw error;

      setAnalysis(data.response || data.text || 'Analysis completed');
      toast.success('Family cost analysis complete');
    } catch (error) {
      console.error('Error analyzing family costs:', error);
      toast.error('Failed to analyze. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getApartmentLinks = (loc: string) => {
    const encodedLocation = encodeURIComponent(loc);
    const formattedLocation = loc.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return {
      zillow: `https://www.zillow.com/homes/for_rent/${encodedLocation}`,
      apartments: `https://www.apartments.com/${formattedLocation}/`
    };
  };

  // Quick cost estimates
  const estimatedMonthlyCosts = {
    infant: { daycare: 1500, nanny: 2500, au_pair: 2000 },
    toddler: { daycare: 1300, nanny: 2400, au_pair: 2000 },
    preschool: { daycare: 1100, nanny: 2200, au_pair: 2000 }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Family Cost Planner
          </CardTitle>
          <CardDescription>
            Estimate the cost of raising children and impact on your FIRE journey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Number of Children</Label>
              <Select value={numberOfChildren} onValueChange={setNumberOfChildren}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Child</SelectItem>
                  <SelectItem value="2">2 Children</SelectItem>
                  <SelectItem value="3">3 Children</SelectItem>
                  <SelectItem value="4">4+ Children</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Childcare Type</Label>
              <Select value={childcareType} onValueChange={setChildcareType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daycare">Daycare Center</SelectItem>
                  <SelectItem value="nanny">Full-time Nanny</SelectItem>
                  <SelectItem value="au_pair">Au Pair</SelectItem>
                  <SelectItem value="family">Family Care</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location (City or ZIP)</Label>
              <Input 
                placeholder="e.g., San Francisco, CA or 94102"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleAnalyze} disabled={isLoading} className="w-full md:w-auto">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Baby className="mr-2 h-4 w-4" />
                Analyze Family Costs
              </>
            )}
          </Button>

          {location && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Find family-friendly housing in {location}:</p>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href={getApartmentLinks(location).zillow} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Building2 className="h-4 w-4" />
                    Zillow
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href={getApartmentLinks(location).apartments} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Building2 className="h-4 w-4" />
                    Apartments.com
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Cost Estimates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Quick Cost Estimates
          </CardTitle>
          <CardDescription>Average monthly childcare costs by age and type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Baby className="h-5 w-5 text-primary" />
                <span className="font-semibold">Infant (0-1)</span>
              </div>
              <div className="space-y-1 text-sm">
                <p>Daycare: ${estimatedMonthlyCosts.infant.daycare}/mo</p>
                <p>Nanny: ${estimatedMonthlyCosts.infant.nanny}/mo</p>
                <p>Au Pair: ${estimatedMonthlyCosts.infant.au_pair}/mo</p>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-semibold">Toddler (1-3)</span>
              </div>
              <div className="space-y-1 text-sm">
                <p>Daycare: ${estimatedMonthlyCosts.toddler.daycare}/mo</p>
                <p>Nanny: ${estimatedMonthlyCosts.toddler.nanny}/mo</p>
                <p>Au Pair: ${estimatedMonthlyCosts.toddler.au_pair}/mo</p>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <span className="font-semibold">Preschool (3-5)</span>
              </div>
              <div className="space-y-1 text-sm">
                <p>Daycare: ${estimatedMonthlyCosts.preschool.daycare}/mo</p>
                <p>Nanny: ${estimatedMonthlyCosts.preschool.nanny}/mo</p>
                <p>Au Pair: ${estimatedMonthlyCosts.preschool.au_pair}/mo</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Family Cost Analysis</CardTitle>
              <Badge variant="outline">{numberOfChildren} child(ren) • {childcareType}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-sm">{analysis}</div>
            </div>
            
            {location && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Browse family-friendly housing:</p>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href={getApartmentLinks(location).zillow} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <Building2 className="h-4 w-4" />
                      Zillow
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href={getApartmentLinks(location).apartments} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <Building2 className="h-4 w-4" />
                      Apartments.com
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
