import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CoastFireTrackerWidget } from '@/components/coast-fire/CoastFireTrackerWidget';
import { RelatedTools } from '@/components/seo/RelatedTools';
import { siteConfig } from '@/lib/seo-config';

const path = '/coast-fire-number';
const url = `${siteConfig.url}${path}`;
const title = 'Coast FIRE Number — How to Calculate Yours by Age';
const description =
  'What your Coast FIRE number is, the formula, examples by age (25, 30, 35, 40), and how to track yours to financial independence.';

// Examples assume $50k annual retirement spending, 4% SWR (FIRE = $1.25M), 5% real return, retire at 65.
const EXAMPLES = [
  { age: 25, years: 40, coast: 177_500 },
  { age: 30, years: 35, coast: 226_500 },
  { age: 35, years: 30, coast: 289_200 },
  { age: 40, years: 25, coast: 369_200 },
  { age: 45, years: 20, coast: 471_100 },
  { age: 50, years: 15, coast: 601_400 },
];

const FAQS = [
  {
    q: 'What is a Coast FIRE number?',
    a: 'Your Coast FIRE number is the amount you need invested today so that — with zero additional contributions — compound growth alone reaches your full FIRE number by your target retirement age.',
  },
  {
    q: 'How do I calculate my Coast FIRE number?',
    a: 'Take your annual retirement spending and divide by your safe withdrawal rate (typically 4%) to get your FIRE number. Then divide that by (1 + expected real return) raised to the years until retirement.',
  },
  {
    q: 'What is a good Coast FIRE number at age 30?',
    a: 'With a $1.25M FIRE goal, a 5% real return, and retirement at 65, the Coast FIRE number at 30 is roughly $226,000. Your number scales linearly with your annual spending — double the spending, double the Coast FIRE number.',
  },
  {
    q: 'Does my Coast FIRE number change over time?',
    a: "Yes. As you age, the number rises because you have fewer years for compounding to do the work. That's why tracking it monthly with a Coast FIRE tracker matters more than calculating once.",
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

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url + '/' },
    { '@type': 'ListItem', position: 2, name: 'Coast FIRE Number', item: url },
  ],
};

const fmt = (n: number) => '$' + n.toLocaleString('en-US');

export default function CoastFireNumber() {
  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content={`${siteConfig.url}${siteConfig.ogImage}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      <PageLayout>
        <article className="max-w-4xl mx-auto space-y-10">
          <header className="space-y-4">
            <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Home</Link> <span aria-hidden>›</span>{' '}
              <span className="text-foreground">Coast FIRE Number</span>
            </nav>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight">
              Coast FIRE Number
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Your Coast FIRE number is the dollar amount you need invested today for compounding
              alone to grow into a full retirement portfolio. Below: the formula, examples by age,
              and a free tool to find yours.
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">The Coast FIRE number formula</h2>
            <Card className="p-5 bg-muted/40 border-primary/20">
              <pre className="font-mono text-sm whitespace-pre-wrap leading-relaxed">
{`FIRE Number          = Annual Retirement Spending / Safe Withdrawal Rate
Coast FIRE Number    = FIRE Number / (1 + Real Return) ^ Years Until Retirement`}
              </pre>
            </Card>
            <p className="text-muted-foreground">
              Real return = return after inflation. A 4–6% real return is a common assumption for a
              globally diversified stock portfolio. Run your own scenario in the{' '}
              <Link to="/coast-fire-tracker" className="text-primary underline">Coast FIRE tracker</Link>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">Coast FIRE number by age</h2>
            <p className="text-muted-foreground">
              Assumes a $1,250,000 FIRE goal ($50k annual spending at 4% SWR), 5% real return,
              retirement at 65. Your number scales linearly with spending.
            </p>
            <div className="overflow-x-auto rounded-lg border border-border-soft">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left p-3 font-semibold">Current Age</th>
                    <th className="text-left p-3 font-semibold">Years to Retire</th>
                    <th className="text-left p-3 font-semibold">Coast FIRE Number</th>
                  </tr>
                </thead>
                <tbody>
                  {EXAMPLES.map((e) => (
                    <tr key={e.age} className="border-t border-border-soft">
                      <td className="p-3 font-mono">{e.age}</td>
                      <td className="p-3 font-mono">{e.years}</td>
                      <td className="p-3 font-mono text-primary font-semibold">{fmt(e.coast)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="tool" className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">Calculate your Coast FIRE number</h2>
            <CoastFireTrackerWidget heading="Coast FIRE Number Calculator" />
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">Why your number changes every year</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Coast FIRE number isn't fixed. Each year you don't reach it, the discount window
              shrinks and the required amount goes up. Markets, inflation, and changes to your
              retirement spending also move the target. That's why most people benefit more from a
              recurring <Link to="/coast-fire-tracker" className="text-primary underline">Coast FIRE tracker</Link>{' '}
              than a one-time calculation.
            </p>
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
            <h2 className="font-display text-2xl font-semibold mb-2">Track your number month over month</h2>
            <p className="text-muted-foreground mb-4">
              Calculating once tells you where you stand today. Tracking shows you the trajectory.
            </p>
            <Button asChild size="lg"><Link to="/coast-fire-tracker">Open the Coast FIRE Tracker</Link></Button>
          </Card>

          <RelatedTools currentPath={path} />
        </article>
      </PageLayout>
    </>
  );
}
