import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getPageSEO, siteConfig } from '@/lib/seo-config';

export function useSEO(customMeta?: {
  title?: string;
  description?: string;
  keywords?: string[];
  jsonLd?: object;
}) {
  const location = useLocation();
  const pageSEO = getPageSEO(location.pathname);

  const title = customMeta?.title || pageSEO.title;
  const description = customMeta?.description || pageSEO.description;
  const keywords = customMeta?.keywords || pageSEO.keywords || siteConfig.keywords;
  const jsonLd = customMeta?.jsonLd || pageSEO.jsonLd;
  const canonicalUrl = `${siteConfig.url}${location.pathname}`;

  useEffect(() => {
    // Update title
    document.title = title;

    // Update or create meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords.join(', '));

    // Open Graph tags
    updateMetaTag('og:title', title, 'property');
    updateMetaTag('og:description', description, 'property');
    updateMetaTag('og:url', canonicalUrl, 'property');
    updateMetaTag('og:type', 'website', 'property');
    updateMetaTag('og:image', `${siteConfig.url}${siteConfig.ogImage}`, 'property');
    updateMetaTag('og:site_name', siteConfig.name, 'property');

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image', 'name');
    updateMetaTag('twitter:title', title, 'name');
    updateMetaTag('twitter:description', description, 'name');
    updateMetaTag('twitter:image', `${siteConfig.url}${siteConfig.ogImage}`, 'name');

    // Canonical URL
    updateCanonicalLink(canonicalUrl);

    // JSON-LD structured data
    if (jsonLd) {
      updateJsonLd(jsonLd);
    }

    // Cleanup function to remove JSON-LD on unmount
    return () => {
      const existingScript = document.getElementById('json-ld-seo');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [title, description, keywords, canonicalUrl, jsonLd]);
}

function updateMetaTag(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  
  element.content = content;
}

function updateCanonicalLink(url: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  
  link.href = url;
}

function updateJsonLd(data: object) {
  let script = document.getElementById('json-ld-seo') as HTMLScriptElement;
  
  if (!script) {
    script = document.createElement('script');
    script.id = 'json-ld-seo';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  
  script.textContent = JSON.stringify(data);
}

// Component version for use in any component
export function SEOHead() {
  useSEO();
  return null;
}
