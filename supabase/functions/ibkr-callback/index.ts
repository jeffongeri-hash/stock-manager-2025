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
    const { code, state } = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Authorization code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientId = Deno.env.get('IBKR_CLIENT_ID');
    const clientSecret = Deno.env.get('IBKR_CLIENT_SECRET');
    const redirectUri = Deno.env.get('IBKR_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      return new Response(
        JSON.stringify({ error: 'Interactive Brokers API credentials not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Exchange authorization code for access token
    const tokenUrl = 'https://www.interactivebrokers.com/oauth2/token';
    
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code: decodeURIComponent(code),
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenBody.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('IBKR Token exchange failed:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to exchange authorization code', details: errorText }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokens = await tokenResponse.json();

    // Get account info from IBKR Web API
    let accounts = [];
    try {
      const accountsResponse = await fetch('https://api.ibkr.com/v1/api/portfolio/accounts', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      });

      if (accountsResponse.ok) {
        accounts = await accountsResponse.json();
      }
    } catch (accountError) {
      console.error('Failed to fetch IBKR accounts:', accountError);
    }

    // Store tokens in Supabase using authenticated user ID
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();

    // Store the broker connection
    const { error: dbError } = await supabase
      .from('broker_connections')
      .upsert({
        user_id: authenticatedUserId,
        broker_type: 'interactive_brokers',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        token_expires_at: expiresAt,
        accounts: accounts,
        status: 'connected',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,broker_type'
      });

    if (dbError) {
      console.error('Failed to store IBKR broker connection:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to store connection', details: dbError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        expiresIn: tokens.expires_in,
        accounts: accounts,
        message: 'Successfully connected to Interactive Brokers'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in IBKR callback:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
