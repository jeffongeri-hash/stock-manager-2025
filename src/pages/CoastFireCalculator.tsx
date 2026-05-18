import { useState, useMemo } from 'react';
import { SeoCalculatorPage } from '@/components/seo/SeoCalculatorPage';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function CoastFireCalculator() {
  const [currentAge, setCurrentAge] = useState(30);
  const [retireAge, setRetireAge] = useState(65);
  const [currentNW, setCurrentNW] = useState(50000);
  const [annualExpenses, setAnnualExpenses] = useState(40000);
  const [returnRate, setReturnRate] = useState(7);
  const [withdrawalRate, setWithdrawalRate] = useState(4);

  const result = useMemo(() => {
    const fireNumber = (annualExpenses * 100) / withdrawalRate;
    const years = Math.max(retireAge - currentAge, 0);
    const growthMultiplier = Math.pow(1 + returnRate / 100, years);
    const projectedNW = currentNW * growthMultiplier;
    const coastNumber = fireNumber / growthMultiplier;
    const isCoasting = currentNW >= coastNumber;
    return { fireNumber, projectedNW, coastNumber, isCoasting };
  }, [currentAge, retireAge, currentNW, annualExpenses, returnRate, withdrawalRate]);

  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

  return (
    <SeoCalculatorPage
      path="/coast-fire-calculator"
      title="Coast FIRE Calculator — Free Coast FI Number Tool"
      h1="Coast FIRE Calculator"
      description="Calculate your Coast FIRE number — the amount you need invested today to retire at your target age without ever saving another dollar. Free, instant, no signup required."
      keywords={['coast fire calculator', 'coast fi calculator', 'coast fire number', 'financial independence calculator', 'fire calculator', 'early retirement calculator']}
      ctaHref="/fire-guide"
      ctaLabel="Open the full FIRE planner"
      faqs={[
        { q: 'What is Coast FIRE?', a: 'Coast FIRE is the point at which your invested net worth is large enough to grow into your full FIRE number by your target retirement age — without any additional contributions. Once you hit Coast FI, your existing portfolio "coasts" to retirement and you only need to cover current living expenses.' },
        { q: 'How is the Coast FIRE number calculated?', a: 'Coast FIRE Number = FIRE Number ÷ (1 + r)^n, where r is your expected real return and n is years until retirement. Your FIRE Number is annual expenses ÷ withdrawal rate (typically 4%, so 25× annual expenses).' },
        { q: 'What return rate should I use?', a: '6–7% is a common conservative real return for a diversified equity-heavy portfolio (after inflation). Use 5% to be more conservative or 8% if you want a more optimistic projection.' },
        { q: 'Is the 4% withdrawal rate safe?', a: 'The Trinity Study and updated research (Bengen, Kitces) suggest 4% has historically supported 30-year retirements. For 40+ year retirements typical in FIRE, many planners use 3.25–3.5% for extra margin.' },
        { q: 'What is the difference between Coast FIRE, Lean FIRE, and Fat FIRE?', a: 'Lean FIRE targets a frugal lifestyle (~$25–40K/yr). Fat FIRE targets a comfortable lifestyle ($100K+/yr). Coast FIRE is a milestone on the path to any of these — when contributions become optional.' },
      ]}
    >
      <Card className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="age">Current age</Label>
            <Input id="age" type="number" value={currentAge} onChange={(e) => setCurrentAge(+e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="retire">Target retirement age</Label>
            <Input id="retire" type="number" value={retireAge} onChange={(e) => setRetireAge(+e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nw">Current invested net worth ($)</Label>
            <Input id="nw" type="number" value={currentNW} onChange={(e) => setCurrentNW(+e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exp">Annual expenses in retirement ($)</Label>
            <Input id="exp" type="number" value={annualExpenses} onChange={(e) => setAnnualExpenses(+e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ret">Expected real return (%)</Label>
            <Input id="ret" type="number" step="0.1" value={returnRate} onChange={(e) => setReturnRate(+e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wr">Safe withdrawal rate (%)</Label>
            <Input id="wr" type="number" step="0.1" value={withdrawalRate} onChange={(e) => setWithdrawalRate(+e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
          <Stat label="Your FIRE Number" value={fmt(result.fireNumber)} />
          <Stat label="Coast FIRE Number (need today)" value={fmt(result.coastNumber)} highlight />
          <Stat label="Projected at retirement" value={fmt(result.projectedNW)} />
        </div>

        <div className={`p-4 rounded-lg ${result.isCoasting ? 'bg-success/10 border border-success/30' : 'bg-muted/30 border border-border'}`}>
          <p className="font-medium">
            {result.isCoasting
              ? `🔥 You've hit Coast FIRE! Your $${Math.round(currentNW).toLocaleString()} is projected to grow to ${fmt(result.projectedNW)} by age ${retireAge}.`
              : `You need ${fmt(result.coastNumber - currentNW)} more invested today to coast to retirement.`}
          </p>
        </div>
      </Card>

      <section className="prose prose-invert max-w-none">
        <h2 className="font-display text-2xl font-semibold mt-8 mb-3">How Coast FIRE works</h2>
        <p className="text-muted-foreground leading-relaxed">
          Coast FIRE is the FIRE movement's most underrated milestone. Once you hit your Coast FI number,
          compounding alone carries you to full financial independence — you can stop investing entirely
          and only earn enough to cover today's bills. For most people in their 20s and 30s, Coast FIRE
          arrives a decade or more before traditional FI, making it the most achievable FIRE flavor.
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
