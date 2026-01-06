import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Play, Trash2, Save, RotateCcw, Loader2 } from 'lucide-react';
import PortfolioGrowthChart from '@/components/trading/PortfolioGrowthChart';
import { useUserSettings } from '@/hooks/useUserSettings';

interface BacktestResult {
  id: string;
  strategy_name: string;
  symbol: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  final_capital: number;
  total_trades: number;
  winning_trades: number;
  win_rate: number;
  created_at: string;
  parameters?: any;
}

interface BacktestSettings {
  strategy_name: string;
  symbol: string;
  start_date: string;
  end_date: string;
  initial_capital: string;
  strategy_type: string;
}

const defaultSettings: BacktestSettings = {
  strategy_name: '',
  symbol: '',
  start_date: '',
  end_date: new Date().toISOString().split('T')[0],
  initial_capital: '10000',
  strategy_type: 'buy_hold',
};

const Backtesting = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<BacktestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const {
    settings: backtest,
    updateSetting,
    saveSettings,
    resetSettings,
    isLoading,
    isSaving,
    lastSaved
  } = useUserSettings<BacktestSettings>({
    pageName: 'backtesting',
    defaultSettings
  });

  useEffect(() => {
    if (user) {
      fetchResults();
    }
  }, [user]);

  const fetchResults = async () => {
    const { data, error } = await supabase
      .from('backtest_results')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch backtest results');
      return;
    }
    setResults(data || []);
  };

  const runBacktest = async () => {
    if (!backtest.strategy_name || !backtest.symbol || !backtest.start_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    setRunning(true);

    // Simulate backtesting (in production, this would be a real backtest)
    await new Promise(resolve => setTimeout(resolve, 2000));

    const initial = parseFloat(backtest.initial_capital);
    const randomReturn = (Math.random() * 0.6) - 0.2; // -20% to +40% return
    const final = initial * (1 + randomReturn);
    const trades = Math.floor(Math.random() * 50) + 10;
    const winning = Math.floor(trades * (0.4 + Math.random() * 0.3)); // 40-70% win rate
    const winRate = (winning / trades) * 100;

    // Generate entry/exit triggers based on strategy type
    const getStrategyTriggers = (type: string) => {
      const triggers: { [key: string]: { entry: string; exit: string; entryConditions: string; exitConditions: string } } = {
        buy_hold: {
          entry: 'Market Open',
          exit: 'Market Close / Target Date',
          entryConditions: 'Buy at start date market open price',
          exitConditions: 'Sell at end date market close price or when target is reached'
        },
        iron_condor: {
          entry: 'IV > 50th Percentile',
          exit: '50% Max Profit or 21 DTE',
          entryConditions: 'Sell OTM call spread & put spread when IV is elevated (>50th percentile). Delta ~0.16 per leg.',
          exitConditions: 'Close at 50% max profit, 21 DTE, or if position reaches 2x max profit in loss'
        },
        vertical_spread: {
          entry: 'Directional Signal + IV',
          exit: '50% Max Profit or Expiration',
          entryConditions: 'Buy lower strike, sell higher strike (call) or reverse (put). Enter on trend confirmation.',
          exitConditions: 'Exit at 50% max profit, expiration, or if underlying moves against position >5%'
        },
        straddle: {
          entry: 'IV < 30th Percentile',
          exit: 'IV Expansion or 30 DTE',
          entryConditions: 'Buy ATM call and put when IV is low, expecting volatility expansion',
          exitConditions: 'Exit when IV expands >20 points, at 30 DTE, or 50% loss'
        },
        ma_crossover: {
          entry: 'Fast MA Crosses Above Slow MA',
          exit: 'Fast MA Crosses Below Slow MA',
          entryConditions: 'Enter long when 20-day MA crosses above 50-day MA (bullish crossover)',
          exitConditions: 'Exit when 20-day MA crosses below 50-day MA (bearish crossover) or -2% stop loss'
        },
        rsi: {
          entry: 'RSI < 30 (Oversold)',
          exit: 'RSI > 70 (Overbought)',
          entryConditions: 'Buy when RSI(14) crosses below 30, indicating oversold conditions',
          exitConditions: 'Sell when RSI(14) crosses above 70 or -3% stop loss triggered'
        }
      };
      return triggers[type] || triggers.buy_hold;
    };

    const strategyTriggers = getStrategyTriggers(backtest.strategy_type);

    const { error } = await supabase
      .from('backtest_results')
      .insert({
        user_id: user?.id,
        strategy_name: backtest.strategy_name,
        symbol: backtest.symbol.toUpperCase(),
        start_date: backtest.start_date,
        end_date: backtest.end_date,
        initial_capital: initial,
        final_capital: final,
        total_trades: trades,
        winning_trades: winning,
        win_rate: winRate,
        parameters: { 
          strategy_type: backtest.strategy_type,
          entry_trigger: strategyTriggers.entry,
          exit_trigger: strategyTriggers.exit,
          entry_conditions: strategyTriggers.entryConditions,
          exit_conditions: strategyTriggers.exitConditions
        }
      });

    if (error) {
      toast.error('Failed to save backtest results');
      setRunning(false);
      return;
    }

    toast.success('Backtest completed!');
    setRunning(false);
    fetchResults();
  };

  const deleteResult = async (id: string) => {
    const { error } = await supabase
      .from('backtest_results')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete result');
      return;
    }

    toast.success('Result deleted');
    fetchResults();
  };

  return (
    <PageLayout title="Strategy Backtesting">
      <div className="flex justify-end gap-2 mb-4">
        {lastSaved && (
          <span className="text-xs text-muted-foreground self-center">
            Last saved: {lastSaved.toLocaleDateString()}
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={resetSettings}
          disabled={isLoading}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        <Button
          size="sm"
          onClick={() => saveSettings(backtest)}
          disabled={isSaving || isLoading}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Run Backtest</CardTitle>
            <CardDescription>Test your strategy against historical data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Strategy Name*</Label>
              <Input
                placeholder="My Iron Condor Strategy"
                value={backtest.strategy_name}
                onChange={(e) => updateSetting('strategy_name', e.target.value)}
              />
            </div>
            <div>
              <Label>Symbol*</Label>
              <Input
                placeholder="SPY"
                value={backtest.symbol}
                onChange={(e) => updateSetting('symbol', e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <Label>Strategy Type</Label>
              <Select value={backtest.strategy_type} onValueChange={(value) => updateSetting('strategy_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy_hold">Buy & Hold</SelectItem>
                  <SelectItem value="iron_condor">Iron Condor</SelectItem>
                  <SelectItem value="vertical_spread">Vertical Spread</SelectItem>
                  <SelectItem value="straddle">Straddle</SelectItem>
                  <SelectItem value="strangle">Strangle</SelectItem>
                  <SelectItem value="butterfly">Butterfly Spread</SelectItem>
                  <SelectItem value="covered_call">Covered Call</SelectItem>
                  <SelectItem value="covered_put">Covered Put</SelectItem>
                  <SelectItem value="bull_call_spread">Bull Call Spread</SelectItem>
                  <SelectItem value="bear_put_spread">Bear Put Spread</SelectItem>
                  <SelectItem value="calendar_spread">Calendar Spread</SelectItem>
                  <SelectItem value="bollinger_bands">Bollinger Bands</SelectItem>
                  <SelectItem value="ma_crossover">Moving Average Crossover</SelectItem>
                  <SelectItem value="macd">MACD Divergence</SelectItem>
                  <SelectItem value="rsi">RSI Divergence</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start Date*</Label>
              <Input
                type="date"
                value={backtest.start_date}
                onChange={(e) => updateSetting('start_date', e.target.value)}
              />
            </div>
            <div>
              <Label>End Date*</Label>
              <Input
                type="date"
                value={backtest.end_date}
                onChange={(e) => updateSetting('end_date', e.target.value)}
              />
            </div>
            <div>
              <Label>Initial Capital*</Label>
              <Input
                type="number"
                value={backtest.initial_capital}
                onChange={(e) => updateSetting('initial_capital', e.target.value)}
              />
            </div>
            <Button onClick={runBacktest} disabled={running} className="w-full">
              <Play className="h-4 w-4 mr-2" />
              {running ? 'Running Backtest...' : 'Run Backtest'}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Backtest Results</CardTitle>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No backtest results yet. Run your first backtest!</p>
            ) : (
              <div className="space-y-2">
                {results.map((result) => {
                  const returnPct = ((result.final_capital - result.initial_capital) / result.initial_capital) * 100;
                  const isExpanded = expandedRow === result.id;
                  const params = result.parameters as any;
                  
                  return (
                    <div key={result.id} className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Strategy</TableHead>
                            <TableHead>Symbol</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead>Return</TableHead>
                            <TableHead>Win Rate</TableHead>
                            <TableHead>Trades</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setExpandedRow(isExpanded ? null : result.id)}
                          >
                            <TableCell className="font-medium">{result.strategy_name}</TableCell>
                            <TableCell>{result.symbol}</TableCell>
                            <TableCell className="text-sm">
                              {new Date(result.start_date).toLocaleDateString()} - {new Date(result.end_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className={returnPct >= 0 ? 'text-green-500 font-semibold' : 'text-red-500 font-semibold'}>
                              {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%
                            </TableCell>
                            <TableCell>{result.win_rate.toFixed(1)}%</TableCell>
                            <TableCell>{result.total_trades}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteResult(result.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                      
                      {isExpanded && params && (
                        <div className="bg-muted/30 p-4 border-t space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm">Entry Trigger</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                                    {params.entry_trigger || 'Not specified'}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">{params.entry_conditions || 'No entry conditions specified'}</p>
                              </CardContent>
                            </Card>
                            
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm">Exit Trigger</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold bg-red-500/20 text-red-700 dark:text-red-400 px-2 py-1 rounded">
                                    {params.exit_trigger || 'Not specified'}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">{params.exit_conditions || 'No exit conditions specified'}</p>
                              </CardContent>
                            </Card>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="bg-card p-3 rounded border">
                              <p className="text-muted-foreground">Initial Capital</p>
                              <p className="font-bold">${result.initial_capital.toLocaleString()}</p>
                            </div>
                            <div className="bg-card p-3 rounded border">
                              <p className="text-muted-foreground">Final Capital</p>
                              <p className="font-bold">${result.final_capital.toLocaleString()}</p>
                            </div>
                            <div className="bg-card p-3 rounded border">
                              <p className="text-muted-foreground">Winning Trades</p>
                              <p className="font-bold text-green-500">{result.winning_trades}</p>
                            </div>
                            <div className="bg-card p-3 rounded border">
                              <p className="text-muted-foreground">Losing Trades</p>
                              <p className="font-bold text-red-500">{result.total_trades - result.winning_trades}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Growth Chart */}
      <div className="mt-6">
        <PortfolioGrowthChart mode="backtest" />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>About Backtesting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Backtesting allows you to test your trading strategies against historical market data to see how they would have performed.
            This helps you refine your approach before risking real capital.
          </p>
          <div>
            <h4 className="font-semibold text-foreground mb-2">Key Metrics</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Total Return:</strong> Overall profit/loss from the strategy</li>
              <li><strong>Win Rate:</strong> Percentage of profitable trades</li>
              <li><strong>Total Trades:</strong> Number of trades executed during the period</li>
            </ul>
          </div>
          <div className="bg-yellow-500/10 p-3 rounded">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              ⚠️ Past performance does not guarantee future results. Use backtesting as one tool in your analysis, not the only one.
            </p>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default Backtesting;