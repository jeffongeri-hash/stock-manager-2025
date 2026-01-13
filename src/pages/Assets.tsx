import { useMemo } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AnimatedStatsCard } from "@/components/ui/AnimatedStatsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Wallet, TrendingUp, TrendingDown, RefreshCw, Building2, 
  PieChart, BarChart3, DollarSign, Link2, ArrowUpRight, ArrowDownRight,
  Landmark, AlertCircle, Clock
} from "lucide-react";
import { useSnaptrade } from "@/hooks/useSnaptrade";
import { useAuth } from "@/hooks/useAuth";
import { SnaptradeConnection } from "@/components/brokers/SnaptradeConnection";
import { SchwabConnection } from "@/components/brokers/SchwabConnection";
import { IBKRConnection } from "@/components/brokers/IBKRConnection";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(142, 76%, 36%)', 'hsl(221, 83%, 53%)', 'hsl(262, 83%, 58%)'];

export default function Assets() {
  const { user } = useAuth();
  const snaptrade = useSnaptrade();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  // Group holdings by sector/type for pie chart
  const holdingsByValue = useMemo(() => {
    return snaptrade.holdings
      .sort((a, b) => b.market_value - a.market_value)
      .slice(0, 10)
      .map(h => ({
        name: h.symbol,
        value: h.market_value,
        pnl: h.unrealized_pnl,
        pnlPercent: h.unrealized_pnl_percent,
      }));
  }, [snaptrade.holdings]);

  // Holdings for bar chart (top 10 by value)
  const topHoldings = useMemo(() => {
    return snaptrade.holdings
      .sort((a, b) => b.market_value - a.market_value)
      .slice(0, 10);
  }, [snaptrade.holdings]);

  if (!user) {
    return (
      <PageLayout title="Assets">
        <Card className="text-center py-12">
          <CardContent>
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
            <p className="text-muted-foreground mb-4">
              Connect your brokerage accounts to view your assets
            </p>
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Assets">
      {/* Portfolio Summary Stats */}
      {/* Auto-sync indicator */}
      {snaptrade.isConnected && snaptrade.lastSyncTime && (
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Last synced: {snaptrade.lastSyncTime.toLocaleTimeString()}</span>
          <span className="text-xs">(auto-syncs every 5 min)</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <AnimatedStatsCard
          title="Total Portfolio Value"
          value={snaptrade.isLoading ? "Loading..." : formatCurrency(snaptrade.totalValue)}
          icon={<Wallet className="h-5 w-5" />}
          description={snaptrade.isConnected ? "From all connected accounts" : "Connect brokerages to see value"}
        />
        <AnimatedStatsCard
          title="Total Gain/Loss"
          value={snaptrade.isLoading ? "Loading..." : formatCurrency(snaptrade.totalPnL)}
          icon={snaptrade.totalPnL >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
          trend={snaptrade.isLoading ? undefined : snaptrade.totalPnLPercent}
          description="Unrealized P&L"
          variant={snaptrade.totalPnL >= 0 ? "success" : "danger"}
        />
        <AnimatedStatsCard
          title="Total Positions"
          value={snaptrade.isLoading ? "..." : snaptrade.holdings.length.toString()}
          icon={<PieChart className="h-5 w-5" />}
          description="Unique holdings"
        />
        <AnimatedStatsCard
          title="Dividends Received"
          value={snaptrade.isLoading ? "Loading..." : formatCurrency(snaptrade.totalDividends)}
          icon={<DollarSign className="h-5 w-5" />}
          description="Historical dividends"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {snaptrade.isConnected && snaptrade.holdings.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Allocation Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Portfolio Allocation
                  </CardTitle>
                  <CardDescription>Top 10 holdings by value</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={holdingsByValue}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {holdingsByValue.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Top Holdings Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Top Holdings
                  </CardTitle>
                  <CardDescription>By market value</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topHoldings} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="symbol" width={60} />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="market_value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <Button onClick={snaptrade.refresh} variant="outline" disabled={snaptrade.isLoading}>
                    <RefreshCw className={cn("h-4 w-4 mr-2", snaptrade.isLoading && "animate-spin")} />
                    Refresh Data
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/dividend-tracker">
                      <DollarSign className="h-4 w-4 mr-2" />
                      View Dividends
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/portfolio-rebalancing">
                      <PieChart className="h-4 w-4 mr-2" />
                      Rebalance Portfolio
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/performance">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Performance Analysis
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="py-12 text-center">
              <CardContent>
                <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Connected Brokerages</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Connect your brokerage accounts to see your combined portfolio, holdings, and dividends all in one place.
                </p>
                <Button onClick={() => document.querySelector('[data-value="connections"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))}>
                  <Link2 className="h-4 w-4 mr-2" />
                  Connect Brokerage
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="holdings" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Holdings</CardTitle>
                <CardDescription>All positions from connected accounts</CardDescription>
              </div>
              <Button onClick={snaptrade.refresh} variant="outline" size="sm" disabled={snaptrade.isLoading}>
                <RefreshCw className={cn("h-4 w-4", snaptrade.isLoading && "animate-spin")} />
              </Button>
            </CardHeader>
            <CardContent>
              {snaptrade.isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : snaptrade.holdings.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead className="text-right">Shares</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Market Value</TableHead>
                        <TableHead className="text-right">Cost Basis</TableHead>
                        <TableHead className="text-right">Gain/Loss</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {snaptrade.holdings.map((holding) => (
                        <TableRow key={holding.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{holding.symbol}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {holding.description}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {holding.quantity.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            ${holding.price.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {formatCurrency(holding.market_value)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">
                            {formatCurrency(holding.cost_basis)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className={cn(
                              "flex items-center justify-end gap-1",
                              holding.unrealized_pnl >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {holding.unrealized_pnl >= 0 ? (
                                <ArrowUpRight className="h-4 w-4" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4" />
                              )}
                              <span className="font-mono">
                                {formatCurrency(Math.abs(holding.unrealized_pnl))}
                              </span>
                              <Badge variant={holding.unrealized_pnl >= 0 ? "default" : "destructive"} className="ml-1 text-xs">
                                {formatPercent(holding.unrealized_pnl_percent)}
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No holdings found. Connect a brokerage to see your positions.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connections" className="space-y-6">
          <div className="grid gap-6">
            <SnaptradeConnection />
            <SchwabConnection />
            <IBKRConnection />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5" />
                Supported Brokerages
              </CardTitle>
              <CardDescription>
                Connect any of these brokerages via Snaptrade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  "Fidelity", "Charles Schwab", "TD Ameritrade", "Vanguard",
                  "Robinhood", "E*TRADE", "Webull", "Ally Invest",
                  "Wealthfront", "Betterment", "M1 Finance", "SoFi"
                ].map((broker) => (
                  <div 
                    key={broker}
                    className="p-3 rounded-lg border border-border bg-muted/30 text-center text-sm font-medium"
                  >
                    {broker}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
