import { APP_CONFIG } from './env';
import { ApiError, UnauthorizedError } from '../utils/errors';
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


  try {
    const response = await fetch(`${APP_CONFIG.API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });


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
    if (err instanceof ApiError) throw err;
    throw new ApiError((err as Error).message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย', 500);
  }
}
