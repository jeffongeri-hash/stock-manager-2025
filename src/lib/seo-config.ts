// SEO configuration for all pages
export const siteConfig = {
  name: "Profit Pathway",
  description: "Professional trading platform for portfolio management, options analysis, dividend tracking, and market insights",
  url: "https://profitpathway.app",
  ogImage: "/og-image.png",
  keywords: ["trading platform", "portfolio management", "options trading", "dividend tracker", "stock analysis", "covered calls", "wheel strategy", "retirement planning"],
};

export interface PageSEO {
  title: string;
  description: string;
  keywords?: string[];
  jsonLd?: object;
  canonicalPath?: string;
}

export const pageSEO: Record<string, PageSEO> = {
  "/": {
    title: "Profit Pathway - Trading & Portfolio Management Platform",
    description: "Free professional trading tools for portfolio management, options analysis, covered calls, dividend tracking, and market insights. Start investing smarter today.",
    keywords: ["trading platform", "portfolio tracker", "stock analysis", "free trading tools"],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Profit Pathway",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "description": "Professional trading platform for portfolio management and options analysis",
      "featureList": ["Portfolio Tracking", "Options Analysis", "Dividend Tracking", "Market Scanner", "Retirement Planning"]
    }
  },
  "/portfolio": {
    title: "Portfolio Tracker - Track Your Stock Holdings | Profit Pathway",
    description: "Track your stock portfolio performance, analyze positions, and monitor gains/losses in real-time. Free portfolio management tool.",
    keywords: ["portfolio tracker", "stock portfolio", "investment tracking", "position management"],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Portfolio Tracker",
      "applicationCategory": "FinanceApplication",
      "description": "Track and analyze your stock portfolio performance"
    }
  },
  "/options-portfolio": {
    title: "Options Toolkit - Covered Calls, Wheel Strategy & Greeks | Profit Pathway",
    description: "Comprehensive options trading toolkit with covered call analyzer, wheel strategy tracker, Poor Man's Covered Call calculator, and real-time Greeks analysis.",
    keywords: ["options trading", "covered calls", "wheel strategy", "options Greeks", "PMCC calculator", "options screener"],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Options Trading Toolkit",
      "applicationCategory": "FinanceApplication",
      "description": "Analyze options strategies including covered calls, wheel strategy, and Poor Man's Covered Calls"
    }
  },
  "/options-guide": {
    title: "Options Strategy Guide - Learn Options Trading | Profit Pathway",
    description: "Complete guide to options trading strategies including covered calls, cash-secured puts, spreads, iron condors, and the wheel strategy. Learn options from basics to advanced.",
    keywords: ["options guide", "options strategies", "learn options trading", "covered call tutorial", "options education"],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Complete Options Strategy Guide",
      "description": "Learn options trading from basic to advanced strategies",
      "articleSection": "Finance Education"
    }
  },
  "/dividend-tracker": {
    title: "Dividend Tracker - Track Dividend Income & Yield | Profit Pathway",
    description: "Track dividend income, analyze yield on cost, calculate future dividend payments, and build passive income streams. Free dividend tracking tool.",
    keywords: ["dividend tracker", "dividend income", "yield on cost", "passive income", "dividend stocks"],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Dividend Tracker",
      "applicationCategory": "FinanceApplication",
      "description": "Track and analyze dividend income from your stock portfolio"
    }
  },
  "/retirement-planning": {
    title: "Retirement Calculator - FIRE, 401k & Roth Planning | Profit Pathway",
    description: "Plan your retirement with FIRE calculators, Roth conversion optimizer, Social Security estimator, withdrawal strategies, and healthcare cost planning.",
    keywords: ["retirement calculator", "FIRE calculator", "Roth conversion", "401k planning", "retirement income"],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Retirement Planning Calculator",
      "applicationCategory": "FinanceApplication",
      "description": "Plan your retirement with comprehensive calculators for FIRE, Social Security, and withdrawal strategies"
    }
  },
  "/zero-dte": {
    title: "0DTE Options Scanner - Same-Day Options Trading | Profit Pathway",
    description: "Scan and analyze zero days to expiration (0DTE) options for SPY, QQQ, and major indices. Real-time 0DTE options chains and strategy analysis.",
    keywords: ["0DTE options", "zero DTE", "same day options", "SPY options", "options scanner"],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "0DTE Options Scanner",
      "applicationCategory": "FinanceApplication",
      "description": "Scan and analyze zero days to expiration options"
    }
  },
  "/market-scanner": {
    title: "Stock Market Scanner - Find Trading Opportunities | Profit Pathway",
    description: "Scan the market for trading opportunities with customizable filters for price, volume, technical indicators, and fundamental metrics.",
    keywords: ["stock scanner", "market scanner", "stock screener", "trading opportunities", "technical analysis"],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Market Scanner",
      "applicationCategory": "FinanceApplication",
      "description": "Scan markets for trading opportunities using technical and fundamental filters"
    }
  },
  "/analysis": {
    title: "Market Analysis - AI-Powered Stock Analysis | Profit Pathway",
    description: "Get AI-powered market analysis, sector performance insights, and stock recommendations. Analyze multiple stocks with real-time data.",
    keywords: ["market analysis", "stock analysis", "AI analysis", "sector performance", "stock recommendations"],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "AI Market Analyzer",
      "applicationCategory": "FinanceApplication",
      "description": "AI-powered market and stock analysis tool"
    }
  },
  "/stock-research": {
    title: "Stock Research - Company Fundamentals & Analysis | Profit Pathway",
    description: "Research stocks with comprehensive fundamental analysis, financial ratios, earnings data, and company comparisons. Free stock research tool.",
    keywords: ["stock research", "fundamental analysis", "company analysis", "financial ratios", "stock fundamentals"],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Stock Research Tool",
      "applicationCategory": "FinanceApplication",
      "description": "Comprehensive stock research and fundamental analysis"
    }
  },
  "/trading-automation": {
    title: "Trading Automation - Automated Trading Rules | Profit Pathway",
    description: "Create automated trading rules with natural language, backtest strategies, and execute trades automatically. Paper trading and live execution support.",
    keywords: ["trading automation", "automated trading", "trading rules", "algo trading", "backtest"],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Trading Automation",
      "applicationCategory": "FinanceApplication",
      "description": "Automate your trading with rule-based strategies"
    }
  },
  "/risk-metrics": {
    title: "Risk Analysis - Portfolio Risk Metrics & VaR | Profit Pathway",
    description: "Analyze portfolio risk with Value at Risk (VaR), Sharpe ratio, beta, correlation analysis, and Monte Carlo simulations.",
    keywords: ["risk analysis", "portfolio risk", "VaR", "Sharpe ratio", "beta", "risk metrics"],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Risk Analysis Tool",
      "applicationCategory": "FinanceApplication",
      "description": "Comprehensive portfolio risk analysis and metrics"
    }
  },
  "/etf-comparison": {
    title: "ETF Comparison Tool - Compare ETFs Side by Side | Profit Pathway",
    description: "Compare ETFs by expense ratio, holdings, performance, and sector allocation. Find the best ETFs for your portfolio.",
    keywords: ["ETF comparison", "compare ETFs", "ETF analysis", "expense ratio", "ETF screener"],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "ETF Comparison Tool",
      "applicationCategory": "FinanceApplication",
      "description": "Compare ETFs side by side with detailed metrics"
    }
  },
  "/portfolio-rebalancing": {
    title: "Portfolio Rebalancing Calculator | Profit Pathway",
    description: "Rebalance your portfolio to target allocations. Calculate trades needed to maintain your desired asset allocation.",
    keywords: ["portfolio rebalancing", "asset allocation", "rebalance calculator", "portfolio optimization"],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Portfolio Rebalancing Calculator",
      "applicationCategory": "FinanceApplication",
      "description": "Calculate trades needed to rebalance your portfolio"
    }
  },
  "/economic-calendar": {
    title: "Economic Calendar - Earnings & Economic Events | Profit Pathway",
    description: "Track earnings releases, economic indicators, Fed meetings, and market-moving events. Never miss important financial events.",
    keywords: ["economic calendar", "earnings calendar", "Fed meetings", "economic events", "market events"],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Economic Calendar",
      "applicationCategory": "FinanceApplication",
      "description": "Track earnings and economic events affecting markets"
    }
  },
  "/real-estate": {
    title: "Real Estate Calculator - Investment Property Analysis | Profit Pathway",
    description: "Analyze real estate investments with ROI calculations, rental income projections, mortgage analysis, and property comparison tools.",
    keywords: ["real estate calculator", "investment property", "rental income", "property ROI", "real estate analysis"],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Real Estate Investment Calculator",
      "applicationCategory": "FinanceApplication",
      "description": "Analyze real estate investment opportunities"
    }
  },
  "/car-finance": {
    title: "Car Finance Calculator - Auto Loan & Depreciation | Profit Pathway",
    description: "Calculate car payments, compare financing options, analyze depreciation, and find the true cost of vehicle ownership.",
    keywords: ["car loan calculator", "auto finance", "car depreciation", "vehicle cost", "car payment"],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Car Finance Calculator",
      "applicationCategory": "FinanceApplication",
      "description": "Calculate auto loans and vehicle ownership costs"
    }
  },
  "/watchlist": {
    title: "Stock Watchlist - Track Your Favorite Stocks | Profit Pathway",
    description: "Create and manage stock watchlists, set price alerts, and track your favorite stocks in real-time.",
    keywords: ["stock watchlist", "price alerts", "stock tracking", "watchlist manager"],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Stock Watchlist",
      "applicationCategory": "FinanceApplication",
      "description": "Track your favorite stocks with real-time updates"
    }
  },
  "/trading-toolkit": {
    title: "Trading Toolkit - Essential Trading Tools | Profit Pathway",
    description: "Access essential trading tools including position sizing, risk calculators, trade journal, and performance analytics.",
    keywords: ["trading tools", "position sizing", "trade journal", "trading calculator", "risk management"],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Trading Toolkit",
      "applicationCategory": "FinanceApplication",
      "description": "Essential tools for active traders"
    }
  },
  "/performance": {
    title: "Performance Analytics - Track Investment Returns | Profit Pathway",
    description: "Analyze your investment performance with detailed returns, benchmarking, and performance attribution analysis.",
    keywords: ["performance tracking", "investment returns", "portfolio performance", "benchmarking"],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Performance Analytics",
      "applicationCategory": "FinanceApplication",
      "description": "Track and analyze investment performance"
    }
  },
  "/auth": {
    title: "Sign In - Profit Pathway",
    description: "Sign in or create an account to access your personalized trading dashboard and saved data.",
    keywords: ["login", "sign in", "create account"],
  },
  "/install": {
    title: "Install App - Profit Pathway",
    description: "Install Profit Pathway as a mobile app for quick access to your trading tools on any device.",
    keywords: ["install app", "mobile app", "PWA"],
  },
};

// Get SEO config for a path, with fallback
export function getPageSEO(path: string): PageSEO {
  return pageSEO[path] || {
    title: `${siteConfig.name} - Trading & Portfolio Management`,
    description: siteConfig.description,
    keywords: siteConfig.keywords,
  };
}
