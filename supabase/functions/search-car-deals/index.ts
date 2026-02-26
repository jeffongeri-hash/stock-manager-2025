import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ZIP_REGEX = /^\d{5}$/;
const SAFE_STRING_REGEX = /^[a-zA-Z0-9\s\-'.]+$/;

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

    const { make, model, maxPrice, maxMileage, zipCode, radius, interestRate, loanTerm, downPayment } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Input validation
    const cleanZip = String(zipCode || '').trim();
    if (!cleanZip || !ZIP_REGEX.test(cleanZip)) {
      return new Response(JSON.stringify({ error: 'Valid 5-digit ZIP code is required' }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanMake = make ? String(make).slice(0, 50).trim() : '';
    const cleanModel = model ? String(model).slice(0, 50).trim() : '';
    if (cleanMake && !SAFE_STRING_REGEX.test(cleanMake)) {
      return new Response(JSON.stringify({ error: 'Invalid make' }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (cleanModel && !SAFE_STRING_REGEX.test(cleanModel)) {
      return new Response(JSON.stringify({ error: 'Invalid model' }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validMaxPrice = typeof maxPrice === 'number' && maxPrice > 0 && maxPrice <= 10000000 ? maxPrice : 50000;
    const validMaxMileage = typeof maxMileage === 'number' && maxMileage > 0 && maxMileage <= 1000000 ? maxMileage : 100000;
    const validRadius = typeof radius === 'number' && radius > 0 && radius <= 500 ? radius : 50;
    const validInterestRate = typeof interestRate === 'number' && interestRate >= 0 && interestRate <= 30 ? interestRate : 6;
    const validLoanTerm = typeof loanTerm === 'number' && loanTerm > 0 && loanTerm <= 120 ? loanTerm : 60;
    const validDownPayment = typeof downPayment === 'number' && downPayment >= 0 && downPayment <= validMaxPrice ? downPayment : 0;

    const systemPrompt = `You are a car market analyst. Given search criteria and a ZIP code, provide realistic car deal data in JSON format. Create plausible listings based on typical market conditions for that area.

Calculate monthly payments using:
- Interest Rate: ${validInterestRate}%
- Loan Term: ${validLoanTerm} months
- Down Payment: $${validDownPayment}

Return ONLY valid JSON with this exact structure:
{
  "averagePrice": <number>,
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
  "recommendation": "<2-3 sentence buying recommendation>"
}

Provide 5 realistic deals sorted by best value.`;

    const searchQuery = cleanMake && cleanModel 
      ? `${cleanMake} ${cleanModel}` 
      : cleanMake 
        ? cleanMake 
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
            content: `Find ${searchQuery} within ${validRadius} miles of ZIP code ${cleanZip}. Max price: $${validMaxPrice}. Max mileage: ${validMaxMileage}. Provide the best deals available.`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "API credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    const deals = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(deals), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Car search error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
