import { SocialActionType } from './types';

export type IntentStatus =
  | 'PROPOSED'
  | 'EVALUATING'
  | 'APPROVED'
  | 'EXECUTING'
  | 'EXECUTED'
  | 'CLOSED'
  | 'REJECTED'
  | 'DEFERRED';

export interface PersistentIntent {
  intent_id: string;
  intent_hash: string;
  source_event_id: string;
  created_at: string;
  status: IntentStatus;
  action_type: SocialActionType;
  executed_at?: string;
  closed_at?: string;
  rationale: string;
}

export interface TickAuditRecord {
  tick_id: number;
  timestamp: string;
  source_event_id: string | null;
  active_intent_id: string | null;
  intent_status: IntentStatus | null;
  state_changed: boolean;
  new_event: boolean;
  new_information: boolean;
  decision: 'ACT' | 'WAIT' | 'NO_ACTION_REQUIRED' | 'DEFER' | 'ESCALATE';
  action: SocialActionType | 'NONE';
  execution_status: 'SUCCESS' | 'BLOCKED' | 'NONE';
  decision_reason: string;
  reason?: string;
}

export class ArchitecturalDecisionEngine {
  private static intents: Map<string, PersistentIntent> = new Map();
  private static activeIntentId: string | null = null;
  private static executedActionKeys: Set<string> = new Set();
  private static auditLogs: TickAuditRecord[] = [];
  private static latestEventId: string | null = null;
  private static unconsumedEvent: boolean = false;
  private static eventCounter: number = 0;

  /**
   * Ingests a new external event or interaction (The ONLY way to create new intents)
   */
  public static ingestEvent(eventId: string, actionType: SocialActionType, rationale: string): PersistentIntent {
    this.eventCounter++;
    const uniqueEventId = `${eventId}_${Date.now()}_${this.eventCounter}`;
    this.latestEventId = uniqueEventId;
    this.unconsumedEvent = true;

    const intentId = `intent_${uniqueEventId}`;
    const intentHash = `hash_${intentId}_${actionType}`;

    const newIntent: PersistentIntent = {
      intent_id: intentId,
      intent_hash: intentHash,
      source_event_id: uniqueEventId,
      created_at: new Date().toISOString(),
      status: 'PROPOSED',
      action_type: actionType,
      rationale,
    };

    this.intents.set(intentId, newIntent);
    this.activeIntentId = intentId;
    return newIntent;
  }

  /**
   * Core Event-Driven Tick Evaluation (Rules 1-22)
   * NO EVENT → NO NEW INTENT → NO NEW ACTION
   * EXECUTED INTENT → CLOSED → PERMANENTLY NO_ACTION
   */
  public static evaluateTick(
    tickId: number,
    candidateAction: SocialActionType
  ): {
    decision: 'ACT' | 'WAIT' | 'NO_ACTION_REQUIRED' | 'DEFER' | 'ESCALATE';
    action: SocialActionType | 'NONE' | 'do_nothing';
    executionStatus: 'SUCCESS' | 'BLOCKED' | 'NONE';
    reason: string;
    record: TickAuditRecord;
  } {
    let activeIntent = this.activeIntentId ? this.intents.get(this.activeIntentId) : undefined;

    // Rule 4: Closed or Executed intent cannot re-execute
    if (activeIntent && (activeIntent.status === 'EXECUTED' || activeIntent.status === 'CLOSED')) {
      const reasonMsg = `CLOSED INTENT CANNOT RE-EXECUTE: Intent ${activeIntent.intent_id} is already ${activeIntent.status}. Zero action.`;
      const record: TickAuditRecord = {
        tick_id: tickId,
        timestamp: new Date().toISOString(),
        source_event_id: activeIntent.source_event_id,
        active_intent_id: activeIntent.intent_id,
        intent_status: activeIntent.status,
        state_changed: false,
        new_event: false,
        new_information: false,
        decision: 'NO_ACTION_REQUIRED',
        action: 'NONE',
        execution_status: 'NONE',
        decision_reason: reasonMsg,
        reason: reasonMsg,
      };
      this.auditLogs.unshift(record);
      if (this.auditLogs.length > 50) this.auditLogs.pop();
      return { decision: 'NO_ACTION_REQUIRED', action: 'do_nothing', executionStatus: 'NONE', reason: reasonMsg, record };
    }

    // Rule 1, 2, 7, 15, 21: NO EVENT → NO NEW INTENT → NO NEW ACTION
    if (!this.unconsumedEvent || !activeIntent) {
      const reasonMsg = 'NO_NOVEL_EVENT: Heartbeat detected zero new events. Default decision is NO_ACTION_REQUIRED.';
      const record: TickAuditRecord = {
        tick_id: tickId,
        timestamp: new Date().toISOString(),
        source_event_id: this.latestEventId,
        active_intent_id: activeIntent?.intent_id || null,
        intent_status: activeIntent?.status || null,
        state_changed: false,
        new_event: false,
        new_information: false,
        decision: 'NO_ACTION_REQUIRED',
        action: 'NONE',
        execution_status: 'NONE',
        decision_reason: reasonMsg,
        reason: reasonMsg,
      };
      this.auditLogs.unshift(record);
      if (this.auditLogs.length > 50) this.auditLogs.pop();
      return { decision: 'NO_ACTION_REQUIRED', action: 'do_nothing', executionStatus: 'NONE', reason: reasonMsg, record };
    }

    // If an unconsumed event exists, process it ONCE
    activeIntent.status = 'EVALUATING';
    activeIntent.status = 'APPROVED';
    activeIntent.status = 'EXECUTING';

    const actionKey = `action_key_${activeIntent.intent_id}_${activeIntent.action_type}`;
    if (this.executedActionKeys.has(actionKey)) {
      activeIntent.status = 'CLOSED';
      this.unconsumedEvent = false;
      const reasonMsg = 'ACTION_ALREADY_EXECUTED: Action key collision detected. Blocked duplicate execution.';
      const record: TickAuditRecord = {
        tick_id: tickId,
        timestamp: new Date().toISOString(),
        source_event_id: activeIntent.source_event_id,
        active_intent_id: activeIntent.intent_id,
        intent_status: activeIntent.status,
        state_changed: true,
        new_event: true,
        new_information: true,
        decision: 'NO_ACTION_REQUIRED',
        action: 'NONE',
        execution_status: 'BLOCKED',
        decision_reason: reasonMsg,
        reason: reasonMsg,
      };
      this.auditLogs.unshift(record);
      return { decision: 'NO_ACTION_REQUIRED', action: 'do_nothing', executionStatus: 'BLOCKED', reason: reasonMsg, record };
    }

    // Execute & Close Transaction
    this.executedActionKeys.add(actionKey);
    activeIntent.status = 'EXECUTED';
    activeIntent.executed_at = new Date().toISOString();
    activeIntent.status = 'CLOSED';
    activeIntent.closed_at = new Date().toISOString();
    this.unconsumedEvent = false; // Event consumed

    const authorizedAction = activeIntent.action_type;
    const reasonMsg = 'NEW EVENT → INTENT → GOVERNANCE GATE → EXECUTED & CLOSED SUCCESSFULLY.';

    const record: TickAuditRecord = {
      tick_id: tickId,
      timestamp: new Date().toISOString(),
      source_event_id: activeIntent.source_event_id,
      active_intent_id: activeIntent.intent_id,
      intent_status: activeIntent.status,
      state_changed: true,
      new_event: true,
      new_information: true,
      decision: 'ACT',
      action: authorizedAction,
      execution_status: 'SUCCESS',
      decision_reason: reasonMsg,
      reason: reasonMsg,
    };
    this.auditLogs.unshift(record);

    return {
      decision: 'ACT',
      action: authorizedAction,
      executionStatus: 'SUCCESS',
      reason: reasonMsg,
      record,
    };
  }

  public static getAudits(): TickAuditRecord[] {
    return [...this.auditLogs];
  }

  public static clearState() {
    this.intents.clear();
    this.activeIntentId = null;
    this.executedActionKeys.clear();
    this.auditLogs = [];
    this.latestEventId = null;
    this.unconsumedEvent = false;
    this.eventCounter = 0;
  }
}
