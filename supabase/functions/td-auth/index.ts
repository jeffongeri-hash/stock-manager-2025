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
    const clientId = Deno.env.get('TD_AMERITRADE_CLIENT_ID');
    const redirectUri = Deno.env.get('TD_AMERITRADE_REDIRECT_URI');

    if (!clientId || !redirectUri) {
      return new Response(
        JSON.stringify({ 
          error: 'TD Ameritrade API credentials not configured',
          message: 'Please add TD_AMERITRADE_CLIENT_ID and TD_AMERITRADE_REDIRECT_URI to your secrets'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // TD Ameritrade OAuth URL (Schwab API since they merged)
    // https://developer.schwab.com/products/trader-api--individual
    const authUrl = new URL('https://auth.tdameritrade.com/auth');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('client_id', `${clientId}@AMER.OAUTHAP`);

    return new Response(
      JSON.stringify({ 
        authUrl: authUrl.toString(),
        message: 'Redirect user to this URL to authenticate with TD Ameritrade'
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
