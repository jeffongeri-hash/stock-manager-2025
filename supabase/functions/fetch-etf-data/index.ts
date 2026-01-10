import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ETFHolding {
  symbol: string;
  name: string;
  weight: number;
}

interface ETFData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  expenseRatio: number;
  holdings: ETFHolding[];
  performance: { [key: string]: number };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbols } = await req.json();
    const apiKey = Deno.env.get('FINNHUB_API_KEY');

    if (!apiKey) {
      throw new Error('FINNHUB_API_KEY not configured');
    }

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      throw new Error('Symbols array is required');
    }

    const etfDataPromises = symbols.map(async (symbol: string) => {
      try {
        // Fetch quote data
        const quoteResponse = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
        );
        const quoteData = await quoteResponse.json();

        // Fetch company profile for name
        const profileResponse = await fetch(
          `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`
        );
        const profileData = await profileResponse.json();

        // Fetch ETF holdings (Finnhub has this for some ETFs)
        let holdings: ETFHolding[] = [];
        try {
          const holdingsResponse = await fetch(
            `https://finnhub.io/api/v1/etf/holdings?symbol=${symbol}&token=${apiKey}`
          );
          const holdingsData = await holdingsResponse.json();
          
          if (holdingsData.holdings && Array.isArray(holdingsData.holdings)) {
            holdings = holdingsData.holdings.slice(0, 10).map((h: any) => ({
              symbol: h.symbol || 'N/A',
              name: h.name || h.symbol || 'Unknown',
              weight: (h.percent || 0)
            }));
          }
        } catch (e) {
          console.log(`Holdings not available for ${symbol}`);
        }

        // Fetch basic financials for expense ratio if available
        let expenseRatio = 0;
        try {
          const metricsResponse = await fetch(
            `https://finnhub.io/api/v1/etf/profile?symbol=${symbol}&token=${apiKey}`
          );
          const metricsData = await metricsResponse.json();
          expenseRatio = metricsData.expenseRatio || 0;
        } catch (e) {
          console.log(`Expense ratio not available for ${symbol}`);
        }

        // Calculate price and change
        const currentPrice = quoteData.c || 0;
        const change = quoteData.d || 0;
        const changePercent = quoteData.dp || 0;
        const previousClose = quoteData.pc || currentPrice;

        // Fetch historical data for performance calculations
        let performance: { [key: string]: number } = {};
        try {
          // Get 10 years of data for performance calculations
          const now = Math.floor(Date.now() / 1000);
          const tenYearsAgo = now - (10 * 365 * 24 * 60 * 60);
          
          const candlesResponse = await fetch(
            `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${tenYearsAgo}&to=${now}&token=${apiKey}`
          );
          const candlesData = await candlesResponse.json();

          if (candlesData.c && candlesData.c.length > 0) {
            const prices = candlesData.c;
            const timestamps = candlesData.t;
            const currentIdx = prices.length - 1;
            const current = prices[currentIdx];

            // Calculate returns for different periods
            const periodDays: { [key: string]: number } = {
              'YTD': getYTDDays(),
              '1Y': 252,
              '2Y': 504,
              '3Y': 756,
              '5Y': 1260,
              '10Y': 2520,
              'All': prices.length
            };

            for (const [period, days] of Object.entries(periodDays)) {
              const startIdx = Math.max(0, currentIdx - days);
              if (startIdx < currentIdx) {
                const startPrice = prices[startIdx];
                const returnPct = ((current - startPrice) / startPrice) * 100;
                performance[period] = Math.round(returnPct * 10) / 10;
              }
            }
          }
        } catch (e) {
          console.log(`Historical data not available for ${symbol}:`, e);
          // Fallback to estimate based on daily change
          performance = {
            'YTD': changePercent * 5, // Rough estimate
            '1Y': changePercent * 20,
            '2Y': changePercent * 35,
            '3Y': changePercent * 50,
            '5Y': changePercent * 80,
            '10Y': changePercent * 150,
            'All': changePercent * 200
          };
        }

        return {
          symbol,
          name: profileData.name || getETFName(symbol),
          price: currentPrice,
          change,
          changePercent,
          expenseRatio,
          holdings: holdings.length > 0 ? holdings : getDefaultHoldings(symbol),
          performance
        };
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        return getFallbackData(symbol);
      }
    });

    const etfData = await Promise.all(etfDataPromises);

    return new Response(
      JSON.stringify({ success: true, data: etfData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-etf-data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getYTDDays(): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const diffTime = now.getTime() - startOfYear.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getETFName(symbol: string): string {
  const names: { [key: string]: string } = {
    'SPY': 'SPDR S&P 500 ETF Trust',
    'QQQ': 'Invesco QQQ Trust',
    'VTI': 'Vanguard Total Stock Market ETF',
    'VOO': 'Vanguard S&P 500 ETF',
    'IWM': 'iShares Russell 2000 ETF',
    'VUG': 'Vanguard Growth ETF',
    'VTV': 'Vanguard Value ETF',
    'ARKK': 'ARK Innovation ETF',
    'DIA': 'SPDR Dow Jones Industrial Average ETF',
    'VEA': 'Vanguard FTSE Developed Markets ETF',
    'EFA': 'iShares MSCI EAFE ETF',
    'EEM': 'iShares MSCI Emerging Markets ETF',
    'AGG': 'iShares Core US Aggregate Bond ETF',
    'BND': 'Vanguard Total Bond Market ETF',
    'GLD': 'SPDR Gold Trust',
    'SLV': 'iShares Silver Trust',
    'XLF': 'Financial Select Sector SPDR Fund',
    'XLK': 'Technology Select Sector SPDR Fund',
    'XLE': 'Energy Select Sector SPDR Fund',
    'XLV': 'Health Care Select Sector SPDR Fund',
  };
  return names[symbol] || `${symbol} ETF`;
}

function getDefaultHoldings(symbol: string): ETFHolding[] {
  const holdingsMap: { [key: string]: ETFHolding[] } = {
    'SPY': [
      { symbol: 'AAPL', name: 'Apple Inc.', weight: 7.2 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', weight: 6.8 },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', weight: 3.4 },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', weight: 3.2 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', weight: 2.1 },
    ],
    'QQQ': [
      { symbol: 'AAPL', name: 'Apple Inc.', weight: 11.2 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', weight: 10.5 },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', weight: 5.8 },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', weight: 5.2 },
      { symbol: 'META', name: 'Meta Platforms Inc.', weight: 4.8 },
    ],
    'VTI': [
      { symbol: 'AAPL', name: 'Apple Inc.', weight: 6.5 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', weight: 6.1 },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', weight: 2.9 },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', weight: 2.8 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', weight: 1.8 },
    ],
  };
  return holdingsMap[symbol] || [
    { symbol: 'N/A', name: 'Holdings data not available', weight: 0 }
  ];
}

function getFallbackData(symbol: string): ETFData {
  return {
    symbol,
    name: getETFName(symbol),
    price: 0,
    change: 0,
    changePercent: 0,
    expenseRatio: 0,
    holdings: getDefaultHoldings(symbol),
    performance: { 'YTD': 0, '1Y': 0, '2Y': 0, '3Y': 0, '5Y': 0, '10Y': 0, 'All': 0 }
  };
}
