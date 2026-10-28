/**
 * Allow internal app routes and authentication providers (Google, Firebase)
 * to stay strictly INSIDE the in-app WebView without launching external browser apps.
 */
export function isTrustedNavigation(rawUrl: string): boolean {
  if (!rawUrl) return false;
  try {
    const url = new URL(rawUrl);

    // Local assets
    if (url.protocol === 'file:') {
      return url.pathname.startsWith('/android_asset/web/');
    }

    // Never trust executable JavaScript URLs as navigations.
    if (url.protocol === 'javascript:') {
      return false;
    }

    // Other special web schemas used by embedded web content.
    if (url.protocol === 'about:' || url.protocol === 'blob:' || url.protocol === 'data:') {
      return true;
    }

    if (url.protocol === 'https:' || url.protocol === 'http:') {
      const host = url.hostname.toLowerCase();

      // Main Firekeeper domain
      if (host === 'firekeeper.site' || host.endsWith('.firekeeper.site')) {
        return true;
      }

      // Firebase Authentication & Hosting endpoints
      if (
        host === 'firebaseapp.com' ||
        host.endsWith('.firebaseapp.com') ||
        host === 'web.app' ||
        host.endsWith('.web.app')
      ) {
        return true;
      }

      // Google Accounts, OAuth, and Google Identity Services
      if (
        host === 'accounts.google.com' ||
        host === 'apis.google.com' ||
        host.endsWith('.google.com') ||
        host.endsWith('.google.co.th') ||
        host.endsWith('.googleapis.com') ||
        host.endsWith('.gstatic.com') ||
        host === 'google.com' ||
        host === 'google.co.th'
      ) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}
