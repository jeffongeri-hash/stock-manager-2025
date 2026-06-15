import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CoastFireTrackerWidget } from '@/components/coast-fire/CoastFireTrackerWidget';
import { RelatedTools } from '@/components/seo/RelatedTools';
import { siteConfig } from '@/lib/seo-config';

const path = '/coast-fire-calculator';
const url = `${siteConfig.url}${path}`;
const title = 'Coast FIRE Calculator — Find Your Coast FIRE Number';
const description =
  'Calculate your Coast FIRE number and see how much you need invested today for your portfolio to grow into your retirement goal.';

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url + '/' },
    { '@type': 'ListItem', position: 2, name: 'Coast FIRE Calculator', item: url },
  ],
};

const softwareLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Coast FIRE Calculator',
  url,
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  description,
};

export default function CoastFireCalculator() {
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
              <span className="text-foreground">Coast FIRE Calculator</span>
            </nav>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight">
              Coast FIRE Calculator
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Find the amount you'd need invested today for compound growth alone to reach your full
              FIRE number by retirement. Free, no signup, runs entirely in your browser.
            </p>
          </header>

          <CoastFireTrackerWidget heading="Coast FIRE Calculator" />

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">Coast FIRE formula</h2>
            <Card className="p-5 bg-muted/40 border-primary/20">
              <pre className="font-mono text-sm whitespace-pre-wrap">
{`FIRE Number      = Annual Retirement Spending / Safe Withdrawal Rate
Coast FIRE Today = FIRE Number / (1 + Real Return) ^ Years Until Retirement`}
              </pre>
            </Card>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">Want to track progress over time?</h2>
            <p className="text-muted-foreground leading-relaxed">
              Use the{' '}
              <Link to="/coast-fire-tracker" className="text-primary underline underline-offset-2">
                Coast FIRE Tracker
              </Link>{' '}
              to monitor your % progress and gap to Coast FIRE every month. New to the concept? Start
              with{' '}
              <Link to="/what-is-coast-fire" className="text-primary underline underline-offset-2">
                what is Coast FIRE
              </Link>
              .
            </p>
          </section>

          <Card className="p-6 bg-primary/5 border-primary/30">
            <h2 className="font-display text-2xl font-semibold mb-2">Track your Coast FIRE number monthly</h2>
            <p className="text-muted-foreground mb-4">
              The Coast FIRE Tracker is the free, ongoing version of this calculator.
            </p>
            <Button asChild size="lg">
              <Link to="/coast-fire-tracker">Open the Coast FIRE Tracker</Link>
            </Button>
          </Card>

          <RelatedTools currentPath={path} />
        </article>
      </PageLayout>
    </>
  );
}
