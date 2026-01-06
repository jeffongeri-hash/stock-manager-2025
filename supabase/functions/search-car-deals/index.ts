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
    const { make, model, maxPrice, maxMileage, zipCode, radius, interestRate, loanTerm, downPayment } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a car market analyst. Given search criteria and a ZIP code, provide realistic car deal data in JSON format. Create plausible listings based on typical market conditions for that area.

Calculate monthly payments using:
- Interest Rate: ${interestRate}%
- Loan Term: ${loanTerm} months
- Down Payment: $${downPayment}

Return ONLY valid JSON with this exact structure:
{
  "averagePrice": <number - average market price for this type of vehicle>,
  "marketInsight": "<brief market condition description>",
  "deals": [
    {
      "make": "<make>",
      "model": "<model>",
      "year": <year>,
      "price": <number>,
      "mileage": <number>,
      "dealer": "<dealer name>",
      "location": "<city, state>",
      "monthlyPayment": <calculated monthly payment>,
      "totalCost": <total cost over loan term>,
      "savings": "<savings vs market average or empty string>"
    }
  ],
  "recommendation": "<2-3 sentence buying recommendation based on the deals found>"
}

Provide 5 realistic deals sorted by best value. Calculate actual monthly payments based on the loan parameters.`;

    const searchQuery = make && model 
      ? `${make} ${model}` 
      : make 
        ? make 
        : "used cars";

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
            content: `Find ${searchQuery} within ${radius} miles of ZIP code ${zipCode}. Max price: $${maxPrice}. Max mileage: ${maxMileage}. Provide the best deals available.`
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

    // Parse the JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const deals = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(deals), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Car search error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
