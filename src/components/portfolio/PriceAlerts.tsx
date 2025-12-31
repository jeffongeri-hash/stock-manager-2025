import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, BellOff, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

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

interface PriceAlertsProps {
  userId: string;
  currentPrices: Map<string, number>;
}

export const PriceAlerts: React.FC<PriceAlertsProps> = ({ userId, currentPrices }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

      const isTriggered = alert.condition === 'above' 
        ? currentPrice >= alert.target_value
        : currentPrice <= alert.target_value;

      if (isTriggered) {
        triggerAlert(alert, currentPrice);
      }
    });
  }, [currentPrices, alerts]);

  const fetchAlerts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('alert_type', 'price')
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
    // Update alert as triggered
    const { error } = await supabase
      .from('alerts')
      .update({ triggered_at: new Date().toISOString(), is_active: false })
      .eq('id', alert.id);

    if (!error) {
      toast.success(
        `🔔 Price Alert: ${alert.symbol} has ${alert.condition === 'above' ? 'risen above' : 'fallen below'} $${alert.target_value.toFixed(2)}! Current: $${currentPrice.toFixed(2)}`,
        { duration: 10000 }
      );
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
      toast.error('Please enter a valid target price');
      return;
    }

    if (symbol.length > 10) {
      toast.error('Symbol must be 10 characters or less');
      return;
    }

    const { error } = await supabase
      .from('alerts')
      .insert({
        user_id: userId,
        symbol,
        target_value: targetValue,
        condition: newAlert.condition,
        alert_type: 'price',
        is_active: true,
      });

    if (error) {
      console.error('Error creating alert:', error);
      toast.error('Failed to create alert');
    } else {
      toast.success(`Alert created for ${symbol}`);
      setNewAlert({ symbol: '', target_value: '', condition: 'above' });
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

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Price Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Add Alert Form */}
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
                <SelectItem value="above">Price rises above</SelectItem>
                <SelectItem value="below">Price falls below</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Target Price</Label>
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
              Add Alert
            </Button>
          </div>
        </div>

        {/* Alerts List */}
        {isLoading ? (
          <p className="text-center text-muted-foreground py-4">Loading alerts...</p>
        ) : alerts.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No price alerts set. Create one above to get notified when a stock reaches your target price.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Symbol</th>
                  <th className="text-left py-2 px-4">Condition</th>
                  <th className="text-right py-2 px-4">Target Price</th>
                  <th className="text-right py-2 px-4">Current Price</th>
                  <th className="text-center py-2 px-4">Status</th>
                  <th className="text-center py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => {
                  const currentPrice = currentPrices.get(alert.symbol);
                  const progress = currentPrice 
                    ? alert.condition === 'above'
                      ? Math.min(100, (currentPrice / alert.target_value) * 100)
                      : Math.min(100, (alert.target_value / currentPrice) * 100)
                    : 0;

                  return (
                    <tr key={alert.id} className="border-b">
                      <td className="py-3 px-4 font-medium">{alert.symbol}</td>
                      <td className="py-3 px-4">
                        {alert.condition === 'above' ? 'Rises above' : 'Falls below'}
                      </td>
                      <td className="py-3 px-4 text-right">${alert.target_value.toFixed(2)}</td>
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
        )}
      </CardContent>
    </Card>
  );
};
