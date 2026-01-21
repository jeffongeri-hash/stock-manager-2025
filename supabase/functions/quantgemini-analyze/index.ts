import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INVESTOR_PROMPTS = `
Analyze the stock based on these strict investor criteria:
1. William O'Neil (CAN SLIM): Explosive earnings (25-50%+), chart breakouts, institutional demand, ROE >= 17%.
2. Warren Buffett (Value/Moat): Intrinsic value, ROE >= 15%, high ROA, consistent margins, low debt, free cash flow.
3. Bill Ackman (Activist Value): Undervalued, high-quality, operational influence, FCF yield, ROIC, balance sheet strength.
4. Martin Shkreli (Event-driven): Pipeline catalysts (biotech), mispriced assets, EV/EBITDA, clinical milestones.
5. Peter Lynch (GARP): PEG ratio <= 1.0, EPS growth 15-30%, ROE > 15%, buy what you understand.
`;

async function fetchFinnhubData(symbol: string, apiKey: string) {
  try {
    const [quoteRes, profileRes, newsRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`),
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`),
      fetch(`https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${getDateDaysAgo(7)}&to=${getToday()}&token=${apiKey}`)
    ]);

    const [quote, profile, news] = await Promise.all([
      quoteRes.json(),
      profileRes.json(),
      newsRes.json()
    ]);

    return {
      quote,
      profile,
      news: Array.isArray(news) ? news.slice(0, 10) : []
    };
  } catch (error) {
    console.error('Finnhub fetch error:', error);
    return null;
  }
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticker, action } = await req.json();
    
    if (!ticker) {
      return new Response(
        JSON.stringify({ error: 'Ticker symbol is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch live market data from Finnhub
    let liveData = null;
    let finnhubNews: any[] = [];
    let companyProfile = null;

    if (FINNHUB_API_KEY) {
      const finnhubData = await fetchFinnhubData(ticker.toUpperCase(), FINNHUB_API_KEY);
      if (finnhubData) {
        liveData = {
          currentPrice: finnhubData.quote?.c || 0,
          high: finnhubData.quote?.h || 0,
          low: finnhubData.quote?.l || 0,
          previousClose: finnhubData.quote?.pc || 0,
          changePercent: finnhubData.quote?.dp || 0,
          timestamp: new Date().toISOString()
        };
        companyProfile = finnhubData.profile;
        finnhubNews = finnhubData.news;
      }
    }

    // If just refreshing price, return early
    if (action === 'refresh_price') {
      return new Response(
        JSON.stringify({ liveData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the prompt with live data context
    const liveContext = liveData ? `
LIVE MARKET DATA (use these exact values):
- Current Price: $${liveData.currentPrice.toFixed(2)}
- Day High: $${liveData.high.toFixed(2)}
- Day Low: $${liveData.low.toFixed(2)}
- Previous Close: $${liveData.previousClose.toFixed(2)}
- Change: ${liveData.changePercent >= 0 ? '+' : ''}${liveData.changePercent.toFixed(2)}%
${companyProfile?.name ? `- Company: ${companyProfile.name}` : ''}
${companyProfile?.finnhubIndustry ? `- Industry: ${companyProfile.finnhubIndustry}` : ''}
${companyProfile?.marketCapitalization ? `- Market Cap: $${(companyProfile.marketCapitalization / 1000).toFixed(2)}B` : ''}
` : '';

    const newsContext = finnhubNews.length > 0 ? `
RECENT NEWS (incorporate these into recentNews array):
${finnhubNews.slice(0, 5).map((n: any) => `- ${new Date(n.datetime * 1000).toLocaleDateString()}: ${n.headline} (${n.source})`).join('\n')}
` : '';

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an institutional-grade equity research analyst. Provide comprehensive stock analysis with precise numerical data. ${INVESTOR_PROMPTS}`
          },
          {
            role: "user",
            content: `Conduct a deep equity research analysis for the stock ticker: ${ticker.toUpperCase()}.

${liveContext}
${newsContext}

Requirements:
1. Technical Analysis: Current Support/Resistance, MA50, MA200, MACD state, Volume Price Analysis (VPA), and RSI(14).
2. Sector comparison: Compare against EXACTLY 5 specific top sector peers.
3. CRITICAL: For all numeric fields (ratios, growth, margins), return ONLY numbers or "N/A". Do NOT use phrases like "mid-single digits" or "low teens".
4. Market Correlation: Benchmarks vs S&P 500, Nasdaq, and 3 peers.
5. Analyst Reports: 3 specific major bank snippets with names and targets.
6. Fundamental DNA: Expanded list of ratios (ROE, ROA, margins, etc.).
7. YOY Analysis: Compare current year vs previous year for core metrics.
8. 5-year EPS growth history.
9. Recent News Feed with sentiment (bullish, bearish, or neutral).
10. Detailed Bull and Bear case scenarios.
11. Volatility analysis with IV vs HV data.

Return ONLY valid JSON matching this exact structure (no markdown, no code blocks):
{
  "symbol": "${ticker.toUpperCase()}",
  "name": "Company Name",
  "price": "$XXX.XX",
  "change": "+X.XX (+X.XX%)",
  "sector": "Sector Name",
  "industry": "Industry Name",
  "fundamentals": {
    "epsGrowth": "XX%",
    "epsGrowthHistory": [{"year": "2020", "value": 10}, {"year": "2021", "value": 15}, {"year": "2022", "value": 20}, {"year": "2023", "value": 18}, {"year": "2024", "value": 22}],
    "roe": "XX%",
    "roa": "XX%",
    "netMargin": "XX%",
    "operatingMargin": "XX%",
    "currentRatio": "X.XX",
    "quickRatio": "X.XX",
    "fcf": "$X.XXB",
    "pegRatio": "X.XX",
    "debtToEquity": "X.XX",
    "marketCap": "$XXXB",
    "peRatio": "XX.X",
    "pbRatio": "X.XX",
    "profitMargin": "XX%"
  },
  "yoyComparison": {
    "revenue": {"current": 100, "previous": 90, "unit": "B"},
    "roe": {"current": 20, "previous": 18},
    "roa": {"current": 10, "previous": 9},
    "peRatio": {"current": 25, "previous": 22},
    "netMargin": {"current": 15, "previous": 14},
    "operatingMargin": {"current": 20, "previous": 18},
    "currentRatio": {"current": 1.5, "previous": 1.4},
    "debtToEquity": {"current": 0.5, "previous": 0.6},
    "fcf": {"current": 10, "previous": 8, "unit": "B"}
  },
  "technicalAnalysis": {
    "trend": "Bullish/Bearish/Neutral",
    "support": "$XXX.XX",
    "resistance": "$XXX.XX",
    "rsi": "XX",
    "ma50": "$XXX.XX",
    "ma200": "$XXX.XX",
    "macd": "Bullish/Bearish crossover",
    "volumeTrend": "Above/Below average",
    "volumePriceAnalysis": "Description",
    "movingAverages": "Above/Below key MAs",
    "volumeProfile": "Description"
  },
  "investorScorecard": {
    "oneil": {"score": 75, "verdict": "Strong Buy/Buy/Hold/Sell", "details": "Analysis details"},
    "buffett": {"score": 80, "verdict": "Strong Buy/Buy/Hold/Sell", "details": "Analysis details"},
    "ackman": {"score": 70, "verdict": "Strong Buy/Buy/Hold/Sell", "details": "Analysis details"},
    "shkreli": {"score": 65, "verdict": "Strong Buy/Buy/Hold/Sell", "details": "Analysis details"},
    "lynch": {"score": 85, "verdict": "Strong Buy/Buy/Hold/Sell", "details": "Analysis details"}
  },
  "catalysts": [
    {"event": "Event name", "impact": "High/Medium/Low", "timeline": "Q1 2025"}
  ],
  "recentNews": [
    {"date": "2025-01-20", "headline": "News headline", "sentiment": "bullish", "source": "Source Name"}
  ],
  "sectorComparison": [
    {"peer": "TICKER", "peRatio": "XX.X", "revenueGrowth": "XX%", "profitMargin": "XX%"}
  ],
  "marketCorrelation": [
    {"label": "S&P 500", "value": 0.85},
    {"label": "NASDAQ", "value": 0.90}
  ],
  "ivAnalysis": {
    "impliedVol": "XX%",
    "historicalVol": "XX%",
    "ivRank": "XX%",
    "tradingSuggestion": "Suggestion text",
    "volatilityHistory": [{"date": "Jan", "iv": 25, "hv": 22}]
  },
  "analystSentiment": {
    "consensus": "Buy/Hold/Sell",
    "targetPrice": "$XXX.XX",
    "score": 75,
    "summary": "Summary of analyst views",
    "ratings": {"buy": 15, "hold": 5, "sell": 2},
    "reports": [{"analystName": "Goldman Sachs", "target": "$XXX", "snippet": "Analysis snippet"}]
  },
  "historicalChart": [
    {"date": "2024-01", "price": 150, "volume": 1000000}
  ],
  "bullishBearish": {
    "bullCase": ["Bull point 1", "Bull point 2", "Bull point 3"],
    "bearCase": ["Bear point 1", "Bear point 2", "Bear point 3"]
  }
}`
          }
        ],
        temperature: 0.7,
        max_tokens: 8000
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate analysis");
    }

    const aiResponse = await response.json();
    let analysisText = aiResponse.choices?.[0]?.message?.content || "";
    
    // Clean up the response
    analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", analysisText);
      throw new Error("Failed to parse analysis response");
    }

    // Merge live data into response
    if (liveData) {
      analysis.liveData = liveData;
      analysis.price = `$${liveData.currentPrice.toFixed(2)}`;
      analysis.change = `${liveData.changePercent >= 0 ? '+' : ''}${(liveData.currentPrice - liveData.previousClose).toFixed(2)} (${liveData.changePercent >= 0 ? '+' : ''}${liveData.changePercent.toFixed(2)}%)`;
    }

    // Merge Finnhub news if available
    if (finnhubNews.length > 0 && (!analysis.recentNews || analysis.recentNews.length < 3)) {
      analysis.recentNews = finnhubNews.slice(0, 8).map((n: any) => ({
        date: new Date(n.datetime * 1000).toLocaleDateString(),
        headline: n.headline,
        sentiment: determineSentiment(n.headline),
        source: n.source
      }));
    }

    console.log(`QuantGemini analysis completed for ${ticker}${liveData ? ' with live data' : ''}`);

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('QuantGemini error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function determineSentiment(headline: string): 'bullish' | 'bearish' | 'neutral' {
  const lower = headline.toLowerCase();
  const bullishWords = ['surge', 'soar', 'rally', 'gain', 'rise', 'up', 'beat', 'exceed', 'strong', 'growth', 'positive', 'upgrade', 'buy'];
  const bearishWords = ['fall', 'drop', 'decline', 'down', 'miss', 'weak', 'loss', 'concern', 'risk', 'downgrade', 'sell', 'crash'];
  
  const bullScore = bullishWords.filter(w => lower.includes(w)).length;
  const bearScore = bearishWords.filter(w => lower.includes(w)).length;
  
  if (bullScore > bearScore) return 'bullish';
  if (bearScore > bullScore) return 'bearish';
  return 'neutral';
}
