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
    const { symbols } = await req.json();
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Symbols array is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching stock data for:', symbols);

    // Yahoo Finance query1 API endpoint
    const symbolsParam = symbols.join(',');
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsParam}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!response.ok) {
      console.error('Yahoo Finance API error:', response.status);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch stock data' }), 
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Transform the data to a simpler format
    const stocks = data.quoteResponse.result.map((quote: any) => ({
      symbol: quote.symbol,
      name: quote.longName || quote.shortName,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      volume: quote.regularMarketVolume,
      marketCap: quote.marketCap,
      high: quote.regularMarketDayHigh,
      low: quote.regularMarketDayLow,
      open: quote.regularMarketOpen,
      previousClose: quote.regularMarketPreviousClose,
    }));

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
