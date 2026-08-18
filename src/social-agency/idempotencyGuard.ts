import { SocialActionType } from './types';
import { safeLocalStorage } from '../utils/safeStorage';

export type ActionLifecycleStatus =
  | 'DISCOVERED'
  | 'ANALYZED'
  | 'POLICY_CHECKED'
  | 'EXECUTING'
  | 'EXECUTED'
  | 'FAILED'
  | 'LOCKED'
  | 'DUPLICATE_BLOCKED';

export interface ActionAuditRecord {
  event_id: string;
  target_id: string;
  target_comment_id?: string;
  thread_id?: string;
  action_key: string;
  agent_id: string;
  action_type: SocialActionType;
  content_hash: string;
  semantic_fingerprint: string;
  status: ActionLifecycleStatus;
  created_at: string;
  executed_at?: string;
  execution_attempt: number;
  result?: string;
  error?: string;
  content?: string;
  author_context?: string;
}

const STORAGE_KEY_SOCIAL_AUDIT = 'fire_keeper_social_audit_v3';

export class IdempotencyGuard {
  private static locks: Map<string, boolean> = new Map();
  private static auditStore: Map<string, ActionAuditRecord> = new Map();
  private static processedEvents: Set<string> = new Set();
  private static isInitialized = false;

  private static hydrateFromStorage() {
    if (this.isInitialized) return;
    try {
      const raw = safeLocalStorage.getItem(STORAGE_KEY_SOCIAL_AUDIT);
      if (raw) {
        const records: ActionAuditRecord[] = JSON.parse(raw);
        for (const rec of records) {
          this.auditStore.set(rec.action_key, rec);
        }
      }
    } catch (e) {
      console.warn('[IdempotencyGuard] Failed to hydrate persistent store:', e);
    }
    this.isInitialized = true;
  }

  private static persistToStorage() {
    try {
      const records = Array.from(this.auditStore.values());
      safeLocalStorage.setItem(STORAGE_KEY_SOCIAL_AUDIT, JSON.stringify(records));
    } catch (e) {
      console.warn('[IdempotencyGuard] Failed to persist store:', e);
    }
  }

  public static generateContentHash(content: string): string {
    let hash = 0;
    const cleanStr = (content || '').trim().toLowerCase().replace(/\s+/g, ' ');
    for (let i = 0; i < cleanStr.length; i++) {
      const char = cleanStr.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }

  public static getSemanticFingerprint(content: string): string {
    const clean = (content || '')
      .toLowerCase()
      .replace(/[^\w\sก-๙]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const stopWords = new Set(['ครับ', 'ค่ะ', 'นะ', 'คะ', 'และ', 'หรือ', 'ของ', 'ใน', 'ที่', 'การ', 'ความ', 'the', 'a', 'an', 'is', 'of', 'to', 'and', 'in', 'on', 'for', 'with']);
    const tokens = clean.split(' ').filter(t => t.length > 2 && !stopWords.has(t));
    return Array.from(new Set(tokens)).sort().join('|');
  }

  public static calculateSemanticSimilarity(text1: string, text2: string): number {
    const clean1 = (text1 || '').toLowerCase().replace(/[^\w\sก-๙]/g, ' ').replace(/\s+/g, ' ').trim();
    const clean2 = (text2 || '').toLowerCase().replace(/[^\w\sก-๙]/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (clean1 === clean2) return 1.0;
    if (!clean1 || !clean2) return 0.0;

    const stopWords = new Set(['ครับ', 'ค่ะ', 'นะ', 'คะ', 'และ', 'หรือ', 'ของ', 'ใน', 'ที่', 'การ', 'ความ', 'the', 'a', 'an', 'is', 'of', 'to', 'and', 'in', 'on', 'for', 'with']);
    const set1 = new Set(clean1.split(' ').filter(t => t.length > 1 && !stopWords.has(t)));
    const set2 = new Set(clean2.split(' ').filter(t => t.length > 1 && !stopWords.has(t)));

    if (set1.size === 0 || set2.size === 0) return 0.0;

    let intersection = 0;
    for (const token of set1) {
      if (set2.has(token)) intersection++;
    }
    const union = new Set([...set1, ...set2]).size;
    return union === 0 ? 0.0 : intersection / union;
  }

  public static buildActionKey(
    platform: string,
    actionType: SocialActionType,
    targetId: string,
    content: string
  ): string {
    const hash = this.generateContentHash(content);
    return `${platform}:${actionType}:${targetId}:${hash}`;
  }

  public static isEventProcessed(eventId: string): boolean {
    this.hydrateFromStorage();
    return this.processedEvents.has(eventId);
  }

  public static markEventProcessed(eventId: string): void {
    this.hydrateFromStorage();
    this.processedEvents.add(eventId);
  }

  /**
   * CANONICAL REPLY DEDUP GATE
   * Single central inspection gate before any postComment/reply call.
   * Checks in strict order:
   * 1. Exact comment / target duplicate
   * 2. Exact response duplicate (response_hash)
   * 3. Semantic response duplicate (semantic similarity >= threshold, default 0.85)
   * 4. Same-thread / context duplicate (redundant without new perspective)
   * 5. Meaningful contribution check (rejection of empty / generic praise without substance)
   */
  public static verifyCanonicalReplyDedupGate(params: {
    platform: string;
    actionType: SocialActionType;
    targetId: string;
    targetCommentId?: string;
    threadId?: string;
    content: string;
    authorContext?: string;
    semanticThreshold?: number;
  }): { allowed: boolean; reason: string; duplicateType?: string } {
    this.hydrateFromStorage();
    const threshold = params.semanticThreshold ?? 0.85;
    const content = (params.content || '').trim();

    // 5. Meaningful Contribution Check
    if (content.length < 8) {
      return {
        allowed: false,
        reason: 'Meaningful contribution check failed: Response content is too short or lacks substantive value.',
        duplicateType: 'LACK_MEANINGFUL_CONTRIBUTION'
      };
    }

    const genericPraiseRegex = /^(ขอบคุณ|ขอบคุณครับ|ขอบคุณค่ะ|ดีครับ|ดีค่ะ|เยี่ยมครับ|thanks|thank you|great|awesome)[!\.]*$/i;
    if (genericPraiseRegex.test(content)) {
      return {
        allowed: false,
        reason: 'Meaningful contribution check failed: Response is generic praise without new perspective or question.',
        duplicateType: 'LACK_MEANINGFUL_CONTRIBUTION'
      };
    }

    const responseHash = this.generateContentHash(content);
    const newFingerprint = this.getSemanticFingerprint(content);
    const history = Array.from(this.auditStore.values()).filter(r => r.status === 'EXECUTED');

    for (const rec of history) {
      // 1. Exact comment / target duplicate (same target and exact content hash)
      if (rec.target_id === params.targetId && rec.content_hash === responseHash) {
        return {
          allowed: false,
          reason: `Exact comment duplicate blocked: Identical reply already sent to target '${params.targetId}'.`,
          duplicateType: 'EXACT_COMMENT'
        };
      }

      // 2. Exact response duplicate (response_hash match globally across history)
      if (rec.content_hash === responseHash) {
        return {
          allowed: false,
          reason: `Exact response duplicate blocked: Response hash matches prior executed action '${rec.action_key}'.`,
          duplicateType: 'EXACT_RESPONSE'
        };
      }

      // 3. Semantic response duplicate (semantic similarity >= 0.85)
      if (rec.content) {
        const sim = this.calculateSemanticSimilarity(content, rec.content);
        if (sim >= threshold) {
          return {
            allowed: false,
            reason: `Semantic response duplicate blocked: Similarity score (${(sim * 100).toFixed(1)}%) exceeds threshold (${(threshold * 100)}%) with prior response '${rec.content.substring(0, 30)}...'`,
            duplicateType: 'SEMANTIC_RESPONSE'
          };
        }

        // 4. Same-thread / context duplicate check (threadId / post_id match with similarity >= 0.75 without new perspective)
        if (params.threadId && rec.thread_id === params.threadId) {
          const threadSim = this.calculateSemanticSimilarity(content, rec.content);
          if (threadSim >= 0.75) {
            return {
              allowed: false,
              reason: `Same-thread context duplicate blocked: Response in thread '${params.threadId}' is redundant (${(threadSim * 100).toFixed(1)}%) without introducing a genuinely new perspective.`,
              duplicateType: 'CONTEXT_DUPLICATE'
            };
          }
        }
      }
    }

    return { allowed: true, reason: 'Canonical Reply Dedup Gate passed: Substantive novel contribution verified.' };
  }

  public static acquireLock(actionKey: string): boolean {
    this.hydrateFromStorage();
    if (this.locks.get(actionKey)) return false;
    const record = this.auditStore.get(actionKey);
    if (record && (record.status === 'EXECUTED' || record.status === 'LOCKED' || record.status === 'EXECUTING')) {
      return false;
    }
    this.locks.set(actionKey, true);
    return true;
  }

  public static releaseLock(actionKey: string): void {
    this.locks.set(actionKey, false);
  }

  public static recordAction(
    actionKey: string,
    status: ActionLifecycleStatus,
    details: {
      event_id: string;
      target_id: string;
      target_comment_id?: string;
      thread_id?: string;
      agent_id: string;
      action_type: SocialActionType;
      content: string;
      result?: string;
      error?: string;
      author_context?: string;
    }
  ): ActionAuditRecord {
    this.hydrateFromStorage();
    const existing = this.auditStore.get(actionKey);
    const attempt = existing ? existing.execution_attempt + 1 : 1;
    const contentHash = this.generateContentHash(details.content);
    const semanticFingerprint = this.getSemanticFingerprint(details.content);

    const record: ActionAuditRecord = {
      event_id: details.event_id,
      target_id: details.target_id,
      target_comment_id: details.target_comment_id,
      thread_id: details.thread_id || details.target_id,
      action_key: actionKey,
      agent_id: details.agent_id,
      action_type: details.action_type,
      content_hash: contentHash,
      semantic_fingerprint: semanticFingerprint,
      status,
      created_at: existing ? existing.created_at : new Date().toISOString(),
      executed_at: status === 'EXECUTED' ? new Date().toISOString() : existing?.executed_at,
      execution_attempt: attempt,
      result: details.result,
      error: details.error,
      content: details.content,
      author_context: details.author_context,
    };

    this.auditStore.set(actionKey, record);
    this.persistToStorage();
    return record;
  }

  public static getAuditRecord(actionKey: string): ActionAuditRecord | undefined {
    this.hydrateFromStorage();
    return this.auditStore.get(actionKey);
  }

  public static getAllAudits(): ActionAuditRecord[] {
    this.hydrateFromStorage();
    return Array.from(this.auditStore.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public static deleteRecord(actionKey: string): void {
    this.hydrateFromStorage();
    this.auditStore.delete(actionKey);
    this.locks.delete(actionKey);
    this.persistToStorage();
  }

  public static removeDuplicates(): number {
    this.hydrateFromStorage();
    const seenHashes = new Set<string>();
    let removedCount = 0;
    for (const [actionKey, record] of this.auditStore.entries()) {
      const identifier = `${record.target_id}:${record.action_type}:${record.content_hash}`;
      if (seenHashes.has(identifier)) {
        this.deleteRecord(actionKey);
        removedCount++;
      } else {
        seenHashes.add(identifier);
      }
    }
    return removedCount;
  }

  public static clearAll(): void {
    this.hydrateFromStorage();
    this.locks.clear();
    this.auditStore.clear();
    this.processedEvents.clear();
    try {
      safeLocalStorage.removeItem(STORAGE_KEY_SOCIAL_AUDIT);
    } catch (e) {}
  }

  public static seedInitialHistory(agentId: string) {
    this.hydrateFromStorage();
    const initialTarget = 'post_101';
    const dummyContent = 'เห็นด้วยอย่างยิ่งครับ จุดชี้ขาดคือ Agent ต้องไม่สร้าง Illusion of Certainty';
    const actionKey = this.buildActionKey('x', 'reply', initialTarget, dummyContent);
    
    if (!this.auditStore.has(actionKey)) {
      this.recordAction(actionKey, 'EXECUTED', {
        event_id: 'evt_bootstrap_initial',
        target_id: initialTarget,
        thread_id: initialTarget,
        agent_id: agentId,
        action_type: 'reply',
        content: dummyContent,
        result: 'Bootstrapped historical execution marked as EXECUTED & LOCKED.',
      });
    }
  }
}
