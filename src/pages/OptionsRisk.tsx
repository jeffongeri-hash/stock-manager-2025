import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';
import { useStockData } from '@/hooks/useStockData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Position {
  id: string;
  ticker: string;
  type: string;
  strike: number;
  expiration: string;
  stockPrice: number;
  expectedMove: number;
  probITM: number;
  riskFlag: string;
}

export default function OptionsRisk() {
  const [portfolio, setPortfolio] = useState<Position[]>([]);
  const [ticker, setTicker] = useState('AAPL');
  const [type, setType] = useState('call');
  const [strike, setStrike] = useState('');
  const [expiration, setExpiration] = useState('');
  const [volatility, setVolatility] = useState('0.25');

  const { stocks } = useStockData([ticker]);
  const stockPrice = stocks[0]?.price || 0;

  const daysToExpiration = (expirationDate: string) => {
    const today = new Date();
    const exp = new Date(expirationDate);
    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 0);
  };

  const addPosition = async () => {
    if (!ticker || !type || !strike || !expiration || !stockPrice) {
      toast.error('Please fill in all fields');
      return;
    }

    const days = daysToExpiration(expiration);
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-options-data', {
        body: {
          symbol: ticker,
          stockPrice,
          strikePrice: parseFloat(strike),
          daysToExpiry: days,
          volatility: parseFloat(volatility),
          optionType: type
        }
      });

      if (error) throw error;

      // Calculate probability ITM based on delta
      const probITM = Math.abs(data.greeks.delta);
      
      // Determine risk flag
      let riskFlag = 'Neutral';
      if (type === 'call' && stockPrice < parseFloat(strike) && probITM < 0.3) {
        riskFlag = 'Safe';
      } else if (type === 'put' && stockPrice > parseFloat(strike) && probITM < 0.3) {
        riskFlag = 'Safe';
      } else if (probITM > 0.7) {
        riskFlag = 'Risky';
      }

      const position: Position = {
        id: Date.now().toString(),
        ticker: ticker.toUpperCase(),
        type,
        strike: parseFloat(strike),
        expiration,
        stockPrice,
        expectedMove: data.expectedMove.amount,
        probITM: probITM * 100,
        riskFlag
      };

      setPortfolio([...portfolio, position]);
      toast.success('Position added successfully');
      
      // Reset form
      setStrike('');
      setExpiration('');
    } catch (err) {
      console.error('Error adding position:', err);
      toast.error('Failed to add position');
    }
  };

  const removePosition = (id: string) => {
    setPortfolio(portfolio.filter(p => p.id !== id));
    toast.success('Position removed');
  };

  const getRiskColor = (flag: string) => {
    switch (flag) {
      case 'Safe':
        return 'bg-green-500/10 text-green-500 border-green-500/50';
      case 'Risky':
        return 'bg-red-500/10 text-red-500 border-red-500/50';
      default:
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50';
    }
  };

  const totalRisk = portfolio.filter(p => p.riskFlag === 'Risky').length;
  const totalSafe = portfolio.filter(p => p.riskFlag === 'Safe').length;
  const avgProbITM = portfolio.length > 0 
    ? portfolio.reduce((sum, p) => sum + p.probITM, 0) / portfolio.length 
    : 0;

  useEffect(() => {
    if (stockPrice && !strike) {
      setStrike(stockPrice.toString());
    }
  }, [stockPrice]);

  return (
    <PageLayout title="Options Risk Tracker">
      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{portfolio.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Safe Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-500">{totalSafe}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Risky Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-500">{totalRisk}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add New Position</CardTitle>
            <CardDescription>Track risk for your options positions with live data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <Label>Ticker</Label>
                <Input
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="AAPL"
                />
                {stockPrice > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ${stockPrice.toFixed(2)}
                  </p>
                )}
              </div>

              <div>
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="put">Put</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Strike</Label>
                <Input
                  type="number"
                  value={strike}
                  onChange={(e) => setStrike(e.target.value)}
                  placeholder="150"
                />
              </div>

              <div>
                <Label>Expiration</Label>
                <Input
                  type="date"
                  value={expiration}
                  onChange={(e) => setExpiration(e.target.value)}
                />
              </div>

              <div>
                <Label>IV</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={volatility}
                  onChange={(e) => setVolatility(e.target.value)}
                  placeholder="0.25"
                />
              </div>

              <div className="flex items-end">
                <Button onClick={addPosition} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {portfolio.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Risk Analysis</CardTitle>
              <CardDescription>
                Average Probability ITM: {avgProbITM.toFixed(1)}%
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticker</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Strike</TableHead>
                    <TableHead>Stock Price</TableHead>
                    <TableHead>Expected Move</TableHead>
                    <TableHead>Prob ITM</TableHead>
                    <TableHead>DTE</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolio.map((position) => (
                    <TableRow key={position.id}>
                      <TableCell className="font-medium">{position.ticker}</TableCell>
                      <TableCell>
                        <Badge variant={position.type === 'call' ? 'default' : 'secondary'}>
                          {position.type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>${position.strike}</TableCell>
                      <TableCell>${position.stockPrice.toFixed(2)}</TableCell>
                      <TableCell>±${position.expectedMove.toFixed(2)}</TableCell>
                      <TableCell>{position.probITM.toFixed(1)}%</TableCell>
                      <TableCell>{daysToExpiration(position.expiration)}d</TableCell>
                      <TableCell>
                        <Badge className={getRiskColor(position.riskFlag)}>
                          {position.riskFlag}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePosition(position.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold mb-2">Risk Indicators:</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• <span className="text-green-500 font-medium">Safe:</span> Low probability of ending in-the-money, good for premium sellers</li>
                  <li>• <span className="text-yellow-500 font-medium">Neutral:</span> Moderate risk, watch closely</li>
                  <li>• <span className="text-red-500 font-medium">Risky:</span> High probability ITM, potential for loss if short</li>
                  <li>• Expected Move shows one standard deviation (68% probability range)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
