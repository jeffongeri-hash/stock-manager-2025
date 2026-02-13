const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing authorization header' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { symbols } = await req.json();
    
    // Input validation
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Symbols array is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (symbols.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Maximum 50 symbols allowed' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate each symbol (alphanumeric only, max 10 chars)
    const validSymbolRegex = /^[A-Z0-9]{1,10}$/i;
    for (const symbol of symbols) {
      if (typeof symbol !== 'string' || !validSymbolRegex.test(symbol)) {
        return new Response(
          JSON.stringify({ error: `Invalid symbol format: ${symbol}` }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const FINNHUB_API_KEY = Deno.env.get('FINNHUB_API_KEY');
    if (!FINNHUB_API_KEY) {
      throw new Error('FINNHUB_API_KEY is not configured');
    }

    console.log('Fetching stock data for:', symbols);

    // Fetch data for each symbol
    const stockPromises = symbols.map(async (symbol) => {
      try {
        // Get quote data
        const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
        const quoteResponse = await fetch(quoteUrl);
        const quoteData = await quoteResponse.json();

        // Get profile data for company name
        const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
        const profileResponse = await fetch(profileUrl);
        const profileData = await profileResponse.json();

        return {
          symbol: symbol,
          name: profileData.name || symbol,
          price: quoteData.c, // current price
          change: quoteData.d, // change
          changePercent: quoteData.dp, // percent change
          high: quoteData.h, // high
          low: quoteData.l, // low
          open: quoteData.o, // open
          previousClose: quoteData.pc, // previous close
          volume: profileData.shareOutstanding,
          marketCap: profileData.marketCapitalization,
        };
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        return null;
      }
    });

    const stocks = (await Promise.all(stockPromises)).filter(stock => stock !== null);

    console.log('Successfully fetched data for', stocks.length, 'stocks');

    return new Response(
      JSON.stringify({ stocks }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-stock-data function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
