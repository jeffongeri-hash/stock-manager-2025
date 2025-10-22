import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Bell, Plus, Trash2 } from 'lucide-react';

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
  const [newAlert, setNewAlert] = useState({
    symbol: '',
    alert_type: 'price',
    condition: 'above',
    target_value: ''
  });

  useEffect(() => {
    if (user) {
      fetchAlerts();
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

  return (
    <PageLayout title="Price & Volatility Alerts">
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
                      <TableCell className="font-medium">{alert.symbol}</TableCell>
                      <TableCell className="capitalize">{alert.alert_type}</TableCell>
                      <TableCell className="capitalize">{alert.condition}</TableCell>
                      <TableCell>${alert.target_value.toFixed(2)}</TableCell>
                      <TableCell>
                        {alert.triggered_at ? (
                          <span className="text-green-500 font-semibold">Triggered</span>
                        ) : (
                          <span className="text-muted-foreground">Waiting</span>
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
            <h4 className="font-semibold mb-2">How Alerts Work</h4>
            <p className="text-muted-foreground">
              Set up custom alerts to monitor price movements, volatility changes, or unusual volume activity.
              You'll be notified when your conditions are met.
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