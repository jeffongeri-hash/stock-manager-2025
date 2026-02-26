import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ZIP_REGEX = /^\d{5}$/;
const VALID_FILING_STATUSES = ['single', 'married', 'married_separately', 'head_of_household'];
const VALID_PAY_FREQUENCIES = ['weekly', 'biweekly', 'semimonthly', 'monthly'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { grossPay, payFrequency, zipCode, filingStatus, allowances, preTaxDeductions, postTaxDeductions } = await req.json();

    // Input validation
    if (typeof grossPay !== 'number' || grossPay <= 0 || grossPay > 10000000) {
      return new Response(
        JSON.stringify({ error: 'Gross pay must be a positive number up to $10,000,000' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanZip = String(zipCode || '').trim();
    if (!cleanZip || !ZIP_REGEX.test(cleanZip)) {
      return new Response(
        JSON.stringify({ error: 'Valid 5-digit ZIP code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validFrequency = VALID_PAY_FREQUENCIES.includes(payFrequency) ? payFrequency : 'biweekly';
    const validFilingStatus = VALID_FILING_STATUSES.includes(filingStatus) ? filingStatus : 'single';
    const validAllowances = typeof allowances === 'number' && allowances >= 0 && allowances <= 20 ? allowances : 0;

    // Validate deductions arrays
    const validateDeductions = (deductions: any): any[] => {
      if (!Array.isArray(deductions)) return [];
      return deductions.slice(0, 20).filter((d: any) => 
        d && typeof d.value === 'number' && d.value >= 0 && d.value <= 1000000 &&
        ['percentage', 'fixed'].includes(d.type)
      ).map((d: any) => ({
        name: String(d.name || 'Deduction').slice(0, 100),
        type: d.type,
        value: d.value,
      }));
    };

    const validPreTax = validateDeductions(preTaxDeductions);
    const validPostTax = validateDeductions(postTaxDeductions);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Calculate pre-tax deduction total
    let preTaxTotal = 0;
    for (const deduction of validPreTax) {
      if (deduction.type === 'percentage') {
        preTaxTotal += (grossPay * deduction.value) / 100;
      } else {
        preTaxTotal += deduction.value;
      }
    }

    const taxableIncome = grossPay - preTaxTotal;

    const prompt = `You are a US payroll tax calculator. Calculate the following taxes for a single paycheck.

INPUT DATA:
- Gross Pay (per paycheck): $${grossPay.toFixed(2)}
- Pay Frequency: ${validFrequency}
- ZIP Code: ${cleanZip}
- Filing Status: ${validFilingStatus}
- Allowances/Withholdings: ${validAllowances}
- Taxable Income (after pre-tax deductions): $${taxableIncome.toFixed(2)}

CALCULATE AND RETURN AS JSON:
1. Federal Income Tax withholding for this paycheck
2. State Income Tax (determine the state from ZIP code)
3. Local/County Tax if applicable (based on ZIP code location)
4. Social Security Tax (6.2% of gross, up to annual limit)
5. Medicare Tax (1.45% of gross, plus 0.9% additional for high earners)

Return ONLY valid JSON in this exact format:
{
  "federalTax": <number>,
  "stateTax": <number>,
  "stateName": "<state name>",
  "localTax": <number>,
  "localTaxName": "<county/city name or null>",
  "socialSecurity": <number>,
  "medicare": <number>,
  "taxBreakdown": {
    "federalRate": "<effective rate as string>",
    "stateRate": "<state tax rate as string>",
    "localRate": "<local tax rate or N/A>"
  },
  "notes": "<any relevant notes about the calculations>"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are a precise US payroll tax calculator. Always return valid JSON only, no markdown or extra text.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
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
          JSON.stringify({ error: 'AI service payment required.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    
    let taxCalculation;
    try {
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) cleanContent = cleanContent.slice(7);
      else if (cleanContent.startsWith('```')) cleanContent = cleanContent.slice(3);
      if (cleanContent.endsWith('```')) cleanContent = cleanContent.slice(0, -3);
      taxCalculation = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response');
      taxCalculation = {
        federalTax: taxableIncome * 0.12,
        stateTax: taxableIncome * 0.05,
        stateName: 'Unknown',
        localTax: 0,
        localTaxName: null,
        socialSecurity: Math.min(grossPay * 0.062, 168600 * 0.062 / 26),
        medicare: grossPay * 0.0145,
        taxBreakdown: { federalRate: '12%', stateRate: '5%', localRate: 'N/A' },
        notes: 'Using estimated rates. Please verify with a tax professional.'
      };
    }

    // Calculate post-tax deduction total
    let postTaxTotal = 0;
    for (const deduction of validPostTax) {
      if (deduction.type === 'percentage') {
        postTaxTotal += (grossPay * deduction.value) / 100;
      } else {
        postTaxTotal += deduction.value;
      }
    }

    const totalTaxes = 
      taxCalculation.federalTax + 
      taxCalculation.stateTax + 
      taxCalculation.localTax + 
      taxCalculation.socialSecurity + 
      taxCalculation.medicare;

    const netPay = grossPay - preTaxTotal - totalTaxes - postTaxTotal;

    return new Response(
      JSON.stringify({
        grossPay,
        preTaxDeductions: preTaxTotal,
        taxableIncome,
        taxes: taxCalculation,
        totalTaxes,
        postTaxDeductions: postTaxTotal,
        netPay,
        breakdown: {
          gross: grossPay,
          preTax: preTaxTotal,
          federal: taxCalculation.federalTax,
          state: taxCalculation.stateTax,
          local: taxCalculation.localTax,
          socialSecurity: taxCalculation.socialSecurity,
          medicare: taxCalculation.medicare,
          postTax: postTaxTotal,
          net: netPay
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error calculating paycheck:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
