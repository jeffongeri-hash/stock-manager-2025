import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sparkles, Loader2, Check, X, Clock, TrendingUp, TrendingDown, AlertCircle, ArrowRight } from 'lucide-react';

interface ParsedCondition {
  type: string;
  symbol: string;
  operator: string;
  value: number;
  timeframe?: string;
  offset?: number;
  indicator_params?: Record<string, any>;
}

interface ParsedAction {
  type: 'buy' | 'sell';
  symbol: string;
  quantity: number;
  orderType: 'market' | 'limit';
  limitPrice?: number;
}

interface ParsedSchedule {
  time?: string;
  timezone?: string;
}

interface ParsedRule {
  name: string;
  conditions: ParsedCondition[];
  action: ParsedAction;
  schedule?: ParsedSchedule;
}

interface NaturalLanguageRuleBuilderProps {
  onRuleCreated?: (rule: any) => void;
  onRuleTextChange?: (text: string, parsedRule: ParsedRule | null) => void;
  initialRuleText?: string;
}

const exampleRules = [
  "Buy AAPL if it drops 5%",
  "Sell 50 shares of TSLA if RSI(14) is above 70",
  "If SPY is above $500 and VIX is below 15, buy 100 SPY at market",
  "If QQQ Daily Change is above 0% and QQQ Daily Change with an offset of 1 bar is above 0% and VXN is below 22 and QQQ RSI(14, Daily) is below 65 and time is 3:55 PM ET then buy 100 QQQ at Market"
];

export const NaturalLanguageRuleBuilder: React.FC<NaturalLanguageRuleBuilderProps> = ({ 
  onRuleCreated, 
  onRuleTextChange,
  initialRuleText 
}) => {
  const [ruleText, setRuleText] = useState(initialRuleText || '');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedRule, setParsedRule] = useState<ParsedRule | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Update rule text when initial value changes
  React.useEffect(() => {
    if (initialRuleText && initialRuleText !== ruleText) {
      setRuleText(initialRuleText);
      setParsedRule(null);
      setParseError(null);
    }
  }, [initialRuleText]);

  const parseRule = async () => {
    if (!ruleText.trim()) {
      toast.error('Please enter a trading rule');
      return;
    }

    setIsLoading(true);
    setParsedRule(null);
    setParseError(null);

    try {
      const { data, error } = await supabase.functions.invoke('parse-trading-rule', {
        body: { ruleText: ruleText.trim() }
      });

      if (error) throw error;

      if (data.error) {
        setParseError(data.error);
        toast.error(data.error);
      } else if (data.parsedRule) {
        setParsedRule(data.parsedRule);
        onRuleTextChange?.(ruleText, data.parsedRule);
        toast.success('Rule parsed successfully!');
      }
    } catch (error) {
      console.error('Parse error:', error);
      const message = error instanceof Error ? error.message : 'Failed to parse rule';
      setParseError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmRule = () => {
    if (!parsedRule) return;

    // Convert parsed rule to the TradingRule format
    const tradingRule = {
      id: Date.now().toString(),
      name: parsedRule.name,
      active: true,
      condition: {
        type: mapConditionType(parsedRule.conditions[0]?.type || 'price_above'),
        symbol: parsedRule.action.symbol,
        value: parsedRule.conditions[0]?.value || 0,
        timeframe: parsedRule.conditions[0]?.timeframe || '1D'
      },
      action: {
        type: parsedRule.action.type,
        quantity: parsedRule.action.quantity,
        orderType: parsedRule.action.orderType
      },
      triggerCount: 0,
      schedule: parsedRule.schedule
    };

    onRuleCreated?.(tradingRule);
    toast.success('Rule created successfully!');
    setRuleText('');
    setParsedRule(null);
  };

  const mapConditionType = (type: string): string => {
    const typeMap: Record<string, string> = {
      'price_change': 'price_above',
      'price_above': 'price_above',
      'price_below': 'price_below',
      'rsi': 'rsi_below',
      'indicator': 'price_above',
      'time': 'price_above',
      'volume': 'volume_spike'
    };
    return typeMap[type] || 'price_above';
  };

  const getConditionDescription = (condition: ParsedCondition): string => {
    let desc = `${condition.symbol} `;
    
    switch (condition.type) {
      case 'price_change':
        desc += `daily change ${condition.operator} ${condition.value}%`;
        break;
      case 'rsi':
        const period = condition.indicator_params?.period || 14;
        desc += `RSI(${period}) ${condition.operator} ${condition.value}`;
        break;
      case 'indicator':
        desc += `${condition.operator} ${condition.value}`;
        break;
      case 'time':
        desc = `Time is ${condition.value}`;
        break;
      default:
        desc += `${condition.operator} $${condition.value}`;
    }
    
    if (condition.offset) {
      desc += ` (${condition.offset} bar${condition.offset > 1 ? 's' : ''} ago)`;
    }
    
    if (condition.timeframe) {
      desc += ` [${condition.timeframe}]`;
    }
    
    return desc;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Natural Language Rule Builder
        </CardTitle>
        <CardDescription>
          Describe your trading rule in plain English and we'll convert it to an automated strategy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Textarea
            placeholder="Example: If QQQ Daily Change is above 0% and RSI(14) is below 65 then buy 100 QQQ at market..."
            value={ruleText}
            onChange={(e) => setRuleText(e.target.value)}
            className="min-h-[100px] font-mono text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">Try:</span>
          {exampleRules.slice(0, 3).map((example, i) => (
            <Badge 
              key={i} 
              variant="outline" 
              className="cursor-pointer hover:bg-accent text-xs"
              onClick={() => setRuleText(example)}
            >
              {example.length > 40 ? example.slice(0, 40) + '...' : example}
            </Badge>
          ))}
        </div>

        <Button 
          onClick={parseRule} 
          disabled={isLoading || !ruleText.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Parsing Rule...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Parse Rule with AI
            </>
          )}
        </Button>

        {parseError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-destructive">
              <X className="h-4 w-4" />
              <span className="font-medium">Parse Error</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{parseError}</p>
          </div>
        )}

        {parsedRule && (
          <div className="border rounded-lg p-4 space-y-4 bg-accent/5">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{parsedRule.name}</h4>
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Check className="h-3 w-3 mr-1" />
                Parsed
              </Badge>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">CONDITIONS</p>
                <ScrollArea className="max-h-[150px]">
                  <div className="space-y-2">
                    {parsedRule.conditions.map((condition, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {i > 0 && <Badge variant="secondary" className="text-xs">AND</Badge>}
                        <div className="bg-muted rounded px-3 py-2 text-sm flex-1">
                          {getConditionDescription(condition)}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">ACTION</p>
                <div className={`rounded px-3 py-2 text-sm flex items-center gap-2 ${
                  parsedRule.action.type === 'buy' ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-700'
                }`}>
                  {parsedRule.action.type === 'buy' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="font-medium">
                    {parsedRule.action.type.toUpperCase()} {parsedRule.action.quantity} {parsedRule.action.symbol}
                  </span>
                  <Badge variant="outline" className="ml-auto">
                    {parsedRule.action.orderType}
                  </Badge>
                </div>
              </div>

              {parsedRule.schedule?.time && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">SCHEDULE</p>
                  <div className="bg-blue-500/10 rounded px-3 py-2 text-sm flex items-center gap-2 text-blue-700">
                    <Clock className="h-4 w-4" />
                    <span>Execute at {parsedRule.schedule.time} {parsedRule.schedule.timezone || 'ET'}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={confirmRule} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Create This Rule
              </Button>
              <Button variant="outline" onClick={() => setParsedRule(null)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="bg-muted/50 rounded-lg p-4 text-sm">
          <p className="font-medium mb-2">Supported rule elements:</p>
          <ul className="text-muted-foreground space-y-1 text-xs">
            <li>• <strong>Price conditions:</strong> "AAPL is above $200", "drops 5%", "daily change"</li>
            <li>• <strong>Technical indicators:</strong> "RSI(14) below 30", "RSI(14, Daily)"</li>
            <li>• <strong>Volatility indicators:</strong> "VIX below 20", "VXN below 22"</li>
            <li>• <strong>Bar offsets:</strong> "with an offset of 1 bar"</li>
            <li>• <strong>Time conditions:</strong> "at 3:55 PM ET", "at market open"</li>
            <li>• <strong>Actions:</strong> "buy 100 shares", "sell at market", "buy at limit $150"</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
