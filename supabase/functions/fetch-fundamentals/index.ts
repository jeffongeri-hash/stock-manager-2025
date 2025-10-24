import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    
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

    console.log('Fetching fundamentals for:', symbol);

    // Fetch basic metrics and ratios
    const metricsUrl = `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_API_KEY}`;
    const metricsResponse = await fetch(metricsUrl);
    const metricsData = await metricsResponse.json();

    // Fetch company profile
    const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    const profileResponse = await fetch(profileUrl);
    const profileData = await profileResponse.json();

    // Fetch peer companies
    const peersUrl = `https://finnhub.io/api/v1/stock/peers?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    const peersResponse = await fetch(peersUrl);
    const peersData = await peersResponse.json();

    // Fetch current quote
    const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    const quoteResponse = await fetch(quoteUrl);
    const quoteData = await quoteResponse.json();

    // Fetch SPX quote for comparison
    const spxQuoteUrl = `https://finnhub.io/api/v1/quote?symbol=SPX&token=${FINNHUB_API_KEY}`;
    const spxQuoteResponse = await fetch(spxQuoteUrl);
    const spxQuoteData = await spxQuoteResponse.json();

    const fundamentals = {
      symbol,
      name: profileData.name,
      industry: profileData.finnhubIndustry,
      marketCap: profileData.marketCapitalization,
      currentPrice: quoteData.c,
      priceChange: quoteData.d,
      priceChangePercent: quoteData.dp,
      metrics: metricsData.metric || {},
      peers: peersData || [],
      spxChange: spxQuoteData.dp,
      profile: profileData,
    };

    console.log('Successfully fetched fundamentals');

    return new Response(
      JSON.stringify({ fundamentals }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-fundamentals function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
