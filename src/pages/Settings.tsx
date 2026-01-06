
import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell, Globe, Lock, User, Settings as SettingsIcon, Landmark } from 'lucide-react';
import { toast } from 'sonner';
import { IBKRConnection } from '@/components/brokers/IBKRConnection';
import { SchwabConnection } from '@/components/brokers/SchwabConnection';

type SettingsTab = 'account' | 'notifications' | 'security' | 'regional' | 'preferences' | 'brokers';

const Settings = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [formData, setFormData] = useState({
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    phone: '+1 (555) 123-4567',
    darkMode: false,
    compactView: true,
    emailNotifications: true,
    priceAlerts: true,
    newsUpdates: false,
    twoFactorAuth: false,
    timezone: 'America/New_York',
    currency: 'USD',
    language: 'en'
  });

  const handleSave = () => {
    toast.success('Settings saved successfully!');
  };
  return (
    <PageLayout title="Settings">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg p-6 shadow">
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            <nav className="space-y-2">
              <Button 
                variant={activeTab === 'account' ? 'secondary' : 'ghost'} 
                className="w-full justify-start" 
                size="lg"
                onClick={() => setActiveTab('account')}
              >
                <User className="mr-2 h-5 w-5" />
                Account
              </Button>
              <Button 
                variant={activeTab === 'notifications' ? 'secondary' : 'ghost'} 
                className="w-full justify-start" 
                size="lg"
                onClick={() => setActiveTab('notifications')}
              >
                <Bell className="mr-2 h-5 w-5" />
                Notifications
              </Button>
              <Button 
                variant={activeTab === 'security' ? 'secondary' : 'ghost'} 
                className="w-full justify-start" 
                size="lg"
                onClick={() => setActiveTab('security')}
              >
                <Lock className="mr-2 h-5 w-5" />
                Security
              </Button>
              <Button 
                variant={activeTab === 'regional' ? 'secondary' : 'ghost'} 
                className="w-full justify-start" 
                size="lg"
                onClick={() => setActiveTab('regional')}
              >
                <Globe className="mr-2 h-5 w-5" />
                Regional Settings
              </Button>
              <Button 
                variant={activeTab === 'preferences' ? 'secondary' : 'ghost'} 
                className="w-full justify-start" 
                size="lg"
                onClick={() => setActiveTab('preferences')}
              >
                <SettingsIcon className="mr-2 h-5 w-5" />
                Preferences
              </Button>
              <Button 
                variant={activeTab === 'brokers' ? 'secondary' : 'ghost'} 
                className="w-full justify-start" 
                size="lg"
                onClick={() => setActiveTab('brokers')}
              >
                <Landmark className="mr-2 h-5 w-5" />
                Broker Connections
              </Button>
            </nav>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg p-6 shadow">
            {activeTab === 'account' && (
              <>
                <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input 
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input 
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input 
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button onClick={handleSave}>Save Changes</Button>
                    <Button variant="outline" className="ml-2">Cancel</Button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'notifications' && (
              <>
                <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                    <Switch 
                      checked={formData.emailNotifications}
                      onCheckedChange={(checked) => setFormData({...formData, emailNotifications: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Price Alerts</p>
                      <p className="text-sm text-muted-foreground">Get notified when stocks hit your target prices</p>
                    </div>
                    <Switch 
                      checked={formData.priceAlerts}
                      onCheckedChange={(checked) => setFormData({...formData, priceAlerts: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">News Updates</p>
                      <p className="text-sm text-muted-foreground">Receive market news and analysis</p>
                    </div>
                    <Switch 
                      checked={formData.newsUpdates}
                      onCheckedChange={(checked) => setFormData({...formData, newsUpdates: checked})}
                    />
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button onClick={handleSave}>Save Changes</Button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'security' && (
              <>
                <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Password</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input id="currentPassword" type="password" />
                      </div>
                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input id="newPassword" type="password" />
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input id="confirmPassword" type="password" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                    </div>
                    <Switch 
                      checked={formData.twoFactorAuth}
                      onCheckedChange={(checked) => setFormData({...formData, twoFactorAuth: checked})}
                    />
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button onClick={handleSave}>Save Changes</Button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'regional' && (
              <>
                <h2 className="text-xl font-semibold mb-6">Regional Settings</h2>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input 
                      id="timezone"
                      value={formData.timezone}
                      onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Input 
                      id="currency"
                      value={formData.currency}
                      onChange={(e) => setFormData({...formData, currency: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Input 
                      id="language"
                      value={formData.language}
                      onChange={(e) => setFormData({...formData, language: e.target.value})}
                    />
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button onClick={handleSave}>Save Changes</Button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'preferences' && (
              <>
                <h2 className="text-xl font-semibold mb-6">Display Preferences</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Compact View</p>
                      <p className="text-sm text-muted-foreground">Show more data with less spacing</p>
                    </div>
                    <Switch 
                      checked={formData.compactView}
                      onCheckedChange={(checked) => setFormData({...formData, compactView: checked})}
                    />
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button onClick={handleSave}>Save Changes</Button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'brokers' && (
              <>
                <h2 className="text-xl font-semibold mb-6">Broker Connections</h2>
                <div className="space-y-6">
                  <SchwabConnection />
                  <IBKRConnection />
                  
                  <div className="text-sm text-muted-foreground border-t pt-4">
                    <p>Connect your brokerage accounts to:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>View live portfolio positions and balances</li>
                      <li>Execute trades directly from the app</li>
                      <li>Sync your trading activity automatically</li>
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Settings;
