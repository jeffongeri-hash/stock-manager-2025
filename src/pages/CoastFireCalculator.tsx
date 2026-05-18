import { Helmet } from 'react-helmet-async';
import { siteConfig } from '@/lib/seo-config';

const path = '/coast-fire-calculator';
const title = 'Coast FIRE Calculator — Stop Saving, Start Living | Profit Pathfinder';
const description = 'The most complete Coast FIRE calculator. Find your Coast FIRE number, compare scenarios, model geo-arbitrage, simulate partial contributions, and see exactly when you can stop saving forever.';
const keywords = 'coast fire calculator, coast fire number, what is coast fire, coast fire vs lean fire, coast fire by age, financial independence coast, stop saving retire early';

export default function CoastFireCalculator() {
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
        src="/coast-fire-calculator-app.html"
        title="Coast FIRE Calculator"
        className="w-full border-0"
        style={{ height: '100vh' }}
        allow="clipboard-read; clipboard-write"
      />
    </>
  );
}
