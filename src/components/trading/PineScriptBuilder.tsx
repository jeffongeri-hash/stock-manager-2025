import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Code, Copy, Download, ExternalLink, Wand2, BookOpen, 
  TrendingUp, TrendingDown, Settings, Layers
} from 'lucide-react';
import { toast } from 'sonner';

interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  code: string;
}

const strategyTemplates: StrategyTemplate[] = [
  {
    id: 'ma_crossover',
    name: 'Moving Average Crossover',
    description: 'Classic strategy using fast and slow MA crossovers',
    category: 'trend',
    code: `//@version=5
strategy("MA Crossover Strategy", overlay=true, initial_capital=10000, default_qty_type=strategy.percent_of_equity, default_qty_value=100)

// Inputs
fastLength = input.int(9, "Fast MA Length", minval=1)
slowLength = input.int(21, "Slow MA Length", minval=1)
maType = input.string("SMA", "MA Type", options=["SMA", "EMA"])

// Calculate MAs
fastMA = maType == "SMA" ? ta.sma(close, fastLength) : ta.ema(close, fastLength)
slowMA = maType == "SMA" ? ta.sma(close, slowLength) : ta.ema(close, slowLength)

// Entry conditions
longCondition = ta.crossover(fastMA, slowMA)
shortCondition = ta.crossunder(fastMA, slowMA)

// Execute trades
if (longCondition)
    strategy.entry("Long", strategy.long)
if (shortCondition)
    strategy.entry("Short", strategy.short)

// Plot MAs
plot(fastMA, "Fast MA", color=color.blue, linewidth=2)
plot(slowMA, "Slow MA", color=color.red, linewidth=2)

// Background color for trend
bgcolor(fastMA > slowMA ? color.new(color.green, 90) : color.new(color.red, 90))`
  },
  {
    id: 'rsi_strategy',
    name: 'RSI Overbought/Oversold',
    description: 'Mean reversion strategy based on RSI levels',
    category: 'oscillator',
    code: `//@version=5
strategy("RSI Strategy", overlay=true, initial_capital=10000, default_qty_type=strategy.percent_of_equity, default_qty_value=100)

// Inputs
rsiLength = input.int(14, "RSI Length", minval=1)
overbought = input.int(70, "Overbought Level", minval=50, maxval=100)
oversold = input.int(30, "Oversold Level", minval=0, maxval=50)

// Calculate RSI
rsi = ta.rsi(close, rsiLength)

// Entry conditions
longCondition = ta.crossover(rsi, oversold)
shortCondition = ta.crossunder(rsi, overbought)

// Execute trades
if (longCondition)
    strategy.entry("Long", strategy.long)
if (shortCondition)
    strategy.entry("Short", strategy.short)

// Exit conditions
if (ta.crossunder(rsi, 50) and strategy.position_size > 0)
    strategy.close("Long")
if (ta.crossover(rsi, 50) and strategy.position_size < 0)
    strategy.close("Short")

// Plot RSI on separate pane
// plot(rsi, "RSI", color=color.purple)`
  },
  {
    id: 'bollinger_breakout',
    name: 'Bollinger Band Breakout',
    description: 'Volatility breakout using Bollinger Bands',
    category: 'volatility',
    code: `//@version=5
strategy("Bollinger Breakout", overlay=true, initial_capital=10000, default_qty_type=strategy.percent_of_equity, default_qty_value=100)

// Inputs
length = input.int(20, "BB Length", minval=1)
mult = input.float(2.0, "BB Multiplier", minval=0.1, step=0.1)

// Calculate Bollinger Bands
basis = ta.sma(close, length)
dev = mult * ta.stdev(close, length)
upper = basis + dev
lower = basis - dev

// Entry conditions
longCondition = ta.crossover(close, upper)
shortCondition = ta.crossunder(close, lower)

// Execute trades
if (longCondition)
    strategy.entry("Long", strategy.long)
if (shortCondition)
    strategy.entry("Short", strategy.short)

// Exit at basis
if (ta.crossunder(close, basis) and strategy.position_size > 0)
    strategy.close("Long")
if (ta.crossover(close, basis) and strategy.position_size < 0)
    strategy.close("Short")

// Plot Bollinger Bands
plot(basis, "Basis", color=color.orange)
plot(upper, "Upper", color=color.blue)
plot(lower, "Lower", color=color.blue)
fill(plot(upper), plot(lower), color=color.new(color.blue, 90))`
  },
  {
    id: 'macd_strategy',
    name: 'MACD Signal Cross',
    description: 'Trade MACD and signal line crossovers',
    category: 'trend',
    code: `//@version=5
strategy("MACD Strategy", overlay=false, initial_capital=10000, default_qty_type=strategy.percent_of_equity, default_qty_value=100)

// Inputs
fastLength = input.int(12, "Fast Length")
slowLength = input.int(26, "Slow Length")
signalLength = input.int(9, "Signal Length")

// Calculate MACD
[macdLine, signalLine, histLine] = ta.macd(close, fastLength, slowLength, signalLength)

// Entry conditions
longCondition = ta.crossover(macdLine, signalLine) and macdLine < 0
shortCondition = ta.crossunder(macdLine, signalLine) and macdLine > 0

// Execute trades
if (longCondition)
    strategy.entry("Long", strategy.long)
if (shortCondition)
    strategy.entry("Short", strategy.short)

// Plot MACD
plot(macdLine, "MACD", color=color.blue, linewidth=2)
plot(signalLine, "Signal", color=color.orange, linewidth=2)
plot(histLine, "Histogram", style=plot.style_histogram, color=histLine >= 0 ? color.green : color.red)`
  },
  {
    id: 'supertrend',
    name: 'SuperTrend Strategy',
    description: 'Trend following with SuperTrend indicator',
    category: 'trend',
    code: `//@version=5
strategy("SuperTrend Strategy", overlay=true, initial_capital=10000, default_qty_type=strategy.percent_of_equity, default_qty_value=100)

// Inputs
atrPeriod = input.int(10, "ATR Period")
factor = input.float(3.0, "Factor", step=0.1)

// Calculate SuperTrend
[supertrend, direction] = ta.supertrend(factor, atrPeriod)

// Entry conditions
longCondition = ta.crossunder(direction, 0)
shortCondition = ta.crossover(direction, 0)

// Execute trades
if (longCondition)
    strategy.entry("Long", strategy.long)
if (shortCondition)
    strategy.entry("Short", strategy.short)

// Plot SuperTrend
plot(supertrend, "SuperTrend", color=direction < 0 ? color.green : color.red, linewidth=2)

// Background
bgcolor(direction < 0 ? color.new(color.green, 95) : color.new(color.red, 95))`
  },
  {
    id: 'dual_thrust',
    name: 'Dual Thrust Breakout',
    description: 'Range breakout with dynamic levels',
    category: 'breakout',
    code: `//@version=5
strategy("Dual Thrust", overlay=true, initial_capital=10000, default_qty_type=strategy.percent_of_equity, default_qty_value=100)

// Inputs
lookback = input.int(4, "Lookback Period")
k1 = input.float(0.5, "Upper Multiplier", step=0.1)
k2 = input.float(0.5, "Lower Multiplier", step=0.1)

// Calculate range
hh = ta.highest(high, lookback)
hc = ta.highest(close, lookback)
lc = ta.lowest(close, lookback)
ll = ta.lowest(low, lookback)
range1 = hh - lc
range2 = hc - ll
maxRange = math.max(range1, range2)

// Calculate levels
upperBand = open + k1 * maxRange
lowerBand = open - k2 * maxRange

// Entry conditions
longCondition = close > upperBand
shortCondition = close < lowerBand

// Execute trades
if (longCondition)
    strategy.entry("Long", strategy.long)
if (shortCondition)
    strategy.entry("Short", strategy.short)

// Plot levels
plot(upperBand, "Upper Band", color=color.green)
plot(lowerBand, "Lower Band", color=color.red)`
  }
];

export const PineScriptBuilder = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<StrategyTemplate | null>(null);
  const [customCode, setCustomCode] = useState('');
  const [strategyName, setStrategyName] = useState('My Strategy');
  const [initialCapital, setInitialCapital] = useState(10000);
  const [useStopLoss, setUseStopLoss] = useState(true);
  const [stopLossPercent, setStopLossPercent] = useState(2);
  const [useTakeProfit, setUseTakeProfit] = useState(true);
  const [takeProfitPercent, setTakeProfitPercent] = useState(4);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Pine Script copied to clipboard');
  };

  const downloadScript = (code: string, name: string) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/\s+/g, '_')}.pine`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Pine Script downloaded');
  };

  const openInTradingView = () => {
    window.open('https://www.tradingview.com/pine-script-docs/', '_blank');
  };

  const generateCustomStrategy = () => {
    let code = `//@version=5
strategy("${strategyName}", overlay=true, initial_capital=${initialCapital}, default_qty_type=strategy.percent_of_equity, default_qty_value=100)

// === INPUTS ===
fastLength = input.int(9, "Fast MA Length")
slowLength = input.int(21, "Slow MA Length")
${useStopLoss ? `stopLossPercent = input.float(${stopLossPercent}, "Stop Loss %")` : ''}
${useTakeProfit ? `takeProfitPercent = input.float(${takeProfitPercent}, "Take Profit %")` : ''}

// === CALCULATIONS ===
fastMA = ta.ema(close, fastLength)
slowMA = ta.ema(close, slowLength)

// === ENTRY CONDITIONS ===
longCondition = ta.crossover(fastMA, slowMA)
shortCondition = ta.crossunder(fastMA, slowMA)

// === TRADE EXECUTION ===
if (longCondition)
    strategy.entry("Long", strategy.long)
if (shortCondition)
    strategy.entry("Short", strategy.short)

${useStopLoss || useTakeProfit ? `// === RISK MANAGEMENT ===
${useStopLoss ? `stopLoss = strategy.position_avg_price * (1 - stopLossPercent / 100)` : ''}
${useTakeProfit ? `takeProfit = strategy.position_avg_price * (1 + takeProfitPercent / 100)` : ''}

if (strategy.position_size > 0)
    strategy.exit("Exit Long", "Long"${useStopLoss ? ', stop=stopLoss' : ''}${useTakeProfit ? ', limit=takeProfit' : ''})
if (strategy.position_size < 0)
    strategy.exit("Exit Short", "Short"${useStopLoss ? ', stop=strategy.position_avg_price * (1 + stopLossPercent / 100)' : ''}${useTakeProfit ? ', limit=strategy.position_avg_price * (1 - takeProfitPercent / 100)' : ''})` : ''}

// === VISUALIZATION ===
plot(fastMA, "Fast MA", color=color.blue, linewidth=2)
plot(slowMA, "Slow MA", color=color.red, linewidth=2)
bgcolor(fastMA > slowMA ? color.new(color.green, 95) : color.new(color.red, 95))`;

    setCustomCode(code);
    toast.success('Strategy generated!');
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="templates">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">
            <Layers className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="builder">
            <Wand2 className="h-4 w-4 mr-2" />
            Builder
          </TabsTrigger>
          <TabsTrigger value="editor">
            <Code className="h-4 w-4 mr-2" />
            Editor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategyTemplates.map(template => (
              <Card 
                key={template.id}
                className={`cursor-pointer transition-all hover:border-primary ${
                  selectedTemplate?.id === template.id ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          {selectedTemplate && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedTemplate.name}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(selectedTemplate.code)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => downloadScript(selectedTemplate.code, selectedTemplate.name)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{selectedTemplate.code}</code>
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="builder" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Strategy Configuration
              </CardTitle>
              <CardDescription>Configure your strategy parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Strategy Name</Label>
                    <Input 
                      value={strategyName}
                      onChange={(e) => setStrategyName(e.target.value)}
                      placeholder="My Strategy"
                    />
                  </div>
                  <div>
                    <Label>Initial Capital ($)</Label>
                    <Input 
                      type="number"
                      value={initialCapital}
                      onChange={(e) => setInitialCapital(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Stop Loss</Label>
                      <p className="text-sm text-muted-foreground">Auto exit on loss</p>
                    </div>
                    <Switch checked={useStopLoss} onCheckedChange={setUseStopLoss} />
                  </div>
                  {useStopLoss && (
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number"
                        value={stopLossPercent}
                        onChange={(e) => setStopLossPercent(Number(e.target.value))}
                        className="w-24"
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Take Profit</Label>
                      <p className="text-sm text-muted-foreground">Auto exit on profit</p>
                    </div>
                    <Switch checked={useTakeProfit} onCheckedChange={setUseTakeProfit} />
                  </div>
                  {useTakeProfit && (
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number"
                        value={takeProfitPercent}
                        onChange={(e) => setTakeProfitPercent(Number(e.target.value))}
                        className="w-24"
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  )}
                </div>
              </div>

              <Button onClick={generateCustomStrategy} className="w-full">
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Pine Script
              </Button>
            </CardContent>
          </Card>

          {customCode && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Generated Strategy</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(customCode)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => downloadScript(customCode, strategyName)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm max-h-[400px]">
                  <code>{customCode}</code>
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="editor" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Pine Script Editor
                  </CardTitle>
                  <CardDescription>Write or paste your custom Pine Script</CardDescription>
                </div>
                <Button variant="outline" onClick={openInTradingView}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Pine Script Docs
                  <ExternalLink className="h-3 w-3 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                placeholder={`//@version=5
strategy("My Strategy", overlay=true)

// Your Pine Script code here...`}
                className="font-mono min-h-[400px]"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => copyToClipboard(customCode)} disabled={!customCode}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </Button>
                <Button variant="outline" onClick={() => downloadScript(customCode, 'custom_strategy')} disabled={!customCode}>
                  <Download className="h-4 w-4 mr-2" />
                  Download .pine
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-600 dark:text-amber-400">How to Use in TradingView</p>
                  <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                    <li>Copy the Pine Script code</li>
                    <li>Open TradingView chart</li>
                    <li>Click "Pine Editor" at the bottom</li>
                    <li>Paste your code and click "Add to Chart"</li>
                    <li>View results in the "Strategy Tester" tab</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
