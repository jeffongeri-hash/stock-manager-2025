import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RelatedTools } from '@/components/seo/RelatedTools';
import { pageSEO, siteConfig } from '@/lib/seo-config';
import { coastNumber, computeHealthcareCoast, type HealthcareInputs } from '@/lib/coast-fire-healthcare';

const path = '/coast-fire-healthcare';
const url = `${siteConfig.url}${path}`;
const { title, description } = pageSEO[path];
const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const defaults: HealthcareInputs = {
  currentAge: 35, currentSavings: 150000, retireAge: 65, realReturnPct: 7, fireNumber: 1500000,
  fullTimeIncome: 130000, partTimeIncome: 70000, healthInsurance: 7200, retirementMatch: 5200,
  cme: 2500, malpractice: 1500, licenseFees: 600, annualContribution: 0,
};

const fields: { key: keyof HealthcareInputs; label: string; group: 'plan' | 'income' | 'benefits' }[] = [
  { key: 'currentAge', label: 'Current age', group: 'plan' },
  { key: 'currentSavings', label: 'Current savings / invested ($)', group: 'plan' },
  { key: 'retireAge', label: 'Target retirement age', group: 'plan' },
  { key: 'realReturnPct', label: 'Expected annual real return (%)', group: 'plan' },
  { key: 'fireNumber', label: 'FIRE number ($) — e.g. annual expenses × 25', group: 'plan' },
  { key: 'annualContribution', label: 'Optional: annual contribution while full-time ($)', group: 'plan' },
  { key: 'fullTimeIncome', label: 'Full-time annual income ($)', group: 'income' },
  { key: 'partTimeIncome', label: 'Part-time / per diem annual income ($)', group: 'income' },
  { key: 'healthInsurance', label: 'Health insurance / ACA premium ($/yr)', group: 'benefits' },
  { key: 'retirementMatch', label: 'Retirement match ($/yr)', group: 'benefits' },
  { key: 'cme', label: 'CME allowance ($/yr)', group: 'benefits' },
  { key: 'malpractice', label: 'Malpractice coverage ($/yr)', group: 'benefits' },
  { key: 'licenseFees', label: 'License / DEA / certification fees ($/yr)', group: 'benefits' },
];

const examples = [
  { r: 7, age: 65 }, { r: 7, age: 60 }, { r: 5, age: 65 }, { r: 5, age: 60 },
].map((e) => ({ ...e, coast: coastNumber(1_500_000, e.r, e.age - 35) }));

const faqs = [
  { q: 'Is per diem or part-time better for Coast FIRE?', a: 'Per diem usually pays a higher hourly rate with full schedule flexibility but rarely includes benefits or guaranteed hours. Part-time (often 0.5–0.8 FTE) pays less per hour but may keep health insurance, a retirement match, and CME. Compare them using effective income after lost benefits.' },
  { q: 'Do ACA subsidies depend on how many hours I work?', a: 'No. ACA premium tax credits depend on household income relative to the federal poverty level and on whether you have an affordable employer offer, not on hours. Check current rules and estimates with the KFF subsidy calculator at kff.org.' },
  { q: 'Should I keep benefits at 0.5 FTE?', a: 'If your employer offers benefits at 0.5 FTE, the employer-paid health premium and match are often worth several thousand to over ten thousand dollars a year. Enter their value as lost benefits and compare against a per diem rate to see which nets more.' },
  { q: 'Who pays malpractice coverage when I go per diem?', a: 'Many facilities cover per diem clinicians, but some locum or independent arrangements require your own policy or tail coverage. Confirm in writing and enter any out-of-pocket cost.' },
  { q: 'What return rate should I use?', a: 'Use a real (after-inflation) return. Many planners test 5% as conservative and 7% as historical-average. Because Coast FIRE compounds over decades, small rate changes move the number a lot.' },
  { q: 'Does this calculator save my data?', a: 'No. Everything runs in your browser, with no signup and nothing stored.' },
];

const faqLd = {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};

const link = 'text-primary underline underline-offset-2';

export default function CoastFireHealthcare() {
  const [v, setV] = useState<Record<keyof HealthcareInputs, string>>(
    () => Object.fromEntries(Object.entries(defaults).map(([k, n]) => [k, String(n)])) as Record<keyof HealthcareInputs, string>,
  );
  const num = Object.fromEntries(Object.entries(v).map(([k, s]) => [k, Number(s) || 0])) as unknown as HealthcareInputs;
  const res = computeHealthcareCoast(num);

  const set = (k: keyof HealthcareInputs, raw: string) => {
    const clean = raw.replace(/[^\d.]/g, '').replace(/^0+(?=\d)/, '');
    setV((p) => ({ ...p, [k]: clean }));
  };

  const group = (g: 'plan' | 'income' | 'benefits', heading: string) => (
    <fieldset className="space-y-3">
      <legend className="font-display text-lg font-semibold mb-1">{heading}</legend>
      {fields.filter((f) => f.group === g).map((f) => (
        <div key={f.key} className="space-y-1">
          <Label htmlFor={f.key}>{f.label}</Label>
          <Input id={f.key} type="text" inputMode="decimal" value={v[f.key]} onChange={(e) => set(f.key, e.target.value)} />
        </div>
      ))}
    </fieldset>
  );

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
      </Helmet>

      <PageLayout>
        <article className="max-w-4xl mx-auto space-y-10">
          <header className="space-y-4">
            <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight">
              Coast FIRE Calculator for PAs, NPs &amp; Nurses
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              See whether you can drop to part-time or per diem and let your investments coast to retirement —
              after accounting for the benefits you give up. Free, no signup, runs in your browser.
            </p>
            <p className="text-sm rounded-md border border-border bg-muted/40 p-3">
              <strong>Educational only, not financial advice.</strong> Results are estimates. See our{' '}
              <Link to="/disclaimer" className={link}>disclaimer</Link>.
            </p>
          </header>

          <Card className="p-5 sm:p-6 space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {group('plan', 'Your plan')}
              {group('income', 'Income')}
              {group('benefits', 'Lost benefits (annual)')}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-border">
              {[
                ['Coast FIRE number', usd(res.coast), `Needed today, ${res.years} yrs at ${num.realReturnPct}%`],
                ['Gap to Coast', res.gap > 0 ? usd(res.gap) : 'You can coast now', `Current savings ${usd(num.currentSavings)}`],
                ['Years until you can coast', res.yearsToCoast === null ? 'Not before retirement' : `${res.yearsToCoast} yrs`, num.annualContribution > 0 ? `With ${usd(num.annualContribution)}/yr contributions` : 'Growth only, no contributions'],
                ['Lost benefits total', usd(res.benefitsTotal), 'Per year'],
                ['Effective part-time income', usd(res.effectivePartTime), `After lost benefits, vs ${usd(num.fullTimeIncome)} full-time`],
                ['Income drop vs full-time', usd(res.incomeDrop), 'Per year'],
              ].map(([k, val, sub]) => (
                <div key={k} className="rounded-lg border border-border bg-card/50 p-4">
                  <div className="text-xs text-muted-foreground">{k}</div>
                  <div className="font-mono text-2xl font-semibold mt-1">{val}</div>
                  <div className="text-xs text-muted-foreground mt-1">{sub}</div>
                </div>
              ))}
            </div>
          </Card>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">How Coast FIRE works for healthcare workers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Coast FIRE means you already have enough invested that compound growth alone will reach your FIRE number by
              retirement. After that, you only need to earn enough to cover today's expenses. For clinicians, that often
              means trading 12-hour full-time shifts for a lighter part-time or per diem schedule. The Coast number is your
              FIRE number discounted back to today: <span className="font-mono">FIRE ÷ (1 + real return)^years</span>.
              New to the idea? Read <Link to="/what-is-coast-fire" className={link}>what is Coast FIRE</Link>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">Part-time vs per diem</h2>
            <p className="text-muted-foreground leading-relaxed">
              Part-time roles (commonly 0.5–0.8 FTE) usually keep some benefits and predictable shifts. Per diem pays a
              higher hourly rate and offers maximum flexibility, but typically no benefits, no guaranteed hours, and can be
              cancelled when census drops. Neither is better by default — compare effective income after benefits.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">The hidden cost of lost benefits</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
              <li><strong>Health insurance / ACA premium:</strong> often the largest cost once your employer stops paying its share.</li>
              <li><strong>Retirement match:</strong> a 4–6% 401(k)/403(b) match disappears, slowing growth.</li>
              <li><strong>CME allowance:</strong> conferences and courses you'll now fund yourself.</li>
              <li><strong>Malpractice coverage:</strong> some per diem or locum arrangements require your own policy or tail coverage.</li>
              <li><strong>License, DEA and certification fees:</strong> state licenses, DEA registration, NCCPA/board recertification, and BLS/ACLS.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">Worked PA examples</h2>
            <p className="text-muted-foreground leading-relaxed">
              A 35-year-old PA with a $1,500,000 FIRE target needs this much invested today to coast:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border">
                <thead><tr className="bg-muted/40"><th className="p-2 text-left">Real return</th><th className="p-2 text-left">Retire at</th><th className="p-2 text-left">Years</th><th className="p-2 text-right">Coast FIRE number</th></tr></thead>
                <tbody>
                  {examples.map((e) => (
                    <tr key={`${e.r}-${e.age}`} className="border-t border-border">
                      <td className="p-2">{e.r}%</td><td className="p-2">{e.age}</td><td className="p-2">{e.age - 35}</td>
                      <td className="p-2 text-right font-mono">{usd(e.coast)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              If that PA drops from $130,000 full-time to $70,000 per diem and loses $17,000 a year in benefits, effective
              part-time income is about $53,000 — the number that must cover living costs while the portfolio coasts.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">How to use the calculator</h2>
            <ol className="list-decimal pl-6 space-y-2 text-muted-foreground leading-relaxed">
              <li>Enter your age, invested savings, target retirement age and a real return (try 5% and 7%).</li>
              <li>Enter your FIRE number — roughly annual retirement expenses × 25.</li>
              <li>Enter full-time and part-time/per diem income, then each benefit you'd lose.</li>
              <li>Optionally add an annual contribution to see how many more full-time years you need before coasting.</li>
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-3xl font-semibold">Frequently asked questions</h2>
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-lg border border-border bg-card/50 p-4">
                <summary className="cursor-pointer font-medium text-lg">{f.q}</summary>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {f.a}
                  {f.q.startsWith('Do ACA') && <> <a href="https://www.kff.org/" target="_blank" rel="noopener noreferrer" className={link}>Visit KFF</a>.</>}
                </p>
              </details>
            ))}
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl font-semibold">More Coast FIRE tools</h2>
            <ul className="grid sm:grid-cols-2 gap-2">
              <li><Link to="/coast-fire-tracker" className={link}>Coast FIRE Tracker</Link></li>
              <li><Link to="/coast-fire-calculator" className={link}>Coast FIRE Calculator</Link></li>
              <li><Link to="/coast-fire-number" className={link}>Coast FIRE Number by Age</Link></li>
              <li><Link to="/what-is-coast-fire" className={link}>What Is Coast FIRE?</Link></li>
              <li><Link to="/fire-guide" className={link}>FIRE Guide</Link></li>
            </ul>
          </section>

          <RelatedTools currentPath={path} />
        </article>
      </PageLayout>
    </>
  );
}
