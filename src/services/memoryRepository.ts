import { MemoryItem } from '../types';
import { INITIAL_MEMORIES } from '../data/pcaDefaults';
import { safeLocalStorage } from '../utils/safeStorage';

const STORAGE_KEY = 'fire_keeper_memory_bank_v2';
const DELETED_IDS_KEY = 'fire_keeper_deleted_memory_ids_v2';

export const memoryRepository = {
  loadMemories(): MemoryItem[] {
    console.log('[MemoryBank] LOAD: Loading memories from persistent store');
    let deletedIds: string[] = [];
    try {
      const deletedIdsRaw = safeLocalStorage.getItem(DELETED_IDS_KEY);
      if (deletedIdsRaw) {
        deletedIds = JSON.parse(deletedIdsRaw);
      }
    } catch (e) {}

    try {
      const stored = safeLocalStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: MemoryItem[] = JSON.parse(stored);
        const filtered = parsed.filter(m => !deletedIds.includes(m.id));
        console.log(`[MemoryBank] HYDRATE: Successfully hydrated ${filtered.length} memory records from persistent store`);
        return filtered;
      }
    } catch (err) {
      console.warn('[MemoryBank] LOAD: Error reading persistent store', err);
    }

    // Idempotent Seeding if persistent store is empty, filtering out deleted IDs
    console.log('[MemoryBank] SEED: Initializing default memory records idempotently');
    const initial = INITIAL_MEMORIES.filter(m => !deletedIds.includes(m.id));
    try {
      safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    } catch (e) {}
    return initial;
  },

  saveMemories(memories: MemoryItem[]): void {
    try {
      safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
    } catch (err) {
      console.error('[MemoryBank] SAVE ERROR:', err);
    }
  },

  addMemory(content: string, layer: MemoryItem['layer'], source: string): MemoryItem {
    const memories = this.loadMemories();
    const newId = `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newMemory: MemoryItem = {
      id: newId,
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
    this.saveMemories(updated);
    console.log('[MemoryBank] CREATE:', { id: newId, content: content.substring(0, 30), backend: 'localStorage' });
    return newMemory;
  },

  deleteMemory(id: string): MemoryItem[] {
    console.log('[MemoryBank] DELETE attempting record ID:', id);
    const memories = this.loadMemories();
    const exists = memories.some(m => m.id === id);
    const updated = memories.filter(m => m.id !== id);

    // Track deleted IDs persistently so seeding never resurrects deleted default records
    try {
      const deletedIdsRaw = safeLocalStorage.getItem(DELETED_IDS_KEY);
      const deletedIds: string[] = deletedIdsRaw ? JSON.parse(deletedIdsRaw) : [];
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        safeLocalStorage.setItem(DELETED_IDS_KEY, JSON.stringify(deletedIds));
      }
    } catch (e) {}

    this.saveMemories(updated);

    const deleteResult = exists ? 'SUCCESS' : 'NOT_FOUND';
    console.log('[MemoryBank] DELETE:', {
      recordId: id,
      persistenceBackend: 'localStorage',
      deleteResult,
      remainingCount: updated.length,
    });

    return updated;
  },

  updateMemory(id: string, updates: Partial<MemoryItem>): MemoryItem[] {
    const memories = this.loadMemories();
    const updated = memories.map(m => m.id === id ? { ...m, ...updates } : m);
    this.saveMemories(updated);
    console.log('[MemoryBank] UPDATE:', { recordId: id, updates, persistenceBackend: 'localStorage' });
    return updated;
  }
};
