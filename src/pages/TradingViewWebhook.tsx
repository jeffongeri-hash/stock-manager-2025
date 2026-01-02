import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Webhook, Copy, ExternalLink, CheckCircle, AlertCircle, Clock, Code } from 'lucide-react';

interface WebhookSignal {
  id: string;
  strategy_name: string;
  symbol: string;
  created_at: string;
  parameters?: {
    source?: string;
    action?: string;
    price?: number;
    timeframe?: string;
    entry_condition?: string;
    exit_condition?: string;
    received_at?: string;
  };
}

const TradingViewWebhook = () => {
  const { user } = useAuth();
  const [signals, setSignals] = useState<WebhookSignal[]>([]);
  const [loading, setLoading] = useState(true);

  const webhookUrl = `https://uvqrdzwimiszqkmyzbvf.functions.supabase.co/tradingview-webhook`;

  useEffect(() => {
    if (user) {
      fetchSignals();
    }
  }, [user]);

  const fetchSignals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('backtest_results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching signals:', error);
    } else {
      // Filter for TradingView webhook signals
      const webhookSignals = (data || []).filter((s: any) => 
        s.parameters?.source === 'tradingview_webhook'
      ).map((s: any) => ({
        id: s.id,
        strategy_name: s.strategy_name,
        symbol: s.symbol,
        created_at: s.created_at,
        parameters: s.parameters as WebhookSignal['parameters']
      }));
      setSignals(webhookSignals);
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const alertMessageTemplate = `{
  "symbol": "{{ticker}}",
  "action": "{{strategy.order.action}}",
  "price": {{close}},
  "strategy": "{{strategy.order.comment}}",
  "user_id": "${user?.id || 'YOUR_USER_ID'}",
  "timeframe": "{{interval}}",
  "entry_condition": "Signal from {{ticker}} at {{time}}"
}`;

  const testWebhook = async () => {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: 'TEST',
          action: 'buy',
          price: 100,
          strategy: 'Test Signal',
          user_id: user?.id,
          timeframe: '1D',
          entry_condition: 'Manual test'
        })
      });

      if (response.ok) {
        toast.success('Test webhook sent successfully!');
        setTimeout(fetchSignals, 1000);
      } else {
        toast.error('Webhook test failed');
      }
    } catch (error) {
      console.error('Test webhook error:', error);
      toast.error('Failed to send test webhook');
    }
  };

  return (
    <PageLayout title="TradingView Webhook Integration">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Webhook Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-lg font-semibold">Active</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Signals Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{signals.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Signal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {signals[0] ? new Date(signals[0].created_at).toLocaleString() : 'No signals yet'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="setup" className="space-y-4">
        <TabsList>
          <TabsTrigger value="setup">Setup Guide</TabsTrigger>
          <TabsTrigger value="signals">Signal History</TabsTrigger>
          <TabsTrigger value="test">Test Webhook</TabsTrigger>
        </TabsList>

        <TabsContent value="setup">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Your Webhook URL
                </CardTitle>
                <CardDescription>Use this URL in your TradingView alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input value={webhookUrl} readOnly className="font-mono text-sm" />
                  <Button variant="outline" onClick={() => copyToClipboard(webhookUrl)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Alert Message Template
                </CardTitle>
                <CardDescription>Copy this JSON into your TradingView alert message</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
                    {alertMessageTemplate}
                  </pre>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(alertMessageTemplate)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Setup Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5">1</Badge>
                    <div>
                      <p className="font-medium">Open TradingView and create an alert</p>
                      <p className="text-sm text-muted-foreground">Go to your chart and click on the alert icon or press Alt+A</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5">2</Badge>
                    <div>
                      <p className="font-medium">Set your alert conditions</p>
                      <p className="text-sm text-muted-foreground">Configure when the alert should trigger based on your strategy</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5">3</Badge>
                    <div>
                      <p className="font-medium">Enable Webhook URL</p>
                      <p className="text-sm text-muted-foreground">Check "Webhook URL" and paste your webhook URL from above</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5">4</Badge>
                    <div>
                      <p className="font-medium">Set the alert message</p>
                      <p className="text-sm text-muted-foreground">Paste the JSON template into the "Message" field</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5">5</Badge>
                    <div>
                      <p className="font-medium">Create the alert</p>
                      <p className="text-sm text-muted-foreground">Click "Create" and your signals will appear here automatically</p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>Note:</strong> TradingView webhooks require a paid plan (Pro, Pro+ or Premium).
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="signals">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Signal History</CardTitle>
                <CardDescription>Recent signals received from TradingView</CardDescription>
              </div>
              <Button variant="outline" onClick={fetchSignals}>
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">Loading signals...</p>
                ) : signals.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No webhook signals received yet</p>
                    <p className="text-sm text-muted-foreground mt-2">Set up your TradingView alerts to start receiving signals</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {signals.map((signal) => (
                      <div key={signal.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{signal.symbol}</Badge>
                            <Badge variant={signal.parameters?.action === 'buy' ? 'default' : 'destructive'}>
                              {signal.parameters?.action?.toUpperCase() || 'SIGNAL'}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(signal.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{signal.strategy_name}</p>
                        {signal.parameters?.price && (
                          <p className="text-sm text-muted-foreground">Price: ${signal.parameters.price}</p>
                        )}
                        {signal.parameters?.timeframe && (
                          <p className="text-sm text-muted-foreground">Timeframe: {signal.parameters.timeframe}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Test Your Webhook</CardTitle>
              <CardDescription>Send a test signal to verify your webhook is working</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Click the button below to send a test signal. This will create a test entry in your signal history.
              </p>
              <Button onClick={testWebhook}>
                <Webhook className="h-4 w-4 mr-2" />
                Send Test Signal
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default TradingViewWebhook;
