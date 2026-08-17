import { SocialActionType } from './types';

export type SelfPostDecision =
  | 'EXECUTED'
  | 'BLOCKED_DUPLICATE_INTENT'
  | 'BLOCK_DUPLICATE_CONTENT'
  | 'NO_ACTION_REQUIRED'
  | 'COOLDOWN_ACTIVE'
  | 'LOCKED';

export interface SelfPostAuditRecord {
  agent_id: string;
  action_type: SocialActionType;
  intent_hash: string;
  content_hash: string;
  semantic_similarity: number;
  previous_action_id?: string;
  decision: SelfPostDecision;
  decision_reason: string;
  cooldown_status: 'ACTIVE' | 'EXPIRED';
  execution_status: 'SUCCESS' | 'BLOCKED' | 'LOCKED';
  timestamp: string;
  content_preview?: string;
}

export class SelfPostGuard {
  private static SELF_POST_COOLDOWN_MS = 60 * 60 * 1000; // 60 minutes
  private static lastSelfPostTime: number = 0;
  private static lastIntentHash: string | null = null;
  private static lastContentHash: string | null = null;
  private static lastActionId: string | null = null;
  private static recentIntents: Map<string, { timestamp: number; content: string; actionId: string }> = new Map();
  private static auditLogs: SelfPostAuditRecord[] = [];

  public static generateIntentHash(agentId: string, actionType: SocialActionType, content: string): string {
    const normalized = (content || '')
      .toLowerCase()
      .replace(/[^\w\sก-ฮ่้๊๋์]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    const words = normalized.split(' ').slice(0, 8).join('_');
    let hash = 0;
    for (let i = 0; i < words.length; i++) {
      const char = words.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `${agentId}:${actionType}:intent_${Math.abs(hash).toString(16)}`;
  }

  public static generateContentKey(agentId: string, actionType: SocialActionType, content: string): string {
    let hash = 0;
    const cleanStr = (content || '').trim().toLowerCase().replace(/\s+/g, ' ');
    for (let i = 0; i < cleanStr.length; i++) {
      const char = cleanStr.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `${agentId}:${actionType}:content_${Math.abs(hash).toString(16)}`;
  }

  public static computeSemanticSimilarity(textA: string, textB: string): number {
    if (!textA || !textB) return 0;
    const tokenize = (str: string) =>
      new Set(
        str
          .toLowerCase()
          .replace(/[^\w\sก-ฮ]/gi, '')
          .split(/\s+/)
          .filter((w) => w.length > 2)
      );

    const setA = tokenize(textA);
    const setB = tokenize(textB);

    if (setA.size === 0 || setB.size === 0) return 0;

    let intersection = 0;
    for (const token of setA) {
      if (setB.has(token)) intersection++;
    }

    const union = setA.size + setB.size - intersection;
    return union === 0 ? 0 : intersection / union;
  }

  public static evaluateSelfPost(
    agentId: string,
    actionType: SocialActionType,
    content: string,
    hasNewNoveltyEvent: boolean = false
  ): {
    allowed: boolean;
    decision: SelfPostDecision;
    reason: string;
    similarity: number;
    intentHash: string;
    contentKey: string;
  } {
    if (actionType !== 'post' && actionType !== 'create_content') {
      return {
        allowed: true,
        decision: 'EXECUTED',
        reason: 'Non-self-post action passed.',
        similarity: 0,
        intentHash: 'n/a',
        contentKey: 'n/a',
      };
    }

    const intentHash = this.generateIntentHash(agentId, actionType, content);
    const contentKey = this.generateContentKey(agentId, actionType, content);
    const now = Date.now();
    const timeSinceLastPost = now - this.lastSelfPostTime;
    const isCooldownActive = timeSinceLastPost < this.SELF_POST_COOLDOWN_MS;

    // Novelty check
    if (isCooldownActive && !hasNewNoveltyEvent) {
      this.recordAudit({
        agent_id: agentId,
        action_type: actionType,
        intent_hash: intentHash,
        content_hash: contentKey,
        semantic_similarity: 1.0,
        previous_action_id: this.lastActionId || undefined,
        decision: 'NO_ACTION_REQUIRED',
        decision_reason: 'NO NOVEL INTENT → NO ACTION (Cooldown active & no new events).',
        cooldown_status: 'ACTIVE',
        execution_status: 'BLOCKED',
        timestamp: new Date().toISOString(),
        content_preview: content.substring(0, 60),
      });

      return {
        allowed: false,
        decision: 'NO_ACTION_REQUIRED',
        reason: 'NO NOVEL INTENT → NO ACTION',
        similarity: 1.0,
        intentHash,
        contentKey,
      };
    }

    // Semantic similarity check (>= 0.85)
    let maxSimilarity = 0;
    for (const [, record] of this.recentIntents.entries()) {
      const sim = this.computeSemanticSimilarity(content, record.content);
      if (sim > maxSimilarity) {
        maxSimilarity = sim;
      }
    }

    if (this.lastIntentHash === intentHash || maxSimilarity >= 0.85) {
      this.recordAudit({
        agent_id: agentId,
        action_type: actionType,
        intent_hash: intentHash,
        content_hash: contentKey,
        semantic_similarity: maxSimilarity,
        previous_action_id: this.lastActionId || undefined,
        decision: 'BLOCKED_DUPLICATE_INTENT',
        decision_reason: `Semantic similarity (${maxSimilarity.toFixed(2)}) exceeds 0.85 threshold.`,
        cooldown_status: isCooldownActive ? 'ACTIVE' : 'EXPIRED',
        execution_status: 'BLOCKED',
        timestamp: new Date().toISOString(),
        content_preview: content.substring(0, 60),
      });

      return {
        allowed: false,
        decision: 'BLOCKED_DUPLICATE_INTENT',
        reason: `Semantic duplicate intent detected (Similarity: ${(maxSimilarity * 100).toFixed(0)}%).`,
        similarity: maxSimilarity,
        intentHash,
        contentKey,
      };
    }

    const actionId = `post_self_${Date.now()}`;
    this.lastSelfPostTime = now;
    this.lastIntentHash = intentHash;
    this.lastContentHash = contentKey;
    this.lastActionId = actionId;
    this.recentIntents.set(intentHash, { timestamp: now, content, actionId });

    if (this.recentIntents.size > 20) {
      const oldestKey = this.recentIntents.keys().next().value;
      if (oldestKey) this.recentIntents.delete(oldestKey);
    }

    this.recordAudit({
      agent_id: agentId,
      action_type: actionType,
      intent_hash: intentHash,
      content_hash: contentKey,
      semantic_similarity: maxSimilarity,
      previous_action_id: this.lastActionId || undefined,
      decision: 'EXECUTED',
      decision_reason: 'Novel intent verified; execution authorized.',
      cooldown_status: 'ACTIVE',
      execution_status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      content_preview: content.substring(0, 60),
    });

    return {
      allowed: true,
      decision: 'EXECUTED',
      reason: 'Novel intent approved.',
      similarity: maxSimilarity,
      intentHash,
      contentKey,
    };
  }

  private static recordAudit(record: SelfPostAuditRecord) {
    this.auditLogs.unshift(record);
    if (this.auditLogs.length > 50) this.auditLogs.pop();
  }

  public static getAudits(): SelfPostAuditRecord[] {
    return [...this.auditLogs];
  }

  public static clearAudits() {
    this.auditLogs = [];
    this.recentIntents.clear();
    this.lastSelfPostTime = 0;
    this.lastIntentHash = null;
    this.lastContentHash = null;
    this.lastActionId = null;
  }
}
