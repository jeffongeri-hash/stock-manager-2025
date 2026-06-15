import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RelatedTools } from '@/components/seo/RelatedTools';
import { siteConfig } from '@/lib/seo-config';

const path = '/early-retirement-calculator';
const url = `${siteConfig.url}${path}`;
const title = 'Early Retirement Calculator — Track Your Path to Financial Independence';
const description =
  "Use Profit Pathfinder's early retirement calculator to estimate your FIRE number, retirement timeline, savings rate, and investment growth.";

const fmt = (n: number) =>
  isFinite(n) ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) : '—';

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url + '/' },
    { '@type': 'ListItem', position: 2, name: 'Early Retirement Calculator', item: url },
  ],
};

const softwareLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Early Retirement Calculator',
  url,
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  description,
};

export default function EarlyRetirementCalculator() {
  const [income, setIncome] = useState(90000);
  const [spend, setSpend] = useState(45000);
  const [invested, setInvested] = useState(50000);
  const [savingsRate, setSavingsRate] = useState(40);
  const [realReturn, setRealReturn] = useState(5);
  const [swr, setSwr] = useState(4);

  const result = useMemo(() => {
    const r = realReturn / 100;
    const sw = swr / 100;
    const annualSavings = income * (savingsRate / 100);
    const fireNumber = spend / sw;
    // Years to FIRE solving FV: invested*(1+r)^n + S*((1+r)^n - 1)/r = FIRE
    let years = 0;
    let balance = invested;
    while (balance < fireNumber && years < 80) {
      balance = balance * (1 + r) + annualSavings;
      years += 1;
    }
    return {
      annualSavings,
      fireNumber,
      years,
      projected: balance,
      retireAge: null as number | null,
    };
  }, [income, spend, invested, savingsRate, realReturn, swr]);

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
        <meta property="og:image" content={`${siteConfig.url}${siteConfig.ogImage}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${siteConfig.url}${siteConfig.ogImage}`} />
        <script type="application/ld+json">{JSON.stringify(softwareLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      <PageLayout>
        <article className="max-w-4xl mx-auto space-y-8">
          <header className="space-y-4">
            <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Home</Link> <span aria-hidden>›</span>{' '}
              <span className="text-foreground">Early Retirement Calculator</span>
            </nav>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight">
              Early Retirement Calculator
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Estimate your FIRE number, years until you can retire, and how every percentage point
              of savings rate changes your timeline.
            </p>
          </header>

          <Card className="p-5 sm:p-7 border-primary/20">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Num label="Annual income ($)" value={income} setValue={setIncome} step={1000} />
              <Num label="Annual retirement spending ($)" value={spend} setValue={setSpend} step={1000} />
              <Num label="Currently invested ($)" value={invested} setValue={setInvested} step={1000} />
              <Num label="Savings rate (%)" value={savingsRate} setValue={setSavingsRate} step={1} min={0} max={100} />
              <Num label="Expected real return (%)" value={realReturn} setValue={setRealReturn} step={0.1} />
              <Num label="Safe withdrawal rate (%)" value={swr} setValue={setSwr} step={0.1} />
            </div>

            <div className="grid sm:grid-cols-3 gap-3 mt-6">
              <Stat label="FIRE Number" value={fmt(result.fireNumber)} />
              <Stat label="Years to FIRE" value={result.years >= 80 ? '80+' : `${result.years}`} accent />
              <Stat label="Annual savings" value={fmt(result.annualSavings)} />
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button asChild className="flex-1">
                <Link to="/coast-fire-tracker">Open the Coast FIRE Tracker</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/fire-for-beginners">Read the FIRE for Beginners guide</Link>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Educational tool only — not financial, tax, or investment advice.
            </p>
          </Card>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">How early retirement math works</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your FIRE number is annual spending divided by your safe withdrawal rate (4% is
              standard). The faster you can save toward that number, the sooner you can retire. The
              calculator above projects your invested balance year by year using real (inflation
              adjusted) returns until it crosses your FIRE number.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">Hit Coast FIRE first</h2>
            <p className="text-muted-foreground leading-relaxed">
              Most people reach Coast FIRE — the point where compound growth alone funds retirement —
              years before full FIRE. Use the{' '}
              <Link to="/coast-fire-tracker" className="text-primary underline underline-offset-2">
                Coast FIRE Tracker
              </Link>{' '}
              to track that milestone in parallel.
            </p>
          </section>

          <RelatedTools currentPath={path} />
        </article>
      </PageLayout>
    </>
  );
}

function Num({
  label, value, setValue, min, max, step = 1,
}: { label: string; value: number; setValue: (n: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const n = parseFloat(e.target.value);
          setValue(isFinite(n) ? n : 0);
        }}
        className="mt-1 font-mono"
      />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${accent ? 'border-primary/40 bg-primary/5' : 'border-border-soft bg-muted/20'}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className={`font-mono text-lg sm:text-xl font-bold mt-0.5 ${accent ? 'text-primary' : ''}`}>{value}</div>
    </div>
  );
}
