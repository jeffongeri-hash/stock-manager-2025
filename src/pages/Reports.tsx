import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Mail, Send, Zap } from 'lucide-react';

const Reports = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    daily_report: false,
    weekly_report: false,
    monthly_report: false,
    email_address: '',
    zapier_webhook: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('report_settings')
      .select('*')
      .eq('user_id', user?.id)
      .single();

    if (data) {
      setSettings({
        daily_report: data.daily_report || false,
        weekly_report: data.weekly_report || false,
        monthly_report: data.monthly_report || false,
        email_address: data.email_address || '',
        zapier_webhook: data.zapier_webhook || ''
      });
    }
  };

  const saveSettings = async () => {
    setSaving(true);

    const { data: existing } = await supabase
      .from('report_settings')
      .select('id')
      .eq('user_id', user?.id)
      .single();

    let error;
    if (existing) {
      const result = await supabase
        .from('report_settings')
        .update(settings)
        .eq('user_id', user?.id);
      error = result.error;
    } else {
      const result = await supabase
        .from('report_settings')
        .insert({ ...settings, user_id: user?.id });
      error = result.error;
    }

    if (error) {
      toast.error('Failed to save settings');
    } else {
      toast.success('Report settings saved!');
    }

    setSaving(false);
  };

  const sendTestReport = async () => {
    if (!settings.zapier_webhook) {
      toast.error('Please add a Zapier webhook URL first');
      return;
    }

    try {
      const response = await fetch(settings.zapier_webhook, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'test_report',
          timestamp: new Date().toISOString(),
          message: 'This is a test trading report from MarketPulse'
        }),
      });

      toast.success('Test report sent to Zapier! Check your Zap history.');
    } catch (error) {
      toast.error('Failed to send test report');
    }
  };

  return (
    <PageLayout title="Automated Reports">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Reports
              </CardTitle>
              <CardDescription>Configure automated trading performance reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="trader@example.com"
                  value={settings.email_address}
                  onChange={(e) => setSettings({ ...settings, email_address: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Reports will be sent to this email address
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Daily Report</Label>
                    <p className="text-xs text-muted-foreground">Every day at 4:30 PM EST</p>
                  </div>
                  <Switch
                    checked={settings.daily_report}
                    onCheckedChange={(checked) => setSettings({ ...settings, daily_report: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Weekly Report</Label>
                    <p className="text-xs text-muted-foreground">Every Monday at 9:00 AM EST</p>
                  </div>
                  <Switch
                    checked={settings.weekly_report}
                    onCheckedChange={(checked) => setSettings({ ...settings, weekly_report: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Monthly Report</Label>
                    <p className="text-xs text-muted-foreground">First day of each month</p>
                  </div>
                  <Switch
                    checked={settings.monthly_report}
                    onCheckedChange={(checked) => setSettings({ ...settings, monthly_report: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Zapier Integration
              </CardTitle>
              <CardDescription>Connect to Zapier for automated workflows</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="zapier">Zapier Webhook URL</Label>
                <Input
                  id="zapier"
                  type="url"
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  value={settings.zapier_webhook}
                  onChange={(e) => setSettings({ ...settings, zapier_webhook: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Create a Zapier webhook trigger and paste the URL here
                </p>
              </div>

              <Button onClick={sendTestReport} variant="outline" className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Send Test Report
              </Button>
            </CardContent>
          </Card>

          <Button onClick={saveSettings} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>What's Included</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Daily Reports Include:</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Total P&L for the day</li>
                  <li>Number of trades executed</li>
                  <li>Win rate percentage</li>
                  <li>Top performing trades</li>
                  <li>Active positions summary</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Weekly Reports Include:</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Week-over-week performance</li>
                  <li>Weekly P&L breakdown</li>
                  <li>Best and worst trades</li>
                  <li>Strategy performance analysis</li>
                  <li>Risk metrics</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Monthly Reports Include:</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Comprehensive monthly performance</li>
                  <li>Month-over-month comparison</li>
                  <li>Strategy breakdown</li>
                  <li>Trade statistics and metrics</li>
                  <li>Goals and recommendations</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zapier Use Cases</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="mb-3 text-muted-foreground">
                Connect your trading reports to hundreds of apps with Zapier:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Send reports to Slack or Discord</li>
                <li>Save to Google Sheets for analysis</li>
                <li>Post to Twitter when hitting milestones</li>
                <li>Add to Notion or Evernote</li>
                <li>Trigger custom webhooks on P&L events</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default Reports;