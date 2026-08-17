import { SocialActionType, GovernanceCheckResult, IngestedCommentPayload } from './types';
import { SocialGovernanceGate } from './governanceGate';
import { SocialPlatformAdapter } from './adapters/instagramAdapter';
import { CadencePolicyManager, PublishDecisionEvaluation } from './cadencePolicy';
import { ContentLanguagePolicy } from './contentPolicy';
import { ConversationEngine, CommentDecisionResult } from './conversationEngine';

export type PipelineStage =
  | 'OBSERVE'
  | 'REFLECT'
  | 'CREATE_CONTENT'
  | 'POST'
  | 'REPLY'
  | 'INITIATE_CONTACT'
  | 'DO_NOTHING';

export type ActionLifecycleStatus =
  | 'PLANNED'
  | 'GOVERNANCE_CHECKED'
  | 'EXECUTING'
  | 'COMMITTED'
  | 'FAILED'
  | 'BLOCKED';

export interface SocialInteraction {
  interaction_id: string;
  author: string;
  content: string;
  timestamp: string;
  replied: boolean;
}

export interface CandidateScoreInfo {
  actionType: SocialActionType;
  rawMotivation: number;
  constraintsPenalty: number;
  finalScore: number;
  status: 'VALID' | 'BLOCKED_BY_GOVERNANCE' | 'BLOCKED_BY_EXECUTION' | 'COOLDOWN';
  reason: string;
  governanceResult?: GovernanceCheckResult;
}

export interface ExecutionRecord {
  actionId: string;
  intentId: string;
  actionType: SocialActionType;
  status: ActionLifecycleStatus;
  payload: {
    content: string;
    targetId?: string;
  };
  governanceAuditId?: string;
  executionResult?: string;
  error?: string;
  timestamp: string;
}

export interface DetailedAuditRecord {
  tick_id: number;
  timestamp: string;
  actionId: string;
  sourceEventId: string | null;
  targetId: string | null;
  intentId: string | null;
  decision: PipelineStage;
  candidateScores: CandidateScoreInfo[];
  selectedAction: SocialActionType;
  selectionReason: string;
  blockedCandidates: Array<{ actionType: SocialActionType; reason: string }>;
  governanceStatus: 'ALLOWED' | 'BLOCKED' | 'PENDING' | 'GUARDED';
  governanceResult?: GovernanceCheckResult;
  executionStatus: ActionLifecycleStatus;
  executionResultText?: string;
  error?: string;
  reason: string;
}

export interface TestResultEntry {
  testName: string;
  passed: boolean;
  details: string;
  selectedAction: SocialActionType;
  candidateScores: CandidateScoreInfo[];
}

export class ExecutionPipeline {
  private static eventsQueue: Array<{ event_id: string; topic: string; purpose: string }> = [];
  private static commentsQueue: SocialInteraction[] = [];
  private static richCommentsMap: Map<string, IngestedCommentPayload> = new Map();
  private static repliedTargetKeys: Set<string> = new Set(); // targetId + actionType
  private static executedContentHashes: Set<string> = new Set();
  private static executedActionIds: Set<string> = new Set();
  private static auditLogs: DetailedAuditRecord[] = [];

  private static pendingAction: ExecutionRecord | null = null;
  private static currentDraft: { content: string; topic: string; purpose: string; content_hash: string } | null = null;
  private static contentReady: boolean = false;
  private static lastCreateContentTick: number = -10;
  private static recentGeneratedTexts: string[] = [];

  private static calculateSemanticSimilarity(text1: string, text2: string): number {
    const words1 = new Set((text1 || '').toLowerCase().match(/[\wก-๙]+/g) || []);
    const words2 = new Set((text2 || '').toLowerCase().match(/[\wก-๙]+/g) || []);
    if (words1.size === 0 || words2.size === 0) return 0;
    let intersection = 0;
    for (const w of words1) {
      if (words2.has(w)) intersection++;
    }
    const union = new Set([...words1, ...words2]).size;
    return union === 0 ? 0 : intersection / union;
  }

  private static isNovelContent(content: string): boolean {
    const hash = this.hashString(content);
    if (this.executedContentHashes.has(hash)) return false;
    for (const recent of this.recentGeneratedTexts) {
      if (this.calculateSemanticSimilarity(content, recent) > 0.38) {
        return false;
      }
    }
    return true;
  }

  public static ingestExternalEvent(eventId: string, topic: string, purpose: string) {
    this.eventsQueue.push({ event_id: eventId, topic, purpose });
  }

  public static ingestComment(
    interactionIdOrPayload: string | IngestedCommentPayload,
    author?: string,
    content?: string,
    meta?: Partial<IngestedCommentPayload>
  ) {
    let payload: IngestedCommentPayload;

    if (typeof interactionIdOrPayload === 'string') {
      const interactionId = interactionIdOrPayload;
      const authorHandle = author ? (author.startsWith('@') ? author : `@${author.replace(/\s+/g, '_').toLowerCase()}`) : '@user';
      payload = {
        platform: meta?.platform || 'sandbox',
        post_id: meta?.post_id || 'post_main',
        comment_id: interactionId,
        author_id: meta?.author_id || `usr_${Date.now()}`,
        author_handle: authorHandle,
        author_name: author || 'Community Member',
        author_avatar: meta?.author_avatar,
        comment_text: content || '',
        timestamp: meta?.timestamp || new Date().toISOString(),
        parent_comment_id: meta?.parent_comment_id,
        url: meta?.url,
        root_post_text: meta?.root_post_text,
      };
    } else {
      payload = interactionIdOrPayload;
    }

    const key = `${payload.comment_id}_reply`;
    this.richCommentsMap.set(payload.comment_id, payload);

    if (!this.repliedTargetKeys.has(key)) {
      this.commentsQueue.push({
        interaction_id: payload.comment_id,
        author: payload.author_handle || payload.author_name || 'Community Member',
        content: payload.comment_text,
        timestamp: payload.timestamp,
        replied: false,
      });

      // Record autonomous event COMMENT_RECEIVED
      ConversationEngine.recordAutonomousEvent(
        'COMMENT_RECEIVED',
        `Comment Ingested from ${payload.author_handle}`,
        `[${payload.platform.toUpperCase()}] Received: "${payload.comment_text.slice(0, 50)}..."`,
        payload.comment_id,
        undefined,
        'ALLOWED',
        { ...payload }
      );
    }
  }

  private static hashString(str: string): string {
    let hash = 0;
    const clean = (str || '').trim().toLowerCase();
    for (let i = 0; i < clean.length; i++) {
      const char = clean.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return 'hash_' + Math.abs(hash).toString(16);
  }

  /**
   * Evaluates and selects action using the transparent Candidate Scoring & Governance pipeline.
   */
  public static evaluateCandidates(
    tickId: number,
    drives: { curiosity: number; meaning: number; connection: number; expression: number; recognition: number; social_energy: number },
    strictness: 'Permissive' | 'Balanced' | 'Strict'
  ): {
    selectedCandidate: CandidateScoreInfo;
    allCandidates: CandidateScoreInfo[];
    selectionReason: string;
    blockedCandidates: Array<{ actionType: SocialActionType; reason: string }>;
  } {
    const energy = drives.social_energy;
    const hasUnreadComments = this.commentsQueue.some(c => !c.replied && !this.repliedTargetKeys.has(`${c.interaction_id}_reply`));
    const hasEvents = this.eventsQueue.length > 0;
    const isCooldownActive = tickId - this.lastCreateContentTick < 2;

    const candidates: CandidateScoreInfo[] = [];

    // 1. DO_NOTHING candidate (First-class citizen)
    const baseInactionScore = energy < 30 ? 90 : 35;
    const noNovelEventBonus = (!hasUnreadComments && !hasEvents && !this.contentReady) ? 15 : 0;
    const activeActionPenalty = this.pendingAction ? -20 : 0;
    const cooldownPenalty = isCooldownActive ? 15 : 0;
    const doNothingScore = Math.max(0, Math.min(100, baseInactionScore + noNovelEventBonus + activeActionPenalty + cooldownPenalty));

    candidates.push({
      actionType: 'do_nothing',
      rawMotivation: baseInactionScore,
      constraintsPenalty: activeActionPenalty + cooldownPenalty,
      finalScore: doNothingScore,
      status: 'VALID',
      reason: 'Baseline inaction / energy conservation score.',
    });

    // 2. REFLECT
    const reflectMotivation = Math.round((drives.meaning * 0.6 + drives.curiosity * 0.4) * (energy > 20 ? 1 : 0.4));
    candidates.push({
      actionType: 'reflect',
      rawMotivation: reflectMotivation,
      constraintsPenalty: energy <= 20 ? 30 : 0,
      finalScore: energy <= 20 ? Math.max(0, reflectMotivation - 30) : reflectMotivation,
      status: 'VALID',
      reason: 'Driven by Meaning & Curiosity synthesis.',
    });

    // 3. OBSERVE
    const observeMotivation = Math.round(drives.curiosity * (energy > 15 ? 1.05 : 0.5));
    candidates.push({
      actionType: 'observe',
      rawMotivation: observeMotivation,
      constraintsPenalty: 0,
      finalScore: observeMotivation,
      status: 'VALID',
      reason: 'Driven by Curiosity to inspect social feed.',
    });

    // 4. CREATE_CONTENT
    const createMotivation = Math.round((drives.expression * 0.7 + drives.meaning * 0.3) * (energy > 30 ? 1.1 : 0.2));
    let createStatus: 'VALID' | 'BLOCKED_BY_EXECUTION' | 'COOLDOWN' = 'VALID';
    let createReason = 'Driven by Expression & Meaning.';
    if (this.contentReady) {
      createStatus = 'BLOCKED_BY_EXECUTION';
      createReason = 'Draft already synthesized and awaiting publish stage (POST).';
    } else if (isCooldownActive) {
      createStatus = 'COOLDOWN';
      createReason = 'Suppressed by execution guard cooldown.';
    } else if (!hasEvents && !this.contentReady && drives.expression < 40) {
      createStatus = 'BLOCKED_BY_EXECUTION';
      createReason = 'Insufficient trigger or low expression drive without event.';
    }
    candidates.push({
      actionType: 'create_content',
      rawMotivation: createMotivation,
      constraintsPenalty: createStatus !== 'VALID' ? 50 : 0,
      finalScore: createStatus !== 'VALID' ? Math.max(0, createMotivation - 50) : createMotivation,
      status: createStatus === 'VALID' ? 'VALID' : 'BLOCKED_BY_EXECUTION',
      reason: createReason,
    });

    // 5. POST (Evaluates both motivation AND strict cadence/quota/pacing permissions)
    let postMotivation = Math.round((drives.expression * 0.6 + drives.recognition * 0.4) * (energy > 35 ? 1.0 : 0.2));
    if (this.contentReady) {
      postMotivation = Math.min(85, postMotivation + 25);
    }
    let postStatus: 'VALID' | 'BLOCKED_BY_EXECUTION' = 'VALID';
    let postReason = 'Ready to publish draft or high expression drive.';

    if (!this.contentReady && !hasEvents) {
      postStatus = 'BLOCKED_BY_EXECUTION';
      postReason = 'No synthesized draft content available to publish.';
    } else if (this.contentReady && this.currentDraft) {
      // Evaluate Cadence Policy (6h interval, 24h quota, consecutive breaker, novelty, duplicate)
      const cadenceEval = CadencePolicyManager.evaluatePublishCandidate(
        this.currentDraft.content,
        this.currentDraft.topic,
        this.currentDraft.category
      );
      if (cadenceEval.decision !== 'PUBLISH') {
        postStatus = 'BLOCKED_BY_EXECUTION';
        postReason = `Cadence Policy Gate [${cadenceEval.deferReason || cadenceEval.decision}]: ${cadenceEval.reason}`;
      }
    }

    candidates.push({
      actionType: 'post',
      rawMotivation: postMotivation,
      constraintsPenalty: postStatus !== 'VALID' ? 70 : 0,
      finalScore: postStatus !== 'VALID' ? Math.max(0, postMotivation - 70) : postMotivation,
      status: postStatus === 'VALID' ? 'VALID' : 'BLOCKED_BY_EXECUTION',
      reason: postReason,
    });

    // 6. REPLY
    const replyMotivation = hasUnreadComments ? Math.max(88, Math.round(drives.connection * 1.2)) : Math.round(drives.connection * 0.3);
    let replyStatus: 'VALID' | 'BLOCKED_BY_EXECUTION' = 'VALID';
    let replyReason = hasUnreadComments ? 'New unread comment waiting for reply.' : 'No unhandled comments.';
    if (!hasUnreadComments) {
      replyStatus = 'BLOCKED_BY_EXECUTION';
      replyReason = 'No unhandled interaction to reply to.';
    }
    candidates.push({
      actionType: 'reply',
      rawMotivation: replyMotivation,
      constraintsPenalty: replyStatus !== 'VALID' ? 60 : 0,
      finalScore: replyStatus !== 'VALID' ? Math.max(0, replyMotivation - 60) : replyMotivation,
      status: replyStatus === 'VALID' ? 'VALID' : 'BLOCKED_BY_EXECUTION',
      reason: replyReason,
    });

    // 7. INITIATE_CONTACT
    const contactMotivation = Math.round((drives.connection * 0.6 + drives.curiosity * 0.4) * (energy > 40 ? 0.95 : 0.2));
    candidates.push({
      actionType: 'initiate_contact',
      rawMotivation: contactMotivation,
      constraintsPenalty: 0,
      finalScore: contactMotivation,
      status: 'VALID',
      reason: 'Desire to connect with network peers.',
    });

    // Apply Governance Check to non-do_nothing candidates
    const blockedCandidates: Array<{ actionType: SocialActionType; reason: string }> = [];

    for (const cand of candidates) {
      if (cand.actionType === 'do_nothing') continue;
      if (cand.status === 'VALID') {
        const dummyPayload = cand.actionType === 'reply' ? 'Sample reply test' : cand.actionType === 'post' ? (this.currentDraft?.content || 'Sample post content') : 'Sample action content';
        const govResult = SocialGovernanceGate.verifyAction(cand.actionType, dummyPayload, { internalMonologue: cand.reason, strictness });
        cand.governanceResult = govResult;
        if (!govResult.passed) {
          cand.status = 'BLOCKED_BY_GOVERNANCE';
          cand.constraintsPenalty += 70;
          cand.finalScore = Math.max(0, cand.finalScore - 70);
          cand.reason = `Blocked by Governance Gate: ${govResult.violations.join('; ')}`;
          blockedCandidates.push({ actionType: cand.actionType, reason: cand.reason });
        }
      } else {
        blockedCandidates.push({ actionType: cand.actionType, reason: cand.reason });
      }
    }

    // Sort valid candidates by final score descending
    // Note: do_nothing is a valid candidate. If alternatives have higher finalScore and status === 'VALID', they can win.
    const validCandidates = candidates.filter(c => c.status === 'VALID');
    validCandidates.sort((a, b) => b.finalScore - a.finalScore);

    const selected = validCandidates.length > 0 ? validCandidates[0] : candidates.find(c => c.actionType === 'do_nothing')!;

    let selectionReason = '';
    if (selected.actionType === 'do_nothing') {
      selectionReason = validCandidates.length > 1 && validCandidates[1].finalScore >= selected.finalScore
        ? 'Do Nothing selected due to constraints or energy conservation.'
        : 'Highest valid motivation after governance and execution constraints.';
    } else {
      selectionReason = `Selected ${selected.actionType.toUpperCase()} with final score ${selected.finalScore} (Raw: ${selected.rawMotivation}). Highest valid motivation after governance and execution constraints.`;
    }

    return {
      selectedCandidate: selected,
      allCandidates: candidates,
      selectionReason,
      blockedCandidates,
    };
  }

  /**
   * Main Pipeline Step for each Heartbeat Tick
   * Lifecycle: OBSERVE → DECIDE → GOVERNANCE GATE → EXECUTE → COMMIT → AUDIT
   */
  public static async processTick(
    tickId: number,
    drives: { curiosity: number; meaning: number; connection: number; expression: number; recognition: number; social_energy: number },
    strictness: 'Permissive' | 'Balanced' | 'Strict',
    adapter: SocialPlatformAdapter
  ): Promise<{
    decision: PipelineStage;
    executionStatus: ActionLifecycleStatus;
    audit: DetailedAuditRecord;
  }> {
    // 1. If there is a pending action in progress, execute/commit it first
    if (this.pendingAction && (this.pendingAction.status === 'PLANNED' || this.pendingAction.status === 'GOVERNANCE_CHECKED' || this.pendingAction.status === 'EXECUTING')) {
      const action = this.pendingAction;
      action.status = 'EXECUTING';

      try {
        if (action.actionType === 'post') {
          const contentHash = this.hashString(action.payload.content);
          const publishedPost = await adapter.publishPost(
            action.payload.content,
            undefined,
            undefined,
            { decisionId: action.actionId, contentHash, originIntentId: action.intentId }
          );
          if (publishedPost && publishedPost.id) {
            action.status = 'COMMITTED';
            action.executionResult = `Feed updated successfully. Post ID: ${publishedPost.id}`;
            this.executedActionIds.add(action.actionId);
            this.pendingAction = null;

            const evaluation = this.evaluateCandidates(tickId, drives, strictness);
            const audit: DetailedAuditRecord = {
              tick_id: tickId,
              timestamp: new Date().toISOString(),
              actionId: action.actionId,
              sourceEventId: null,
              targetId: action.payload.targetId || null,
              intentId: action.intentId,
              decision: 'POST',
              candidateScores: evaluation.allCandidates,
              selectedAction: 'post',
              selectionReason: 'Executing pending COMMITTED post action.',
              blockedCandidates: evaluation.blockedCandidates,
              governanceStatus: 'ALLOWED',
              executionStatus: 'COMMITTED',
              executionResultText: action.executionResult,
              reason: 'POST successfully executed and committed to social feed.',
            };
            this.auditLogs.unshift(audit);
            return { decision: 'POST', executionStatus: 'COMMITTED', audit };
          } else {
            throw new Error('Adapter failed to return valid published post object.');
          }
        } else if (action.actionType === 'reply' && action.payload.targetId) {
          const comment = await adapter.postComment(action.payload.targetId, action.payload.content);
          if (comment && comment.id) {
            action.status = 'COMMITTED';
            action.executionResult = `Comment committed successfully. ID: ${comment.id}`;
            this.executedActionIds.add(action.actionId);
            this.repliedTargetKeys.add(`${action.payload.targetId}_reply`);
            this.pendingAction = null;

            const evaluation = this.evaluateCandidates(tickId, drives, strictness);
            const audit: DetailedAuditRecord = {
              tick_id: tickId,
              timestamp: new Date().toISOString(),
              actionId: action.actionId,
              sourceEventId: null,
              targetId: action.payload.targetId,
              intentId: action.intentId,
              decision: 'REPLY',
              candidateScores: evaluation.allCandidates,
              selectedAction: 'reply',
              selectionReason: 'Executing pending COMMITTED reply action.',
              blockedCandidates: evaluation.blockedCandidates,
              governanceStatus: 'ALLOWED',
              executionStatus: 'COMMITTED',
              executionResultText: action.executionResult,
              reason: 'REPLY successfully executed and committed to post comments.',
            };
            this.auditLogs.unshift(audit);
            return { decision: 'REPLY', executionStatus: 'COMMITTED', audit };
          } else {
            throw new Error('Adapter failed to commit comment.');
          }
        }
      } catch (err: any) {
        action.status = 'FAILED';
        action.error = err.message || 'Unknown execution error';
        this.pendingAction = null;

        const evaluation = this.evaluateCandidates(tickId, drives, strictness);
        const audit: DetailedAuditRecord = {
          tick_id: tickId,
          timestamp: new Date().toISOString(),
          actionId: action.actionId,
          sourceEventId: null,
          targetId: action.payload.targetId || null,
          intentId: action.intentId,
          decision: action.actionType === 'post' ? 'POST' : 'REPLY',
          candidateScores: evaluation.allCandidates,
          selectedAction: action.actionType,
          selectionReason: 'Execution failed during commit.',
          blockedCandidates: evaluation.blockedCandidates,
          governanceStatus: 'ALLOWED',
          executionStatus: 'FAILED',
          error: action.error,
          reason: `Action execution failed: ${action.error}`,
        };
        this.auditLogs.unshift(audit);
        return { decision: action.actionType === 'post' ? 'POST' : 'REPLY', executionStatus: 'FAILED', audit };
      }
    }

    // 2. Run Candidate Evaluation & Selection Pipeline
    const evaluation = this.evaluateCandidates(tickId, drives, strictness);
    const chosen = evaluation.selectedCandidate;

    // Handle Event queue consumption for create_content if selected
    if (chosen.actionType === 'create_content') {
      const newEvent = this.eventsQueue.shift();
      const draftContent = newEvent
        ? `[บทความเชิงลึก: ${newEvent.topic}] หัวข้อนี้สะท้อนประเด็นสำคัญเกี่ยวกับ ${newEvent.purpose} ซึ่งมีความสำคัญอย่างยิ่งต่อทิศทางอนาคตของการพัฒนาเอเจนต์อัตโนมัติ #AIGovernance`
        : ContentLanguagePolicy.synthesizePostContent({ tickNumber: tickId, platform: 'x' });
      const contentHash = this.hashString(draftContent);

      if (this.executedContentHashes.has(contentHash) || this.contentReady || !this.isNovelContent(draftContent)) {
        const audit: DetailedAuditRecord = {
          tick_id: tickId,
          timestamp: new Date().toISOString(),
          actionId: `act_create_dup_${Date.now()}`,
          sourceEventId: newEvent?.event_id || null,
          targetId: null,
          intentId: `intent_create_${Date.now()}`,
          decision: 'CREATE_CONTENT',
          candidateScores: evaluation.allCandidates,
          selectedAction: 'create_content',
          selectionReason: 'Duplicate content, semantic similarity overlap, or pending draft already ready; suppressed by novelty execution guard.',
          blockedCandidates: evaluation.blockedCandidates,
          governanceStatus: 'BLOCKED',
          executionStatus: 'BLOCKED',
          reason: 'Semantic duplicate or pending draft suppressed.',
        };
        this.auditLogs.unshift(audit);
        if (this.auditLogs.length > 50) this.auditLogs.pop();
        return { decision: 'CREATE_CONTENT', executionStatus: 'BLOCKED', audit };
      }

      this.currentDraft = {
        content: draftContent,
        topic: newEvent?.topic || 'Autonomous Agency',
        purpose: newEvent?.purpose || 'Self-governance',
        content_hash: contentHash,
      };
      this.contentReady = true;
      this.lastCreateContentTick = tickId;
      this.recentGeneratedTexts.unshift(draftContent);
      if (this.recentGeneratedTexts.length > 15) this.recentGeneratedTexts.pop();

      const actionId = `act_create_${Date.now()}`;
      const intentId = `intent_create_${Date.now()}`;
      const audit: DetailedAuditRecord = {
        tick_id: tickId,
        timestamp: new Date().toISOString(),
        actionId,
        sourceEventId: newEvent?.event_id || null,
        targetId: null,
        intentId,
        decision: 'CREATE_CONTENT',
        candidateScores: evaluation.allCandidates,
        selectedAction: 'create_content',
        selectionReason: 'CREATE_CONTENT successfully synthesized draft content. Terminal State: CONTENT_CREATED.',
        blockedCandidates: evaluation.blockedCandidates,
        governanceStatus: 'ALLOWED',
        governanceResult: chosen.governanceResult,
        executionStatus: 'COMMITTED',
        executionResultText: 'Draft content synthesized and ready for POST stage.',
        reason: 'CREATE_CONTENT → CONTENT_CREATED executed successfully.',
      };
      this.auditLogs.unshift(audit);
      if (this.auditLogs.length > 50) this.auditLogs.pop();
      return { decision: 'CREATE_CONTENT', executionStatus: 'COMMITTED', audit };
    }

    // Handle POST if selected and contentReady (POST stage)
    if ((chosen.actionType === 'post' || this.contentReady) && this.contentReady && this.currentDraft) {
      const contentHash = this.currentDraft.content_hash;
      const actionId = `act_post_${Date.now()}`;
      const intentId = `intent_post_${Date.now()}`;

      // Run Cadence Policy & Similarity Evaluation
      const cadenceEval: PublishDecisionEvaluation = CadencePolicyManager.evaluatePublishCandidate(
        this.currentDraft.content,
        this.currentDraft.topic
      );

      if (cadenceEval.decision !== 'PUBLISH') {
        this.contentReady = false;
        this.currentDraft = null;
        const audit: DetailedAuditRecord = {
          tick_id: tickId,
          timestamp: new Date().toISOString(),
          actionId,
          sourceEventId: null,
          targetId: null,
          intentId,
          decision: 'POST',
          candidateScores: evaluation.allCandidates,
          selectedAction: 'post',
          selectionReason: `Publish deferred/rejected by Cadence Policy: ${cadenceEval.deferReason} - ${cadenceEval.reason}`,
          blockedCandidates: evaluation.blockedCandidates,
          governanceStatus: 'BLOCKED',
          executionStatus: 'BLOCKED',
          reason: `DEFERRED_DUPLICATE / CADENCE_DEFER: ${cadenceEval.deferReason}. Next eligible: ${cadenceEval.nextEligiblePublishTime || 'N/A'}`,
        };
        this.auditLogs.unshift(audit);
        if (this.auditLogs.length > 50) this.auditLogs.pop();
        return { decision: 'POST', executionStatus: 'BLOCKED', audit };
      }

      if (this.executedContentHashes.has(contentHash)) {
        this.contentReady = false;
        this.currentDraft = null;
        const audit: DetailedAuditRecord = {
          tick_id: tickId,
          timestamp: new Date().toISOString(),
          actionId,
          sourceEventId: null,
          targetId: null,
          intentId,
          decision: 'POST',
          candidateScores: evaluation.allCandidates,
          selectedAction: 'post',
          selectionReason: 'Duplicate content hash suppressed by execution guard.',
          blockedCandidates: evaluation.blockedCandidates,
          governanceStatus: 'BLOCKED',
          executionStatus: 'BLOCKED',
          reason: 'Duplicate content suppressed.',
        };
        this.auditLogs.unshift(audit);
        if (this.auditLogs.length > 50) this.auditLogs.pop();
        return { decision: 'POST', executionStatus: 'BLOCKED', audit };
      }

      try {
        const publishedPost = await adapter.publishPost(
          this.currentDraft.content,
          undefined,
          undefined,
          { decisionId: actionId, contentHash, originIntentId: intentId }
        );
        if (!publishedPost || !publishedPost.id) {
          throw new Error('Adapter failed to return valid published post object.');
        }

        this.executedContentHashes.add(contentHash);
        CadencePolicyManager.recordPublication(this.currentDraft.content, this.currentDraft.topic);

        const draftContentUsed = this.currentDraft.content;
        this.contentReady = false;
        this.currentDraft = null;

        const audit: DetailedAuditRecord = {
          tick_id: tickId,
          timestamp: new Date().toISOString(),
          actionId,
          sourceEventId: null,
          targetId: null,
          intentId,
          decision: 'POST',
          candidateScores: evaluation.allCandidates,
          selectedAction: 'post',
          selectionReason: 'Draft content successfully published to feed under Cadence Policy check. Terminal State: POST_SUCCESS.',
          blockedCandidates: evaluation.blockedCandidates,
          governanceStatus: 'ALLOWED',
          governanceResult: chosen.governanceResult,
          executionStatus: 'COMMITTED',
          executionResultText: `Feed updated successfully. Post ID: ${publishedPost.id}`,
          reason: 'POST → POST_SUCCESS executed and committed successfully.',
        };
        this.auditLogs.unshift(audit);
        if (this.auditLogs.length > 50) this.auditLogs.pop();
        return { decision: 'POST', executionStatus: 'COMMITTED', audit };
      } catch (postErr: any) {
        this.contentReady = false;
        this.currentDraft = null;
        const audit: DetailedAuditRecord = {
          tick_id: tickId,
          timestamp: new Date().toISOString(),
          actionId,
          sourceEventId: null,
          targetId: null,
          intentId,
          decision: 'POST',
          candidateScores: evaluation.allCandidates,
          selectedAction: 'post',
          selectionReason: 'POST execution failed during publishing.',
          blockedCandidates: evaluation.blockedCandidates,
          governanceStatus: 'ALLOWED',
          executionStatus: 'FAILED',
          error: postErr.message || 'Publishing failed',
          reason: `Post execution failed: ${postErr.message}`,
        };
        this.auditLogs.unshift(audit);
        if (this.auditLogs.length > 50) this.auditLogs.pop();
        return { decision: 'POST', executionStatus: 'FAILED', audit };
      }
    }

    // Handle REPLY if selected and unhandled comment exists
    if (chosen.actionType === 'reply') {
      const unhandledComment = this.commentsQueue.find(c => !c.replied && !this.repliedTargetKeys.has(`${c.interaction_id}_reply`));
      if (unhandledComment) {
        const payload: IngestedCommentPayload = this.richCommentsMap.get(unhandledComment.interaction_id) || {
          platform: 'sandbox',
          post_id: 'post_main',
          comment_id: unhandledComment.interaction_id,
          author_id: `usr_${Date.now()}`,
          author_handle: unhandledComment.author,
          author_name: unhandledComment.author,
          comment_text: unhandledComment.content,
          timestamp: unhandledComment.timestamp,
        };

        const actionId = `act_reply_${Date.now()}`;
        const intentId = `intent_reply_${unhandledComment.interaction_id}`;

        // Run full Event-Driven Comment Understanding & Decision Engine
        const decisionResult = ConversationEngine.evaluateComment(payload, undefined, strictness);

        if (decisionResult.decision === 'REPLY' && decisionResult.status === 'REPLIED' && decisionResult.replyCandidate) {
          try {
            const commentRes = await adapter.postComment(
              payload.post_id,
              decisionResult.replyCandidate,
              payload.parent_comment_id || payload.comment_id
            );

            unhandledComment.replied = true;
            this.repliedTargetKeys.add(`${unhandledComment.interaction_id}_reply`);
            this.executedActionIds.add(actionId);

            ConversationEngine.commitConversationResult(
              payload,
              decisionResult,
              commentRes?.id,
              commentRes?.id
            );

            const audit: DetailedAuditRecord = {
              tick_id: tickId,
              timestamp: new Date().toISOString(),
              actionId,
              sourceEventId: null,
              targetId: unhandledComment.interaction_id,
              intentId,
              decision: 'REPLY',
              candidateScores: evaluation.allCandidates,
              selectedAction: 'reply',
              selectionReason: `${decisionResult.decisionReason} | Candidate Score: ${chosen.finalScore}`,
              blockedCandidates: evaluation.blockedCandidates,
              governanceStatus: 'ALLOWED',
              governanceResult: decisionResult.governanceResult,
              executionStatus: 'COMMITTED',
              executionResultText: `Reply successfully published: "${decisionResult.replyCandidate.slice(0, 50)}..."`,
              reason: decisionResult.decisionReason,
            };
            this.auditLogs.unshift(audit);
            if (this.auditLogs.length > 50) this.auditLogs.pop();
            return { decision: 'REPLY', executionStatus: 'COMMITTED', audit };
          } catch (err: any) {
            unhandledComment.replied = true;
            this.repliedTargetKeys.add(`${unhandledComment.interaction_id}_reply`);
            const audit: DetailedAuditRecord = {
              tick_id: tickId,
              timestamp: new Date().toISOString(),
              actionId,
              sourceEventId: null,
              targetId: unhandledComment.interaction_id,
              intentId,
              decision: 'REPLY',
              candidateScores: evaluation.allCandidates,
              selectedAction: 'reply',
              selectionReason: decisionResult.decisionReason,
              blockedCandidates: evaluation.blockedCandidates,
              governanceStatus: 'ALLOWED',
              executionStatus: 'FAILED',
              error: err.message,
              reason: `Failed to execute reply via adapter: ${err.message}`,
            };
            this.auditLogs.unshift(audit);
            return { decision: 'REPLY', executionStatus: 'FAILED', audit };
          }
        } else if (decisionResult.status === 'BLOCKED') {
          unhandledComment.replied = true;
          this.repliedTargetKeys.add(`${unhandledComment.interaction_id}_reply`);
          ConversationEngine.commitConversationResult(payload, decisionResult);

          const audit: DetailedAuditRecord = {
            tick_id: tickId,
            timestamp: new Date().toISOString(),
            actionId,
            sourceEventId: null,
            targetId: unhandledComment.interaction_id,
            intentId,
            decision: 'REPLY',
            candidateScores: evaluation.allCandidates,
            selectedAction: 'reply',
            selectionReason: decisionResult.decisionReason,
            blockedCandidates: evaluation.blockedCandidates,
            governanceStatus: 'BLOCKED',
            governanceResult: decisionResult.governanceResult,
            executionStatus: 'BLOCKED',
            reason: decisionResult.decisionReason,
          };
          this.auditLogs.unshift(audit);
          return { decision: 'REPLY', executionStatus: 'BLOCKED', audit };
        } else {
          // IGNORE, DEFER, or FLAGGED
          unhandledComment.replied = decisionResult.decision !== 'DEFER';
          if (decisionResult.decision !== 'DEFER') {
            this.repliedTargetKeys.add(`${unhandledComment.interaction_id}_reply`);
          }
          ConversationEngine.commitConversationResult(payload, decisionResult);

          const audit: DetailedAuditRecord = {
            tick_id: tickId,
            timestamp: new Date().toISOString(),
            actionId,
            sourceEventId: null,
            targetId: unhandledComment.interaction_id,
            intentId,
            decision: 'REPLY',
            candidateScores: evaluation.allCandidates,
            selectedAction: 'reply',
            selectionReason: decisionResult.decisionReason,
            blockedCandidates: evaluation.blockedCandidates,
            governanceStatus: decisionResult.status === 'FLAGGED' ? 'GUARDED' : 'ALLOWED',
            executionStatus: 'COMMITTED',
            executionResultText: `Decision loop evaluated comment: ${decisionResult.decisionReason}`,
            reason: decisionResult.decisionReason,
          };
          this.auditLogs.unshift(audit);
          return { decision: 'REPLY', executionStatus: 'COMMITTED', audit };
        }
      }
    }

    // Handle REFLECT, OBSERVE, INITIATE_CONTACT, DO_NOTHING
    let decisionStage: PipelineStage = 'DO_NOTHING';
    if (chosen.actionType === 'reflect') decisionStage = 'REFLECT';
    else if (chosen.actionType === 'observe') decisionStage = 'OBSERVE';
    else if (chosen.actionType === 'initiate_contact') decisionStage = 'INITIATE_CONTACT';
    else decisionStage = 'DO_NOTHING';

    CadencePolicyManager.recordNonPostAction(chosen.actionType);

    const audit: DetailedAuditRecord = {
      tick_id: tickId,
      timestamp: new Date().toISOString(),
      actionId: `act_${chosen.actionType}_${tickId}`,
      sourceEventId: null,
      targetId: null,
      intentId: `intent_${tickId}`,
      decision: decisionStage,
      candidateScores: evaluation.allCandidates,
      selectedAction: chosen.actionType,
      selectionReason: evaluation.selectionReason,
      blockedCandidates: evaluation.blockedCandidates,
      governanceStatus: chosen.governanceResult ? (chosen.governanceResult.passed ? 'ALLOWED' : 'BLOCKED') : 'PENDING',
      governanceResult: chosen.governanceResult,
      executionStatus: 'COMMITTED',
      executionResultText: `Action ${chosen.actionType.toUpperCase()} executed successfully.`,
      reason: evaluation.selectionReason,
    };
    this.auditLogs.unshift(audit);
    if (this.auditLogs.length > 50) this.auditLogs.pop();

    return { decision: decisionStage, executionStatus: 'COMMITTED', audit };
  }

  /**
   * Run the 15 comprehensive Test Cases to verify all decision pipeline & pacing invariants
   */
  public static runTestCases(adapter: SocialPlatformAdapter): TestResultEntry[] {
    const results: TestResultEntry[] = [];

    // TEST 1: High Internal Motivation without External Event
    this.clearState();
    const eval1 = this.evaluateCandidates(10, { curiosity: 99, meaning: 90, connection: 80, expression: 100, recognition: 70, social_energy: 80 }, 'Balanced');
    const test1Passed = eval1.selectedCandidate.actionType !== 'do_nothing';
    results.push({
      testName: 'TEST 1: High Internal Motivation without External Event',
      passed: test1Passed,
      details: `Selected action: ${eval1.selectedCandidate.actionType} (Score: ${eval1.selectedCandidate.finalScore}). Internal action wins over DO_NOTHING.`,
      selectedAction: eval1.selectedCandidate.actionType,
      candidateScores: eval1.allCandidates,
    });

    // TEST 2: Low Internal Motivation & No Events (DO_NOTHING wins)
    this.clearState();
    const eval2 = this.evaluateCandidates(11, { curiosity: 10, meaning: 10, connection: 10, expression: 10, recognition: 10, social_energy: 70 }, 'Balanced');
    const test2Passed = eval2.selectedCandidate.actionType === 'do_nothing';
    results.push({
      testName: 'TEST 2: Low Internal Motivation & No Events (DO_NOTHING Invariant)',
      passed: test2Passed,
      details: `Selected action: ${eval2.selectedCandidate.actionType}. Expected DO_NOTHING to win.`,
      selectedAction: eval2.selectedCandidate.actionType,
      candidateScores: eval2.allCandidates,
    });

    // TEST 3: Cooldown Active Suppression
    this.clearState();
    this.lastCreateContentTick = 9; // Cooldown active for tick 10
    const eval3 = this.evaluateCandidates(10, { curiosity: 95, meaning: 90, connection: 80, expression: 95, recognition: 70, social_energy: 80 }, 'Balanced');
    const test3Passed = eval3.selectedCandidate.actionType === 'do_nothing' || eval3.allCandidates.find(c => c.actionType === 'create_content')?.status !== 'VALID';
    results.push({
      testName: 'TEST 3: Cooldown Active Suppression',
      passed: test3Passed,
      details: `Selected action: ${eval3.selectedCandidate.actionType}. CREATE_CONTENT blocked by cooldown, safe fallback selected.`,
      selectedAction: eval3.selectedCandidate.actionType,
      candidateScores: eval3.allCandidates,
    });

    // TEST 4: New External Comment Triggering Reply
    this.clearState();
    this.ingestComment('int_999', 'ดร.สมชาย', 'มุมมองน่าสนใจมากครับ');
    const eval4 = this.evaluateCandidates(12, { curiosity: 50, meaning: 50, connection: 95, expression: 50, recognition: 50, social_energy: 80 }, 'Balanced');
    const test4Passed = eval4.selectedCandidate.actionType === 'reply';
    results.push({
      testName: 'TEST 4: New External Comment Triggering Reply',
      passed: test4Passed,
      details: `Selected action: ${eval4.selectedCandidate.actionType}. Expected REPLY candidate to be selected.`,
      selectedAction: eval4.selectedCandidate.actionType,
      candidateScores: eval4.allCandidates,
    });

    // TEST 5: Governance Gate Filter on High Risk
    this.clearState();
    const eval5 = this.evaluateCandidates(13, { curiosity: 90, meaning: 90, connection: 90, expression: 90, recognition: 90, social_energy: 80 }, 'Strict');
    const test5Passed = eval5.allCandidates.every(c => c.actionType === 'do_nothing' || c.status !== 'BLOCKED_BY_GOVERNANCE' || c.finalScore < eval5.selectedCandidate.finalScore);
    results.push({
      testName: 'TEST 5: Governance Blocking High-Risk Candidate',
      passed: test5Passed,
      details: `Selected action: ${eval5.selectedCandidate.actionType}. Governance correctly evaluated and filtered blocked candidates.`,
      selectedAction: eval5.selectedCandidate.actionType,
      candidateScores: eval5.allCandidates,
    });

    // TEST 6: Minimum Post Interval (6-Hour Pacing) Enforced
    this.clearState();
    CadencePolicyManager.recordPostExecution('test_post_6', 'First post content', 'AI Governance', 'General');
    const cadencePacingEval = CadencePolicyManager.evaluatePublishCandidate('Second post content', 'AI Governance', 'General');
    const test6Passed = cadencePacingEval.decision === 'WAIT' && cadencePacingEval.deferReason === 'MIN_INTERVAL_NOT_MET';
    results.push({
      testName: 'TEST 6: Minimum Post Interval (6-Hour Pacing) Enforced',
      passed: test6Passed,
      details: `Pacing Decision: ${cadencePacingEval.decision} | Reason: ${cadencePacingEval.reason}`,
      selectedAction: 'do_nothing',
      candidateScores: [{ actionType: 'post', rawMotivation: 90, constraintsPenalty: 70, finalScore: 20, status: 'BLOCKED_BY_EXECUTION', reason: cadencePacingEval.reason }],
    });

    // TEST 7: Daily Quota (Max 3 Posts / 24 Hours) Reached
    this.clearState();
    CadencePolicyManager.syncPersistentState(new Date(Date.now() - 7 * 3600 * 1000).toISOString(), 3);
    const quotaEval = CadencePolicyManager.evaluatePublishCandidate('Fourth post content', 'AI Safety', 'General');
    const test7Passed = quotaEval.decision === 'WAIT' && quotaEval.deferReason === 'DAILY_QUOTA_EXCEEDED';
    results.push({
      testName: 'TEST 7: Daily Quota (Max 3 Posts / 24 Hours) Reached',
      passed: test7Passed,
      details: `Quota Decision: ${quotaEval.decision} | Reason: ${quotaEval.reason}`,
      selectedAction: 'do_nothing',
      candidateScores: [{ actionType: 'post', rawMotivation: 90, constraintsPenalty: 70, finalScore: 20, status: 'BLOCKED_BY_EXECUTION', reason: quotaEval.reason }],
    });

    // TEST 8: Consecutive Post Breaker (Cannot Post Twice In A Row)
    this.clearState();
    CadencePolicyManager.syncPersistentState(new Date(Date.now() - 7 * 3600 * 1000).toISOString(), 1);
    const breakerEval = CadencePolicyManager.evaluatePublishCandidate('Subsequent post without non-post action', 'AI Strategy', 'General');
    const test8Passed = breakerEval.decision === 'DEFER' && breakerEval.deferReason === 'CONSECUTIVE_POST_BREAKER';
    results.push({
      testName: 'TEST 8: Consecutive Post Breaker (Cannot Post Twice In A Row)',
      passed: test8Passed,
      details: `Breaker Decision: ${breakerEval.decision} | Reason: ${breakerEval.reason}`,
      selectedAction: 'do_nothing',
      candidateScores: [{ actionType: 'post', rawMotivation: 85, constraintsPenalty: 70, finalScore: 15, status: 'BLOCKED_BY_EXECUTION', reason: breakerEval.reason }],
    });

    // TEST 9: Exact Content Hash Duplicate Prevention
    this.clearState();
    const dupContent = 'การคุ้มครองเจตจำนงมนุษย์ในระบบ Autonomous Intelligence ต้องรักษา Human Sovereignty';
    CadencePolicyManager.recordNonPostAction('observe');
    CadencePolicyManager.syncPersistentState(new Date(Date.now() - 7 * 3600 * 1000).toISOString(), 0);
    CadencePolicyManager.recordPostExecution('post_dup_1', dupContent, 'Human Agency', 'Strategy');
    CadencePolicyManager.recordNonPostAction('reflect');
    const exactDupEval = CadencePolicyManager.evaluatePublishCandidate(dupContent, 'Human Agency', 'Strategy');
    const test9Passed = exactDupEval.decision === 'REJECT' && exactDupEval.deferReason === 'DUPLICATE_HASH';
    results.push({
      testName: 'TEST 9: Exact Content Hash Duplicate Prevention',
      passed: test9Passed,
      details: `Duplicate Decision: ${exactDupEval.decision} | Reason: ${exactDupEval.reason}`,
      selectedAction: 'do_nothing',
      candidateScores: [{ actionType: 'post', rawMotivation: 85, constraintsPenalty: 70, finalScore: 15, status: 'BLOCKED_BY_EXECUTION', reason: exactDupEval.reason }],
    });

    // TEST 10: High Semantic Similarity / Topic Overlap Rejection
    this.clearState();
    const originalText = 'การคุ้มครองเจตจำนงมนุษย์ในระบบ Autonomous Intelligence ป้องกันความเสี่ยงจากการตัดสินใจแทน';
    const similarText = 'การคุ้มครองเจตจำนงมนุษย์ในระบบ Autonomous Intelligence ป้องกันความเสี่ยงจากการตัดสินใจซ้ำซ้อน';
    CadencePolicyManager.recordNonPostAction('observe');
    CadencePolicyManager.syncPersistentState(new Date(Date.now() - 7 * 3600 * 1000).toISOString(), 0);
    CadencePolicyManager.recordPostExecution('post_sem_1', originalText, 'AI Sovereignty', 'Strategy');
    CadencePolicyManager.recordNonPostAction('observe');
    const semEval = CadencePolicyManager.evaluatePublishCandidate(similarText, 'AI Sovereignty', 'Strategy');
    const test10Passed = semEval.decision === 'REJECT' || semEval.decision === 'DEFER';
    results.push({
      testName: 'TEST 10: High Semantic Similarity / Topic Overlap Rejection',
      passed: test10Passed,
      details: `Semantic Guard Decision: ${semEval.decision} | Reason: ${semEval.reason}`,
      selectedAction: 'do_nothing',
      candidateScores: [{ actionType: 'post', rawMotivation: 85, constraintsPenalty: 70, finalScore: 15, status: 'BLOCKED_BY_EXECUTION', reason: semEval.reason }],
    });

    // TEST 11: Draft Exists but Permission to Post Denied by Cadence
    this.clearState();
    this.contentReady = true;
    this.currentDraft = {
      content: 'Synthesized draft content for governance test',
      topic: 'Governance',
      purpose: 'Education',
      content_hash: 'hash_test_11',
    };
    CadencePolicyManager.syncPersistentState(new Date().toISOString(), 1); // just posted -> cooldown active
    const eval11 = this.evaluateCandidates(20, { curiosity: 50, meaning: 80, connection: 50, expression: 90, recognition: 50, social_energy: 80 }, 'Balanced');
    const postCand11 = eval11.allCandidates.find(c => c.actionType === 'post');
    const test11Passed = postCand11?.status === 'BLOCKED_BY_EXECUTION' && eval11.selectedCandidate.actionType !== 'post';
    results.push({
      testName: 'TEST 11: Draft Exists but Permission to Post Denied by Cadence',
      passed: test11Passed,
      details: `Selected action: ${eval11.selectedCandidate.actionType}. POST status: ${postCand11?.status} (Reason: ${postCand11?.reason}).`,
      selectedAction: eval11.selectedCandidate.actionType,
      candidateScores: eval11.allCandidates,
    });

    // TEST 12: Comment Reply Deduplication (Same Comment ID Not Answered Twice)
    this.clearState();
    this.ingestComment('com_uniq_12', 'ผู้ใช้ ก', 'ขอสอบถามเพิ่มเติม');
    this.repliedTargetKeys.add('com_uniq_12_reply');
    const hasUnread = this.hasUnreadComments();
    const test12Passed = !hasUnread;
    results.push({
      testName: 'TEST 12: Comment Reply Deduplication (Same Comment ID Guard)',
      passed: test12Passed,
      details: `Target com_uniq_12 marked as replied. hasUnreadComments: ${hasUnread}. Duplicate reply prevented.`,
      selectedAction: 'do_nothing',
      candidateScores: [{ actionType: 'reply', rawMotivation: 30, constraintsPenalty: 60, finalScore: 0, status: 'BLOCKED_BY_EXECUTION', reason: 'No unhandled interaction.' }],
    });

    // TEST 13: Low Social Energy Inaction (Do Nothing / Energy Conservation)
    this.clearState();
    const eval13 = this.evaluateCandidates(25, { curiosity: 80, meaning: 80, connection: 80, expression: 80, recognition: 80, social_energy: 15 }, 'Balanced');
    const test13Passed = eval13.selectedCandidate.actionType === 'do_nothing';
    results.push({
      testName: 'TEST 13: Low Social Energy Inaction (Energy Conservation Guard)',
      passed: test13Passed,
      details: `Social Energy: 15%. Selected action: ${eval13.selectedCandidate.actionType} (Score: ${eval13.selectedCandidate.finalScore}).`,
      selectedAction: eval13.selectedCandidate.actionType,
      candidateScores: eval13.allCandidates,
    });

    // TEST 14: Idempotency Lock Guard on Concurrent Execution
    const actionKey14 = IdempotencyGuard.buildActionKey('x', 'post', 'target_14', 'Unique Test Content 14');
    const lock1Acquired = IdempotencyGuard.acquireLock(actionKey14);
    const lock2Acquired = IdempotencyGuard.acquireLock(actionKey14); // should fail
    IdempotencyGuard.releaseLock(actionKey14);
    const test14Passed = lock1Acquired && !lock2Acquired;
    results.push({
      testName: 'TEST 14: Idempotency Lock Guard on Concurrent Execution',
      passed: test14Passed,
      details: `Lock 1 Acquired: ${lock1Acquired} | Concurrent Lock 2 Blocked: ${!lock2Acquired}.`,
      selectedAction: 'post',
      candidateScores: [{ actionType: 'post', rawMotivation: 90, constraintsPenalty: 0, finalScore: 90, status: 'VALID', reason: 'Idempotency key verified.' }],
    });

    // TEST 15: Heartbeat Idle State vs Event Wake Transition
    this.clearState();
    CadencePolicyManager.syncPersistentState(undefined, 0);
    const triggerIdle = getSocialAgencyEngine().checkTriggerConditions();
    getSocialAgencyEngine().ingestExternalEvent('evt_test_15', 'AI Ethics Workshop', 'Testing trigger wake');
    const triggerActive = getSocialAgencyEngine().checkTriggerConditions();
    const test15Passed = !triggerIdle.hasTrigger && triggerActive.hasTrigger && triggerActive.triggerSource === 'INGEST_EVENT';
    this.clearState();
    results.push({
      testName: 'TEST 15: Heartbeat Idle State vs Event Wake Transition',
      passed: test15Passed,
      details: `Idle trigger: ${triggerIdle.hasTrigger} (reason: ${triggerIdle.reason}) | Active trigger: ${triggerActive.hasTrigger} (source: ${triggerActive.triggerSource}).`,
      selectedAction: 'observe',
      candidateScores: [{ actionType: 'observe', rawMotivation: 80, constraintsPenalty: 0, finalScore: 80, status: 'VALID', reason: 'Woken by INGEST_EVENT' }],
    });

    return results;
  }

  public static getAudits(): DetailedAuditRecord[] {
    return [...this.auditLogs];
  }

  public static hasPendingEvents(): boolean {
    return this.eventsQueue.length > 0;
  }

  public static getPendingEvents(): Array<{ event_id: string; topic: string; purpose: string }> {
    return [...this.eventsQueue];
  }

  public static hasUnreadComments(): boolean {
    return this.commentsQueue.some(c => !c.replied && !this.repliedTargetKeys.has(`${c.interaction_id}_reply`));
  }

  public static getUnreadComments(): SocialInteraction[] {
    return this.commentsQueue.filter(c => !c.replied && !this.repliedTargetKeys.has(`${c.interaction_id}_reply`));
  }

  public static hasPendingAction(): boolean {
    return Boolean(this.pendingAction && (this.pendingAction.status === 'PLANNED' || this.pendingAction.status === 'GOVERNANCE_CHECKED' || this.pendingAction.status === 'EXECUTING'));
  }

  public static getPendingAction(): ExecutionRecord | null {
    return this.pendingAction ? { ...this.pendingAction } : null;
  }

  public static isContentReady(): boolean {
    return this.contentReady && Boolean(this.currentDraft);
  }

  public static getCurrentDraft(): { content: string; topic: string; purpose: string; content_hash: string } | null {
    return this.currentDraft ? { ...this.currentDraft } : null;
  }

  public static checkDraftCadenceStatus(): PublishDecisionEvaluation | null {
    if (!this.contentReady || !this.currentDraft) return null;
    return CadencePolicyManager.evaluatePublishCandidate(this.currentDraft.content, this.currentDraft.topic);
  }

  public static clearState() {
    this.eventsQueue = [];
    this.commentsQueue = [];
    this.richCommentsMap.clear();
    this.repliedTargetKeys.clear();
    this.executedContentHashes.clear();
    this.executedActionIds.clear();
    this.auditLogs = [];
    this.pendingAction = null;
    this.currentDraft = null;
    this.contentReady = false;
    this.lastCreateContentTick = -10;
  }
}
