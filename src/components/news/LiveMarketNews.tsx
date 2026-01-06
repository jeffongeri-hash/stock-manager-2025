import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { NewspaperIcon, RefreshCw, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  url: string;
  imageUrl?: string;
  relatedSymbols: string[];
  sentiment: string;
}

interface LiveMarketNewsProps {
  symbols?: string[];
  className?: string;
  maxItems?: number;
}

export function LiveMarketNews({ symbols, className, maxItems = 5 }: LiveMarketNewsProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchNews = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setRefreshing(true);
      
      const { data, error } = await supabase.functions.invoke('fetch-market-news', {
        body: { symbols: symbols || ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'] }
      });

      if (error) throw error;

      if (data?.news) {
        setNews(data.news.slice(0, maxItems));
        setLastUpdated(new Date(data.lastUpdated));
        if (showRefreshToast) toast.success('News refreshed');
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      if (showRefreshToast) toast.error('Failed to refresh news');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => fetchNews(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [symbols?.join(',')]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'bullish':
      case 'positive':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'bearish':
      case 'negative':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'bullish':
      case 'positive':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'bearish':
      case 'negative':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <NewspaperIcon className="h-5 w-5 mr-2" />
              <h3 className="font-semibold text-lg">Live Market News</h3>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <NewspaperIcon className="h-5 w-5 mr-2" />
            <h3 className="font-semibold text-lg">Live Market News</h3>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                {formatTimeAgo(lastUpdated.toISOString())}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchNews(true)}
              disabled={refreshing}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {news.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No news available
            </div>
          ) : (
            news.map((item) => (
              <div key={item.id} className="p-4 transition-colors hover:bg-muted/30">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h4 className="font-medium text-sm sm:text-base line-clamp-2">{item.title}</h4>
                  <div className="flex items-center gap-1 shrink-0">
                    {getSentimentIcon(item.sentiment)}
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(item.publishedAt)}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.summary}</p>
                
                {item.imageUrl && (
                  <div className="relative h-24 sm:h-32 mb-3 overflow-hidden rounded-md">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex gap-1 flex-wrap">
                    {item.relatedSymbols?.slice(0, 3).map((symbol) => (
                      <Badge key={symbol} variant="outline" className="text-xs">
                        {symbol}
                      </Badge>
                    ))}
                    <Badge className={cn("text-xs", getSentimentColor(item.sentiment))}>
                      {item.sentiment}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-primary">{item.source}</span>
                    {item.url && item.url !== '#' && (
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
