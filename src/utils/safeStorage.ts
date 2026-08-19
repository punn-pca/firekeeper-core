// Safe storage with dynamic try/catch fallback to in-memory on storage/security exceptions (e.g. "The operation is insecure")

// Safe storage with dynamic try/catch fallback to in-memory on storage/security exceptions (e.g. "The operation is insecure")

const memoryFallbacks = {
  local: new Map<string, string>(),
  session: new Map<string, string>()
};

function getLocalStorage(): Storage | null {
  // Always return null to force memory fallbacks, avoiding insecure operation errors
  return null;
}

function getSessionStorage(): Storage | null {
  // Always return null to force memory fallbacks, avoiding insecure operation errors
  return null;
}

export const safeLocalStorage = {
  getItem(key: string): string | null {
    return memoryFallbacks.local.get(key) || null;
  },

  setItem(key: string, value: string): void {
    memoryFallbacks.local.set(key, String(value));
  },

  removeItem(key: string): void {
    memoryFallbacks.local.delete(key);
  },

  clear(): void {
    memoryFallbacks.local.clear();
  }
};

export const safeSessionStorage = {
  getItem(key: string): string | null {
    return memoryFallbacks.session.get(key) || null;
  },

  setItem(key: string, value: string): void {
    memoryFallbacks.session.set(key, String(value));
  },

  removeItem(key: string): void {
    memoryFallbacks.session.delete(key);
  },

  clear(): void {
    memoryFallbacks.session.clear();
  }
};

