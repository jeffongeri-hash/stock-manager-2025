import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Target, Users, DollarSign } from 'lucide-react';

interface AnalystRatingsProps {
  symbol: string;
  currentPrice: number;
}

export const AnalystRatings: React.FC<AnalystRatingsProps> = ({ symbol, currentPrice }) => {
  // Simulated analyst data - in production this would come from an API
  const totalAnalysts = 28 + Math.floor(Math.random() * 10);
  const strongBuy = Math.floor(totalAnalysts * (0.25 + Math.random() * 0.15));
  const buy = Math.floor(totalAnalysts * (0.2 + Math.random() * 0.1));
  const hold = Math.floor(totalAnalysts * (0.2 + Math.random() * 0.15));
  const sell = Math.floor((totalAnalysts - strongBuy - buy - hold) * 0.6);
  const strongSell = totalAnalysts - strongBuy - buy - hold - sell;

  // Price targets
  const avgTarget = currentPrice * (1.05 + Math.random() * 0.25);
  const highTarget = currentPrice * (1.3 + Math.random() * 0.3);
  const lowTarget = currentPrice * (0.75 + Math.random() * 0.15);
  const upside = ((avgTarget - currentPrice) / currentPrice) * 100;

  // Calculate consensus
  const getConsensus = () => {
    const score = (strongBuy * 5 + buy * 4 + hold * 3 + sell * 2 + strongSell * 1) / totalAnalysts;
    if (score >= 4.2) return { label: 'Strong Buy', color: 'bg-green-600' };
    if (score >= 3.5) return { label: 'Buy', color: 'bg-green-500' };
    if (score >= 2.5) return { label: 'Hold', color: 'bg-yellow-500' };
    if (score >= 1.8) return { label: 'Sell', color: 'bg-orange-500' };
    return { label: 'Strong Sell', color: 'bg-red-500' };
  };

  const consensus = getConsensus();

  // Recent rating changes
  const ratingChanges = [
    { firm: 'Goldman Sachs', action: 'Upgraded', from: 'Hold', to: 'Buy', target: avgTarget * 1.05, date: '2 days ago' },
    { firm: 'Morgan Stanley', action: 'Maintained', from: 'Buy', to: 'Buy', target: avgTarget * 0.98, date: '5 days ago' },
    { firm: 'JP Morgan', action: 'Initiated', from: '-', to: 'Overweight', target: avgTarget * 1.1, date: '1 week ago' },
    { firm: 'Bank of America', action: 'Downgraded', from: 'Buy', to: 'Hold', target: avgTarget * 0.9, date: '2 weeks ago' },
  ];

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  return (
    <div className="space-y-6">
      {/* Consensus Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Analyst Ratings - {symbol}
          </CardTitle>
          <CardDescription>Based on {totalAnalysts} analysts covering this stock</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Consensus Badge */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Consensus Rating</p>
              <Badge className={`text-lg px-4 py-1 ${consensus.color}`}>
                {consensus.label}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Average Price Target</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{formatPrice(avgTarget)}</span>
                <Badge variant={upside >= 0 ? 'default' : 'destructive'}>
                  {upside >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {upside >= 0 ? '+' : ''}{upside.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Rating Distribution</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs w-20 text-right">Strong Buy</span>
                <Progress value={(strongBuy / totalAnalysts) * 100} className="flex-1 h-4" />
                <span className="text-xs w-8 font-medium">{strongBuy}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs w-20 text-right">Buy</span>
                <Progress value={(buy / totalAnalysts) * 100} className="flex-1 h-4" />
                <span className="text-xs w-8 font-medium">{buy}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs w-20 text-right">Hold</span>
                <Progress value={(hold / totalAnalysts) * 100} className="flex-1 h-4" />
                <span className="text-xs w-8 font-medium">{hold}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs w-20 text-right">Sell</span>
                <Progress value={(sell / totalAnalysts) * 100} className="flex-1 h-4" />
                <span className="text-xs w-8 font-medium">{sell}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs w-20 text-right">Strong Sell</span>
                <Progress value={(strongSell / totalAnalysts) * 100} className="flex-1 h-4" />
                <span className="text-xs w-8 font-medium">{strongSell}</span>
              </div>
            </div>
          </div>

          {/* Price Target Range */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Price Target Range
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border text-center">
                <p className="text-xs text-muted-foreground">Low Target</p>
                <p className="text-lg font-bold text-red-500">{formatPrice(lowTarget)}</p>
                <p className="text-xs text-muted-foreground">
                  {(((lowTarget - currentPrice) / currentPrice) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 rounded-lg border border-primary bg-primary/5 text-center">
                <p className="text-xs text-muted-foreground">Average Target</p>
                <p className="text-lg font-bold">{formatPrice(avgTarget)}</p>
                <p className="text-xs text-green-500">
                  +{upside.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 rounded-lg border text-center">
                <p className="text-xs text-muted-foreground">High Target</p>
                <p className="text-lg font-bold text-green-500">{formatPrice(highTarget)}</p>
                <p className="text-xs text-muted-foreground">
                  +{(((highTarget - currentPrice) / currentPrice) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              Current Price: <span className="font-medium text-foreground">{formatPrice(currentPrice)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Rating Changes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Rating Changes</CardTitle>
          <CardDescription>Latest analyst actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ratingChanges.map((change, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{change.firm}</span>
                    <Badge 
                      variant={
                        change.action === 'Upgraded' ? 'default' : 
                        change.action === 'Downgraded' ? 'destructive' : 
                        'secondary'
                      }
                      className="text-xs"
                    >
                      {change.action}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {change.from !== '-' && `${change.from} → `}{change.to}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(change.target)}</p>
                  <p className="text-xs text-muted-foreground">{change.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
