// SEO configuration for all pages
export const siteConfig = {
  name: "Profit Pathfinder",
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
    title: "Profit Pathfinder — Coast FIRE Tracker and Early Retirement Calculators",
    description: "Profit Pathfinder helps you track Coast FIRE, calculate your FIRE number, plan early retirement, and model long-term investment growth.",
    keywords: ["Coast FIRE tracker", "Coast FIRE calculator", "early retirement calculator", "FIRE for beginners", "financial independence tracker"],
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Profit Pathfinder",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "description": "Coast FIRE tracker, early retirement calculator, dividend tracking, and long-term investment planning tools.",
      "featureList": ["Coast FIRE Tracker", "Early Retirement Calculator", "Dividend Tracking", "Portfolio Tracking", "Retirement Planning"],
    },
  },
  "/coast-fire-tracker": {
    title: "Coast FIRE Tracker — Calculate Your Coast FIRE Number",
    description: "Free Coast FIRE Tracker: calculate your Coast FIRE number, track progress, and see when your portfolio can coast to financial independence.",
    keywords: ["Coast FIRE tracker", "Coast FIRE number", "track Coast FIRE", "Coast FIRE progress tracker", "free Coast FIRE tracker"],
    ogType: "website",
  },
  "/what-is-coast-fire": {
    title: "What Is Coast FIRE? Coast FIRE Explained for Beginners",
    description: "Learn what Coast FIRE means, how it works, how to calculate your Coast FIRE number, and how it compares to traditional FIRE.",
    keywords: ["what is Coast FIRE", "Coast FIRE explained", "Coast FIRE meaning", "Coast FIRE vs FIRE"],
    ogType: "article",
  },
  "/fire-for-beginners": {
    title: "FIRE for Beginners - Financial Independence and Early Retirement Guide",
    description: "A beginner-friendly guide to FIRE, including Coast FIRE, traditional FIRE, savings rate, withdrawal rates, investing, and early retirement planning.",
    keywords: ["FIRE for beginners", "financial independence guide", "early retirement guide", "FIRE basics"],
    ogType: "article",
  },
  "/early-retirement-calculator": {
    title: "Early Retirement Calculator - Track Your Path to Financial Independence",
    description: "Use Profit Pathfinder's early retirement calculator to estimate your FIRE number, retirement timeline, savings rate, and investment growth.",
    keywords: ["early retirement calculator", "early retirement tracker", "FIRE timeline", "years to FIRE"],
    ogType: "website",
  },
  "/portfolio": {
    title: "Portfolio Tracker — Profit Pathfinder",
    description: "Track your stock portfolio, analyze positions, and monitor gains/losses in real-time. Free portfolio tool.",
    keywords: ["portfolio tracker", "stock portfolio", "investment tracking"],
    ogType: "website",
  },
  "/options-portfolio": {
    title: "Options Toolkit — Profit Pathfinder",
    description: "Options trading toolkit: covered call analyzer, wheel tracker, PMCC calculator, iron condors, and Greeks.",
    keywords: ["options trading", "covered calls", "wheel strategy", "PMCC calculator"],
    ogType: "website",
  },
  "/options-guide": {
    title: "Options Strategy Guide — Profit Pathfinder",
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
    title: "Credit Options Guide — Profit Pathfinder",
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
    title: "Fundamental Analysis Guide — Profit Pathfinder",
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
    title: "Dividend Tracker — Profit Pathfinder",
    description: "Track dividend income, yield on cost, and build passive income streams. Free dividend tool.",
    keywords: ["dividend tracker", "dividend income", "yield on cost", "passive income"],
    ogType: "website",
  },
  "/fire-guide": {
    title: "FIRE Guide for Beginners — Profit Pathfinder",
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
    title: "Retirement Planning — Profit Pathfinder",
    description: "FIRE calculators, Roth conversion, Social Security estimator, withdrawal strategies, and healthcare costs.",
    keywords: ["retirement calculator", "FIRE calculator", "Roth conversion", "401k planning"],
    ogType: "website",
  },
  "/zero-dte": {
    title: "0DTE Options Scanner — Profit Pathfinder",
    description: "Scan zero days to expiration (0DTE) options for SPY, QQQ, and major indices with live chains.",
    keywords: ["0DTE options", "zero DTE", "same day options", "SPY options"],
    ogType: "website",
  },
  "/analysis": {
    title: "Stock Analysis — Profit Pathfinder",
    description: "AI-powered market and stock analysis with technicals, fundamentals, catalysts, and analyst ratings.",
    keywords: ["market analysis", "stock analysis", "AI analysis"],
    ogType: "website",
  },
  "/real-estate": {
    title: "Real Estate Calculator — Profit Pathfinder",
    description: "Analyze real estate investments with ROI, rental income, mortgage, and property comparison tools.",
    keywords: ["real estate calculator", "investment property", "rental income", "property ROI"],
    ogType: "website",
  },
  "/car-finance": {
    title: "Car Finance Calculator — Profit Pathfinder",
    description: "Calculate car payments, compare financing, analyze depreciation, and total cost of ownership.",
    keywords: ["car loan calculator", "auto finance", "car depreciation"],
    ogType: "website",
  },
  "/trading-toolkit": {
    title: "Trading Toolkit — Profit Pathfinder",
    description: "Trading tools: position sizing, risk calculators, trade journal, and performance analytics.",
    keywords: ["trading tools", "position sizing", "trade journal"],
    ogType: "website",
  },
  "/performance": {
    title: "Performance Analytics — Profit Pathfinder",
    description: "Analyze investment returns with benchmarking, attribution, and unrealized P&L breakdowns.",
    keywords: ["performance tracking", "investment returns", "portfolio performance"],
    ogType: "website",
  },
  "/smarttrade-ai": {
    title: "SmartTrade AI — Profit Pathfinder",
    description: "Gemini-powered trade planner and strategy simulator for smarter, faster trade ideas.",
    keywords: ["AI trading", "trade planner", "Gemini AI trading"],
    ogType: "website",
  },
  "/quantgemini": {
    title: "QuantGemini Research — Profit Pathfinder",
    description: "Institutional-grade investor scorecards and quantitative research via Gemini AI.",
    keywords: ["quant research", "investor scorecard", "AI stock research"],
    ogType: "website",
  },
  "/auth": {
    title: "Sign In — Profit Pathfinder",
    description: "Sign in or create an account to access your personalized trading dashboard and saved data.",
    keywords: ["login", "sign in", "create account"],
    ogType: "website",
  },
  "/install": {
    title: "Install App — Profit Pathfinder",
    description: "Install Profit Pathfinder as a mobile or desktop app for quick access to your trading tools.",
    keywords: ["install app", "mobile app", "PWA"],
    ogType: "website",
  },
  "/all-tools": {
    title: "All Tools — Profit Pathfinder",
    description: "Browse every Profit Pathfinder tool: portfolio, options, dividends, FIRE, retirement, and finance guides in one directory.",
    keywords: ["all trading tools", "investment calculators", "finance tools directory"],
    ogType: "website",
  },
  "/dashboard": {
    title: "Dashboard — Profit Pathfinder",
    description: "Your personalized trading dashboard: portfolio snapshot, watchlists, market movers, and quick access to every tool.",
    keywords: ["trading dashboard", "portfolio dashboard", "investor dashboard"],
    ogType: "website",
  },
  "/index": {
    title: "Profit Pathfinder — Trading & Portfolio Tools",
    description: "Free professional trading tools for portfolio, options, dividends, and market insights. Start investing smarter today.",
    keywords: ["trading platform", "portfolio tracker", "free investing tools"],
    ogType: "website",
  },
  "/market-scanner": {
    title: "Market Scanner — Profit Pathfinder",
    description: "Scan stocks and options with advanced filters: LEAPS, covered call candidates, momentum, and presets.",
    keywords: ["market scanner", "stock scanner", "options scanner", "LEAPS screener"],
    ogType: "website",
  },
  "/paycheck-calculator": {
    title: "Paycheck Calculator — Federal, State & Local Taxes | Profit Pathfinder",
    description: "Estimate take-home pay with federal, state, and local taxes plus pre/post-tax deductions. Free Gemini AI paycheck calculator.",
    keywords: ["paycheck calculator", "take home pay", "tax calculator", "salary calculator"],
    ogType: "website",
  },
  "/financial-independence-calculator": {
    title: "Financial Independence Calculator — Years to FI | Profit Pathfinder",
    description: "Calculate your FI number, years to financial independence, and the impact of your savings rate. Free FI calculator with no signup.",
    keywords: ["financial independence calculator", "FI number", "financial independence tracker"],
    ogType: "website",
  },
  "/coast-fire-calculator": {
    title: "Coast FIRE Calculator - Find Your Coast FIRE Number",
    description: "Calculate your Coast FIRE number and see how much you need invested today for your portfolio to grow into your retirement goal.",
    keywords: ["Coast FIRE calculator", "Coast FIRE number", "Coast FIRE formula"],
    ogType: "website",
  },
  "/monthly-dividend-calculator": {
    title: "Monthly Dividend Calculator — Profit Pathfinder",
    description: "Calculate monthly dividend income, yield on cost, and reinvestment growth. Free dividend income tool.",
    keywords: ["monthly dividend calculator", "dividend income calculator", "DRIP calculator"],
    ogType: "website",
  },
  "/ai-trade-journal": {
    title: "AI Trade Journal — Pattern Analysis | Profit Pathfinder",
    description: "Upload your brokerage CSV and get AI-powered pattern analysis of your trades. Find what's costing you money and what's working.",
    keywords: ["AI trade journal", "trading pattern analysis", "trade review AI", "brokerage CSV analysis"],
    ogType: "website",
  },
  "/ai-trade-journal-demo": {
    title: "AI Trade Journal Live Demo — Profit Pathfinder",
    description: "Try the AI Trade Journal live demo. See pattern analysis of sample brokerage trades in seconds.",
    keywords: ["AI trade journal demo", "trade analysis demo", "trading AI"],
    ogType: "website",
  },
  "/premarket-brief": {
    title: "Pre-Market Brief — Daily Trading Intelligence | Profit Pathfinder",
    description: "Curated pre-market intelligence delivered before the bell: sector leaders, signal changes, Fibonacci levels, and catalysts.",
    keywords: ["premarket brief", "premarket trading", "daily market brief", "trading intelligence"],
    ogType: "website",
  },
  "/weekly-fundamental-scan": {
    title: "Weekly Fundamental Scan — Institutional Stock Research | Profit Pathfinder",
    description: "Weekly deep-dive fundamental scan across AI infrastructure, semiconductor, and datacenter stocks. Know what to own and why.",
    keywords: ["weekly stock scan", "fundamental analysis", "AI stocks research", "semiconductor stocks"],
    ogType: "website",
  },
  "/fire-planning-suite": {
    title: "FIRE Planning Suite — Coast, Barista & Monte Carlo | Profit Pathfinder",
    description: "Complete FIRE planning: FIRE number, Coast FIRE, Barista FIRE, Monte Carlo simulation, withdrawal strategies, and PDF report.",
    keywords: ["FIRE planning suite", "Coast FIRE", "Barista FIRE", "Monte Carlo retirement", "FIRE calculator"],
    ogType: "website",
  },
  "/blog/real-estate-car-finance-guide": {
    title: "Real Estate & Car Finance Calculators Guide | Profit Pathfinder",
    description: "Walkthrough of the Real Estate Investment and Car Finance calculators — cash flow, ROI, true loan cost, and total interest modeling.",
    keywords: ["real estate calculator guide", "car finance calculator guide", "rental cash flow", "auto loan calculator"],
    ogType: "article",
  },
  "/blog/covered-call-calculator-guide": {
    title: "Covered Call Calculator & Trading Toolkit Guide | Profit Pathfinder",
    description: "Full walkthrough of the Covered Call Calculator and Trading Toolkit — premium income, breakeven, annualized return, position sizing, and IV rank.",
    keywords: ["covered call calculator guide", "wheel strategy calculator", "options premium calculator", "trading toolkit"],
    ogType: "article",
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
  // Keep fallback description well under 160 chars even with long titleized prefixes.
  const shortDesc = `${titleized} — free trading, portfolio, options, and retirement tools on Profit Pathfinder.`;
  return {
    title: `${titleized} — Profit Pathfinder`,
    description: shortDesc.length > 158 ? `${titleized} on Profit Pathfinder — trading & portfolio tools.` : shortDesc,
    keywords: siteConfig.keywords,
    ogType: "website",
  };
}
