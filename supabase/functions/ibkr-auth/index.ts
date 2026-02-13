const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get('IBKR_CLIENT_ID');
    const redirectUri = Deno.env.get('IBKR_REDIRECT_URI');

    if (!clientId || !redirectUri) {
      return new Response(
        JSON.stringify({ 
          error: 'Interactive Brokers API credentials not configured',
          message: 'Please add IBKR_CLIENT_ID and IBKR_REDIRECT_URI to your secrets',
          needsSetup: true
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a random state for CSRF protection
    const state = crypto.randomUUID();

    // Interactive Brokers OAuth URL (Client Portal API)
    // Documentation: https://www.interactivebrokers.com/api/doc.html
    const authUrl = new URL('https://www.interactivebrokers.com/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'openid profile');
    authUrl.searchParams.set('state', state);

    return new Response(
      JSON.stringify({ 
        authUrl: authUrl.toString(),
        state: state,
        message: 'Redirect user to this URL to authenticate with Interactive Brokers'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error generating IBKR auth URL:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
