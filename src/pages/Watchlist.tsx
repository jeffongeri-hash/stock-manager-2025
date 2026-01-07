import React, { useState, useEffect, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useStockData } from '@/hooks/useStockData';
import { toast } from 'sonner';
import { Eye, Plus, Trash2, Bell, BellRing, TrendingUp, TrendingDown, RefreshCw, AlertCircle, Volume2, Clock } from 'lucide-react';
import { AlertHistoryPanel } from '@/components/watchlist/AlertHistoryPanel';

interface WatchlistItem {
  id: string;
  symbol: string;
  created_at: string;
}

interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  active: boolean;
  triggered: boolean;
  soundEnabled: boolean;
}

const Watchlist = () => {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [newSymbol, setNewSymbol] = useState('');
  type AlertCondition = 'above' | 'below';
  const [loading, setLoading] = useState(true);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [newAlert, setNewAlert] = useState<{ targetPrice: string; condition: AlertCondition; soundEnabled: boolean }>({ targetPrice: '', condition: 'above', soundEnabled: true });

  const symbols = useMemo(() => watchlist.map(w => w.symbol), [watchlist]);
  const { stocks, loading: pricesLoading, refresh, isRefreshing } = useStockData(symbols);

  useEffect(() => {
    if (user) {
      fetchWatchlist();
      fetchAlerts();
    }
  }, [user]);

  // Real-time price alert checking
  useEffect(() => {
    if (stocks.length === 0 || alerts.length === 0) return;

    alerts.filter(a => a.active && !a.triggered).forEach(alert => {
      const stock = stocks.find(s => s.symbol === alert.symbol);
      if (!stock) return;

      const triggered = alert.condition === 'above' 
        ? stock.price >= alert.targetPrice
        : stock.price <= alert.targetPrice;

      if (triggered) {
        // Trigger alert
        setAlerts(prev => prev.map(a => 
          a.id === alert.id ? { ...a, triggered: true } : a
        ));

        // Play sound if enabled
        if (alert.soundEnabled) {
          const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
          audio.play().catch(() => {});
        }

        toast.success(
          `🔔 Price Alert: ${alert.symbol} is now ${alert.condition} $${alert.targetPrice}!`,
          { duration: 10000 }
        );
      }
    });
  }, [stocks, alerts]);

  const fetchWatchlist = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch watchlist');
    } else {
      setWatchlist(data || []);
    }
    setLoading(false);
  };

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch alerts:', error);
      return;
    }
    
    // Transform database alerts to our format
    setAlerts((data || []).map(a => ({
      id: a.id,
      symbol: a.symbol,
      targetPrice: Number(a.target_value),
      condition: a.condition as 'above' | 'below',
      active: a.is_active ?? true,
      triggered: !!a.triggered_at,
      soundEnabled: true
    })));
  };

  const addToWatchlist = async () => {
    if (!newSymbol.trim()) {
      toast.error('Please enter a symbol');
      return;
    }

    const symbol = newSymbol.toUpperCase().trim();
    
    if (watchlist.some(w => w.symbol === symbol)) {
      toast.error('Symbol already in watchlist');
      return;
    }

    const { error } = await supabase
      .from('watchlist')
      .insert({ user_id: user?.id, symbol });

    if (error) {
      toast.error('Failed to add to watchlist');
      return;
    }

    toast.success(`${symbol} added to watchlist`);
    setNewSymbol('');
    fetchWatchlist();
  };

  const removeFromWatchlist = async (id: string, symbol: string) => {
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to remove from watchlist');
      return;
    }

    toast.success(`${symbol} removed from watchlist`);
    fetchWatchlist();
  };

  const createAlert = async () => {
    if (!selectedSymbol || !newAlert.targetPrice) {
      toast.error('Please fill in all fields');
      return;
    }

    const { error } = await supabase
      .from('alerts')
      .insert({
        user_id: user?.id,
        symbol: selectedSymbol,
        target_value: parseFloat(newAlert.targetPrice),
        condition: newAlert.condition,
        alert_type: 'price',
        is_active: true
      });

    if (error) {
      toast.error('Failed to create alert');
      return;
    }

    toast.success(`Price alert created for ${selectedSymbol}`);
    setAlertDialogOpen(false);
    setNewAlert({ targetPrice: '', condition: 'above', soundEnabled: true });
    fetchAlerts();
  };

  const toggleAlert = async (alertId: string) => {
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return;

    const { error } = await supabase
      .from('alerts')
      .update({ is_active: !alert.active })
      .eq('id', alertId);

    if (error) {
      toast.error('Failed to update alert');
      return;
    }

    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, active: !a.active } : a
    ));
  };

  const deleteAlert = async (alertId: string) => {
    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', alertId);

    if (error) {
      toast.error('Failed to delete alert');
      return;
    }

    setAlerts(prev => prev.filter(a => a.id !== alertId));
    toast.success('Alert deleted');
  };

  const openAlertDialog = (symbol: string) => {
    const stock = stocks.find(s => s.symbol === symbol);
    setSelectedSymbol(symbol);
    setNewAlert({ 
      targetPrice: stock ? stock.price.toString() : '', 
      condition: 'above',
      soundEnabled: true
    });
    setAlertDialogOpen(true);
  };

  const activeAlertsCount = alerts.filter(a => a.active && !a.triggered).length;

  return (
    <PageLayout title="Watchlist & Alerts">
      <Tabs defaultValue="watchlist" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="watchlist" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Watchlist
          </TabsTrigger>
          <TabsTrigger value="alert-history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Alert History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="watchlist">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Watching</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{watchlist.length}</div>
            <p className="text-xs text-muted-foreground">Symbols</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlertsCount}</div>
            <p className="text-xs text-muted-foreground">Price alerts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Triggered Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.filter(a => a.triggered).length}</div>
            <p className="text-xs text-muted-foreground">Alerts triggered</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{new Date().toLocaleTimeString()}</div>
            <p className="text-xs text-muted-foreground">Auto-refreshes every 60s</p>
          </CardContent>
        </Card>
      </div>

      {/* Add to Watchlist */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Add to Watchlist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Enter symbol (e.g., AAPL)"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && addToWatchlist()}
              className="max-w-xs"
            />
            <Button onClick={addToWatchlist}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
            <Button variant="outline" onClick={refresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Prices
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Watchlist Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your Watchlist</CardTitle>
            <CardDescription>Real-time prices update every 60 seconds</CardDescription>
          </CardHeader>
          <CardContent>
            {loading || pricesLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading watchlist...</p>
            ) : watchlist.length === 0 ? (
              <div className="text-center py-12">
                <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Your watchlist is empty</p>
                <p className="text-sm text-muted-foreground">Add symbols to start tracking</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Alerts</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {watchlist.map((item) => {
                    const stock = stocks.find(s => s.symbol === item.symbol);
                    const symbolAlerts = alerts.filter(a => a.symbol === item.symbol && a.active);
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold">{item.symbol}</TableCell>
                        <TableCell>
                          {stock ? `$${stock.price.toFixed(2)}` : '—'}
                        </TableCell>
                        <TableCell>
                          {stock && (
                            <span className={`flex items-center gap-1 ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {stock.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                              {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {stock?.volume ? (stock.volume / 1000000).toFixed(2) + 'M' : '—'}
                        </TableCell>
                        <TableCell>
                          {symbolAlerts.length > 0 && (
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                              <BellRing className="h-3 w-3" />
                              {symbolAlerts.length}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openAlertDialog(item.symbol)}
                            >
                              <Bell className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeFromWatchlist(item.id, item.symbol)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5" />
              Price Alerts
            </CardTitle>
            <CardDescription>Get notified when prices hit your targets</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No price alerts set</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => {
                  const stock = stocks.find(s => s.symbol === alert.symbol);
                  
                  return (
                    <div 
                      key={alert.id} 
                      className={`border rounded-lg p-3 ${alert.triggered ? 'border-green-500 bg-green-500/10' : alert.active ? '' : 'opacity-50'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={alert.triggered ? 'default' : 'outline'}>
                          {alert.symbol}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {alert.soundEnabled && <Volume2 className="h-3 w-3 text-muted-foreground" />}
                          <Switch
                            checked={alert.active}
                            onCheckedChange={() => toggleAlert(alert.id)}
                            disabled={alert.triggered}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => deleteAlert(alert.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm">
                        {alert.condition === 'above' ? '↑' : '↓'} ${alert.targetPrice.toFixed(2)}
                      </p>
                      {stock && (
                        <p className="text-xs text-muted-foreground">
                          Current: ${stock.price.toFixed(2)}
                        </p>
                      )}
                      {alert.triggered && (
                        <Badge variant="default" className="mt-2 bg-green-500">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Triggered!
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alert Creation Dialog */}
      <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Price Alert for {selectedSymbol}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Condition</Label>
              <Select 
                value={newAlert.condition}
                onValueChange={(value: 'above' | 'below') => setNewAlert({ ...newAlert, condition: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">Price goes above</SelectItem>
                  <SelectItem value="below">Price goes below</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Target Price ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={newAlert.targetPrice}
                onChange={(e) => setNewAlert({ ...newAlert, targetPrice: e.target.value })}
                placeholder="Enter target price"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Play sound when triggered</Label>
              <Switch
                checked={newAlert.soundEnabled}
                onCheckedChange={(checked) => setNewAlert({ ...newAlert, soundEnabled: checked })}
              />
            </div>
            <Button onClick={createAlert} className="w-full">
              <Bell className="h-4 w-4 mr-2" />
              Create Alert
            </Button>
          </div>
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="alert-history">
          <AlertHistoryPanel />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default Watchlist;
