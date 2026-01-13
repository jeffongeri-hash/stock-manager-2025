import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, Plus, Trash2, DollarSign, TrendingUp, TrendingDown, 
  Target, Clock, CheckCircle2, ArrowRight, Zap, Shield
} from 'lucide-react';
import { toast } from 'sonner';

interface WheelPosition {
  id: string;
  symbol: string;
  status: 'csp' | 'assigned' | 'cc' | 'called_away';
  entryDate: string;
  strikePrice: number;
  premium: number;
  expiration: string;
  shares?: number;
  costBasis?: number;
  totalPremiumCollected: number;
  cycles: number;
}

interface WheelTrade {
  id: string;
  positionId: string;
  type: 'csp' | 'cc';
  strikePrice: number;
  premium: number;
  entryDate: string;
  expiration: string;
  status: 'open' | 'expired' | 'assigned' | 'closed';
  closePrice?: number;
}

export const WheelStrategyTracker = () => {
  const [positions, setPositions] = useState<WheelPosition[]>([
    {
      id: '1',
      symbol: 'AAPL',
      status: 'cc',
      entryDate: '2024-01-15',
      strikePrice: 185,
      premium: 3.50,
      expiration: '2024-02-16',
      shares: 100,
      costBasis: 180,
      totalPremiumCollected: 1250,
      cycles: 4
    },
    {
      id: '2',
      symbol: 'MSFT',
      status: 'csp',
      entryDate: '2024-02-01',
      strikePrice: 400,
      premium: 5.00,
      expiration: '2024-02-23',
      totalPremiumCollected: 500,
      cycles: 1
    }
  ]);

  const [trades, setTrades] = useState<WheelTrade[]>([
    { id: 't1', positionId: '1', type: 'csp', strikePrice: 175, premium: 4.00, entryDate: '2023-11-01', expiration: '2023-11-17', status: 'assigned' },
    { id: 't2', positionId: '1', type: 'cc', strikePrice: 180, premium: 3.00, entryDate: '2023-11-20', expiration: '2023-12-15', status: 'expired' },
    { id: 't3', positionId: '1', type: 'cc', strikePrice: 185, premium: 2.50, entryDate: '2023-12-18', expiration: '2024-01-19', status: 'expired' },
    { id: 't4', positionId: '1', type: 'cc', strikePrice: 185, premium: 3.50, entryDate: '2024-01-22', expiration: '2024-02-16', status: 'open' },
  ]);

  // New position form state
  const [newSymbol, setNewSymbol] = useState('');
  const [newStrike, setNewStrike] = useState('');
  const [newPremium, setNewPremium] = useState('');
  const [newExpiration, setNewExpiration] = useState('');
  const [newType, setNewType] = useState<'csp' | 'cc'>('csp');

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalPremium = positions.reduce((sum, p) => sum + p.totalPremiumCollected, 0);
    const openPositions = positions.filter(p => p.status === 'csp' || p.status === 'cc');
    const assignedPositions = positions.filter(p => p.status === 'assigned' || p.status === 'cc');
    const totalCycles = positions.reduce((sum, p) => sum + p.cycles, 0);
    
    // Calculate capital at risk
    const cspCapital = positions
      .filter(p => p.status === 'csp')
      .reduce((sum, p) => sum + (p.strikePrice * 100), 0);
    
    const stockCapital = positions
      .filter(p => p.status === 'assigned' || p.status === 'cc')
      .reduce((sum, p) => sum + ((p.costBasis || p.strikePrice) * 100), 0);

    const totalCapital = cspCapital + stockCapital;
    const annualizedReturn = totalCapital > 0 ? (totalPremium / totalCapital) * 12 * 100 : 0;

    return {
      totalPremium,
      openPositions: openPositions.length,
      assignedPositions: assignedPositions.length,
      totalCycles,
      cspCapital,
      stockCapital,
      totalCapital,
      annualizedReturn
    };
  }, [positions]);

  const addPosition = () => {
    if (!newSymbol || !newStrike || !newPremium || !newExpiration) {
      toast.error('Please fill in all fields');
      return;
    }

    const newPosition: WheelPosition = {
      id: Date.now().toString(),
      symbol: newSymbol.toUpperCase(),
      status: newType === 'csp' ? 'csp' : 'cc',
      entryDate: new Date().toISOString().split('T')[0],
      strikePrice: parseFloat(newStrike),
      premium: parseFloat(newPremium),
      expiration: newExpiration,
      shares: newType === 'cc' ? 100 : undefined,
      costBasis: newType === 'cc' ? parseFloat(newStrike) : undefined,
      totalPremiumCollected: parseFloat(newPremium) * 100,
      cycles: 1
    };

    setPositions([...positions, newPosition]);
    toast.success(`Added ${newType.toUpperCase()} position for ${newSymbol.toUpperCase()}`);
    
    // Clear form
    setNewSymbol('');
    setNewStrike('');
    setNewPremium('');
    setNewExpiration('');
  };

  const updatePositionStatus = (id: string, newStatus: WheelPosition['status']) => {
    setPositions(positions.map(p => {
      if (p.id !== id) return p;
      
      const updated = { ...p, status: newStatus };
      
      if (newStatus === 'assigned') {
        updated.shares = 100;
        updated.costBasis = p.strikePrice - (p.totalPremiumCollected / 100);
      }
      
      return updated;
    }));
    
    toast.success(`Position status updated to ${newStatus.replace('_', ' ')}`);
  };

  const removePosition = (id: string) => {
    setPositions(positions.filter(p => p.id !== id));
    toast.success('Position removed');
  };

  const getStatusBadge = (status: WheelPosition['status']) => {
    switch (status) {
      case 'csp':
        return <Badge className="bg-blue-500/20 text-blue-500">Cash-Secured Put</Badge>;
      case 'assigned':
        return <Badge className="bg-yellow-500/20 text-yellow-500">Assigned (Hold Stock)</Badge>;
      case 'cc':
        return <Badge className="bg-green-500/20 text-green-500">Covered Call</Badge>;
      case 'called_away':
        return <Badge className="bg-purple-500/20 text-purple-500">Called Away</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getNextAction = (position: WheelPosition) => {
    switch (position.status) {
      case 'csp':
        return 'Wait for expiration or assignment';
      case 'assigned':
        return 'Sell covered call';
      case 'cc':
        return 'Wait for expiration or call away';
      case 'called_away':
        return 'Restart wheel with CSP';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-green-500">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">Total Premium</span>
            </div>
            <p className="text-2xl font-bold mt-1">${metrics.totalPremium.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{metrics.totalCycles} cycles completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Open Positions</span>
            </div>
            <p className="text-2xl font-bold mt-1">{metrics.openPositions}</p>
            <p className="text-xs text-muted-foreground">{metrics.assignedPositions} with shares</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="text-sm font-medium">Capital at Risk</span>
            </div>
            <p className="text-2xl font-bold mt-1">${metrics.totalCapital.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              CSP: ${metrics.cspCapital.toLocaleString()} | Stock: ${metrics.stockCapital.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-primary/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Est. Annual Return</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-primary">{metrics.annualizedReturn.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Based on premium collected</p>
          </CardContent>
        </Card>
      </div>

      {/* Wheel Strategy Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            The Wheel Strategy Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
                <TrendingDown className="h-6 w-6 text-blue-500" />
              </div>
              <h4 className="font-semibold">1. Sell CSP</h4>
              <p className="text-xs text-muted-foreground max-w-32">
                Sell cash-secured put, collect premium
              </p>
            </div>
            
            <ArrowRight className="h-6 w-6 text-muted-foreground hidden md:block" />
            <div className="h-6 w-px bg-border md:hidden" />
            
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mb-2">
                <Shield className="h-6 w-6 text-yellow-500" />
              </div>
              <h4 className="font-semibold">2. Get Assigned</h4>
              <p className="text-xs text-muted-foreground max-w-32">
                Buy 100 shares at strike price
              </p>
            </div>
            
            <ArrowRight className="h-6 w-6 text-muted-foreground hidden md:block" />
            <div className="h-6 w-px bg-border md:hidden" />
            
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <h4 className="font-semibold">3. Sell CC</h4>
              <p className="text-xs text-muted-foreground max-w-32">
                Sell covered call, collect more premium
              </p>
            </div>
            
            <ArrowRight className="h-6 w-6 text-muted-foreground hidden md:block" />
            <div className="h-6 w-px bg-border md:hidden" />
            
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
                <CheckCircle2 className="h-6 w-6 text-purple-500" />
              </div>
              <h4 className="font-semibold">4. Called Away</h4>
              <p className="text-xs text-muted-foreground max-w-32">
                Shares sold, restart wheel
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="positions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="positions">Active Positions</TabsTrigger>
          <TabsTrigger value="add">Add Position</TabsTrigger>
          <TabsTrigger value="history">Trade History</TabsTrigger>
        </TabsList>

        <TabsContent value="positions">
          <Card>
            <CardHeader>
              <CardTitle>Wheel Positions</CardTitle>
              <CardDescription>
                Track your positions through the wheel cycle
              </CardDescription>
            </CardHeader>
            <CardContent>
              {positions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No wheel positions. Add a cash-secured put to start.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Strike</TableHead>
                        <TableHead>Expiration</TableHead>
                        <TableHead>Premium</TableHead>
                        <TableHead>Total Collected</TableHead>
                        <TableHead>Cycles</TableHead>
                        <TableHead>Next Action</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {positions.map((position) => (
                        <TableRow key={position.id}>
                          <TableCell className="font-bold">{position.symbol}</TableCell>
                          <TableCell>{getStatusBadge(position.status)}</TableCell>
                          <TableCell>${position.strikePrice}</TableCell>
                          <TableCell>{position.expiration}</TableCell>
                          <TableCell className="text-green-500">
                            ${position.premium.toFixed(2)}
                          </TableCell>
                          <TableCell className="font-bold text-green-500">
                            ${position.totalPremiumCollected.toFixed(0)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{position.cycles}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {getNextAction(position)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {position.status === 'csp' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updatePositionStatus(position.id, 'assigned')}
                                >
                                  Assigned
                                </Button>
                              )}
                              {position.status === 'assigned' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updatePositionStatus(position.id, 'cc')}
                                >
                                  Sell CC
                                </Button>
                              )}
                              {position.status === 'cc' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updatePositionStatus(position.id, 'cc')}
                                  >
                                    Roll
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updatePositionStatus(position.id, 'called_away')}
                                  >
                                    Called
                                  </Button>
                                </>
                              )}
                              {position.status === 'called_away' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updatePositionStatus(position.id, 'csp')}
                                >
                                  Restart
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removePosition(position.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {positions.some(p => p.costBasis) && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Cost Basis Adjustment</h4>
                  {positions.filter(p => p.costBasis).map(p => (
                    <div key={p.id} className="flex justify-between items-center py-2 border-b last:border-0">
                      <span className="font-medium">{p.symbol}</span>
                      <div className="text-right">
                        <p className="text-sm">
                          Original: ${p.strikePrice} → Adjusted: 
                          <span className="text-green-500 font-bold ml-1">
                            ${(p.strikePrice - p.totalPremiumCollected / 100).toFixed(2)}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Reduced by ${(p.totalPremiumCollected / 100).toFixed(2)}/share from premiums
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Wheel Position
              </CardTitle>
              <CardDescription>
                Start a new wheel by selling a cash-secured put
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <Label>Symbol</Label>
                  <Input
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                    placeholder="AAPL"
                  />
                </div>
                <div>
                  <Label>Position Type</Label>
                  <Select value={newType} onValueChange={(v) => setNewType(v as 'csp' | 'cc')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csp">Cash-Secured Put</SelectItem>
                      <SelectItem value="cc">Covered Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Strike Price</Label>
                  <Input
                    type="number"
                    value={newStrike}
                    onChange={(e) => setNewStrike(e.target.value)}
                    placeholder="180"
                  />
                </div>
                <div>
                  <Label>Premium (per share)</Label>
                  <Input
                    type="number"
                    value={newPremium}
                    onChange={(e) => setNewPremium(e.target.value)}
                    placeholder="3.50"
                    step="0.10"
                  />
                </div>
                <div>
                  <Label>Expiration</Label>
                  <Input
                    type="date"
                    value={newExpiration}
                    onChange={(e) => setNewExpiration(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Capital Required</p>
                  <p className="text-xl font-bold">
                    ${newStrike ? (parseFloat(newStrike) * 100).toLocaleString() : '0'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Premium Income</p>
                  <p className="text-xl font-bold text-green-500">
                    +${newPremium ? (parseFloat(newPremium) * 100).toFixed(0) : '0'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Effective Cost Basis</p>
                  <p className="text-xl font-bold">
                    ${newStrike && newPremium ? (parseFloat(newStrike) - parseFloat(newPremium)).toFixed(2) : '0'}
                  </p>
                </div>
              </div>

              <Button onClick={addPosition} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add {newType === 'csp' ? 'Cash-Secured Put' : 'Covered Call'} Position
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Trade History
              </CardTitle>
              <CardDescription>
                All wheel trades across positions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Strike</TableHead>
                    <TableHead>Premium</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((trade) => {
                    const position = positions.find(p => p.id === trade.positionId);
                    return (
                      <TableRow key={trade.id}>
                        <TableCell>{trade.entryDate}</TableCell>
                        <TableCell>
                          <Badge variant={trade.type === 'csp' ? 'secondary' : 'default'}>
                            {trade.type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>${trade.strikePrice}</TableCell>
                        <TableCell className="text-green-500">
                          +${(trade.premium * 100).toFixed(0)}
                        </TableCell>
                        <TableCell>{trade.expiration}</TableCell>
                        <TableCell>
                          <Badge variant={trade.status === 'open' ? 'outline' : 'secondary'}>
                            {trade.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {trade.status === 'expired' && (
                            <span className="text-green-500 font-medium">Kept premium ✓</span>
                          )}
                          {trade.status === 'assigned' && (
                            <span className="text-yellow-500 font-medium">Bought shares</span>
                          )}
                          {trade.status === 'open' && (
                            <span className="text-muted-foreground">Pending...</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tips Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Wheel Strategy Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold">Selling Cash-Secured Puts:</h4>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Badge className="mt-0.5 shrink-0">1</Badge>
                  <span>Choose stocks you'd want to own at the strike price</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge className="mt-0.5 shrink-0">2</Badge>
                  <span>Sell puts at delta 0.25-0.30 for ~70-75% win rate</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge className="mt-0.5 shrink-0">3</Badge>
                  <span>Target 30-45 DTE for optimal theta decay</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge className="mt-0.5 shrink-0">4</Badge>
                  <span>Close at 50% profit to free up capital faster</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Selling Covered Calls:</h4>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Badge className="mt-0.5 shrink-0">1</Badge>
                  <span>Sell calls at/above your cost basis for guaranteed profit</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge className="mt-0.5 shrink-0">2</Badge>
                  <span>Delta ≤0.30 gives good balance of premium vs assignment risk</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge className="mt-0.5 shrink-0">3</Badge>
                  <span>Avoid selling before earnings (roll or wait)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge className="mt-0.5 shrink-0">4</Badge>
                  <span>If called away at profit, celebrate and restart!</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
