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

    // Fetch all data in parallel
    const [metricsResponse, profileResponse, peersResponse, quoteResponse, spxQuoteResponse, insiderResponse, newsResponse] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_API_KEY}`),
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
      fetch(`https://finnhub.io/api/v1/stock/peers?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
      fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
      fetch(`https://finnhub.io/api/v1/quote?symbol=SPY&token=${FINNHUB_API_KEY}`),
      fetch(`https://finnhub.io/api/v1/stock/insider-transactions?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
      fetch(`https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&to=${new Date().toISOString().split('T')[0]}&token=${FINNHUB_API_KEY}`)
    ]);

    const [metricsData, profileData, peersData, quoteData, spxQuoteData, insiderData, newsData] = await Promise.all([
      metricsResponse.json(),
      profileResponse.json(),
      peersResponse.json(),
      quoteResponse.json(),
      spxQuoteResponse.json(),
      insiderResponse.json(),
      newsResponse.json()
    ]);

    console.log('Fetched metrics:', metricsData);
    console.log('Fetched insider data:', insiderData);

    // Fetch peer metrics for comparison
    const peerSymbols = (peersData || []).slice(0, 5);
    const peerMetricsPromises = peerSymbols.map((peerSymbol: string) =>
      fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${peerSymbol}&metric=all&token=${FINNHUB_API_KEY}`)
        .then(res => res.json())
        .catch(() => null)
    );
    const peerMetrics = await Promise.all(peerMetricsPromises);

    // Calculate sector/industry rankings
    const calculateRanking = (value: number, peerValues: number[]) => {
      if (!value || !peerValues.length) return { rank: 'N/A', total: 'N/A' };
      const validPeers = peerValues.filter((v: number) => v && !isNaN(v));
      if (!validPeers.length) return { rank: 'N/A', total: 'N/A' };
      
      const allValues = [...validPeers, value].sort((a: number, b: number) => b - a);
      const rank = allValues.indexOf(value) + 1;
      return { rank, total: allValues.length };
    };

    const peerPEs = peerMetrics.map((m: any) => m?.metric?.peBasicExclExtraTTM).filter(Boolean);
    const peerROEs = peerMetrics.map((m: any) => m?.metric?.roeRfy).filter(Boolean);
    const peerROAs = peerMetrics.map((m: any) => m?.metric?.roaRfy).filter(Boolean);

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
      insiderTransactions: insiderData?.data || [],
      recentNews: newsData || [],
      rankings: {
        peRatio: calculateRanking(metricsData.metric?.peBasicExclExtraTTM, peerPEs),
        roe: calculateRanking(metricsData.metric?.roeRfy, peerROEs),
        roa: calculateRanking(metricsData.metric?.roaRfy, peerROAs)
      }
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
