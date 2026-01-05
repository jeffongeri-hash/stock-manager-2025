import React from 'react';
import { X, UserCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function GuestModeBanner() {
  const { isGuestMode, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = React.useState(false);

  // Don't show if authenticated or dismissed
  if (isAuthenticated || !isGuestMode || dismissed) {
    return null;
  }

  return (
    <div className="bg-primary/10 border-b border-primary/20 py-2 px-4">
      <div className="container flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <UserCircle className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">
            You're browsing as a <strong className="text-foreground">guest</strong>. 
            <span className="hidden sm:inline"> Your data is saved locally on this device.</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/auth')}
            className="text-xs h-7"
          >
            <Shield className="h-3 w-3 mr-1" />
            Create Account
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDismissed(true)}
            className="h-7 w-7"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
