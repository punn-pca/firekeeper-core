import { APP_CONFIG } from './env';
import { ApiError, UnauthorizedError, TimeoutError } from '../utils/errors';
import { auth } from '../lib/firebase';

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  let token: string | null = null;
  if (auth.currentUser) {
    try {
      token = await auth.currentUser.getIdToken(isRetry);
    } catch (e) {
      console.warn('Failed to retrieve Firebase ID token:', e);
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

  try {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = cleanEndpoint.startsWith('/api/')
      ? cleanEndpoint
      : `${APP_CONFIG.API_BASE_URL.replace(/\/+$/, '')}${cleanEndpoint}`;

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401) {
        if (!isRetry && auth.currentUser) {
          // Exactly one retry with forceRefresh=true
          return apiFetch<T>(endpoint, options, true);
        }
        throw new UnauthorizedError();
      }
      const errorData = await response.json().catch(() => ({ message: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' }));
      throw new ApiError(errorData.message || 'API request failed', response.status);
    }

    return await response.json();
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) throw err;
    if ((err as Error).name === 'AbortError') {
      throw new TimeoutError();
    }
    throw new ApiError((err as Error).message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย', 500);
  }
}
