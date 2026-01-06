import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Link2, Unlink, RefreshCw, TrendingUp, Wallet, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SchwabAccount {
  securitiesAccount?: {
    accountNumber?: string;
    type?: string;
    currentBalances?: {
      liquidationValue?: number;
      cashBalance?: number;
      availableFunds?: number;
    };
    positions?: Array<{
      instrument?: {
        symbol?: string;
        assetType?: string;
      };
      longQuantity?: number;
      shortQuantity?: number;
      marketValue?: number;
      averagePrice?: number;
    }>;
  };
  hashValue?: string;
}

interface BrokerConnection {
  id: string;
  status: string;
  accounts: SchwabAccount[] | null;
  updated_at: string;
  token_expires_at: string | null;
}

export function SchwabConnection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connection, setConnection] = useState<BrokerConnection | null>(null);

  useEffect(() => {
    if (user) {
      fetchConnection();
    }
  }, [user]);

  const fetchConnection = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('broker_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('broker_type', 'schwab')
      .single();

    if (!error && data) {
      setConnection(data as BrokerConnection);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('schwab-auth');
      
      if (error) throw error;
      
      if (data?.authUrl) {
        // Open Schwab auth in a new window
        const authWindow = window.open(data.authUrl, '_blank', 'width=600,height=700');
        
        // Listen for the callback
        const handleMessage = async (event: MessageEvent) => {
          if (event.data?.type === 'SCHWAB_AUTH_CALLBACK' && event.data?.code) {
            window.removeEventListener('message', handleMessage);
            authWindow?.close();
            
            // Exchange the code for tokens
            const session = await supabase.auth.getSession();
            const { data: callbackData, error: callbackError } = await supabase.functions.invoke('schwab-callback', {
              body: { code: event.data.code },
              headers: {
                Authorization: `Bearer ${session.data.session?.access_token}`,
              },
            });
            
            if (callbackError) throw callbackError;
            
            toast({
              title: 'Connected to Schwab',
              description: `Successfully linked ${callbackData.accounts?.length || 0} account(s)`,
            });
            
            fetchConnection();
          }
        };
        
        window.addEventListener('message', handleMessage);
        
        toast({
          title: 'Schwab Login',
          description: 'Complete the login in the popup window, then paste the callback URL here.',
        });
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect to Schwab',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshAccounts = async () => {
    if (!user) return;
    
    setIsRefreshing(true);
    try {
      const session = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('schwab-accounts', {
        headers: {
          Authorization: `Bearer ${session.data.session?.access_token}`,
        },
      });
      
      if (error) throw error;
      
      if (data?.requiresReauth) {
        toast({
          title: 'Re-authentication Required',
          description: 'Please reconnect your Schwab account.',
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'Accounts Updated',
        description: 'Successfully refreshed account data',
      });
      
      fetchConnection();
    } catch (error: any) {
      console.error('Refresh error:', error);
      toast({
        title: 'Refresh Failed',
        description: error.message || 'Failed to refresh account data',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('broker_connections')
        .delete()
        .eq('user_id', user.id)
        .eq('broker_type', 'schwab');
      
      if (error) throw error;
      
      setConnection(null);
      toast({
        title: 'Disconnected',
        description: 'Schwab account has been disconnected',
      });
    } catch (error: any) {
      toast({
        title: 'Disconnect Failed',
        description: error.message || 'Failed to disconnect',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const isConnected = connection?.status === 'connected';
  const isExpired = connection?.status === 'expired';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Charles Schwab
            </CardTitle>
            <CardDescription>
              Connect your Schwab account for live trading and account data
            </CardDescription>
          </div>
          <Badge variant={isConnected ? 'default' : isExpired ? 'destructive' : 'secondary'}>
            {isConnected ? 'Connected' : isExpired ? 'Expired' : 'Not Connected'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isExpired && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your Schwab connection has expired. Please reconnect to continue using live trading features.
            </AlertDescription>
          </Alert>
        )}

        {isConnected && connection?.accounts && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Last updated: {new Date(connection.updated_at).toLocaleString()}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshAccounts}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-2">Refresh</span>
              </Button>
            </div>

            {connection.accounts.map((account, index) => {
              const secAccount = account.securitiesAccount;
              const balances = secAccount?.currentBalances;
              const positions = secAccount?.positions || [];

              return (
                <Card key={account.hashValue || index} className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        <span className="font-medium">
                          {secAccount?.type || 'Account'} - ****{secAccount?.accountNumber?.slice(-4) || 'XXXX'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Value</p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(balances?.liquidationValue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Cash Balance</p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(balances?.cashBalance)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Available</p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(balances?.availableFunds)}
                        </p>
                      </div>
                    </div>

                    {positions.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Positions ({positions.length})</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {positions.slice(0, 10).map((position, posIndex) => (
                            <div
                              key={posIndex}
                              className="flex items-center justify-between text-sm bg-background/50 p-2 rounded"
                            >
                              <div>
                                <span className="font-medium">{position.instrument?.symbol}</span>
                                <span className="text-muted-foreground ml-2">
                                  {position.longQuantity || position.shortQuantity} shares
                                </span>
                              </div>
                              <div className="text-right">
                                <p>{formatCurrency(position.marketValue)}</p>
                                <p className="text-xs text-muted-foreground">
                                  Avg: {formatCurrency(position.averagePrice)}
                                </p>
                              </div>
                            </div>
                          ))}
                          {positions.length > 10 && (
                            <p className="text-xs text-muted-foreground text-center">
                              +{positions.length - 10} more positions
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="flex gap-2">
          {!isConnected ? (
            <Button onClick={handleConnect} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  Connect Schwab Account
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Unlink className="mr-2 h-4 w-4" />
              )}
              Disconnect
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Connect your Charles Schwab account to enable live trading, view real-time positions, 
          and execute automated trading strategies. Your credentials are securely encrypted.
        </p>
      </CardContent>
    </Card>
  );
}
