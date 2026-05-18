import { useState, useMemo } from 'react';
import { SeoCalculatorPage } from '@/components/seo/SeoCalculatorPage';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function FinancialIndependenceCalculator() {
  const [currentNW, setCurrentNW] = useState(50000);
  const [monthly, setMonthly] = useState(2000);
  const [annualExpenses, setAnnualExpenses] = useState(40000);
  const [returnRate, setReturnRate] = useState(7);
  const [withdrawalRate, setWithdrawalRate] = useState(4);

  const result = useMemo(() => {
    const fireNumber = (annualExpenses * 100) / withdrawalRate;
    const r = returnRate / 100 / 12;
    const annualContrib = monthly * 12;
    let balance = currentNW;
    let months = 0;
    while (balance < fireNumber && months < 12 * 80) {
      balance = balance * (1 + r) + monthly;
      months++;
    }
    const years = months / 12;
    return { fireNumber, years, balance, annualContrib };
  }, [currentNW, monthly, annualExpenses, returnRate, withdrawalRate]);

  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

  return (
    <SeoCalculatorPage
      path="/financial-independence-calculator"
      title="Financial Independence Calculator — Free FIRE Number Tool"
      h1="Financial Independence Calculator"
      description="Calculate how many years until you reach financial independence (FIRE). Free FI calculator using the 4% rule, your savings rate, and expected returns."
      keywords={['financial independence calculator', 'fire calculator', 'fi calculator', 'fire number calculator', 'retire early calculator', '4 percent rule calculator']}
      ctaHref="/fire-guide"
      ctaLabel="Open the full FIRE planner"
      faqs={[
        { q: 'What is the FIRE number?', a: 'Your FIRE number is the portfolio size that supports your lifestyle indefinitely using safe withdrawals. The standard formula is annual expenses × 25 (the inverse of the 4% rule). $40,000/year of spending requires a $1,000,000 portfolio.' },
        { q: 'How accurate is the 4% rule?', a: 'The 4% rule comes from the Trinity Study and has held up across most 30-year historical periods. For longer retirements (40–60 years common in FIRE), many planners reduce to 3.25–3.5% to add safety margin.' },
        { q: 'What return assumption should I use?', a: 'A 6–7% real return (after inflation) is reasonable for a diversified equity portfolio. Use 5% if you want to be conservative or include bonds, 8% for an aggressive equity-only assumption.' },
        { q: 'Does this calculator account for inflation?', a: 'Yes — using a real (inflation-adjusted) return rate means your final number is already in today\'s dollars. No need to inflate your expenses separately.' },
        { q: 'What is the difference between Lean FIRE, Coast FIRE, and Fat FIRE?', a: 'Lean FIRE: frugal lifestyle (~$25–40K/yr, ~$625K–$1M portfolio). Regular FIRE: middle-class lifestyle (~$50–80K/yr). Fat FIRE: comfortable lifestyle ($100K+/yr, $2.5M+ portfolio). Coast FIRE is a milestone where contributions become optional.' },
      ]}
    >
      <Card className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nw">Current invested net worth ($)</Label>
            <Input id="nw" type="number" value={currentNW} onChange={(e) => setCurrentNW(+e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="m">Monthly contribution ($)</Label>
            <Input id="m" type="number" value={monthly} onChange={(e) => setMonthly(+e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exp">Annual expenses in retirement ($)</Label>
            <Input id="exp" type="number" value={annualExpenses} onChange={(e) => setAnnualExpenses(+e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ret">Expected real return (%)</Label>
            <Input id="ret" type="number" step="0.1" value={returnRate} onChange={(e) => setReturnRate(+e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="wr">Safe withdrawal rate (%)</Label>
            <Input id="wr" type="number" step="0.1" value={withdrawalRate} onChange={(e) => setWithdrawalRate(+e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
          <Stat label="FIRE Number" value={fmt(result.fireNumber)} />
          <Stat label="Years to FI" value={result.years >= 80 ? '80+' : result.years.toFixed(1)} highlight />
          <Stat label="Annual savings" value={fmt(result.annualContrib)} />
        </div>
      </Card>

      <section className="prose prose-invert max-w-none">
        <h2 className="font-display text-2xl font-semibold mt-8 mb-3">The 4% rule in plain English</h2>
        <p className="text-muted-foreground leading-relaxed">
          If you withdraw 4% of your portfolio in year one and adjust that dollar amount for inflation each
          year after, historical data shows your money lasts at least 30 years in nearly every scenario.
          That means a portfolio of 25× your annual expenses is enough to retire on indefinitely.
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
