import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface SEOOptions {
  /** i18n key under "seo.<page>" containing { title, description } */
  page: string;
  /** Optional fallback title if the key is missing */
  fallbackTitle?: string;
  /** Optional fallback description if the key is missing */
  fallbackDescription?: string;
  /** Whether search engines should avoid indexing the current route */
  noIndex?: boolean;
  /** Open Graph type for the current route */
  type?: 'website' | 'article' | 'profile';
  /** Optional image used by OpenGraph/Twitter cards */
  image?: string | null;
  /** Optional JSON-LD payload, object or array */
  structuredData?: Record<string, unknown> | Record<string, unknown>[] | null;
}

const BRAND = 'Convinter';
const DEFAULT_IMAGE = '/placeholder.svg';

const resolveUrl = (value?: string | null) => {
  if (!value || typeof window === 'undefined') return '';
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value, window.location.origin).toString();
};

const ensureMeta = (selector: string, attr: 'name' | 'property', key: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  return el;
};

const ensureLink = (selector: string, rel: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  return el;
};

const ensureJsonLd = () => {
  const id = 'convinter-jsonld';
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.id = id;
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  return el;
};

/**
 * Sets title, description, robots, canonical, OpenGraph/Twitter metadata,
 * optional JSON-LD and <html lang> based on the active i18n language.
 */
export function useSEO({
  page,
  fallbackTitle,
  fallbackDescription,
  noIndex = false,
  type = 'website',
  image = DEFAULT_IMAGE,
  structuredData,
}: SEOOptions) {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const lang = i18n.language?.split('-')[0] || 'es';
    const currentUrl = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : '';

    const rawTitle = t(`seo.${page}.title`, { defaultValue: '' });
    const rawDesc = t(`seo.${page}.description`, { defaultValue: '' });

    const title = fallbackTitle || rawTitle || BRAND;
    const description = fallbackDescription || rawDesc || '';
    const fullTitle = title.includes(BRAND) ? title : `${title} | ${BRAND}`;
    const imageUrl = resolveUrl(image);

    document.documentElement.setAttribute('lang', lang);
    document.title = fullTitle;

    ensureMeta('meta[name="description"]', 'name', 'description').setAttribute('content', description);
    ensureMeta('meta[name="robots"]', 'name', 'robots').setAttribute('content', noIndex ? 'noindex, nofollow' : 'index, follow');

    ensureLink('link[rel="canonical"]', 'canonical').setAttribute('href', currentUrl);

    const alternateEs = ensureLink('link[rel="alternate"][hreflang="es"]', 'alternate');
    alternateEs.setAttribute('hreflang', 'es');
    alternateEs.setAttribute('href', currentUrl);

    const alternateEn = ensureLink('link[rel="alternate"][hreflang="en"]', 'alternate');
    alternateEn.setAttribute('hreflang', 'en');
    alternateEn.setAttribute('href', currentUrl);

    const alternateDefault = ensureLink('link[rel="alternate"][hreflang="x-default"]', 'alternate');
    alternateDefault.setAttribute('hreflang', 'x-default');
    alternateDefault.setAttribute('href', currentUrl);

    ensureMeta('meta[property="og:title"]', 'property', 'og:title').setAttribute('content', fullTitle);
    ensureMeta('meta[property="og:description"]', 'property', 'og:description').setAttribute('content', description);
    ensureMeta('meta[property="og:url"]', 'property', 'og:url').setAttribute('content', currentUrl);
    ensureMeta('meta[property="og:type"]', 'property', 'og:type').setAttribute('content', type);
    ensureMeta('meta[property="og:site_name"]', 'property', 'og:site_name').setAttribute('content', BRAND);
    ensureMeta('meta[property="og:locale"]', 'property', 'og:locale').setAttribute('content', lang === 'en' ? 'en_US' : 'es_ES');

    if (imageUrl) {
      ensureMeta('meta[property="og:image"]', 'property', 'og:image').setAttribute('content', imageUrl);
    }

    ensureMeta('meta[name="twitter:card"]', 'name', 'twitter:card').setAttribute('content', imageUrl ? 'summary_large_image' : 'summary');
    ensureMeta('meta[name="twitter:title"]', 'name', 'twitter:title').setAttribute('content', fullTitle);
    ensureMeta('meta[name="twitter:description"]', 'name', 'twitter:description').setAttribute('content', description);

    if (imageUrl) {
      ensureMeta('meta[name="twitter:image"]', 'name', 'twitter:image').setAttribute('content', imageUrl);
    }

    const jsonLd = ensureJsonLd();
    if (structuredData) {
      jsonLd.textContent = JSON.stringify(structuredData);
    } else {
      jsonLd.remove();
    }
  }, [t, i18n.language, page, fallbackTitle, fallbackDescription, noIndex, type, image, structuredData]);
}
