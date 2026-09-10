/**
 * Shared utility for generating and verifying public share URLs.
 * Public HTML reports live on the dedicated share subdomain.
 */

const PUBLIC_SHARE_HOST = 'share.firekeeper.site';

export function getPublicShareUrl(shareId: string, customBaseUrl?: string): string {
  const isProduction =
    (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') ||
    Boolean((import.meta as any).env?.PROD);

  // Production public shares always use the dedicated share subdomain.
  if (isProduction) {
    return `https://${PUBLIC_SHARE_HOST}/shared/${shareId}`;
  }

  let baseUrl = customBaseUrl;

  if (!baseUrl && typeof process !== 'undefined' && process.env) {
    baseUrl = process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  }

  if (!baseUrl && typeof window !== 'undefined') {
    baseUrl = (import.meta as any).env?.VITE_PUBLIC_APP_URL ||
              (import.meta as any).env?.VITE_NEXT_PUBLIC_APP_URL ||
              (import.meta as any).env?.NEXT_PUBLIC_APP_URL ||
              (import.meta as any).env?.VITE_APP_URL ||
              (import.meta as any).env?.APP_URL;
  }

  if (baseUrl && baseUrl.includes('run.app')) {
    baseUrl = 'http://localhost:3000';
  }

  if (!baseUrl) baseUrl = 'http://localhost:3000';

  const normalizedBase = baseUrl.trim().replace(/\/+$/, '');
  return `${normalizedBase}/shared/${shareId}`;
}
