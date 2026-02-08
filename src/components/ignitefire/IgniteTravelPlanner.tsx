import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Globe, DollarSign, Clock, Bookmark, 
  MapPin, Search, Plane, Building2, Sparkles, 
  RefreshCw, ExternalLink, Calendar, SlidersHorizontal
} from 'lucide-react';
import { VacationPlan } from '@/types/ignitefire';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

const IgniteTravelPlanner: React.FC = () => {
  const [origin, setOrigin] = useState('Indianapolis');
  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState(2500);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<VacationPlan | null>(null);
  const [savedPlans, setSavedPlans] = useState<VacationPlan[]>([]);
  
  const [isDiscoveryMode, setIsDiscoveryMode] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  
  const travelStyles = [
    'Adventure', 'Relaxing', 'Family Friendly', 'City Life', 
    'Nature', 'Luxury', 'Budget', 'Hidden Gems', 'Culinary Focus'
  ];

  useEffect(() => {
    const saved = localStorage.getItem('ignite_vacation_plans');
    if (saved) {
      try {
        setSavedPlans(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved vacation plans");
      }
    }
  }, []);

  const toggleStyle = (style: string) => {
    setSelectedStyles(prev => 
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    );
  };

  const handlePlan = async () => {
    if (!destination && !isDiscoveryMode) {
      toast.error('Please enter a destination');
      return;
    }
    
    setLoading(true);
    try {
      const targetDest = isDiscoveryMode ? 'AI Budget Discovery' : destination;
      
      const { data, error } = await supabase.functions.invoke('ignite-vacation-planner', {
        body: { 
          origin, 
          destination: targetDest, 
          budget, 
          startDate: isDiscoveryMode ? 'flexible' : startDate, 
          endDate: isDiscoveryMode ? 'flexible' : endDate, 
          styles: selectedStyles 
        }
      });
      
      if (error) throw error;
      
      const newPlan: VacationPlan = {
        origin,
        destination: targetDest,
        budget,
        startDate: isDiscoveryMode ? 'Optimal AI Window' : startDate,
        endDate: isDiscoveryMode ? 'Optimal AI Window' : endDate,
        text: data.text || data.plan || 'No plan generated',
        sources: data.sources || [],
        timestamp: Date.now()
      };
      
      setCurrentPlan(newPlan);
      toast.success('Trip plan generated!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate trip plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = () => {
    if (!currentPlan) return;
    const updated = [currentPlan, ...savedPlans].slice(0, 10);
    setSavedPlans(updated);
    localStorage.setItem('ignite_vacation_plans', JSON.stringify(updated));
    toast.success('Plan saved!');
  };

  const getSkyscannerUrl = () => {
    if (!currentPlan) return '';
    const originSlug = currentPlan.origin.toLowerCase().replace(/\s+/g, '-');
    const destSlug = currentPlan.destination.toLowerCase().replace(/\s+/g, '-');
    return `https://www.skyscanner.com/transport/flights/${originSlug}/${destSlug}/${currentPlan.startDate !== 'Optimal AI Window' ? currentPlan.startDate : ''}`;
  };

  const getBookingUrl = () => {
    if (!currentPlan) return '';
    return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(currentPlan.destination)}`;
  };

  const getAirbnbUrl = () => {
    if (!currentPlan) return '';
    return `https://www.airbnb.com/s/${encodeURIComponent(currentPlan.destination)}/homes`;
  };

  const getTripadvisorUrl = () => {
    if (!currentPlan) return '';
    return `https://www.tripadvisor.com/Search?q=${encodeURIComponent(currentPlan.destination)}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Globe className="h-6 w-6 text-primary" /> Travel Lab: Value Optimizer
              </CardTitle>
              <p className="text-sm text-muted-foreground font-medium mt-1">
                Define your budget and find the most efficient journey with AI.
              </p>
            </div>
            <div className="flex bg-muted p-1 rounded-lg">
              <Button 
                variant={!isDiscoveryMode ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setIsDiscoveryMode(false)}
                className="text-xs font-semibold"
              >
                City Search
              </Button>
              <Button 
                variant={isDiscoveryMode ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setIsDiscoveryMode(true)}
                className="text-xs font-semibold"
              >
                Discovery Mode
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Origin Hub</Label>
              <div className="relative">
                <MapPin className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  value={origin} 
                  onChange={(e) => setOrigin(e.target.value)} 
                  className="pl-9"
                  placeholder="Origin City" 
                />
              </div>
            </div>
            
            {!isDiscoveryMode ? (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Destination City</Label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    value={destination} 
                    onChange={(e) => setDestination(e.target.value)} 
                    className="pl-9"
                    placeholder="e.g. Paris, Tokyo, Rome" 
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Timeline</Label>
                <div className="px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-md text-xs font-bold text-primary flex items-center gap-2">
                  <Clock className="h-4 w-4" /> AI Chooses Best Window
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Total Budget ($)</Label>
              <div className="relative">
                <DollarSign className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                <Input 
                  type="number" 
                  value={budget} 
                  onChange={(e) => setBudget(Math.max(0, parseFloat(e.target.value) || 0))} 
                  className="pl-9 font-bold text-primary"
                />
              </div>
            </div>

            {!isDiscoveryMode && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Trip Window</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                    className="flex-1 text-xs"
                  />
                  <Input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                    className="flex-1 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" /> Trip Personalization
            </Label>
            <div className="flex flex-wrap gap-2">
              {travelStyles.map(style => (
                <Badge
                  key={style}
                  variant={selectedStyles.includes(style) ? "default" : "outline"}
                  className="cursor-pointer transition-all hover:scale-105"
                  onClick={() => toggleStyle(style)}
                >
                  {style}
                </Badge>
              ))}
            </div>
          </div>

          <Button 
            onClick={handlePlan} 
            disabled={loading}
            className="w-full py-6 font-bold text-base"
            size="lg"
          >
            {loading ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Analyzing Travel Data...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Generate AI Trip Plan
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {currentPlan && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-in slide-in-from-top-4">
          <a 
            href={getSkyscannerUrl()} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-3 hover:bg-primary/20 transition-all group"
          >
            <div className="p-2 bg-primary rounded-lg text-primary-foreground">
              <Plane className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold">Skyscanner</p>
              <p className="text-[10px] text-muted-foreground font-semibold">Flights</p>
            </div>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>
          
          <a 
            href={getBookingUrl()} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-4 bg-secondary/50 border border-border rounded-xl flex items-center gap-3 hover:bg-secondary transition-all group"
          >
            <div className="p-2 bg-secondary-foreground/10 rounded-lg">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold">Booking.com</p>
              <p className="text-[10px] text-muted-foreground font-semibold">Hotels</p>
            </div>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>

          <a 
            href={getAirbnbUrl()} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-4 bg-accent/50 border border-border rounded-xl flex items-center gap-3 hover:bg-accent transition-all group"
          >
            <div className="p-2 bg-accent-foreground/10 rounded-lg">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold">Airbnb</p>
              <p className="text-[10px] text-muted-foreground font-semibold">Rentals</p>
            </div>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>

          <a 
            href={getTripadvisorUrl()} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-4 bg-muted border border-border rounded-xl flex items-center gap-3 hover:bg-muted/80 transition-all group"
          >
            <div className="p-2 bg-primary/20 rounded-lg">
              <Globe className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold">TripAdvisor</p>
              <p className="text-[10px] text-muted-foreground font-semibold">Reviews</p>
            </div>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>
        </div>
      )}

      {currentPlan && (
        <Card className="animate-in slide-in-from-bottom-4">
          <CardHeader className="border-b">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl capitalize">
                  {currentPlan.destination}
                </CardTitle>
                <p className="text-muted-foreground text-sm font-medium mt-1">
                  Budget: ${currentPlan.budget.toLocaleString()} • {currentPlan.startDate} to {currentPlan.endDate}
                </p>
              </div>
              <Button onClick={handleSavePlan} variant="secondary" size="sm">
                <Bookmark className="h-4 w-4 mr-2" />
                Save Plan
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/50 p-6 rounded-xl">
              <ReactMarkdown>{currentPlan.text}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {savedPlans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bookmark className="h-5 w-5" /> Saved Trip Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {savedPlans.map((plan, idx) => (
                <div 
                  key={idx}
                  className="p-4 bg-muted/50 rounded-lg flex items-center justify-between cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => setCurrentPlan(plan)}
                >
                  <div>
                    <p className="font-semibold capitalize">{plan.destination}</p>
                    <p className="text-xs text-muted-foreground">
                      ${plan.budget.toLocaleString()} • {new Date(plan.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline">{plan.startDate}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IgniteTravelPlanner;
