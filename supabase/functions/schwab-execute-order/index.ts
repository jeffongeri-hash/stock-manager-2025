import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderRequest {
  accountId: string;
  symbol: string;
  quantity: number;
  orderType: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
  instruction: 'BUY' | 'SELL' | 'BUY_TO_COVER' | 'SELL_SHORT';
  price?: number;
  stopPrice?: number;
  duration?: 'DAY' | 'GOOD_TILL_CANCEL' | 'FILL_OR_KILL';
}

async function getValidAccessToken(
  userSupabase: any,
  clientId: string,
  clientSecret: string
): Promise<string | null> {
  const { data: rows } = await userSupabase
    .rpc('get_broker_tokens', { broker_type_param: 'schwab' });
  const connection = Array.isArray(rows) ? rows[0] : null;
  if (!connection) return null;

  const expiresAt = new Date(connection.token_expires_at);
  const bufferTime = 5 * 60 * 1000;

  if (expiresAt.getTime() - Date.now() > bufferTime) {
    return connection.access_token;
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
    return null;
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

  return tokens.access_token;
}

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
    const { data: claimsData, error: claimsError } = await userSupabase.auth.getUser(token);

    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.user.id;
    const orderRequest: OrderRequest = await req.json();
    const { accountId, symbol, quantity, orderType, instruction, price, stopPrice, duration = 'DAY' } = orderRequest;

    if (!accountId || !symbol || !quantity || !instruction) {
      return new Response(
        JSON.stringify({ error: 'Missing required order parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const accessToken = await getValidAccessToken(userSupabase, clientId, clientSecret);

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'No valid Schwab connection found. Please reconnect your account.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orderPayload: any = {
      orderType,
      session: 'NORMAL',
      duration,
      orderStrategyType: 'SINGLE',
      orderLegCollection: [
        {
          instruction,
          quantity,
          instrument: { symbol, assetType: 'EQUITY' },
        },
      ],
    };

    if ((orderType === 'LIMIT' || orderType === 'STOP_LIMIT') && price) {
      orderPayload.price = price.toFixed(2);
    }
    if ((orderType === 'STOP' || orderType === 'STOP_LIMIT') && stopPrice) {
      orderPayload.stopPrice = stopPrice.toFixed(2);
    }

    console.log('Submitting order to Schwab:', { symbol, quantity, orderType, instruction });

    const orderResponse = await fetch(
      `https://api.schwabapi.com/trader/v1/accounts/${accountId}/orders`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      }
    );

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('Order submission failed:', errorText);

      await supabase.from('order_executions').insert({
        user_id: userId, broker_type: 'schwab', account_id: accountId, symbol, quantity,
        order_type: orderType, instruction, price, stop_price: stopPrice,
        status: 'failed', error_message: errorText, created_at: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({ error: 'Failed to submit order', details: errorText, status: orderResponse.status }),
        { status: orderResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const locationHeader = orderResponse.headers.get('Location');
    const orderId = locationHeader ? locationHeader.split('/').pop() : null;

    await supabase.from('order_executions').insert({
      user_id: userId, broker_type: 'schwab', account_id: accountId, symbol, quantity,
      order_type: orderType, instruction, price, stop_price: stopPrice,
      order_id: orderId, status: 'submitted', created_at: new Date().toISOString(),
    });

    console.log('Order submitted successfully:', orderId);

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        message: `${instruction} order for ${quantity} shares of ${symbol} submitted successfully`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error executing order:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
