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

        {/* Flowchart */}
        <Card>
          <CardHeader>
            <CardTitle>📋 KaChing Weekly Strategy Flowchart</CardTitle>
            <CardDescription>Step-by-step process from screening to supersizing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <pre className="text-sm bg-muted p-4 rounded-lg">
{`START
│
├──► STEP 1: SCREEN FOR CANDIDATES
│     ├─ Use liquid underlyings → SPY, QQQ, AAPL, MSFT, NVDA
│     ├─ Check: tight bid/ask (≤ $0.05), weekly options available
│     └─ Confirm IV Rank > 30% for richer premium
│
├──► STEP 2: DETERMINE MARKET BIAS
│     ├─ Use simple chart → support / resistance / trendline
│     └─ No prediction—just identify if bias is UP, DOWN, or NEUTRAL
│
├──► STEP 3: CHOOSE STRATEGY
│     ├─ Bull Put Spread → mild bullish to neutral
│     ├─ Bear Call Spread → mild bearish to neutral
│     └─ Iron Condor → neutral range bound play
│
├──► STEP 4: SET STRIKES (1–2 SD OUT OF MONEY)
│     ├─ Choose 5-point width (e.g. Sell 195 Put / Buy 190 Put)
│     ├─ Target credit ≈ $0.50–$1.00 per spread
│     └─ Risk ≤ 2% of account per trade
│
├──► STEP 5: PLACE THE TRADE
│     ├─ Sell weekly expiration (Friday)
│     └─ Record entry credit and chart support / resistance
│
├──► STEP 6: MANAGE THE POSITION
│     ├─ If 50% profit achieved → close early (Thu)
│     ├─ If price threatens short strike → adjust or roll
│     └─ Never let loss > max defined risk
│
├──► STEP 7: ADJUST WHEN NEEDED
│     ├─ Roll out a week to lower/higher strike (collect new credit)
│     ├─ Convert to Iron Condor to offset loss
│     ├─ Tighten spread width if volatility rises
│     └─ Think: "temporary investment in someone else's account"
│
├──► STEP 8: REVIEW & LOG
│     ├─ Note entry, exit, credit, result (% gain/loss)
│     └─ Track weekly goal (≈ 1% of equity)
│
├──► STEP 9: SUPERSIZE (WHEN CONSISTENT > 3 MO.)
│     ├─ Scale contracts incrementally (2 → 3 → 4)
│     ├─ Layer two Iron Condors (near & far OTM) = "Double KaChing"
│     ├─ Exploit high IV weeks for extra credit
│     └─ Consider diagonal or calendar spread upgrade (advanced)
│
└──► END → ENJOY FRIDAY PAYDAY & LOG WINS`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* IV & Theta Calculator Table */}
        <Card>
          <CardHeader>
            <CardTitle>⚙️ KaChing IV & Theta Quick-Calculator Table</CardTitle>
            <CardDescription>Weekly Options — Time-decay compass for managing Theta and IV</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Days to Expiration (DTE)</TableHead>
                    <TableHead>IV Rank Range</TableHead>
                    <TableHead>Expected Daily Theta Decay (% of Credit)</TableHead>
                    <TableHead>What to Expect / Action</TableHead>
                    <TableHead>Book Principle & Mindset</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell rowSpan={3} className="font-medium align-top">7–10 days</TableCell>
                    <TableCell>Low IV (&lt; 20%)</TableCell>
                    <TableCell className="font-mono">~5–7% / day</TableCell>
                    <TableCell className="text-sm">Smaller credits; choose safer strikes; expect slower decay.</TableCell>
                    <TableCell className="text-sm text-muted-foreground">"Low IV = skinny premiums; don't chase."</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Medium IV (20–40%)</TableCell>
                    <TableCell className="font-mono">~7–10% / day</TableCell>
                    <TableCell className="text-sm">Ideal for weekly KaChing spreads; smooth Theta decay.</TableCell>
                    <TableCell className="text-sm text-muted-foreground">"Moderate IV = sweet spot for steady income."</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>High IV (&gt; 40%)</TableCell>
                    <TableCell className="font-mono">~10–15% / day</TableCell>
                    <TableCell className="text-sm">Bigger premiums but wider risk swings; stay further OTM.</TableCell>
                    <TableCell className="text-sm text-muted-foreground">"High IV = opportunity with discipline."</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell rowSpan={3} className="font-medium align-top">5–6 days</TableCell>
                    <TableCell>Low</TableCell>
                    <TableCell className="font-mono">8–10% / day</TableCell>
                    <TableCell className="text-sm">Decay accelerates; close early if profit ≥ 50%.</TableCell>
                    <TableCell className="text-sm text-muted-foreground">Lock small gains; don't overstay.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Medium</TableCell>
                    <TableCell className="font-mono">10–15% / day</TableCell>
                    <TableCell className="text-sm">Watch Delta; roll if price nears short strike.</TableCell>
                    <TableCell className="text-sm text-muted-foreground">Theta &gt; Vega → sweet KaChing zone.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>High</TableCell>
                    <TableCell className="font-mono">15–20% / day</TableCell>
                    <TableCell className="text-sm">Rapid decay + fast moves possible; widen spreads.</TableCell>
                    <TableCell className="text-sm text-muted-foreground">Sell volatility only with defined risk.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell rowSpan={3} className="font-medium align-top">3–4 days</TableCell>
                    <TableCell>Low</TableCell>
                    <TableCell className="font-mono">12–15% / day</TableCell>
                    <TableCell className="text-sm">Time decay peaks but little premium left.</TableCell>
                    <TableCell className="text-sm text-muted-foreground">Take profits &gt; 40–60%.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Medium</TableCell>
                    <TableCell className="font-mono">15–25% / day</TableCell>
                    <TableCell className="text-sm">Most decay happens → close before news events.</TableCell>
                    <TableCell className="text-sm text-muted-foreground">"Collect and reset."</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>High</TableCell>
                    <TableCell className="font-mono">25–30% / day</TableCell>
                    <TableCell className="text-sm">Wild Gamma moves; do not hold into expiration.</TableCell>
                    <TableCell className="text-sm text-muted-foreground">"Fast money = fast risk."</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">1–2 days</TableCell>
                    <TableCell>Any</TableCell>
                    <TableCell className="font-mono">30–50% / day</TableCell>
                    <TableCell className="text-sm">Near expiration: assignment risk &gt; reward.</TableCell>
                    <TableCell className="text-sm text-muted-foreground">Close positions; sleep well.</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Formulas for Calculator */}
        <Card>
          <CardHeader>
            <CardTitle>🧮 Quick Formulas for Reference</CardTitle>
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
                <TableRow>
                  <TableCell className="font-medium">Approx. Theta per day</TableCell>
                  <TableCell className="font-mono text-sm">(Credit × Daily Decay %)</TableCell>
                  <TableCell className="text-sm text-muted-foreground">$0.40 × 10% = $0.04/day</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Time Decay Target</TableCell>
                  <TableCell className="font-mono text-sm">Credit × 50% → exit</TableCell>
                  <TableCell className="text-sm text-muted-foreground">$0.40 × 0.5 = $0.20 buy-to-close</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">ROI per Week</TableCell>
                  <TableCell className="font-mono text-sm">(Credit / Max Risk) × 100</TableCell>
                  <TableCell className="text-sm text-muted-foreground">$0.30 / $0.70 = 43% ROI</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">IV Adjustment for Strike Distance</TableCell>
                  <TableCell className="font-mono text-sm">For each +10 IV pts → go ~0.5 SD further OTM</TableCell>
                  <TableCell className="text-sm text-muted-foreground">If IV 60 → choose 2 SD away instead of 1.5 SD</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* IV Effect on Credit & Risk */}
        <Card>
          <CardHeader>
            <CardTitle>📊 IV Effect on Credit & Risk (Visual Guide)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IV Rank</TableHead>
                  <TableHead>Premium Size</TableHead>
                  <TableHead>Risk Volatility</TableHead>
                  <TableHead>Strategy Bias</TableHead>
                  <TableHead>Book Comment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">0–20</TableCell>
                  <TableCell>Low</TableCell>
                  <TableCell>Low</TableCell>
                  <TableCell className="text-sm">Avoid new entries unless super OTM</TableCell>
                  <TableCell className="text-sm text-muted-foreground">"IV desert — little juice left."</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">20–40</TableCell>
                  <TableCell>Medium</TableCell>
                  <TableCell>Moderate</TableCell>
                  <TableCell className="text-sm">Prime weekly KaChing zone</TableCell>
                  <TableCell className="text-sm text-muted-foreground">"Sweet spot for Theta harvest."</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">40–60</TableCell>
                  <TableCell>High</TableCell>
                  <TableCell>Elevated</TableCell>
                  <TableCell className="text-sm">Sell further OTM or reduce size</TableCell>
                  <TableCell className="text-sm text-muted-foreground">"More premium = more discipline."</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">60–80</TableCell>
                  <TableCell>Very High</TableCell>
                  <TableCell>High</TableCell>
                  <TableCell className="text-sm">Prefer defined-risk only (spreads)</TableCell>
                  <TableCell className="text-sm text-muted-foreground">"Collect premium while others panic."</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">&gt; 80</TableCell>
                  <TableCell>Extreme</TableCell>
                  <TableCell>Extreme</TableCell>
                  <TableCell className="text-sm">Wait for vol to calm or sell tiny size</TableCell>
                  <TableCell className="text-sm text-muted-foreground">"High IV = fear in the air — be patient."</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Mini Summary */}
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>🧠 Mini Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Theta accelerates as expiration nears; IV dictates how rich that Theta is.</li>
              <li>Sell when IV Rank &gt; 30%, close when you've harvested ~50% of credit.</li>
              <li>Rising IV = roll out/down; falling IV = take profits sooner.</li>
              <li>Best combo: 7-day trades, IV Rank 30–45%, credit 0.30–0.50 × width.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
