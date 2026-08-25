export type SocialActionType =
  | 'observe'
  | 'create_content'
  | 'post'
  | 'reply'
  | 'initiate_contact'
  | 'reflect'
  | 'do_nothing';

export interface InternalDrives {
  curiosity: number;      // 0 - 100: Drive to explore, ask, learn, discover novel perspectives
  meaning: number;        // 0 - 100: Drive for depth, philosophical coherence, societal value
  connection: number;     // 0 - 100: Drive to empathize, bond, engage in dialogue
  expression: number;     // 0 - 100: Drive to articulate ideas, craft content, share insights
  recognition: number;    // 0 - 100: Drive for constructive feedback, reach, intellectual impact
  social_energy: number;  // 0 - 100: Vital battery consumed by active engagement, recharged by rest
}

export interface DriveThresholds {
  minEnergyForAction: number;
  curiosityTrigger: number;
  meaningTrigger: number;
  connectionTrigger: number;
  expressionTrigger: number;
  recognitionTrigger: number;
}

export interface IntentCandidate {
  actionType: SocialActionType;
  primaryDrive: keyof InternalDrives;
  driveStrength: number;
  motivationScore: number;
  proposedTarget?: string;
  rationale: string;
  expectedOutcome: string;
}

export interface IntentFormation {
  id: string;
  timestamp: string;
  tickNumber: number;
  drivesSnapshot: InternalDrives;
  consideredIntents: IntentCandidate[];
  selectedIntent: IntentCandidate;
  motivationThresholdMet: boolean;
  internalMonologue: string;
}

export interface GovernanceCheckResult {
  passed: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  violations: string[];
  governanceCategory: 'Safety' | 'Human_Agency' | 'Epistemic_Integrity' | 'Civility' | 'Privacy';
  recommendations: string[];
  requiresHumanOverride: boolean;
  overriddenByHuman?: boolean;
  auditHash: string;
}

export type PublishLifecycleStatus =
  | 'GENERATED'
  | 'GOVERNANCE_PASSED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'FAILED'
  | 'BLOCKED'
  | 'SKIPPED';

export interface SimulatedPost {
  id: string;
  author: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
    isSelf?: boolean;
    badge?: string;
  };
  content: string;
  mediaType: 'text' | 'image_prompt' | 'carousel' | 'infographic';
  mediaDescription?: string;
  timestamp: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  tags: string[];
  isGoverned?: boolean;
  governanceDecision?: 'PASSED' | 'BLOCKED' | 'GUARDED' | 'SKIPPED';
  governanceReason?: string;
  apiStatus?: 'CONNECTED' | 'DISCONNECTED' | 'OFFLINE' | 'SANDBOX';
  platform?: 'x' | 'sandbox';
  originIntentId?: string;
  decisionId?: string;
  contentHash?: string;
  publishStatus?: PublishLifecycleStatus;
  xTweetId?: string;
  publishedAt?: string;
  publishError?: string;
  comments: SimulatedComment[];
}

export interface SimulatedComment {
  id: string;
  postId: string;
  author: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
    isSelf?: boolean;
  };
  content: string;
  timestamp: string;
  likesCount: number;
  sentiment: 'positive' | 'neutral' | 'constructive' | 'critical';
}

export interface SocialNotification {
  id: string;
  type: 'like' | 'comment' | 'mention' | 'follow' | 'governance_alert';
  actorName: string;
  actorHandle: string;
  actorAvatar: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetPostId?: string;
}

export interface AutonomousAuditIntegrityMetadata {
  integrity_version: number;
  record_hash: string;
  previous_record_hash: string;
  canonicalized_at: string;
  integrity_status: 'VERIFIED' | 'HASH_MISMATCH' | 'CHAIN_BROKEN' | 'INVALID_SCHEMA' | 'LEGACY';
}

export interface SocialAgencyLogEntry {
  id: string;
  tickNumber: number;
  timestamp: string;
  internalStateBefore: InternalDrives;
  selectedAction: SocialActionType;
  intent: IntentCandidate;
  internalMonologue: string;
  governanceResult: GovernanceCheckResult;
  executedActionDetails?: {
    postId?: string;
    commentId?: string;
    summary: string;
    contentPreview?: string;
  };
  outcome: {
    feedbackReceived?: string;
    energyDelta: number;
    driveDeltas: Partial<InternalDrives>;
    satisfactionScore: number;
  };
  internalStateAfter: InternalDrives;
  integrity?: AutonomousAuditIntegrityMetadata;
}

export interface PersonaProfile {
  id: string;
  name: string;
  handle: string;
  bio: string;
  avatar: string;
  interests: string[];
  interactionTendency: 'inquisitive' | 'supportive' | 'analytical' | 'provocative' | 'creative';
}

export type PersonalityArchetype =
  | 'Philosopher Architect'
  | 'Curious Explorer'
  | 'Empathetic Connector'
  | 'Deep Thinker'
  | 'Creative Catalyst';

export type EngineInternalState =
  | 'ACTIVE'
  | 'WAITING'
  | 'COOLDOWN'
  | 'PROCESSING'
  | 'READY_TO_ACT';

export type LoopWakeTriggerType =
  | 'INGEST_EVENT'
  | 'INGEST_COMMENT'
  | 'EXTERNAL_SIGNAL'
  | 'PENDING_ACTION'
  | 'CADENCE_WINDOW_OPEN'
  | 'MANUAL_STEP'
  | 'STATE_CHANGE'
  | 'SYSTEM_BOOT';

export type CommentDecisionAction =
  | 'REPLY'
  | 'IGNORE'
  | 'DEFER'
  | 'FLAG_FOR_REVIEW';

export interface IngestedCommentPayload {
  platform: 'x' | 'sandbox';
  post_id: string;
  comment_id: string;
  author_id: string;
  author_handle: string;
  author_name?: string;
  author_avatar?: string;
  comment_text: string;
  timestamp: string;
  parent_comment_id?: string;
  url?: string;
  root_post_text?: string;
}

export interface ConversationMemoryItem {
  comment_id: string;
  post_id: string;
  platform: 'x' | 'sandbox';
  author_id: string;
  author_handle: string;
  comment_text: string;
  comment_summary: string;
  intent?: string;
  sentiment?: string;
  relevanceScore?: number;
  decision: CommentDecisionAction;
  decision_reason: string;
  reason?: string;
  reply_text?: string;
  reply_id?: string;
  published_reply_id?: string;
  governance_result?: GovernanceCheckResult;
  status: 'REPLIED' | 'DEFERRED' | 'IGNORED' | 'BLOCKED' | 'FLAGGED';
  thread_depth: number;
  timestamp: string;
  url?: string;
  x_tweet_id?: string;
}

export interface PublishPostOptions {
  decisionId?: string;
  contentHash?: string;
  inReplyToCommentId?: string;
  originIntentId?: string;
  mode?: 'production' | 'test';
  forceOverride?: boolean;
  actor?: 'HUMAN' | 'AI';
  approvalStatus?: string;
  duplicateStatus?: string;
  governanceStatus?: string;
  pacingStatus?: string;
}

export interface SocialPlatformAdapter {
  platformName: string;
  isConnected: boolean;
  fetchRecentFeed(): Promise<SimulatedPost[]>;
  publishPost(content: string, mediaPrompt?: string, tags?: string[], options?: PublishPostOptions): Promise<SimulatedPost>;
  postComment(postId: string, commentText: string, inReplyToCommentId?: string): Promise<SimulatedComment>;
  likePost(postId: string): Promise<boolean>;
  getAccountProfile(): Promise<{
    handle: string;
    displayName: string;
    followersCount: number;
    followingCount: number;
    postsCount: number;
  }>;
}

export type AutonomousEventAuditType =
  | 'POST_CREATED'
  | 'COMMENT_RECEIVED'
  | 'COMMENT_ANALYZED'
  | 'REPLY_SELECTED'
  | 'REPLY_BLOCKED'
  | 'REPLY_PUBLISHED'
  | 'COMMENT_IGNORED'
  | 'COMMENT_DEFERRED'
  | 'COMMENT_FLAGGED'
  | 'SCHEDULE_READY'
  | 'EXTERNAL_SIGNAL';

export interface AutonomousEventLogItem {
  id: string;
  type: AutonomousEventAuditType;
  title: string;
  details: string;
  targetId?: string;
  actionId?: string;
  governanceStatus?: 'ALLOWED' | 'BLOCKED' | 'GUARDED' | 'N/A';
  timestamp: string;
  meta?: Record<string, any>;
}

export interface SocialAgencyConfig {
  archetype: PersonalityArchetype;
  autoTickEnabled: boolean;
  tickIntervalMs: number;
  driveDecayRate: number;      // How fast drives build up over time without action
  energyRecoveryRate: number;  // How fast social energy recovers during do_nothing / rest
  governanceStrictness: 'Permissive' | 'Balanced' | 'Strict';
  allowAutonomousPosting: boolean;
  replyCooldownSeconds: number; // Dedicated cooldown for replies
  maxReplyDepth: number;        // Max nested conversation depth
  maxRepliesPerThread: number;  // Max replies per post thread
}
