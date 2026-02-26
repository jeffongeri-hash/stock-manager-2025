import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TICKER_REGEX = /^[A-Z]{1,10}$/;

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
      fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`),
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`),
      fetch(`https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(symbol)}&from=${getDateDaysAgo(7)}&to=${getToday()}&token=${apiKey}`)
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { ticker, action } = await req.json();
    
    // Input validation
    const cleanTicker = String(ticker || '').toUpperCase().trim();
    if (!cleanTicker || !TICKER_REGEX.test(cleanTicker)) {
      return new Response(
        JSON.stringify({ error: 'Invalid ticker symbol (1-10 uppercase letters required)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action && !['refresh_price', 'analyze'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
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
      const finnhubData = await fetchFinnhubData(cleanTicker, FINNHUB_API_KEY);
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

    if (action === 'refresh_price') {
      return new Response(
        JSON.stringify({ liveData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
${finnhubNews.slice(0, 5).map((n: any) => `- ${new Date(n.datetime * 1000).toLocaleDateString()}: ${String(n.headline || '').slice(0, 200)} (${n.source})`).join('\n')}
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
            content: `Conduct a deep equity research analysis for the stock ticker: ${cleanTicker}.

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
  "symbol": "${cleanTicker}",
  "name": "Company Name",
  "price": "$XXX.XX",
  "change": "+X.XX (+X.XX%)",
  "sector": "Sector Name",
  "industry": "Industry Name",
  "fundamentals": {"epsGrowth": "XX%", "epsGrowthHistory": [], "roe": "XX%", "roa": "XX%", "netMargin": "XX%", "operatingMargin": "XX%", "currentRatio": "X.XX", "quickRatio": "X.XX", "fcf": "$X.XXB", "pegRatio": "X.XX", "debtToEquity": "X.XX", "marketCap": "$XXXB", "peRatio": "XX.X", "pbRatio": "X.XX", "profitMargin": "XX%"},
  "yoyComparison": {},
  "technicalAnalysis": {},
  "investorScorecard": {},
  "catalysts": [],
  "recentNews": [],
  "sectorComparison": [],
  "marketCorrelation": [],
  "ivAnalysis": {},
  "analystSentiment": {},
  "historicalChart": [],
  "bullishBearish": {"bullCase": [], "bearCase": []}
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
    
    analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    analysisText = analysisText
      .replace(/,(\s*[\]}])/g, '$1')
      .replace(/,(\s*,)/g, ',')
      .replace(/\[\s*,/g, '[')
      .replace(/{\s*,/g, '{');
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      try {
        const cleanedText = analysisText
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
          .replace(/\n\s*\n/g, '\n')
          .trim();
        analysis = JSON.parse(cleanedText);
      } catch (secondError) {
        console.error("Failed to parse AI response after cleanup");
        throw new Error("Failed to parse analysis response");
      }
    }

    if (liveData) {
      analysis.liveData = liveData;
      analysis.price = `$${liveData.currentPrice.toFixed(2)}`;
      analysis.change = `${liveData.changePercent >= 0 ? '+' : ''}${(liveData.currentPrice - liveData.previousClose).toFixed(2)} (${liveData.changePercent >= 0 ? '+' : ''}${liveData.changePercent.toFixed(2)}%)`;
    }

    if (finnhubNews.length > 0 && (!analysis.recentNews || analysis.recentNews.length < 3)) {
      analysis.recentNews = finnhubNews.slice(0, 8).map((n: any) => ({
        date: new Date(n.datetime * 1000).toLocaleDateString(),
        headline: n.headline,
        sentiment: determineSentiment(n.headline),
        source: n.source
      }));
    }

    console.log(`QuantGemini analysis completed for ${cleanTicker}${liveData ? ' with live data' : ''}`);

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
