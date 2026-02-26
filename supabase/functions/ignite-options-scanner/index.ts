const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ticker, criteria, currentStrike } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "analyze") {
      systemPrompt = `You are an expert options strategist specializing in PMCC (Poor Man's Covered Call) strategies. You analyze LEAPs and short-dated options to find optimal setups. Always provide realistic, data-informed analysis. Return JSON only.`;

      userPrompt = `Perform a PMCC (Poor Man's Covered Call) analysis for ${ticker} in 2025.
Criteria: expiry range ${criteria.expiryRange} months, target delta ${criteria.targetDelta}, max OTM ${criteria.maxOtmPct}%, min volume ${criteria.minVolume}.

Return a JSON object with this exact structure:
{
  "stockPrice": <current approximate stock price as number>,
  "strategies": [
    {
      "longStrike": <number>,
      "longExpiry": "<date string>",
      "longPremium": <number per share>,
      "longDelta": <number 0-1>,
      "shortStrike": <number>,
      "shortExpiry": "<date string>",
      "shortPremium": <number per share>,
      "netDebit": <number per share>,
      "breakEven": <number>,
      "potentialAnnualReturn": <number percentage>,
      "description": "<brief strategy description>"
    }
  ],
  "generalAnalysis": "<2-3 sentence market context and outlook>"
}

Provide exactly 3 strategies: Conservative, Balanced, and Aggressive. Use realistic current market prices.`;

    } else if (action === "roll") {
      systemPrompt = `You are an expert options rolling strategist. You help traders find optimal rolling opportunities to manage positions and reduce cost basis. Return JSON only.`;

      userPrompt = `Find options rolling opportunities for ${ticker} with current short strike at ${currentStrike}.

Return a JSON object with:
{
  "opportunities": [
    {
      "action": "<description of roll>",
      "newStrike": <number>,
      "newExpiry": "<date>",
      "estimatedCredit": <number>,
      "rationale": "<why this roll makes sense>"
    }
  ],
  "summary": "<overall rolling recommendation>"
}`;
    }

    console.log(`Options scanner: ${action} for ${ticker}`);

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
        temperature: 0.3,
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
    let content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Clean JSON from markdown code blocks
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    // Fix trailing commas
    content = content.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");

    const parsed = JSON.parse(content);
    console.log(`Options scanner result for ${ticker}`);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Options scanner error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
