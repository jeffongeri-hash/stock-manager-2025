
import React, { useState, useRef, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User, Sparkles, TrendingUp, Shield, PieChart, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_PROMPTS = [
  { icon: TrendingUp, text: "Analyze my portfolio performance", prompt: "Can you analyze my current portfolio performance and suggest improvements?" },
  { icon: Shield, text: "Risk assessment", prompt: "What's my current portfolio risk level and how can I reduce it?" },
  { icon: PieChart, text: "Sector allocation", prompt: "How is my portfolio allocated across different sectors? Am I well diversified?" },
  { icon: Sparkles, text: "Trade ideas", prompt: "Based on current market conditions, what trade opportunities should I consider?" },
];

export default function TradeAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [portfolioContext, setPortfolioContext] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchPortfolioContext();
    }
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchPortfolioContext = async () => {
    try {
      const [stockTradesRes, optionsTradesRes, watchlistRes] = await Promise.all([
        supabase.from('stock_trades').select('*'),
        supabase.from('trades').select('*'),
        supabase.from('watchlist').select('*'),
      ]);

      let context = '';
      
      if (stockTradesRes.data?.length) {
        const openPositions = stockTradesRes.data.filter(t => !t.exit_price);
        const closedPositions = stockTradesRes.data.filter(t => t.exit_price);
        
        context += `Stock Positions:\n`;
        context += `- Open positions: ${openPositions.length}\n`;
        context += `- Closed trades: ${closedPositions.length}\n`;
        
        if (openPositions.length > 0) {
          context += `Open positions detail:\n`;
          openPositions.forEach(p => {
            context += `  - ${p.symbol}: ${p.quantity} shares @ $${p.entry_price}\n`;
          });
        }
      }

      if (optionsTradesRes.data?.length) {
        context += `\nOptions Trades: ${optionsTradesRes.data.length} total\n`;
        const recentTrades = optionsTradesRes.data.slice(-5);
        context += `Recent options activity:\n`;
        recentTrades.forEach(t => {
          context += `  - ${t.symbol} ${t.type} ${t.strike} ${t.expiration} (${t.action})\n`;
        });
      }

      if (watchlistRes.data?.length) {
        context += `\nWatchlist: ${watchlistRes.data.map(w => w.symbol).join(', ')}\n`;
      }

      setPortfolioContext(context || 'No portfolio data found.');
    } catch (error) {
      console.error('Error fetching portfolio context:', error);
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trade-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          portfolioContext,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      const updateAssistantMessage = (content: string) => {
        assistantContent = content;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
          }
          return [...prev, { role: 'assistant', content }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              updateAssistantMessage(assistantContent);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to get AI response');
      setMessages(prev => prev.filter(m => m !== userMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <PageLayout title="AI Trade Assistant">
      <div className="max-w-4xl mx-auto space-y-4">
        <Card className="glass-card border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Trade Assistant</CardTitle>
                <CardDescription>AI-powered portfolio analysis and trade recommendations</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Chat Area */}
            <ScrollArea className="h-[400px] pr-4 mb-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="space-y-4">
                  <p className="text-center text-muted-foreground py-8">
                    Ask me anything about your portfolio, market conditions, or trading strategies.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SUGGESTED_PROMPTS.map((item, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        className="h-auto p-4 justify-start text-left hover:bg-primary/5 hover:border-primary/30"
                        onClick={() => sendMessage(item.prompt)}
                      >
                        <item.icon className="h-5 w-5 mr-3 text-primary shrink-0" />
                        <span className="text-sm">{item.text}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex gap-3 animate-fade-in',
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="p-2 rounded-full bg-primary/10 h-fit">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'rounded-2xl px-4 py-3 max-w-[80%]',
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        {message.role === 'assistant' ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm">{message.content}</p>
                        )}
                      </div>
                      {message.role === 'user' && (
                        <div className="p-2 rounded-full bg-secondary h-fit">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex gap-3 justify-start animate-fade-in">
                      <div className="p-2 rounded-full bg-primary/10 h-fit">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="bg-muted rounded-2xl px-4 py-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your portfolio, market analysis, or trade ideas..."
                className="min-h-[60px] resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-[60px] w-[60px] shrink-0"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
