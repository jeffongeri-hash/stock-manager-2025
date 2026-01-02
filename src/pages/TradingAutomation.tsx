import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Bot, Play, Pause, Plus, Trash2, Settings2, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface TradingRule {
  id: string;
  name: string;
  active: boolean;
  condition: {
    type: 'price_above' | 'price_below' | 'rsi_above' | 'rsi_below' | 'ma_crossover' | 'volume_spike';
    symbol: string;
    value: number;
    timeframe: string;
  };
  action: {
    type: 'buy' | 'sell' | 'alert';
    quantity: number;
    orderType: 'market' | 'limit';
  };
  lastTriggered?: string;
  triggerCount: number;
}

const defaultRules: TradingRule[] = [
  {
    id: '1',
    name: 'SPY RSI Oversold Alert',
    active: true,
    condition: { type: 'rsi_below', symbol: 'SPY', value: 30, timeframe: '1D' },
    action: { type: 'alert', quantity: 0, orderType: 'market' },
    triggerCount: 5,
    lastTriggered: '2024-01-15T10:30:00'
  },
  {
    id: '2',
    name: 'AAPL Price Breakout',
    active: false,
    condition: { type: 'price_above', symbol: 'AAPL', value: 200, timeframe: '1H' },
    action: { type: 'buy', quantity: 10, orderType: 'limit' },
    triggerCount: 0
  }
];

const TradingAutomation = () => {
  const [rules, setRules] = useState<TradingRule[]>(defaultRules);
  const [showNewRule, setShowNewRule] = useState(false);
  const [newRule, setNewRule] = useState<Partial<TradingRule>>({
    name: '',
    active: true,
    condition: { type: 'price_above', symbol: '', value: 0, timeframe: '1D' },
    action: { type: 'alert', quantity: 0, orderType: 'market' }
  });

  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, active: !r.active } : r));
    toast.success(`Rule ${rules.find(r => r.id === id)?.active ? 'paused' : 'activated'}`);
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
    toast.success('Rule deleted');
  };

  const addRule = () => {
    if (!newRule.name || !newRule.condition?.symbol) {
      toast.error('Please fill in required fields');
      return;
    }

    const rule: TradingRule = {
      id: Date.now().toString(),
      name: newRule.name!,
      active: true,
      condition: newRule.condition as TradingRule['condition'],
      action: newRule.action as TradingRule['action'],
      triggerCount: 0
    };

    setRules([...rules, rule]);
    setShowNewRule(false);
    setNewRule({
      name: '',
      active: true,
      condition: { type: 'price_above', symbol: '', value: 0, timeframe: '1D' },
      action: { type: 'alert', quantity: 0, orderType: 'market' }
    });
    toast.success('Trading rule created');
  };

  const getConditionLabel = (condition: TradingRule['condition']) => {
    const labels: Record<string, string> = {
      'price_above': `${condition.symbol} price > $${condition.value}`,
      'price_below': `${condition.symbol} price < $${condition.value}`,
      'rsi_above': `${condition.symbol} RSI > ${condition.value}`,
      'rsi_below': `${condition.symbol} RSI < ${condition.value}`,
      'ma_crossover': `${condition.symbol} MA crossover`,
      'volume_spike': `${condition.symbol} volume spike > ${condition.value}%`
    };
    return labels[condition.type] || 'Custom condition';
  };

  const getActionLabel = (action: TradingRule['action']) => {
    if (action.type === 'alert') return 'Send Alert';
    return `${action.type.toUpperCase()} ${action.quantity} shares (${action.orderType})`;
  };

  return (
    <PageLayout title="Trading Automation">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rules.filter(r => r.active).length}</div>
            <p className="text-xs text-muted-foreground">of {rules.length} total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Triggers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rules.reduce((sum, r) => sum + r.triggerCount, 0)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Automation Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-lg font-semibold">Running</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">
              {rules.find(r => r.lastTriggered)?.lastTriggered 
                ? new Date(rules.find(r => r.lastTriggered)!.lastTriggered!).toLocaleString()
                : 'No activity yet'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Trading Rules
            </CardTitle>
            <CardDescription>Create automated trading rules like Capitalise.ai</CardDescription>
          </div>
          <Button onClick={() => setShowNewRule(!showNewRule)}>
            <Plus className="h-4 w-4 mr-2" />
            New Rule
          </Button>
        </CardHeader>
        <CardContent>
          {showNewRule && (
            <Card className="mb-6 border-dashed">
              <CardHeader>
                <CardTitle className="text-base">Create New Rule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Rule Name</Label>
                  <Input 
                    placeholder="My Trading Rule"
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label>Condition Type</Label>
                    <Select 
                      value={newRule.condition?.type}
                      onValueChange={(value) => setNewRule({ 
                        ...newRule, 
                        condition: { ...newRule.condition!, type: value as any }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="price_above">Price Above</SelectItem>
                        <SelectItem value="price_below">Price Below</SelectItem>
                        <SelectItem value="rsi_above">RSI Above</SelectItem>
                        <SelectItem value="rsi_below">RSI Below</SelectItem>
                        <SelectItem value="ma_crossover">MA Crossover</SelectItem>
                        <SelectItem value="volume_spike">Volume Spike</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Symbol</Label>
                    <Input 
                      placeholder="SPY"
                      value={newRule.condition?.symbol}
                      onChange={(e) => setNewRule({ 
                        ...newRule, 
                        condition: { ...newRule.condition!, symbol: e.target.value.toUpperCase() }
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label>Value</Label>
                    <Input 
                      type="number"
                      placeholder="100"
                      value={newRule.condition?.value || ''}
                      onChange={(e) => setNewRule({ 
                        ...newRule, 
                        condition: { ...newRule.condition!, value: parseFloat(e.target.value) }
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label>Timeframe</Label>
                    <Select 
                      value={newRule.condition?.timeframe}
                      onValueChange={(value) => setNewRule({ 
                        ...newRule, 
                        condition: { ...newRule.condition!, timeframe: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1m">1 Minute</SelectItem>
                        <SelectItem value="5m">5 Minutes</SelectItem>
                        <SelectItem value="15m">15 Minutes</SelectItem>
                        <SelectItem value="1H">1 Hour</SelectItem>
                        <SelectItem value="4H">4 Hours</SelectItem>
                        <SelectItem value="1D">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Action Type</Label>
                    <Select 
                      value={newRule.action?.type}
                      onValueChange={(value) => setNewRule({ 
                        ...newRule, 
                        action: { ...newRule.action!, type: value as any }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alert">Send Alert</SelectItem>
                        <SelectItem value="buy">Buy Order</SelectItem>
                        <SelectItem value="sell">Sell Order</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {newRule.action?.type !== 'alert' && (
                    <>
                      <div>
                        <Label>Quantity</Label>
                        <Input 
                          type="number"
                          placeholder="10"
                          value={newRule.action?.quantity || ''}
                          onChange={(e) => setNewRule({ 
                            ...newRule, 
                            action: { ...newRule.action!, quantity: parseInt(e.target.value) }
                          })}
                        />
                      </div>
                      <div>
                        <Label>Order Type</Label>
                        <Select 
                          value={newRule.action?.orderType}
                          onValueChange={(value) => setNewRule({ 
                            ...newRule, 
                            action: { ...newRule.action!, orderType: value as any }
                          })}
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

                <div className="flex gap-2">
                  <Button onClick={addRule}>Create Rule</Button>
                  <Button variant="outline" onClick={() => setShowNewRule(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {rules.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No trading rules yet</p>
              <p className="text-sm text-muted-foreground">Create your first automated trading rule</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className={`border rounded-lg p-4 ${rule.active ? 'border-green-500/50 bg-green-500/5' : 'opacity-60'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={rule.active}
                        onCheckedChange={() => toggleRule(rule.id)}
                      />
                      <h3 className="font-semibold">{rule.name}</h3>
                      <Badge variant={rule.active ? 'default' : 'secondary'}>
                        {rule.active ? 'Active' : 'Paused'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => deleteRule(rule.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-muted/50 rounded p-3">
                      <p className="text-muted-foreground text-xs mb-1">WHEN</p>
                      <p className="font-medium">{getConditionLabel(rule.condition)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Timeframe: {rule.condition.timeframe}</p>
                    </div>
                    
                    <div className="bg-muted/50 rounded p-3">
                      <p className="text-muted-foreground text-xs mb-1">THEN</p>
                      <p className="font-medium flex items-center gap-1">
                        {rule.action.type === 'buy' && <TrendingUp className="h-4 w-4 text-green-500" />}
                        {rule.action.type === 'sell' && <TrendingDown className="h-4 w-4 text-red-500" />}
                        {rule.action.type === 'alert' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                        {getActionLabel(rule.action)}
                      </p>
                    </div>
                    
                    <div className="bg-muted/50 rounded p-3">
                      <p className="text-muted-foreground text-xs mb-1">STATS</p>
                      <p className="font-medium">{rule.triggerCount} triggers</p>
                      {rule.lastTriggered && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last: {new Date(rule.lastTriggered).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About Trading Automation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Create "if-this-then-that" style trading rules that automatically monitor the market and execute actions when conditions are met.
          </p>
          <div className="bg-yellow-500/10 p-4 rounded-lg">
            <p className="text-yellow-700 dark:text-yellow-400">
              <strong>⚠️ Paper Trading Mode:</strong> Currently, all trading actions are simulated. 
              To enable live trading, you'll need to connect a broker API (like Alpaca, TD Ameritrade, or Interactive Brokers).
            </p>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default TradingAutomation;
