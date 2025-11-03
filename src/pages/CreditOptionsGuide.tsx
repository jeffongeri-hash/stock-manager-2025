import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle, Pause, RefreshCw } from 'lucide-react';

export default function CreditOptionsGuide() {
  const matrixData = [
    {
      condition: "Target profit hit early",
      indicator: "Option value ≤ 50% of entry credit (e.g., sold $0.40 → now ≤ $0.20)",
      action: "Close & take profit",
      actionType: "profit",
      reason: '"Singles, not home runs." Time decay has paid you; risk/reward now poor.',
      ivNotes: "IV usually falls as premium decays — confirm IV ↓ or stable before closing."
    },
    {
      condition: "2–3 days before expiration, still safe",
      indicator: "Underlying ≥ short strike + 0.5 SD",
      action: "Close early or let expire",
      actionType: "profit",
      reason: "Avoid overnight/weekend shocks; Theta mostly captured.",
      ivNotes: "IV flattening = neutral; if IV drops > 20%, close early."
    },
    {
      condition: "Price approaches short strike",
      indicator: "Stock within 0.25–0.30 of short strike",
      action: "Roll out 1 week (same width)",
      actionType: "warning",
      reason: '"Buy time, not panic." Reset risk window; collect new credit.',
      ivNotes: "Often IV ↑ — rolling captures that higher premium while moving OTM."
    },
    {
      condition: "Price breaks through short strike",
      indicator: "Underlying < short strike by > 0.10–0.20",
      action: "Roll out & down (strikes lower)",
      actionType: "roll",
      reason: "Adjust to re-establish cushion; convert potential loss to future gain.",
      ivNotes: "IV ↑↑ here; take advantage → sell new credit while IV high."
    },
    {
      condition: "Credit value doubles vs. entry",
      indicator: "Spread value ≈ 2× entry (e.g., $0.40 → $0.80)",
      action: "Close immediately or roll",
      actionType: "danger",
      reason: 'Protect capital — "don\'t hold full risk."',
      ivNotes: "Rising IV signals risk event; exit or roll to wider/next week."
    },
    {
      condition: "Flat price, time passing",
      indicator: "Stock stable ± 0.5 SD",
      action: "Hold",
      actionType: "hold",
      reason: "Theta decay doing work; no need to close.",
      ivNotes: "IV steady = ideal; continue collecting Theta."
    },
    {
      condition: "IV spike without price change",
      indicator: "IV ↑ > 20% but stock same",
      action: "Consider rolling early",
      actionType: "warning",
      reason: "Premiums inflated → re-enter later when IV settles.",
      ivNotes: "IV jump can widen spreads; re-sell later at higher credits."
    },
    {
      condition: "IV crush after event (e.g., earnings)",
      indicator: "IV ↓ > 30%",
      action: "Close if profit ≥ 30–50%",
      actionType: "profit",
      reason: "Theta + Vega gains realized; take the win.",
      ivNotes: "IV crush = time decay + Vega profit — lock it."
    },
    {
      condition: "Near expiration with full profit",
      indicator: "≤ 1 day to expiry and credit < $0.05",
      action: "Close position",
      actionType: "profit",
      reason: "Eliminate assignment risk; you've captured 90%+.",
      ivNotes: "IV often meaningless this close — liquidity risk > reward."
    },
    {
      condition: "After rolling twice in same name",
      indicator: "2+ rolls in a row",
      action: "Close completely and reset new setup",
      actionType: "danger",
      reason: "Avoid compounding risk or emotional attachment.",
      ivNotes: "Re-enter when IV normalizes and trend stabilizes."
    }
  ];

  const formulas = [
    { concept: "ROI", formula: "Credit / (Max loss)", example: "$0.28 / $0.72 = 39%" },
    { concept: "Breakeven", formula: "Short strike − credit", example: "e.g., 52 − 0.28 = 51.72" },
    { concept: "Theta gain target", formula: "Close ≤ ½ credit or ≈ +40–50% ROI", example: "" },
    { concept: "IV utilization", formula: "Sell when IV rank > 30%; roll if IV ↑ > 20%", example: "" }
  ];

  const weeklyRhythm = [
    { day: "Mon–Tue", focus: "Entry", action: "Find high-IV, liquid candidates; open new spread." },
    { day: "Wed–Thu", focus: "Review", action: "Take profits at 40–60% credit or roll if challenged." },
    { day: "Fri", focus: "Clean up", action: "Close all open spreads — never hold weekend exposure." }
  ];

  const getActionBadge = (actionType: string) => {
    switch (actionType) {
      case 'profit':
        return <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Profit</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>;
      case 'roll':
        return <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30"><RefreshCw className="w-3 h-3 mr-1" />Roll</Badge>;
      case 'danger':
        return <Badge className="bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Close</Badge>;
      case 'hold':
        return <Badge className="bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30"><Pause className="w-3 h-3 mr-1" />Hold</Badge>;
      default:
        return null;
    }
  };

  return (
    <PageLayout title="KaChing Credit Options Strategy Guide">
      <div className="space-y-6">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              💰 KaChing Profit & Roll Matrix
            </CardTitle>
            <CardDescription>
              Weekly Options Framework — Triggers for profit-taking, rolling, and IV behavior
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Matrix Table */}
        <Card>
          <CardHeader>
            <CardTitle>Decision Matrix</CardTitle>
            <CardDescription>Interactive guide for managing weekly credit spreads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Condition</TableHead>
                    <TableHead className="min-w-[200px]">Indicator / Trigger</TableHead>
                    <TableHead className="min-w-[180px]">Action</TableHead>
                    <TableHead className="min-w-[250px]">Reason / Book Principle</TableHead>
                    <TableHead className="min-w-[250px]">Notes on IV (Implied Volatility)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matrixData.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{row.condition}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.indicator}</TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {getActionBadge(row.actionType)}
                          <p className="text-sm mt-1">{row.action}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{row.reason}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.ivNotes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Reference Formulas */}
        <Card>
          <CardHeader>
            <CardTitle>🧠 Quick-reference Formulas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Concept</TableHead>
                  <TableHead>Formula</TableHead>
                  <TableHead>Example</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formulas.map((formula, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{formula.concept}</TableCell>
                    <TableCell className="font-mono text-sm">{formula.formula}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formula.example}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Weekly Rhythm */}
        <Card>
          <CardHeader>
            <CardTitle>🗓️ Suggested Weekly Rhythm</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead>Focus</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weeklyRhythm.map((day, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{day.day}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{day.focus}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{day.action}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Core Mindset */}
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📌 Core Mindset from the Book
            </CardTitle>
          </CardHeader>
          <CardContent>
            <blockquote className="text-lg font-medium italic text-center py-4 border-l-4 border-primary pl-4">
              "Trade small, trade often, define risk, and let Theta pay you—not the market."
            </blockquote>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
