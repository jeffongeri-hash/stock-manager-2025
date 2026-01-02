import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Bot, Plus, Trash2, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Clock, Link2, ExternalLink, Unlink, Settings, Sparkles, Star, BarChart3 } from 'lucide-react';
import { NaturalLanguageRuleBuilder } from '@/components/trading/NaturalLanguageRuleBuilder';
import { StrategyTemplateLibrary, StrategyTemplate } from '@/components/trading/StrategyTemplateLibrary';
import { RuleBacktester } from '@/components/trading/RuleBacktester';

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

interface BrokerConnection {
  id: string;
  name: string;
  type: 'interactive_brokers' | 'alpaca' | 'td_ameritrade' | 'capitalise_ai';
  status: 'connected' | 'disconnected' | 'pending';
  accountId?: string;
  lastSync?: string;
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
  const [brokerConnections, setBrokerConnections] = useState<BrokerConnection[]>([]);
  const [showBrokerSetup, setShowBrokerSetup] = useState(false);
  const [selectedTemplateText, setSelectedTemplateText] = useState('');
  const [currentRuleText, setCurrentRuleText] = useState('');
  const [currentParsedRule, setCurrentParsedRule] = useState<any>(null);
  const [ibCredentials, setIbCredentials] = useState({ 
    username: '', 
    accountId: '',
    capitaliseApiKey: ''
  });
  const [newRule, setNewRule] = useState<Partial<TradingRule>>({
    name: '',
    active: true,
    condition: { type: 'price_above', symbol: '', value: 0, timeframe: '1D' },
    action: { type: 'alert', quantity: 0, orderType: 'market' }
  });

  const handleTemplateSelect = (template: StrategyTemplate) => {
    setSelectedTemplateText(template.ruleText);
  };

  const handleRuleTextChange = (text: string, parsedRule: any) => {
    setCurrentRuleText(text);
    setCurrentParsedRule(parsedRule);
  };

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

  const connectBroker = (type: BrokerConnection['type']) => {
    if (type === 'interactive_brokers' || type === 'capitalise_ai') {
      if (!ibCredentials.username || !ibCredentials.accountId) {
        toast.error('Please enter your IBKR credentials');
        return;
      }
    }

    const newConnection: BrokerConnection = {
      id: Date.now().toString(),
      name: type === 'interactive_brokers' ? 'Interactive Brokers' : 
            type === 'capitalise_ai' ? 'Capitalise.ai (IBKR)' : 
            type === 'alpaca' ? 'Alpaca' : 'TD Ameritrade',
      type,
      status: 'pending',
      accountId: ibCredentials.accountId || undefined
    };

    setBrokerConnections([...brokerConnections, newConnection]);
    
    // Simulate connection process
    setTimeout(() => {
      setBrokerConnections(prev => prev.map(conn => 
        conn.id === newConnection.id 
          ? { ...conn, status: 'connected' as const, lastSync: new Date().toISOString() }
          : conn
      ));
      toast.success(`${newConnection.name} connected successfully!`);
    }, 2000);

    setShowBrokerSetup(false);
    setIbCredentials({ username: '', accountId: '', capitaliseApiKey: '' });
    toast.info('Connecting to broker...');
  };

  const disconnectBroker = (id: string) => {
    setBrokerConnections(brokerConnections.filter(c => c.id !== id));
    toast.success('Broker disconnected');
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

  const hasLiveBroker = brokerConnections.some(c => c.status === 'connected');

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
            <CardTitle className="text-sm font-medium">Broker Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {hasLiveBroker ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-lg font-semibold">Connected</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <span className="text-lg font-semibold">Paper Mode</span>
                </>
              )}
            </div>
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

      <Tabs defaultValue="ai-builder" className="space-y-6">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="ai-builder" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Rule Builder
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="backtest" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Backtest
          </TabsTrigger>
          <TabsTrigger value="rules">Trading Rules</TabsTrigger>
          <TabsTrigger value="brokers">Broker Connections</TabsTrigger>
          <TabsTrigger value="capitalise">Capitalise.ai Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="ai-builder">
          <NaturalLanguageRuleBuilder 
            initialRuleText={selectedTemplateText}
            onRuleCreated={(rule) => {
              setRules([...rules, rule]);
              setSelectedTemplateText('');
            }}
            onRuleTextChange={handleRuleTextChange}
          />
        </TabsContent>

        <TabsContent value="templates">
          <StrategyTemplateLibrary onSelectTemplate={handleTemplateSelect} />
        </TabsContent>

        <TabsContent value="backtest">
          <RuleBacktester 
            ruleText={currentRuleText} 
            ruleName={currentParsedRule?.name}
          />
        </TabsContent>

        <TabsContent value="rules">
          <Card>
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

                    {!hasLiveBroker && newRule.action?.type !== 'alert' && (
                      <div className="bg-yellow-500/10 p-3 rounded-lg">
                        <p className="text-sm text-yellow-700 dark:text-yellow-400">
                          ⚠️ No broker connected. Orders will be simulated until you connect a broker.
                        </p>
                      </div>
                    )}

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
        </TabsContent>

        <TabsContent value="brokers">
          <div className="grid gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5" />
                    Connected Brokers
                  </CardTitle>
                  <CardDescription>Manage your broker connections for live trading</CardDescription>
                </div>
                <Button onClick={() => setShowBrokerSetup(!showBrokerSetup)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Broker
                </Button>
              </CardHeader>
              <CardContent>
                {showBrokerSetup && (
                  <Card className="mb-6 border-dashed">
                    <CardHeader>
                      <CardTitle className="text-base">Connect a Broker</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>IBKR Username</Label>
                          <Input 
                            placeholder="Your Interactive Brokers username"
                            value={ibCredentials.username}
                            onChange={(e) => setIbCredentials({ ...ibCredentials, username: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Account ID</Label>
                          <Input 
                            placeholder="Your IBKR Account ID (e.g., U1234567)"
                            value={ibCredentials.accountId}
                            onChange={(e) => setIbCredentials({ ...ibCredentials, accountId: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button onClick={() => connectBroker('interactive_brokers')} className="w-full">
                          <Link2 className="h-4 w-4 mr-2" />
                          Connect Interactive Brokers
                        </Button>
                        <Button onClick={() => connectBroker('capitalise_ai')} variant="outline" className="w-full">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Connect via Capitalise.ai
                        </Button>
                      </div>

                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">or connect other brokers</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" onClick={() => connectBroker('alpaca')}>
                          Connect Alpaca
                        </Button>
                        <Button variant="outline" onClick={() => connectBroker('td_ameritrade')}>
                          Connect TD Ameritrade
                        </Button>
                      </div>

                      <Button variant="ghost" className="w-full" onClick={() => setShowBrokerSetup(false)}>
                        Cancel
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {brokerConnections.length === 0 ? (
                  <div className="text-center py-12">
                    <Link2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No brokers connected</p>
                    <p className="text-sm text-muted-foreground">Connect a broker to enable live trading</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {brokerConnections.map((broker) => (
                      <div key={broker.id} className="border rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${
                            broker.status === 'connected' ? 'bg-green-500' : 
                            broker.status === 'pending' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                          }`} />
                          <div>
                            <h3 className="font-semibold">{broker.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {broker.accountId && `Account: ${broker.accountId}`}
                              {broker.lastSync && ` • Last sync: ${new Date(broker.lastSync).toLocaleString()}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={broker.status === 'connected' ? 'default' : 'secondary'}>
                            {broker.status === 'connected' ? 'Connected' : 
                             broker.status === 'pending' ? 'Connecting...' : 'Disconnected'}
                          </Badge>
                          <Button variant="ghost" size="sm" onClick={() => disconnectBroker(broker.id)}>
                            <Unlink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Supported Brokers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="border rounded-lg p-4 text-center">
                    <h3 className="font-semibold mb-2">Interactive Brokers</h3>
                    <p className="text-xs text-muted-foreground">Professional trading platform with global market access</p>
                    <Badge className="mt-2">Recommended</Badge>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <h3 className="font-semibold mb-2">Capitalise.ai</h3>
                    <p className="text-xs text-muted-foreground">Connect IBKR via natural language automation</p>
                    <Badge variant="outline" className="mt-2">Via IBKR</Badge>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <h3 className="font-semibold mb-2">Alpaca</h3>
                    <p className="text-xs text-muted-foreground">Commission-free trading API for stocks</p>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <h3 className="font-semibold mb-2">TD Ameritrade</h3>
                    <p className="text-xs text-muted-foreground">Full-featured brokerage with API access</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="capitalise">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Capitalise.ai Integration
                </CardTitle>
                <CardDescription>
                  Connect your Interactive Brokers account through Capitalise.ai for natural language trading automation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">What is Capitalise.ai?</h4>
                  <p className="text-sm text-muted-foreground">
                    Capitalise.ai is a trading automation platform that connects to Interactive Brokers and allows you to create 
                    trading strategies using natural language. Once connected, your rules here can be executed automatically 
                    through your IBKR account.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Setup Steps</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-0.5">1</Badge>
                      <div>
                        <p className="font-medium">Create a Capitalise.ai Account</p>
                        <p className="text-sm text-muted-foreground">Sign up at capitalise.ai and connect your IBKR account</p>
                        <Button variant="link" className="p-0 h-auto text-sm" onClick={() => window.open('https://capitalise.ai', '_blank')}>
                          Visit Capitalise.ai <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-0.5">2</Badge>
                      <div>
                        <p className="font-medium">Link Your Interactive Brokers Account</p>
                        <p className="text-sm text-muted-foreground">In Capitalise.ai, connect to your IBKR account using OAuth</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-0.5">3</Badge>
                      <div>
                        <p className="font-medium">Get Your API Credentials</p>
                        <p className="text-sm text-muted-foreground">Generate API keys in Capitalise.ai for external integrations</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-0.5">4</Badge>
                      <div>
                        <p className="font-medium">Connect Here</p>
                        <p className="text-sm text-muted-foreground">Enter your credentials in the Broker Connections tab</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-4">Quick Connect</h4>
                  <div className="space-y-4">
                    <div>
                      <Label>Capitalise.ai API Key (Optional)</Label>
                      <Input 
                        type="password"
                        placeholder="Your Capitalise.ai API key"
                        value={ibCredentials.capitaliseApiKey}
                        onChange={(e) => setIbCredentials({ ...ibCredentials, capitaliseApiKey: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Found in your Capitalise.ai account settings</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>IBKR Username</Label>
                        <Input 
                          placeholder="IBKR username"
                          value={ibCredentials.username}
                          onChange={(e) => setIbCredentials({ ...ibCredentials, username: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>IBKR Account ID</Label>
                        <Input 
                          placeholder="U1234567"
                          value={ibCredentials.accountId}
                          onChange={(e) => setIbCredentials({ ...ibCredentials, accountId: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button onClick={() => connectBroker('capitalise_ai')} className="w-full">
                      <Link2 className="h-4 w-4 mr-2" />
                      Connect via Capitalise.ai
                    </Button>
                  </div>
                </div>

                <div className="bg-blue-500/10 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">💡 How It Works</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                    <li>• Rules you create here are converted to Capitalise.ai strategies</li>
                    <li>• When conditions are met, orders execute through your IBKR account</li>
                    <li>• You can also manage strategies directly in Capitalise.ai's interface</li>
                    <li>• Natural language rules like "If AAPL drops 5%, buy 10 shares" are supported</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Interactive Brokers Direct Setup</CardTitle>
                <CardDescription>Alternative: Connect directly to IBKR without Capitalise.ai</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-500/10 p-4 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    <strong>Requirements:</strong> Direct IBKR integration requires running the IB Gateway or TWS (Trader Workstation) 
                    on a server. For most users, we recommend using Capitalise.ai for easier setup.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline">1</Badge>
                    <div>
                      <p className="font-medium">Download IB Gateway</p>
                      <p className="text-sm text-muted-foreground">Get the IB Gateway software from Interactive Brokers</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline">2</Badge>
                    <div>
                      <p className="font-medium">Enable API Connections</p>
                      <p className="text-sm text-muted-foreground">Configure API settings in IB Gateway/TWS</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline">3</Badge>
                    <div>
                      <p className="font-medium">Enter Connection Details</p>
                      <p className="text-sm text-muted-foreground">Provide your IBKR credentials and API port</p>
                    </div>
                  </div>
                </div>

                <Button variant="outline" onClick={() => window.open('https://www.interactivebrokers.com/en/trading/ib-api.php', '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View IBKR API Documentation
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default TradingAutomation;
