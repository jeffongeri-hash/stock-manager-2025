import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  TrendingUp, 
  Shield, 
  Zap, 
  Target, 
  AlertTriangle,
  DollarSign,
  BarChart3,
  Calendar,
  Percent
} from "lucide-react";
import { useState } from "react";

const OptionsGuide = () => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <PageLayout title="Options Strategy Guide">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardDescription>
              Comprehensive guide for LEAPS, Covered Calls, and 0DTE options strategies with key metrics and entry criteria
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="leaps" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="leaps" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              LEAPS
            </TabsTrigger>
            <TabsTrigger value="covered-calls" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Covered Calls
            </TabsTrigger>
            <TabsTrigger value="0dte" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              0DTE
            </TabsTrigger>
          </TabsList>

          {/* LEAPS Tab */}
          <TabsContent value="leaps" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  LEAPS (Long-Term Equity Anticipation Securities)
                </CardTitle>
                <CardDescription>
                  Options with expiration dates 1-3 years out, used as stock replacement or leverage strategies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Ideal Use Case
                    </h4>
                    <p className="text-sm text-muted-foreground mt-2">
                      Long-term bullish positions with lower capital requirement than buying stock
                    </p>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2 text-green-500">
                      <TrendingUp className="h-4 w-4" />
                      Typical Leverage
                    </h4>
                    <p className="text-sm text-muted-foreground mt-2">
                      3-10x leverage compared to stock purchase
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-500/10 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2 text-yellow-500">
                      <Calendar className="h-4 w-4" />
                      Time Frame
                    </h4>
                    <p className="text-sm text-muted-foreground mt-2">
                      12-24 months minimum expiration recommended
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>LEAPS Entry Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Criteria</TableHead>
                      <TableHead>Metric</TableHead>
                      <TableHead>Target Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <Checkbox 
                          checked={checkedItems.has('leaps-1')}
                          onCheckedChange={() => toggleCheck('leaps-1')}
                        />
                      </TableCell>
                      <TableCell>Delta Selection</TableCell>
                      <TableCell>Choose ITM calls</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500/20 text-green-500">Delta ≥ 0.70-0.80</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Checkbox 
                          checked={checkedItems.has('leaps-2')}
                          onCheckedChange={() => toggleCheck('leaps-2')}
                        />
                      </TableCell>
                      <TableCell>Time to Expiry</TableCell>
                      <TableCell>Long-dated options</TableCell>
                      <TableCell>
                        <Badge className="bg-blue-500/20 text-blue-500">≥ 12 months DTE</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Checkbox 
                          checked={checkedItems.has('leaps-3')}
                          onCheckedChange={() => toggleCheck('leaps-3')}
                        />
                      </TableCell>
                      <TableCell>Implied Volatility</TableCell>
                      <TableCell>IV Percentile</TableCell>
                      <TableCell>
                        <Badge className="bg-yellow-500/20 text-yellow-500">IV Rank &lt; 30%</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Checkbox 
                          checked={checkedItems.has('leaps-4')}
                          onCheckedChange={() => toggleCheck('leaps-4')}
                        />
                      </TableCell>
                      <TableCell>Strike Selection</TableCell>
                      <TableCell>Moneyness</TableCell>
                      <TableCell>
                        <Badge className="bg-primary/20 text-primary">10-20% ITM</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Checkbox 
                          checked={checkedItems.has('leaps-5')}
                          onCheckedChange={() => toggleCheck('leaps-5')}
                        />
                      </TableCell>
                      <TableCell>Cost Basis</TableCell>
                      <TableCell>Max % of intrinsic</TableCell>
                      <TableCell>
                        <Badge variant="outline">Extrinsic &lt; 15% of premium</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Checkbox 
                          checked={checkedItems.has('leaps-6')}
                          onCheckedChange={() => toggleCheck('leaps-6')}
                        />
                      </TableCell>
                      <TableCell>Liquidity</TableCell>
                      <TableCell>Bid-Ask Spread</TableCell>
                      <TableCell>
                        <Badge variant="outline">Spread &lt; 5% of mid</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-2">
                  <h4 className="font-semibold">LEAPS Management Tips:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Roll to next expiration when DTE reaches 90-120 days</li>
                    <li>• Consider selling short-term calls against LEAPS (Poor Man's Covered Call)</li>
                    <li>• Close at 50-100% profit or if thesis changes</li>
                    <li>• Avoid dividend-paying stocks (reduces call value)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Covered Calls Tab */}
          <TabsContent value="covered-calls" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Covered Call Strategy
                </CardTitle>
                <CardDescription>
                  Sell call options against stock you own to generate income and reduce cost basis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-500/10 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2 text-green-500">
                      <DollarSign className="h-4 w-4" />
                      Income Generation
                    </h4>
                    <p className="text-sm text-muted-foreground mt-2">
                      1-3% monthly income on stock holdings
                    </p>
                  </div>
                  <div className="p-4 bg-blue-500/10 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2 text-blue-500">
                      <Shield className="h-4 w-4" />
                      Downside Protection
                    </h4>
                    <p className="text-sm text-muted-foreground mt-2">
                      Premium provides cushion against losses
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-500/10 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2 text-yellow-500">
                      <AlertTriangle className="h-4 w-4" />
                      Capped Upside
                    </h4>
                    <p className="text-sm text-muted-foreground mt-2">
                      Profit limited to strike price + premium
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Covered Call Entry Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Criteria</TableHead>
                      <TableHead>Metric</TableHead>
                      <TableHead>Target Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-green-500/5">
                      <TableCell>
                        <Checkbox 
                          checked={checkedItems.has('cc-1')}
                          onCheckedChange={() => toggleCheck('cc-1')}
                        />
                      </TableCell>
                      <TableCell className="font-semibold">Delta Selection (CRITICAL)</TableCell>
                      <TableCell>Short call delta</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500/20 text-green-500 font-bold">Delta ≤ 0.30</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Checkbox 
                          checked={checkedItems.has('cc-2')}
                          onCheckedChange={() => toggleCheck('cc-2')}
                        />
                      </TableCell>
                      <TableCell>Optimal Delta Range</TableCell>
                      <TableCell>Sweet spot for income</TableCell>
                      <TableCell>
                        <Badge className="bg-primary/20 text-primary">Delta 0.20-0.25</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Checkbox 
                          checked={checkedItems.has('cc-3')}
                          onCheckedChange={() => toggleCheck('cc-3')}
                        />
                      </TableCell>
                      <TableCell>Days to Expiration</TableCell>
                      <TableCell>Optimal theta decay</TableCell>
                      <TableCell>
                        <Badge className="bg-blue-500/20 text-blue-500">30-45 DTE</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Checkbox 
                          checked={checkedItems.has('cc-4')}
                          onCheckedChange={() => toggleCheck('cc-4')}
                        />
                      </TableCell>
                      <TableCell>Strike Distance</TableCell>
                      <TableCell>% above current price</TableCell>
                      <TableCell>
                        <Badge variant="outline">5-10% OTM</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Checkbox 
                          checked={checkedItems.has('cc-5')}
                          onCheckedChange={() => toggleCheck('cc-5')}
                        />
                      </TableCell>
                      <TableCell>Annualized Return</TableCell>
                      <TableCell>Target annual yield</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500/20 text-green-500">≥ 15-25% APY</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Checkbox 
                          checked={checkedItems.has('cc-6')}
                          onCheckedChange={() => toggleCheck('cc-6')}
                        />
                      </TableCell>
                      <TableCell>IV Environment</TableCell>
                      <TableCell>Sell when IV is high</TableCell>
                      <TableCell>
                        <Badge className="bg-yellow-500/20 text-yellow-500">IV Rank &gt; 30%</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Checkbox 
                          checked={checkedItems.has('cc-7')}
                          onCheckedChange={() => toggleCheck('cc-7')}
                        />
                      </TableCell>
                      <TableCell>Avoid Earnings</TableCell>
                      <TableCell>Earnings date check</TableCell>
                      <TableCell>
                        <Badge variant="outline">No earnings before expiry</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <h4 className="font-semibold text-green-500">When to Sell Covered Calls:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>✓ Stock is in neutral to slightly bullish trend</li>
                      <li>✓ You're willing to sell at strike price</li>
                      <li>✓ IV is elevated (better premiums)</li>
                      <li>✓ Stock has low beta (less volatile)</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-red-500/10 rounded-lg space-y-2">
                    <h4 className="font-semibold text-red-500">When NOT to Sell:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>✗ Expecting significant upside move</li>
                      <li>✗ Before earnings announcements</li>
                      <li>✗ Stock in strong uptrend (wait for consolidation)</li>
                      <li>✗ IV is very low (poor premiums)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 0DTE Tab */}
          <TabsContent value="0dte" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  0DTE (Zero Days to Expiration) Strategies
                </CardTitle>
                <CardDescription>
                  High-risk, high-reward day trading strategies using same-day expiring options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-500">High Risk Warning</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        0DTE options can lose 100% of their value within minutes. Only trade with capital you can afford to lose.
                        Maximum 1-2% of portfolio per trade recommended.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Index Options Focus
                    </h4>
                    <p className="text-sm text-muted-foreground mt-2">
                      SPX, SPY, QQQ offer daily expirations with high liquidity
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-500/10 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2 text-yellow-500">
                      <Percent className="h-4 w-4" />
                      Extreme Theta Decay
                    </h4>
                    <p className="text-sm text-muted-foreground mt-2">
                      Options lose most value in final hours - works for sellers
                    </p>
                  </div>
                  <div className="p-4 bg-red-500/10 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2 text-red-500">
                      <Zap className="h-4 w-4" />
                      Maximum Gamma
                    </h4>
                    <p className="text-sm text-muted-foreground mt-2">
                      Small price moves = large premium swings
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>0DTE Trading Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Criteria</TableHead>
                      <TableHead>Metric</TableHead>
                      <TableHead>Target Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-yellow-500/5">
                      <TableCell>
                        <Checkbox 
                          checked={checkedItems.has('0dte-1')}
                          onCheckedChange={() => toggleCheck('0dte-1')}
                        />
                      </TableCell>
                      <TableCell className="font-semibold">Position Size (CRITICAL)</TableCell>
                      <TableCell>Max risk per trade</TableCell>
                      <TableCell>
                        <Badge className="bg-red-500/20 text-red-500 font-bold">≤ 1-2% of portfolio</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Checkbox 
                          checked={checkedItems.has('0dte-2')}
                          onCheckedChange={() => toggleCheck('0dte-2')}
                        />
                      </TableCell>
                      <TableCell>Delta for Directional</TableCell>
                      <TableCell>ATM for max gamma</TableCell>
                      <TableCell>
                        <Badge className="bg-primary/20 text-primary">Delta 0.45-0.55</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Checkbox 
                          checked={checkedItems.has('0dte-3')}
                          onCheckedChange={() => toggleCheck('0dte-3')}
                        />
                      </TableCell>
                      <TableCell>Credit Spreads Delta</TableCell>
                      <TableCell>Short strike delta</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500/20 text-green-500">Delta ≤ 0.10-0.15</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Checkbox 
                          checked={checkedItems.has('0dte-4')}
                          onCheckedChange={() => toggleCheck('0dte-4')}
                        />
                      </TableCell>
                      <TableCell>Entry Timing</TableCell>
                      <TableCell>Best entry windows</TableCell>
                      <TableCell>
                        <Badge variant="outline">9:45-10:30 AM or 2:00-3:00 PM ET</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Checkbox 
                          checked={checkedItems.has('0dte-5')}
                          onCheckedChange={() => toggleCheck('0dte-5')}
                        />
                      </TableCell>
                      <TableCell>Take Profit</TableCell>
                      <TableCell>Exit on gains</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500/20 text-green-500">50-100% profit</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Checkbox 
                          checked={checkedItems.has('0dte-6')}
                          onCheckedChange={() => toggleCheck('0dte-6')}
                        />
                      </TableCell>
                      <TableCell>Stop Loss</TableCell>
                      <TableCell>Max loss per trade</TableCell>
                      <TableCell>
                        <Badge className="bg-red-500/20 text-red-500">50% of premium paid</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Checkbox 
                          checked={checkedItems.has('0dte-7')}
                          onCheckedChange={() => toggleCheck('0dte-7')}
                        />
                      </TableCell>
                      <TableCell>Avoid FOMC/CPI Days</TableCell>
                      <TableCell>Major events</TableCell>
                      <TableCell>
                        <Badge variant="outline">Check economic calendar</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Checkbox 
                          checked={checkedItems.has('0dte-8')}
                          onCheckedChange={() => toggleCheck('0dte-8')}
                        />
                      </TableCell>
                      <TableCell>VIX Level Check</TableCell>
                      <TableCell>Market volatility</TableCell>
                      <TableCell>
                        <Badge variant="outline">VIX 15-25 ideal range</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <Separator className="my-6" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold">Popular 0DTE Strategies:</h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <h5 className="font-medium">Iron Condor (Premium Collection)</h5>
                        <p className="text-sm text-muted-foreground">
                          Sell spreads 10-15 delta OTM on both sides. Profit if SPX stays within range.
                        </p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <h5 className="font-medium">Butterfly (Low Cost)</h5>
                        <p className="text-sm text-muted-foreground">
                          ATM butterfly for 5:1 or better risk/reward on directional move.
                        </p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <h5 className="font-medium">Scalping Directional</h5>
                        <p className="text-sm text-muted-foreground">
                          Buy ATM calls/puts for quick 20-50% gains on momentum moves.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-red-500">Risk Management Rules:</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <Badge variant="destructive" className="mt-0.5">1</Badge>
                        <span>Never hold into close - close by 3:30 PM ET</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="destructive" className="mt-0.5">2</Badge>
                        <span>Max 3 trades per day to avoid overtrading</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="destructive" className="mt-0.5">3</Badge>
                        <span>Daily loss limit: Stop after -2% portfolio loss</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="destructive" className="mt-0.5">4</Badge>
                        <span>Use defined-risk spreads to limit max loss</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="destructive" className="mt-0.5">5</Badge>
                        <span>Paper trade for 2+ weeks before going live</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Reference Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Quick Delta Reference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Strategy</TableHead>
                  <TableHead>Recommended Delta</TableHead>
                  <TableHead>Probability OTM</TableHead>
                  <TableHead>Use Case</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">LEAPS (Buy)</TableCell>
                  <TableCell>
                    <Badge className="bg-green-500/20 text-green-500">0.70 - 0.80</Badge>
                  </TableCell>
                  <TableCell>20-30%</TableCell>
                  <TableCell>Stock replacement with leverage</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Covered Calls (Sell)</TableCell>
                  <TableCell>
                    <Badge className="bg-blue-500/20 text-blue-500">0.20 - 0.30</Badge>
                  </TableCell>
                  <TableCell>70-80%</TableCell>
                  <TableCell>Income generation on holdings</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">0DTE Credit Spreads</TableCell>
                  <TableCell>
                    <Badge className="bg-yellow-500/20 text-yellow-500">0.10 - 0.15</Badge>
                  </TableCell>
                  <TableCell>85-90%</TableCell>
                  <TableCell>High probability premium collection</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">0DTE Directional</TableCell>
                  <TableCell>
                    <Badge className="bg-primary/20 text-primary">0.45 - 0.55</Badge>
                  </TableCell>
                  <TableCell>45-55%</TableCell>
                  <TableCell>Momentum scalping</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Protective Puts</TableCell>
                  <TableCell>
                    <Badge className="bg-red-500/20 text-red-500">0.20 - 0.30</Badge>
                  </TableCell>
                  <TableCell>70-80%</TableCell>
                  <TableCell>Portfolio hedging</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default OptionsGuide;
