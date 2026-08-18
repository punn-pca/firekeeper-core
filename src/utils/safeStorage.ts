// Safe storage with dynamic try/catch fallback to in-memory on storage/security exceptions (e.g. "The operation is insecure")

const memoryFallbacks = {
  local: new Map<string, string>(),
  session: new Map<string, string>()
};

function getLocalStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      return window.localStorage;
    }
  } catch (e) {
    // SecurityException / Insecure operation fallback
  }
  return null;
}

function getSessionStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && 'sessionStorage' in window) {
      return window.sessionStorage;
    }
  } catch (e) {
    // SecurityException / Insecure operation fallback
  }
  return null;
}

export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      const storage = getLocalStorage();
      if (storage) {
        const val = storage.getItem(key);
        if (val !== null) return val;
      }
    } catch (e) {
      // SecurityException / Insecure operation fallback
    }
    return memoryFallbacks.local.get(key) || null;
  },

  setItem(key: string, value: string): void {
    try {
      const storage = getLocalStorage();
      if (storage) {
        storage.setItem(key, String(value));
        return;
      }
    } catch (e) {
      // SecurityException / Insecure operation fallback
    }
    memoryFallbacks.local.set(key, String(value));
  },

  removeItem(key: string): void {
    try {
      const storage = getLocalStorage();
      if (storage) {
        storage.removeItem(key);
        return;
      }
    } catch (e) {
      // SecurityException / Insecure operation fallback
    }
    memoryFallbacks.local.delete(key);
  },

  clear(): void {
    try {
      const storage = getLocalStorage();
      if (storage) {
        storage.clear();
        return;
      }
    } catch (e) {
      // SecurityException / Insecure operation fallback
    }
    memoryFallbacks.local.clear();
  }
};

export const safeSessionStorage = {
  getItem(key: string): string | null {
    try {
      const storage = getSessionStorage();
      if (storage) {
        const val = storage.getItem(key);
        if (val !== null) return val;
      }
    } catch (e) {
      // SecurityException / Insecure operation fallback
    }
    return memoryFallbacks.session.get(key) || null;
  },

  setItem(key: string, value: string): void {
    try {
      const storage = getSessionStorage();
      if (storage) {
        storage.setItem(key, String(value));
        return;
      }
    } catch (e) {
      // SecurityException / Insecure operation fallback
    }
    memoryFallbacks.session.set(key, String(value));
  },

  removeItem(key: string): void {
    try {
      const storage = getSessionStorage();
      if (storage) {
        storage.removeItem(key);
        return;
      }
    } catch (e) {
      // SecurityException / Insecure operation fallback
    }
    memoryFallbacks.session.delete(key);
  },

  clear(): void {
    try {
      const storage = getSessionStorage();
      if (storage) {
        storage.clear();
        return;
      }
    } catch (e) {
      // SecurityException / Insecure operation fallback
    }
    memoryFallbacks.session.clear();
  }
};

