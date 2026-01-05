import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Clock, Calendar, Play, Pause, Plus, Trash2, Loader2, Bell, TrendingUp, Sun, Moon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Schedule {
  id: string;
  ruleId: string;
  ruleName: string;
  scheduleType: 'time' | 'market_open' | 'market_close' | 'interval' | 'volatility';
  config: {
    time?: string; // HH:MM format
    days?: string[]; // ['monday', 'tuesday', ...]
    offset?: number; // minutes before/after market open/close
    intervalMinutes?: number;
    vixThreshold?: number;
    vixDirection?: 'above' | 'below';
  };
  timezone: string;
  isActive: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
}

interface TradingRule {
  id: string;
  name: string;
}

const timezones = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'UTC', label: 'UTC' },
];

const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

export const StrategyScheduler: React.FC = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [tradingRules, setTradingRules] = useState<TradingRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewSchedule, setShowNewSchedule] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newSchedule, setNewSchedule] = useState<Partial<Schedule>>({
    ruleId: '',
    scheduleType: 'time',
    config: { time: '09:30', days: weekdays },
    timezone: 'America/New_York',
    isActive: true,
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load trading rules
      const { data: rules, error: rulesError } = await supabase
        .from('trading_rules')
        .select('id, name')
        .eq('user_id', user.id);

      if (rulesError) throw rulesError;
      setTradingRules(rules || []);

      // Load schedules
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('rule_schedules')
        .select('*, trading_rules(name)')
        .eq('user_id', user.id);

      if (schedulesError) throw schedulesError;
      
      const mappedSchedules: Schedule[] = (schedulesData || []).map(s => ({
        id: s.id,
        ruleId: s.rule_id,
        ruleName: (s.trading_rules as any)?.name || 'Unknown Rule',
        scheduleType: s.schedule_type as Schedule['scheduleType'],
        config: s.schedule_config as Schedule['config'],
        timezone: s.timezone,
        isActive: s.is_active,
        lastRunAt: s.last_run_at || undefined,
        nextRunAt: s.next_run_at || undefined,
      }));
      
      setSchedules(mappedSchedules);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Failed to load schedules');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSchedule = async () => {
    if (!user) {
      toast.error('Please sign in');
      return;
    }

    if (!newSchedule.ruleId) {
      toast.error('Please select a trading rule');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('rule_schedules')
        .insert({
          user_id: user.id,
          rule_id: newSchedule.ruleId,
          schedule_type: newSchedule.scheduleType,
          schedule_config: newSchedule.config,
          timezone: newSchedule.timezone,
          is_active: newSchedule.isActive,
        });

      if (error) throw error;

      toast.success('Schedule created!');
      setShowNewSchedule(false);
      loadData();
      setNewSchedule({
        ruleId: '',
        scheduleType: 'time',
        config: { time: '09:30', days: weekdays },
        timezone: 'America/New_York',
        isActive: true,
      });
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      toast.error('Failed to save schedule');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSchedule = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('rule_schedules')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      setSchedules(schedules.map(s => s.id === id ? { ...s, isActive } : s));
      toast.success(isActive ? 'Schedule activated' : 'Schedule paused');
    } catch (error: any) {
      console.error('Error toggling schedule:', error);
      toast.error('Failed to update schedule');
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('rule_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSchedules(schedules.filter(s => s.id !== id));
      toast.success('Schedule deleted');
    } catch (error: any) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };

  const getScheduleIcon = (type: string) => {
    switch (type) {
      case 'time': return <Clock className="h-4 w-4" />;
      case 'market_open': return <Sun className="h-4 w-4" />;
      case 'market_close': return <Moon className="h-4 w-4" />;
      case 'interval': return <Calendar className="h-4 w-4" />;
      case 'volatility': return <TrendingUp className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getScheduleDescription = (schedule: Schedule) => {
    switch (schedule.scheduleType) {
      case 'time':
        return `Daily at ${schedule.config.time} ${schedule.timezone.split('/')[1]}`;
      case 'market_open':
        return `${schedule.config.offset || 0} min ${(schedule.config.offset || 0) >= 0 ? 'after' : 'before'} market open`;
      case 'market_close':
        return `${Math.abs(schedule.config.offset || 0)} min ${(schedule.config.offset || 0) >= 0 ? 'after' : 'before'} market close`;
      case 'interval':
        return `Every ${schedule.config.intervalMinutes} minutes`;
      case 'volatility':
        return `When VIX ${schedule.config.vixDirection} ${schedule.config.vixThreshold}`;
      default:
        return 'Custom schedule';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Strategy Scheduler
          </CardTitle>
          <CardDescription>
            Schedule your trading rules to run at specific times or market conditions
          </CardDescription>
        </div>
        <Button onClick={() => setShowNewSchedule(!showNewSchedule)}>
          <Plus className="h-4 w-4 mr-2" />
          New Schedule
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* New Schedule Form */}
        {showNewSchedule && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Create New Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Select Rule */}
              <div className="space-y-2">
                <Label>Trading Rule</Label>
                <Select
                  value={newSchedule.ruleId}
                  onValueChange={(value) => setNewSchedule({ ...newSchedule, ruleId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a trading rule" />
                  </SelectTrigger>
                  <SelectContent>
                    {tradingRules.map(rule => (
                      <SelectItem key={rule.id} value={rule.id}>{rule.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {tradingRules.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No trading rules found. Create a multi-condition rule first.
                  </p>
                )}
              </div>

              {/* Schedule Type */}
              <div className="space-y-2">
                <Label>Schedule Type</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {[
                    { value: 'time', label: 'Specific Time', icon: Clock },
                    { value: 'market_open', label: 'Market Open', icon: Sun },
                    { value: 'market_close', label: 'Market Close', icon: Moon },
                    { value: 'interval', label: 'Interval', icon: Calendar },
                    { value: 'volatility', label: 'VIX Level', icon: TrendingUp },
                  ].map(type => (
                    <Button
                      key={type.value}
                      variant={newSchedule.scheduleType === type.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewSchedule({ ...newSchedule, scheduleType: type.value as Schedule['scheduleType'] })}
                      className="flex items-center gap-1"
                    >
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Schedule Config based on type */}
              {newSchedule.scheduleType === 'time' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={newSchedule.config?.time || '09:30'}
                      onChange={(e) => setNewSchedule({
                        ...newSchedule,
                        config: { ...newSchedule.config, time: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select
                      value={newSchedule.timezone}
                      onValueChange={(value) => setNewSchedule({ ...newSchedule, timezone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map(tz => (
                          <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {(newSchedule.scheduleType === 'market_open' || newSchedule.scheduleType === 'market_close') && (
                <div className="space-y-2">
                  <Label>Offset (minutes)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="w-[100px]"
                      value={newSchedule.config?.offset || 0}
                      onChange={(e) => setNewSchedule({
                        ...newSchedule,
                        config: { ...newSchedule.config, offset: parseInt(e.target.value) || 0 }
                      })}
                    />
                    <span className="text-sm text-muted-foreground">
                      Positive = after, Negative = before
                    </span>
                  </div>
                </div>
              )}

              {newSchedule.scheduleType === 'interval' && (
                <div className="space-y-2">
                  <Label>Run every (minutes)</Label>
                  <Input
                    type="number"
                    className="w-[150px]"
                    value={newSchedule.config?.intervalMinutes || 60}
                    onChange={(e) => setNewSchedule({
                      ...newSchedule,
                      config: { ...newSchedule.config, intervalMinutes: parseInt(e.target.value) || 60 }
                    })}
                  />
                </div>
              )}

              {newSchedule.scheduleType === 'volatility' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>VIX Threshold</Label>
                    <Input
                      type="number"
                      value={newSchedule.config?.vixThreshold || 20}
                      onChange={(e) => setNewSchedule({
                        ...newSchedule,
                        config: { ...newSchedule.config, vixThreshold: parseFloat(e.target.value) || 20 }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Direction</Label>
                    <Select
                      value={newSchedule.config?.vixDirection || 'above'}
                      onValueChange={(value) => setNewSchedule({
                        ...newSchedule,
                        config: { ...newSchedule.config, vixDirection: value as 'above' | 'below' }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="above">Above</SelectItem>
                        <SelectItem value="below">Below</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Active Toggle */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={newSchedule.isActive}
                  onCheckedChange={(checked) => setNewSchedule({ ...newSchedule, isActive: checked })}
                />
                <Label>Active immediately</Label>
              </div>

              {/* Save Button */}
              <div className="flex gap-2">
                <Button onClick={saveSchedule} disabled={isSaving || !newSchedule.ruleId}>
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Create Schedule
                </Button>
                <Button variant="outline" onClick={() => setShowNewSchedule(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Existing Schedules */}
        {schedules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No schedules configured yet.</p>
            <p className="text-sm">Create a trading rule first, then schedule it here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  schedule.isActive ? 'bg-background' : 'bg-muted/50 opacity-75'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-full bg-muted">
                    {getScheduleIcon(schedule.scheduleType)}
                  </div>
                  <div>
                    <p className="font-medium">{schedule.ruleName}</p>
                    <p className="text-sm text-muted-foreground">
                      {getScheduleDescription(schedule)}
                    </p>
                    {schedule.nextRunAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Next run: {new Date(schedule.nextRunAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={schedule.isActive ? 'default' : 'secondary'}>
                    {schedule.isActive ? 'Active' : 'Paused'}
                  </Badge>
                  <Switch
                    checked={schedule.isActive}
                    onCheckedChange={(checked) => toggleSchedule(schedule.id, checked)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteSchedule(schedule.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
