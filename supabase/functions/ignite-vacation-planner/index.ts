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
    const { origin, destination, budget, startDate, endDate, styles } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const stylesText = styles && styles.length > 0 ? styles.join(', ') : 'balanced mix of experiences';
    const isDiscovery = destination === 'AI Budget Discovery';
    
    const systemPrompt = `You are an expert travel planner and budget optimizer. You help users plan incredible vacations while maximizing value for their money. You provide detailed, actionable travel plans with specific recommendations for accommodations, activities, and dining. Always consider the user's travel style preferences and budget constraints.`;

    const userPrompt = isDiscovery 
      ? `I have a budget of $${budget} and I'm leaving from ${origin}. Help me discover the best travel destination that maximizes value for this budget. My travel preferences are: ${stylesText}.

Please provide:
1. **Recommended Destination** - The best value destination for my budget
2. **Best Travel Window** - Optimal dates to travel for best prices
3. **Budget Breakdown** - How to allocate the $${budget} (flights, accommodation, food, activities)
4. **Daily Itinerary Suggestions** - Key activities and experiences
5. **Money-Saving Tips** - Specific tips to stretch the budget further
6. **Hidden Gems** - Lesser-known attractions or experiences
7. **Booking Recommendations** - When and where to book for best deals

Format the response in clear markdown sections.`
      : `Plan a vacation from ${origin} to ${destination} from ${startDate} to ${endDate} with a total budget of $${budget}. My travel preferences are: ${stylesText}.

Please provide:
1. **Trip Overview** - Summary of the destination and what makes it special
2. **Budget Breakdown** - Detailed allocation of the $${budget}:
   - Flights (estimated cost and recommendations)
   - Accommodation (options at different price points)
   - Food & Dining (daily budget and restaurant recommendations)
   - Activities & Attractions (must-sees with costs)
   - Transportation (local transport options)
   - Emergency/Misc fund
3. **Day-by-Day Itinerary** - Detailed daily plans
4. **Money-Saving Tips** - Specific tips for ${destination}
5. **Local Insider Tips** - Things only locals know
6. **Packing Recommendations** - What to bring for the season
7. **Booking Timeline** - When to book what for best prices

Format the response in clear markdown with headers and bullet points.`;

    console.log(`Generating vacation plan: ${origin} to ${destination}, budget: $${budget}`);

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

    console.log(`Vacation plan generated for ${destination}`);

    return new Response(JSON.stringify({ 
      text: content,
      plan: content,
      sources: []
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Vacation planner error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
