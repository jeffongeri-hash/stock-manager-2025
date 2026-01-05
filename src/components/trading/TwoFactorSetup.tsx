import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Shield, QrCode, Loader2, CheckCircle2, Copy, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import * as OTPAuth from 'otplib';
import QRCode from 'qrcode';

interface TwoFactorSettings {
  id: string;
  user_id: string;
  is_enabled: boolean;
  secret_encrypted: string | null;
  backup_codes: string[] | null;
  verified_at: string | null;
}

export const TwoFactorSetup: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<TwoFactorSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupOpen, setSetupOpen] = useState(false);
  const [step, setStep] = useState<'generate' | 'verify' | 'backup'>('generate');
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifying, setVerifying] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('two_factor_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading 2FA settings:', error);
      }
      
      setSettings(data);
    } catch (error) {
      console.error('Error loading 2FA settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSecret = async () => {
    const newSecret = OTPAuth.authenticator.generateSecret();
    setSecret(newSecret);
    
    // Generate QR code
    const otpauth = OTPAuth.authenticator.keyuri(
      user?.email || 'user',
      'Profit Pathway Trading',
      newSecret
    );
    
    const qrUrl = await QRCode.toDataURL(otpauth);
    setQrCodeUrl(qrUrl);
    
    // Generate backup codes
    const codes = Array.from({ length: 8 }, () => 
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );
    setBackupCodes(codes);
    
    setStep('verify');
  };

  const verifyAndEnable = async () => {
    if (!user) return;
    
    setVerifying(true);
    try {
      const isValid = OTPAuth.authenticator.verify({
        token: verificationCode,
        secret: secret
      });

      if (!isValid) {
        toast.error('Invalid verification code. Please try again.');
        setVerifying(false);
        return;
      }

      // Save to database
      const { error } = await supabase
        .from('two_factor_settings')
        .upsert({
          user_id: user.id,
          is_enabled: true,
          secret_encrypted: secret, // In production, encrypt this
          backup_codes: backupCodes,
          verified_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Two-factor authentication enabled!');
      setStep('backup');
      await loadSettings();
    } catch (error: any) {
      console.error('2FA setup error:', error);
      toast.error('Failed to enable 2FA: ' + error.message);
    } finally {
      setVerifying(false);
    }
  };

  const disable2FA = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('two_factor_settings')
        .update({ is_enabled: false })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Two-factor authentication disabled');
      await loadSettings();
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      toast.error('Failed to disable 2FA');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleSetupComplete = () => {
    setSetupOpen(false);
    setStep('generate');
    setSecret('');
    setQrCodeUrl('');
    setVerificationCode('');
    setBackupCodes([]);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to protect your live trades
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Authenticator App</span>
              {settings?.is_enabled ? (
                <Badge variant="default" className="bg-green-500">Enabled</Badge>
              ) : (
                <Badge variant="secondary">Disabled</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Use Google Authenticator, Authy, or similar apps
            </p>
          </div>
          
          {settings?.is_enabled ? (
            <Button variant="destructive" size="sm" onClick={disable2FA}>
              Disable
            </Button>
          ) : (
            <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => { setSetupOpen(true); setStep('generate'); }}>
                  Enable
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
                  <DialogDescription>
                    {step === 'generate' && 'Click below to generate your secret key'}
                    {step === 'verify' && 'Scan the QR code with your authenticator app'}
                    {step === 'backup' && 'Save your backup codes in a safe place'}
                  </DialogDescription>
                </DialogHeader>

                {step === 'generate' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <QrCode className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground mb-4">
                        You'll need an authenticator app like Google Authenticator or Authy
                      </p>
                    </div>
                    <Button onClick={generateSecret} className="w-full">
                      Generate Secret Key
                    </Button>
                  </div>
                )}

                {step === 'verify' && (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      {qrCodeUrl && (
                        <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 rounded-lg" />
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Or enter this code manually:</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          value={showSecret ? secret : '••••••••••••••••'} 
                          readOnly 
                          className="font-mono text-sm"
                        />
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setShowSecret(!showSecret)}
                        >
                          {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => copyToClipboard(secret)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Enter the 6-digit code from your app:</Label>
                      <Input
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="text-center text-2xl font-mono tracking-widest"
                        maxLength={6}
                      />
                    </div>

                    <Button 
                      onClick={verifyAndEnable} 
                      disabled={verificationCode.length !== 6 || verifying}
                      className="w-full"
                    >
                      {verifying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        'Verify & Enable'
                      )}
                    </Button>
                  </div>
                )}

                {step === 'backup' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="font-medium text-green-700 dark:text-green-400">
                        2FA is now enabled!
                      </span>
                    </div>

                    <div className="space-y-2">
                      <Label>Backup Codes</Label>
                      <p className="text-sm text-muted-foreground">
                        Save these codes securely. You can use them to access your account if you lose your phone.
                      </p>
                      <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
                        {backupCodes.map((code, i) => (
                          <div key={i} className="text-center">{code}</div>
                        ))}
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => copyToClipboard(backupCodes.join('\n'))}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy All Codes
                      </Button>
                    </div>

                    <Button onClick={handleSetupComplete} className="w-full">
                      Done
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>

        {settings?.is_enabled && (
          <div className="p-3 bg-primary/10 rounded-lg">
            <p className="text-sm">
              <Shield className="h-4 w-4 inline mr-1" />
              You'll be asked for a verification code before executing live trades.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TwoFactorSetup;
