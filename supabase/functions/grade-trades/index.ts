import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { trades } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Format trades for analysis
    const tradesSummary = trades.map((trade: any) => ({
      symbol: trade.symbol,
      entry_date: trade.entry_date,
      exit_date: trade.exit_date || 'Still open',
      strategy: trade.strategy || 'Not specified',
      profit_loss: trade.profit_loss,
      notes: trade.notes || 'No notes',
      emotions: trade.emotions || 'No emotions recorded',
      lessons_learned: trade.lessons_learned || 'No lessons recorded',
    }));

    const systemPrompt = `You are an expert trading coach analyzing trade journal entries. 
Your role is to provide constructive, actionable feedback on trading performance.

For each trade, evaluate:
1. Trade execution and timing
2. Risk management and position sizing
3. Emotional discipline
4. Strategy adherence
5. Learning and improvement

Provide:
- Overall Grade (A-F)
- Strengths (2-3 key points)
- Areas for Improvement (2-3 specific recommendations)
- Key Takeaways

Be encouraging but honest. Focus on actionable insights.`;

    const userPrompt = trades.length === 1 
      ? `Analyze this trade and provide detailed feedback:\n\n${JSON.stringify(tradesSummary[0], null, 2)}`
      : `Analyze these ${trades.length} trades and provide overall performance feedback:\n\n${JSON.stringify(tradesSummary, null, 2)}`;

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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in grade-trades function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});