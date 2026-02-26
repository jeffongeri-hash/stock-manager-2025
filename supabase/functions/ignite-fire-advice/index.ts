const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { financialData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a senior FIRE (Financial Independence, Retire Early) advisor with expertise in tax optimization, side income strategies, investment acceleration, and lifestyle design. Provide specific, actionable strategies — not generic advice. Be bold and creative.`;

    const userPrompt = `As a senior FIRE advisor, provide acceleration strategies for this financial situation:

${financialData}

Provide:
1. **Income Acceleration** - 3 specific side-hustle or career strategies to boost income by 20-50%
2. **Tax Optimization** - 2-3 specific tax strategies they may be missing
3. **Investment Efficiency** - How to optimize their portfolio allocation for faster FIRE
4. **Spending Optimization** - 2-3 high-impact areas to reduce spending without lifestyle sacrifice
5. **Timeline Acceleration** - Specific actions that could shave 2-5 years off their FIRE date

Be specific with numbers and realistic timelines. Reference current 2025 tax laws and market conditions where relevant.`;

    console.log("Generating FIRE advice");

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
          { role: "user", content: userPrompt },
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
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
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

    console.log("FIRE advice generated");

    return new Response(JSON.stringify({ advice: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("FIRE advice error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
