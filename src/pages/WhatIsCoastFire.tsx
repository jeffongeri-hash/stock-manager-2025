import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RelatedTools } from '@/components/seo/RelatedTools';
import { siteConfig } from '@/lib/seo-config';

const path = '/what-is-coast-fire';
const url = `${siteConfig.url}${path}`;
const title = 'What Is Coast FIRE? Coast FIRE Explained for Beginners';
const description =
  'Learn what Coast FIRE means, how it works, how to calculate your Coast FIRE number, and how it compares to traditional FIRE.';

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url + '/' },
    { '@type': 'ListItem', position: 2, name: 'What Is Coast FIRE?', item: url },
  ],
};

export default function WhatIsCoastFire() {
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
              <span className="text-foreground">What Is Coast FIRE?</span>
            </nav>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight">What Is Coast FIRE?</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Coast FIRE is the point where you've invested enough that compound growth alone will
              carry you to full financial independence by retirement — even if you never save another
              dollar. This guide explains the concept in plain English and shows how to find your
              number.
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">The short answer</h2>
            <p className="text-muted-foreground leading-relaxed">
              Coast FIRE means your invested portfolio is large enough today that it can grow into
              your full FIRE number by retirement on its own. After hitting Coast FIRE you still need
              earned income to cover living expenses, but retirement savings is effectively done.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">How Coast FIRE works</h2>
            <p className="text-muted-foreground leading-relaxed">
              Start with your FIRE number — annual retirement spending divided by your safe
              withdrawal rate (usually 4%). Then discount that number back to today using your
              expected real return and the years left until retirement. The result is the amount you
              need invested right now for compounding to do the rest of the work.
            </p>
            <Card className="p-5 bg-muted/40 border-primary/20">
              <pre className="font-mono text-sm whitespace-pre-wrap">
{`Coast FIRE Today = FIRE Number / (1 + Real Return) ^ Years Until Retirement`}
              </pre>
            </Card>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">Coast FIRE vs traditional FIRE</h2>
            <p className="text-muted-foreground leading-relaxed">
              Traditional FIRE requires enough invested to fully cover annual spending today. Coast
              FIRE only requires enough invested to grow into that number later. Coast FIRE is much
              faster to hit, which is why it's the most popular milestone for beginners on the FIRE
              path.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">How to track it</h2>
            <p className="text-muted-foreground leading-relaxed">
              Use the free{' '}
              <Link to="/coast-fire-tracker" className="text-primary underline underline-offset-2">
                Coast FIRE Tracker
              </Link>{' '}
              to plug in your numbers, see your % progress, and compare scenarios month over month.
              Pair it with the{' '}
              <Link to="/coast-fire-calculator" className="text-primary underline underline-offset-2">
                Coast FIRE Calculator
              </Link>{' '}
              for a deeper one-time projection.
            </p>
          </section>

          <Card className="p-6 bg-primary/5 border-primary/30">
            <h2 className="font-display text-2xl font-semibold mb-2">Calculate your Coast FIRE number</h2>
            <p className="text-muted-foreground mb-4">
              The free Coast FIRE tracker takes 30 seconds and works on mobile.
            </p>
            <Button asChild size="lg">
              <Link to="/coast-fire-tracker">Track your Coast FIRE number</Link>
            </Button>
          </Card>

          <RelatedTools currentPath={path} />
        </article>
      </PageLayout>
    </>
  );
}
