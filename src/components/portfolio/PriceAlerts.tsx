import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, BellOff, Trash2, Plus, TrendingUp, TrendingDown, Percent, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Alert {
  id: string;
  symbol: string;
  target_value: number;
  condition: string;
  alert_type: string;
  is_active: boolean;
  triggered_at: string | null;
  created_at: string;
}

interface StockChange {
  changePercent: number;
  previousClose: number;
}

interface PriceAlertsProps {
  userId: string;
  currentPrices: Map<string, number>;
  stockChanges?: Map<string, StockChange>;
}

export const PriceAlerts: React.FC<PriceAlertsProps> = ({ userId, currentPrices, stockChanges }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alertType, setAlertType] = useState<'price' | 'percent'>('price');
  const [newAlert, setNewAlert] = useState({
    symbol: '',
    target_value: '',
    condition: 'above',
  });

  useEffect(() => {
    fetchAlerts();
  }, [userId]);

  // Check alerts against current prices
  useEffect(() => {
    if (currentPrices.size === 0) return;
    
    alerts.forEach(alert => {
      if (!alert.is_active || alert.triggered_at) return;
      
      const currentPrice = currentPrices.get(alert.symbol.toUpperCase());
      if (!currentPrice) return;

      let isTriggered = false;

      if (alert.alert_type === 'price') {
        isTriggered = alert.condition === 'above' 
          ? currentPrice >= alert.target_value
          : currentPrice <= alert.target_value;
      } else if (alert.alert_type === 'percent' && stockChanges) {
        const stockChange = stockChanges.get(alert.symbol.toUpperCase());
        if (stockChange) {
          const absChangePercent = Math.abs(stockChange.changePercent);
          if (alert.condition === 'up') {
            isTriggered = stockChange.changePercent >= alert.target_value;
          } else {
            isTriggered = stockChange.changePercent <= -alert.target_value;
          }
        }
      }

      if (isTriggered) {
        triggerAlert(alert, currentPrice);
      }
    });
  }, [currentPrices, stockChanges, alerts]);

  const fetchAlerts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', userId)
      .in('alert_type', ['price', 'percent'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Failed to fetch alerts');
    } else {
      setAlerts(data || []);
    }
    setIsLoading(false);
  };

  const triggerAlert = async (alert: Alert, currentPrice: number) => {
    const { error } = await supabase
      .from('alerts')
      .update({ triggered_at: new Date().toISOString(), is_active: false })
      .eq('id', alert.id);

    if (!error) {
      const message = alert.alert_type === 'price'
        ? `🔔 Price Alert: ${alert.symbol} has ${alert.condition === 'above' ? 'risen above' : 'fallen below'} $${alert.target_value.toFixed(2)}! Current: $${currentPrice.toFixed(2)}`
        : `🔔 Percent Alert: ${alert.symbol} has moved ${alert.condition === 'up' ? 'up' : 'down'} ${alert.target_value}%! Current: $${currentPrice.toFixed(2)}`;
      
      toast.success(message, { duration: 10000 });
      fetchAlerts();
    }
  };

  const addAlert = async () => {
    const symbol = newAlert.symbol.trim().toUpperCase();
    const targetValue = parseFloat(newAlert.target_value);

    if (!symbol) {
      toast.error('Please enter a stock symbol');
      return;
    }

    if (isNaN(targetValue) || targetValue <= 0) {
      toast.error(alertType === 'price' ? 'Please enter a valid target price' : 'Please enter a valid percentage');
      return;
    }

    if (symbol.length > 10) {
      toast.error('Symbol must be 10 characters or less');
      return;
    }

    if (alertType === 'percent' && targetValue > 100) {
      toast.error('Percentage must be 100 or less');
      return;
    }

    const { error } = await supabase
      .from('alerts')
      .insert({
        user_id: userId,
        symbol,
        target_value: targetValue,
        condition: newAlert.condition,
        alert_type: alertType,
        is_active: true,
      });

    if (error) {
      console.error('Error creating alert:', error);
      toast.error('Failed to create alert');
    } else {
      toast.success(`${alertType === 'price' ? 'Price' : 'Percentage'} alert created for ${symbol}`);
      setNewAlert({ symbol: '', target_value: '', condition: alertType === 'price' ? 'above' : 'up' });
      fetchAlerts();
    }
  };

  const deleteAlert = async (id: string) => {
    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete alert');
    } else {
      toast.success('Alert deleted');
      fetchAlerts();
    }
  };

  const toggleAlert = async (alert: Alert) => {
    const { error } = await supabase
      .from('alerts')
      .update({ is_active: !alert.is_active })
      .eq('id', alert.id);

    if (error) {
      toast.error('Failed to update alert');
    } else {
      fetchAlerts();
    }
  };

  const priceAlerts = alerts.filter(a => a.alert_type === 'price');
  const percentAlerts = alerts.filter(a => a.alert_type === 'percent');

  const getConditionLabel = (alert: Alert) => {
    if (alert.alert_type === 'price') {
      return alert.condition === 'above' ? 'Rises above' : 'Falls below';
    }
    return alert.condition === 'up' ? 'Moves up' : 'Moves down';
  };

  const getTargetLabel = (alert: Alert) => {
    if (alert.alert_type === 'price') {
      return `$${alert.target_value.toFixed(2)}`;
    }
    return `${alert.target_value}%`;
  };

  const renderAlertTable = (alertList: Alert[]) => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-4">Symbol</th>
            <th className="text-left py-2 px-4">Type</th>
            <th className="text-left py-2 px-4">Condition</th>
            <th className="text-right py-2 px-4">Target</th>
            <th className="text-right py-2 px-4">Current Price</th>
            <th className="text-center py-2 px-4">Status</th>
            <th className="text-center py-2 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {alertList.map((alert) => {
            const currentPrice = currentPrices.get(alert.symbol);

            return (
              <tr key={alert.id} className="border-b">
                <td className="py-3 px-4 font-medium">{alert.symbol}</td>
                <td className="py-3 px-4">
                  <Badge variant="outline" className="gap-1">
                    {alert.alert_type === 'price' ? (
                      <><DollarSign className="h-3 w-3" /> Price</>
                    ) : (
                      <><Percent className="h-3 w-3" /> Percent</>
                    )}
                  </Badge>
                </td>
                <td className="py-3 px-4">
                  <span className="flex items-center gap-1">
                    {(alert.condition === 'above' || alert.condition === 'up') ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    {getConditionLabel(alert)}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-medium">{getTargetLabel(alert)}</td>
                <td className="py-3 px-4 text-right">
                  {currentPrice ? `$${currentPrice.toFixed(2)}` : '-'}
                </td>
                <td className="py-3 px-4 text-center">
                  {alert.triggered_at ? (
                    <Badge variant="secondary">Triggered</Badge>
                  ) : alert.is_active ? (
                    <Badge variant="default" className="bg-primary">Active</Badge>
                  ) : (
                    <Badge variant="outline">Paused</Badge>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAlert(alert)}
                      disabled={!!alert.triggered_at}
                      title={alert.is_active ? 'Pause alert' : 'Resume alert'}
                    >
                      {alert.is_active ? (
                        <BellOff className="h-4 w-4" />
                      ) : (
                        <Bell className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAlert(alert.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Price Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={alertType} onValueChange={(v) => {
          setAlertType(v as 'price' | 'percent');
          setNewAlert({ 
            ...newAlert, 
            condition: v === 'price' ? 'above' : 'up',
            target_value: '' 
          });
        }}>
          <TabsList className="mb-4">
            <TabsTrigger value="price" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Price Alert
            </TabsTrigger>
            <TabsTrigger value="percent" className="gap-2">
              <Percent className="h-4 w-4" />
              Percentage Alert
            </TabsTrigger>
          </TabsList>

          <TabsContent value="price">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <Label>Symbol</Label>
                <Input
                  value={newAlert.symbol}
                  onChange={(e) => setNewAlert({ ...newAlert, symbol: e.target.value.toUpperCase() })}
                  placeholder="AAPL"
                  maxLength={10}
                />
              </div>

              <div className="space-y-2">
                <Label>Condition</Label>
                <Select
                  value={newAlert.condition}
                  onValueChange={(value) => setNewAlert({ ...newAlert, condition: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="above">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        Price rises above
                      </span>
                    </SelectItem>
                    <SelectItem value="below">
                      <span className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        Price falls below
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newAlert.target_value}
                  onChange={(e) => setNewAlert({ ...newAlert, target_value: e.target.value })}
                  placeholder="150.00"
                />
              </div>

              <div className="flex items-end">
                <Button onClick={addAlert} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Price Alert
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="percent">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <Label>Symbol</Label>
                <Input
                  value={newAlert.symbol}
                  onChange={(e) => setNewAlert({ ...newAlert, symbol: e.target.value.toUpperCase() })}
                  placeholder="AAPL"
                  maxLength={10}
                />
              </div>

              <div className="space-y-2">
                <Label>Condition</Label>
                <Select
                  value={newAlert.condition}
                  onValueChange={(value) => setNewAlert({ ...newAlert, condition: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="up">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        Moves up by
                      </span>
                    </SelectItem>
                    <SelectItem value="down">
                      <span className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        Moves down by
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Percentage (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  value={newAlert.target_value}
                  onChange={(e) => setNewAlert({ ...newAlert, target_value: e.target.value })}
                  placeholder="5"
                />
              </div>

              <div className="flex items-end">
                <Button onClick={addAlert} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add % Alert
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Percentage alerts notify you when a stock moves up or down by the specified percentage from its previous close.
            </p>
          </TabsContent>
        </Tabs>

        {/* All Alerts List */}
        {isLoading ? (
          <p className="text-center text-muted-foreground py-4">Loading alerts...</p>
        ) : alerts.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No alerts set. Create one above to get notified when a stock reaches your target.
          </p>
        ) : (
          renderAlertTable(alerts)
        )}
      </CardContent>
    </Card>
  );
};
