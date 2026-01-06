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
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    const clientId = Deno.env.get('SCHWAB_APP_KEY');
    const clientSecret = Deno.env.get('SCHWAB_APP_SECRET');

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: 'Schwab API credentials not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Schwab requires Basic Auth header with base64 encoded credentials
    const encodedCredentials = btoa(`${clientId}:${clientSecret}`);

    // Refresh the token
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
      
      // Mark connection as needing re-auth
      await supabase
        .from('broker_connections')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('broker_type', 'schwab');

      return new Response(
        JSON.stringify({ 
          error: 'Token refresh failed. Please reconnect your Schwab account.',
          requiresReauth: true
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokens = await tokenResponse.json();
    console.log('Token refresh successful');

    // Update stored tokens
    const { error: updateError } = await supabase
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

    if (updateError) {
      console.error('Failed to update tokens:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        expiresIn: tokens.expires_in,
        message: 'Token refreshed successfully'
      }),
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
