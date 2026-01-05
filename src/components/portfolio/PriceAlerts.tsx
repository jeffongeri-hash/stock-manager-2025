import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, BellOff, Trash2, Plus, TrendingUp, TrendingDown, Percent, DollarSign, BellRing } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { priceAlertSchema, percentAlertSchema } from '@/lib/validations';

// Check if browser notifications are supported
const notificationsSupported = 'Notification' in window;

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
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    notificationsSupported ? Notification.permission : 'denied'
  );
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newAlert, setNewAlert] = useState({
    symbol: '',
    target_value: '',
    condition: 'above',
  });

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!notificationsSupported) {
      toast.error('Browser notifications are not supported');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        toast.success('Push notifications enabled!');
        // Show a test notification
        new Notification('Notifications Enabled', {
          body: 'You will now receive alerts when your stocks hit target prices.',
          icon: '/favicon.ico',
        });
      } else if (permission === 'denied') {
        toast.error('Notification permission denied. Please enable in browser settings.');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to request notification permission');
    }
  }, []);

  // Send browser notification
  const sendBrowserNotification = useCallback((title: string, body: string) => {
    if (!notificationsSupported || notificationPermission !== 'granted') {
      return;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `alert-${Date.now()}`,
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, [notificationPermission]);

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
      const title = alert.alert_type === 'price' ? 'Price Alert Triggered!' : 'Percentage Alert Triggered!';
      const message = alert.alert_type === 'price'
        ? `${alert.symbol} has ${alert.condition === 'above' ? 'risen above' : 'fallen below'} $${alert.target_value.toFixed(2)}! Current: $${currentPrice.toFixed(2)}`
        : `${alert.symbol} has moved ${alert.condition === 'up' ? 'up' : 'down'} ${alert.target_value}%! Current: $${currentPrice.toFixed(2)}`;
      
      // Send browser push notification
      sendBrowserNotification(title, message);
      
      // Also show in-app toast
      toast.success(`🔔 ${message}`, { duration: 10000 });
      fetchAlerts();
    }
  };

  const addAlert = async () => {
    // Validate based on alert type
    const schema = alertType === 'price' ? priceAlertSchema : percentAlertSchema;
    const result = schema.safeParse({
      symbol: newAlert.symbol,
      condition: newAlert.condition,
      target_value: newAlert.target_value,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach(err => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFormErrors(errors);
      
      // Show first error as toast
      const firstError = result.error.issues[0];
      toast.error(firstError.message);
      return;
    }

    setFormErrors({});
    const validated = result.data;
    const targetValue = parseFloat(validated.target_value);

    const { error } = await supabase
      .from('alerts')
      .insert({
        user_id: userId,
        symbol: validated.symbol,
        target_value: targetValue,
        condition: validated.condition,
        alert_type: alertType,
        is_active: true,
      });

    if (error) {
      console.error('Error creating alert:', error);
      toast.error('Failed to create alert');
    } else {
      toast.success(`${alertType === 'price' ? 'Price' : 'Percentage'} alert created for ${validated.symbol}`);
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
    <div className="overflow-x-auto -mx-3 sm:mx-0 scrollbar-hide">
      <table className="w-full min-w-[600px] sm:min-w-0">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-2 sm:px-4 text-sm">Symbol</th>
            <th className="text-left py-2 px-2 sm:px-4 text-sm hidden sm:table-cell">Type</th>
            <th className="text-left py-2 px-2 sm:px-4 text-sm">Condition</th>
            <th className="text-right py-2 px-2 sm:px-4 text-sm">Target</th>
            <th className="text-right py-2 px-2 sm:px-4 text-sm hidden sm:table-cell">Current</th>
            <th className="text-center py-2 px-2 sm:px-4 text-sm">Status</th>
            <th className="text-center py-2 px-2 sm:px-4 text-sm">Actions</th>
          </tr>
        </thead>
        <tbody>
          {alertList.map((alert) => {
            const currentPrice = currentPrices.get(alert.symbol);

            return (
              <tr key={alert.id} className="border-b">
                <td className="py-2 sm:py-3 px-2 sm:px-4 font-medium text-sm">{alert.symbol}</td>
                <td className="py-2 sm:py-3 px-2 sm:px-4 hidden sm:table-cell">
                  <Badge variant="outline" className="gap-1 text-xs">
                    {alert.alert_type === 'price' ? (
                      <><DollarSign className="h-3 w-3" /> Price</>
                    ) : (
                      <><Percent className="h-3 w-3" /> Percent</>
                    )}
                  </Badge>
                </td>
                <td className="py-2 sm:py-3 px-2 sm:px-4">
                  <span className="flex items-center gap-1 text-sm">
                    {(alert.condition === 'above' || alert.condition === 'up') ? (
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                    )}
                    <span className="hidden sm:inline">{getConditionLabel(alert)}</span>
                    <span className="sm:hidden">{alert.condition}</span>
                  </span>
                </td>
                <td className="py-2 sm:py-3 px-2 sm:px-4 text-right font-medium text-sm">{getTargetLabel(alert)}</td>
                <td className="py-2 sm:py-3 px-2 sm:px-4 text-right text-sm hidden sm:table-cell">
                  {currentPrice ? `$${currentPrice.toFixed(2)}` : '-'}
                </td>
                <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                  {alert.triggered_at ? (
                    <Badge variant="secondary" className="text-xs">Done</Badge>
                  ) : alert.is_active ? (
                    <Badge variant="default" className="bg-primary text-xs">Active</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Off</Badge>
                  )}
                </td>
                <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
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
                      size="icon"
                      className="h-8 w-8"
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
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Bell className="h-5 w-5" />
          Price Alerts
        </CardTitle>
        {notificationsSupported && (
          <div className="flex items-center gap-2">
            {notificationPermission === 'granted' ? (
              <Badge variant="secondary" className="gap-1">
                <BellRing className="h-3 w-3" />
                Notifications On
              </Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={requestNotificationPermission}
                className="gap-2"
              >
                <BellRing className="h-4 w-4" />
                Enable Notifications
              </Button>
            )}
          </div>
        )}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <Label>Symbol</Label>
                <Input
                  value={newAlert.symbol}
                  onChange={(e) => {
                    setNewAlert({ ...newAlert, symbol: e.target.value.toUpperCase() });
                    if (formErrors.symbol) setFormErrors({ ...formErrors, symbol: '' });
                  }}
                  placeholder="AAPL"
                  maxLength={10}
                  className={formErrors.symbol ? 'border-destructive' : ''}
                />
                {formErrors.symbol && <p className="text-xs text-destructive">{formErrors.symbol}</p>}
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
                  onChange={(e) => {
                    setNewAlert({ ...newAlert, target_value: e.target.value });
                    if (formErrors.target_value) setFormErrors({ ...formErrors, target_value: '' });
                  }}
                  placeholder="150.00"
                  className={formErrors.target_value ? 'border-destructive' : ''}
                />
                {formErrors.target_value && <p className="text-xs text-destructive">{formErrors.target_value}</p>}
              </div>

              <div className="flex items-end">
                <Button onClick={addAlert} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Alert
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="percent">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <Label>Symbol</Label>
                <Input
                  value={newAlert.symbol}
                  onChange={(e) => {
                    setNewAlert({ ...newAlert, symbol: e.target.value.toUpperCase() });
                    if (formErrors.symbol) setFormErrors({ ...formErrors, symbol: '' });
                  }}
                  placeholder="AAPL"
                  maxLength={10}
                  className={formErrors.symbol ? 'border-destructive' : ''}
                />
                {formErrors.symbol && <p className="text-xs text-destructive">{formErrors.symbol}</p>}
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
                  onChange={(e) => {
                    setNewAlert({ ...newAlert, target_value: e.target.value });
                    if (formErrors.target_value) setFormErrors({ ...formErrors, target_value: '' });
                  }}
                  placeholder="5"
                  className={formErrors.target_value ? 'border-destructive' : ''}
                />
                {formErrors.target_value && <p className="text-xs text-destructive">{formErrors.target_value}</p>}
              </div>

              <div className="flex items-end">
                <Button onClick={addAlert} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Alert
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
