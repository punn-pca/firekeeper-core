import { MemoryItem } from '../types';
import { INITIAL_MEMORIES } from '../data/pcaDefaults';
import { safeLocalStorage } from '../utils/safeStorage';

function getStorageKey(userId?: string | null): string {
  const uid = userId && userId.trim() ? userId.trim() : 'guest';
  return `fire_keeper_memory_bank_user_${uid}`;
}

function getDeletedIdsKey(userId?: string | null): string {
  const uid = userId && userId.trim() ? userId.trim() : 'guest';
  return `fire_keeper_deleted_memory_ids_user_${uid}`;
}

export const memoryRepository = {
  loadMemories(userId?: string | null): MemoryItem[] {
    const storageKey = getStorageKey(userId);
    const deletedIdsKey = getDeletedIdsKey(userId);
    console.log(`[MemoryBank] LOAD: Loading memories for user "${userId || 'guest'}"`);
    const permanentlyForbiddenIds = ['mem-5', 'mem-7', 'mem-8', 'mem-9'];
    let deletedIds: string[] = [];
    try {
      const deletedIdsRaw = safeLocalStorage.getItem(deletedIdsKey);
      if (deletedIdsRaw) {
        deletedIds = JSON.parse(deletedIdsRaw);
      }
    } catch (e) {}

    // Ensure permanently forbidden IDs are always in deletedIds
    for (const forbiddenId of permanentlyForbiddenIds) {
      if (!deletedIds.includes(forbiddenId)) {
        deletedIds.push(forbiddenId);
      }
    }
    try {
      safeLocalStorage.setItem(deletedIdsKey, JSON.stringify(deletedIds));
    } catch (e) {}

    try {
      const stored = safeLocalStorage.getItem(storageKey);
      if (stored) {
        const parsed: MemoryItem[] = JSON.parse(stored);
        const filtered = parsed.filter(m => 
          !deletedIds.includes(m.id) && 
          !permanentlyForbiddenIds.includes(m.id) &&
          !m.provenanceId?.includes('CASE-FICTIONAL-BASELINE') &&
          !m.content?.includes('Fictional Case Baseline') &&
          !m.content?.includes('สมมติฐานเชิงประวัติศาสตร์ (Fictional Historical Baseline)')
        );
        // Update stored cache to remove forbidden ids
        safeLocalStorage.setItem(storageKey, JSON.stringify(filtered));
        console.log(`[MemoryBank] HYDRATE: Loaded ${filtered.length} user-scoped records for "${userId || 'guest'}"`);
        return filtered;
      }
    } catch (err) {
      console.warn('[MemoryBank] LOAD: Error reading persistent store', err);
    }

    // Idempotent Seeding if persistent store is empty for this user, filtering out deleted IDs
    console.log(`[MemoryBank] SEED: Initializing default memory records for user "${userId || 'guest'}"`);
    const initial = INITIAL_MEMORIES
      .filter(m => !deletedIds.includes(m.id) && !permanentlyForbiddenIds.includes(m.id))
      .map(m => ({ ...m, userId: userId || 'guest' }));
    try {
      safeLocalStorage.setItem(storageKey, JSON.stringify(initial));
    } catch (e) {}
    return initial;
  },

  saveMemories(memories: MemoryItem[], userId?: string | null): void {
    try {
      const storageKey = getStorageKey(userId);
      const scoped = memories.map(m => ({ ...m, userId: m.userId || userId || 'guest' }));
      safeLocalStorage.setItem(storageKey, JSON.stringify(scoped));
    } catch (err) {
      console.error('[MemoryBank] SAVE ERROR:', err);
    }
  },

  addMemory(content: string, layer: MemoryItem['layer'], source: string, userId?: string | null): MemoryItem {
    const memories = this.loadMemories(userId);
    const newId = `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newMemory: MemoryItem = {
      id: newId,
      userId: userId || 'guest',
      content,
      layer,
      storeType: 'Working',
      source: source || 'User Input',
      provenanceId: `USER-INPUT-${Date.now()}`,
      sourceUrl: 'https://internal.wiki/memory/user-created',
      confidence: 0.95,
      created_at: new Date().toISOString(),
    };

    const updated = [newMemory, ...memories];
    this.saveMemories(updated, userId);
    console.log('[MemoryBank] CREATE:', { id: newId, userId: userId || 'guest', content: content.substring(0, 30) });
    return newMemory;
  },

  deleteMemory(id: string, userId?: string | null): MemoryItem[] {
    const storageKey = getStorageKey(userId);
    const deletedIdsKey = getDeletedIdsKey(userId);
    console.log(`[MemoryBank] DELETE attempting record ID "${id}" for user "${userId || 'guest'}"`);
    const memories = this.loadMemories(userId);
    const exists = memories.some(m => m.id === id);
    const updated = memories.filter(m => m.id !== id);

    // Track deleted IDs persistently per user so seeding never resurrects deleted default records
    try {
      const deletedIdsRaw = safeLocalStorage.getItem(deletedIdsKey);
      const deletedIds: string[] = deletedIdsRaw ? JSON.parse(deletedIdsRaw) : [];
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        safeLocalStorage.setItem(deletedIdsKey, JSON.stringify(deletedIds));
      }
    } catch (e) {}

    this.saveMemories(updated, userId);

    const deleteResult = exists ? 'SUCCESS' : 'NOT_FOUND';
    console.log('[MemoryBank] DELETE:', {
      recordId: id,
      userId: userId || 'guest',
      deleteResult,
      remainingCount: updated.length,
    });

    return updated;
  },

  updateMemory(id: string, updates: Partial<MemoryItem>, userId?: string | null): MemoryItem[] {
    const memories = this.loadMemories(userId);
    const updated = memories.map(m => m.id === id ? { ...m, ...updates } : m);
    this.saveMemories(updated, userId);
    console.log('[MemoryBank] UPDATE:', { recordId: id, userId: userId || 'guest', updates });
    return updated;
  },

  clearUserMemories(userId?: string | null): void {
    const storageKey = getStorageKey(userId);
    const deletedIdsKey = getDeletedIdsKey(userId);
    try {
      safeLocalStorage.removeItem(storageKey);
      safeLocalStorage.removeItem(deletedIdsKey);
    } catch (e) {}
  }
};

