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
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

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

    const { data: rows, error: connError } = await userSupabase
      .rpc('get_broker_tokens', { broker_type_param: 'ibkr' });
    const connection = Array.isArray(rows) ? rows[0] : null;

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ error: 'No IBKR connection found', connected: false }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokenExpired = new Date(connection.token_expires_at) < new Date();
    if (tokenExpired) {
      return new Response(
        JSON.stringify({ error: 'Token expired', connected: false, needsReauth: true }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const accountsResponse = await fetch('https://api.ibkr.com/v1/api/portfolio/accounts', {
        headers: { 'Authorization': `Bearer ${connection.access_token}` },
      });

      if (accountsResponse.ok) {
        const accounts = await accountsResponse.json();

        const accountsWithBalance = await Promise.all(
          accounts.map(async (account: any) => {
            try {
              const summaryResponse = await fetch(
                `https://api.ibkr.com/v1/api/portfolio/${account.accountId}/summary`,
                { headers: { 'Authorization': `Bearer ${connection.access_token}` } }
              );
              if (summaryResponse.ok) {
                const summary = await summaryResponse.json();
                return { ...account, summary };
              }
              return account;
            } catch {
              return account;
            }
          })
        );

        return new Response(
          JSON.stringify({ connected: true, accounts: accountsWithBalance, lastUpdated: new Date().toISOString() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({ connected: true, accounts: connection.accounts || [], cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (fetchError) {
      console.error('Failed to fetch live IBKR data:', fetchError);
      return new Response(
        JSON.stringify({ connected: true, accounts: connection.accounts || [], cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: unknown) {
    console.error('Error fetching IBKR accounts:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
