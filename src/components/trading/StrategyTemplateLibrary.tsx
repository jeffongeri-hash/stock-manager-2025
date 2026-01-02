import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  TrendingUp, TrendingDown, Activity, Zap, Shield, Target, 
  Search, Copy, Star, Clock, BarChart3, Waves
} from 'lucide-react';

export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  category: 'momentum' | 'mean_reversion' | 'volatility' | 'trend' | 'breakout' | 'income';
  ruleText: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  expectedWinRate?: string;
  timeframe: string;
  riskLevel: 'low' | 'medium' | 'high';
  tags: string[];
}

const strategyTemplates: StrategyTemplate[] = [
  // Momentum Strategies
  {
    id: 'mom-1',
    name: 'RSI Momentum Buy',
    description: 'Buy when RSI crosses above 30 from oversold territory, indicating potential upward momentum.',
    category: 'momentum',
    ruleText: 'If SPY RSI(14, Daily) crosses above 30 then buy 100 SPY at market',
    difficulty: 'beginner',
    expectedWinRate: '55-60%',
    timeframe: 'Daily',
    riskLevel: 'medium',
    tags: ['RSI', 'Oversold', 'Swing Trade']
  },
  {
    id: 'mom-2',
    name: 'Double Green Day Momentum',
    description: 'Buy after two consecutive positive days with volume confirmation.',
    category: 'momentum',
    ruleText: 'If QQQ Daily Change is above 0% and QQQ Daily Change with offset of 1 bar is above 0% and volume is above average then buy 50 QQQ at market',
    difficulty: 'intermediate',
    expectedWinRate: '52-58%',
    timeframe: 'Daily',
    riskLevel: 'medium',
    tags: ['Trend Following', 'Volume']
  },
  {
    id: 'mom-3',
    name: 'MACD Crossover',
    description: 'Enter long when MACD line crosses above signal line with positive histogram.',
    category: 'momentum',
    ruleText: 'If AAPL MACD crosses above signal line and MACD histogram is positive then buy 25 AAPL at market',
    difficulty: 'intermediate',
    expectedWinRate: '50-55%',
    timeframe: '4H',
    riskLevel: 'medium',
    tags: ['MACD', 'Crossover']
  },

  // Mean Reversion Strategies
  {
    id: 'mr-1',
    name: 'RSI Oversold Bounce',
    description: 'Buy when RSI drops below 25, betting on mean reversion back to normal levels.',
    category: 'mean_reversion',
    ruleText: 'If SPY RSI(14, Daily) is below 25 then buy 100 SPY at market with stop loss at 2%',
    difficulty: 'beginner',
    expectedWinRate: '60-65%',
    timeframe: 'Daily',
    riskLevel: 'medium',
    tags: ['RSI', 'Oversold', 'Bounce']
  },
  {
    id: 'mr-2',
    name: 'Bollinger Band Squeeze',
    description: 'Buy when price touches lower Bollinger Band with RSI confirmation.',
    category: 'mean_reversion',
    ruleText: 'If MSFT price touches lower Bollinger Band(20,2) and RSI(14) is below 35 then buy 30 MSFT at market',
    difficulty: 'intermediate',
    expectedWinRate: '58-63%',
    timeframe: 'Daily',
    riskLevel: 'low',
    tags: ['Bollinger Bands', 'RSI']
  },
  {
    id: 'mr-3',
    name: 'Gap Fill Strategy',
    description: 'Fade gaps that are likely to fill during the trading day.',
    category: 'mean_reversion',
    ruleText: 'If SPY gaps down more than 1% at market open and RSI(14) is below 40 then buy 100 SPY at market',
    difficulty: 'advanced',
    expectedWinRate: '55-60%',
    timeframe: 'Intraday',
    riskLevel: 'high',
    tags: ['Gap Trading', 'Intraday']
  },

  // Volatility Strategies
  {
    id: 'vol-1',
    name: 'VIX Low Entry',
    description: 'Buy equities when VIX is low, indicating complacency and potential continuation.',
    category: 'volatility',
    ruleText: 'If VIX is below 15 and SPY RSI(14) is above 50 then buy 100 SPY at market',
    difficulty: 'beginner',
    expectedWinRate: '55-60%',
    timeframe: 'Daily',
    riskLevel: 'low',
    tags: ['VIX', 'Low Volatility']
  },
  {
    id: 'vol-2',
    name: 'VXN Spike Fade',
    description: 'Buy QQQ when VXN spikes above 25 and starts declining, capturing volatility mean reversion.',
    category: 'volatility',
    ruleText: 'If VXN is above 25 and VXN is declining from yesterday and QQQ RSI(14) is below 40 then buy 50 QQQ at market',
    difficulty: 'intermediate',
    expectedWinRate: '58-65%',
    timeframe: 'Daily',
    riskLevel: 'medium',
    tags: ['VXN', 'Volatility Spike']
  },
  {
    id: 'vol-3',
    name: 'Volatility Breakout',
    description: 'Enter when volatility contracts then expands, catching the breakout move.',
    category: 'volatility',
    ruleText: 'If SPY ATR(14) expands by 50% from 5-day average and price breaks above 20-day high then buy 100 SPY at market',
    difficulty: 'advanced',
    expectedWinRate: '50-55%',
    timeframe: 'Daily',
    riskLevel: 'high',
    tags: ['ATR', 'Breakout']
  },

  // Trend Following
  {
    id: 'trend-1',
    name: 'Moving Average Trend',
    description: 'Buy when price is above both 50 and 200 day moving averages (golden cross territory).',
    category: 'trend',
    ruleText: 'If AAPL is above 50-day MA and AAPL is above 200-day MA and RSI(14) is between 40 and 70 then buy 25 AAPL at market',
    difficulty: 'beginner',
    expectedWinRate: '55-60%',
    timeframe: 'Daily',
    riskLevel: 'low',
    tags: ['Moving Average', 'Trend']
  },
  {
    id: 'trend-2',
    name: 'ADX Strong Trend',
    description: 'Enter trending markets when ADX confirms strong directional movement.',
    category: 'trend',
    ruleText: 'If SPY ADX(14) is above 25 and +DI is above -DI and price is above 20-day MA then buy 100 SPY at market',
    difficulty: 'intermediate',
    expectedWinRate: '52-58%',
    timeframe: 'Daily',
    riskLevel: 'medium',
    tags: ['ADX', 'Trend Strength']
  },

  // Breakout Strategies
  {
    id: 'break-1',
    name: '52-Week High Breakout',
    description: 'Buy stocks breaking to new 52-week highs with volume confirmation.',
    category: 'breakout',
    ruleText: 'If NVDA breaks above 52-week high and volume is 50% above average then buy 20 NVDA at market',
    difficulty: 'intermediate',
    expectedWinRate: '48-55%',
    timeframe: 'Daily',
    riskLevel: 'high',
    tags: ['Breakout', 'New Highs']
  },
  {
    id: 'break-2',
    name: 'Range Breakout',
    description: 'Enter when price breaks out of a defined trading range.',
    category: 'breakout',
    ruleText: 'If TSLA breaks above 20-day high and ATR(14) is expanding then buy 15 TSLA at market',
    difficulty: 'intermediate',
    expectedWinRate: '50-55%',
    timeframe: '4H',
    riskLevel: 'high',
    tags: ['Range', 'Breakout']
  },

  // Income/Dividend Strategies
  {
    id: 'inc-1',
    name: 'Dividend Capture',
    description: 'Buy dividend stocks before ex-dividend date when oversold.',
    category: 'income',
    ruleText: 'If JNJ RSI(14) is below 40 and ex-dividend date is within 5 days then buy 50 JNJ at market',
    difficulty: 'beginner',
    expectedWinRate: '60-65%',
    timeframe: 'Daily',
    riskLevel: 'low',
    tags: ['Dividend', 'Income']
  },

  // Complex Multi-Condition Strategy
  {
    id: 'complex-1',
    name: 'QQQ End-of-Day Momentum',
    description: 'Buy QQQ near market close when multiple momentum and volatility conditions align.',
    category: 'momentum',
    ruleText: 'If QQQ Daily Change is above 0% and QQQ Daily Change with an offset of 1 bar is above 0% and VXN is below 22 and QQQ RSI(14, Daily) is below 65 and time is 3:55 PM ET then buy 100 QQQ at Market',
    difficulty: 'advanced',
    expectedWinRate: '58-65%',
    timeframe: 'End of Day',
    riskLevel: 'medium',
    tags: ['Multi-Condition', 'End of Day', 'Momentum']
  }
];

interface StrategyTemplateLibraryProps {
  onSelectTemplate: (template: StrategyTemplate) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  momentum: <TrendingUp className="h-4 w-4" />,
  mean_reversion: <Waves className="h-4 w-4" />,
  volatility: <Activity className="h-4 w-4" />,
  trend: <BarChart3 className="h-4 w-4" />,
  breakout: <Zap className="h-4 w-4" />,
  income: <Shield className="h-4 w-4" />
};

const categoryLabels: Record<string, string> = {
  momentum: 'Momentum',
  mean_reversion: 'Mean Reversion',
  volatility: 'Volatility',
  trend: 'Trend Following',
  breakout: 'Breakout',
  income: 'Income'
};

export const StrategyTemplateLibrary: React.FC<StrategyTemplateLibraryProps> = ({ onSelectTemplate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTemplates = strategyTemplates.filter(template => {
    const matchesSearch = searchQuery === '' || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'advanced': return 'bg-red-500/10 text-red-700 border-red-500/20';
      default: return '';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          Strategy Template Library
        </CardTitle>
        <CardDescription>
          Pre-built trading strategies you can customize and use immediately
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search strategies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <TabsTrigger key={key} value={key} className="text-xs flex items-center gap-1">
                {categoryIcons[key]}
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <ScrollArea className="h-[500px]">
          <div className="grid gap-4">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No strategies match your search</p>
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <div 
                  key={template.id} 
                  className="border rounded-lg p-4 hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{categoryIcons[template.category]}</span>
                        <h3 className="font-semibold">{template.name}</h3>
                        <Badge variant="outline" className={getDifficultyColor(template.difficulty)}>
                          {template.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                      
                      <div className="bg-muted/50 rounded p-3 font-mono text-xs">
                        {template.ruleText}
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {template.timeframe}
                        </span>
                        <span className={`flex items-center gap-1 ${getRiskColor(template.riskLevel)}`}>
                          <Activity className="h-3 w-3" />
                          {template.riskLevel} risk
                        </span>
                        {template.expectedWinRate && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Target className="h-3 w-3" />
                            ~{template.expectedWinRate} win rate
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {template.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        onSelectTemplate(template);
                        toast.success(`"${template.name}" loaded into rule builder`);
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Use
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
