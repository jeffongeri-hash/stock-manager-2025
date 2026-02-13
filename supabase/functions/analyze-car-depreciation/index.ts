const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { make, model, year, mileage, condition, purchasePrice } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const currentYear = new Date().getFullYear();
    const carAge = currentYear - year;

    const systemPrompt = `You are an automotive market analyst specializing in vehicle depreciation. Given a specific vehicle's make, model, year, mileage, and condition, provide a detailed depreciation analysis.

Return ONLY valid JSON with this exact structure:
{
  "currentValue": <number - estimated current market value>,
  "originalMsrp": <number - estimated original MSRP when new>,
  "totalDepreciation": <number - total depreciation in dollars>,
  "depreciationPercent": <number - percentage depreciated>,
  "yearlyDepreciationRate": <number - average yearly depreciation rate>,
  "projections": [
    {"year": <number>, "value": <number>, "percentRemaining": <number>}
  ],
  "factors": {
    "mileageImpact": "<description of how mileage affects value>",
    "conditionImpact": "<description of condition impact>",
    "marketDemand": "<current market demand assessment>",
    "reliabilityScore": "<reliability assessment>"
  },
  "recommendation": "<2-3 sentence recommendation about this vehicle's value retention>",
  "bestTimeToSell": "<when is the optimal time to sell this vehicle>",
  "similarVehicles": [
    {"name": "<vehicle name>", "depreciationRate": "<rate>", "comparison": "<better/worse/similar>"}
  ]
}

Include projections for the next 5 years from current age.`;

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
          { 
            role: "user", 
            content: `Analyze depreciation for: ${year} ${make} ${model}. Current mileage: ${mileage || 'average'}. Condition: ${condition || 'good'}. Purchase price reference: $${purchasePrice}. Current age: ${carAge} years.`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "API credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Car depreciation analysis error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
