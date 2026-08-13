import { APP_CONFIG } from './env';
import { ApiError, UnauthorizedError, TimeoutError } from '../utils/errors';

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem(APP_CONFIG.TOKEN_KEY);
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
    const response = await fetch(`${APP_CONFIG.API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401) {
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
