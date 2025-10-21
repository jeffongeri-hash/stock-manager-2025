import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Trade {
  id: string;
  symbol: string;
  type: string;
  action: string;
  strike: number;
  expiration: string;
  premium: number;
  quantity: number;
  date: string;
  strategy: string;
  total_value: number;
}

const Portfolio = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [currentTrade, setCurrentTrade] = useState({
    symbol: '',
    type: 'call',
    action: 'buy',
    strike: '',
    expiration: '',
    premium: '',
    quantity: '',
    date: new Date().toISOString().split('T')[0],
    strategy: ''
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchTrades();
    }
  }, [user]);

  const fetchTrades = async () => {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      toast.error('Failed to fetch trades');
    } else {
      setTrades(data || []);
    }
  };

  const addTrade = async () => {
    if (!currentTrade.symbol || !currentTrade.strike || !currentTrade.premium || !currentTrade.quantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    const strike = parseFloat(currentTrade.strike);
    const premium = parseFloat(currentTrade.premium);
    const quantity = parseInt(currentTrade.quantity);
    const totalValue = premium * quantity * 100;

    const { error } = await supabase
      .from('trades')
      .insert([{
        user_id: user?.id,
        symbol: currentTrade.symbol,
        type: currentTrade.type,
        action: currentTrade.action,
        strike,
        expiration: currentTrade.expiration,
        premium,
        quantity,
        date: currentTrade.date,
        strategy: currentTrade.strategy,
        total_value: totalValue
      }]);

    if (error) {
      toast.error('Failed to add trade');
    } else {
      toast.success('Trade added successfully');
      setCurrentTrade({
        symbol: '',
        type: 'call',
        action: 'buy',
        strike: '',
        expiration: '',
        premium: '',
        quantity: '',
        date: new Date().toISOString().split('T')[0],
        strategy: ''
      });
      fetchTrades();
    }
  };

  const deleteTrade = async (id: string) => {
    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete trade');
    } else {
      toast.success('Trade deleted');
      fetchTrades();
    }
  };

  const calculatePnL = () => {
    const buyTrades = trades.filter(t => t.action === 'buy');
    const sellTrades = trades.filter(t => t.action === 'sell');
    
    const totalBought = buyTrades.reduce((sum, trade) => sum + trade.total_value, 0);
    const totalSold = sellTrades.reduce((sum, trade) => sum + trade.total_value, 0);
    
    return {
      totalBought,
      totalSold,
      netPnL: totalSold - totalBought,
      totalTrades: trades.length
    };
  };

  if (loading) {
    return <PageLayout title="Portfolio"><div>Loading...</div></PageLayout>;
  }

  if (!user) {
    return null;
  }

  const pnl = calculatePnL();
  
  return (
    <PageLayout title="Portfolio">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Bought</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${pnl.totalBought.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${pnl.totalSold.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Net P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${pnl.netPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${pnl.netPnL.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Trade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Symbol</Label>
              <Input
                value={currentTrade.symbol}
                onChange={(e) => setCurrentTrade({...currentTrade, symbol: e.target.value.toUpperCase()})}
                placeholder="AAPL"
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={currentTrade.type} onValueChange={(value) => setCurrentTrade({...currentTrade, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="put">Put</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={currentTrade.action} onValueChange={(value) => setCurrentTrade({...currentTrade, action: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Strike Price</Label>
              <Input
                type="number"
                value={currentTrade.strike}
                onChange={(e) => setCurrentTrade({...currentTrade, strike: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Expiration</Label>
              <Input
                type="date"
                value={currentTrade.expiration}
                onChange={(e) => setCurrentTrade({...currentTrade, expiration: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Premium</Label>
              <Input
                type="number"
                step="0.01"
                value={currentTrade.premium}
                onChange={(e) => setCurrentTrade({...currentTrade, premium: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={currentTrade.quantity}
                onChange={(e) => setCurrentTrade({...currentTrade, quantity: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={currentTrade.date}
                onChange={(e) => setCurrentTrade({...currentTrade, date: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Strategy</Label>
              <Input
                value={currentTrade.strategy}
                onChange={(e) => setCurrentTrade({...currentTrade, strategy: e.target.value})}
                placeholder="Bull Put Spread"
              />
            </div>
          </div>

          <Button onClick={addTrade} className="mt-4">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Trade
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trades History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Symbol</th>
                  <th className="text-left py-2 px-4">Type</th>
                  <th className="text-left py-2 px-4">Action</th>
                  <th className="text-right py-2 px-4">Strike</th>
                  <th className="text-right py-2 px-4">Premium</th>
                  <th className="text-right py-2 px-4">Quantity</th>
                  <th className="text-right py-2 px-4">Total Value</th>
                  <th className="text-left py-2 px-4">Date</th>
                  <th className="text-center py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={trade.id} className="border-b">
                    <td className="py-3 px-4 font-medium">{trade.symbol}</td>
                    <td className="py-3 px-4">{trade.type}</td>
                    <td className="py-3 px-4">
                      <span className={trade.action === 'buy' ? 'text-green-500' : 'text-red-500'}>
                        {trade.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">${trade.strike}</td>
                    <td className="py-3 px-4 text-right">${trade.premium}</td>
                    <td className="py-3 px-4 text-right">{trade.quantity}</td>
                    <td className="py-3 px-4 text-right">${trade.total_value.toFixed(2)}</td>
                    <td className="py-3 px-4">{new Date(trade.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTrade(trade.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {trades.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No trades yet. Add your first trade above.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default Portfolio;
