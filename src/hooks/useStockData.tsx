import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchStocks = async () => {
      if (!symbols || symbols.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
          body: { symbols }
        });

        if (error) {
          throw error;
        }

        if (data && data.stocks) {
          setStocks(data.stocks);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching stock data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch stock data');
        toast.error('Failed to fetch stock data');
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchStocks, 60000);
    return () => clearInterval(interval);
  }, [symbols.join(',')]);

  return { stocks, loading, error };
};
