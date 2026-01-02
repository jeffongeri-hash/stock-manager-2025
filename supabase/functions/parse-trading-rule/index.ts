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
    const { ruleText } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Parsing trading rule:", ruleText);

    const systemPrompt = `You are a trading rule parser. Convert natural language trading rules into structured JSON.

Output format:
{
  "name": "Generated rule name based on the conditions",
  "conditions": [
    {
      "type": "price_change" | "price_above" | "price_below" | "rsi" | "indicator" | "time" | "volume",
      "symbol": "TICKER",
      "operator": "above" | "below" | "equals",
      "value": number,
      "timeframe": "1D" | "1H" | "15m" | "5m" | "1m",
      "offset": number (optional, for bars ago),
      "indicator_params": {} (optional, for RSI period etc)
    }
  ],
  "action": {
    "type": "buy" | "sell",
    "symbol": "TICKER",
    "quantity": number,
    "orderType": "market" | "limit",
    "limitPrice": number (optional)
  },
  "schedule": {
    "time": "HH:MM" (optional, 24h format),
    "timezone": "ET" | "UTC" | "PT" (optional)
  }
}

Examples:
- "Buy AAPL if it drops 5%" → price_change condition with value -5
- "RSI(14, Daily) is below 65" → rsi condition with period 14, timeframe 1D, value 65
- "VXN is below 22" → indicator condition for VXN with value 22
- "Daily Change is above 0%" → price_change condition with value 0
- "with an offset of 1 bar" → offset: 1 on that condition
- "time is 3:55 PM ET" → schedule with time "15:55", timezone "ET"

Parse the rule and return ONLY valid JSON, no explanation.`;

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
          { role: "user", content: `Parse this trading rule: "${ruleText}"` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI response:", content);

    // Extract JSON from the response
    let parsedRule;
    try {
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedRule = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return new Response(JSON.stringify({ 
        error: "Could not parse the rule. Please try rephrasing.",
        rawResponse: content 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      parsedRule,
      originalText: ruleText
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error parsing trading rule:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
