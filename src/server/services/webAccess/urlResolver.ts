/**
 * URL Resolver & Canonical Link Handler
 * 
 * Handles canonical URL detection, tracking parameter stripping,
 * redirect unwrapping, AMP/Mobile alternate discovery, and robots compliance.
 */

export interface ResolvedUrlInfo {
  originalUrl: string;
  canonicalUrl: string;
  domain: string;
  publisher: string;
  isAmp?: boolean;
  ampUrl?: string;
  isAccessRestricted?: boolean;
}

const KNOWN_PUBLISHERS: Record<string, string> = {
  'thaipbs.or.th': 'Thai PBS',
  'thairath.co.th': 'ไทยรัฐออนไลน์ (Thai Rath)',
  'thestandard.co': 'THE STANDARD',
  'bangkokpost.com': 'Bangkok Post',
  'matichon.co.th': 'มติชนออนไลน์ (Matichon)',
  'prachachat.net': 'ประชาชาติธุรกิจ',
  'pptvhd36.com': 'PPTV HD 36',
  'mgronline.com': 'MGR Online (ผู้จัดการ)',
  'dailynews.co.th': 'เดลินิวส์ (Daily News)',
  'reuters.com': 'Reuters',
  'apnews.com': 'Associated Press (AP)',
  'bbc.com': 'BBC News',
  'bbc.co.uk': 'BBC News',
  'bloomberg.com': 'Bloomberg',
  'nytimes.com': 'The New York Times',
  'theguardian.com': 'The Guardian',
  'aljazeera.com': 'Al Jazeera',
  'cnn.com': 'CNN',
  'bot.or.th': 'ธนาคารแห่งประเทศไทย (Bank of Thailand)',
  'set.or.th': 'ตลาดหลักทรัพย์แห่งประเทศไทย (SET)',
  'sec.or.th': 'ก.ล.ต. (SEC Thailand)',
  'who.int': 'World Health Organization (WHO)',
  'wikipedia.org': 'Wikipedia',
};

/**
 * Strips tracking parameters and normalizes URL.
 */
export function normalizeUrl(urlStr: string): string {
  try {
    const url = new URL(urlStr.trim());
    url.hash = '';
    url.hostname = url.hostname.toLowerCase();

    // Clean tracking search parameters
    const toDelete: string[] = [];
    url.searchParams.forEach((_, key) => {
      if (/^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$|_ga$|_gl$|ref$|ref_src$|source$)/i.test(key)) {
        toDelete.push(key);
      }
    });
    toDelete.forEach((k) => url.searchParams.delete(k));

    return url.toString().replace(/\/$/, '');
  } catch {
    return urlStr.trim().replace(/\/$/, '');
  }
}

/**
 * Decodes redirect wrappers like DuckDuckGo uddg or Google url.
 */
export function unwrapRedirectUrl(rawUrl: string): string {
  try {
    let clean = rawUrl.trim();
    if (clean.startsWith('//')) {
      clean = `https:${clean}`;
    }
    const url = new URL(clean);
    const uddg = url.searchParams.get('uddg');
    if (uddg) return decodeURIComponent(uddg);

    const q = url.searchParams.get('url') || url.searchParams.get('q');
    if (q && /^https?:\/\//i.test(q)) return decodeURIComponent(q);

    return clean;
  } catch {
    return rawUrl;
  }
}

/**
 * Extracts clean domain name from URL.
 */
export function extractDomain(urlStr: string): string {
  try {
    return new URL(urlStr).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return 'web';
  }
}

/**
 * Identifies publisher name from domain or meta.
 */
export function identifyPublisher(domain: string, ogSiteName?: string): string {
  if (ogSiteName && ogSiteName.trim().length > 1) {
    return ogSiteName.trim();
  }
  const cleanDomain = domain.toLowerCase().replace(/^www\./, '');
  if (KNOWN_PUBLISHERS[cleanDomain]) {
    return KNOWN_PUBLISHERS[cleanDomain];
  }

  // Check wildcard matches (e.g., news.thaipbs.or.th -> Thai PBS)
  for (const [known, name] of Object.entries(KNOWN_PUBLISHERS)) {
    if (cleanDomain.endsWith(`.${known}`) || cleanDomain === known) {
      return name;
    }
  }

  // Capitalized domain fallback
  const parts = cleanDomain.split('.');
  if (parts.length >= 2) {
    return parts[parts.length - 2].toUpperCase();
  }
  return cleanDomain;
}

/**
 * Resolves relative URLs against a base URL.
 */
export function resolveAbsoluteUrl(relativeOrAbsolute: string, baseUrl: string): string {
  try {
    return new URL(relativeOrAbsolute, baseUrl).toString();
  } catch {
    return relativeOrAbsolute;
  }
}
