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
    const { fundamentals } = await req.json();
    
    if (!fundamentals) {
      return new Response(
        JSON.stringify({ error: 'Fundamentals data is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing fundamentals for:', fundamentals.symbol);

    const systemPrompt = `You are a financial analyst expert. Analyze the provided stock fundamentals and provide clear, actionable insights. 
Focus on:
1. Key financial ratios and what they indicate about the company's health
2. How the company compares to its sector/industry
3. The company's price movement relative to the S&P 500
4. Overall investment outlook based on fundamentals

Keep explanations clear and accessible to both novice and experienced investors.`;

    const userPrompt = `Analyze the fundamentals for ${fundamentals.name} (${fundamentals.symbol}):

Current Price: $${fundamentals.currentPrice}
Price Change: ${fundamentals.priceChangePercent}%
Market Cap: $${fundamentals.marketCap}M
Industry: ${fundamentals.industry}

Key Ratios:
- P/E Ratio: ${fundamentals.metrics.peBasicExclExtraTTM || 'N/A'}
- P/B Ratio: ${fundamentals.metrics.pbAnnual || 'N/A'}
- ROE: ${fundamentals.metrics.roeRfy || 'N/A'}%
- ROA: ${fundamentals.metrics.roaRfy || 'N/A'}%
- Debt/Equity: ${fundamentals.metrics.totalDebt2TotalEquityAnnual || 'N/A'}
- Current Ratio: ${fundamentals.metrics.currentRatioAnnual || 'N/A'}
- Quick Ratio: ${fundamentals.metrics.quickRatioAnnual || 'N/A'}
- Profit Margin: ${fundamentals.metrics.netProfitMarginAnnual || 'N/A'}%
- Operating Margin: ${fundamentals.metrics.operatingMarginAnnual || 'N/A'}%

Stock vs S&P 500: ${fundamentals.symbol} is ${fundamentals.priceChangePercent > fundamentals.spxChange ? 'outperforming' : 'underperforming'} the S&P 500 (${fundamentals.spxChange}%)

Peer Companies: ${fundamentals.peers.join(', ')}

Provide a comprehensive analysis with specific insights and recommendations.`;

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

    console.log('Successfully analyzed fundamentals');

    return new Response(
      JSON.stringify({ analysis }), 
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
