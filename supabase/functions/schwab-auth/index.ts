import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get('SCHWAB_APP_KEY');
    const redirectUri = Deno.env.get('SCHWAB_REDIRECT_URI');

    if (!clientId || !redirectUri) {
      return new Response(
        JSON.stringify({ 
          error: 'Schwab API credentials not configured',
          message: 'Please add SCHWAB_APP_KEY and SCHWAB_REDIRECT_URI to your secrets'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Schwab OAuth authorization URL
    // https://developer.schwab.com/user-guides/get-started/authenticate-with-oauth
    const authUrl = new URL('https://api.schwabapi.com/v1/oauth/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('client_id', clientId);

    console.log('Generated Schwab auth URL for client:', clientId);

    return new Response(
      JSON.stringify({ 
        authUrl: authUrl.toString(),
        message: 'Redirect user to this URL to authenticate with Schwab'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error generating auth URL:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
