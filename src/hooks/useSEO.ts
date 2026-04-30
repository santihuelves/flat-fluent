import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface SEOOptions {
  /** i18n key under "seo.<page>" containing { title, description } */
  page: string;
  /** Optional fallback title if the key is missing */
  fallbackTitle?: string;
  /** Optional fallback description if the key is missing */
  fallbackDescription?: string;
}

const BRAND = 'Convinter';

const ensureMeta = (selector: string, attr: 'name' | 'property', key: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  return el;
};

/**
 * Sets <title>, <meta description>, OpenGraph/Twitter equivalents
 * and <html lang> based on the active i18n language.
 *
 * Usage:
 *   useSEO({ page: 'landing' });
 * Will read i18n keys: seo.landing.title and seo.landing.description.
 */
export function useSEO({ page, fallbackTitle, fallbackDescription }: SEOOptions) {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const lang = i18n.language?.split('-')[0] || 'es';

    // Resolve translations with safe fallbacks.
    const rawTitle = t(`seo.${page}.title`, { defaultValue: '' });
    const rawDesc = t(`seo.${page}.description`, { defaultValue: '' });

    const title = rawTitle || fallbackTitle || BRAND;
    const description = rawDesc || fallbackDescription || '';
    const fullTitle = title.includes(BRAND) ? title : `${title} · ${BRAND}`;

    // <html lang>
    document.documentElement.setAttribute('lang', lang);

    // <title>
    document.title = fullTitle;

    // <meta name="description">
    const descMeta = ensureMeta('meta[name="description"]', 'name', 'description');
    descMeta.setAttribute('content', description);

    // OpenGraph
    const ogTitle = ensureMeta('meta[property="og:title"]', 'property', 'og:title');
    ogTitle.setAttribute('content', fullTitle);
    const ogDesc = ensureMeta('meta[property="og:description"]', 'property', 'og:description');
    ogDesc.setAttribute('content', description);
    const ogLocale = ensureMeta('meta[property="og:locale"]', 'property', 'og:locale');
    ogLocale.setAttribute('content', lang === 'en' ? 'en_US' : 'es_ES');

    // Twitter
    const twTitle = ensureMeta('meta[name="twitter:title"]', 'name', 'twitter:title');
    twTitle.setAttribute('content', fullTitle);
    const twDesc = ensureMeta('meta[name="twitter:description"]', 'name', 'twitter:description');
    twDesc.setAttribute('content', description);
  }, [t, i18n.language, page, fallbackTitle, fallbackDescription]);
}
