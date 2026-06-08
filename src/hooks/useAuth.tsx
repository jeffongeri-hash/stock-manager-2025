import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const GUEST_MODE_KEY = 'profit_pathway_guest_mode';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(() => {
    const guestMode = localStorage.getItem(GUEST_MODE_KEY);
    return guestMode !== 'false'; // Default to guest mode on fresh sessions
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  // Check admin status whenever user changes
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsAdminLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase.rpc('current_user_has_role', {
          _role: 'admin',
        });
        if (error) {
          console.error('Admin check error:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!data);
        }
      } catch (e) {
        console.error('Admin check failed:', e);
        setIsAdmin(false);
      } finally {
        setIsAdminLoading(false);
      }
    };
    checkAdmin();
  }, [user]);

  useEffect(() => {
    // Check for guest mode preference
    const guestMode = localStorage.getItem(GUEST_MODE_KEY);
    if (guestMode === 'true') {
      setIsGuestMode(true);
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // If user logs in, disable guest mode
        if (session?.user) {
          setIsGuestMode(false);
          localStorage.removeItem(GUEST_MODE_KEY);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Enable guest mode if no session and not already set
      if (!session && guestMode !== 'false') {
        setIsGuestMode(true);
        localStorage.setItem(GUEST_MODE_KEY, 'true');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    // After signing out, enable guest mode
    setIsGuestMode(true);
    localStorage.setItem(GUEST_MODE_KEY, 'true');
  };

  // Enable guest mode explicitly
  const enableGuestMode = useCallback(() => {
    setIsGuestMode(true);
    localStorage.setItem(GUEST_MODE_KEY, 'true');
  }, []);

  // Disable guest mode (when user wants to sign in)
  const disableGuestMode = useCallback(() => {
    setIsGuestMode(false);
    localStorage.setItem(GUEST_MODE_KEY, 'false');
  }, []);

  // Check if user can access a feature (either logged in or guest mode)
  const canAccess = useCallback((requiresAuth: boolean = false) => {
    if (requiresAuth) {
      return !!user;
    }
    return !!user || isGuestMode;
  }, [user, isGuestMode]);

  return { 
    user, 
    session, 
    loading, 
    signOut,
    isGuestMode,
    enableGuestMode,
    disableGuestMode,
    canAccess,
    isAuthenticated: !!user,
    isAdmin,
    isAdminLoading,
  };
};
