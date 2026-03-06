import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function PWAUpdateNotification() {
  const { toast } = useToast();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        toast({
          title: '🔄 New version available!',
          description: 'A new version of Profit Pathway is ready. Refresh to update.',
          duration: 0,
          action: (
            <button
              onClick={() => window.location.reload()}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Refresh
            </button>
          ),
        });
      });
    }
  }, [toast]);

  return null;
}
