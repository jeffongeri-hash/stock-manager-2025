import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TICKER_REGEX = /^[A-Z]{1,10}$/;

// Fetch real-time stock data from Finnhub
async function fetchFinnhubData(ticker: string, finnhubKey: string) {
  try {
    const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${finnhubKey}`;
    const quoteResponse = await fetch(quoteUrl);
    const quoteData = await quoteResponse.json();

    const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(ticker)}&token=${finnhubKey}`;
    const profileResponse = await fetch(profileUrl);
    const profileData = await profileResponse.json();

    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const newsUrl = `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(ticker)}&from=${formatDate(weekAgo)}&to=${formatDate(today)}&token=${finnhubKey}`;
    const newsResponse = await fetch(newsUrl);
    const newsData = await newsResponse.json();

    return {
      quote: quoteData,
      profile: profileData,
      news: Array.isArray(newsData) ? newsData.slice(0, 5) : []
    };
  } catch (error) {
    console.error("Finnhub fetch error:", error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { ticker, portfolioSize, riskPercent, action } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    if (!FINNHUB_API_KEY) {
      throw new Error("FINNHUB_API_KEY is not configured");
    }

    // Validate ticker
    const cleanTicker = String(ticker || '').toUpperCase().trim();
    if (!cleanTicker || !TICKER_REGEX.test(cleanTicker)) {
      return new Response(JSON.stringify({ error: 'Invalid ticker symbol (1-10 uppercase letters)' }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate numeric inputs
    const validPortfolioSize = typeof portfolioSize === 'number' && portfolioSize > 0 && portfolioSize <= 100000000
      ? portfolioSize : 25000;
    const validRiskPercent = typeof riskPercent === 'number' && riskPercent > 0 && riskPercent <= 100
      ? riskPercent : 1;

    // Validate action
    if (action && !['refresh_price', 'analyze'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "refresh_price") {
      const finnhubData = await fetchFinnhubData(cleanTicker, FINNHUB_API_KEY);
      if (!finnhubData?.quote?.c || finnhubData.quote.c === 0) {
        throw new Error(`Could not fetch live price for ${cleanTicker}`);
      }
      return new Response(JSON.stringify({ 
        price: finnhubData.quote.c,
        change: finnhubData.quote.d,
        changePercent: finnhubData.quote.dp,
        high: finnhubData.quote.h,
        low: finnhubData.quote.l,
        previousClose: finnhubData.quote.pc
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch live data from Finnhub
    console.log(`Fetching live data for ${cleanTicker} from Finnhub`);
    const finnhubData = await fetchFinnhubData(cleanTicker, FINNHUB_API_KEY);
    
    if (!finnhubData?.quote?.c || finnhubData.quote.c === 0) {
      throw new Error(`Could not fetch market data for ${cleanTicker}. Please verify the ticker symbol.`);
    }

    const livePrice = finnhubData.quote.c;
    const companyName = finnhubData.profile?.name || cleanTicker;
    
    console.log(`Live price for ${cleanTicker}: $${livePrice}`);

    const newsContext = finnhubData.news.map((n: any) => ({
      headline: String(n.headline || '').slice(0, 200),
      summary: String(n.summary || '').slice(0, 500),
      source: String(n.source || '').slice(0, 50),
      datetime: new Date(n.datetime * 1000).toISOString()
    }));

    // Generate trade plan with AI using real market data
    const systemPrompt = `You are an institutional quantitative trading analyst. Generate a comprehensive trade plan with precise entry, stop-loss, and take-profit levels.

IMPORTANT: The user has provided LIVE market data. Use the exact current price provided - do NOT make up a different price.

Analyze the asset thoroughly and provide:
1. Optimal entry price (can be the current price or a limit order level slightly below)
2. Stop-loss level based on technical analysis (support levels, ATR, typical volatility)
3. Three staggered take-profit levels (TP1: 50%, TP2: 30%, TP3: 20% of position)
4. Detailed reasoning for the trade setup
5. Sentiment analysis based on the news provided

Consider:
- Technical analysis (support/resistance, trend, momentum)
- Risk management (appropriate stop-loss distance - typically 2-5% below entry for stocks)
- Realistic profit targets based on historical volatility
- Current market conditions from the news provided`;

    const userPrompt = `Generate an institutional-grade trade plan for ${cleanTicker} (${companyName}).

LIVE MARKET DATA (from Finnhub - use these exact values):
- Current Price: $${livePrice.toFixed(2)}
- Day High: $${finnhubData.quote.h?.toFixed(2) || 'N/A'}
- Day Low: $${finnhubData.quote.l?.toFixed(2) || 'N/A'}
- Previous Close: $${finnhubData.quote.pc?.toFixed(2) || 'N/A'}
- Change: ${finnhubData.quote.dp?.toFixed(2) || 0}%

Portfolio size: $${validPortfolioSize.toLocaleString()}
Risk tolerance: ${validRiskPercent}% per trade

Recent News:
${newsContext.map((n: any) => `- ${n.headline} (${n.source})`).join('\n')}

Return a JSON object with this exact structure:
{
  "currentPrice": ${livePrice},
  "entryPrice": <number>,
  "stopLoss": <number>,
  "tp1": <number>,
  "tp2": <number>,
  "tp3": <number>,
  "reasoning": "<detailed analysis string>",
  "headlines": [{"text": "<headline>", "time": "<time ago>"}],
  "newsArticles": [{"title": "<title>", "summary": "<summary>", "source": "<source>", "time": "<time ago>"}],
  "sentiment": {
    "label": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
    "score": <-1 to 1>,
    "summary": "<brief sentiment overview>",
    "history": [<7 sentiment scores>],
    "detailedSocial": [{"platform": "Reddit", "label": "POSITIVE", "summary": "<sentiment>"}],
    "detailedNews": [{"platform": "Financial News", "label": "POSITIVE", "summary": "<sentiment>"}]
  }
}

CRITICAL: The currentPrice MUST be exactly ${livePrice}.`;

    console.log(`Generating AI trade plan for ${cleanTicker}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI service temporarily unavailable");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) throw new Error("No response from AI");

    let tradePlan;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        tradePlan = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (e) {
      console.error("Failed to parse AI response");
      throw new Error("Failed to parse trade plan data");
    }

    tradePlan.currentPrice = livePrice;
    tradePlan.companyName = companyName;
    tradePlan.liveData = {
      high: finnhubData.quote.h,
      low: finnhubData.quote.l,
      previousClose: finnhubData.quote.pc,
      change: finnhubData.quote.d,
      changePercent: finnhubData.quote.dp
    };

    if (!tradePlan.entryPrice || !tradePlan.stopLoss) {
      throw new Error("Incomplete trade plan data");
    }

    console.log(`Trade plan generated for ${cleanTicker}: Live Price $${livePrice}, Entry $${tradePlan.entryPrice}, SL $${tradePlan.stopLoss}`);

    return new Response(JSON.stringify(tradePlan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("SmartTrade AI error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
