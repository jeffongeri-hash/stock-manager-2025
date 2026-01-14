import { useEffect, useRef, useCallback, useState } from 'react';

interface UseAutoRefreshOptions {
  interval?: number; // in milliseconds
  enabled?: boolean;
  onRefresh: () => Promise<void> | void;
  pauseOnHidden?: boolean;
}

export function useAutoRefresh({
  interval = 30000, // 30 seconds default
  enabled = true,
  onRefresh,
  pauseOnHidden = true,
}: UseAutoRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [nextRefresh, setNextRefresh] = useState<Date | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onRefreshRef = useRef(onRefresh);

  // Keep callback ref updated
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefreshRef.current();
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Auto-refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const startInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!enabled || isPaused) return;

    setNextRefresh(new Date(Date.now() + interval));
    
    intervalRef.current = setInterval(() => {
      refresh();
      setNextRefresh(new Date(Date.now() + interval));
    }, interval);
  }, [enabled, interval, isPaused, refresh]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setNextRefresh(null);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
    stopInterval();
  }, [stopInterval]);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const manualRefresh = useCallback(async () => {
    await refresh();
    // Reset the interval after manual refresh
    startInterval();
  }, [refresh, startInterval]);

  // Handle visibility changes
  useEffect(() => {
    if (!pauseOnHidden) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopInterval();
      } else if (enabled && !isPaused) {
        // Refresh immediately when tab becomes visible, then restart interval
        refresh();
        startInterval();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, isPaused, pauseOnHidden, refresh, startInterval, stopInterval]);

  // Start/stop interval based on enabled state
  useEffect(() => {
    if (enabled && !isPaused) {
      startInterval();
    } else {
      stopInterval();
    }

    return () => stopInterval();
  }, [enabled, isPaused, startInterval, stopInterval]);

  // Calculate time until next refresh
  const getTimeUntilRefresh = useCallback(() => {
    if (!nextRefresh) return null;
    const remaining = nextRefresh.getTime() - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000));
  }, [nextRefresh]);

  return {
    isRefreshing,
    lastRefresh,
    nextRefresh,
    isPaused,
    pause,
    resume,
    manualRefresh,
    getTimeUntilRefresh,
  };
}
