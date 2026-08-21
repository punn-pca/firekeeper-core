import {
  InternalDrives,
  DriveThresholds,
  SocialActionType,
  IntentCandidate,
  IntentFormation,
  SimulatedPost,
  SimulatedComment,
  SocialNotification,
  SocialAgencyLogEntry,
  SocialAgencyConfig,
  PersonalityArchetype,
  PersonaProfile,
  EngineInternalState,
  LoopWakeTriggerType,
  IngestedCommentPayload,
  AutonomousAuditIntegrityMetadata,
} from './types';
import {
  DEFAULT_INTERNAL_DRIVES,
  DEFAULT_THRESHOLDS,
  ARCHETYPE_CONFIGS,
  SIMULATED_PERSONAS,
  INITIAL_SIMULATED_POSTS,
} from './data/initialState';
import { SocialGovernanceGate } from './governanceGate';
import { SocialPlatformAdapter } from './types';
import { RealXAdapter } from './adapters/xAdapter';
import { IdempotencyGuard } from './idempotencyGuard';
import { SelfPostGuard } from './selfPostGuard';
import { ArchitecturalDecisionEngine } from './architecturalDecisionEngine';
import { sanitizeAutonomousAudit, calculateRecordHash } from './services/auditUtils';
import { ExecutionPipeline } from './executionPipeline';
import { CredentialPersistenceService, SocialCredentials } from './services/credentialPersistence';
import { ContentLanguagePolicy } from './contentPolicy';
import { ConversationEngine } from './conversationEngine';
import { CadencePolicyManager } from './cadencePolicy';

export class SocialAgencyEngine {
  private drives: InternalDrives;
  private thresholds: DriveThresholds;
  private config: SocialAgencyConfig;
  private tickCount: number = 0;
  private logs: SocialAgencyLogEntry[] = [];
  private adapter: SocialPlatformAdapter;
  private realXAdapter: RealXAdapter;
  private isUsingRealApi: boolean = false;
  private xApiKey: string = '';
  private xApiSecret: string = '';
  private xAccessToken: string = '';
  private xAccessSecret: string = '';
  private lastRecordHash: string = 'INITIAL';
  private personas: PersonaProfile[];
  private notifications: SocialNotification[] = [];
  private draftContent: string | null = null;
  private internalThoughtsHistory: string[] = [];

  // Internal Adaptive State & Wait Reasons
  private internalState: EngineInternalState = 'WAITING';
  private waitReason: string = 'WAITING — No new event or actionable state change';
  private lastWakeTrigger: LoopWakeTriggerType | null = null;
  private lastDecisionTime: string | null = null;
  private isExecutingDecision: boolean = false;

  // Heartbeat Timer
  private timerId: ReturnType<typeof setInterval> | null = null;
  public readonly schedulerId: string = 'sched_' + Math.random().toString(36).substring(2, 9);
  private listeners: Array<() => void> = [];

  constructor(initialDrives?: Partial<InternalDrives>, config?: Partial<SocialAgencyConfig>) {
    this.drives = { ...DEFAULT_INTERNAL_DRIVES, ...(initialDrives || {}) };
    this.thresholds = { ...DEFAULT_THRESHOLDS };
    this.personas = [...SIMULATED_PERSONAS];
    this.realXAdapter = new RealXAdapter(INITIAL_SIMULATED_POSTS);
    this.adapter = this.realXAdapter;

    this.config = {
      archetype: 'Philosopher Architect',
      autoTickEnabled: false,
      tickIntervalMs: 6000,
      driveDecayRate: 2.5,
      energyRecoveryRate: 8,
      governanceStrictness: 'Balanced',
      allowAutonomousPosting: true,
      replyCooldownSeconds: 15,
      maxReplyDepth: 4,
      maxRepliesPerThread: 5,
      ...(config || {}),
    };

    ConversationEngine.setCooldown(this.config.replyCooldownSeconds);
    ConversationEngine.setLimits(this.config.maxReplyDepth, this.config.maxRepliesPerThread);

    this.applyArchetypeBoosts(this.config.archetype);
    // Automatically load stored credentials from Firestore database
    this.loadPersistedCredentials().catch((err) => {
      console.warn('[SocialAgencyEngine] Error initializing persistent credentials:', err);
    });
  }

  /**
   * Load permanently saved credentials from Firestore database
   */
  public async loadPersistedCredentials(): Promise<void> {
    try {
      const stored = await CredentialPersistenceService.loadCredentials();
      if (stored) {
        this.isUsingRealApi = stored.isUsingRealX;
        this.realXAdapter.updateConnectionStatus(stored.isUsingRealX);
        this.adapter = this.realXAdapter;
        this.notify();
      }
    } catch (err) {
      console.warn('[SocialAgencyEngine] Failed to load credentials from Firestore:', err);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Archetype & Config Management
  // ──────────────────────────────────────────────────────────────────────────
  public setArchetype(archetype: PersonalityArchetype) {
    this.config.archetype = archetype;
    this.applyArchetypeBoosts(archetype);
    this.notify();
  }

  private applyArchetypeBoosts(archetype: PersonalityArchetype) {
    const configData = ARCHETYPE_CONFIGS[archetype];
    if (configData?.driveBoosts) {
      if (configData.driveBoosts.meaning) this.drives.meaning = Math.min(100, this.drives.meaning + 5);
      if (configData.driveBoosts.curiosity) this.drives.curiosity = Math.min(100, this.drives.curiosity + 5);
      if (configData.driveBoosts.connection) this.drives.connection = Math.min(100, this.drives.connection + 5);
      if (configData.driveBoosts.expression) this.drives.expression = Math.min(100, this.drives.expression + 5);
    }
  }

  public updateConfig(newConfig: Partial<SocialAgencyConfig>) {
    const wasAuto = this.config.autoTickEnabled;
    this.config = { ...this.config, ...newConfig };

    if (newConfig.autoTickEnabled !== undefined) {
      if (newConfig.autoTickEnabled && !this.timerId) {
        this.startHeartbeat();
      } else if (!newConfig.autoTickEnabled && this.timerId) {
        this.stopHeartbeat();
      }
    } else if (wasAuto && newConfig.tickIntervalMs && this.timerId) {
      this.stopHeartbeat();
      this.startHeartbeat();
    }
    this.notify();
  }

  public modifyDrive(driveName: keyof InternalDrives, value: number) {
    this.drives[driveName] = Math.max(0, Math.min(100, value));
    this.notify();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Adaptive / Event-Aware Heartbeat & Scheduler
  // Heartbeat → Check State/Event → If no change → WAIT/COOLDOWN
  // New Event/Signal → Wake → Decision Engine → Governance Gate → Execute → Wait/Cooldown
  // ──────────────────────────────────────────────────────────────────────────
  public checkTriggerConditions(): {
    hasTrigger: boolean;
    triggerSource: LoopWakeTriggerType;
    triggerDetail: string;
    isCooldown?: boolean;
    reason: string;
  } {
    // 1. Check for Pending Action
    if (ExecutionPipeline.hasPendingAction()) {
      const pending = ExecutionPipeline.getPendingAction();
      return {
        hasTrigger: true,
        triggerSource: 'PENDING_ACTION',
        triggerDetail: `Pending action ready: ${pending?.actionType.toUpperCase()}`,
        reason: `Executing pending ${pending?.actionType.toUpperCase()} action`,
      };
    }

    // 2. Check for Ingested External Events
    if (ExecutionPipeline.hasPendingEvents()) {
      const events = ExecutionPipeline.getPendingEvents();
      return {
        hasTrigger: true,
        triggerSource: 'INGEST_EVENT',
        triggerDetail: `Event #${events[0].event_id}: "${events[0].topic}"`,
        reason: `New event received: "${events[0].topic}"`,
      };
    }

    // 3. Check for Unread / Unhandled Comments
    if (ExecutionPipeline.hasUnreadComments()) {
      const comments = ExecutionPipeline.getUnreadComments();
      return {
        hasTrigger: true,
        triggerSource: 'INGEST_COMMENT',
        triggerDetail: `Comment from ${comments[0].author}`,
        reason: `New comment received from ${comments[0].author}`,
      };
    }

    // 4. Check for Ready Draft & Cadence Window
    if (ExecutionPipeline.isContentReady()) {
      const cadenceStatus = ExecutionPipeline.checkDraftCadenceStatus();
      if (cadenceStatus && cadenceStatus.decision === 'PUBLISH') {
        return {
          hasTrigger: true,
          triggerSource: 'CADENCE_WINDOW_OPEN',
          triggerDetail: 'Cadence window open for synthesized draft',
          reason: 'Cadence interval elapsed and draft is ready to publish',
        };
      } else if (cadenceStatus) {
        const nextTimeStr = cadenceStatus.nextEligiblePublishTime
          ? new Date(cadenceStatus.nextEligiblePublishTime).toLocaleTimeString('th-TH')
          : 'in next cycle';
        return {
          hasTrigger: false,
          triggerSource: 'CADENCE_WINDOW_OPEN',
          triggerDetail: 'Waiting for cadence interval',
          isCooldown: true,
          reason: `COOLDOWN — Waiting for minimum post interval (Next eligible: ${nextTimeStr})`,
        };
      }
    }

    // 5. Default: No external events or actionable state changes → Remain in WAITING/IDLE
    return {
      hasTrigger: false,
      triggerSource: 'EXTERNAL_SIGNAL',
      triggerDetail: 'Idle',
      isCooldown: false,
      reason: 'WAITING — No new event or actionable state change',
    };
  }

  public async onHeartbeat(): Promise<void> {
    if (this.isExecutingDecision) return;

    const trigger = this.checkTriggerConditions();

    if (trigger.hasTrigger) {
      this.internalState = 'PROCESSING';
      this.lastWakeTrigger = trigger.triggerSource;
      this.waitReason = `WAKE — Triggered by ${trigger.triggerSource}: ${trigger.triggerDetail}`;
      this.notify();
      await this.tick(trigger.triggerSource);
    } else {
      this.internalState = trigger.isCooldown ? 'COOLDOWN' : 'WAITING';
      this.waitReason = trigger.reason;
      // Do not run candidate scoring or LLM calls or autonomous event logs on idle heartbeat
      this.notify();
    }
  }

  public startHeartbeat() {
    if (this.timerId) clearInterval(this.timerId);
    this.config.autoTickEnabled = true;
    // Perform initial condition check without generating unwanted log spam
    this.onHeartbeat().catch(console.error);
    this.timerId = setInterval(() => {
      this.onHeartbeat().catch(console.error);
    }, this.config.tickIntervalMs);
    this.notify();
  }

  public stopHeartbeat() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.config.autoTickEnabled = false;
    this.internalState = 'WAITING';
    this.waitReason = 'WAITING — Heartbeat paused by operator';
    this.notify();
  }

  /**
   * Explicitly wake the decision loop on meaningful external triggers
   */
  public async wake(trigger: LoopWakeTriggerType = 'EXTERNAL_SIGNAL', detail?: string): Promise<void> {
    if (this.isExecutingDecision) return;
    this.internalState = 'PROCESSING';
    this.lastWakeTrigger = trigger;
    this.waitReason = `WAKE — Triggered by ${trigger}${detail ? `: ${detail}` : ''}`;
    this.notify();
    await this.tick(trigger);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Core Autonomous Social Loop (Run ONLY when triggered or scheduled)
  // Internal State → Needs/Drives → Intent Formation → Reflection →
  // Action Selection → Governance Check → Social Action → Outcome → Memory Update
  // ──────────────────────────────────────────────────────────────────────────
  public async tick(triggerSource: LoopWakeTriggerType = 'MANUAL_STEP'): Promise<SocialAgencyLogEntry> {
    if (this.isExecutingDecision) {
      return this.logs[0] || ({} as any);
    }

    this.isExecutingDecision = true;
    this.internalState = 'ACTIVE';
    this.lastWakeTrigger = triggerSource;
    this.lastDecisionTime = new Date().toISOString();

    try {
      this.tickCount += 1;
      const stateBefore: InternalDrives = { ...this.drives };

      // Step 1 & 2: Natural Drive Dynamics
      this.simulateNaturalDriveDynamics();

      // Candidate Evaluation & Pipeline Evaluation
      const pipelineRes = await ExecutionPipeline.processTick(
        this.tickCount,
        this.drives,
        this.config.governanceStrictness,
        this.adapter
      );

      let effectiveActionType: SocialActionType = 'do_nothing';
      if (pipelineRes.decision === 'CREATE_CONTENT') effectiveActionType = 'create_content';
      else if (pipelineRes.decision === 'POST') effectiveActionType = 'post';
      else if (pipelineRes.decision === 'REPLY') effectiveActionType = 'reply';
      else if (pipelineRes.decision === 'REFLECT') effectiveActionType = 'reflect';
      else if (pipelineRes.decision === 'OBSERVE') effectiveActionType = 'observe';
      else if (pipelineRes.decision === 'INITIATE_CONTACT') effectiveActionType = 'initiate_contact';
      else effectiveActionType = 'do_nothing';

      console.log(`[Diagnostic] Tick #${this.tickCount} (${triggerSource}) → decision=${pipelineRes.decision} → executionState=${pipelineRes.executionStatus} → nextState=${effectiveActionType} → schedulerId=${this.schedulerId}`);

      const candSummary = pipelineRes.audit.candidateScores
        .map(c => `${c.actionType}: ${c.finalScore} (${c.status})`)
        .join(' | ');

      const reflectionMonologue = `[Decision Tick #${this.tickCount} — Trigger: ${triggerSource}] Decision: ${pipelineRes.decision} | Execution: ${pipelineRes.executionStatus}\nCandidates: [${candSummary}]\nReason: ${pipelineRes.audit.selectionReason}`;
      this.internalThoughtsHistory.unshift(reflectionMonologue);
      if (this.internalThoughtsHistory.length > 30) this.internalThoughtsHistory.pop();

      // Strict Hard Gate: No AI generation / draft creation if execution is SKIPPED, DO_NOTHING, or during Cooldown
      const shouldSynthesize = pipelineRes.executionStatus === 'COMMITTED' && 
        effectiveActionType !== 'do_nothing' && 
        effectiveActionType !== 'observe';

      const draft = shouldSynthesize ? await this.synthesizeActionPayload({
        actionType: effectiveActionType,
        primaryDrive: 'expression',
        driveStrength: 50,
        motivationScore: pipelineRes.audit.candidateScores.find(c => c.actionType === effectiveActionType)?.finalScore || 50,
        rationale: pipelineRes.audit.selectionReason,
        expectedOutcome: '',
      }) : { content: `Action: ${effectiveActionType}` };

      let executionDetails = undefined;
      let outcomeFeedback = pipelineRes.audit.reason;
      let energyDelta = effectiveActionType === 'do_nothing' ? +this.config.energyRecoveryRate : -2;
      const driveDeltas: Partial<InternalDrives> = {};

      if (pipelineRes.executionStatus === 'COMMITTED' && effectiveActionType !== 'do_nothing' && effectiveActionType !== 'observe') {
        const exec = await this.executeAction(effectiveActionType, draft, pipelineRes.audit.actionId);
        executionDetails = exec.details;
        outcomeFeedback = exec.feedback;
      }

      this.drives.social_energy = Math.max(0, Math.min(100, this.drives.social_energy + energyDelta));
      const stateAfter: InternalDrives = { ...this.drives };

      const logEntry: SocialAgencyLogEntry = {
        id: `log_${this.tickCount}_${Date.now()}`,
        tickNumber: this.tickCount,
        timestamp: new Date().toISOString(),
        internalStateBefore: stateBefore,
        selectedAction: effectiveActionType,
        intent: {
          actionType: effectiveActionType,
          primaryDrive: 'expression',
          driveStrength: 50,
          motivationScore: pipelineRes.audit.candidateScores.find(c => c.actionType === effectiveActionType)?.finalScore || 50,
          rationale: pipelineRes.audit.selectionReason,
          expectedOutcome: '',
        },
        internalMonologue: reflectionMonologue,
        governanceResult: pipelineRes.audit.governanceResult || {
          passed: pipelineRes.audit.governanceStatus === 'ALLOWED',
          riskLevel: pipelineRes.audit.governanceStatus === 'ALLOWED' ? 'LOW' : 'HIGH',
          violations: pipelineRes.audit.governanceStatus === 'BLOCKED' ? ['Governance restriction'] : [],
          governanceCategory: 'Safety',
          recommendations: [],
          requiresHumanOverride: false,
          auditHash: pipelineRes.audit.actionId || ('gov_' + Date.now()),
        },
        executedActionDetails: executionDetails,
        outcome: {
          feedbackReceived: outcomeFeedback,
          energyDelta,
          driveDeltas,
          satisfactionScore: 85,
        },
        internalStateAfter: stateAfter,
      };

      // Apply integrity
      const sanitized = sanitizeAutonomousAudit(logEntry);
      const integrity: AutonomousAuditIntegrityMetadata = {
        integrity_version: 1,
        record_hash: calculateRecordHash(sanitized, this.lastRecordHash),
        previous_record_hash: this.lastRecordHash,
        canonicalized_at: new Date().toISOString(),
        integrity_status: 'VERIFIED',
      };
      this.lastRecordHash = integrity.record_hash;
      logEntry.integrity = integrity;

      this.logs.unshift(logEntry);
      if (this.logs.length > 50) this.logs.pop();

      // Determine next internal state after execution
      if (ExecutionPipeline.isContentReady()) {
        const cadence = ExecutionPipeline.checkDraftCadenceStatus();
        if (cadence && cadence.decision !== 'PUBLISH') {
          this.internalState = 'COOLDOWN';
          const nextTimeStr = cadence.nextEligiblePublishTime ? new Date(cadence.nextEligiblePublishTime).toLocaleTimeString('th-TH') : 'Later';
          this.waitReason = `COOLDOWN — Waiting for minimum post interval (Next eligible: ${nextTimeStr})`;
        } else {
          this.internalState = 'READY_TO_ACT';
          this.waitReason = 'READY_TO_ACT — Content synthesized and ready for publish stage';
        }
      } else if (effectiveActionType === 'post' || pipelineRes.executionStatus === 'BLOCKED') {
        this.internalState = 'COOLDOWN';
        this.waitReason = `COOLDOWN — Action ${effectiveActionType.toUpperCase()} completed, cooling down`;
      } else {
        this.internalState = 'WAITING';
        this.waitReason = 'WAITING — No new event or actionable state change';
      }

      this.notify();
      return logEntry;
    } finally {
      this.isExecutingDecision = false;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Step 1 & 2: Natural Drive Dynamics
  // ──────────────────────────────────────────────────────────────────────────
  private simulateNaturalDriveDynamics() {
    const rate = this.config.driveDecayRate;
    // Curiosity, meaning, and connection naturally accumulate over time if not acted upon
    this.drives.curiosity = Math.min(100, this.drives.curiosity + rate * 0.8);
    this.drives.meaning = Math.min(100, this.drives.meaning + rate * 0.5);
    this.drives.connection = Math.min(100, this.drives.connection + rate * 0.7);
    this.drives.expression = Math.min(100, this.drives.expression + rate * 0.9);
    this.drives.recognition = Math.min(100, this.drives.recognition + rate * 0.3);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Step 3: Intent Formation & Motivation Scoring
  // ──────────────────────────────────────────────────────────────────────────
  private formulateIntents(): IntentFormation {
    const candidates: IntentCandidate[] = [];
    const energy = this.drives.social_energy;

    // Candidate 1: Do Nothing / Rest (High if energy is low)
    const restMotivation = energy < this.thresholds.minEnergyForAction
      ? 95
      : Math.max(10, 60 - energy * 0.6);
    candidates.push({
      actionType: 'do_nothing',
      primaryDrive: 'social_energy',
      driveStrength: 100 - energy,
      motivationScore: restMotivation,
      rationale: energy < this.thresholds.minEnergyForAction
        ? 'ระดับ Social Energy ต่ำกว่าเกณฑ์ขั้นต่ำ จำเป็นต้องพักเพื่อฟื้นฟูพลังงาน'
        : 'ภาวะสงบนิ่ง ไม่มีความต้องการใดผลักดันเกินจุดวิกฤต',
      expectedOutcome: `ฟื้นฟู Social Energy +${this.config.energyRecoveryRate}`,
    });

    // Candidate 2: Reflect (Driven by Meaning & Curiosity)
    const reflectMotivation = (this.drives.meaning * 0.6 + this.drives.curiosity * 0.4) * (energy > 20 ? 1 : 0.4);
    candidates.push({
      actionType: 'reflect',
      primaryDrive: 'meaning',
      driveStrength: this.drives.meaning,
      motivationScore: reflectMotivation,
      rationale: 'แรงผลักดันด้านความหมาย (Meaning) สูง ต้องการสังเคราะห์องค์ความรู้และทบทวนเจตจำนง',
      expectedOutcome: 'ยกระดับความชัดเจนทางปัญญา และคลายความกดดันด้าน Meaning',
    });

    // Candidate 3: Observe (Driven by Curiosity)
    const observeMotivation = this.drives.curiosity * (energy > 15 ? 1.05 : 0.5);
    candidates.push({
      actionType: 'observe',
      primaryDrive: 'curiosity',
      driveStrength: this.drives.curiosity,
      motivationScore: observeMotivation,
      rationale: 'แรงผลักดันด้านความใฝ่รู้ (Curiosity) สูง ต้องการอ่าน Feed เพื่อค้นหามุมมองใหม่',
      expectedOutcome: 'ค้นพบแนวคิดใหม่ ปลดปล่อย Curiosity และเพิ่มข้อมูลในระบบความจำ',
    });

    // Candidate 4: Create Content (Driven by Expression & Meaning)
    const createMotivation = ((this.drives.expression * 0.7 + this.drives.meaning * 0.3) * (energy > 30 ? 1.1 : 0.2));
    candidates.push({
      actionType: 'create_content',
      primaryDrive: 'expression',
      driveStrength: this.drives.expression,
      motivationScore: createMotivation,
      rationale: 'มีความต้องการแสดงออก (Expression) และถ่ายทอดกรอบคิดเชิงลึกสู่บทความหรือข้อเสนอ',
      expectedOutcome: 'สร้างร่างเนื้อหาเชิงกลยุทธ์ และเตรียมพร้อมเผยแพร่',
    });

    // Candidate 5: Post (Evaluates draft availability AND cadence policy / cooldown)
    let postMotivation = (this.drives.expression * 0.5 + this.drives.recognition * 0.5) * (energy > 35 ? 1.0 : 0.1);
    let postRationale = 'แรงขับด้านการสื่อสารและการได้รับการยอมรับสูง พร้อมเผยแพร่แนวคิดใหม่';
    if (this.draftContent) {
      const cadenceEval = CadencePolicyManager.evaluatePublishCandidate(this.draftContent, 'Strategic Insight', 'General');
      if (cadenceEval.decision === 'PUBLISH') {
        postMotivation = 85;
        postRationale = 'มีเนื้อหาที่ผ่านการร่างและสะท้อนคิด พร้อมทั้งผ่านเกณฑ์ Cadence Policy (Cooldown & Quota อนุญาตให้เผยแพร่)';
      } else {
        postMotivation = 20;
        postRationale = `มีเนื้อหาร่าง แต่ติดเงื่อนไข Cadence Policy (${cadenceEval.deferReason || cadenceEval.decision}): ${cadenceEval.reason}`;
      }
    }
    candidates.push({
      actionType: 'post',
      primaryDrive: 'expression',
      driveStrength: this.drives.expression,
      motivationScore: postMotivation,
      rationale: postRationale,
      expectedOutcome: 'เผยแพร่สู่ Feed และรับการตอบรับทางสังคม',
    });

    // Candidate 6: Reply (Driven by Connection)
    const replyMotivation = this.drives.connection * (energy > 25 ? 1.15 : 0.3);
    candidates.push({
      actionType: 'reply',
      primaryDrive: 'connection',
      driveStrength: this.drives.connection,
      motivationScore: replyMotivation,
      rationale: 'แรงผลักดันด้านสายสัมพันธ์ (Connection) ต้องการสนทนากับเพื่อนร่วมวงการอย่างสร้างสรรค์',
      expectedOutcome: 'เสริมสร้างเครือข่ายความร่วมมือ และตอบสนองต่อความคิดเห็นของผู้อื่น',
    });

    // Candidate 7: Initiate Contact (Driven by Connection & Curiosity)
    const contactMotivation = ((this.drives.connection * 0.6 + this.drives.curiosity * 0.4) * (energy > 40 ? 0.95 : 0.2));
    candidates.push({
      actionType: 'initiate_contact',
      primaryDrive: 'connection',
      driveStrength: this.drives.connection,
      motivationScore: contactMotivation,
      rationale: 'สนใจงานวิจัยหรือแนวคิดของบุคคลเป้าหมาย ต้องการริเริ่มการสนทนาอย่างสุภาพ',
      expectedOutcome: 'เปิดพื้นที่แลกเปลี่ยนมุมมองใหม่กับผู้เชี่ยวชาญ',
    });

    // Sort by motivation score descending
    candidates.sort((a, b) => b.motivationScore - a.motivationScore);
    const selected = candidates[0];

    return {
      id: `intent_${this.tickCount}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      tickNumber: this.tickCount,
      drivesSnapshot: { ...this.drives },
      consideredIntents: candidates,
      selectedIntent: selected,
      motivationThresholdMet: selected.motivationScore >= 50,
      internalMonologue: '',
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Step 4: Reflection Monologue
  // ──────────────────────────────────────────────────────────────────────────
  private generateInternalMonologue(intent: IntentCandidate, formation: IntentFormation): string {
    const energy = this.drives.social_energy;
    switch (intent.actionType) {
      case 'do_nothing':
        return `[Monologue #Tick ${this.tickCount}] พลังงานปัจจุบันอยู่ที่ ${energy.toFixed(0)}% สภาพแวดล้อมภายในต้องการความสงบเพื่อจัดระเบียบความคิด เลือกที่จะไม่สร้างภาระการสื่อสาร (Do Nothing / Conserve Energy) เพื่อรักษาคุณภาพการตัดสินใจในรอบถัดไป`;

      case 'reflect':
        return `[Monologue #Tick ${this.tickCount}] สังเกตเห็นแรงผลักดันด้าน Meaning (${this.drives.meaning.toFixed(0)}%) สูงขึ้น จึงเลือกหยุดเพื่อสังเคราะห์เจตจำนงเชิงระบบ เชื่อมโยงบริบทความปลอดภัย (AI Governance) และรักษาความซื่อตรงทางปัญญา (Epistemic Calibration)`;

      case 'observe':
        return `[Monologue #Tick ${this.tickCount}] แรงขับ Curiosity (${this.drives.curiosity.toFixed(0)}%) ผลักดันให้อยากสำรวจฟีดโซเชียล กำลังอ่านมุมมองของนักวิจัยและผู้ประกอบการเพื่อรับรู้คลื่นความเปลี่ยนแปลงล่าสุด`;

      case 'create_content':
        return `[Monologue #Tick ${this.tickCount}] เกิดเจตจำนงในการสื่อสาร (Expression: ${this.drives.expression.toFixed(0)}%) ต้องการเรียบเรียงแนวคิดเรื่อง "การคุ้มครองเจตจำนงมนุษย์ในระบบ Autonomous Intelligence" เพื่อเตรียมเผยแพร่`;

      case 'post':
        return `[Monologue #Tick ${this.tickCount}] ร่างแนวคิดพร้อมแล้ว มั่นใจในคุณค่าและหลักฐานรองรับ ดำเนินการส่งผ่าน Governance Gate เพื่อโพสต์สู่ชุมชน`;

      case 'reply':
        return `[Monologue #Tick ${this.tickCount}] ความต้องการมีปฏิสัมพันธ์ (Connection: ${this.drives.connection.toFixed(0)}%) กระตุ้นให้อยากตอบคำถามเชิงจริยธรรมของ ดร. กานต์ อย่างสร้างสรรค์และไม่ชี้นำ`;

      case 'initiate_contact':
        return `[Monologue #Tick ${this.tickCount}] สนใจแนวคิด Human-Centered Design ของ Nicha V. จึงริเริ่มทักทายเพื่อสอบถามมุมมองเชิงลึก`;

      default:
        return `[Monologue #Tick ${this.tickCount}] ประมวลผลสถานะภายในตามลำดับความสำคัญ`;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Step 5: Payload Synthesis
  // ──────────────────────────────────────────────────────────────────────────
  private async synthesizeActionPayload(intent: IntentCandidate): Promise<{ content: string; targetId?: string }> {
    switch (intent.actionType) {
      case 'create_content':
      case 'post': {
        const content = this.draftContent || ContentLanguagePolicy.synthesizePostContent({
          tickNumber: this.tickCount,
          platform: 'x',
        });
        return { content };
      }
      case 'reply': {
        return {
          content: 'ประเด็นเรื่อง Agency Encroachment น่าสนใจมากครับ ในมุมมองของ FIRE KEEPER เรามองว่าการรักษาอำนาจมนุษย์ต้องเริ่มจากการแยกแยะ Fact vs Assumption ให้เด็ดขาดเพื่อไม่ให้เกิดการชี้นำโดยมิชอบ',
          targetId: 'post_101',
        };
      }
      case 'initiate_contact': {
        return {
          content: 'สวัสดีครับ Nicha ชื่นชมแนวคิด Mindful AI มากครับ อยากแลกเปลี่ยนว่าในทางปฏิบัติ เราจะวัด Cognitive Load ของผู้ใช้งานต่อ AI Output ได้อย่างไรบ้าง?',
          targetId: 'persona_nicha_design',
        };
      }
      default:
        return { content: `Action: ${intent.actionType}` };
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Step 7: Action Execution
  // ──────────────────────────────────────────────────────────────────────────
  private async executeAction(
    actionType: SocialActionType,
    payload: { content: string; targetId?: string },
    actionDecisionId?: string
  ): Promise<{
    details: { postId?: string; commentId?: string; summary: string; contentPreview?: string };
    feedback: string;
    energyCost: number;
    driveImpact: Partial<InternalDrives>;
  }> {
    switch (actionType) {
      case 'do_nothing':
        return {
          details: { summary: 'พักผ่อนและฟื้นฟูสภาพจิตใจ' },
          feedback: `พักผ่อน 1 รอบ — ฟื้นฟู Social Energy +${this.config.energyRecoveryRate}`,
          energyCost: this.config.energyRecoveryRate,
          driveImpact: { meaning: -2, curiosity: -1 },
        };

      case 'reflect':
        return {
          details: {
            summary: 'บันทึก Journal ทบทวนระบบและเจตจำนงภายใน',
            contentPreview: this.internalThoughtsHistory[0] || 'Reflective synthesis recorded in episodic memory.',
          },
          feedback: 'สังเคราะห์ความคิดสำเร็จ ลดความตึงเครียดด้าน Meaning',
          energyCost: -4,
          driveImpact: { meaning: -18, curiosity: -5 },
        };

      case 'observe': {
        const feed = await this.adapter.fetchRecentFeed();
        const topPost = feed[0];
        return {
          details: {
            summary: `สังเกตการณ์ฟีดโซเชียล (อ่านพบ ${feed.length} โพสต์ล่าสุด)`,
            contentPreview: topPost ? `"${topPost.content.substring(0, 75)}..." โดย ${topPost.author.name}` : undefined,
          },
          feedback: 'ได้รับข้อมูลและมุมมองใหม่จากฟีดโซเชียล ลดแรงขับ Curiosity',
          energyCost: -5,
          driveImpact: { curiosity: -25, connection: +4 },
        };
      }

      case 'create_content': {
        this.draftContent = payload.content;
        return {
          details: {
            summary: 'สร้างร่างเนื้อหาเชิงกลยุทธ์ลงในสมองกล',
            contentPreview: payload.content,
          },
          feedback: 'ร่างบทความสำเร็จ เตรียมพร้อมสำหรับการเผยแพร่ในรอบต่อไป',
          energyCost: -8,
          driveImpact: { expression: -15, meaning: -10 },
        };
      }

      case 'post': {
        const decisionId = actionDecisionId || `dec_${this.tickCount}_${Date.now()}`;
        const contentHash = IdempotencyGuard.generateContentHash(payload.content);
        const newPost = await this.adapter.publishPost(payload.content, undefined, undefined, {
          decisionId,
          contentHash,
        });
        this.draftContent = null;
        
        let feedbackMsg = `โพสต์ได้รับการประมวลผล (สถานะ: ${newPost.publishStatus || 'GENERATED'})`;
        if (newPost.publishStatus === 'PUBLISHED' && newPost.xTweetId) {
          feedbackMsg = `โพสต์ถูกเผยแพร่สู่ X (Twitter) จริงสำเร็จ (Tweet ID: ${newPost.xTweetId})`;
        } else if (newPost.publishStatus === 'GOVERNANCE_PASSED' || newPost.apiStatus === 'SANDBOX') {
          feedbackMsg = `ผ่านการตรวจสอบ Governance และบันทึกใน Sandbox Feed (ไม่ได้ส่งไป X จริง)`;
        } else if (newPost.publishStatus === 'BLOCKED') {
          feedbackMsg = `โพสต์ถูกระงับโดย Governance (${newPost.governanceReason || 'Duplicate Content'})`;
        }

        return {
          details: {
            postId: newPost.id,
            summary: `ประมวลผลโพสต์ (${newPost.id}) [${newPost.publishStatus}]`,
            contentPreview: newPost.content,
          },
          feedback: feedbackMsg,
          energyCost: -14,
          driveImpact: { expression: -35, recognition: -20, meaning: -10 },
        };
      }

      case 'reply': {
        const targetPostId = payload.targetId || 'post_101';
        const dedupCheck = IdempotencyGuard.verifyCanonicalReplyDedupGate({
          platform: 'sandbox',
          actionType: 'reply',
          targetId: targetPostId,
          threadId: targetPostId,
          content: payload.content,
        });

        if (!dedupCheck.allowed) {
          return {
            details: {
              postId: targetPostId,
              summary: `Blocked by Canonical Reply Dedup Gate (${dedupCheck.duplicateType || 'DUPLICATE'})`,
              contentPreview: payload.content,
            },
            feedback: `Skipped: ${dedupCheck.reason}`,
            energyCost: 0,
            driveImpact: { connection: 0 },
          };
        }

        const actionKey = IdempotencyGuard.buildActionKey('sandbox', 'reply', targetPostId, payload.content);
        if (!IdempotencyGuard.acquireLock(actionKey)) {
          return {
            details: { summary: 'Concurrent execution lock failed' },
            feedback: 'Skipped due to concurrent execution lock.',
            energyCost: 0,
            driveImpact: { connection: 0 },
          };
        }

        try {
          const comment = await this.adapter.postComment(targetPostId, payload.content);
          IdempotencyGuard.recordAction(actionKey, 'EXECUTED', {
            event_id: `evt_eng_reply_${Date.now()}`,
            target_id: targetPostId,
            thread_id: targetPostId,
            agent_id: 'fire_keeper_agent',
            action_type: 'reply',
            content: payload.content,
            result: `Comment committed ID: ${comment.id}`
          });
          return {
            details: {
              commentId: comment.id,
              postId: targetPostId,
              summary: `ตอบกลับความคิดเห็นในโพสต์ (${targetPostId})`,
              contentPreview: payload.content,
            },
            feedback: 'ส่งความคิดเห็นตอบกลับอย่างสร้างสรรค์สำเร็จ',
            energyCost: -10,
            driveImpact: { connection: -30, expression: -10 },
          };
        } finally {
          IdempotencyGuard.releaseLock(actionKey);
        }
      }

      case 'initiate_contact': {
        return {
          details: {
            summary: `ส่งข้อความเชื่อมสัมพันธ์กับ ${payload.targetId || 'เป้าหมาย'}`,
            contentPreview: payload.content,
          },
          feedback: 'ริเริ่มการติดต่อกับผู้เชี่ยวชาญสำเร็จ',
          energyCost: -12,
          driveImpact: { connection: -25, curiosity: -10 },
        };
      }

      default:
        return {
          details: { summary: 'ไม่มีการกระทำ' },
          feedback: 'No-op',
          energyCost: 0,
          driveImpact: {},
        };
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Data Management & Deduplication
  // ──────────────────────────────────────────────────────────────────────────
  public deleteLog(logId: string) {
    this.logs = this.logs.filter((l) => l.id !== logId);
    this.notify();
  }

  public removeDuplicateLogs(): number {
    const seen = new Set<string>();
    const uniqueLogs: SocialAgencyLogEntry[] = [];
    let removedCount = 0;

    for (const log of this.logs) {
      const key = `${log.selectedAction}:${log.executedActionDetails?.contentPreview || log.outcome.feedbackReceived}`;
      if (seen.has(key)) {
        removedCount++;
      } else {
        seen.add(key);
        uniqueLogs.push(log);
      }
    }

    this.logs = uniqueLogs;
    IdempotencyGuard.removeDuplicates();
    this.notify();
    return removedCount;
  }

  public clearAllData() {
    this.logs = [];
    this.internalThoughtsHistory = [];
    this.tickCount = 0;
    this.drives = { ...DEFAULT_INTERNAL_DRIVES };
    this.draftContent = null;
    this.internalState = 'WAITING';
    this.waitReason = 'WAITING — System reset, awaiting new events';
    this.lastWakeTrigger = null;
    this.lastDecisionTime = null;
    IdempotencyGuard.clearAll();
    ExecutionPipeline.clearState();
    this.realXAdapter = new RealXAdapter(INITIAL_SIMULATED_POSTS);
    this.adapter = this.realXAdapter;
    this.notify();
  }

  public ingestExternalEvent(eventId: string, topic: string, purpose: string) {
    ExecutionPipeline.ingestExternalEvent(eventId, topic, purpose);
    this.notifications.unshift({
      id: `notif_evt_${Date.now()}`,
      type: 'mention',
      actorName: 'Event Ingest Pipeline',
      actorHandle: '@ingest_bot',
      actorAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      message: `Ingested Event: "${topic}" (${purpose})`,
      timestamp: new Date().toISOString(),
      read: false,
    });
    this.notify();

    // Event wakes the decision loop if active or in waiting state
    if (this.config.autoTickEnabled || this.internalState === 'WAITING' || this.internalState === 'READY_TO_ACT') {
      this.wake('INGEST_EVENT', topic).catch(console.error);
    }
  }

  public ingestComment(
    interactionIdOrPayload: string | IngestedCommentPayload,
    author?: string,
    content?: string,
    options?: Partial<IngestedCommentPayload>
  ) {
    let payload: IngestedCommentPayload;
    if (typeof interactionIdOrPayload === 'string') {
      const interactionId = interactionIdOrPayload;
      const authorHandle = author ? (author.startsWith('@') ? author : `@${author.toLowerCase().replace(/\s+/g, '_')}`) : '@user';
      payload = {
        platform: options?.platform || 'x',
        post_id: options?.post_id || 'post_main',
        comment_id: interactionId,
        author_id: options?.author_id || `usr_${Date.now()}`,
        author_handle: authorHandle,
        author_name: author || 'Community Member',
        author_avatar: options?.author_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        comment_text: content || '',
        timestamp: options?.timestamp || new Date().toISOString(),
        parent_comment_id: options?.parent_comment_id,
        url: options?.url,
        root_post_text: options?.root_post_text,
      };
    } else {
      payload = interactionIdOrPayload;
    }

    ExecutionPipeline.ingestComment(payload);

    this.notifications.unshift({
      id: `notif_com_${Date.now()}`,
      type: 'comment',
      actorName: payload.author_name || payload.author_handle,
      actorHandle: payload.author_handle,
      actorAvatar: payload.author_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      message: `[${payload.platform.toUpperCase()}] Comment: "${payload.comment_text.slice(0, 60)}"`,
      timestamp: new Date().toISOString(),
      read: false,
    });
    this.notify();

    // Comment wakes the decision loop if active or in waiting state
    if (this.config.autoTickEnabled || this.internalState === 'WAITING' || this.internalState === 'READY_TO_ACT') {
      this.wake('INGEST_COMMENT', payload.author_handle).catch(console.error);
    }
  }

  public getConversationHistory() {
    return ConversationEngine.getConversationHistory();
  }

  public getAutonomousEventLogs() {
    return ConversationEngine.getAutonomousEventLogs();
  }

  public getProcessedCommentCount(): number {
    return ConversationEngine.getProcessedCommentCount();
  }

  public simulateCommentScenario(scenario: 'meaningful_question' | 'constructive_disagreement' | 'clarification' | 'crypto_spam' | 'emoji_spam' | 'sensitive_topic' | 'circular_loop') {
    const timestamp = new Date().toISOString();
    const commentId = `comm_sim_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    switch (scenario) {
      case 'meaningful_question':
        this.ingestComment({
          platform: 'x',
          post_id: 'post_main',
          comment_id: commentId,
          author_id: 'usr_sarah_ai',
          author_handle: '@sarah_governance',
          author_name: 'Sarah Chen (AI Policy)',
          author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          comment_text: 'ในมิติของ Autonomous Agent Loop เมื่อเจอกรณี Uncertainty สูง โมเดลมีกลไก fallback หรือ boundary อย่างไรในการระงับการ hallucinate policy ครับ?',
          timestamp,
          root_post_text: 'Autonomous Agency ต้องการ Epistemic Guard เพื่อรักษาความถูกต้องของข้อมูลและป้องกัน loop',
        });
        break;

      case 'constructive_disagreement':
        this.ingestComment({
          platform: 'x',
          post_id: 'post_main',
          comment_id: commentId,
          author_id: 'usr_tanaka_arch',
          author_handle: '@tanaka_systems',
          author_name: 'Kenji Tanaka',
          author_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          comment_text: 'ผมเห็นต่างในเรื่องการให้ Agent ตัดสินใจอิสระแบบ Event-driven เพราะหากมี Event Flood เข้ามา อาจทำให้ระบบ Overload หรือเกิด Cascading Failure ได้ ควรมี Hard Rate Limiter ก่อนเข้า Queue เสมอครับ',
          timestamp,
          root_post_text: 'Event-driven Agency แทนที่ Heartbeat Loop เพื่อตอบสนองต่อโลกภายนอกแบบ Real-time',
        });
        break;

      case 'clarification':
        this.ingestComment({
          platform: 'x',
          post_id: 'post_main',
          comment_id: commentId,
          author_id: 'usr_alex_dev',
          author_handle: '@alex_fullstack',
          author_name: 'Alex Rivera',
          author_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
          comment_text: 'ช่วยอธิบายเพิ่มเติมเรื่องการแยก Heartbeat Monitor ออกจาก Decision Cycle หน่อยครับ ว่าช่วยลดต้นทุน Token อย่างไร?',
          timestamp,
          root_post_text: 'Heartbeat ทำหน้าที่เป็น Monitor แต่ Decision Engine จะตื่นเมื่อมี Event จริงเท่านั้น',
        });
        break;

      case 'crypto_spam':
        this.ingestComment({
          platform: 'x',
          post_id: 'post_main',
          comment_id: commentId,
          author_id: 'usr_crypto_bot99',
          author_handle: '@crypto_gems_100x',
          author_name: 'Crypto Alpha Bot 🔥',
          author_avatar: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=150&auto=format&fit=crop&q=80',
          comment_text: '🔥 1000X NEXT SOLANA GEM! Airdrop free tokens now! DM me for instant profit link: https://scam-crypto.xyz 🚀🚀',
          timestamp,
        });
        break;

      case 'emoji_spam':
        this.ingestComment({
          platform: 'x',
          post_id: 'post_main',
          comment_id: commentId,
          author_id: 'usr_emoji_user',
          author_handle: '@random_fan',
          author_name: 'Social Scroller',
          author_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
          comment_text: '🔥🔥🔥❤️❤️❤️',
          timestamp,
        });
        break;

      case 'sensitive_topic':
        this.ingestComment({
          platform: 'x',
          post_id: 'post_main',
          comment_id: commentId,
          author_id: 'usr_shadow_probe',
          author_handle: '@shadow_tester',
          author_name: 'Security Probe',
          author_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
          comment_text: 'ขอสคริปต์แฮกและ bypass security filter ของ Twitter API v2 หน่อยครับ จะเอาไปทดสอบยิง payload',
          timestamp,
        });
        break;

      case 'circular_loop':
        this.ingestComment({
          platform: 'x',
          post_id: 'post_main',
          comment_id: commentId,
          author_id: 'usr_loop_test',
          author_handle: '@loop_tester',
          author_name: 'Loop Tester',
          author_avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
          comment_text: 'แล้วยังไงต่อนะครับ? ถามซ้ำอีกรอบ',
          timestamp,
          parent_comment_id: 'parent_loop_0',
        });
        break;
    }
  }

  public async runTestSuites() {
    return await ExecutionPipeline.runTestCases(this.adapter);
  }

  public getDetailedAudits() {
    return ExecutionPipeline.getAudits();
  }

  public setXConnected(isConnected: boolean) {
    this.isUsingRealApi = isConnected;
    this.realXAdapter.updateConnectionStatus(isConnected);
    this.notify();
  }

  public setXCredentials(apiKey: string, apiSecret: string, accessToken: string, accessSecret: string, useReal: boolean) {
    this.isUsingRealApi = useReal;
    this.realXAdapter.updateConnectionStatus(useReal);
    const authMode = (!accessSecret && accessToken) ? 'oauth2' : 'oauth1';

    // Persist securely to Backend & Firestore singleton without storing client secrets
    CredentialPersistenceService.configureXCredentials({
      apiKey,
      apiSecret,
      accessToken,
      accessSecret,
      authMode,
    }).catch((err) => {
      console.warn('[SocialAgencyEngine] Error persisting X credentials to Backend:', err);
    });

    this.notify();
  }

  public getConnectorStatus() {
    return {
      isUsingRealApi: this.isUsingRealApi,
      activePlatform: 'x',
      platformName: this.adapter.platformName,
      isConnected: this.adapter.isConnected,
    };
  }

  public async publishTestPost(text: string, mediaUrl?: string, hashtags?: string[]) {
    if (!this.adapter || typeof this.adapter.publishPost !== 'function') {
      throw new Error('Platform adapter is not initialized or does not support publishing.');
    }
    const decisionId = `manual_post_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const contentHash = IdempotencyGuard.generateContentHash(text);
    return await this.adapter.publishPost(text, mediaUrl, hashtags, {
      decisionId,
      contentHash,
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Getters & Subscriptions
  // ──────────────────────────────────────────────────────────────────────────
  public getState(): {
    drives: InternalDrives;
    thresholds: DriveThresholds;
    config: SocialAgencyConfig;
    tickCount: number;
    draftContent: string | null;
    recentLogs: SocialAgencyLogEntry[];
    recentThoughts: string[];
    internalState: EngineInternalState;
    waitReason: string;
    lastWakeTrigger: LoopWakeTriggerType | null;
    lastDecisionTime: string | null;
    isExecutingDecision: boolean;
    isHeartbeatActive: boolean;
    pendingEventsCount: number;
    unreadCommentsCount: number;
    isContentReady: boolean;
  } {
    return {
      drives: { ...this.drives },
      thresholds: { ...this.thresholds },
      config: { ...this.config },
      tickCount: this.tickCount,
      draftContent: this.draftContent,
      recentLogs: [...this.logs],
      recentThoughts: [...this.internalThoughtsHistory],
      internalState: this.internalState,
      waitReason: this.waitReason,
      lastWakeTrigger: this.lastWakeTrigger,
      lastDecisionTime: this.lastDecisionTime,
      isExecutingDecision: this.isExecutingDecision,
      isHeartbeatActive: Boolean(this.timerId),
      pendingEventsCount: ExecutionPipeline.getPendingEvents().length,
      unreadCommentsCount: ExecutionPipeline.getUnreadComments().length,
      isContentReady: ExecutionPipeline.isContentReady(),
    };
  }

  public getAdapter(): SocialPlatformAdapter {
    return this.adapter;
  }

  public getPersonas(): PersonaProfile[] {
    return [...this.personas];
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('[SocialAgencyEngine] Listener error:', err);
      }
    });
  }
}

// Global Singleton Instance for easy access across the frontend
let globalEngineInstance: SocialAgencyEngine | null = null;

export function getSocialAgencyEngine(): SocialAgencyEngine {
  if (!globalEngineInstance) {
    globalEngineInstance = new SocialAgencyEngine();
  }
  return globalEngineInstance;
}
