import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const DEFAULT_TITLE = 'PJ Study | Your Entire Study World, One Place';
const DEFAULT_DESCRIPTION =
  'Discover organized academic notes, explore subjects effortlessly, and keep your study resources together in one focused learning space.';
const SITE_NAME = 'PJ Study';

/**
 * Gets production or current base origin for canonical URLs.
 * Strips development localhost references if in production.
 */
function getCanonicalBaseUrl() {
  const envUrl = import.meta.env?.VITE_PUBLIC_APP_URL || import.meta.env?.VITE_FRONTEND_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.startsWith('http')) {
    return envUrl.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  return 'https://pjstudy.com';
}

/**
 * Dynamic SEO, Canonical & Structured Data Manager for PJ Study.
 *
 * @param {{
 *   title?: string,
 *   description?: string,
 *   canonical?: string,
 *   type?: string,
 *   image?: string,
 *   noindex?: boolean,
 *   schema?: object | object[]
 * }} props
 */
export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  type = 'website',
  image = '/vite.svg',
  noindex = false,
  schema
}) {
  const location = useLocation();

  useEffect(() => {
    // 1. Update Document Title
    const formattedTitle = title
      ? title.includes(SITE_NAME)
        ? title
        : `${title} | ${SITE_NAME}`
      : DEFAULT_TITLE;
    document.title = formattedTitle;

    // Helper to safely set/update a meta tag
    const setMetaTag = (attrName, attrValue, content) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content || '');
    };

    // Helper to safely set/update a link tag
    const setLinkTag = (rel, href) => {
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // 2. Meta Description
    setMetaTag('name', 'description', description);

    // 3. Robots Meta Tag (Enforce noindex on private / non-indexable routes)
    const robotsDirective = noindex ? 'noindex, nofollow' : 'index, follow';
    setMetaTag('name', 'robots', robotsDirective);

    // 4. Canonical URL
    const baseUrl = getCanonicalBaseUrl();
    const resolvedPath = canonical || location.pathname;
    const fullCanonicalUrl = resolvedPath.startsWith('http')
      ? resolvedPath
      : `${baseUrl}${resolvedPath.startsWith('/') ? '' : '/'}${resolvedPath}`;

    // Only add canonical tag if indexable (private pages shouldn't register canonical paths)
    if (!noindex) {
      setLinkTag('canonical', fullCanonicalUrl);
    } else {
      const existingCanonical = document.querySelector('link[rel="canonical"]');
      if (existingCanonical) {
        existingCanonical.remove();
      }
    }

    // 5. Open Graph Meta Tags
    setMetaTag('property', 'og:site_name', SITE_NAME);
    setMetaTag('property', 'og:title', formattedTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:url', fullCanonicalUrl);
    if (image) {
      const fullImageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`;
      setMetaTag('property', 'og:image', fullImageUrl);
    }

    // 6. Twitter Card Meta Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', formattedTitle);
    setMetaTag('name', 'twitter:description', description);
    if (image) {
      const fullImageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`;
      setMetaTag('name', 'twitter:image', fullImageUrl);
    }

    // 7. Structured Data (JSON-LD)
    const existingSchemaScript = document.getElementById('pj-study-ld-json');
    if (schema && !noindex) {
      const scriptContent = JSON.stringify(schema);
      if (existingSchemaScript) {
        existingSchemaScript.textContent = scriptContent;
      } else {
        const script = document.createElement('script');
        script.id = 'pj-study-ld-json';
        script.type = 'application/ld+json';
        script.textContent = scriptContent;
        document.head.appendChild(script);
      }
    } else if (existingSchemaScript) {
      existingSchemaScript.remove();
    }
  }, [title, description, canonical, type, image, noindex, schema, location.pathname]);

  return null;
}

export default SEO;
