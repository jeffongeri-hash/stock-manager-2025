import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bell, BellRing, TrendingUp, TrendingDown, DollarSign, Percent, 
  Search, Filter, Clock, CheckCircle2, ArrowUpDown, Calendar
} from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

interface TriggeredAlert {
  id: string;
  symbol: string;
  target_value: number;
  condition: string;
  alert_type: string;
  triggered_at: string;
  created_at: string;
}

export function AlertHistoryPanel() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<TriggeredAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<TriggeredAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'price' | 'percent'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    if (user) {
      fetchTriggeredAlerts();
    }
  }, [user]);

  useEffect(() => {
    let filtered = alerts;

    if (searchTerm) {
      filtered = filtered.filter(alert => 
        alert.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(alert => alert.alert_type === filterType);
    }

    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.triggered_at).getTime();
      const dateB = new Date(b.triggered_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredAlerts(filtered);
  }, [alerts, searchTerm, filterType, sortOrder]);

  const fetchTriggeredAlerts = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', user.id)
      .not('triggered_at', 'is', null)
      .order('triggered_at', { ascending: false });

    if (error) {
      console.error('Error fetching triggered alerts:', error);
    } else {
      setAlerts(data || []);
    }
    setIsLoading(false);
  };

  const getConditionLabel = (alert: TriggeredAlert) => {
    if (alert.alert_type === 'price') {
      return alert.condition === 'above' ? 'Rose above' : 'Fell below';
    }
    return alert.condition === 'up' ? 'Moved up' : 'Moved down';
  };

  const getTargetLabel = (alert: TriggeredAlert) => {
    if (alert.alert_type === 'price') {
      return `$${alert.target_value.toFixed(2)}`;
    }
    return `${alert.target_value}%`;
  };

  const totalTriggered = alerts.length;
  const priceAlerts = alerts.filter(a => a.alert_type === 'price').length;
  const percentAlerts = alerts.filter(a => a.alert_type === 'percent').length;
  const uniqueSymbols = new Set(alerts.map(a => a.symbol)).size;

  if (!user) {
    return (
      <Card className="glass-card">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Bell className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Sign in to view alert history</h2>
          <p className="text-muted-foreground text-center">
            Track all your triggered alerts with detailed timestamps and price data.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Triggered</p>
                <p className="text-2xl font-bold mt-1">{totalTriggered}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Price Alerts</p>
                <p className="text-2xl font-bold mt-1">{priceAlerts}</p>
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Percent Alerts</p>
                <p className="text-2xl font-bold mt-1">{percentAlerts}</p>
              </div>
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Percent className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unique Symbols</p>
                <p className="text-2xl font-bold mt-1">{uniqueSymbols}</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by symbol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="price">Price Alerts</SelectItem>
                  <SelectItem value="percent">Percent Alerts</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                title={`Sort by ${sortOrder === 'newest' ? 'oldest' : 'newest'} first`}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert List */}
      <Card className="glass-card overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Triggered Alerts
          </CardTitle>
          <CardDescription>
            {filteredAlerts.length} {filteredAlerts.length === 1 ? 'alert' : 'alerts'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex gap-4 p-4 rounded-lg bg-muted/30">
                  <div className="w-12 h-12 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-3 w-48 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-muted/30 rounded-full mb-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No triggered alerts</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your filters to see more results.'
                  : 'Set up price alerts to get notified when stocks hit your targets.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="group relative flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:shadow-md transition-all duration-200"
                >
                  <div className={`
                    p-3 rounded-xl transition-colors
                    ${alert.alert_type === 'price' 
                      ? 'bg-green-500/10 group-hover:bg-green-500/20' 
                      : 'bg-yellow-500/10 group-hover:bg-yellow-500/20'}
                  `}>
                    {alert.alert_type === 'price' ? (
                      <DollarSign className="h-5 w-5 text-green-500" />
                    ) : (
                      <Percent className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg">{alert.symbol}</span>
                      <Badge 
                        variant="secondary" 
                        className={`
                          ${(alert.condition === 'above' || alert.condition === 'up') 
                            ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                            : 'bg-red-500/10 text-red-500 border-red-500/20'}
                        `}
                      >
                        {(alert.condition === 'above' || alert.condition === 'up') ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {getConditionLabel(alert)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Target: <span className="font-medium text-foreground">{getTargetLabel(alert)}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {format(parseISO(alert.triggered_at), 'MMM d, yyyy')}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(parseISO(alert.triggered_at), 'h:mm a')}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {formatDistanceToNow(parseISO(alert.triggered_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
