import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Shield, AlertTriangle, DollarSign, Percent, TrendingDown, Save, Loader2, XCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface RiskSettings {
  id?: string;
  maxPositionSize: number;
  maxPositionPercent: number;
  maxDailyLoss: number;
  maxWeeklyLoss: number;
  maxOpenPositions: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  trailingStopEnabled: boolean;
  trailingStopPercent: number;
  currentDailyPnl: number;
  currentWeeklyPnl: number;
  isTradingHalted: boolean;
  haltReason?: string;
}

const defaultSettings: RiskSettings = {
  maxPositionSize: 10000,
  maxPositionPercent: 5,
  maxDailyLoss: 1000,
  maxWeeklyLoss: 5000,
  maxOpenPositions: 10,
  stopLossPercent: 2,
  takeProfitPercent: 5,
  trailingStopEnabled: false,
  trailingStopPercent: 1,
  currentDailyPnl: 0,
  currentWeeklyPnl: 0,
  isTradingHalted: false,
};

export const RiskManagement: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<RiskSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('risk_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          id: data.id,
          maxPositionSize: Number(data.max_position_size) || defaultSettings.maxPositionSize,
          maxPositionPercent: Number(data.max_position_percent) || defaultSettings.maxPositionPercent,
          maxDailyLoss: Number(data.max_daily_loss) || defaultSettings.maxDailyLoss,
          maxWeeklyLoss: Number(data.max_weekly_loss) || defaultSettings.maxWeeklyLoss,
          maxOpenPositions: data.max_open_positions || defaultSettings.maxOpenPositions,
          stopLossPercent: Number(data.stop_loss_percent) || defaultSettings.stopLossPercent,
          takeProfitPercent: Number(data.take_profit_percent) || defaultSettings.takeProfitPercent,
          trailingStopEnabled: data.trailing_stop_enabled || false,
          trailingStopPercent: Number(data.trailing_stop_percent) || defaultSettings.trailingStopPercent,
          currentDailyPnl: Number(data.current_daily_pnl) || 0,
          currentWeeklyPnl: Number(data.current_weekly_pnl) || 0,
          isTradingHalted: data.is_trading_halted || false,
          haltReason: data.halt_reason,
        });
      }
    } catch (error: any) {
      console.error('Error loading risk settings:', error);
      toast.error('Failed to load risk settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) {
      toast.error('Please sign in');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        user_id: user.id,
        max_position_size: settings.maxPositionSize,
        max_position_percent: settings.maxPositionPercent,
        max_daily_loss: settings.maxDailyLoss,
        max_weekly_loss: settings.maxWeeklyLoss,
        max_open_positions: settings.maxOpenPositions,
        stop_loss_percent: settings.stopLossPercent,
        take_profit_percent: settings.takeProfitPercent,
        trailing_stop_enabled: settings.trailingStopEnabled,
        trailing_stop_percent: settings.trailingStopPercent,
      };

      if (settings.id) {
        const { error } = await supabase
          .from('risk_settings')
          .update(payload)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('risk_settings')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        setSettings({ ...settings, id: data.id });
      }

      toast.success('Risk settings saved!');
      setHasChanges(false);
    } catch (error: any) {
      console.error('Error saving risk settings:', error);
      toast.error('Failed to save settings: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof RiskSettings>(key: K, value: RiskSettings[K]) => {
    setSettings({ ...settings, [key]: value });
    setHasChanges(true);
  };

  const toggleTradingHalt = async () => {
    if (!user || !settings.id) return;

    const newHaltState = !settings.isTradingHalted;
    try {
      const { error } = await supabase
        .from('risk_settings')
        .update({ 
          is_trading_halted: newHaltState,
          halt_reason: newHaltState ? 'Manually halted by user' : null
        })
        .eq('id', settings.id);

      if (error) throw error;

      setSettings({ 
        ...settings, 
        isTradingHalted: newHaltState,
        haltReason: newHaltState ? 'Manually halted by user' : undefined
      });
      toast.success(newHaltState ? 'Trading halted!' : 'Trading resumed!');
    } catch (error: any) {
      toast.error('Failed to update trading status');
    }
  };

  const dailyLossPercent = Math.min(100, (Math.abs(settings.currentDailyPnl) / settings.maxDailyLoss) * 100);
  const weeklyLossPercent = Math.min(100, (Math.abs(settings.currentWeeklyPnl) / settings.maxWeeklyLoss) * 100);

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
    <div className="space-y-6">
      {/* Trading Status */}
      <Card className={settings.isTradingHalted ? 'border-destructive' : 'border-green-500/50'}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {settings.isTradingHalted ? (
                <XCircle className="h-5 w-5 text-destructive" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
              <CardTitle className="text-lg">Trading Status</CardTitle>
            </div>
            <Button
              variant={settings.isTradingHalted ? 'default' : 'destructive'}
              onClick={toggleTradingHalt}
            >
              {settings.isTradingHalted ? 'Resume Trading' : 'Halt Trading'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {settings.isTradingHalted ? (
            <div className="p-4 bg-destructive/10 rounded-lg">
              <p className="text-destructive font-medium">Trading is currently halted</p>
              <p className="text-sm text-muted-foreground mt-1">
                Reason: {settings.haltReason || 'Unknown'}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">All automated trading rules are active</p>
          )}
        </CardContent>
      </Card>

      {/* Current P&L Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Daily P&L
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-2xl font-bold ${settings.currentDailyPnl >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                ${settings.currentDailyPnl.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground">
                / ${settings.maxDailyLoss} max loss
              </span>
            </div>
            <Progress 
              value={dailyLossPercent} 
              className={`h-2 ${dailyLossPercent > 80 ? '[&>div]:bg-destructive' : dailyLossPercent > 50 ? '[&>div]:bg-yellow-500' : ''}`}
            />
            {dailyLossPercent > 80 && (
              <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Approaching daily loss limit!
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Weekly P&L
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-2xl font-bold ${settings.currentWeeklyPnl >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                ${settings.currentWeeklyPnl.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground">
                / ${settings.maxWeeklyLoss} max loss
              </span>
            </div>
            <Progress 
              value={weeklyLossPercent}
              className={`h-2 ${weeklyLossPercent > 80 ? '[&>div]:bg-destructive' : weeklyLossPercent > 50 ? '[&>div]:bg-yellow-500' : ''}`}
            />
          </CardContent>
        </Card>
      </div>

      {/* Risk Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Risk Management Settings
          </CardTitle>
          <CardDescription>
            Configure position sizing, loss limits, and stop-loss parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Position Sizing */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Position Sizing</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Max Position Size ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    className="pl-9"
                    value={settings.maxPositionSize}
                    onChange={(e) => updateSetting('maxPositionSize', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Max Position (% of Portfolio)</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    className="pl-9"
                    value={settings.maxPositionPercent}
                    onChange={(e) => updateSetting('maxPositionPercent', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Max Open Positions</Label>
                <Input
                  type="number"
                  value={settings.maxOpenPositions}
                  onChange={(e) => updateSetting('maxOpenPositions', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          </div>

          {/* Loss Limits */}
          <div className="space-y-4">
            <Label className="text-base font-semibold flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Loss Limits
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Max Daily Loss ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    className="pl-9"
                    value={settings.maxDailyLoss}
                    onChange={(e) => updateSetting('maxDailyLoss', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Trading halts if this limit is reached</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Max Weekly Loss ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    className="pl-9"
                    value={settings.maxWeeklyLoss}
                    onChange={(e) => updateSetting('maxWeeklyLoss', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stop Loss & Take Profit */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Default Stop Loss & Take Profit</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Default Stop Loss (%)</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.1"
                    className="pl-9"
                    value={settings.stopLossPercent}
                    onChange={(e) => updateSetting('stopLossPercent', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Default Take Profit (%)</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.1"
                    className="pl-9"
                    value={settings.takeProfitPercent}
                    onChange={(e) => updateSetting('takeProfitPercent', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Trailing Stop */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">Trailing Stop</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically adjust stop loss as price moves in your favor
                </p>
              </div>
              <Switch
                checked={settings.trailingStopEnabled}
                onCheckedChange={(checked) => updateSetting('trailingStopEnabled', checked)}
              />
            </div>
            {settings.trailingStopEnabled && (
              <div className="space-y-2">
                <Label className="text-sm">Trailing Stop Distance (%)</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.1"
                    className="pl-9 w-[200px]"
                    value={settings.trailingStopPercent}
                    onChange={(e) => updateSetting('trailingStopPercent', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <Button onClick={saveSettings} disabled={isSaving || !hasChanges} className="w-full">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Risk Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
