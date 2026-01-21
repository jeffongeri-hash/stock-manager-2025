export interface StockData {
  symbol: string;
  name: string;
  price: string;
  change: string;
  sector: string;
  industry: string;
  liveData?: {
    currentPrice: number;
    high: number;
    low: number;
    previousClose: number;
    changePercent: number;
    timestamp: string;
  };
  fundamentals: {
    epsGrowth: string;
    epsGrowthHistory: { year: string; value: number }[];
    roe: string;
    roa: string;
    netMargin: string;
    operatingMargin: string;
    currentRatio: string;
    quickRatio: string;
    fcf: string;
    pegRatio: string;
    debtToEquity: string;
    marketCap: string;
    peRatio: string;
    pbRatio: string;
    profitMargin: string;
  };
  yoyComparison: {
    revenue: { current: number; previous: number; unit: string };
    roe: { current: number; previous: number };
    roa: { current: number; previous: number };
    peRatio: { current: number; previous: number };
    netMargin: { current: number; previous: number };
    operatingMargin: { current: number; previous: number };
    currentRatio: { current: number; previous: number };
    debtToEquity: { current: number; previous: number };
    fcf: { current: number; previous: number; unit: string };
  };
  technicalAnalysis: {
    trend: string;
    support: string;
    resistance: string;
    rsi: string;
    ma50: string;
    ma200: string;
    macd: string;
    volumeTrend: string;
    volumePriceAnalysis: string;
    movingAverages: string;
    volumeProfile: string;
  };
  investorScorecard: {
    oneil: { score: number; verdict: string; details: string };
    buffett: { score: number; verdict: string; details: string };
    ackman: { score: number; verdict: string; details: string };
    shkreli: { score: number; verdict: string; details: string };
    lynch: { score: number; verdict: string; details: string };
  };
  catalysts: { event: string; impact: string; timeline: string }[];
  recentNews: { date: string; headline: string; sentiment: 'bullish' | 'bearish' | 'neutral'; source: string }[];
  sectorComparison: {
    peer: string;
    peRatio: string;
    revenueGrowth: string;
    profitMargin: string;
  }[];
  marketCorrelation: {
    label: string;
    value: number;
  }[];
  ivAnalysis: {
    impliedVol: string;
    historicalVol: string;
    ivRank: string;
    tradingSuggestion: string;
    volatilityHistory: { date: string; iv: number; hv: number }[];
  };
  analystSentiment: {
    consensus: string;
    targetPrice: string;
    score: number;
    summary: string;
    ratings: {
      buy: number;
      hold: number;
      sell: number;
    };
    reports: {
      analystName: string;
      target: string;
      snippet: string;
    }[];
  };
  historicalChart: {
    date: string;
    price: number;
    volume: number;
    news?: string;
  }[];
  bullishBearish: {
    bullCase: string[];
    bearCase: string[];
  };
  sources?: { title: string; uri: string }[];
}

export interface AnalysisState {
  isLoading: boolean;
  error: string | null;
  data: StockData | null;
}
