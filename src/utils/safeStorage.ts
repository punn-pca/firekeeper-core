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

/**
 * User-Scoped Storage Key Generators to prevent any cross-account data or state leakage
 */
export function getDraftPromptStorageKey(userId: string | null = null): string {
  return `fire_keeper_draft_prompt_user_${userId || 'guest'}`;
}

export function getDeepSeekApiKeyStorageKey(userId: string | null = null): string {
  return `fire_keeper_deepseek_api_key_user_${userId || 'guest'}`;
}

/**
 * Purges legacy un-scoped storage keys that may have lingered from older versions
 */
export function purgeLegacyUnscopedStorage(): void {
  const legacyKeys = [
    'fire_keeper_conversations',
    'fire_keeper_current_conversation_id',
    'fire_keeper_memory_bank_v2',
    'fire_keeper_deleted_memory_ids_v2',
    'fire_keeper_draft_prompt',
  ];
  for (const key of legacyKeys) {
    safeLocalStorage.removeItem(key);
    safeSessionStorage.removeItem(key);
  }
}


