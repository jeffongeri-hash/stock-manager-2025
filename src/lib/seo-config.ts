// SEO configuration for all pages
export const siteConfig = {
  name: "Profit Pathway",
  description: "Professional trading platform for portfolio management, options analysis, dividend tracking, and market insights.",
  url: "https://profitpathfinder.online",
  ogImage: "/og-image.png",
  keywords: ["trading platform", "portfolio management", "options trading", "dividend tracker", "stock analysis", "covered calls", "wheel strategy", "retirement planning"],
};

export interface PageSEO {
  title: string;
  description: string;
  keywords?: string[];
  jsonLd?: object;
  canonicalPath?: string;
  ogType?: "website" | "article";
}

export const pageSEO: Record<string, PageSEO> = {
  "/": {
    title: "Profit Pathway — Trading & Portfolio Tools",
    description: "Free professional trading tools for portfolio, options, dividends, and market insights. Start investing smarter today.",
    keywords: ["trading platform", "portfolio tracker", "stock analysis", "free trading tools"],
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Profit Pathway",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "description": "Professional trading platform for portfolio management and options analysis",
      "featureList": ["Portfolio Tracking", "Options Analysis", "Dividend Tracking", "Market Scanner", "Retirement Planning"],
    },
  },
  "/dashboard": {
    title: "Dashboard — Profit Pathway",
    description: "Your personalized trading dashboard with watchlists, market overview, and tools at a glance.",
    keywords: ["trading dashboard", "market overview", "watchlist"],
    ogType: "website",
  },
  "/portfolio": {
    title: "Portfolio Tracker — Profit Pathway",
    description: "Track your stock portfolio, analyze positions, and monitor gains/losses in real-time. Free portfolio tool.",
    keywords: ["portfolio tracker", "stock portfolio", "investment tracking"],
    ogType: "website",
  },
  "/options-portfolio": {
    title: "Options Toolkit — Profit Pathway",
    description: "Options trading toolkit: covered call analyzer, wheel tracker, PMCC calculator, iron condors, and Greeks.",
    keywords: ["options trading", "covered calls", "wheel strategy", "PMCC calculator"],
    ogType: "website",
  },
  "/options-guide": {
    title: "Options Strategy Guide — Profit Pathway",
    description: "Guide to options strategies: covered calls, cash-secured puts, spreads, iron condors, and the wheel.",
    keywords: ["options guide", "options strategies", "learn options trading"],
    ogType: "article",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Complete Options Strategy Guide",
      "description": "Learn options trading from basic to advanced strategies",
      "articleSection": "Finance Education",
    },
  },
  "/credit-options-guide": {
    title: "Credit Options Guide — Profit Pathway",
    description: "Learn credit spreads, cash-secured puts, and risk-defined income trades with worked examples.",
    keywords: ["credit spreads", "cash secured puts", "credit options", "income options"],
    ogType: "article",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Credit Options Strategy Guide",
      "description": "Risk-defined credit option income strategies explained",
      "articleSection": "Finance Education",
    },
  },
  "/fundamental-analysis-guide": {
    title: "Fundamental Analysis Guide — Profit Pathway",
    description: "CAN SLIM methodology, ratio appropriateness matrix, and how to evaluate company fundamentals.",
    keywords: ["fundamental analysis", "CAN SLIM", "financial ratios", "stock research"],
    ogType: "article",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Fundamental Analysis Guide",
      "description": "Evaluate stocks with CAN SLIM and ratio frameworks",
      "articleSection": "Finance Education",
    },
  },
  "/dividend-tracker": {
    title: "Dividend Tracker — Profit Pathway",
    description: "Track dividend income, yield on cost, and build passive income streams. Free dividend tool.",
    keywords: ["dividend tracker", "dividend income", "yield on cost", "passive income"],
    ogType: "website",
  },
  "/fire-guide": {
    title: "FIRE Guide for Beginners — Profit Pathway",
    description: "Calculate your real FIRE number with inflation-adjusted expenses, healthcare, family costs, and more. Free beginner's guide to retiring early.",
    keywords: ["FIRE for beginners", "financial independence calculator", "retire early", "FIRE number", "lean FIRE", "fat FIRE", "barista FIRE"],
    ogType: "article",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "FIRE Guide for Beginners",
      "description": "Calculate your real financial independence number — beginner's guide to retiring early.",
      "articleSection": "Finance Education",
    },
  },
  "/retirement-planning": {
    title: "Retirement Planning — Profit Pathway",
    description: "FIRE calculators, Roth conversion, Social Security estimator, withdrawal strategies, and healthcare costs.",
    keywords: ["retirement calculator", "FIRE calculator", "Roth conversion", "401k planning"],
    ogType: "website",
  },
  "/zero-dte": {
    title: "0DTE Options Scanner — Profit Pathway",
    description: "Scan zero days to expiration (0DTE) options for SPY, QQQ, and major indices with live chains.",
    keywords: ["0DTE options", "zero DTE", "same day options", "SPY options"],
    ogType: "website",
  },
  "/market-scanner": {
    title: "Market Scanner — Profit Pathway",
    description: "Scan markets for trades with filters for price, volume, technicals, and fundamentals.",
    keywords: ["stock scanner", "market scanner", "stock screener"],
    ogType: "website",
  },
  "/analysis": {
    title: "Stock Analysis — Profit Pathway",
    description: "AI-powered market and stock analysis with technicals, fundamentals, catalysts, and analyst ratings.",
    keywords: ["market analysis", "stock analysis", "AI analysis"],
    ogType: "website",
  },
  "/risk-metrics": {
    title: "Risk Analysis — Profit Pathway",
    description: "Portfolio risk metrics: Value at Risk, Sharpe ratio, beta, correlation, and Monte Carlo.",
    keywords: ["risk analysis", "portfolio risk", "VaR", "Sharpe ratio"],
    ogType: "website",
  },
  "/portfolio-rebalancing": {
    title: "Portfolio Rebalancing — Profit Pathway",
    description: "Rebalance to target allocations. Calculate trades to maintain your desired asset mix.",
    keywords: ["portfolio rebalancing", "asset allocation", "rebalance calculator"],
    ogType: "website",
  },
  "/real-estate": {
    title: "Real Estate Calculator — Profit Pathway",
    description: "Analyze real estate investments with ROI, rental income, mortgage, and property comparison tools.",
    keywords: ["real estate calculator", "investment property", "rental income", "property ROI"],
    ogType: "website",
  },
  "/car-finance": {
    title: "Car Finance Calculator — Profit Pathway",
    description: "Calculate car payments, compare financing, analyze depreciation, and total cost of ownership.",
    keywords: ["car loan calculator", "auto finance", "car depreciation"],
    ogType: "website",
  },
  "/trading-toolkit": {
    title: "Trading Toolkit — Profit Pathway",
    description: "Trading tools: position sizing, risk calculators, trade journal, and performance analytics.",
    keywords: ["trading tools", "position sizing", "trade journal"],
    ogType: "website",
  },
  "/performance": {
    title: "Performance Analytics — Profit Pathway",
    description: "Analyze investment returns with benchmarking, attribution, and unrealized P&L breakdowns.",
    keywords: ["performance tracking", "investment returns", "portfolio performance"],
    ogType: "website",
  },
  "/smarttrade-ai": {
    title: "SmartTrade AI — Profit Pathway",
    description: "Gemini-powered trade planner and strategy simulator for smarter, faster trade ideas.",
    keywords: ["AI trading", "trade planner", "Gemini AI trading"],
    ogType: "website",
  },
  "/quantgemini": {
    title: "QuantGemini Research — Profit Pathway",
    description: "Institutional-grade investor scorecards and quantitative research via Gemini AI.",
    keywords: ["quant research", "investor scorecard", "AI stock research"],
    ogType: "website",
  },
  "/ignite-fire": {
    title: "IgniteFIRE Suite — Profit Pathway",
    description: "Advanced FIRE retirement suite with scenario modeling, withdrawals, and lifestyle planning.",
    keywords: ["FIRE", "retirement suite", "financial independence"],
    ogType: "website",
  },
  "/auth": {
    title: "Sign In — Profit Pathway",
    description: "Sign in or create an account to access your personalized trading dashboard and saved data.",
    keywords: ["login", "sign in", "create account"],
    ogType: "website",
  },
  "/install": {
    title: "Install App — Profit Pathway",
    description: "Install Profit Pathway as a mobile or desktop app for quick access to your trading tools.",
    keywords: ["install app", "mobile app", "PWA"],
    ogType: "website",
  },
};

// Get SEO config for a path, with fallback
export function getPageSEO(path: string): PageSEO {
  if (pageSEO[path]) return pageSEO[path];
  // Build a path-specific fallback so each unmapped route gets a unique title/description.
  const slug = path.replace(/^\//, "").replace(/[-/]+/g, " ").trim();
  const titleized = slug
    ? slug.replace(/\b\w/g, (c) => c.toUpperCase())
    : "Home";
  return {
    title: `${titleized} — Profit Pathway`,
    description: `${titleized} on Profit Pathway — ${siteConfig.description}`,
    keywords: siteConfig.keywords,
    ogType: "website",
  };
}
