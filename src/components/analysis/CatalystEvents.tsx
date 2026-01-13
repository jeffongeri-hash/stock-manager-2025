import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, TrendingUp, TrendingDown, AlertTriangle, Newspaper, Building2, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CatalystEvent {
  id: string;
  date: string;
  title: string;
  type: 'earnings' | 'dividend' | 'split' | 'merger' | 'regulatory' | 'product' | 'analyst';
  impact: 'bullish' | 'bearish' | 'neutral';
  description: string;
}

interface CatalystEventsProps {
  symbol: string;
}

export const CatalystEvents: React.FC<CatalystEventsProps> = ({ symbol }) => {
  const [events, setEvents] = useState<CatalystEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState<any[]>([]);

  // Generate potential catalyst events
  useEffect(() => {
    const generateEvents = () => {
      const today = new Date();
      const mockEvents: CatalystEvent[] = [
        {
          id: '1',
          date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          title: 'Q1 2026 Earnings Report',
          type: 'earnings',
          impact: 'neutral',
          description: 'Quarterly earnings release expected. Watch for revenue guidance and margin trends.'
        },
        {
          id: '2',
          date: new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          title: 'Ex-Dividend Date',
          type: 'dividend',
          impact: 'bullish',
          description: 'Quarterly dividend payment. Must own shares before this date to receive dividend.'
        },
        {
          id: '3',
          date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          title: 'FDA Decision Expected',
          type: 'regulatory',
          impact: 'neutral',
          description: 'Potential regulatory approval or decision that could impact stock price.'
        },
        {
          id: '4',
          date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          title: 'Product Launch Event',
          type: 'product',
          impact: 'bullish',
          description: 'New product announcement expected. Could drive near-term price action.'
        },
        {
          id: '5',
          date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          title: 'Analyst Day Presentation',
          type: 'analyst',
          impact: 'neutral',
          description: 'Management to present long-term strategy and financial outlook.'
        },
      ];
      
      setEvents(mockEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    };
    
    generateEvents();
  }, [symbol]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-market-news', {
        body: { symbols: [symbol], category: 'company' }
      });
      
      if (error) throw error;
      if (data?.news) {
        setNews(data.news.slice(0, 5));
      }
    } catch (err) {
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [symbol]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'earnings': return '📊';
      case 'dividend': return '💰';
      case 'split': return '✂️';
      case 'merger': return '🤝';
      case 'regulatory': return '⚖️';
      case 'product': return '🚀';
      case 'analyst': return '📋';
      default: return '📅';
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'bullish':
        return <Badge className="bg-green-500"><TrendingUp className="h-3 w-3 mr-1" />Bullish</Badge>;
      case 'bearish':
        return <Badge variant="destructive"><TrendingDown className="h-3 w-3 mr-1" />Bearish</Badge>;
      default:
        return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />Neutral</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Upcoming Catalysts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Upcoming Catalysts - {symbol}
          </CardTitle>
          <CardDescription>Potential market-moving events to watch</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="flex items-start gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="text-2xl">{getTypeIcon(event.type)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{event.title}</h4>
                    {getImpactBadge(event.impact)}
                  </div>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    <span>{formatDate(event.date)}</span>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs capitalize">{event.type}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent News */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5" />
                Recent News
              </CardTitle>
              <CardDescription>Latest headlines that may impact the stock</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchNews} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {news.length > 0 ? (
            <div className="space-y-3">
              {news.map((item, index) => (
                <div key={index} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="space-y-1 block"
                  >
                    <h4 className="font-medium text-sm hover:text-primary transition-colors line-clamp-2">
                      {item.headline || item.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      <span>{item.source}</span>
                      <span>•</span>
                      <span>{new Date(item.datetime * 1000 || item.publishedAt).toLocaleDateString()}</span>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              {loading ? 'Loading news...' : 'No recent news available'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
