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

interface SnaptradeConnectionData {
  userId: string;
  userSecret: string;
  isConnected: boolean;
  accounts: SnaptradeAccount[];
}

export function SnaptradeConnection() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [connection, setConnection] = useState<SnaptradeConnectionData | null>(null);

  useEffect(() => {
    if (user) {
      loadConnection();
    }
  }, [user]);

  const loadConnection = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("snaptrade_connections")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const conn: SnaptradeConnectionData = {
          userId: data.user_id,
          userSecret: data.user_secret,
          isConnected: data.is_connected,
          accounts: (data.accounts as unknown as SnaptradeAccount[]) || [],
        };
        setConnection(conn);

        if (conn.isConnected && conn.userSecret) {
          await refreshAccounts(conn.userSecret);
        }
      }
    } catch (error) {
      console.error("Error loading connection:", error);
    }
  };

  const saveConnection = async (conn: SnaptradeConnectionData) => {
    if (!user) return;

    const { error } = await supabase
      .from("snaptrade_connections")
      .upsert(
        {
          user_id: user.id,
          user_secret: conn.userSecret,
          is_connected: conn.isConnected,
          accounts: conn.accounts as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("Error saving connection:", error);
      throw error;
    }
  };

  const handleConnect = async () => {
    if (!user) {
      toast.error("Please sign in to connect your brokerage");
      return;
    }

    setLoading(true);

    try {
      const { data: registerData, error: registerError } = await supabase.functions.invoke(
        "snaptrade-auth",
        { body: { action: "register", userId: user.id } }
      );

      if (registerError) throw new Error(registerError.message || "Failed to register with Snaptrade");
      if (registerData?.error) throw new Error(registerData.error);

      const userSecret = registerData.userSecret;
      if (!userSecret) throw new Error("Failed to get user credentials from Snaptrade");

      const { data: loginData, error: loginError } = await supabase.functions.invoke(
        "snaptrade-auth",
        {
          body: {
            action: "getLoginLink",
            userId: user.id,
            userSecret,
            redirectUri: `${window.location.origin}/assets?snaptrade=success`,
          },
        }
      );

      if (loginError) throw new Error(loginError.message || "Failed to get login link");
      if (loginData?.error) throw new Error(loginData.error);

      const loginUrl = loginData.redirectURI || loginData.loginLink;
      if (!loginUrl) throw new Error("No login URL received from Snaptrade");

      const newConnection: SnaptradeConnectionData = {
        userId: user.id,
        userSecret,
        isConnected: false,
        accounts: [],
      };

      await saveConnection(newConnection);
      setConnection(newConnection);

      const popup = window.open(loginUrl, "_blank", "width=500,height=700");
      if (!popup) {
        toast.error("Popup blocked! Please allow popups for this site and try again.");
        return;
      }

      toast.success("Complete the connection in the popup window. Return here when done.");
    } catch (error: any) {
      console.error("Connection error:", error);
      const errorMessage = error.message || "Failed to connect to Snaptrade";
      if (errorMessage.includes("credentials not configured")) {
        toast.error("Snaptrade API is not configured. Please contact support.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshAccounts = async (userSecret?: string) => {
    if (!user || (!connection?.userSecret && !userSecret)) return;

    setRefreshing(true);

    try {
      const { data, error } = await supabase.functions.invoke("snaptrade-accounts", {
        body: { action: "getAccounts", userSecret: userSecret || connection?.userSecret },
      });

      if (error) throw error;

      const updatedConnection: SnaptradeConnectionData = {
        ...connection!,
        userSecret: userSecret || connection!.userSecret,
        isConnected: true,
        accounts: data || [],
      };

      await saveConnection(updatedConnection);
      setConnection(updatedConnection);
      toast.success("Accounts refreshed");
    } catch (error: any) {
      console.error("Refresh error:", error);
      if (!userSecret) {
        toast.error("Failed to refresh accounts");
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;

    try {
      await supabase
        .from("snaptrade_connections")
        .delete()
        .eq("user_id", user.id);

      // Also clean up any legacy localStorage data
      localStorage.removeItem(`snaptrade_${user.id}`);

      setConnection(null);
      toast.success("Disconnected from Snaptrade");
    } catch (error) {
      console.error("Error disconnecting:", error);
      toast.error("Failed to disconnect");
    }
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
