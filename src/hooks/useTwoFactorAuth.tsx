import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TwoFactorSettings {
  id: string;
  user_id: string;
  is_enabled: boolean;
  verified_at: string | null;
}

export const useTwoFactorAuth = () => {
  const { user } = useAuth();
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkSettings = useCallback(async () => {
    if (!user) {
      setIs2FAEnabled(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('two_factor_settings')
        .select('is_enabled')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking 2FA status:', error);
      }

      setIs2FAEnabled(data?.is_enabled || false);
    } catch (error) {
      console.error('Error checking 2FA status:', error);
      setIs2FAEnabled(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkSettings();
  }, [checkSettings]);

  return {
    is2FAEnabled,
    loading,
    refetch: checkSettings
  };
};

export default useTwoFactorAuth;
