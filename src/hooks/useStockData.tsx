import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
}

export const useStockData = (symbols: string[]) => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStocks = useCallback(async (showToast = false) => {
    if (!symbols || symbols.length === 0) {
      setLoading(false);
      return;
    }

    try {
      if (showToast) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
        body: { symbols }
      });

      if (error) {
        throw error;
      }

      if (data && data.stocks) {
        setStocks(data.stocks);
        setError(null);
        if (showToast) {
          toast.success('Prices refreshed successfully');
        }
      }
    } catch (err) {
      console.error('Error fetching stock data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stock data');
      if (showToast) {
        toast.error('Failed to refresh prices');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [symbols.join(',')]);

  const refresh = useCallback(() => {
    fetchStocks(true);
  }, [fetchStocks]);

  useEffect(() => {
    fetchStocks();
    
    // Refresh every 60 seconds
    const interval = setInterval(() => fetchStocks(), 60000);
    return () => clearInterval(interval);
  }, [fetchStocks]);

  return { stocks, loading, error, refresh, isRefreshing };
};
