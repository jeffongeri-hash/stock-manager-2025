import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface UseUserSettingsOptions<T> {
  pageName: string;
  defaultSettings: T;
  autoSave?: boolean;
  autoSaveDelay?: number; // in milliseconds
}

export function useUserSettings<T extends object>({ 
  pageName, 
  defaultSettings,
  autoSave = true,
  autoSaveDelay = 2000
}: UseUserSettingsOptions<T>) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<T>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);

  // Load settings from database or localStorage
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      
      if (user) {
        // Load from Supabase for authenticated users
        try {
          const { data, error } = await supabase
            .from('user_settings')
            .select('settings_data, updated_at')
            .eq('user_id', user.id)
            .eq('page_name', pageName)
            .maybeSingle();
          
          if (error) throw error;
          
          if (data) {
            setSettings({ ...defaultSettings, ...(data.settings_data as T) });
            setLastSaved(new Date(data.updated_at));
          } else {
            setSettings(defaultSettings);
          }
        } catch (error) {
          console.error('Error loading settings:', error);
          setSettings(defaultSettings);
        }
      } else {
        // Load from localStorage for guest users
        try {
          const stored = localStorage.getItem(`settings_${pageName}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            setSettings({ ...defaultSettings, ...parsed.settings });
            setLastSaved(parsed.savedAt ? new Date(parsed.savedAt) : null);
          } else {
            setSettings(defaultSettings);
          }
        } catch {
          setSettings(defaultSettings);
        }
      }
      
      setIsLoading(false);
      initialLoadRef.current = false;
    };

    loadSettings();
  }, [user, pageName]);

  // Internal save function (no toast for auto-save)
  const performSave = useCallback(async (newSettings: T, showToast: boolean = true) => {
    setIsSaving(true);
    
    try {
      if (user) {
        const { data: existing } = await supabase
          .from('user_settings')
          .select('id')
          .eq('user_id', user.id)
          .eq('page_name', pageName)
          .maybeSingle();
        
        let error;
        if (existing) {
          const result = await supabase
            .from('user_settings')
            .update({
              settings_data: newSettings as Json,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .eq('page_name', pageName);
          error = result.error;
        } else {
          const result = await supabase
            .from('user_settings')
            .insert([{
              user_id: user.id,
              page_name: pageName,
              settings_data: newSettings as Json
            }]);
          error = result.error;
        }
        
        if (error) throw error;
      } else {
        localStorage.setItem(`settings_${pageName}`, JSON.stringify({
          settings: newSettings,
          savedAt: new Date().toISOString()
        }));
      }
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      if (showToast) {
        toast.success('Settings saved successfully');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      if (showToast) {
        toast.error('Failed to save settings');
      }
    } finally {
      setIsSaving(false);
    }
  }, [user, pageName]);

  // Manual save with toast
  const saveSettings = useCallback(async (newSettings: T) => {
    // Clear any pending auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
    await performSave(newSettings, true);
  }, [performSave]);

  // Auto-save effect
  useEffect(() => {
    if (!autoSave || isLoading || initialLoadRef.current || !hasUnsavedChanges) {
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(() => {
      performSave(settings, false);
    }, autoSaveDelay);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [settings, autoSave, autoSaveDelay, isLoading, hasUnsavedChanges, performSave]);

  // Update a single setting
  const updateSetting = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  }, []);

  // Reset to defaults
  const resetSettings = useCallback(async () => {
    // Clear any pending auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
    
    setSettings(defaultSettings);
    setHasUnsavedChanges(false);
    
    try {
      if (user) {
        await supabase
          .from('user_settings')
          .delete()
          .eq('user_id', user.id)
          .eq('page_name', pageName);
      } else {
        localStorage.removeItem(`settings_${pageName}`);
      }
      
      setLastSaved(null);
      toast.success('Settings reset to defaults');
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
  }, [user, pageName, defaultSettings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    settings,
    setSettings,
    updateSetting,
    saveSettings,
    resetSettings,
    isLoading,
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    isAuthenticated: !!user
  };
}
