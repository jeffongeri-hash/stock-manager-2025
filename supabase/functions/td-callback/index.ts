import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, userId } = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Authorization code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientId = Deno.env.get('TD_AMERITRADE_CLIENT_ID');
    const clientSecret = Deno.env.get('TD_AMERITRADE_CLIENT_SECRET');
    const redirectUri = Deno.env.get('TD_AMERITRADE_REDIRECT_URI');

    if (!clientId || !redirectUri) {
      return new Response(
        JSON.stringify({ error: 'TD Ameritrade API credentials not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Exchange authorization code for access token
    const tokenUrl = 'https://api.tdameritrade.com/v1/oauth2/token';
    
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      access_type: 'offline',
      code: decodeURIComponent(code),
      client_id: `${clientId}@AMER.OAUTHAP`,
      redirect_uri: redirectUri,
    });

    // Add client secret if available (for confidential clients)
    if (clientSecret) {
      tokenBody.append('client_secret', clientSecret);
    }

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
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

    // Get account info
    const accountsResponse = await fetch('https://api.tdameritrade.com/v1/accounts', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    let accounts = [];
    if (accountsResponse.ok) {
      accounts = await accountsResponse.json();
    }

    // Store tokens in Supabase if userId is provided
    if (userId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Store the broker connection with encrypted tokens
      const { error: dbError } = await supabase
        .from('broker_connections')
        .upsert({
          user_id: userId,
          broker_type: 'td_ameritrade',
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
    console.error('Error in TD callback:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
