import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  Link2, 
  Link2Off, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  Wallet,
  TrendingUp
} from 'lucide-react';

interface BrokerAccount {
  accountId: string;
  accountTitle?: string;
  accountType?: string;
  currency?: string;
  summary?: {
    netLiquidation?: { amount: number };
    totalCashValue?: { amount: number };
    buyingPower?: { amount: number };
  };
}

interface BrokerConnection {
  id: string;
  broker_type: string;
  status: string;
  accounts: unknown;
  token_expires_at: string;
  updated_at: string;
}

export const IBKRConnection = () => {
  const { user, session } = useAuth();
  const [connection, setConnection] = useState<BrokerConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [liveAccounts, setLiveAccounts] = useState<BrokerAccount[]>([]);

  useEffect(() => {
    if (user) {
      checkConnection();
    }
  }, [user]);

  const checkConnection = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('broker_connections')
        .select('*')
        .eq('user_id', user?.id)
        .eq('broker_type', 'interactive_brokers')
        .maybeSingle();

      if (error) throw error;
      
      setConnection(data);
      
      if (data?.status === 'connected') {
        fetchLiveAccounts();
      }
    } catch (error) {
      console.error('Error checking IBKR connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveAccounts = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase.functions.invoke('ibkr-accounts', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.accounts) {
        setLiveAccounts(data.accounts);
      }
      
      if (data?.needsReauth) {
        toast.error('IBKR session expired. Please reconnect.');
        setConnection(prev => prev ? { ...prev, status: 'expired' } : null);
      }
    } catch (error) {
      console.error('Error fetching live accounts:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const initiateConnection = async () => {
    try {
      setConnecting(true);
      const { data, error } = await supabase.functions.invoke('ibkr-auth');

      if (error) throw error;

      if (data?.needsSetup) {
        toast.error('IBKR API credentials not configured. Please add IBKR_CLIENT_ID and IBKR_CLIENT_SECRET to your secrets.');
        return;
      }

      if (data?.authUrl) {
        // Store state for CSRF validation
        sessionStorage.setItem('ibkr_oauth_state', data.state);
        
        // Open IBKR OAuth in new window
        const authWindow = window.open(data.authUrl, 'IBKR Auth', 'width=600,height=700');
        
        // Listen for OAuth callback
        const handleMessage = async (event: MessageEvent) => {
          if (event.data?.type === 'IBKR_AUTH_CALLBACK') {
            window.removeEventListener('message', handleMessage);
            authWindow?.close();
            
            const { code, state } = event.data;
            const storedState = sessionStorage.getItem('ibkr_oauth_state');
            
            if (state !== storedState) {
              toast.error('OAuth state mismatch. Please try again.');
              return;
            }
            
            // Exchange code for tokens
            const { data: callbackData, error: callbackError } = await supabase.functions.invoke('ibkr-callback', {
              body: { code, state },
              headers: {
                Authorization: `Bearer ${session?.access_token}`,
              },
            });
            
            if (callbackError || !callbackData?.success) {
              toast.error(callbackData?.error || 'Failed to complete connection');
              return;
            }
            
            toast.success('Successfully connected to Interactive Brokers!');
            checkConnection();
          }
        };
        
        window.addEventListener('message', handleMessage);
        
        // Also poll for connection in case postMessage doesn't work
        const pollInterval = setInterval(async () => {
          const { data: connData } = await supabase
            .from('broker_connections')
            .select('*')
            .eq('user_id', user?.id)
            .eq('broker_type', 'interactive_brokers')
            .eq('status', 'connected')
            .maybeSingle();
          
          if (connData) {
            clearInterval(pollInterval);
            window.removeEventListener('message', handleMessage);
            authWindow?.close();
            toast.success('Successfully connected to Interactive Brokers!');
            checkConnection();
          }
        }, 2000);
        
        // Clear poll after 5 minutes
        setTimeout(() => clearInterval(pollInterval), 300000);
      }
    } catch (error) {
      console.error('Error initiating IBKR connection:', error);
      toast.error('Failed to start connection process');
    } finally {
      setConnecting(false);
    }
  };

  const disconnectBroker = async () => {
    try {
      const { error } = await supabase
        .from('broker_connections')
        .delete()
        .eq('user_id', user?.id)
        .eq('broker_type', 'interactive_brokers');

      if (error) throw error;

      setConnection(null);
      setLiveAccounts([]);
      toast.success('Disconnected from Interactive Brokers');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Failed to disconnect');
    }
  };

  const refreshToken = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase.functions.invoke('ibkr-refresh-token', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Token refreshed successfully');
        fetchLiveAccounts();
      } else if (data?.needsReauth) {
        toast.error('Please reconnect to Interactive Brokers');
        setConnection(prev => prev ? { ...prev, status: 'expired' } : null);
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      toast.error('Failed to refresh token');
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (value: number | undefined, currency = 'USD') => {
    if (value === undefined) return '-';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency 
    }).format(value);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <img 
                src="https://www.interactivebrokers.com/images/web/logos/ib-logo-text-black.svg" 
                alt="Interactive Brokers"
                className="h-6 dark:invert"
              />
              Interactive Brokers
            </CardTitle>
            <CardDescription>
              Connect your IBKR account for live portfolio data and trading
            </CardDescription>
          </div>
          {connection?.status === 'connected' && (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          )}
          {connection?.status === 'expired' && (
            <Badge variant="destructive">
              <AlertCircle className="w-3 h-3 mr-1" />
              Expired
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!connection ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              Connect your Interactive Brokers account to see live positions, balances, and execute trades.
            </p>
            <Button 
              onClick={initiateConnection} 
              disabled={connecting}
              className="gap-2"
            >
              {connecting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4" />
              )}
              Connect Interactive Brokers
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Requires IBKR API credentials. 
              <a 
                href="https://www.interactivebrokers.com/en/trading/api-solutions.php" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline ml-1"
              >
                Learn more <ExternalLink className="w-3 h-3 inline" />
              </a>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Account Cards */}
            {liveAccounts.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {liveAccounts.map((account) => (
                  <Card key={account.accountId} className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium">{account.accountTitle || account.accountId}</p>
                          <p className="text-xs text-muted-foreground">
                            {account.accountType || 'Trading Account'}
                          </p>
                        </div>
                        <Badge variant="outline">{account.currency || 'USD'}</Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Wallet className="w-3 h-3" />
                            Net Liquidation
                          </span>
                          <span className="font-medium">
                            {formatCurrency(account.summary?.netLiquidation?.amount, account.currency)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Buying Power
                          </span>
                          <span className="font-medium">
                            {formatCurrency(account.summary?.buyingPower?.amount, account.currency)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : connection.accounts && (connection.accounts as BrokerAccount[]).length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {(connection.accounts as BrokerAccount[]).map((account) => (
                  <Card key={account.accountId} className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{account.accountTitle || account.accountId}</p>
                          <p className="text-xs text-muted-foreground">
                            {account.accountType || 'Trading Account'}
                          </p>
                        </div>
                        <Badge variant="outline">{account.currency || 'USD'}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No accounts found. Please check your IBKR account.
              </p>
            )}

            {/* Connection Info */}
            <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-4">
              <span>
                Last updated: {connection.updated_at ? new Date(connection.updated_at).toLocaleString() : 'Never'}
              </span>
              <span>
                Token expires: {connection.token_expires_at ? new Date(connection.token_expires_at).toLocaleString() : 'Unknown'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchLiveAccounts}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={refreshToken}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Token
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={disconnectBroker}
              >
                <Link2Off className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
