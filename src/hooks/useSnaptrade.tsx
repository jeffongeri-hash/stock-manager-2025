import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SnaptradeAccount {
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

export interface SnaptradeHolding {
  id: string;
  symbol: string;
  description: string;
  quantity: number;
  price: number;
  market_value: number;
  cost_basis: number;
  unrealized_pnl: number;
  unrealized_pnl_percent: number;
  currency: string;
  account_id: string;
}

export interface SnaptradeDividend {
  id: string;
  symbol: string;
  amount: number;
  currency: string;
  ex_date: string;
  payment_date: string;
  type: string;
  account_id: string;
}

export interface SnaptradeConnection {
  userId: string;
  userSecret: string;
  isConnected: boolean;
  accounts: SnaptradeAccount[];
}

interface SnaptradeData {
  connection: SnaptradeConnection | null;
  holdings: SnaptradeHolding[];
  dividends: SnaptradeDividend[];
  isLoading: boolean;
  error: string | null;
  lastSyncTime: Date | null;
}

// Auto-sync interval in milliseconds (5 minutes)
const AUTO_SYNC_INTERVAL = 5 * 60 * 1000;

export function useSnaptrade(autoSync: boolean = true) {
  const { user } = useAuth();
  const [data, setData] = useState<SnaptradeData>({
    connection: null,
    holdings: [],
    dividends: [],
    isLoading: true,
    error: null,
    lastSyncTime: null,
  });
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const loadConnection = useCallback(async () => {
    if (!user) {
      setData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const stored = localStorage.getItem(`snaptrade_${user.id}`);
      if (stored) {
        const parsed: SnaptradeConnection = JSON.parse(stored);
        setData(prev => ({ ...prev, connection: parsed, isLoading: !parsed.isConnected }));
        
        if (parsed.isConnected && parsed.userSecret) {
          await fetchHoldings(parsed.userSecret);
        } else {
          setData(prev => ({ ...prev, isLoading: false }));
        }
      } else {
        setData(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error("Error loading Snaptrade connection:", error);
      setData(prev => ({ ...prev, isLoading: false, error: "Failed to load connection" }));
    }
  }, [user]);

  const fetchHoldings = async (userSecret: string) => {
    try {
      const { data: holdingsData, error: holdingsError } = await supabase.functions.invoke(
        "snaptrade-accounts",
        { body: { action: "getHoldings", userSecret } }
      );

      if (holdingsError) throw holdingsError;

      // Transform holdings data
      const holdings: SnaptradeHolding[] = (holdingsData?.holdings || holdingsData || []).map((h: any) => ({
        id: h.id || crypto.randomUUID(),
        symbol: h.symbol?.symbol || h.symbol || "Unknown",
        description: h.symbol?.description || h.description || "",
        quantity: h.units || h.quantity || 0,
        price: h.price || 0,
        market_value: (h.units || h.quantity || 0) * (h.price || 0),
        cost_basis: h.average_purchase_price ? (h.average_purchase_price * (h.units || h.quantity || 0)) : 0,
        unrealized_pnl: h.open_pnl || 0,
        unrealized_pnl_percent: 0,
        currency: h.currency?.code || "USD",
        account_id: h.account?.id || "",
      }));

      // Calculate unrealized PnL percent
      holdings.forEach(h => {
        if (h.cost_basis > 0) {
          h.unrealized_pnl_percent = ((h.market_value - h.cost_basis) / h.cost_basis) * 100;
        }
      });

      if (isMountedRef.current) {
        setData(prev => ({
          ...prev,
          holdings,
          isLoading: false,
          error: null,
          lastSyncTime: new Date(),
        }));
      }

      // Also try to fetch transactions for dividends
      await fetchDividends(userSecret);
    } catch (error: any) {
      console.error("Error fetching holdings:", error);
      if (isMountedRef.current) {
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || "Failed to fetch holdings",
        }));
      }
    }
  };

  const fetchDividends = async (userSecret: string) => {
    try {
      const { data: transactionsData, error: transactionsError } = await supabase.functions.invoke(
        "snaptrade-accounts",
        { body: { action: "getTransactions", userSecret } }
      );

      if (transactionsError) throw transactionsError;

      // Filter for dividend transactions
      const dividends: SnaptradeDividend[] = (transactionsData || [])
        .filter((t: any) => t.type?.toLowerCase().includes("dividend"))
        .map((t: any) => ({
          id: t.id || crypto.randomUUID(),
          symbol: t.symbol?.symbol || t.symbol || "Unknown",
          amount: t.amount || 0,
          currency: t.currency?.code || "USD",
          ex_date: t.trade_date || t.settlement_date || "",
          payment_date: t.settlement_date || "",
          type: t.type || "DIVIDEND",
          account_id: t.account?.id || "",
        }));

      if (isMountedRef.current) {
        setData(prev => ({
          ...prev,
          dividends,
        }));
      }
    } catch (error) {
      console.error("Error fetching dividends:", error);
      // Don't fail the whole hook if dividends fail
    }
  };

  const refresh = useCallback(async () => {
    if (!user || !data.connection?.userSecret) return;
    
    setData(prev => ({ ...prev, isLoading: true }));
    await fetchHoldings(data.connection!.userSecret);
  }, [user, data.connection]);

  // Initial load
  useEffect(() => {
    loadConnection();
  }, [loadConnection]);

  // Auto-sync setup
  useEffect(() => {
    if (!autoSync || !data.connection?.isConnected || !data.connection?.userSecret) {
      return;
    }

    // Clear any existing interval
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    // Set up periodic sync
    syncIntervalRef.current = setInterval(() => {
      if (data.connection?.userSecret && isMountedRef.current) {
        console.log("[Snaptrade] Auto-sync triggered");
        fetchHoldings(data.connection.userSecret);
      }
    }, AUTO_SYNC_INTERVAL);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [autoSync, data.connection?.isConnected, data.connection?.userSecret]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  // Check URL for Snaptrade success callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("snaptrade") === "success" && user) {
      // Mark connection as successful
      const stored = localStorage.getItem(`snaptrade_${user.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.isConnected = true;
        localStorage.setItem(`snaptrade_${user.id}`, JSON.stringify(parsed));
        setData(prev => ({ ...prev, connection: parsed }));
        
        // Clean URL - handle both /settings and /assets pages
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Fetch data
        if (parsed.userSecret) {
          fetchHoldings(parsed.userSecret);
        }
      }
    }
  }, [user]);

  const totalValue = data.holdings.reduce((sum, h) => sum + h.market_value, 0);
  const totalCost = data.holdings.reduce((sum, h) => sum + h.cost_basis, 0);
  const totalPnL = data.holdings.reduce((sum, h) => sum + h.unrealized_pnl, 0);
  const totalPnLPercent = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
  const totalDividends = data.dividends.reduce((sum, d) => sum + d.amount, 0);

  return {
    ...data,
    refresh,
    totalValue,
    totalCost,
    totalPnL,
    totalPnLPercent,
    totalDividends,
    isConnected: data.connection?.isConnected || false,
  };
}
