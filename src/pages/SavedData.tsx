import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { 
  Database, 
  Trash2, 
  Eye, 
  Download, 
  RefreshCw,
  FileJson,
  Calendar,
  HardDrive,
  AlertCircle
} from 'lucide-react';

interface SavedSetting {
  id: string;
  page_name: string;
  settings_data: unknown;
  created_at: string;
  updated_at: string;
}

const PAGE_NAME_MAP: Record<string, { label: string; route: string }> = {
  'retirement-planning': { label: 'Retirement Planning', route: '/retirement-planning' },
  'backtesting': { label: 'Backtesting', route: '/backtesting' },
  'trading-automation': { label: 'Trading Automation', route: '/trading-automation' },
  'portfolio': { label: 'Portfolio', route: '/portfolio' },
  'watchlist': { label: 'Watchlist', route: '/watchlist' },
};

const SavedData = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SavedSetting[]>([]);
  const [localSettings, setLocalSettings] = useState<{ key: string; data: unknown; savedAt: string | null }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLocalKey, setDeleteLocalKey] = useState<string | null>(null);
  const [viewData, setViewData] = useState<{ title: string; data: unknown } | null>(null);

  useEffect(() => {
    loadAllSettings();
  }, [user]);

  const loadAllSettings = async () => {
    setIsLoading(true);
    
    // Load from Supabase for authenticated users
    if (user) {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .order('updated_at', { ascending: false });
        
        if (error) throw error;
        setSettings(data || []);
      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error('Failed to load saved settings');
      }
    }
    
    // Load from localStorage (works for both guests and authenticated users)
    const localData: { key: string; data: unknown; savedAt: string | null }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('settings_')) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored);
            localData.push({
              key: key.replace('settings_', ''),
              data: parsed.settings,
              savedAt: parsed.savedAt || null
            });
          }
        } catch {
          // Skip invalid entries
        }
      }
    }
    setLocalSettings(localData);
    setIsLoading(false);
  };

  const deleteCloudSetting = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_settings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Setting deleted successfully');
      loadAllSettings();
    } catch (error) {
      console.error('Error deleting setting:', error);
      toast.error('Failed to delete setting');
    }
    setDeleteId(null);
  };

  const deleteLocalSetting = (key: string) => {
    try {
      localStorage.removeItem(`settings_${key}`);
      toast.success('Local setting deleted');
      loadAllSettings();
    } catch (error) {
      console.error('Error deleting local setting:', error);
      toast.error('Failed to delete local setting');
    }
    setDeleteLocalKey(null);
  };

  const exportAllData = () => {
    const exportData = {
      cloudSettings: settings.map(s => ({
        page: s.page_name,
        data: s.settings_data,
        updatedAt: s.updated_at
      })),
      localSettings: localSettings.map(s => ({
        page: s.key,
        data: s.data,
        savedAt: s.savedAt
      })),
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profit-pathway-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPageInfo = (pageName: string) => {
    return PAGE_NAME_MAP[pageName] || { label: pageName, route: '/' };
  };

  const calculateDataSize = (data: unknown): string => {
    const bytes = new Blob([JSON.stringify(data)]).size;
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  if (loading) {
    return <PageLayout title="Saved Data"><div>Loading...</div></PageLayout>;
  }

  const totalCloudItems = settings.length;
  const totalLocalItems = localSettings.length;

  return (
    <PageLayout title="Saved Data Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Database className="h-8 w-8 text-primary" />
              Saved Data
            </h1>
            <p className="text-muted-foreground">
              View and manage all your saved settings and calculations across pages
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadAllSettings} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={exportAllData} disabled={totalCloudItems + totalLocalItems === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cloud Settings</p>
                  <p className="text-2xl font-bold">{totalCloudItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <HardDrive className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Local Settings</p>
                  <p className="text-2xl font-bold">{totalLocalItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <FileJson className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold">{totalCloudItems + totalLocalItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cloud Settings */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Cloud Settings
              </CardTitle>
              <CardDescription>
                Settings synced to your account across all devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {settings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No cloud settings saved yet.</p>
                  <p className="text-sm">Your saved settings from pages like Retirement Planning will appear here.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settings.map((setting) => {
                      const pageInfo = getPageInfo(setting.page_name);
                      return (
                        <TableRow key={setting.id}>
                          <TableCell>
                            <button
                              onClick={() => navigate(pageInfo.route)}
                              className="font-medium hover:text-primary hover:underline"
                            >
                              {pageInfo.label}
                            </button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {formatDate(setting.updated_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {calculateDataSize(setting.settings_data)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewData({ 
                                  title: pageInfo.label, 
                                  data: setting.settings_data 
                                })}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteId(setting.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Local Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Local Settings
              {!user && <Badge variant="outline">Guest Mode</Badge>}
            </CardTitle>
            <CardDescription>
              Settings stored in your browser's local storage
            </CardDescription>
          </CardHeader>
          <CardContent>
            {localSettings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No local settings saved.</p>
                {!user && (
                  <p className="text-sm mt-2">
                    Sign in to sync your settings across devices.
                  </p>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>Last Saved</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localSettings.map((setting) => {
                    const pageInfo = getPageInfo(setting.key);
                    return (
                      <TableRow key={setting.key}>
                        <TableCell>
                          <button
                            onClick={() => navigate(pageInfo.route)}
                            className="font-medium hover:text-primary hover:underline"
                          >
                            {pageInfo.label}
                          </button>
                        </TableCell>
                        <TableCell>
                          {setting.savedAt ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {formatDate(setting.savedAt)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Unknown</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {calculateDataSize(setting.data)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewData({ 
                                title: pageInfo.label, 
                                data: setting.data 
                              })}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteLocalKey(setting.key)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* View Data Dialog */}
        <Dialog open={!!viewData} onOpenChange={() => setViewData(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewData?.title} Settings</DialogTitle>
              <DialogDescription>
                Raw JSON data for this saved setting
              </DialogDescription>
            </DialogHeader>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
              {JSON.stringify(viewData?.data, null, 2)}
            </pre>
          </DialogContent>
        </Dialog>

        {/* Delete Cloud Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Cloud Setting?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this saved setting from your account.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteId && deleteCloudSetting(deleteId)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Local Confirmation */}
        <AlertDialog open={!!deleteLocalKey} onOpenChange={() => setDeleteLocalKey(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Local Setting?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove this setting from your browser's local storage.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteLocalKey && deleteLocalSetting(deleteLocalKey)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageLayout>
  );
};

export default SavedData;
