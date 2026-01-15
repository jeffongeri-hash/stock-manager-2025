import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SchwabCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setStatus('error');
        setErrorMessage(errorDescription || error || 'Authentication was denied');
        return;
      }

      if (!code) {
        setStatus('error');
        setErrorMessage('No authorization code received from Schwab');
        return;
      }

      try {
        const session = await supabase.auth.getSession();
        
        if (!session.data.session) {
          setStatus('error');
          setErrorMessage('You must be logged in to connect your Schwab account');
          return;
        }

        const { data, error: callbackError } = await supabase.functions.invoke('schwab-callback', {
          body: { code },
          headers: {
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
        });

        if (callbackError) {
          throw callbackError;
        }

        setStatus('success');
        toast({
          title: 'Connected to Schwab',
          description: `Successfully linked ${data.accounts?.length || 0} account(s)`,
        });

        // Also post message to parent window if opened in popup
        if (window.opener) {
          window.opener.postMessage({ type: 'SCHWAB_AUTH_CALLBACK', success: true }, '*');
          setTimeout(() => window.close(), 2000);
        }
      } catch (err: any) {
        console.error('Callback error:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Failed to complete Schwab authentication');
        
        if (window.opener) {
          window.opener.postMessage({ type: 'SCHWAB_AUTH_CALLBACK', success: false, error: err.message }, '*');
        }
      }
    };

    processCallback();
  }, [searchParams, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'processing' && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
            {status === 'success' && <CheckCircle className="h-6 w-6 text-green-500" />}
            {status === 'error' && <XCircle className="h-6 w-6 text-destructive" />}
            {status === 'processing' && 'Connecting to Schwab...'}
            {status === 'success' && 'Successfully Connected!'}
            {status === 'error' && 'Connection Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'processing' && 'Please wait while we complete the authentication.'}
            {status === 'success' && 'Your Schwab account has been linked to your profile.'}
            {status === 'error' && errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          {status !== 'processing' && (
            <Button onClick={() => navigate('/assets')} className="w-full">
              {status === 'success' ? 'View Your Assets' : 'Return to Assets'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
