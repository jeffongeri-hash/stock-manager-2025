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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Decrypt current refresh token
    const { data: rows, error: fetchError } = await userSupabase
      .rpc('get_broker_tokens', { broker_type_param: 'schwab' });
    const connection = Array.isArray(rows) ? rows[0] : null;

    if (fetchError || !connection?.refresh_token) {
      return new Response(
        JSON.stringify({ error: 'No Schwab connection found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    console.log('Refreshing Schwab token for user:', userId);

    const tokenResponse = await fetch('https://api.schwabapi.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${encodedCredentials}`,
      },
      body: tokenBody.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token refresh failed:', errorText);

      await supabase
        .from('broker_connections')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('broker_type', 'schwab');

      return new Response(
        JSON.stringify({ error: 'Token refresh failed. Please reconnect your Schwab account.', requiresReauth: true }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokens = await tokenResponse.json();

    await userSupabase.rpc('store_broker_tokens', {
      broker_type_param: 'schwab',
      access_token_param: tokens.access_token,
      refresh_token_param: tokens.refresh_token || connection.refresh_token,
      expires_at_param: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      accounts_param: null,
      status_param: 'connected',
    });

    return new Response(
      JSON.stringify({ success: true, expiresIn: tokens.expires_in, message: 'Token refreshed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error refreshing token:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
