import { Helmet } from 'react-helmet-async';
import { siteConfig } from '@/lib/seo-config';
import { RelatedTools } from '@/components/seo/RelatedTools';

const path = '/covered-call-calculator';
const title = 'Covered Call Calculator — Options Income Strategy | Profit Pathfinder';
const description = 'The most complete free covered call calculator. Calculate premium income, annualized yield, breakeven, Greeks, rolling strategies, and compare covered calls vs cash-secured puts.';
const keywords = 'covered call calculator, covered call strategy, how to sell covered calls, covered call income, options income strategy, covered call vs cash secured put, wheel strategy options, call option premium calculator, annualized yield covered call';

export default function CoveredCallCalculator() {
  const canonical = `${siteConfig.url}${path}`;
  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
      </Helmet>
      <iframe
        src="/covered-call-calculator-app.html"
        title="Covered Call Calculator"
        className="w-full border-0"
        style={{ height: '100vh' }}
        allow="clipboard-read; clipboard-write"
      />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <RelatedTools currentPath={path} />
      </div>
    </>
  );
}
