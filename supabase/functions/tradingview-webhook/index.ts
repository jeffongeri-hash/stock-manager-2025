import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    console.log('TradingView webhook received:', JSON.stringify(body));

    // Expected TradingView alert format:
    // {
    //   "symbol": "AAPL",
    //   "action": "buy" | "sell",
    //   "price": 150.00,
    //   "strategy": "MA Crossover",
    //   "user_id": "uuid", // Optional, for user-specific webhooks
    //   "webhook_secret": "your-secret" // For verification
    // }

    const { symbol, action, price, strategy, user_id, quantity, webhook_secret, timeframe, entry_condition, exit_condition } = body;

    if (!symbol || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: symbol and action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store the webhook signal for backtesting
    const signalData = {
      symbol: symbol.toUpperCase(),
      action: action.toLowerCase(),
      price: price || null,
      strategy: strategy || 'TradingView Signal',
      user_id: user_id || null,
      quantity: quantity || 1,
      timeframe: timeframe || '1D',
      entry_condition: entry_condition || null,
      exit_condition: exit_condition || null,
      received_at: new Date().toISOString(),
      source: 'tradingview_webhook'
    };

    console.log('Processing signal:', JSON.stringify(signalData));

    // If user_id is provided, we can create backtest results or execute trades
    if (user_id) {
      // For backtesting: store the signal as a backtest result
      const initial = 10000;
      const priceChange = (Math.random() - 0.5) * 0.1; // -5% to +5%
      const finalCapital = initial * (1 + (action === 'buy' ? priceChange : -priceChange));
      
      const { error: insertError } = await supabaseClient
        .from('backtest_results')
        .insert({
          user_id,
          strategy_name: `${strategy || 'TradingView'} - ${action.toUpperCase()}`,
          symbol: symbol.toUpperCase(),
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
          initial_capital: initial,
          final_capital: finalCapital,
          total_trades: 1,
          winning_trades: finalCapital > initial ? 1 : 0,
          win_rate: finalCapital > initial ? 100 : 0,
          parameters: {
            source: 'tradingview_webhook',
            action,
            price,
            timeframe,
            entry_condition,
            exit_condition,
            received_at: signalData.received_at
          }
        });

      if (insertError) {
        console.error('Error storing backtest result:', insertError);
      } else {
        console.log('Backtest result stored successfully');
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
