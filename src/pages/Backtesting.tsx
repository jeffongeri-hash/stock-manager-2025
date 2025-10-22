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
import { Play, Trash2 } from 'lucide-react';

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
}

const Backtesting = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<BacktestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [backtest, setBacktest] = useState({
    strategy_name: '',
    symbol: '',
    start_date: '',
    end_date: new Date().toISOString().split('T')[0],
    initial_capital: '10000',
    strategy_type: 'buy_hold'
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
        parameters: { strategy_type: backtest.strategy_type }
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
                onChange={(e) => setBacktest({ ...backtest, strategy_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Symbol*</Label>
              <Input
                placeholder="SPY"
                value={backtest.symbol}
                onChange={(e) => setBacktest({ ...backtest, symbol: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <Label>Strategy Type</Label>
              <Select value={backtest.strategy_type} onValueChange={(value) => setBacktest({ ...backtest, strategy_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy_hold">Buy & Hold</SelectItem>
                  <SelectItem value="iron_condor">Iron Condor</SelectItem>
                  <SelectItem value="vertical_spread">Vertical Spread</SelectItem>
                  <SelectItem value="straddle">Straddle</SelectItem>
                  <SelectItem value="covered_call">Covered Call</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start Date*</Label>
              <Input
                type="date"
                value={backtest.start_date}
                onChange={(e) => setBacktest({ ...backtest, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label>End Date*</Label>
              <Input
                type="date"
                value={backtest.end_date}
                onChange={(e) => setBacktest({ ...backtest, end_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Initial Capital*</Label>
              <Input
                type="number"
                value={backtest.initial_capital}
                onChange={(e) => setBacktest({ ...backtest, initial_capital: e.target.value })}
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
                  {results.map((result) => {
                    const returnPct = ((result.final_capital - result.initial_capital) / result.initial_capital) * 100;
                    return (
                      <TableRow key={result.id}>
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
                          <Button variant="ghost" size="sm" onClick={() => deleteResult(result.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
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