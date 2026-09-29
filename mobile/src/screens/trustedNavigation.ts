/** Allow only the bundled app and the exact hosts needed for the hosted app's authentication flow. */
export function isTrustedNavigation(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    if (url.protocol === 'file:') return url.hostname === '' && url.pathname.startsWith('/android_asset/web/');
    return url.protocol === 'https:' && (
      url.hostname === 'firekeeper.site' ||
      url.hostname === 'accounts.google.com' ||
      url.hostname === 'firekeeper-pca.firebaseapp.com'
    );
  } catch {
    return false;
  }
}
