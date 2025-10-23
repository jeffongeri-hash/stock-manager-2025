import React, { useState, useEffect, useCallback } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Bell, Plus, Trash2, Activity, TrendingUp } from 'lucide-react';

interface Alert {
  id: string;
  symbol: string;
  alert_type: string;
  condition: string;
  target_value: number;
  is_active: boolean;
  triggered_at: string | null;
}

const Alerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [monitoring, setMonitoring] = useState(false);
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  const [newAlert, setNewAlert] = useState({
    symbol: '',
    alert_type: 'price',
    condition: 'above',
    target_value: ''
  });

  useEffect(() => {
    if (user) {
      fetchAlerts();
      
      // Subscribe to realtime changes on alerts
      const channel = supabase
        .channel('alerts-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'alerts',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchAlerts();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch alerts');
      return;
    }
    setAlerts(data || []);
  };

  const addAlert = async () => {
    if (!newAlert.symbol || !newAlert.target_value) {
      toast.error('Please fill in all fields');
      return;
    }

    const { error } = await supabase
      .from('alerts')
      .insert({
        user_id: user?.id,
        symbol: newAlert.symbol.toUpperCase(),
        alert_type: newAlert.alert_type,
        condition: newAlert.condition,
        target_value: parseFloat(newAlert.target_value),
        is_active: true
      });

    if (error) {
      toast.error('Failed to create alert');
      return;
    }

    toast.success('Alert created');
    setNewAlert({
      symbol: '',
      alert_type: 'price',
      condition: 'above',
      target_value: ''
    });
    fetchAlerts();
  };

  const toggleAlert = async (id: string, is_active: boolean) => {
    const { error } = await supabase
      .from('alerts')
      .update({ is_active })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update alert');
      return;
    }

    toast.success(is_active ? 'Alert activated' : 'Alert deactivated');
    fetchAlerts();
  };

  const deleteAlert = async (id: string) => {
    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete alert');
      return;
    }

    toast.success('Alert deleted');
    fetchAlerts();
  };

  const checkAlerts = useCallback(async () => {
    if (!alerts.length) return;

    // Get unique symbols from active alerts
    const symbols = Array.from(new Set(
      alerts
        .filter(a => a.is_active && !a.triggered_at)
        .map(a => a.symbol)
    ));

    if (!symbols.length) return;

    try {
      // Fetch current prices
      const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
        body: { symbols }
      });

      if (error) throw error;

      const prices: Record<string, number> = {};
      data.stocks?.forEach((stock: any) => {
        prices[stock.symbol] = stock.price;
      });

      setCurrentPrices(prices);

      // Check each active alert
      for (const alert of alerts) {
        if (!alert.is_active || alert.triggered_at) continue;

        const currentPrice = prices[alert.symbol];
        if (!currentPrice) continue;

        let triggered = false;

        if (alert.alert_type === 'price') {
          if (alert.condition === 'above' && currentPrice >= alert.target_value) {
            triggered = true;
          } else if (alert.condition === 'below' && currentPrice <= alert.target_value) {
            triggered = true;
          }
        }

        if (triggered) {
          // Update alert as triggered
          await supabase
            .from('alerts')
            .update({ triggered_at: new Date().toISOString() })
            .eq('id', alert.id);

          // Show notification
          toast.success(
            `🔔 Alert Triggered: ${alert.symbol} is ${alert.condition} $${alert.target_value}`,
            { duration: 10000 }
          );
        }
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }, [alerts]);

  // Monitor alerts every 30 seconds
  useEffect(() => {
    if (!monitoring || !alerts.length) return;

    checkAlerts(); // Check immediately
    const interval = setInterval(checkAlerts, 30000); // Then every 30s

    return () => clearInterval(interval);
  }, [monitoring, alerts, checkAlerts]);

  const startMonitoring = () => {
    setMonitoring(true);
    toast.success('Alert monitoring started');
    checkAlerts();
  };

  const stopMonitoring = () => {
    setMonitoring(false);
    toast.info('Alert monitoring stopped');
  };

  return (
    <PageLayout title="Price & Volatility Alerts">
      {/* Monitoring Status */}
      <Card className="mb-6 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className={`h-6 w-6 ${monitoring ? 'text-green-500 animate-pulse' : 'text-muted-foreground'}`} />
              <div>
                <h3 className="font-semibold">Alert Monitoring</h3>
                <p className="text-sm text-muted-foreground">
                  {monitoring ? (
                    <span className="text-green-500">Active - Checking alerts every 30 seconds</span>
                  ) : (
                    'Start monitoring to receive real-time alerts'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {alerts.length > 0 && (
                <Badge variant="outline" className="text-sm">
                  {alerts.filter(a => a.is_active && !a.triggered_at).length} Active Alerts
                </Badge>
              )}
              <Button 
                onClick={monitoring ? stopMonitoring : startMonitoring}
                variant={monitoring ? 'destructive' : 'default'}
              >
                {monitoring ? 'Stop Monitoring' : 'Start Monitoring'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Create Alert
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Symbol</Label>
              <Input
                placeholder="AAPL"
                value={newAlert.symbol}
                onChange={(e) => setNewAlert({ ...newAlert, symbol: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <Label>Alert Type</Label>
              <Select value={newAlert.alert_type} onValueChange={(value) => setNewAlert({ ...newAlert, alert_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="volatility">Implied Volatility</SelectItem>
                  <SelectItem value="volume">Volume</SelectItem>
                  <SelectItem value="backtesting">Backtesting Strategy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Condition</Label>
              <Select value={newAlert.condition} onValueChange={(value) => setNewAlert({ ...newAlert, condition: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">Above</SelectItem>
                  <SelectItem value="below">Below</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Target Value</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="150.00"
                value={newAlert.target_value}
                onChange={(e) => setNewAlert({ ...newAlert, target_value: e.target.value })}
              />
            </div>
            <Button onClick={addAlert} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create Alert
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No alerts set. Create your first alert!</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {alert.symbol}
                          {currentPrices[alert.symbol] && (
                            <Badge variant="outline" className="text-xs">
                              ${currentPrices[alert.symbol].toFixed(2)}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{alert.alert_type}</TableCell>
                      <TableCell className="capitalize">{alert.condition}</TableCell>
                      <TableCell>${alert.target_value.toFixed(2)}</TableCell>
                      <TableCell>
                        {alert.triggered_at ? (
                          <Badge className="bg-green-500">
                            Triggered {new Date(alert.triggered_at).toLocaleString()}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Waiting</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={alert.is_active}
                          onCheckedChange={(checked) => toggleAlert(alert.id, checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => deleteAlert(alert.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Alert Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              How Real-Time Monitoring Works
            </h4>
            <p className="text-muted-foreground">
              Click "Start Monitoring" to activate real-time price checking. The system fetches live prices from Finnhub 
              every 30 seconds and compares them against your alert conditions. You'll receive instant notifications when alerts trigger.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Alert Types</h4>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>Price Alerts:</strong> Trigger when stock price crosses your target</li>
              <li><strong>Volatility Alerts:</strong> Trigger when IV moves above/below your threshold</li>
              <li><strong>Volume Alerts:</strong> Trigger on unusual volume activity</li>
            </ul>
          </div>
          <div className="bg-blue-500/10 p-3 rounded">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              💡 Tip: Combine multiple alerts on the same stock to create sophisticated monitoring strategies
            </p>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default Alerts;