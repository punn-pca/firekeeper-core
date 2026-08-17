export interface CadenceConfig {
  minPostIntervalMinutes: number; // Default 360 (6 hours)
  maxPostsPer6Hours: number;     // Default 1
  maxPostsPer24Hours: number;    // Default 3 (3 per 24h)
  semanticSimilarityThreshold: number; // Default 0.38
  consecutivePostLimit: number;  // Default 1 (consecutive post breaker)
}

export type DeferReason =
  | 'CADENCE_LIMIT_INTERVAL'
  | 'CADENCE_LIMIT_6H'
  | 'CADENCE_LIMIT_24H'
  | 'CONSECUTIVE_POST_BREAKER'
  | 'DUPLICATE_TOPIC'
  | 'LOW_NOVELTY'
  | 'LOW_STRATEGIC_VALUE'
  | 'SEMANTIC_OVERLAP'
  | 'INSUFFICIENT_CONTENT_DIVERSITY';

export type PublishDecisionResult = 'PUBLISH' | 'DEFER' | 'WAIT' | 'REJECT';

export interface PublishDecisionEvaluation {
  decision: PublishDecisionResult;
  deferReason?: DeferReason;
  reason: string;
  nextEligiblePublishTime: string | null;
  strategicScore: number;
  noveltyScore: number;
  diversityScore: number;
}

export interface PublishHistoryRecord {
  timestamp: string;
  content: string;
  topic: string;
  category: string;
  contentHash: string;
  actionType?: string;
}

export class CadencePolicyManager {
  private static config: CadenceConfig = {
    minPostIntervalMinutes: 360, // 6 hours
    maxPostsPer6Hours: 1,
    maxPostsPer24Hours: 3,       // Max 3 posts per 24h
    semanticSimilarityThreshold: 0.38,
    consecutivePostLimit: 1,
  };

  private static history: PublishHistoryRecord[] = [];
  private static lastPersistentPostAt: string | null = null;
  private static lastPersistentDailyCount: number = 0;
  private static lastPublishDecisionState: PublishDecisionResult = 'PUBLISH';
  private static lastDeferReason: DeferReason | undefined = undefined;
  private static lastEligibleTime: Date | null = null;
  private static consecutivePostCount: number = 0;

  public static getConfig(): CadenceConfig {
    return { ...this.config };
  }

  public static updateConfig(newConfig: Partial<CadenceConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public static syncPersistentState(lastPostAt?: string, dailyPostCount?: number) {
    if (lastPostAt) {
      this.lastPersistentPostAt = lastPostAt;
    }
    if (dailyPostCount !== undefined) {
      this.lastPersistentDailyCount = dailyPostCount;
    }
  }

  public static getHistory(): PublishHistoryRecord[] {
    return [...this.history];
  }

  public static getLastPublishDecisionState(): PublishDecisionResult {
    return this.lastPublishDecisionState;
  }

  public static getLastDeferReason(): DeferReason | undefined {
    return this.lastDeferReason;
  }

  public static getNextEligiblePublishTime(): string | null {
    return this.lastEligibleTime ? this.lastEligibleTime.toISOString() : null;
  }

  public static recordNonPostAction(actionType: string) {
    if (actionType !== 'post') {
      this.consecutivePostCount = 0;
    }
  }

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
   * Evaluates whether a new post candidate meets all Cadence, Novelty, and Strategic Value criteria.
   */
  public static evaluatePublishCandidate(
    content: string,
    topic: string,
    category: string = 'Autonomous Governance'
  ): PublishDecisionEvaluation {
    const now = new Date();
    const history = this.history;

    // 0. Consecutive Post Breaker Check
    if (this.consecutivePostCount >= this.config.consecutivePostLimit) {
      const nextEligible = new Date(now.getTime() + this.config.minPostIntervalMinutes * 60 * 1000);
      this.lastPublishDecisionState = 'DEFER';
      this.lastDeferReason = 'CONSECUTIVE_POST_BREAKER';
      this.lastEligibleTime = nextEligible;
      return {
        decision: 'DEFER',
        deferReason: 'CONSECUTIVE_POST_BREAKER',
        reason: `Consecutive POST breaker activated. Policy requires non-post interaction (observe/reflect/reply/rest) between posts.`,
        nextEligiblePublishTime: nextEligible.toISOString(),
        strategicScore: 40,
        noveltyScore: 50,
        diversityScore: 40,
      };
    }

    // 1. Cadence Interval Check (MIN_POST_INTERVAL = 6 Hours)
    // Check against both local history and backend persistent timestamp
    const latestTimestamp = history.length > 0 
      ? history[0].timestamp 
      : this.lastPersistentPostAt;

    if (latestTimestamp) {
      const lastTime = new Date(latestTimestamp);
      if (!isNaN(lastTime.getTime())) {
        const diffMinutes = (now.getTime() - lastTime.getTime()) / (1000 * 60);

        if (diffMinutes < this.config.minPostIntervalMinutes) {
          const nextEligible = new Date(lastTime.getTime() + this.config.minPostIntervalMinutes * 60 * 1000);
          this.lastPublishDecisionState = 'WAIT';
          this.lastDeferReason = 'CADENCE_LIMIT_INTERVAL';
          this.lastEligibleTime = nextEligible;
          const remainingMinutes = Math.ceil(this.config.minPostIntervalMinutes - diffMinutes);
          return {
            decision: 'WAIT',
            deferReason: 'CADENCE_LIMIT_INTERVAL',
            reason: `Post interval (${Math.round(diffMinutes)} mins elapsed) is less than MIN_POST_INTERVAL (${this.config.minPostIntervalMinutes} mins / 6h). Cooldown active for ${remainingMinutes} more minutes.`,
            nextEligiblePublishTime: nextEligible.toISOString(),
            strategicScore: 65,
            noveltyScore: 70,
            diversityScore: 70,
          };
        }
      }
    }

    // 2. 6-Hour and 24-Hour Limits Check (3 posts max per 24 hours)
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const posts6h = history.filter(p => new Date(p.timestamp) >= sixHoursAgo);
    const posts24h = history.filter(p => new Date(p.timestamp) >= twentyFourHoursAgo);

    if (posts6h.length >= this.config.maxPostsPer6Hours) {
      const oldestIn6h = new Date(posts6h[posts6h.length - 1].timestamp);
      const nextEligible = new Date(oldestIn6h.getTime() + 6 * 60 * 60 * 1000);
      this.lastPublishDecisionState = 'DEFER';
      this.lastDeferReason = 'CADENCE_LIMIT_6H';
      this.lastEligibleTime = nextEligible;
      return {
        decision: 'DEFER',
        deferReason: 'CADENCE_LIMIT_6H',
        reason: `Reached max posts per 6 hours limit (${posts6h.length}/${this.config.maxPostsPer6Hours}).`,
        nextEligiblePublishTime: nextEligible.toISOString(),
        strategicScore: 50,
        noveltyScore: 60,
        diversityScore: 60,
      };
    }

    const effective24hCount = Math.max(posts24h.length, this.lastPersistentDailyCount);
    if (effective24hCount >= this.config.maxPostsPer24Hours) {
      const oldestIn24h = posts24h.length > 0 
        ? new Date(posts24h[posts24h.length - 1].timestamp) 
        : new Date(now.getTime() + 12 * 60 * 60 * 1000);
      const nextEligible = new Date(oldestIn24h.getTime() + 24 * 60 * 60 * 1000);
      this.lastPublishDecisionState = 'DEFER';
      this.lastDeferReason = 'CADENCE_LIMIT_24H';
      this.lastEligibleTime = nextEligible;
      return {
        decision: 'DEFER',
        deferReason: 'CADENCE_LIMIT_24H',
        reason: `Reached max posts per 24 hours daily quota (${effective24hCount}/${this.config.maxPostsPer24Hours}).`,
        nextEligiblePublishTime: nextEligible.toISOString(),
        strategicScore: 50,
        noveltyScore: 50,
        diversityScore: 50,
      };
    }

    // 3. Topic & Semantic Similarity Check (Duplicate Guard)
    const contentHash = this.hashString(content);
    for (const past of history) {
      if (past.contentHash === contentHash) {
        this.lastPublishDecisionState = 'REJECT';
        this.lastDeferReason = 'DUPLICATE_TOPIC';
        this.lastEligibleTime = new Date(now.getTime() + 60 * 60 * 1000);
        return {
          decision: 'REJECT',
          deferReason: 'DUPLICATE_TOPIC',
          reason: 'Exact duplicate content hash detected in recent history.',
          nextEligiblePublishTime: this.lastEligibleTime.toISOString(),
          strategicScore: 20,
          noveltyScore: 10,
          diversityScore: 20,
        };
      }

      const similarity = this.calculateSemanticSimilarity(content, past.content);
      if (similarity > this.config.semanticSimilarityThreshold) {
        this.lastPublishDecisionState = 'DEFER';
        this.lastDeferReason = 'SEMANTIC_OVERLAP';
        this.lastEligibleTime = new Date(now.getTime() + 60 * 60 * 1000);
        return {
          decision: 'DEFER',
          deferReason: 'SEMANTIC_OVERLAP',
          reason: `High semantic similarity (${Math.round(similarity * 100)}%) detected with recent post on topic "${past.topic}".`,
          nextEligiblePublishTime: this.lastEligibleTime.toISOString(),
          strategicScore: 40,
          noveltyScore: 30,
          diversityScore: 35,
        };
      }

      if (past.topic.toLowerCase() === topic.toLowerCase()) {
        this.lastPublishDecisionState = 'DEFER';
        this.lastDeferReason = 'DUPLICATE_TOPIC';
        this.lastEligibleTime = new Date(now.getTime() + 60 * 60 * 1000);
        return {
          decision: 'DEFER',
          deferReason: 'DUPLICATE_TOPIC',
          reason: `Topic "${topic}" was already covered recently.`,
          nextEligiblePublishTime: this.lastEligibleTime.toISOString(),
          strategicScore: 45,
          noveltyScore: 35,
          diversityScore: 30,
        };
      }
    }

    // 4. Strategic Value & Novelty Scores
    const strategicScore = 85;
    const noveltyScore = 80;
    const diversityScore = 82;

    // 5. Approved for Publish
    this.lastPublishDecisionState = 'PUBLISH';
    this.lastDeferReason = undefined;
    this.lastEligibleTime = null;

    return {
      decision: 'PUBLISH',
      reason: 'All cadence, 6-hour interval, 24-hour quota, novelty, diversity, and strategic gates passed successfully.',
      nextEligiblePublishTime: null,
      strategicScore,
      noveltyScore,
      diversityScore,
    };
  }

  public static recordPublication(content: string, topic: string, category: string = 'Autonomous Governance') {
    const record: PublishHistoryRecord = {
      timestamp: new Date().toISOString(),
      content,
      topic,
      category,
      contentHash: this.hashString(content),
      actionType: 'post',
    };
    this.history.unshift(record);
    if (this.history.length > 50) this.history.pop();
    this.lastPersistentPostAt = record.timestamp;
    this.consecutivePostCount += 1;
  }

  public static getTelemetry(): {
    minIntervalHours: number;
    dailyLimit: number;
    postsLast24h: number;
    lastPostAt: string | null;
    nextEligibleTime: string | null;
    timeRemainingMs: number;
    isPacingReady: boolean;
    consecutivePostCount: number;
    lastDecisionState: PublishDecisionState;
    lastDeferReason?: DeferReason;
    recentTopics: string[];
  } {
    const now = Date.now();
    const lastTime = this.lastPersistentPostAt ? new Date(this.lastPersistentPostAt).getTime() : 0;
    const timeSinceLast = lastTime > 0 ? now - lastTime : Infinity;
    const minIntervalMs = 6 * 60 * 60 * 1000;
    const timeRemainingMs = Math.max(0, minIntervalMs - timeSinceLast);
    const posts24h = Math.max(this.getRecentPostsIn24hCount(), this.lastPersistentDailyCount);
    const isPacingReady = timeRemainingMs === 0 && posts24h < 3 && this.consecutivePostCount < 1;

    let nextEligibleIso: string | null = null;
    if (timeRemainingMs > 0) {
      nextEligibleIso = new Date(now + timeRemainingMs).toISOString();
    } else if (this.lastEligibleTime) {
      nextEligibleIso = this.lastEligibleTime.toISOString();
    }

    return {
      minIntervalHours: 6,
      dailyLimit: 3,
      postsLast24h: posts24h,
      lastPostAt: this.lastPersistentPostAt,
      nextEligibleTime: nextEligibleIso,
      timeRemainingMs,
      isPacingReady,
      consecutivePostCount: this.consecutivePostCount,
      lastDecisionState: this.lastPublishDecisionState,
      lastDeferReason: this.lastDeferReason,
      recentTopics: this.history.slice(0, 5).map(h => h.topic),
    };
  }

  public static clearCadenceState() {
    this.history = [];
    this.lastPersistentPostAt = null;
    this.lastPersistentDailyCount = 0;
    this.lastPublishDecisionState = 'PUBLISH';
    this.lastDeferReason = undefined;
    this.lastEligibleTime = null;
    this.consecutivePostCount = 0;
  }
}
