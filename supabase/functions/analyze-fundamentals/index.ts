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

    const { fundamentals } = await req.json();
    
    // Input validation
    if (!fundamentals || typeof fundamentals !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Valid fundamentals data is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!fundamentals.symbol || typeof fundamentals.symbol !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Valid symbol is required in fundamentals data' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing fundamentals for:', fundamentals.symbol);

    const systemPrompt = `You are a financial analyst expert. Analyze the provided stock fundamentals and provide comprehensive, actionable insights. 
    
Your analysis should be structured in TWO parts:

PART 1 - Company Background & Overview:
- What the company does (main products/services, business model)
- Company's mission and strategic goals
- Industry position and competitive advantages
- Target markets and customer base
- Key information investors should know about the company's background

PART 2 - Financial Analysis:
1. Valuation metrics and what they indicate
2. Profitability and efficiency
3. Financial health and liquidity
4. Growth trends in sales and earnings
5. Comparison with sector/industry peers (including rankings)
6. Relative performance vs S&P 500
7. Insider trading activity implications
8. Recent news sentiment
9. Overall market sentiment (bullish, bearish, or neutral)
10. Key strengths and concerns

Keep explanations clear and accessible to both novice and experienced investors.

At the end, provide a clear sentiment classification: BULLISH, BEARISH, or NEUTRAL based on:
- Fundamental strength (ratios, growth, profitability)
- Insider activity (buying = positive, selling = negative)
- Recent news sentiment
- Market position vs peers

Format your response with clearly marked sections and the sentiment on the last line as: "SENTIMENT: [BULLISH/BEARISH/NEUTRAL]"`;

    // Calculate growth metrics
    const salesGrowth1Y = fundamentals.metrics.revenueGrowthTTMYoy || 'N/A';
    const salesGrowth3Y = fundamentals.metrics.revenueGrowth3Y || 'N/A';
    const salesGrowth5Y = fundamentals.metrics.revenueGrowth5Y || 'N/A';
    const epsGrowth1Y = fundamentals.metrics.epsGrowthTTMYoy || 'N/A';
    const epsGrowth3Y = fundamentals.metrics.epsGrowth3Y || 'N/A';
    const epsGrowth5Y = fundamentals.metrics.epsGrowth5Y || 'N/A';

    // Analyze insider transactions
    const insiderSummary = fundamentals.insiderTransactions?.slice(0, 10).reduce((acc: any, t: any) => {
      if (t.transactionCode === 'P') acc.buys++;
      if (t.transactionCode === 'S') acc.sells++;
      return acc;
    }, { buys: 0, sells: 0 }) || { buys: 0, sells: 0 };

    const userPrompt = `Analyze the fundamentals for ${fundamentals.name} (${fundamentals.symbol}):

Company Profile:
${fundamentals.profile?.description ? `Description: ${fundamentals.profile.description}` : ''}
${fundamentals.profile?.sector ? `Sector: ${fundamentals.profile.sector}` : ''}
${fundamentals.profile?.country ? `Country: ${fundamentals.profile.country}` : ''}
${fundamentals.profile?.weburl ? `Website: ${fundamentals.profile.weburl}` : ''}

Current Market Data:
- Current Price: $${fundamentals.currentPrice}
- Price Change: ${fundamentals.priceChangePercent}%
- Market Cap: $${fundamentals.marketCap}M
- Industry: ${fundamentals.industry}

Key Ratios:
- P/E Ratio: ${fundamentals.metrics.peBasicExclExtraTTM || 'N/A'} (Rank: ${fundamentals.rankings?.peRatio?.rank || 'N/A'}/${fundamentals.rankings?.peRatio?.total || 'N/A'} in peer group)
- P/B Ratio: ${fundamentals.metrics.pbAnnual || 'N/A'}
- P/S Ratio: ${fundamentals.metrics.psAnnual || 'N/A'}
- ROE: ${fundamentals.metrics.roeRfy || 'N/A'}% (Rank: ${fundamentals.rankings?.roe?.rank || 'N/A'}/${fundamentals.rankings?.roe?.total || 'N/A'} in peer group)
- ROA: ${fundamentals.metrics.roaRfy || 'N/A'}% (Rank: ${fundamentals.rankings?.roa?.rank || 'N/A'}/${fundamentals.rankings?.roa?.total || 'N/A'} in peer group)
- Net Margin: ${fundamentals.metrics.netProfitMarginAnnual || 'N/A'}%
- Current Ratio: ${fundamentals.metrics.currentRatioAnnual || 'N/A'}
- Quick Ratio: ${fundamentals.metrics.quickRatioAnnual || 'N/A'}
- Debt/Equity: ${fundamentals.metrics.totalDebt2TotalEquityAnnual || 'N/A'}

Growth Metrics:
- Revenue Growth (1Y): ${salesGrowth1Y}%
- Revenue Growth (3Y): ${salesGrowth3Y}%
- Revenue Growth (5Y): ${salesGrowth5Y}%
- EPS Growth (1Y): ${epsGrowth1Y}%
- EPS Growth (3Y): ${epsGrowth3Y}%
- EPS Growth (5Y): ${epsGrowth5Y}%

Stock vs S&P 500: ${fundamentals.symbol} is ${fundamentals.priceChangePercent > fundamentals.spxChange ? 'outperforming' : 'underperforming'} the S&P 500 (${fundamentals.spxChange}%)

Peer Companies: ${fundamentals.peers.join(', ')}

Recent Insider Activity (Last 10 transactions):
- Insider Buys: ${insiderSummary.buys}
- Insider Sells: ${insiderSummary.sells}
${insiderSummary.buys > insiderSummary.sells ? '(Positive signal - insiders are buying)' : insiderSummary.sells > insiderSummary.buys ? '(Negative signal - insiders are selling)' : '(Neutral)'}

Recent News Headlines (Last 7 days):
${fundamentals.recentNews?.slice(0, 5).map((n: any) => `- ${n.headline}`).join('\n') || 'No recent news available'}

Provide a comprehensive two-part analysis:
1. Company Background & Overview - Explain what this company does, their mission/goals, and key background info investors need
2. Financial Analysis - Detailed analysis of fundamentals, growth trajectory, peer comparison, and investment potential

End with a clear sentiment.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const analysis = aiResponse.choices[0].message.content;

    // Extract sentiment from analysis
    let sentiment = 'NEUTRAL';
    const sentimentMatch = analysis.match(/SENTIMENT:\s*(BULLISH|BEARISH|NEUTRAL)/i);
    if (sentimentMatch) {
      sentiment = sentimentMatch[1].toUpperCase();
    }

    console.log('Successfully analyzed fundamentals with sentiment:', sentiment);

    return new Response(
      JSON.stringify({ analysis, sentiment }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-fundamentals function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
