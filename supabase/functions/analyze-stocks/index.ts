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
    const { stockData, analysisType } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log('Analyzing stocks with type:', analysisType);

    let systemPrompt = "You are a professional stock market analyst with expertise in technical analysis, fundamental analysis, and market trends.";
    let userPrompt = "";

    switch (analysisType) {
      case 'overview':
        userPrompt = `Analyze the following stock market data and provide a concise overview of market conditions, key trends, and notable movements. Keep it under 150 words.

Stock Data:
${JSON.stringify(stockData, null, 2)}`;
        break;

      case 'recommendations':
        userPrompt = `Based on the following stock data, provide 3-5 actionable trading recommendations. For each recommendation, include the stock symbol, action (buy/sell/hold), reasoning, and risk level. Keep each recommendation brief.

Stock Data:
${JSON.stringify(stockData, null, 2)}`;
        break;

      case 'risk-assessment':
        userPrompt = `Analyze the risk profile of the following stocks. Identify high-risk and low-risk stocks, explain volatility concerns, and suggest diversification strategies. Keep it under 200 words.

Stock Data:
${JSON.stringify(stockData, null, 2)}`;
        break;

      case 'sector-analysis':
        userPrompt = `Analyze sector performance based on the following stock data. Identify which sectors are performing well, which are struggling, and explain why. Keep it under 200 words.

Stock Data:
${JSON.stringify(stockData, null, 2)}`;
        break;

      default:
        userPrompt = `Provide a brief analysis of the following stock market data:

${JSON.stringify(stockData, null, 2)}`;
    }

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
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI analysis failed" }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    console.log('Successfully generated analysis');

    return new Response(
      JSON.stringify({ analysis }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-stocks function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
