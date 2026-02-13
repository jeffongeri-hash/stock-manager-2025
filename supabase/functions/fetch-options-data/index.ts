const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Black-Scholes calculations for options Greeks
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

function calculateGreeks(
  stockPrice: number,
  strikePrice: number,
  timeToExpiry: number, // in years
  volatility: number, // as decimal (e.g., 0.25 for 25%)
  riskFreeRate: number, // as decimal (e.g., 0.05 for 5%)
  optionType: 'call' | 'put'
) {
  const S = stockPrice;
  const K = strikePrice;
  const T = timeToExpiry;
  const v = volatility;
  const r = riskFreeRate;

  const d1 = (Math.log(S / K) + (r + 0.5 * v * v) * T) / (v * Math.sqrt(T));
  const d2 = d1 - v * Math.sqrt(T);

  // Calculate Greeks
  const delta = optionType === 'call' ? normalCDF(d1) : normalCDF(d1) - 1;
  const gamma = normalPDF(d1) / (S * v * Math.sqrt(T));
  const vega = S * normalPDF(d1) * Math.sqrt(T) / 100; // divided by 100 for 1% change
  const theta = optionType === 'call'
    ? (-(S * normalPDF(d1) * v) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * normalCDF(d2)) / 365
    : (-(S * normalPDF(d1) * v) / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * normalCDF(-d2)) / 365;
  const rho = optionType === 'call'
    ? K * T * Math.exp(-r * T) * normalCDF(d2) / 100
    : -K * T * Math.exp(-r * T) * normalCDF(-d2) / 100;

  // Calculate option price
  const price = optionType === 'call'
    ? S * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2)
    : K * Math.exp(-r * T) * normalCDF(-d2) - S * normalCDF(-d1);

  return {
    price: Math.round(price * 100) / 100,
    delta: Math.round(delta * 1000) / 1000,
    gamma: Math.round(gamma * 10000) / 10000,
    theta: Math.round(theta * 100) / 100,
    vega: Math.round(vega * 100) / 100,
    rho: Math.round(rho * 100) / 100,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing authorization header' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      symbol, 
      stockPrice, 
      strikePrice, 
      daysToExpiry, 
      volatility, 
      optionType = 'call' 
    } = await req.json();

    // Input validation
    if (!symbol || typeof symbol !== 'string' || !/^[A-Z0-9]{1,10}$/i.test(symbol)) {
      return new Response(
        JSON.stringify({ error: 'Invalid symbol format' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!stockPrice || typeof stockPrice !== 'number' || stockPrice <= 0 || stockPrice > 1000000) {
      return new Response(
        JSON.stringify({ error: 'Invalid stock price' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!strikePrice || typeof strikePrice !== 'number' || strikePrice <= 0 || strikePrice > 1000000) {
      return new Response(
        JSON.stringify({ error: 'Invalid strike price' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!daysToExpiry || typeof daysToExpiry !== 'number' || daysToExpiry < 0 || daysToExpiry > 1825) {
      return new Response(
        JSON.stringify({ error: 'Invalid days to expiry (must be 0-1825)' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (volatility && (typeof volatility !== 'number' || volatility < 0 || volatility > 5)) {
      return new Response(
        JSON.stringify({ error: 'Invalid volatility (must be 0-5)' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (optionType !== 'call' && optionType !== 'put') {
      return new Response(
        JSON.stringify({ error: 'Option type must be "call" or "put"' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Calculating options data for:', symbol);

    // Use provided volatility or default to 0.25 (25%)
    const vol = volatility || 0.25;
    const riskFreeRate = 0.05; // 5% default risk-free rate
    const timeToExpiry = daysToExpiry / 365;

    // Calculate Greeks and price
    const greeks = calculateGreeks(
      stockPrice,
      strikePrice,
      timeToExpiry,
      vol,
      riskFreeRate,
      optionType as 'call' | 'put'
    );

    // Calculate expected move (approximation)
    const expectedMove = stockPrice * vol * Math.sqrt(timeToExpiry);
    const expectedMovePercent = (expectedMove / stockPrice) * 100;

    // Generate strike prices around current price
    const strikeInterval = Math.round(stockPrice * 0.025); // 2.5% intervals
    const strikes = [];
    for (let i = -5; i <= 5; i++) {
      const strike = Math.round((stockPrice + i * strikeInterval) / 5) * 5; // Round to nearest 5
      strikes.push(strike);
    }

    const result = {
      symbol,
      stockPrice,
      strikePrice,
      daysToExpiry,
      volatility: vol,
      optionType,
      greeks,
      expectedMove: {
        amount: Math.round(expectedMove * 100) / 100,
        percent: Math.round(expectedMovePercent * 100) / 100,
        upperBound: Math.round((stockPrice + expectedMove) * 100) / 100,
        lowerBound: Math.round((stockPrice - expectedMove) * 100) / 100,
      },
      suggestedStrikes: strikes,
    };

    console.log('Successfully calculated options data');

    return new Response(
      JSON.stringify(result), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-options-data function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
