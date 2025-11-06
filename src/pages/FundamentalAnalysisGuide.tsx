import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, TrendingUp, BarChart3, DollarSign, Shield, Brain } from "lucide-react";
import { useState } from "react";

const FundamentalAnalysisGuide = () => {
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
    <PageLayout title="Fundamental Analysis Guide">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardDescription>
              Master checklist for stock analysis using William J. O'Neil's methodology and comparative investment philosophies
            </CardDescription>
          </CardHeader>
        </Card>
        {/* Introduction */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Complete Master Checklist
            </CardTitle>
            <CardDescription>
              A comprehensive guide combining fundamental analysis (CAN SLIM), technical analysis, market analysis, and buy/sell discipline based on William J. O'Neil's "How to Make Money in Stocks"
            </CardDescription>
          </CardHeader>
        </Card>

        {/* I. Fundamental Analysis - CAN */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              I. Fundamental Analysis — "C-A-N"
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Step</TableHead>
                  <TableHead>What to Check</TableHead>
                  <TableHead>O'Neil's Benchmark</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('can-1')}
                      onCheckedChange={() => toggleCheck('can-1')}
                    />
                  </TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>Current quarterly EPS growth (C)</TableCell>
                  <TableCell>≥ +25–50% YoY (the higher, the better)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('can-2')}
                      onCheckedChange={() => toggleCheck('can-2')}
                    />
                  </TableCell>
                  <TableCell>2</TableCell>
                  <TableCell>Quarterly sales (revenue) growth</TableCell>
                  <TableCell>≥ +25% YoY</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('can-3')}
                      onCheckedChange={() => toggleCheck('can-3')}
                    />
                  </TableCell>
                  <TableCell>3</TableCell>
                  <TableCell>Annual EPS growth (A)</TableCell>
                  <TableCell>≥ +25% CAGR for past 3 years</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('can-4')}
                      onCheckedChange={() => toggleCheck('can-4')}
                    />
                  </TableCell>
                  <TableCell>4</TableCell>
                  <TableCell>Return on equity (ROE)</TableCell>
                  <TableCell>≥ 17%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('can-5')}
                      onCheckedChange={() => toggleCheck('can-5')}
                    />
                  </TableCell>
                  <TableCell>5</TableCell>
                  <TableCell>Profit margins</TableCell>
                  <TableCell>Expanding vs prior year</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('can-6')}
                      onCheckedChange={() => toggleCheck('can-6')}
                    />
                  </TableCell>
                  <TableCell>6</TableCell>
                  <TableCell>Debt-to-equity ratio</TableCell>
                  <TableCell>Low or declining</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('can-7')}
                      onCheckedChange={() => toggleCheck('can-7')}
                    />
                  </TableCell>
                  <TableCell>7</TableCell>
                  <TableCell>New catalyst (N)</TableCell>
                  <TableCell>New product, service, management, or new price highs</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('can-8')}
                      onCheckedChange={() => toggleCheck('can-8')}
                    />
                  </TableCell>
                  <TableCell>8</TableCell>
                  <TableCell>Institutional sponsorship (I)</TableCell>
                  <TableCell>Increasing over time; not overcrowded</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('can-9')}
                      onCheckedChange={() => toggleCheck('can-9')}
                    />
                  </TableCell>
                  <TableCell>9</TableCell>
                  <TableCell>Industry leadership (L)</TableCell>
                  <TableCell>Top in its field; RS Rating ≥ 80</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('can-10')}
                      onCheckedChange={() => toggleCheck('can-10')}
                    />
                  </TableCell>
                  <TableCell>10</TableCell>
                  <TableCell>Shares outstanding (S)</TableCell>
                  <TableCell>Lower float = greater supply/demand effect</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* II. Technical Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              II. Technical Analysis — "L-I-M" + Chart Reading
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Step</TableHead>
                  <TableHead>Technical Signal</TableHead>
                  <TableHead>Ideal Pattern / Condition</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('tech-1')}
                      onCheckedChange={() => toggleCheck('tech-1')}
                    />
                  </TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>Market Direction (M)</TableCell>
                  <TableCell>Confirm uptrend via follow-through day</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('tech-2')}
                      onCheckedChange={() => toggleCheck('tech-2')}
                    />
                  </TableCell>
                  <TableCell>2</TableCell>
                  <TableCell>Relative Strength (RS) line</TableCell>
                  <TableCell>Rising before breakout</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('tech-3')}
                      onCheckedChange={() => toggleCheck('tech-3')}
                    />
                  </TableCell>
                  <TableCell>3</TableCell>
                  <TableCell>Volume trends</TableCell>
                  <TableCell>Higher volume on up days, lower on down days</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('tech-4')}
                      onCheckedChange={() => toggleCheck('tech-4')}
                    />
                  </TableCell>
                  <TableCell>4</TableCell>
                  <TableCell>Base pattern</TableCell>
                  <TableCell>Cup-with-handle, double bottom, flat base, etc.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('tech-5')}
                      onCheckedChange={() => toggleCheck('tech-5')}
                    />
                  </TableCell>
                  <TableCell>5</TableCell>
                  <TableCell>Handle depth</TableCell>
                  <TableCell>≤ 15% correction from high</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('tech-6')}
                      onCheckedChange={() => toggleCheck('tech-6')}
                    />
                  </TableCell>
                  <TableCell>6</TableCell>
                  <TableCell>Pivot point</TableCell>
                  <TableCell>Breakout price where stock clears resistance on volume ≥ 40% above average</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('tech-7')}
                      onCheckedChange={() => toggleCheck('tech-7')}
                    />
                  </TableCell>
                  <TableCell>7</TableCell>
                  <TableCell>Moving averages</TableCell>
                  <TableCell>Price above 50-day and 200-day MA</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('tech-8')}
                      onCheckedChange={() => toggleCheck('tech-8')}
                    />
                  </TableCell>
                  <TableCell>8</TableCell>
                  <TableCell>Tight price action near highs</TableCell>
                  <TableCell>Shows institutional accumulation</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('tech-9')}
                      onCheckedChange={() => toggleCheck('tech-9')}
                    />
                  </TableCell>
                  <TableCell>9</TableCell>
                  <TableCell>Avoid wide-and-loose charts</TableCell>
                  <TableCell>Indicates volatility and lack of support</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('tech-10')}
                      onCheckedChange={() => toggleCheck('tech-10')}
                    />
                  </TableCell>
                  <TableCell>10</TableCell>
                  <TableCell>Post-breakout behavior</TableCell>
                  <TableCell>Should rise 10–20% quickly; volume should confirm</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* III. Market Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              III. Market Analysis — Follow the General Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Step</TableHead>
                  <TableHead>Market Signal</TableHead>
                  <TableHead>Interpretation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('market-1')}
                      onCheckedChange={() => toggleCheck('market-1')}
                    />
                  </TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>Identify market direction</TableCell>
                  <TableCell>Use indexes (Nasdaq, S&P 500, Dow)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('market-2')}
                      onCheckedChange={() => toggleCheck('market-2')}
                    />
                  </TableCell>
                  <TableCell>2</TableCell>
                  <TableCell>Follow-Through Day (FTD)</TableCell>
                  <TableCell>4–7 days after low, index up ≥1.7% on higher volume</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('market-3')}
                      onCheckedChange={() => toggleCheck('market-3')}
                    />
                  </TableCell>
                  <TableCell>3</TableCell>
                  <TableCell>Distribution days</TableCell>
                  <TableCell>≥ 5–6 within 3 weeks = uptrend likely ending</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('market-4')}
                      onCheckedChange={() => toggleCheck('market-4')}
                    />
                  </TableCell>
                  <TableCell>4</TableCell>
                  <TableCell>Sector rotation</TableCell>
                  <TableCell>Check leading sectors (tech, healthcare, etc.)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('market-5')}
                      onCheckedChange={() => toggleCheck('market-5')}
                    />
                  </TableCell>
                  <TableCell>5</TableCell>
                  <TableCell>Confirm leadership</TableCell>
                  <TableCell>Strongest stocks lead early in new rally</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* IV. Buy Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              IV. Buy Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Step</TableHead>
                  <TableHead>Buy Condition</TableHead>
                  <TableHead>Guideline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('buy-1')}
                      onCheckedChange={() => toggleCheck('buy-1')}
                    />
                  </TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>Buy near breakout/pivot</TableCell>
                  <TableCell>Within 5% of pivot price</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('buy-2')}
                      onCheckedChange={() => toggleCheck('buy-2')}
                    />
                  </TableCell>
                  <TableCell>2</TableCell>
                  <TableCell>Volume confirmation</TableCell>
                  <TableCell>Breakout volume ≥ 40% above average</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('buy-3')}
                      onCheckedChange={() => toggleCheck('buy-3')}
                    />
                  </TableCell>
                  <TableCell>3</TableCell>
                  <TableCell>Buy leading stocks</TableCell>
                  <TableCell>In top 40 industry groups</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('buy-4')}
                      onCheckedChange={() => toggleCheck('buy-4')}
                    />
                  </TableCell>
                  <TableCell>4</TableCell>
                  <TableCell>Avoid extended stocks</TableCell>
                  <TableCell>Don't chase &gt;5% above pivot</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('buy-5')}
                      onCheckedChange={() => toggleCheck('buy-5')}
                    />
                  </TableCell>
                  <TableCell>5</TableCell>
                  <TableCell>Add on strength</TableCell>
                  <TableCell>Add when stock gains +2–3% from prior add point on volume</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* V. Sell & Risk Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              V. Sell & Risk Management Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Step</TableHead>
                  <TableHead>Sell Condition</TableHead>
                  <TableHead>O'Neil Rule</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('sell-1')}
                      onCheckedChange={() => toggleCheck('sell-1')}
                    />
                  </TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>Cut losses quickly</TableCell>
                  <TableCell>Sell if –7% to –8% below buy point</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('sell-2')}
                      onCheckedChange={() => toggleCheck('sell-2')}
                    />
                  </TableCell>
                  <TableCell>2</TableCell>
                  <TableCell>Protect profits</TableCell>
                  <TableCell>Sell partials after +20–25% gain (unless powerful stock in early-stage bull)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('sell-3')}
                      onCheckedChange={() => toggleCheck('sell-3')}
                    />
                  </TableCell>
                  <TableCell>3</TableCell>
                  <TableCell>Watch for climax runs</TableCell>
                  <TableCell>Big volume + vertical rise → take profits</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('sell-4')}
                      onCheckedChange={() => toggleCheck('sell-4')}
                    />
                  </TableCell>
                  <TableCell>4</TableCell>
                  <TableCell>Distribution signals</TableCell>
                  <TableCell>Heavy selling volume = institutional exit</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('sell-5')}
                      onCheckedChange={() => toggleCheck('sell-5')}
                    />
                  </TableCell>
                  <TableCell>5</TableCell>
                  <TableCell>Break of 50-day MA on heavy volume</TableCell>
                  <TableCell>Often signals end of run</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('sell-6')}
                      onCheckedChange={() => toggleCheck('sell-6')}
                    />
                  </TableCell>
                  <TableCell>6</TableCell>
                  <TableCell>Sell laggards</TableCell>
                  <TableCell>Rotate into stronger leaders</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('sell-7')}
                      onCheckedChange={() => toggleCheck('sell-7')}
                    />
                  </TableCell>
                  <TableCell>7</TableCell>
                  <TableCell>Re-evaluate fundamentals</TableCell>
                  <TableCell>Growth deceleration or poor quarterly report</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* VI. Mindset & Habits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              VI. Mindset & Habits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Step</TableHead>
                  <TableHead>Discipline</TableHead>
                  <TableHead>Why It Matters</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('mindset-1')}
                      onCheckedChange={() => toggleCheck('mindset-1')}
                    />
                  </TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>Keep a watchlist</TableCell>
                  <TableCell>Track 20–30 top stocks forming bases</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('mindset-2')}
                      onCheckedChange={() => toggleCheck('mindset-2')}
                    />
                  </TableCell>
                  <TableCell>2</TableCell>
                  <TableCell>Maintain a trading journal</TableCell>
                  <TableCell>Record reasons for entry/exit</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('mindset-3')}
                      onCheckedChange={() => toggleCheck('mindset-3')}
                    />
                  </TableCell>
                  <TableCell>3</TableCell>
                  <TableCell>Study past winners</TableCell>
                  <TableCell>Learn recurring patterns (e.g., AAPL, TSLA, NVDA)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('mindset-4')}
                      onCheckedChange={() => toggleCheck('mindset-4')}
                    />
                  </TableCell>
                  <TableCell>4</TableCell>
                  <TableCell>Focus on quality over quantity</TableCell>
                  <TableCell>Only buy true leaders</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('mindset-5')}
                      onCheckedChange={() => toggleCheck('mindset-5')}
                    />
                  </TableCell>
                  <TableCell>5</TableCell>
                  <TableCell>Stay objective</TableCell>
                  <TableCell>Price and volume action &gt; opinions</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('mindset-6')}
                      onCheckedChange={() => toggleCheck('mindset-6')}
                    />
                  </TableCell>
                  <TableCell>6</TableCell>
                  <TableCell>Avoid averaging down</TableCell>
                  <TableCell>Only add to winners, never losers</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Checkbox 
                      checked={checkedItems.has('mindset-7')}
                      onCheckedChange={() => toggleCheck('mindset-7')}
                    />
                  </TableCell>
                  <TableCell>7</TableCell>
                  <TableCell>Follow rules precisely</TableCell>
                  <TableCell>Small errors compound over time</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Summary Flow */}
        <Card>
          <CardHeader>
            <CardTitle>Summary Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge>1</Badge>
                <span className="font-medium">Fundamentals (CAN SLIM) ✅</span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <span className="text-muted-foreground">↓</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge>2</Badge>
                <span className="font-medium">Technical Setup (Bases, Volume, RS) ✅</span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <span className="text-muted-foreground">↓</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge>3</Badge>
                <span className="font-medium">Market Trend (Uptrend confirmed) ✅</span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <span className="text-muted-foreground">↓</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge>4</Badge>
                <span className="font-medium">Buy near Pivot with Volume ✅</span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <span className="text-muted-foreground">↓</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge>5</Badge>
                <span className="font-medium">Cut losses &lt;8%, Take profits &gt;20–25% ✅</span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <span className="text-muted-foreground">↓</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge>6</Badge>
                <span className="font-medium">Repeat with leading stocks in leading markets ✅</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparative Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Investment Philosophy Comparison</CardTitle>
            <CardDescription>O'Neil vs. Buffett vs. Ackman vs. Shkreli vs. Lynch</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investor</TableHead>
                  <TableHead>Core Style</TableHead>
                  <TableHead>Primary Focus</TableHead>
                  <TableHead>Typical Holding Period</TableHead>
                  <TableHead>Key Metrics</TableHead>
                  <TableHead>Philosophy Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">William O'Neil</TableCell>
                  <TableCell>Growth + Momentum (CAN SLIM)</TableCell>
                  <TableCell>Explosive earnings & sales growth, chart breakouts, institutional demand</TableCell>
                  <TableCell>Weeks to months (up to 1 year)</TableCell>
                  <TableCell>EPS +25–50%, 3-year annual growth +25%, ROE ≥17%, new products, volume confirmation</TableCell>
                  <TableCell>Buy the next big winner early using technical + fundamental signals; sell fast if wrong (–7–8% rule)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Warren Buffett</TableCell>
                  <TableCell>Value + Moat + Management Quality</TableCell>
                  <TableCell>Intrinsic value, durable competitive advantage, capital allocation</TableCell>
                  <TableCell>10–20 years (often forever)</TableCell>
                  <TableCell>ROE ≥15%, ROA high, consistent margins, low debt, free cash flow, economic moat</TableCell>
                  <TableCell>Buy wonderful businesses at fair prices and compound over decades; focus on quality and predictability</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Bill Ackman</TableCell>
                  <TableCell>Concentrated Activist Value</TableCell>
                  <TableCell>Undervalued, high-quality companies he can influence operationally</TableCell>
                  <TableCell>3–10 years</TableCell>
                  <TableCell>FCF yield, ROIC, balance sheet strength, recurring revenue</TableCell>
                  <TableCell>Concentrated bets + active involvement; long-term compounding through fundamental improvement</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Martin Shkreli</TableCell>
                  <TableCell>Event-driven / Special Situations (esp. biotech)</TableCell>
                  <TableCell>Pipeline catalysts, mispriced assets, asymmetric risk/reward</TableCell>
                  <TableCell>Months to few years (pre-event)</TableCell>
                  <TableCell>EV/EBITDA, cash per share, P/E compression, clinical pipeline milestones</TableCell>
                  <TableCell>Buy misunderstood or distressed assets before catalysts; very high risk/high reward</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Peter Lynch</TableCell>
                  <TableCell>Growth at a Reasonable Price (GARP)</TableCell>
                  <TableCell>EPS growth + business understanding + reasonable valuation</TableCell>
                  <TableCell>3–10 years</TableCell>
                  <TableCell>PEG ratio ≤1.0, EPS growth 15–30%, ROE &gt;15%, modest debt</TableCell>
                  <TableCell>Buy what you understand; small, overlooked companies can grow 10–100x over time ("tenbaggers")</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Key Differences in Fundamental Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Key Differences in Fundamental Analysis Focus</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aspect</TableHead>
                  <TableHead>O'Neil</TableHead>
                  <TableHead>Buffett</TableHead>
                  <TableHead>Ackman</TableHead>
                  <TableHead>Shkreli</TableHead>
                  <TableHead>Lynch</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">EPS Growth</TableCell>
                  <TableCell>25–50%+ (quarterly & annual)</TableCell>
                  <TableCell>Steady & predictable</TableCell>
                  <TableCell>Moderate but sustainable</TableCell>
                  <TableCell>Irregular, depends on catalyst</TableCell>
                  <TableCell>15–30% long-term growth</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Revenue Growth</TableCell>
                  <TableCell>≥25% YoY</TableCell>
                  <TableCell>Moderate, consistent</TableCell>
                  <TableCell>Steady recurring cash flows</TableCell>
                  <TableCell>Volatile (sector-driven)</TableCell>
                  <TableCell>Moderate–strong, with scalability</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">ROE / ROIC</TableCell>
                  <TableCell>≥17%</TableCell>
                  <TableCell>≥15–20%</TableCell>
                  <TableCell>≥15% ROIC</TableCell>
                  <TableCell>Variable</TableCell>
                  <TableCell>≥15%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">ROA</TableCell>
                  <TableCell>Ignored</TableCell>
                  <TableCell>Important</TableCell>
                  <TableCell>Important</TableCell>
                  <TableCell>Secondary</TableCell>
                  <TableCell>Moderate importance</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Debt Levels</TableCell>
                  <TableCell>Low to moderate</TableCell>
                  <TableCell>Prefer low</TableCell>
                  <TableCell>Acceptable if accretive</TableCell>
                  <TableCell>Varies widely</TableCell>
                  <TableCell>Moderate</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Profit Margins</TableCell>
                  <TableCell>Expanding trend</TableCell>
                  <TableCell>Consistent high</TableCell>
                  <TableCell>Improving through activism</TableCell>
                  <TableCell>Unstable (biotech)</TableCell>
                  <TableCell>Improving over time</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Valuation Focus</TableCell>
                  <TableCell>Minimal (price/volume over value)</TableCell>
                  <TableCell>Deep (DCF, margin of safety)</TableCell>
                  <TableCell>DCF + relative valuation</TableCell>
                  <TableCell>EV/EBITDA or intrinsic event value</TableCell>
                  <TableCell>PEG ≤ 1.0</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Catalyst Needed?</TableCell>
                  <TableCell>Yes (new product, new highs)</TableCell>
                  <TableCell>No</TableCell>
                  <TableCell>Yes (activism)</TableCell>
                  <TableCell>Yes (clinical, legal, or turnaround event)</TableCell>
                  <TableCell>Sometimes (new product or expansion)</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Investment Time Horizon */}
        <Card>
          <CardHeader>
            <CardTitle>Investment Time Horizon Philosophy</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investor</TableHead>
                  <TableHead>Short-Term (Months)</TableHead>
                  <TableHead>Medium-Term (1–3 Years)</TableHead>
                  <TableHead>Long-Term (5–20+ Years)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">O'Neil</TableCell>
                  <TableCell><Badge variant="default">✅ Core window</Badge></TableCell>
                  <TableCell><Badge variant="default">✅ Sometimes if trend persists</Badge></TableCell>
                  <TableCell><Badge variant="outline">❌ Rare</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Buffett</TableCell>
                  <TableCell><Badge variant="outline">❌</Badge></TableCell>
                  <TableCell><Badge variant="default">✅</Badge></TableCell>
                  <TableCell><Badge variant="default">✅ Core window</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Ackman</TableCell>
                  <TableCell><Badge variant="outline">❌</Badge></TableCell>
                  <TableCell><Badge variant="default">✅</Badge></TableCell>
                  <TableCell><Badge variant="default">✅ (3–10 years typical)</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Shkreli</TableCell>
                  <TableCell><Badge variant="default">✅ (catalyst horizon)</Badge></TableCell>
                  <TableCell><Badge variant="default">✅ (1–3 years)</Badge></TableCell>
                  <TableCell><Badge variant="outline">❌ Rarely long-term</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Lynch</TableCell>
                  <TableCell><Badge variant="outline">❌</Badge></TableCell>
                  <TableCell><Badge variant="default">✅</Badge></TableCell>
                  <TableCell><Badge variant="default">✅ (ride 10x growth stories)</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Decision-Making Style */}
        <Card>
          <CardHeader>
            <CardTitle>Decision-Making Style</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investor</TableHead>
                  <TableHead>Quantitative or Qualitative?</TableHead>
                  <TableHead>Active or Passive?</TableHead>
                  <TableHead>Risk Management</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">O'Neil</TableCell>
                  <TableCell>50/50 — strict rules + chart reading</TableCell>
                  <TableCell>Active trading</TableCell>
                  <TableCell>Cut losses fast (–7–8%)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Buffett</TableCell>
                  <TableCell>Mostly qualitative + valuation models</TableCell>
                  <TableCell>Passive (buy & hold)</TableCell>
                  <TableCell>Diversify across quality businesses</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Ackman</TableCell>
                  <TableCell>Quantitative + activist influence</TableCell>
                  <TableCell>Active engagement</TableCell>
                  <TableCell>Hedging, concentrated bets</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Shkreli</TableCell>
                  <TableCell>Quantitative (biotech events)</TableCell>
                  <TableCell>Highly active</TableCell>
                  <TableCell>High risk tolerance</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Lynch</TableCell>
                  <TableCell>Qualitative ("invest in what you know")</TableCell>
                  <TableCell>Active but long-term</TableCell>
                  <TableCell>Diversity across ideas</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Philosophical Core */}
        <Card>
          <CardHeader>
            <CardTitle>Philosophical Core</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-primary pl-4">
                <p className="font-medium">O'Neil</p>
                <p className="text-muted-foreground">"The market is never wrong — follow price and earnings momentum."</p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <p className="font-medium">Buffett</p>
                <p className="text-muted-foreground">"Be fearful when others are greedy; buy great businesses at fair prices."</p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <p className="font-medium">Ackman</p>
                <p className="text-muted-foreground">"Great companies can be improved by great governance."</p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <p className="font-medium">Shkreli</p>
                <p className="text-muted-foreground">"Information asymmetry and timing drive outsized returns."</p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <p className="font-medium">Lynch</p>
                <p className="text-muted-foreground">"Know what you own — invest in companies you understand."</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Final Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Which Investor Should You Study?</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>If You're Looking For...</TableHead>
                  <TableHead>Investor to Study</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Fast-growing stocks with clear breakout patterns</TableCell>
                  <TableCell className="font-medium">O'Neil</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Safe compounding and durable competitive advantages</TableCell>
                  <TableCell className="font-medium">Buffett</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Catalyst-driven long-term turnaround plays</TableCell>
                  <TableCell className="font-medium">Ackman</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Deep asymmetric biotech or event-driven bets</TableCell>
                  <TableCell className="font-medium">Shkreli</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Understandable growth at fair prices</TableCell>
                  <TableCell className="font-medium">Lynch</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default FundamentalAnalysisGuide;
