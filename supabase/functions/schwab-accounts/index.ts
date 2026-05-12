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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await userSupabase.auth.getUser(token);

    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;

    // Decrypt tokens via secure RPC
    const { data: rows, error: fetchError } = await userSupabase
      .rpc('get_broker_tokens', { broker_type_param: 'schwab' });

    const connection = Array.isArray(rows) ? rows[0] : null;

    if (fetchError || !connection) {
      return new Response(
        JSON.stringify({ error: 'No Schwab connection found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let accessToken: string = connection.access_token;
    const expiresAt = new Date(connection.token_expires_at);
    const now = new Date();
    const bufferTime = 5 * 60 * 1000;

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

      await userSupabase.rpc('store_broker_tokens', {
        broker_type_param: 'schwab',
        access_token_param: tokens.access_token,
        refresh_token_param: tokens.refresh_token || connection.refresh_token,
        expires_at_param: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        accounts_param: null,
        status_param: 'connected',
      });
    }

    // Fetch live account data from Schwab
    console.log('Fetching live account data from Schwab');
    const accountsResponse = await fetch('https://api.schwabapi.com/trader/v1/accounts?fields=positions', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
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

    // Persist accounts (non-sensitive)
    await supabase
      .from('broker_connections')
      .update({ accounts, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('broker_type', 'schwab');

    return new Response(
      JSON.stringify({ success: true, accounts, lastUpdated: new Date().toISOString() }),
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
