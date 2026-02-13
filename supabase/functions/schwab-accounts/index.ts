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
    
    const userId = userData.user.id;

    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get stored connection
    const { data: connection, error: fetchError } = await supabase
      .from('broker_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('broker_type', 'schwab')
      .single();

    if (fetchError || !connection) {
      return new Response(
        JSON.stringify({ error: 'No Schwab connection found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token needs refresh
    const expiresAt = new Date(connection.token_expires_at);
    const now = new Date();
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

    let accessToken = connection.access_token;

    if (expiresAt.getTime() - now.getTime() <= bufferTime) {
      console.log('Token expired or expiring soon, refreshing...');
      
      const clientId = Deno.env.get('SCHWAB_APP_KEY');
      const clientSecret = Deno.env.get('SCHWAB_APP_SECRET');

      if (!clientId || !clientSecret) {
        return new Response(
          JSON.stringify({ error: 'Schwab API credentials not configured' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const encodedCredentials = btoa(`${clientId}:${clientSecret}`);

      const tokenBody = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: connection.refresh_token,
      });

      const tokenResponse = await fetch('https://api.schwabapi.com/v1/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${encodedCredentials}`,
        },
        body: tokenBody.toString(),
      });

      if (!tokenResponse.ok) {
        console.error('Token refresh failed');
        await supabase
          .from('broker_connections')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('broker_type', 'schwab');

        return new Response(
          JSON.stringify({ error: 'Token expired. Please reconnect your Schwab account.', requiresReauth: true }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokens = await tokenResponse.json();
      accessToken = tokens.access_token;

      // Update stored tokens
      await supabase
        .from('broker_connections')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || connection.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          status: 'connected',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('broker_type', 'schwab');
    }

    // Fetch live account data from Schwab
    console.log('Fetching live account data from Schwab');
    
    const accountsResponse = await fetch('https://api.schwabapi.com/trader/v1/accounts?fields=positions', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text();
      console.error('Failed to fetch accounts:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch account data', details: errorText }),
        { status: accountsResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accounts = await accountsResponse.json();

    // Update stored accounts data
    await supabase
      .from('broker_connections')
      .update({
        accounts: accounts,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('broker_type', 'schwab');

    return new Response(
      JSON.stringify({ 
        success: true,
        accounts: accounts,
        lastUpdated: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error fetching accounts:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
