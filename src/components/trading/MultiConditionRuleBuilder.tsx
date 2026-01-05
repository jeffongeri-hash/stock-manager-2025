import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Trash2, GitMerge, GitBranch, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Condition {
  id: string;
  type: 'price_above' | 'price_below' | 'rsi_above' | 'rsi_below' | 'ma_crossover' | 'volume_spike' | 'macd_cross' | 'bollinger_touch';
  symbol: string;
  value: number;
  timeframe: string;
}

interface TradingRule {
  id?: string;
  name: string;
  description: string;
  logicOperator: 'AND' | 'OR';
  conditions: Condition[];
  action: {
    type: 'buy' | 'sell' | 'alert';
    quantity: number;
    orderType: 'market' | 'limit';
    limitPrice?: number;
  };
  executionStrategy: 'market' | 'limit' | 'twap' | 'vwap' | 'iceberg';
  executionParams: {
    duration?: number; // minutes for TWAP/VWAP
    slices?: number; // for iceberg
    displayQty?: number; // for iceberg
  };
}

interface MultiConditionRuleBuilderProps {
  onRuleSaved?: (rule: TradingRule) => void;
}

const conditionTypes = [
  { value: 'price_above', label: 'Price Above' },
  { value: 'price_below', label: 'Price Below' },
  { value: 'rsi_above', label: 'RSI Above' },
  { value: 'rsi_below', label: 'RSI Below' },
  { value: 'ma_crossover', label: 'MA Crossover' },
  { value: 'volume_spike', label: 'Volume Spike %' },
  { value: 'macd_cross', label: 'MACD Cross' },
  { value: 'bollinger_touch', label: 'Bollinger Touch' },
];

const timeframes = ['1m', '5m', '15m', '1H', '4H', '1D', '1W'];

export const MultiConditionRuleBuilder: React.FC<MultiConditionRuleBuilderProps> = ({ onRuleSaved }) => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [rule, setRule] = useState<TradingRule>({
    name: '',
    description: '',
    logicOperator: 'AND',
    conditions: [
      { id: '1', type: 'price_above', symbol: '', value: 0, timeframe: '1D' }
    ],
    action: { type: 'alert', quantity: 0, orderType: 'market' },
    executionStrategy: 'market',
    executionParams: {}
  });

  const addCondition = () => {
    const newCondition: Condition = {
      id: Date.now().toString(),
      type: 'price_above',
      symbol: rule.conditions[0]?.symbol || '',
      value: 0,
      timeframe: '1D'
    };
    setRule({ ...rule, conditions: [...rule.conditions, newCondition] });
  };

  const removeCondition = (id: string) => {
    if (rule.conditions.length <= 1) {
      toast.error('At least one condition is required');
      return;
    }
    setRule({ ...rule, conditions: rule.conditions.filter(c => c.id !== id) });
  };

  const updateCondition = (id: string, updates: Partial<Condition>) => {
    setRule({
      ...rule,
      conditions: rule.conditions.map(c => c.id === id ? { ...c, ...updates } : c)
    });
  };

  const saveRule = async () => {
    if (!user) {
      toast.error('Please sign in to save rules');
      return;
    }

    if (!rule.name) {
      toast.error('Please enter a rule name');
      return;
    }

    if (rule.conditions.some(c => !c.symbol)) {
      toast.error('All conditions must have a symbol');
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('trading_rules')
        .insert([{
          user_id: user.id,
          name: rule.name,
          description: rule.description,
          logic_operator: rule.logicOperator,
          conditions: rule.conditions as unknown as any,
          action: rule.action as unknown as any,
          execution_strategy: rule.executionStrategy,
          execution_params: rule.executionParams as unknown as any,
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Trading rule saved successfully!');
      onRuleSaved?.(rule);
      
      // Reset form
      setRule({
        name: '',
        description: '',
        logicOperator: 'AND',
        conditions: [{ id: '1', type: 'price_above', symbol: '', value: 0, timeframe: '1D' }],
        action: { type: 'alert', quantity: 0, orderType: 'market' },
        executionStrategy: 'market',
        executionParams: {}
      });
    } catch (error: any) {
      console.error('Error saving rule:', error);
      toast.error('Failed to save rule: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getConditionLabel = (type: string) => {
    return conditionTypes.find(c => c.value === type)?.label || type;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitMerge className="h-5 w-5" />
          Multi-Condition Rule Builder
        </CardTitle>
        <CardDescription>
          Create complex trading rules with multiple conditions using AND/OR logic
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rule Name & Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Rule Name</Label>
            <Input
              placeholder="e.g., Momentum Breakout Strategy"
              value={rule.name}
              onChange={(e) => setRule({ ...rule, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input
              placeholder="Brief description of the strategy"
              value={rule.description}
              onChange={(e) => setRule({ ...rule, description: e.target.value })}
            />
          </div>
        </div>

        {/* Logic Operator */}
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <Label className="font-semibold">Condition Logic:</Label>
          <div className="flex items-center gap-2">
            <Button
              variant={rule.logicOperator === 'AND' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRule({ ...rule, logicOperator: 'AND' })}
              className="gap-1"
            >
              <GitMerge className="h-4 w-4" />
              AND
            </Button>
            <Button
              variant={rule.logicOperator === 'OR' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRule({ ...rule, logicOperator: 'OR' })}
              className="gap-1"
            >
              <GitBranch className="h-4 w-4" />
              OR
            </Button>
          </div>
          <span className="text-sm text-muted-foreground">
            {rule.logicOperator === 'AND' 
              ? 'All conditions must be true to trigger' 
              : 'Any condition being true will trigger'}
          </span>
        </div>

        {/* Conditions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Conditions</Label>
            <Button variant="outline" size="sm" onClick={addCondition}>
              <Plus className="h-4 w-4 mr-1" />
              Add Condition
            </Button>
          </div>
          
          {rule.conditions.map((condition, index) => (
            <div key={condition.id} className="flex items-center gap-2 p-3 border rounded-lg bg-background">
              {index > 0 && (
                <Badge variant="secondary" className="shrink-0">
                  {rule.logicOperator}
                </Badge>
              )}
              
              <Select
                value={condition.type}
                onValueChange={(value) => updateCondition(condition.id, { type: value as Condition['type'] })}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {conditionTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Symbol"
                className="w-[100px]"
                value={condition.symbol}
                onChange={(e) => updateCondition(condition.id, { symbol: e.target.value.toUpperCase() })}
              />

              <Input
                type="number"
                placeholder="Value"
                className="w-[100px]"
                value={condition.value || ''}
                onChange={(e) => updateCondition(condition.id, { value: parseFloat(e.target.value) || 0 })}
              />

              <Select
                value={condition.timeframe}
                onValueChange={(value) => updateCondition(condition.id, { timeframe: value })}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeframes.map(tf => (
                    <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeCondition(condition.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Action */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Action</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label className="text-sm">Action Type</Label>
              <Select
                value={rule.action.type}
                onValueChange={(value) => setRule({ ...rule, action: { ...rule.action, type: value as 'buy' | 'sell' | 'alert' } })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alert">Send Alert</SelectItem>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {rule.action.type !== 'alert' && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm">Quantity</Label>
                  <Input
                    type="number"
                    value={rule.action.quantity || ''}
                    onChange={(e) => setRule({ ...rule, action: { ...rule.action, quantity: parseInt(e.target.value) || 0 } })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Order Type</Label>
                  <Select
                    value={rule.action.orderType}
                    onValueChange={(value) => setRule({ ...rule, action: { ...rule.action, orderType: value as 'market' | 'limit' } })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market">Market</SelectItem>
                      <SelectItem value="limit">Limit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Execution Strategy */}
        {rule.action.type !== 'alert' && (
          <div className="space-y-3">
            <Label className="text-base font-semibold">Execution Strategy</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {['market', 'limit', 'twap', 'vwap', 'iceberg'].map((strategy) => (
                <Button
                  key={strategy}
                  variant={rule.executionStrategy === strategy ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRule({ ...rule, executionStrategy: strategy as TradingRule['executionStrategy'] })}
                >
                  {strategy.toUpperCase()}
                </Button>
              ))}
            </div>
            
            {(rule.executionStrategy === 'twap' || rule.executionStrategy === 'vwap') && (
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <Label>Duration (minutes):</Label>
                <Input
                  type="number"
                  className="w-[100px]"
                  value={rule.executionParams.duration || 30}
                  onChange={(e) => setRule({ 
                    ...rule, 
                    executionParams: { ...rule.executionParams, duration: parseInt(e.target.value) || 30 }
                  })}
                />
              </div>
            )}
            
            {rule.executionStrategy === 'iceberg' && (
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Label>Slices:</Label>
                  <Input
                    type="number"
                    className="w-[80px]"
                    value={rule.executionParams.slices || 5}
                    onChange={(e) => setRule({ 
                      ...rule, 
                      executionParams: { ...rule.executionParams, slices: parseInt(e.target.value) || 5 }
                    })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label>Display Qty:</Label>
                  <Input
                    type="number"
                    className="w-[80px]"
                    value={rule.executionParams.displayQty || 100}
                    onChange={(e) => setRule({ 
                      ...rule, 
                      executionParams: { ...rule.executionParams, displayQty: parseInt(e.target.value) || 100 }
                    })}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rule Preview */}
        <div className="p-4 bg-muted rounded-lg">
          <Label className="text-sm text-muted-foreground">Rule Preview:</Label>
          <p className="mt-1 font-medium">
            When {rule.conditions.map((c, i) => (
              <span key={c.id}>
                {i > 0 && <span className="text-primary"> {rule.logicOperator} </span>}
                <span className="text-primary">{c.symbol || '[SYMBOL]'}</span> {getConditionLabel(c.type)} {c.value}
              </span>
            ))}
            {' → '}
            <span className="text-green-500">
              {rule.action.type === 'alert' 
                ? 'Send Alert' 
                : `${rule.action.type.toUpperCase()} ${rule.action.quantity} shares (${rule.executionStrategy.toUpperCase()})`}
            </span>
          </p>
        </div>

        {/* Save Button */}
        <Button onClick={saveRule} disabled={isSaving} className="w-full">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Trading Rule
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
