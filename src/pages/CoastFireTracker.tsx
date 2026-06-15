import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CoastFireTrackerWidget } from '@/components/coast-fire/CoastFireTrackerWidget';
import { EmbedCodeBlock } from '@/components/coast-fire/EmbedCodeBlock';
import { RelatedTools } from '@/components/seo/RelatedTools';
import { siteConfig } from '@/lib/seo-config';

const path = '/coast-fire-tracker';
const url = `${siteConfig.url}${path}`;
const title = 'Coast FIRE Tracker — Calculate Your Coast FIRE Number';
const description =
  'Free Coast FIRE Tracker: calculate your Coast FIRE number, track progress, and see when your portfolio can coast to financial independence.';

const FAQS = [
  {
    q: 'What is Coast FIRE?',
    a: 'Coast FIRE is the point at which your invested portfolio is large enough that, with no further contributions, compound growth alone will reach your full FIRE number by your target retirement age. After Coast FIRE you still need to cover living expenses, but you no longer need to save for retirement.',
  },
  {
    q: 'How do I calculate my Coast FIRE number?',
    a: 'First find your FIRE number (annual retirement spending divided by your safe withdrawal rate, usually 4%). Then discount it back to today using your expected real (inflation-adjusted) return and the number of years until retirement: Coast FIRE Today = FIRE Number / (1 + real return) ^ years.',
  },
  {
    q: 'What return assumption should I use?',
    a: 'A real (after-inflation) return of 4–6% is a common starting point for a globally diversified stock-heavy portfolio. Use a lower number for a more conservative plan or a shorter horizon.',
  },
  {
    q: 'How often should I update my Coast FIRE tracker?',
    a: 'Monthly is enough for most people — frequent enough to see progress, infrequent enough to ignore market noise. Re-check inputs (spending, age, return) at least once a year.',
  },
  {
    q: 'Coast FIRE vs traditional FIRE — what is the difference?',
    a: 'Traditional FIRE requires hitting your full FIRE number so you can retire and live off withdrawals. Coast FIRE only requires enough invested today that compounding alone closes the gap by retirement — you can stop saving but still need to cover expenses.',
  },
  {
    q: 'Coast FIRE vs Barista FIRE?',
    a: 'Barista FIRE means working a lower-stress part-time job to cover living expenses while your portfolio compounds. Coast FIRE is similar in spirit but defined by the math: your portfolio is already big enough that no new contributions are required.',
  },
  {
    q: 'Is a Coast FIRE tracker financial advice?',
    a: 'No. A Coast FIRE tracker is an educational projection tool. Your real outcome depends on returns, taxes, inflation, and your spending — none of which are guaranteed. Treat the number as a planning target, not a promise.',
  },
];

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

const softwareLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Coast FIRE Tracker',
  url,
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  description,
};

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url + '/' },
    { '@type': 'ListItem', position: 2, name: 'Coast FIRE Tracker', item: url },
  ],
};

export default function CoastFireTracker() {
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
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
      </Helmet>

      <PageLayout>
        <article className="max-w-4xl mx-auto space-y-10">
          <header className="space-y-4">
            <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Home</Link> <span aria-hidden>›</span>{' '}
              <span className="text-foreground">Coast FIRE Tracker</span>
            </nav>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight">
              Coast FIRE Tracker
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Calculate your Coast FIRE number, track your progress month over month, and see exactly
              when your portfolio is large enough to coast to financial independence — without
              another dollar of contributions.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg"><a href="#tracker">Open the Free Coast FIRE Tracker</a></Button>
              <Button asChild size="lg" variant="outline"><a href="#tracker">Calculate My Coast FIRE Number</a></Button>
            </div>
          </header>

          <section id="tracker" aria-labelledby="tracker-heading" className="scroll-mt-24">
            <h2 id="tracker-heading" className="sr-only">Interactive Coast FIRE tracker</h2>
            <CoastFireTrackerWidget />
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">What is a Coast FIRE tracker?</h2>
            <p className="text-muted-foreground leading-relaxed">
              A Coast FIRE tracker is a planning tool that compares the money you have invested today
              against the amount you'd need invested today for compound growth alone to reach your
              FIRE number by your target retirement age. The tracker shows your Coast FIRE number, the
              gap left to close, your % progress, and your projected portfolio value at retirement.
              New to the concept? Start with <Link to="/what-is-coast-fire" className="text-primary underline">what is Coast FIRE</Link>,
              or run a one-time estimate with the <Link to="/coast-fire-calculator" className="text-primary underline">Coast FIRE calculator</Link>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">Coast FIRE tracker vs Coast FIRE calculator</h2>
            <p className="text-muted-foreground leading-relaxed">
              A <strong>Coast FIRE calculator</strong> answers a one-time question: "what's my number today?"
              A <strong>Coast FIRE tracker</strong> answers an ongoing one: "am I closing the gap?" The math
              behind both is the same — your inputs change, markets move, and your target shifts every year,
              so most people get more value from a tracker they revisit monthly than a calculator they run
              once and forget. If you just want a snapshot, use the{' '}
              <Link to="/coast-fire-calculator" className="text-primary underline">Coast FIRE calculator</Link>;
              for a number you can watch month over month, this page is the right tool.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">How to calculate your Coast FIRE number</h2>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Estimate your annual retirement spending in today's dollars.</li>
              <li>Divide by your safe withdrawal rate (usually 4%) to get your FIRE number.</li>
              <li>Discount the FIRE number back to today using your expected real return and the years left until retirement.</li>
              <li>Compare your current invested balance to that Coast FIRE number — anything above it means you've already hit Coast FIRE.</li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">Coast FIRE formula</h2>
            <Card className="p-5 bg-muted/40 border-primary/20">
              <pre className="font-mono text-sm whitespace-pre-wrap leading-relaxed">
{`FIRE Number          = Annual Retirement Spending / Safe Withdrawal Rate
Coast FIRE Today     = FIRE Number / (1 + Expected Real Return) ^ Years Until Retirement`}
              </pre>
            </Card>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">What assumptions should you use?</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>Safe withdrawal rate:</strong> 3.5%–4% is the most common starting point.</li>
              <li><strong>Real return:</strong> 4–6% after inflation for a globally diversified stock-heavy portfolio.</li>
              <li><strong>Retirement age:</strong> the age you want to stop working entirely.</li>
              <li><strong>Annual spending:</strong> use today's dollars — the tracker handles inflation by using real returns.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">How often should you update your Coast FIRE tracker?</h2>
            <p className="text-muted-foreground leading-relaxed">
              Update inputs monthly. Re-check assumptions (spending, retirement age, expected return)
              at least annually or after any major life change — new job, kids, home purchase, or a
              big shift in markets. If you're brand new to all of this, read
              the <Link to="/fire-for-beginners" className="text-primary underline">FIRE for beginners</Link> guide
              or try the <Link to="/early-retirement-calculator" className="text-primary underline">early retirement calculator</Link>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">Coast FIRE vs traditional FIRE</h2>
            <p className="text-muted-foreground leading-relaxed">
              Traditional FIRE means you have enough invested to withdraw your full annual spending
              today. Coast FIRE only requires enough invested today for compounding to reach the full
              FIRE number by your target retirement age — much faster to hit, but you still need
              earned income to cover today's expenses.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">Coast FIRE vs Barista FIRE vs Lean FIRE</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>Coast FIRE:</strong> portfolio is big enough to grow into full FIRE without new contributions.</li>
              <li><strong>Barista FIRE:</strong> part-time or lower-income work covers living expenses while the portfolio coasts.</li>
              <li><strong>Lean FIRE:</strong> full retirement on a deliberately low annual spending number.</li>
              <li><strong>Fat FIRE:</strong> full retirement on a higher annual spending budget.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">Coast FIRE example for a beginner</h2>
            <Card className="p-5 bg-muted/40">
              <p className="text-sm leading-relaxed">
                <strong>Scenario:</strong> 32-year-old, retiring at 65, annual spending of $50,000,
                SWR 4%, real return 5%.<br />
                <strong>FIRE number:</strong> $50,000 / 0.04 = <span className="font-mono">$1,250,000</span><br />
                <strong>Coast FIRE today:</strong> $1,250,000 / (1.05)<sup>33</sup> ≈ <span className="font-mono">$251,000</span><br />
                If they already have $125,000 invested, they're roughly halfway to Coast FIRE.
              </p>
            </Card>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">Common Coast FIRE mistakes</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Using nominal return assumptions without subtracting inflation.</li>
              <li>Forgetting healthcare or family costs in retirement spending.</li>
              <li>Stopping all saving the moment you hit Coast FIRE — a small buffer protects against sequence-of-returns risk.</li>
              <li>Setting an unrealistic retirement age and inflating the Coast FIRE discount.</li>
              <li>Ignoring taxes on withdrawals.</li>
            </ul>
          </section>

          <section id="embed" className="space-y-3 scroll-mt-24">
            <h2 className="font-display text-3xl font-semibold">Embed the Coast FIRE Tracker on your site</h2>
            <p className="text-muted-foreground leading-relaxed">
              Drop the interactive Coast FIRE tracker into any blog post, newsletter, or finance site.
              Adjust the dimensions, copy the iframe snippet, and paste — no scripts, no dependencies.
            </p>
            <EmbedCodeBlock />
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-3xl font-semibold">Frequently asked questions</h2>
            {FAQS.map((f) => (
              <details key={f.q} className="rounded-lg border border-border-soft bg-card/50 p-4 group">
                <summary className="cursor-pointer font-medium list-none flex justify-between items-center">
                  {f.q}
                  <span className="text-primary group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="mt-3 text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
          </section>

          <Card className="p-6 bg-primary/5 border-primary/30 text-center">
            <h2 className="font-display text-2xl font-semibold mb-2">Ready to track your Coast FIRE number?</h2>
            <p className="text-muted-foreground mb-4">
              Open the free tracker, plug in your numbers, and see exactly where you stand.
            </p>
            <Button asChild size="lg"><a href="#tracker">Open the Free Coast FIRE Tracker</a></Button>
          </Card>

          <RelatedTools currentPath={path} />
        </article>
      </PageLayout>
    </>
  );
}
