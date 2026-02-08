import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Search, ExternalLink, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LocationResult {
  location: string;
  jobTitle: string;
  analysis: string;
  timestamp: number;
}

export const IgniteLocationScanner: React.FC = () => {
  const [location, setLocation] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<LocationResult[]>([]);

  const handleScan = async () => {
    if (!location.trim() || !jobTitle.trim()) {
      toast.error('Please enter both location and job title');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('smarttrade-ai', {
        body: {
          prompt: `Analyze the cost of living and job market for a ${jobTitle} in ${location}. Include:
1. Estimated salary range for this role
2. Average rent/housing costs
3. Cost of living breakdown (food, transportation, utilities)
4. Quality of life factors
5. Job market outlook
6. FIRE considerations (how this location affects path to financial independence)

Be specific with dollar amounts and percentages.`,
          context: 'location_analysis'
        }
      });

      if (error) throw error;

      const newResult: LocationResult = {
        location,
        jobTitle,
        analysis: data.response || data.text || 'Analysis completed',
        timestamp: Date.now()
      };

      setResults(prev => [newResult, ...prev.slice(0, 4)]);
      toast.success('Location analysis complete');
    } catch (error) {
      console.error('Error scanning location:', error);
      toast.error('Failed to analyze location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getApartmentLinks = (loc: string) => {
    const encodedLocation = encodeURIComponent(loc);
    return {
      zillow: `https://www.zillow.com/homes/for_rent/${encodedLocation}`,
      apartments: `https://www.apartments.com/${loc.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/`
    };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Geo-Scanner
          </CardTitle>
          <CardDescription>
            Analyze cost of living and job market for any location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Location (City, State)</Label>
              <Input 
                placeholder="e.g., Austin, TX"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Job Title</Label>
              <Input 
                placeholder="e.g., Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
          </div>
          
          <Button onClick={handleScan} disabled={isLoading} className="w-full md:w-auto">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Scan Location
              </>
            )}
          </Button>

          {location && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Find apartments in {location}:</p>
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

      {/* Results */}
      {results.map((result, index) => (
        <Card key={result.timestamp}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {result.jobTitle} in {result.location}
              </CardTitle>
              <Badge variant="outline">
                {new Date(result.timestamp).toLocaleDateString()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-sm">{result.analysis}</div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Browse housing options:</p>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href={getApartmentLinks(result.location).zillow} 
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
                    href={getApartmentLinks(result.location).apartments} 
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
          </CardContent>
        </Card>
      ))}

      {results.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Enter a location and job title to analyze</p>
            <p className="text-sm text-muted-foreground mt-1">
              Get salary estimates, cost of living, and FIRE insights
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
