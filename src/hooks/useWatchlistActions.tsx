import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useWatchlistActions = () => {
  const { user } = useAuth();

  const addToWatchlist = useCallback(async (symbol: string) => {
    if (!user) {
      toast.error('Please sign in to add to watchlist');
      return false;
    }

    const cleanSymbol = symbol.toUpperCase().trim();
    if (!cleanSymbol) {
      toast.error('Invalid symbol');
      return false;
    }

    try {
      // Check if already exists
      const { data: existing } = await supabase
        .from('watchlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('symbol', cleanSymbol)
        .single();

      if (existing) {
        toast.info(`${cleanSymbol} is already in your watchlist`);
        return true;
      }

      const { error } = await supabase
        .from('watchlist')
        .insert({ user_id: user.id, symbol: cleanSymbol });

      if (error) throw error;

      toast.success(`${cleanSymbol} added to watchlist`);
      return true;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast.error('Failed to add to watchlist');
      return false;
    }
  }, [user]);

  const addMultipleToWatchlist = useCallback(async (symbols: string[]) => {
    if (!user) {
      toast.error('Please sign in to add to watchlist');
      return false;
    }

    const cleanSymbols = symbols
      .map(s => s.toUpperCase().trim())
      .filter(Boolean);

    if (cleanSymbols.length === 0) {
      toast.error('No valid symbols provided');
      return false;
    }

    try {
      // Get existing symbols to avoid duplicates
      const { data: existing } = await supabase
        .from('watchlist')
        .select('symbol')
        .eq('user_id', user.id)
        .in('symbol', cleanSymbols);

      const existingSymbols = new Set(existing?.map(e => e.symbol) || []);
      const newSymbols = cleanSymbols.filter(s => !existingSymbols.has(s));

      if (newSymbols.length === 0) {
        toast.info('All symbols are already in your watchlist');
        return true;
      }

      const { error } = await supabase
        .from('watchlist')
        .insert(newSymbols.map(symbol => ({ user_id: user.id, symbol })));

      if (error) throw error;

      toast.success(`Added ${newSymbols.length} symbol(s) to watchlist`);
      return true;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast.error('Failed to add to watchlist');
      return false;
    }
  }, [user]);

  return { addToWatchlist, addMultipleToWatchlist, isLoggedIn: !!user };
};
