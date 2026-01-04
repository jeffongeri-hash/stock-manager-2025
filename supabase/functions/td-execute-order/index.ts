import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderRequest {
  userId: string;
  accountId: string;
  symbol: string;
  quantity: number;
  orderType: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
  instruction: 'BUY' | 'SELL' | 'BUY_TO_COVER' | 'SELL_SHORT';
  price?: number;
  stopPrice?: number;
  duration?: 'DAY' | 'GOOD_TILL_CANCEL' | 'FILL_OR_KILL';
}

async function refreshToken(supabase: any, userId: string): Promise<string | null> {
  const { data: connection } = await supabase
    .from('broker_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('broker_type', 'td_ameritrade')
    .single();

  if (!connection) {
    return null;
  }

  // Check if token is expired or will expire soon
  const expiresAt = new Date(connection.token_expires_at);
  const now = new Date();
  const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

  if (expiresAt.getTime() - now.getTime() > bufferTime) {
    return connection.access_token;
  }

  // Refresh the token
  const clientId = Deno.env.get('TD_AMERITRADE_CLIENT_ID');
  const clientSecret = Deno.env.get('TD_AMERITRADE_CLIENT_SECRET');

  const tokenBody = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: connection.refresh_token,
    client_id: `${clientId}@AMER.OAUTHAP`,
  });

  if (clientSecret) {
    tokenBody.append('client_secret', clientSecret);
  }

  const tokenResponse = await fetch('https://api.tdameritrade.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: tokenBody.toString(),
  });

  if (!tokenResponse.ok) {
    console.error('Token refresh failed');
    return null;
  }

  const tokens = await tokenResponse.json();

  // Update stored tokens
  await supabase
    .from('broker_connections')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || connection.refresh_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('broker_type', 'td_ameritrade');

  return tokens.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const orderRequest: OrderRequest = await req.json();
    
    const { userId, accountId, symbol, quantity, orderType, instruction, price, stopPrice, duration = 'DAY' } = orderRequest;

    if (!userId || !accountId || !symbol || !quantity || !instruction) {
      return new Response(
        JSON.stringify({ error: 'Missing required order parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get fresh access token
    const accessToken = await refreshToken(supabase, userId);

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'No valid TD Ameritrade connection found. Please reconnect your account.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build order payload for TD Ameritrade API
    const orderPayload: any = {
      orderType: orderType,
      session: 'NORMAL',
      duration: duration,
      orderStrategyType: 'SINGLE',
      orderLegCollection: [
        {
          instruction: instruction,
          quantity: quantity,
          instrument: {
            symbol: symbol,
            assetType: 'EQUITY',
          },
        },
      ],
    };

    // Add price for limit orders
    if ((orderType === 'LIMIT' || orderType === 'STOP_LIMIT') && price) {
      orderPayload.price = price.toFixed(2);
    }

    // Add stop price for stop orders
    if ((orderType === 'STOP' || orderType === 'STOP_LIMIT') && stopPrice) {
      orderPayload.stopPrice = stopPrice.toFixed(2);
    }

    // Submit order to TD Ameritrade
    const orderResponse = await fetch(
      `https://api.tdameritrade.com/v1/accounts/${accountId}/orders`,
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
      return new Response(
        JSON.stringify({ 
          error: 'Failed to submit order',
          details: errorText,
          status: orderResponse.status
        }),
        { status: orderResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get order ID from location header
    const locationHeader = orderResponse.headers.get('Location');
    const orderId = locationHeader ? locationHeader.split('/').pop() : null;

    // Log the order execution
    await supabase
      .from('order_executions')
      .insert({
        user_id: userId,
        broker_type: 'td_ameritrade',
        account_id: accountId,
        symbol: symbol,
        quantity: quantity,
        order_type: orderType,
        instruction: instruction,
        price: price,
        stop_price: stopPrice,
        order_id: orderId,
        status: 'submitted',
        created_at: new Date().toISOString(),
      });

    return new Response(
      JSON.stringify({ 
        success: true,
        orderId: orderId,
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
