import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Plus, FolderKanban, Scale, Search, Layers, Shield, BookOpen, Calculator, DollarSign } from 'lucide-react';
import { useStockData } from '@/hooks/useStockData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/stocksApi';
import { ITMOptionCalculator } from '@/components/trading/ITMOptionCalculator';
import { CoveredCallScreener } from '@/components/options/CoveredCallScreener';
import { OptionsChainViewer } from '@/components/options/OptionsChainViewer';
import { IronCondorBuilder } from '@/components/options/IronCondorBuilder';
import { OptionsStrategyBuilder } from '@/components/options/OptionsStrategyBuilder';
import { CoveredCallAnalyzer } from '@/components/options/CoveredCallAnalyzer';
import { PoorMansCalculator } from '@/components/options/PoorMansCalulator';
import { Link } from 'react-router-dom';

interface Trade {
  id: string;
  ticker: string;
  type: string;
  strike: number;
  expiration: string;
  currentPrice: number;
  iv: number;
  entryPrice: number;
  buySell: string;
  contracts: number;
  riskFlag?: string;
  expectedMove?: number;
  probITM?: number;
}

export default function OptionsToolkit() {
  const [portfolio, setPortfolio] = useState<Trade[]>([]);
  const [ticker, setTicker] = useState('AAPL');
  const [type, setType] = useState('call');
  const [strike, setStrike] = useState('');
  const [expiration, setExpiration] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [buySell, setBuySell] = useState('buy');
  const [contracts, setContracts] = useState('');

  const { stocks } = useStockData([ticker]);
  const currentPrice = stocks[0]?.price || 0;
  const stockIV = 25;

  useEffect(() => {
    if (currentPrice && !strike) {
      setStrike(currentPrice.toString());
    }
  }, [currentPrice]);

  const erf = (x: number): number => {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
  };

  const daysToExpiration = (expirationDate: string) => {
    const today = new Date();
    const exp = new Date(expirationDate);
    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 0);
  };

  const addTrade = async () => {
    if (!ticker || !type || !strike || !expiration || !currentPrice || !entryPrice || !buySell || !contracts) {
      toast.error('Please fill in all fields');
      return;
    }
    const days = daysToExpiration(expiration);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-options-data', {
        body: { symbol: ticker, stockPrice: currentPrice, strikePrice: parseFloat(strike), daysToExpiry: days, volatility: stockIV / 100, optionType: type }
      });
      if (error) throw error;
      const probITM = Math.abs(data.greeks.delta);
      let riskFlag = 'Neutral';
      if (type === 'call' && currentPrice < parseFloat(strike) && probITM < 0.3) riskFlag = 'Safe';
      else if (type === 'put' && currentPrice > parseFloat(strike) && probITM < 0.3) riskFlag = 'Safe';
      else if (probITM > 0.7) riskFlag = 'Risky';
      const trade: Trade = { id: Date.now().toString(), ticker: ticker.toUpperCase(), type, strike: parseFloat(strike), expiration, currentPrice, iv: stockIV, entryPrice: parseFloat(entryPrice), buySell, contracts: parseInt(contracts), expectedMove: data.expectedMove.amount, probITM: probITM * 100, riskFlag };
      setPortfolio([...portfolio, trade]);
      toast.success('Position added successfully');
      setStrike(''); setExpiration(''); setEntryPrice(''); setContracts('');
    } catch (err) {
      console.error('Error adding trade:', err);
      toast.error('Failed to add position');
    }
  };

  const removePosition = (id: string) => { setPortfolio(portfolio.filter(p => p.id !== id)); toast.success('Position removed'); };
  const clearPortfolio = () => { setPortfolio([]); };
  const getRiskColor = (flag: string) => {
    switch (flag) {
      case 'Safe': return 'bg-green-500/10 text-green-500 border-green-500/50';
      case 'Risky': return 'bg-red-500/10 text-red-500 border-red-500/50';
      default: return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50';
    }
  };

  const totalPL = portfolio.reduce((sum, trade) => {
    const multiplier = 100 * trade.contracts;
    let pl = trade.buySell.toLowerCase() === 'buy' ? (trade.currentPrice - trade.entryPrice) * multiplier : (trade.entryPrice - trade.currentPrice) * multiplier;
    return sum + pl;
  }, 0);
  const totalRisk = portfolio.filter(p => p.riskFlag === 'Risky').length;
  const totalSafe = portfolio.filter(p => p.riskFlag === 'Safe').length;

  return (
    <PageLayout title="Options Toolkit">
      <div className="mb-4">
        <Link to="/options-guide">
          <Button variant="outline" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Options Strategy Guide (LEAPS, Covered Calls, 0DTE)
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="portfolio" className="space-y-6">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="portfolio" className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4" />
            Portfolio
          </TabsTrigger>
          <TabsTrigger value="itm-calculator" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            ITM vs Stock
          </TabsTrigger>
          <TabsTrigger value="covered-calls" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            CC Screener
          </TabsTrigger>
          <TabsTrigger value="chain" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Options Chain
          </TabsTrigger>
          <TabsTrigger value="iron-condor" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Iron Condor
          </TabsTrigger>
          <TabsTrigger value="strategy-builder" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Strategy Builder
          </TabsTrigger>
          <TabsTrigger value="cc-analyzer" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            CC Analyzer
          </TabsTrigger>
          <TabsTrigger value="pmcc" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            PMCC
          </TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total P&L</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-3xl font-bold ${totalPL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(totalPL)}
                  </p>
                </CardContent>
              </Card>

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
            <CardDescription>Track your options positions with live P&L, risk analysis, and probability calculations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <Label>Ticker</Label>
                <Input
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="AAPL"
                />
                {currentPrice > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ${currentPrice.toFixed(2)} | IV: {stockIV}%
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
                <Label>Entry Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  placeholder="3.50"
                />
              </div>

              <div>
                <Label>Buy/Sell</Label>
                <Select value={buySell} onValueChange={setBuySell}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Contracts</Label>
                <Input
                  type="number"
                  value={contracts}
                  onChange={(e) => setContracts(e.target.value)}
                  placeholder="1"
                  min="1"
                />
              </div>

              <div className="flex items-end">
                <Button onClick={addTrade} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Position
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={clearPortfolio} variant="outline">Clear All</Button>
            </div>
          </CardContent>
        </Card>

        {portfolio.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Positions</CardTitle>
              <CardDescription>
                Real-time P&L tracking with risk analysis and probability metrics
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
                    <TableHead>P&L</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolio.map((trade) => {
                    const daysToExp = daysToExpiration(trade.expiration);
                    const multiplier = 100 * trade.contracts;
                    let pl;
                    if (trade.buySell.toLowerCase() === 'buy') {
                      pl = (trade.currentPrice - trade.entryPrice) * multiplier;
                    } else {
                      pl = (trade.entryPrice - trade.currentPrice) * multiplier;
                    }

                    return (
                      <TableRow key={trade.id}>
                        <TableCell className="font-medium">{trade.ticker}</TableCell>
                        <TableCell>
                          <Badge variant={trade.type === 'call' ? 'default' : 'secondary'}>
                            {trade.type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>${trade.strike}</TableCell>
                        <TableCell>${trade.currentPrice.toFixed(2)}</TableCell>
                        <TableCell>±${trade.expectedMove?.toFixed(2)}</TableCell>
                        <TableCell>{trade.probITM?.toFixed(1)}%</TableCell>
                        <TableCell>{daysToExp}d</TableCell>
                        <TableCell className={pl >= 0 ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                          {formatCurrency(pl)}
                        </TableCell>
                        <TableCell className="uppercase">{trade.buySell} {trade.contracts}</TableCell>
                        <TableCell>
                          <Badge className={getRiskColor(trade.riskFlag || 'Neutral')}>
                            {trade.riskFlag}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePosition(trade.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
        </TabsContent>

        <TabsContent value="itm-calculator">
          <ITMOptionCalculator />
        </TabsContent>

        <TabsContent value="covered-calls">
          <CoveredCallScreener />
        </TabsContent>

        <TabsContent value="chain">
          <OptionsChainViewer />
        </TabsContent>

        <TabsContent value="iron-condor">
          <IronCondorBuilder />
        </TabsContent>

        <TabsContent value="strategy-builder">
          <OptionsStrategyBuilder />
        </TabsContent>

        <TabsContent value="cc-analyzer">
          <CoveredCallAnalyzer />
        </TabsContent>

        <TabsContent value="pmcc">
          <PoorMansCalculator />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
