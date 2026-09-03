// Safe storage with dynamic try/catch fallback to in-memory on storage/security exceptions (e.g. "The operation is insecure")

const memoryFallbacks = {
  local: new Map<string, string>(),
  session: new Map<string, string>()
};

function getLocalStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const probeKey = '__fk_storage_probe__';
      window.localStorage.setItem(probeKey, '1');
      window.localStorage.removeItem(probeKey);
      return window.localStorage;
    }
  } catch (e) {
    // Restricted or sandboxed storage exception - gracefully fallback to memory
  }
  return null;
}

function getSessionStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const probeKey = '__fk_storage_probe__';
      window.sessionStorage.setItem(probeKey, '1');
      window.sessionStorage.removeItem(probeKey);
      return window.sessionStorage;
    }
  } catch (e) {
    // Restricted or sandboxed storage exception - gracefully fallback to memory
  }
  return null;
}

export const safeLocalStorage = {
  getItem(key: string): string | null {
    const storage = getLocalStorage();
    if (storage) {
      try {
        const val = storage.getItem(key);
        if (val !== null) return val;
      } catch (e) {}
    }
    return memoryFallbacks.local.get(key) || null;
  },

  setItem(key: string, value: string): void {
    const storage = getLocalStorage();
    if (storage) {
      try {
        storage.setItem(key, String(value));
      } catch (e) {}
    }
    memoryFallbacks.local.set(key, String(value));
  },

  removeItem(key: string): void {
    const storage = getLocalStorage();
    if (storage) {
      try {
        storage.removeItem(key);
      } catch (e) {}
    }
    memoryFallbacks.local.delete(key);
  },

  clear(): void {
    const storage = getLocalStorage();
    if (storage) {
      try {
        storage.clear();
      } catch (e) {}
    }
    memoryFallbacks.local.clear();
  }
};

export const safeSessionStorage = {
  getItem(key: string): string | null {
    const storage = getSessionStorage();
    if (storage) {
      try {
        const val = storage.getItem(key);
        if (val !== null) return val;
      } catch (e) {}
    }
    return memoryFallbacks.session.get(key) || null;
  },

  setItem(key: string, value: string): void {
    const storage = getSessionStorage();
    if (storage) {
      try {
        storage.setItem(key, String(value));
      } catch (e) {}
    }
    memoryFallbacks.session.set(key, String(value));
  },

  removeItem(key: string): void {
    const storage = getSessionStorage();
    if (storage) {
      try {
        storage.removeItem(key);
      } catch (e) {}
    }
    memoryFallbacks.session.delete(key);
  },

  clear(): void {
    const storage = getSessionStorage();
    if (storage) {
      try {
        storage.clear();
      } catch (e) {}
    }
    memoryFallbacks.session.clear();
  }
};


