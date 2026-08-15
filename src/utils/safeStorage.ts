// Safe localStorage and sessionStorage wrapper handling DOMException "The operation is insecure" in iframe/restricted environments

const memoryFallback = new Map<string, string>();
const sessionMemoryFallback = new Map<string, string>();

function getLocalStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined') {
      const storage = window.localStorage;
      return storage || null;
    }
  } catch (e) {
    return null;
  }
  return null;
}

function getSessionStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined') {
      const storage = window.sessionStorage;
      return storage || null;
    }
  } catch (e) {
    return null;
  }
  return null;
}

export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      const ls = getLocalStorage();
      if (ls) {
        return ls.getItem(key);
      }
    } catch (e) {
      // fallback
    }
    return memoryFallback.get(key) || null;
  },

  setItem(key: string, value: string): void {
    try {
      const ls = getLocalStorage();
      if (ls) {
        ls.setItem(key, value);
        return;
      }
    } catch (e) {
      // fallback
    }
    memoryFallback.set(key, value);
  },

  removeItem(key: string): void {
    try {
      const ls = getLocalStorage();
      if (ls) {
        ls.removeItem(key);
        return;
      }
    } catch (e) {
      // fallback
    }
    memoryFallback.delete(key);
  },

  clear(): void {
    try {
      const ls = getLocalStorage();
      if (ls) {
        ls.clear();
        return;
      }
    } catch (e) {
      // fallback
    }
    memoryFallback.clear();
  }
};

export const safeSessionStorage = {
  getItem(key: string): string | null {
    try {
      const ss = getSessionStorage();
      if (ss) {
        return ss.getItem(key);
      }
    } catch (e) {
      // fallback
    }
    return sessionMemoryFallback.get(key) || null;
  },

  setItem(key: string, value: string): void {
    try {
      const ss = getSessionStorage();
      if (ss) {
        ss.setItem(key, value);
        return;
      }
    } catch (e) {
      // fallback
    }
    sessionMemoryFallback.set(key, value);
  },

  removeItem(key: string): void {
    try {
      const ss = getSessionStorage();
      if (ss) {
        ss.removeItem(key);
        return;
      }
    } catch (e) {
      // fallback
    }
    sessionMemoryFallback.delete(key);
  },

  clear(): void {
    try {
      const ss = getSessionStorage();
      if (ss) {
        ss.clear();
        return;
      }
    } catch (e) {
      // fallback
    }
    sessionMemoryFallback.clear();
  }
};


