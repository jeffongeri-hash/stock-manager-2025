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
    const { marketData } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert stock market analyst and trader. Based on current market data, generate 5-7 actionable trade ideas.

For each trade idea, provide:
1. Symbol (stock ticker)
2. Idea type (bullish/bearish/neutral)
3. Entry price range
4. Target price
5. Stop loss
6. Timeframe (short/medium/long)
7. A concise description of the thesis (2-3 sentences max)
8. 2-3 relevant tags

Focus on:
- Technical analysis patterns (breakouts, support/resistance, indicators)
- Volume analysis and unusual activity
- Sector rotation and momentum
- Risk-reward ratios of at least 2:1
- Realistic, actionable setups

Return ONLY a JSON array with this exact structure:
[
  {
    "symbol": "AAPL",
    "idea_type": "bullish",
    "entry_price": 175.50,
    "target_price": 185.00,
    "stop_loss": 172.00,
    "timeframe": "short",
    "description": "AAPL breaking above key resistance at $175. Strong volume confirms bullish momentum. RSI showing strength without being overbought.",
    "tags": ["breakout", "momentum", "tech"]
  }
]`;

    const userPrompt = `Current market data: ${JSON.stringify(marketData)}

Generate 5-7 high-quality trade ideas based on this market data.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Extract JSON from the response
    let tradeIdeas;
    try {
      // Try to parse directly first
      tradeIdeas = JSON.parse(content);
    } catch (e) {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        tradeIdeas = JSON.parse(jsonMatch[1]);
      } else {
        // Last resort: try to find JSON array in the text
        const arrayMatch = content.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          tradeIdeas = JSON.parse(arrayMatch[0]);
        } else {
          throw new Error('Could not extract JSON from AI response');
        }
      }
    }

    return new Response(
      JSON.stringify({ ideas: tradeIdeas }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-trade-ideas function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
