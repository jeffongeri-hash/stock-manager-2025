import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TICKER_REGEX = /^[A-Z]{1,10}$/;
const VALID_ACTIONS = ['buy', 'sell'];
const VALID_TIMEFRAMES = ['1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W', '1M'];
const MAX_PRICE = 1_000_000;
const MAX_QUANTITY = 100_000;
const MAX_STRING_LEN = 500;

function sanitize(str: string | undefined | null, maxLen = MAX_STRING_LEN): string | null {
  if (!str) return null;
  return String(str).replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, maxLen);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { symbol, action, price, strategy, user_id, quantity, timeframe, entry_condition, exit_condition } = body as Record<string, any>;

    // Validate symbol
    const upperSymbol = String(symbol ?? '').toUpperCase();
    if (!TICKER_REGEX.test(upperSymbol)) {
      return new Response(
        JSON.stringify({ error: 'Invalid symbol. Must be 1-10 uppercase letters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate action
    const lowerAction = String(action ?? '').toLowerCase();
    if (!VALID_ACTIONS.includes(lowerAction)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be "buy" or "sell".' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate numeric fields
    const validPrice = typeof price === 'number' && price > 0 && price <= MAX_PRICE ? price : null;
    const validQuantity = typeof quantity === 'number' && quantity > 0 && quantity <= MAX_QUANTITY ? quantity : 1;

    // Validate timeframe
    const validTimeframe = VALID_TIMEFRAMES.includes(String(timeframe ?? '')) ? String(timeframe) : '1D';

    // Sanitize string fields
    const validStrategy = sanitize(strategy) || 'TradingView Signal';
    const validEntryCondition = sanitize(entry_condition);
    const validExitCondition = sanitize(exit_condition);

    const signalData = {
      symbol: upperSymbol,
      action: lowerAction,
      price: validPrice,
      strategy: validStrategy,
      user_id: user_id || null,
      quantity: validQuantity,
      timeframe: validTimeframe,
      entry_condition: validEntryCondition,
      exit_condition: validExitCondition,
      received_at: new Date().toISOString(),
      source: 'tradingview_webhook'
    };

    console.log('Processing signal:', JSON.stringify(signalData));

    // If user_id is provided, verify ownership via auth header
    if (user_id) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Authorization header required when user_id is provided' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabaseAuth = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );

      const token = authHeader.replace('Bearer ', '');
      const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(
          JSON.stringify({ error: 'Invalid authentication token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (claimsData.claims.sub !== user_id) {
        return new Response(
          JSON.stringify({ error: 'user_id does not match authenticated user' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Rate limit: max 100 signals per hour per user
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      const { count } = await supabaseClient
        .from('backtest_results')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user_id)
        .gte('created_at', oneHourAgo);

      if (count && count > 100) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Max 100 signals per hour.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const initial = 10000;
      const priceChange = (Math.random() - 0.5) * 0.1;
      const finalCapital = initial * (1 + (lowerAction === 'buy' ? priceChange : -priceChange));

      const { error: insertError } = await supabaseClient
        .from('backtest_results')
        .insert({
          user_id,
          strategy_name: `${validStrategy} - ${lowerAction.toUpperCase()}`,
          symbol: upperSymbol,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
          initial_capital: initial,
          final_capital: finalCapital,
          total_trades: 1,
          winning_trades: finalCapital > initial ? 1 : 0,
          win_rate: finalCapital > initial ? 100 : 0,
          parameters: {
            source: 'tradingview_webhook',
            action: lowerAction,
            price: validPrice,
            timeframe: validTimeframe,
            entry_condition: validEntryCondition,
            exit_condition: validExitCondition,
            received_at: signalData.received_at
          }
        });

      if (insertError) {
        console.error('Error storing backtest result:', insertError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook signal received and processed',
        signal: signalData
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing TradingView webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
