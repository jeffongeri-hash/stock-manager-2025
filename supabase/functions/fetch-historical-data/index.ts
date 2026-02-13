const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, from, to, resolution = 'D' } = await req.json();
    
    if (!symbol) {
      return new Response(
        JSON.stringify({ error: 'Symbol is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const FINNHUB_API_KEY = Deno.env.get('FINNHUB_API_KEY');
    if (!FINNHUB_API_KEY) {
      throw new Error('FINNHUB_API_KEY is not configured');
    }

    // Convert dates to Unix timestamps
    const fromTimestamp = from ? Math.floor(new Date(from).getTime() / 1000) : Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60;
    const toTimestamp = to ? Math.floor(new Date(to).getTime() / 1000) : Math.floor(Date.now() / 1000);

    console.log(`Fetching historical data for ${symbol} from ${new Date(fromTimestamp * 1000).toISOString()} to ${new Date(toTimestamp * 1000).toISOString()}`);

    // Fetch candle data from Finnhub
    const candleUrl = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${fromTimestamp}&to=${toTimestamp}&token=${FINNHUB_API_KEY}`;
    const candleResponse = await fetch(candleUrl);
    const candleData = await candleResponse.json();

    if (candleData.s === 'no_data') {
      return new Response(
        JSON.stringify({ error: 'No data available for this symbol and date range', data: [] }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform the data into a more usable format
    const historicalData = [];
    if (candleData.t && candleData.c) {
      for (let i = 0; i < candleData.t.length; i++) {
        historicalData.push({
          date: new Date(candleData.t[i] * 1000).toISOString().split('T')[0],
          timestamp: candleData.t[i],
          open: candleData.o[i],
          high: candleData.h[i],
          low: candleData.l[i],
          close: candleData.c[i],
          volume: candleData.v[i],
        });
      }
    }

    console.log(`Successfully fetched ${historicalData.length} data points for ${symbol}`);

    return new Response(
      JSON.stringify({ 
        symbol,
        data: historicalData,
        count: historicalData.length 
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-historical-data function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
