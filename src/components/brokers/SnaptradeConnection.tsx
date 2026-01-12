import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Link2, Unlink, RefreshCw, Building2, Wallet, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SnaptradeAccount {
  id: string;
  brokerage_authorization_id: string;
  name: string;
  number: string;
  sync_status: string;
  balance: {
    total: number;
    cash: number;
  };
}

interface SnaptradeConnection {
  userId: string;
  userSecret: string;
  isConnected: boolean;
  accounts: SnaptradeAccount[];
}

export function SnaptradeConnection() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [connection, setConnection] = useState<SnaptradeConnection | null>(null);

  useEffect(() => {
    if (user) {
      loadConnection();
    }
  }, [user]);

  const loadConnection = async () => {
    if (!user) return;

    try {
      const stored = localStorage.getItem(`snaptrade_${user.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setConnection(parsed);
        
        // Fetch latest account data
        if (parsed.userSecret) {
          await refreshAccounts(parsed.userSecret);
        }
      }
    } catch (error) {
      console.error("Error loading connection:", error);
    }
  };

  const handleConnect = async () => {
    if (!user) {
      toast.error("Please sign in to connect your brokerage");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Register user with Snaptrade
      const { data: registerData, error: registerError } = await supabase.functions.invoke(
        "snaptrade-auth",
        {
          body: { action: "register", userId: user.id },
        }
      );

      if (registerError) throw registerError;

      const userSecret = registerData.userSecret;

      // Step 2: Get login link
      const { data: loginData, error: loginError } = await supabase.functions.invoke(
        "snaptrade-auth",
        {
          body: {
            action: "getLoginLink",
            userId: user.id,
            userSecret,
            redirectUri: `${window.location.origin}/settings?snaptrade=success`,
          },
        }
      );

      if (loginError) throw loginError;

      // Save connection info
      const newConnection: SnaptradeConnection = {
        userId: user.id,
        userSecret,
        isConnected: false,
        accounts: [],
      };
      localStorage.setItem(`snaptrade_${user.id}`, JSON.stringify(newConnection));
      setConnection(newConnection);

      // Open Snaptrade connection widget
      window.open(loginData.redirectURI || loginData.loginLink, "_blank", "width=500,height=700");
      
      toast.success("Complete the connection in the popup window");
    } catch (error: any) {
      console.error("Connection error:", error);
      toast.error(error.message || "Failed to connect to Snaptrade");
    } finally {
      setLoading(false);
    }
  };

  const refreshAccounts = async (userSecret?: string) => {
    if (!user || !connection?.userSecret && !userSecret) return;

    setRefreshing(true);

    try {
      const { data, error } = await supabase.functions.invoke("snaptrade-accounts", {
        body: { action: "getAccounts", userSecret: userSecret || connection?.userSecret },
      });

      if (error) throw error;

      const updatedConnection = {
        ...connection!,
        userSecret: userSecret || connection!.userSecret,
        isConnected: true,
        accounts: data || [],
      };

      localStorage.setItem(`snaptrade_${user.id}`, JSON.stringify(updatedConnection));
      setConnection(updatedConnection);
      toast.success("Accounts refreshed");
    } catch (error: any) {
      console.error("Refresh error:", error);
      // Don't show error if just loading
      if (!userSecret) {
        toast.error("Failed to refresh accounts");
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleDisconnect = () => {
    if (!user) return;

    localStorage.removeItem(`snaptrade_${user.id}`);
    setConnection(null);
    toast.success("Disconnected from Snaptrade");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Snaptrade</CardTitle>
              <CardDescription>
                Connect to 25+ brokerages (Fidelity, Schwab, Vanguard, Robinhood, etc.)
              </CardDescription>
            </div>
          </div>
          <Badge variant={connection?.isConnected ? "default" : "secondary"}>
            {connection?.isConnected ? "Connected" : "Not Connected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {connection?.isConnected && connection.accounts.length > 0 && (
          <div className="space-y-3">
            {connection.accounts.map((account) => (
              <div
                key={account.id}
                className="p-4 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{account.name}</span>
                  <Badge variant="outline">{account.number}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Cash:</span>
                    <span className="font-medium">
                      {formatCurrency(account.balance?.cash || 0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">
                      {formatCurrency(account.balance?.total || 0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          {!connection?.isConnected ? (
            <Button onClick={handleConnect} disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  Connect Brokerage
                </>
              )}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => refreshAccounts()}
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleConnect}
                disabled={loading}
                className="flex-1"
              >
                <Link2 className="mr-2 h-4 w-4" />
                Add Another Account
              </Button>
              <Button variant="destructive" onClick={handleDisconnect}>
                <Unlink className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {!user && (
          <p className="text-sm text-muted-foreground text-center">
            Sign in to connect your brokerage accounts
          </p>
        )}
      </CardContent>
    </Card>
  );
}
