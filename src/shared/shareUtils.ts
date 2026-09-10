/**
 * Shared utility for generating and verifying public share URLs.
 * Ensures consistent URL construction across both frontend and backend.
 */

export function getPublicShareUrl(shareId: string, customBaseUrl?: string): string {
  // 1. Determine environment
  const isProduction = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production';

  // 2. Resolve Base URL
  let baseUrl = customBaseUrl;

  if (!baseUrl) {
    if (typeof process !== 'undefined' && process.env) {
      // Backend or node environment
      if (isProduction) {
        // In production, backend MUST strictly use PUBLIC_APP_URL or NEXT_PUBLIC_APP_URL.
        // It is FORBIDDEN to use APP_URL as that represents the backend Cloud Run service URL.
        baseUrl = process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL;
      } else {
        // Development fallback
        baseUrl = process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
      }
    }
  }

  if (!baseUrl && typeof window !== 'undefined') {
    // Frontend browser environment (using Vite-injected variables or fallback)
    baseUrl = (import.meta as any).env?.VITE_PUBLIC_APP_URL ||
              (import.meta as any).env?.VITE_NEXT_PUBLIC_APP_URL || 
              (import.meta as any).env?.NEXT_PUBLIC_APP_URL;

    if (!baseUrl && !isProduction) {
      baseUrl = (import.meta as any).env?.VITE_APP_URL || (import.meta as any).env?.APP_URL;
    }
  }

  // 3. Strict validation & Cloud Run override rules
  // If the resolved baseUrl contains "run.app" or "asia-southeast1.run.app", it is a Cloud Run backend/internal URL.
  // We MUST NOT use it as the public share URL! Overriding it with the canonical frontend domain.
  if (baseUrl && (baseUrl.includes('run.app') || baseUrl.includes('asia-southeast1.run.app'))) {
    baseUrl = 'https://firekeeper.site';
  }

  if (isProduction) {
    // In production, we MUST have a valid non-localhost canonical domain
    if (!baseUrl || baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') || baseUrl.includes('0.0.0.0')) {
      baseUrl = 'https://firekeeper.site';
    }
  } else {
    // Development fallback
    if (!baseUrl) {
      baseUrl = 'http://localhost:3000';
    }
  }

  // Normalize baseUrl: remove trailing slash
  const normalizedBase = baseUrl.trim().replace(/\/+$/, '');
  return `${normalizedBase}/shared/${shareId}`;
}
