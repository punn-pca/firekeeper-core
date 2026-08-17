import { SocialActionType } from './types';

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
  action_key: string;
  agent_id: string;
  action_type: SocialActionType;
  content_hash: string;
  status: ActionLifecycleStatus;
  created_at: string;
  executed_at?: string;
  execution_attempt: number;
  result?: string;
  error?: string;
  content?: string;
}

export class IdempotencyGuard {
  private static locks: Map<string, boolean> = new Map();
  private static auditStore: Map<string, ActionAuditRecord> = new Map();
  private static targetExecutionHistory: Map<string, Set<string>> = new Map(); // target_id -> Set of action_keys
  private static processedEvents: Set<string> = new Set();
  private static contentHashesByTarget: Map<string, Set<string>> = new Map(); // target_id -> Set of content hashes

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
    return this.processedEvents.has(eventId);
  }

  public static markEventProcessed(eventId: string): void {
    this.processedEvents.add(eventId);
  }

  public static checkTargetDeduplication(
    targetId: string,
    actionType: SocialActionType,
    content: string
  ): { isDuplicate: boolean; reason?: string } {
    if (actionType === 'reply' || actionType === 'initiate_contact') {
      const executedTargets = this.targetExecutionHistory.get(targetId);
      if (executedTargets && executedTargets.size > 0) {
        return {
          isDuplicate: true,
          reason: `Target-level deduplication: Agent has already performed actions on target '${targetId}'.`
        };
      }
    }

    const contentHash = this.generateContentHash(content);
    const targetHashes = this.contentHashesByTarget.get(targetId);
    if (targetHashes && targetHashes.has(contentHash)) {
      return {
        isDuplicate: true,
        reason: `Content similarity guard: Identical or semantically equivalent message already sent to target '${targetId}'.`
      };
    }

    return { isDuplicate: false };
  }

  public static acquireLock(actionKey: string): boolean {
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
      agent_id: string;
      action_type: SocialActionType;
      content: string;
      result?: string;
      error?: string;
    }
  ): ActionAuditRecord {
    const existing = this.auditStore.get(actionKey);
    const attempt = existing ? existing.execution_attempt + 1 : 1;
    const contentHash = this.generateContentHash(details.content);

    const record: ActionAuditRecord = {
      event_id: details.event_id,
      target_id: details.target_id,
      action_key: actionKey,
      agent_id: details.agent_id,
      action_type: details.action_type,
      content_hash: contentHash,
      status,
      created_at: existing ? existing.created_at : new Date().toISOString(),
      executed_at: status === 'EXECUTED' ? new Date().toISOString() : existing?.executed_at,
      execution_attempt: attempt,
      result: details.result,
      error: details.error,
      content: details.content,
    };

    this.auditStore.set(actionKey, record);

    if (status === 'EXECUTED') {
      if (!this.targetExecutionHistory.has(details.target_id)) {
        this.targetExecutionHistory.set(details.target_id, new Set());
      }
      this.targetExecutionHistory.get(details.target_id)?.add(actionKey);

      if (!this.contentHashesByTarget.has(details.target_id)) {
        this.contentHashesByTarget.set(details.target_id, new Set());
      }
      this.contentHashesByTarget.get(details.target_id)?.add(contentHash);
    }

    return record;
  }

  public static getAuditRecord(actionKey: string): ActionAuditRecord | undefined {
    return this.auditStore.get(actionKey);
  }

  public static getAllAudits(): ActionAuditRecord[] {
    return Array.from(this.auditStore.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public static deleteRecord(actionKey: string): void {
    this.auditStore.delete(actionKey);
    this.locks.delete(actionKey);
    // Remove from target execution history & content hashes
    for (const [targetId, keys] of this.targetExecutionHistory.entries()) {
      if (keys.has(actionKey)) {
        keys.delete(actionKey);
      }
    }
  }

  public static removeDuplicates(): number {
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
    this.locks.clear();
    this.auditStore.clear();
    this.targetExecutionHistory.clear();
    this.processedEvents.clear();
    this.contentHashesByTarget.clear();
  }

  public static seedInitialHistory(agentId: string) {
    const initialTarget = 'post_101';
    const dummyContent = 'เห็นด้วยอย่างยิ่งครับ จุดชี้ขาดคือ Agent ต้องไม่สร้าง Illusion of Certainty';
    const actionKey = this.buildActionKey('instagram', 'reply', initialTarget, dummyContent);
    
    if (!this.auditStore.has(actionKey)) {
      this.recordAction(actionKey, 'EXECUTED', {
        event_id: 'evt_bootstrap_initial',
        target_id: initialTarget,
        agent_id: agentId,
        action_type: 'reply',
        content: dummyContent,
        result: 'Bootstrapped historical execution marked as EXECUTED & LOCKED.',
      });
    }
  }
}
