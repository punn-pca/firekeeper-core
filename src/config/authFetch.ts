import { auth } from '../lib/firebase';

/** Sends the Firebase ID token required by protected backend endpoints. */
export async function fetchWithAuthorization(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  const user = auth.currentUser;
  if (user) {
    const forceRefresh = headers.get('X-Refresh-Token') === 'true';
    if (forceRefresh) headers.delete('X-Refresh-Token');
    const token = await user.getIdToken(forceRefresh);
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers, credentials: 'include' });
}