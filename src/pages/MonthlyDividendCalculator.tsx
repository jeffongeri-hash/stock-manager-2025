import { useState, useMemo } from 'react';
import { SeoCalculatorPage } from '@/components/seo/SeoCalculatorPage';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

export default function MonthlyDividendCalculator() {
  const [shares, setShares] = useState(100);
  const [price, setPrice] = useState(50);
  const [yieldPct, setYieldPct] = useState(6);
  const [years, setYears] = useState(20);
  const [growth, setGrowth] = useState(5); // dividend growth %

  const { data, today, dripFinal, noDripFinal } = useMemo(() => {
    const invested = shares * price;
    const y = yieldPct / 100;
    const g = growth / 100;

    const rows: { year: number; withDRIP: number; withoutDRIP: number }[] = [];
    let dripBal = invested;
    let curYield = y;

    for (let yr = 0; yr <= years; yr++) {
      // With DRIP: balance compounds via reinvested dividends, yield grows
      const dripAnnual = dripBal * curYield;
      // Without DRIP: original balance only, yield still grows on a per-share basis
      const noDripAnnual = invested * curYield;

      rows.push({
        year: yr,
        withDRIP: +(dripAnnual / 12).toFixed(2),
        withoutDRIP: +(noDripAnnual / 12).toFixed(2),
      });

      // Advance to next year
      if (yr < years) {
        dripBal += dripAnnual; // reinvest
        curYield *= 1 + g;     // dividend growth
      }
    }

    return {
      data: rows,
      today: (invested * y) / 12,
      dripFinal: rows[rows.length - 1].withDRIP,
      noDripFinal: rows[rows.length - 1].withoutDRIP,
    };
  }, [shares, price, yieldPct, years, growth]);

  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

  return (
    <SeoCalculatorPage
      path="/monthly-dividend-calculator"
      title="Monthly Dividend Calculator — Free Passive Income Tracker"
      h1="Monthly Dividend Calculator & Tracker"
      description="Calculate monthly dividend income, project DRIP compounding, and track passive income from monthly dividend stocks and REITs. Free, no signup."
      keywords={['monthly dividend calculator', 'monthly dividend tracker', 'dividend income tracker', 'passive income tracker', 'dividend reinvestment calculator', 'drip calculator', 'monthly dividend stocks']}
      ctaHref="/dividend-tracker"
      ctaLabel="Open the full Dividend Tracker"
      faqs={[
        { q: 'How is monthly dividend income calculated?', a: 'Monthly dividend = (shares × price × yield%) ÷ 12. For example, $10,000 invested at a 6% yield pays $600/year, or $50/month. Monthly-paying stocks distribute this in equal monthly installments instead of quarterly.' },
        { q: 'What are the best monthly dividend stocks?', a: 'Popular monthly payers include Realty Income (O), Main Street Capital (MAIN), STAG Industrial (STAG), Pembina Pipeline (PBA), and Agree Realty (ADC). REITs and BDCs dominate the monthly-dividend universe. Always verify current yields and payout sustainability before investing.' },
        { q: 'What is DRIP and should I use it?', a: 'DRIP (Dividend Reinvestment Plan) automatically reinvests dividends into more shares. Over decades, DRIP can roughly double your final portfolio value compared to taking dividends as cash. Use it during accumulation; turn it off once you need the income.' },
        { q: 'Are dividends taxed?', a: 'Qualified dividends are taxed at long-term capital gains rates (0%, 15%, or 20% in the US). Non-qualified dividends (most REITs, BDCs) are taxed as ordinary income. Hold dividend-heavy positions in IRAs or 401(k)s when possible.' },
        { q: 'How much do I need invested for $1,000/month in dividends?', a: 'At a 4% yield you need $300,000. At 6%, $200,000. At 8% (riskier), $150,000. Diversify across yields and sectors — chasing the highest yields often means the highest risk of cuts.' },
      ]}
    >
      <Card className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sh">Shares owned</Label>
            <Input id="sh" type="number" value={shares} onChange={(e) => setShares(+e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pr">Price per share ($)</Label>
            <Input id="pr" type="number" step="0.01" value={price} onChange={(e) => setPrice(+e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="y">Annual yield (%)</Label>
            <Input id="y" type="number" step="0.1" value={yieldPct} onChange={(e) => setYieldPct(+e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="g">Annual dividend growth (%)</Label>
            <Input id="g" type="number" step="0.1" value={growth} onChange={(e) => setGrowth(+e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="yr">Projection years</Label>
            <Input id="yr" type="number" value={years} onChange={(e) => setYears(+e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
          <Stat label="Monthly income today" value={fmt(today)} />
          <Stat label={`Monthly in ${years}y — no DRIP`} value={fmt(noDripFinal)} />
          <Stat label={`Monthly in ${years}y — with DRIP`} value={fmt(dripFinal)} highlight />
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-lg font-semibold">
            Projected monthly dividend income
          </h3>
          <p className="text-xs text-muted-foreground">
            Hover the chart to compare reinvesting dividends (DRIP) vs. taking them as cash.
          </p>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="year"
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(v) => `Y${v}`}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                  }}
                  formatter={(v: number) => fmt(v)}
                  labelFormatter={(l) => `Year ${l}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="withDRIP"
                  name="With DRIP"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="withoutDRIP"
                  name="Without DRIP"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <section className="prose prose-invert max-w-none">
        <h2 className="font-display text-2xl font-semibold mt-8 mb-3">Why monthly dividends?</h2>
        <p className="text-muted-foreground leading-relaxed">
          Monthly-paying stocks (mostly REITs, BDCs, and a handful of CEFs) align cash flow with
          monthly bills, making them popular for retirees and FIRE-seekers building passive income.
          Compared to quarterly payers, monthly distributions compound slightly faster under DRIP
          and feel more like a real paycheck — useful psychology for staying the course.
        </p>
      </section>
    </SeoCalculatorPage>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-lg ${highlight ? 'bg-primary/10 border border-primary/30' : 'bg-muted/20 border border-border'}`}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className="font-mono text-xl font-semibold">{value}</div>
    </div>
  );
}
