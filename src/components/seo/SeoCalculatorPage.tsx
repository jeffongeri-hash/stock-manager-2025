import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/lib/seo-config';

export interface FaqItem {
  q: string;
  a: string;
}

interface Props {
  path: string;
  title: string;        // <title> + H1
  h1?: string;          // override H1 if different from <title>
  description: string;  // meta description + lead paragraph
  keywords: string[];
  faqs: FaqItem[];
  ctaHref: string;
  ctaLabel: string;
  children: React.ReactNode; // calculator UI + explainer content
}

/**
 * Public SEO landing page: per-route Helmet (title/description/canonical),
 * FAQPage JSON-LD for rich results, and a consistent layout.
 */
export function SeoCalculatorPage({
  path, title, h1, description, keywords, faqs, ctaHref, ctaLabel, children,
}: Props) {
  const canonical = `${siteConfig.url}${path}`;
  const ogImage = `${siteConfig.url}${siteConfig.ogImage}`;

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords.join(', ')} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
      </Helmet>

      <PageLayout>
        <article className="space-y-8 max-w-4xl mx-auto">
          <header className="space-y-4">
            <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight">
              {h1 ?? title.split(' — ')[0]}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">{description}</p>
          </header>

          {children}

          <Card className="p-6 bg-primary/5 border-primary/20">
            <h2 className="font-display text-2xl font-semibold mb-2">Get the full toolkit</h2>
            <p className="text-muted-foreground mb-4">
              This calculator is a quick preview. Sign in (free) to track your real numbers,
              save scenarios, and unlock the full Profit Pathway suite.
            </p>
            <Button asChild size="lg">
              <Link to={ctaHref}>{ctaLabel}</Link>
            </Button>
          </Card>

          <section className="space-y-4">
            <h2 className="font-display text-3xl font-semibold">Frequently asked questions</h2>
            <div className="space-y-4">
              {faqs.map((f) => (
                <details key={f.q} className="group rounded-lg border border-border bg-card/50 p-4">
                  <summary className="cursor-pointer font-medium text-lg list-none flex justify-between items-center">
                    {f.q}
                    <span className="text-primary group-open:rotate-180 transition-transform">▾</span>
                  </summary>
                  <p className="mt-3 text-muted-foreground leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </article>
      </PageLayout>
    </>
  );
}
