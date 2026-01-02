import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, TrendingUp, Building2, Landmark, AlertTriangle, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { format, addDays, startOfWeek, addWeeks, isSameDay } from "date-fns";

interface EconomicEvent {
  id: string;
  date: Date;
  time: string;
  title: string;
  type: "earnings" | "fed" | "economic";
  impact: "high" | "medium" | "low";
  previous?: string;
  forecast?: string;
  actual?: string;
  symbol?: string;
}

const generateMockEvents = (): EconomicEvent[] => {
  const today = new Date();
  return [
    // Earnings
    { id: "1", date: addDays(today, 1), time: "Before Open", title: "Apple Inc. Earnings", type: "earnings", impact: "high", symbol: "AAPL", previous: "$1.52", forecast: "$1.58" },
    { id: "2", date: addDays(today, 1), time: "After Close", title: "Microsoft Earnings", type: "earnings", impact: "high", symbol: "MSFT", previous: "$2.35", forecast: "$2.42" },
    { id: "3", date: addDays(today, 2), time: "Before Open", title: "Amazon Earnings", type: "earnings", impact: "high", symbol: "AMZN", previous: "$0.98", forecast: "$1.12" },
    { id: "4", date: addDays(today, 3), time: "After Close", title: "Tesla Earnings", type: "earnings", impact: "high", symbol: "TSLA", previous: "$0.85", forecast: "$0.79" },
    { id: "5", date: addDays(today, 5), time: "Before Open", title: "NVIDIA Earnings", type: "earnings", impact: "high", symbol: "NVDA", previous: "$4.02", forecast: "$4.85" },
    { id: "6", date: addDays(today, 7), time: "After Close", title: "Meta Platforms Earnings", type: "earnings", impact: "high", symbol: "META", previous: "$4.71", forecast: "$4.95" },
    
    // Fed Events
    { id: "7", date: addDays(today, 4), time: "2:00 PM ET", title: "FOMC Meeting Minutes", type: "fed", impact: "high" },
    { id: "8", date: addDays(today, 8), time: "10:00 AM ET", title: "Fed Chair Powell Speech", type: "fed", impact: "high" },
    { id: "9", date: addDays(today, 12), time: "2:00 PM ET", title: "FOMC Interest Rate Decision", type: "fed", impact: "high", previous: "5.25%", forecast: "5.25%" },
    { id: "10", date: addDays(today, 18), time: "9:30 AM ET", title: "Fed Vice Chair Remarks", type: "fed", impact: "medium" },
    
    // Economic Events
    { id: "11", date: today, time: "8:30 AM ET", title: "Non-Farm Payrolls", type: "economic", impact: "high", previous: "216K", forecast: "185K", actual: "199K" },
    { id: "12", date: addDays(today, 2), time: "8:30 AM ET", title: "Consumer Price Index (CPI)", type: "economic", impact: "high", previous: "3.4%", forecast: "3.2%" },
    { id: "13", date: addDays(today, 3), time: "8:30 AM ET", title: "Producer Price Index (PPI)", type: "economic", impact: "medium", previous: "0.3%", forecast: "0.2%" },
    { id: "14", date: addDays(today, 5), time: "10:00 AM ET", title: "Consumer Confidence", type: "economic", impact: "medium", previous: "102.5", forecast: "104.0" },
    { id: "15", date: addDays(today, 6), time: "8:30 AM ET", title: "Retail Sales", type: "economic", impact: "high", previous: "0.6%", forecast: "0.4%" },
    { id: "16", date: addDays(today, 9), time: "8:30 AM ET", title: "Initial Jobless Claims", type: "economic", impact: "medium", previous: "218K", forecast: "215K" },
    { id: "17", date: addDays(today, 10), time: "10:00 AM ET", title: "Existing Home Sales", type: "economic", impact: "low", previous: "4.15M", forecast: "4.20M" },
    { id: "18", date: addDays(today, 11), time: "8:30 AM ET", title: "GDP Growth Rate", type: "economic", impact: "high", previous: "4.9%", forecast: "3.2%" },
  ];
};

const EconomicCalendar = () => {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [filter, setFilter] = useState<"all" | "earnings" | "fed" | "economic">("all");
  const [impactFilter, setImpactFilter] = useState<"all" | "high" | "medium" | "low">("all");
  
  const events = generateMockEvents();
  
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
  
  const filteredEvents = events.filter(event => {
    if (filter !== "all" && event.type !== filter) return false;
    if (impactFilter !== "all" && event.impact !== impactFilter) return false;
    return true;
  });

  const getEventsForDay = (day: Date) => {
    return filteredEvents.filter(event => isSameDay(event.date, day));
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "bg-destructive/20 text-destructive border-destructive/30";
      case "medium": return "bg-warning/20 text-warning border-warning/30";
      case "low": return "bg-muted text-muted-foreground border-border";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "earnings": return <TrendingUp className="h-3.5 w-3.5" />;
      case "fed": return <Landmark className="h-3.5 w-3.5" />;
      case "economic": return <Building2 className="h-3.5 w-3.5" />;
      default: return <Calendar className="h-3.5 w-3.5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "earnings": return "bg-chart-1/20 text-chart-1 border-chart-1/30";
      case "fed": return "bg-chart-2/20 text-chart-2 border-chart-2/30";
      case "economic": return "bg-chart-3/20 text-chart-3 border-chart-3/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const upcomingHighImpact = filteredEvents
    .filter(e => e.impact === "high" && e.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  return (
    <PageLayout title="Economic Calendar">
      <div className="space-y-6 animate-fade-in">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-chart-1/20">
                  <TrendingUp className="h-5 w-5 text-chart-1" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Earnings This Week</p>
                  <p className="text-xl font-bold text-foreground">
                    {events.filter(e => e.type === "earnings" && weekDays.some(d => isSameDay(d, e.date))).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-chart-2/20">
                  <Landmark className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fed Events</p>
                  <p className="text-xl font-bold text-foreground">
                    {events.filter(e => e.type === "fed" && weekDays.some(d => isSameDay(d, e.date))).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-chart-3/20">
                  <Building2 className="h-5 w-5 text-chart-3" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Economic Reports</p>
                  <p className="text-xl font-bold text-foreground">
                    {events.filter(e => e.type === "economic" && weekDays.some(d => isSameDay(d, e.date))).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-destructive/20">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">High Impact Events</p>
                  <p className="text-xl font-bold text-foreground">
                    {events.filter(e => e.impact === "high" && weekDays.some(d => isSameDay(d, e.date))).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setCurrentWeek(addWeeks(currentWeek, -1))}
              className="border-border/50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-foreground min-w-[200px] text-center">
              {format(currentWeek, "MMM d")} - {format(addDays(currentWeek, 6), "MMM d, yyyy")}
            </span>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
              className="border-border/50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              className="text-muted-foreground hover:text-foreground"
            >
              Today
            </Button>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList className="bg-muted/50">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="earnings" className="text-xs">Earnings</TabsTrigger>
                <TabsTrigger value="fed" className="text-xs">Fed</TabsTrigger>
                <TabsTrigger value="economic" className="text-xs">Economic</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs value={impactFilter} onValueChange={(v) => setImpactFilter(v as typeof impactFilter)}>
              <TabsList className="bg-muted/50">
                <TabsTrigger value="all" className="text-xs">All Impact</TabsTrigger>
                <TabsTrigger value="high" className="text-xs">High</TabsTrigger>
                <TabsTrigger value="medium" className="text-xs">Medium</TabsTrigger>
                <TabsTrigger value="low" className="text-xs">Low</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-3">
            <Card className="glass-card border-border/50 overflow-hidden">
              <div className="grid grid-cols-7 border-b border-border/50">
                {weekDays.map((day, i) => (
                  <div 
                    key={i} 
                    className={`p-3 text-center border-r border-border/30 last:border-r-0 ${
                      isSameDay(day, new Date()) ? "bg-primary/10" : ""
                    }`}
                  >
                    <p className="text-xs text-muted-foreground">{format(day, "EEE")}</p>
                    <p className={`text-lg font-semibold ${
                      isSameDay(day, new Date()) ? "text-primary" : "text-foreground"
                    }`}>
                      {format(day, "d")}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 min-h-[400px]">
                {weekDays.map((day, i) => {
                  const dayEvents = getEventsForDay(day);
                  return (
                    <div 
                      key={i} 
                      className={`p-2 border-r border-border/30 last:border-r-0 ${
                        isSameDay(day, new Date()) ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="space-y-1.5">
                        {dayEvents.map(event => (
                          <div 
                            key={event.id}
                            className={`p-2 rounded-lg border text-xs cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md ${getTypeColor(event.type)}`}
                          >
                            <div className="flex items-center gap-1 mb-1">
                              {getTypeIcon(event.type)}
                              <Badge variant="outline" className={`text-[10px] px-1 py-0 ${getImpactColor(event.impact)}`}>
                                {event.impact}
                              </Badge>
                            </div>
                            <p className="font-medium truncate">{event.symbol || event.title}</p>
                            <p className="text-[10px] opacity-75">{event.time}</p>
                          </div>
                        ))}
                        {dayEvents.length === 0 && (
                          <p className="text-[10px] text-muted-foreground text-center py-4">No events</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Upcoming High Impact */}
          <div className="lg:col-span-1">
            <Card className="glass-card border-border/50 sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  High Impact Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingHighImpact.map(event => (
                  <div 
                    key={event.id}
                    className={`p-3 rounded-xl border transition-all hover:shadow-md ${getTypeColor(event.type)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        {getTypeIcon(event.type)}
                        <span className="text-xs font-medium">{event.symbol || event.type}</span>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${getImpactColor(event.impact)}`}>
                        {event.impact}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium mb-1">{event.title}</p>
                    <p className="text-xs opacity-75">
                      {format(event.date, "MMM d")} • {event.time}
                    </p>
                    {(event.previous || event.forecast) && (
                      <div className="mt-2 pt-2 border-t border-current/20 grid grid-cols-2 gap-2 text-[10px]">
                        {event.previous && (
                          <div>
                            <span className="opacity-60">Previous:</span>
                            <span className="ml-1 font-medium">{event.previous}</span>
                          </div>
                        )}
                        {event.forecast && (
                          <div>
                            <span className="opacity-60">Forecast:</span>
                            <span className="ml-1 font-medium">{event.forecast}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Events List View */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              All Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredEvents
                .filter(e => e.date >= new Date())
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .slice(0, 15)
                .map(event => (
                  <div 
                    key={event.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[50px]">
                        <p className="text-xs text-muted-foreground">{format(event.date, "MMM")}</p>
                        <p className="text-xl font-bold text-foreground">{format(event.date, "d")}</p>
                      </div>
                      <div className={`p-2 rounded-lg ${getTypeColor(event.type)}`}>
                        {getTypeIcon(event.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{event.title}</p>
                          {event.symbol && (
                            <Badge variant="outline" className="text-xs">{event.symbol}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{event.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {(event.previous || event.forecast || event.actual) && (
                        <div className="hidden md:flex items-center gap-4 text-sm">
                          {event.previous && (
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Previous</p>
                              <p className="font-medium text-foreground">{event.previous}</p>
                            </div>
                          )}
                          {event.forecast && (
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Forecast</p>
                              <p className="font-medium text-foreground">{event.forecast}</p>
                            </div>
                          )}
                          {event.actual && (
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Actual</p>
                              <p className="font-medium text-primary">{event.actual}</p>
                            </div>
                          )}
                        </div>
                      )}
                      <Badge className={getImpactColor(event.impact)}>
                        {event.impact} impact
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default EconomicCalendar;
