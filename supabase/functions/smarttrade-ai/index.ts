import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticker, portfolioSize, riskPercent, action } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (action === "refresh_price") {
      // Simple price refresh request
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { 
              role: "user", 
              content: `What is the current stock price of ${ticker}? Return ONLY a JSON object with this exact format: {"price": <number>}. No other text.` 
            }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        throw new Error("Failed to get price");
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || "";
      
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const priceData = JSON.parse(jsonMatch[0]);
          return new Response(JSON.stringify(priceData), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch {
        // Fallback: extract number from text
        const priceMatch = content.match(/\$?([\d,]+\.?\d*)/);
        if (priceMatch) {
          return new Response(JSON.stringify({ price: parseFloat(priceMatch[1].replace(/,/g, '')) }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      
      throw new Error("Could not parse price");
    }

    // Generate full trade plan
    const systemPrompt = `You are an institutional quantitative trading analyst. Generate a comprehensive trade plan with precise entry, stop-loss, and take-profit levels.

Analyze the asset thoroughly and provide:
1. Current market price
2. Optimal entry price (can be current price or a limit order level)
3. Stop-loss level based on technical analysis (support levels, ATR, etc.)
4. Three staggered take-profit levels (TP1: 50%, TP2: 30%, TP3: 20% of position)
5. Detailed reasoning for the trade setup
6. Current market sentiment analysis from social media and news
7. Top 3 recent news articles affecting the asset

Consider:
- Technical analysis (support/resistance, trend, momentum)
- Risk management (appropriate stop-loss distance)
- Realistic profit targets based on historical volatility
- Current market conditions and sentiment`;

    const userPrompt = `Generate an institutional-grade trade plan for ${ticker.toUpperCase()}.
Portfolio size: $${portfolioSize.toLocaleString()}
Risk tolerance: ${riskPercent}% per trade

Return a JSON object with this exact structure:
{
  "currentPrice": <number>,
  "entryPrice": <number>,
  "stopLoss": <number>,
  "tp1": <number>,
  "tp2": <number>,
  "tp3": <number>,
  "reasoning": "<detailed analysis string>",
  "headlines": [{"text": "<headline>", "time": "<time ago>"}],
  "newsArticles": [{"title": "<title>", "summary": "<2 sentence summary>", "source": "<source name>", "time": "<time ago>"}],
  "sentiment": {
    "label": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
    "score": <-1 to 1>,
    "summary": "<brief sentiment overview>",
    "history": [<array of 7 sentiment scores from -1 to 1 for past week>],
    "detailedSocial": [
      {"platform": "Reddit", "label": "POSITIVE" | "NEUTRAL" | "NEGATIVE", "summary": "<platform-specific sentiment>"},
      {"platform": "Twitter/X", "label": "POSITIVE" | "NEUTRAL" | "NEGATIVE", "summary": "<platform-specific sentiment>"},
      {"platform": "StockTwits", "label": "POSITIVE" | "NEUTRAL" | "NEGATIVE", "summary": "<platform-specific sentiment>"}
    ],
    "detailedNews": [
      {"platform": "Bloomberg", "label": "POSITIVE" | "NEUTRAL" | "NEGATIVE", "summary": "<news sentiment>"},
      {"platform": "Reuters", "label": "POSITIVE" | "NEUTRAL" | "NEGATIVE", "summary": "<news sentiment>"},
      {"platform": "CNBC", "label": "POSITIVE" | "NEUTRAL" | "NEGATIVE", "summary": "<news sentiment>"}
    ]
  }
}

Provide realistic, current market data. The stop-loss should protect against normal volatility while the take-profit levels should be achievable.`;

    console.log(`Generating trade plan for ${ticker}`);

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
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error("AI service temporarily unavailable");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse JSON from response
    let tradePlan;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        tradePlan = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse trade plan data");
    }

    // Validate required fields
    if (!tradePlan.currentPrice || !tradePlan.entryPrice || !tradePlan.stopLoss) {
      throw new Error("Incomplete trade plan data");
    }

    console.log(`Trade plan generated for ${ticker}: Entry ${tradePlan.entryPrice}, SL ${tradePlan.stopLoss}`);

    return new Response(JSON.stringify(tradePlan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("SmartTrade AI error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
