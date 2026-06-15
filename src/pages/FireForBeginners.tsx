import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RelatedTools } from '@/components/seo/RelatedTools';
import { siteConfig } from '@/lib/seo-config';

const path = '/fire-for-beginners';
const url = `${siteConfig.url}${path}`;
const title = 'FIRE for Beginners — Financial Independence and Early Retirement Guide';
const description =
  'A beginner-friendly guide to FIRE, including Coast FIRE, traditional FIRE, savings rate, withdrawal rates, investing, and early retirement planning.';

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url + '/' },
    { '@type': 'ListItem', position: 2, name: 'FIRE for Beginners', item: url },
  ],
};

export default function FireForBeginners() {
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
        <meta name="twitter:image" content={`${siteConfig.url}${siteConfig.ogImage}`} />
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      <PageLayout>
        <article className="max-w-4xl mx-auto space-y-8">
          <header className="space-y-4">
            <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Home</Link> <span aria-hidden>›</span>{' '}
              <span className="text-foreground">FIRE for Beginners</span>
            </nav>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight">FIRE for Beginners</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              FIRE — Financial Independence, Retire Early — is the practice of saving and investing
              aggressively so work becomes optional decades before traditional retirement age. This
              beginner-friendly guide covers the math, the milestones, and the tools you need.
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">The core idea</h2>
            <p className="text-muted-foreground leading-relaxed">
              Once your invested portfolio is large enough that a safe withdrawal covers your annual
              spending, work becomes optional. The standard rule of thumb is the 4% rule: a portfolio
              that's 25× your annual spending should sustain you indefinitely.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">Types of FIRE</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>Lean FIRE:</strong> retire on a small annual spend, often under $40k.</li>
              <li><strong>Fat FIRE:</strong> retire on a generous budget, $100k+.</li>
              <li>
                <strong>Coast FIRE:</strong> invested enough that compounding finishes the job —{' '}
                <Link to="/coast-fire-tracker" className="text-primary underline underline-offset-2">track your Coast FIRE number</Link>.
              </li>
              <li><strong>Barista FIRE:</strong> part-time work covers expenses while the portfolio coasts.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">The savings rate matters most</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your savings rate — the % of after-tax income you invest — drives your timeline more
              than your salary. A 50% savings rate typically reaches FIRE in ~17 years; a 25% rate
              takes ~32 years.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">Where to invest</h2>
            <p className="text-muted-foreground leading-relaxed">
              Most FIRE plans use low-cost index funds inside tax-advantaged accounts (401k, IRA,
              HSA) first, then taxable brokerage accounts. Diversification, low fees, and consistent
              contributions matter more than picking individual stocks.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">The first milestone — Coast FIRE</h2>
            <p className="text-muted-foreground leading-relaxed">
              The easiest FIRE milestone to hit is Coast FIRE. Once you reach it, your retirement
              savings is effectively done — even if you stop contributing, compound growth alone
              will reach your full FIRE number by retirement age. Use the{' '}
              <Link to="/coast-fire-tracker" className="text-primary underline underline-offset-2">free Coast FIRE tracker</Link>{' '}
              to find your number.
            </p>
          </section>

          <Card className="p-6 bg-primary/5 border-primary/30">
            <h2 className="font-display text-2xl font-semibold mb-2">Start with your Coast FIRE number</h2>
            <p className="text-muted-foreground mb-4">
              Coast FIRE is the most encouraging milestone for beginners — and the fastest to hit.
            </p>
            <Button asChild size="lg">
              <Link to="/coast-fire-tracker">Calculate your Coast FIRE number</Link>
            </Button>
          </Card>

          <RelatedTools currentPath={path} />
        </article>
      </PageLayout>
    </>
  );
}
