import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Shield, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import * as OTPAuth from 'otplib';

interface TwoFactorVerificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
  action: string; // Description of the action being verified
}

export const TwoFactorVerification: React.FC<TwoFactorVerificationProps> = ({
  open,
  onOpenChange,
  onVerified,
  action
}) => {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);

  const verify = async () => {
    if (!user) return;
    
    setVerifying(true);
    try {
      // Get user's 2FA settings
      const { data: settings, error } = await supabase
        .from('two_factor_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !settings) {
        toast.error('2FA settings not found');
        setVerifying(false);
        return;
      }

      if (useBackupCode) {
        // Check if code is in backup codes
        const backupCodes = settings.backup_codes as string[] || [];
        if (backupCodes.includes(code.toUpperCase())) {
          // Remove used backup code
          const updatedCodes = backupCodes.filter(c => c !== code.toUpperCase());
          await supabase
            .from('two_factor_settings')
            .update({ backup_codes: updatedCodes })
            .eq('user_id', user.id);
          
          toast.success('Backup code verified');
          setCode('');
          onVerified();
          onOpenChange(false);
        } else {
          toast.error('Invalid backup code');
        }
      } else {
        // Verify TOTP code
        const isValid = OTPAuth.authenticator.verify({
          token: code,
          secret: settings.secret_encrypted || ''
        });

        if (isValid) {
          toast.success('Verification successful');
          setCode('');
          onVerified();
          onOpenChange(false);
        } else {
          toast.error('Invalid verification code');
        }
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error('Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length >= 6) {
      verify();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Two-Factor Verification Required
          </DialogTitle>
          <DialogDescription>
            Enter the verification code to {action}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>
              {useBackupCode ? 'Backup Code' : '6-Digit Verification Code'}
            </Label>
            <Input
              value={code}
              onChange={(e) => {
                const value = useBackupCode 
                  ? e.target.value.toUpperCase().slice(0, 6)
                  : e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(value);
              }}
              onKeyPress={handleKeyPress}
              placeholder={useBackupCode ? 'ABC123' : '000000'}
              className="text-center text-2xl font-mono tracking-widest"
              autoFocus
            />
          </div>

          <Button 
            onClick={verify}
            disabled={code.length < 6 || verifying}
            className="w-full"
          >
            {verifying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </Button>

          <Button
            variant="ghost"
            className="w-full text-sm"
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setCode('');
            }}
          >
            {useBackupCode 
              ? 'Use authenticator app instead' 
              : 'Use a backup code instead'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TwoFactorVerification;
