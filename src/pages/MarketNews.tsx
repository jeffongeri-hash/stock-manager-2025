import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Newspaper, TrendingUp, TrendingDown, Clock, ExternalLink, 
  Search, RefreshCw, Filter, Bookmark, Share2, AlertCircle
} from "lucide-react";
import { format, subHours, subMinutes, subDays } from "date-fns";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: "earnings" | "macro" | "sector" | "company" | "crypto" | "forex";
  sentiment: "bullish" | "bearish" | "neutral";
  impact: "high" | "medium" | "low";
  publishedAt: Date;
  symbols?: string[];
  url: string;
  imageUrl?: string;
}

const generateMockNews = (): NewsItem[] => {
  const now = new Date();
  return [
    {
      id: "1",
      title: "Fed Signals Potential Rate Cut in 2026, Markets Rally",
      summary: "Federal Reserve officials indicate that easing inflation may allow for monetary policy adjustments in the coming quarters, sending stocks higher.",
      source: "Reuters",
      category: "macro",
      sentiment: "bullish",
      impact: "high",
      publishedAt: subMinutes(now, 15),
      url: "https://www.reuters.com/markets/",
    },
    {
      id: "2",
      title: "NVIDIA Reports Record Quarter, Beats Expectations by 20%",
      summary: "NVIDIA's Q4 earnings crush estimates with data center revenue surging 400% YoY, driven by unprecedented AI chip demand.",
      source: "Bloomberg",
      category: "earnings",
      sentiment: "bullish",
      impact: "high",
      publishedAt: subMinutes(now, 45),
      symbols: ["NVDA"],
      url: "https://www.bloomberg.com/quote/NVDA:US",
    },
    {
      id: "3",
      title: "Tesla Faces Production Challenges in Berlin Gigafactory",
      summary: "Supply chain issues and regulatory hurdles slow Tesla's European production targets, analyst downgrades stock.",
      source: "CNBC",
      category: "company",
      sentiment: "bearish",
      impact: "medium",
      publishedAt: subHours(now, 2),
      symbols: ["TSLA"],
      url: "https://www.cnbc.com/quotes/TSLA",
    },
    {
      id: "4",
      title: "Tech Sector Rotation: Investors Shift from Growth to Value",
      summary: "Rising yields prompt institutional investors to reduce exposure to high-growth tech stocks in favor of defensive sectors.",
      source: "Financial Times",
      category: "sector",
      sentiment: "bearish",
      impact: "medium",
      publishedAt: subHours(now, 3),
      url: "https://www.ft.com/markets",
    },
    {
      id: "5",
      title: "Apple Announces $100B Stock Buyback Program",
      summary: "Apple unveils its largest share repurchase program in history, signaling confidence in future cash flows and shareholder returns.",
      source: "Wall Street Journal",
      category: "company",
      sentiment: "bullish",
      impact: "high",
      publishedAt: subHours(now, 4),
      symbols: ["AAPL"],
      url: "https://www.wsj.com/market-data/quotes/AAPL",
    },
    {
      id: "6",
      title: "Oil Prices Surge on Middle East Tensions",
      summary: "Crude oil jumps 5% as geopolitical risks threaten supply disruptions, energy stocks lead market gains.",
      source: "Reuters",
      category: "macro",
      sentiment: "neutral",
      impact: "high",
      publishedAt: subHours(now, 5),
      symbols: ["XOM", "CVX"],
      url: "https://www.reuters.com/business/energy/",
    },
    {
      id: "7",
      title: "Microsoft Azure Growth Slows, Cloud Competition Intensifies",
      summary: "Microsoft's cloud division reports 28% growth, below expectations, as AWS and Google Cloud gain market share.",
      source: "TechCrunch",
      category: "earnings",
      sentiment: "bearish",
      impact: "medium",
      publishedAt: subHours(now, 6),
      symbols: ["MSFT"],
      url: "https://techcrunch.com/tag/microsoft/",
    },
    {
      id: "8",
      title: "Consumer Confidence Hits 2-Year High",
      summary: "Strong labor market and easing inflation boost consumer sentiment, retail stocks rally on positive economic outlook.",
      source: "MarketWatch",
      category: "macro",
      sentiment: "bullish",
      impact: "medium",
      publishedAt: subHours(now, 8),
      url: "https://www.marketwatch.com/",
    },
    {
      id: "9",
      title: "Amazon Expands Healthcare Ambitions with New Acquisition",
      summary: "E-commerce giant announces $8B deal to acquire healthcare technology company, expanding presence in telehealth sector.",
      source: "Bloomberg",
      category: "company",
      sentiment: "bullish",
      impact: "medium",
      publishedAt: subHours(now, 10),
      symbols: ["AMZN"],
      url: "https://www.bloomberg.com/quote/AMZN:US",
    },
    {
      id: "10",
      title: "Banking Sector Faces Headwinds from Commercial Real Estate",
      summary: "Regional banks report increased loan loss provisions as office vacancy rates hit record highs in major metros.",
      source: "Financial Times",
      category: "sector",
      sentiment: "bearish",
      impact: "high",
      publishedAt: subDays(now, 1),
      symbols: ["JPM", "BAC", "WFC"],
      url: "https://www.ft.com/companies/banks",
    },
  ];
};

const MarketNews = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savedArticles, setSavedArticles] = useState<string[]>([]);

  const news = generateMockNews();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const toggleSave = (id: string) => {
    setSavedArticles(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.symbols?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "bullish": return <TrendingUp className="h-4 w-4 text-chart-1" />;
      case "bearish": return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "bullish": return "bg-chart-1/20 text-chart-1 border-chart-1/30";
      case "bearish": return "bg-destructive/20 text-destructive border-destructive/30";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "bg-destructive/20 text-destructive";
      case "medium": return "bg-warning/20 text-warning";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "earnings": return "bg-chart-1/20 text-chart-1";
      case "macro": return "bg-chart-2/20 text-chart-2";
      case "sector": return "bg-chart-3/20 text-chart-3";
      case "company": return "bg-chart-4/20 text-chart-4";
      case "crypto": return "bg-chart-5/20 text-chart-5";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const marketSentiment = {
    bullish: news.filter(n => n.sentiment === "bullish").length,
    bearish: news.filter(n => n.sentiment === "bearish").length,
    neutral: news.filter(n => n.sentiment === "neutral").length,
  };

  return (
    <PageLayout title="Market News">
      <div className="space-y-6 animate-fade-in">
        {/* Sentiment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/20">
                  <Newspaper className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Headlines</p>
                  <p className="text-xl font-bold text-foreground">{news.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-chart-1/20">
                  <TrendingUp className="h-5 w-5 text-chart-1" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bullish</p>
                  <p className="text-xl font-bold text-chart-1">{marketSentiment.bullish}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-destructive/20">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bearish</p>
                  <p className="text-xl font-bold text-destructive">{marketSentiment.bearish}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-muted">
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Neutral</p>
                  <p className="text-xl font-bold text-foreground">{marketSentiment.neutral}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search news, symbols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-border/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="bg-muted/50">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="earnings" className="text-xs">Earnings</TabsTrigger>
                <TabsTrigger value="macro" className="text-xs">Macro</TabsTrigger>
                <TabsTrigger value="sector" className="text-xs">Sector</TabsTrigger>
                <TabsTrigger value="company" className="text-xs">Company</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="icon" onClick={handleRefresh} className="border-border/50">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* News Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-4">
            {filteredNews.map((item) => (
              <Card 
                key={item.id} 
                className="glass-card border-border/50 hover:shadow-lg transition-all duration-300 group"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getCategoryColor(item.category)}>
                        {item.category}
                      </Badge>
                      <Badge className={getImpactColor(item.impact)}>
                        {item.impact} impact
                      </Badge>
                      <Badge variant="outline" className={getSentimentColor(item.sentiment)}>
                        {getSentimentIcon(item.sentiment)}
                        <span className="ml-1">{item.sentiment}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleSave(item.id)}
                      >
                        <Bookmark className={`h-4 w-4 ${savedArticles.includes(item.id) ? "fill-primary text-primary" : ""}`} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors hover:underline block"
                  >
                    {item.title}
                  </a>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {item.summary}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{item.source}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(item.publishedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.symbols && item.symbols.length > 0 && (
                        <div className="flex items-center gap-1">
                          {item.symbols.map((symbol) => (
                            <Badge key={symbol} variant="outline" className="text-xs font-mono">
                              ${symbol}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        Read more <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Breaking News */}
            <Card className="glass-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                  </span>
                  Breaking News
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {news
                  .filter(n => n.impact === "high")
                  .slice(0, 3)
                  .map((item) => (
                    <div key={item.id} className="p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        {getSentimentIcon(item.sentiment)}
                        <span className="text-xs text-muted-foreground">{formatTimeAgo(item.publishedAt)}</span>
                      </div>
                      <p className="text-sm font-medium text-foreground line-clamp-2">{item.title}</p>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Saved Articles */}
            <Card className="glass-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-primary" />
                  Saved Articles ({savedArticles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {savedArticles.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No saved articles yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {news
                      .filter(n => savedArticles.includes(n.id))
                      .map((item) => (
                        <div key={item.id} className="p-2 rounded-lg bg-muted/30 text-sm">
                          <p className="font-medium text-foreground line-clamp-1">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.source}</p>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Market Movers */}
            <Card className="glass-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Trending Tickers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {["NVDA", "TSLA", "AAPL", "MSFT", "AMZN", "META", "JPM", "XOM"].map((ticker) => (
                    <Badge
                      key={ticker}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/20 transition-colors"
                      onClick={() => setSearchQuery(ticker)}
                    >
                      ${ticker}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default MarketNews;
