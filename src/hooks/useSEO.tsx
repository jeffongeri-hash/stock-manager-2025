import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { getPageSEO, siteConfig } from '@/lib/seo-config';

interface CustomMeta {
  title?: string;
  description?: string;
  keywords?: string[];
  jsonLd?: object;
}

/**
 * SEO head component using react-helmet-async.
 * Renders per-route <title>, meta, canonical, OG/Twitter, and JSON-LD tags
 * so JS-executing crawlers (Googlebot) see accurate per-page metadata.
 *
 * Note: social-preview crawlers (LinkedIn, Slack, Facebook) don't execute JS
 * and only see the static head in index.html. Keep sitewide og:* fallbacks there.
 */
export function SEOHead({ customMeta }: { customMeta?: CustomMeta } = {}) {
  const location = useLocation();
  const pageSEO = getPageSEO(location.pathname);

  const title = customMeta?.title || pageSEO.title;
  const description = customMeta?.description || pageSEO.description;
  const keywords = customMeta?.keywords || pageSEO.keywords || siteConfig.keywords;
  const jsonLd = customMeta?.jsonLd || pageSEO.jsonLd;
  const canonicalUrl = `${siteConfig.url}${location.pathname}`;
  const ogImage = `${siteConfig.url}${siteConfig.ogImage}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={pageSEO.ogType || 'website'} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={siteConfig.name} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}

/**
 * Hook form for pages that want to override SEO for the current route.
 * Renders nothing on its own — use <PageSEO /> wrapper below in JSX.
 */
export function useSEO(_customMeta?: CustomMeta) {
  // kept for backwards compatibility; prefer <PageSEO /> in route components.
}

/**
 * Drop into any page component to override the default per-route SEO:
 *   <PageSEO title="Custom" description="..." />
 */
export function PageSEO(customMeta: CustomMeta) {
  return <SEOHead customMeta={customMeta} />;
}
