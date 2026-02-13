import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Create client with user's auth to validate the token
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Validate the JWT token and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await userSupabase.auth.getUser(token);
    
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const authenticatedUserId = userData.user.id;

    const { code } = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Authorization code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientId = Deno.env.get('SCHWAB_APP_KEY');
    const clientSecret = Deno.env.get('SCHWAB_APP_SECRET');
    const redirectUri = Deno.env.get('SCHWAB_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      return new Response(
        JSON.stringify({ error: 'Schwab API credentials not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Schwab requires Basic Auth header with base64 encoded credentials
    const encodedCredentials = btoa(`${clientId}:${clientSecret}`);

    // Exchange authorization code for access token
    // https://developer.schwab.com/user-guides/get-started/authenticate-with-oauth
    const tokenUrl = 'https://api.schwabapi.com/v1/oauth/token';
    
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
    });

    console.log('Exchanging code for token with Schwab API');

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${encodedCredentials}`,
      },
      body: tokenBody.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to exchange authorization code', details: errorText }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokens = await tokenResponse.json();
    console.log('Token exchange successful, fetching accounts');

    // Get account info using the Schwab Trader API
    const accountsResponse = await fetch('https://api.schwabapi.com/trader/v1/accounts', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    let accounts = [];
    if (accountsResponse.ok) {
      accounts = await accountsResponse.json();
      console.log('Fetched accounts:', accounts.length);
    } else {
      console.error('Failed to fetch accounts:', await accountsResponse.text());
    }

    // Store tokens in Supabase using authenticated user ID
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store the broker connection with encrypted tokens
    const { error: dbError } = await supabase
      .from('broker_connections')
      .upsert({
        user_id: authenticatedUserId,
        broker_type: 'schwab',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        accounts: accounts,
        status: 'connected',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,broker_type'
      });

    if (dbError) {
      console.error('Failed to store broker connection:', dbError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
        accounts: accounts,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in Schwab callback:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
