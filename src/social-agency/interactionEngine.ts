export interface ObservedPostRecord {
  postId: string;
  author: {
    id: string;
    name: string;
    handle: string;
  };
  content: string;
  timestamp: string;
  topic: string;
  relevanceScore: number; // 0 - 100
  relevanceCategory: 'RELEVANT' | 'PARTIALLY_RELEVANT' | 'IRRELEVANT' | 'UNCERTAIN';
  engagementState: 'UNPROCESSED' | 'EVALUATED' | 'ENGAGED' | 'SKIPPED' | 'DEFERRED';
}

export type InteractionDecisionType = 'NO_ACTION' | 'LIKE' | 'COMMENT' | 'SAVE' | 'DEFER';

export type CommentInsightType =
  | 'ADD_INSIGHT'
  | 'ASK_CLARIFYING_QUESTION'
  | 'PROVIDE_COUNTERPOINT'
  | 'CONNECT_CONCEPTS'
  | 'ACKNOWLEDGE_VALID_POINT';

export interface InteractionDecisionEvaluation {
  decision: InteractionDecisionType;
  action: 'LIKE' | 'COMMENT' | 'SAVE' | 'NONE';
  relevanceScore: number;
  confidence: number; // 0.0 - 1.0
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reasoning: string;
  commentType?: CommentInsightType;
  commentContent?: string;
  deferReason?: string;
}

export interface ConversationMemoryRecord {
  authorId: string;
  postId: string;
  interactionType: InteractionDecisionType;
  commentContent?: string;
  timestamp: string;
  conversationTopic: string;
  conversationState: 'ACTIVE' | 'CONCLUDED' | 'STALLED';
}

export interface InteractionTraceRecord {
  observedPostId: string;
  decision: InteractionDecisionType;
  relevanceScore: number;
  reasoning: string;
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  action: 'LIKE' | 'COMMENT' | 'SAVE' | 'NONE';
  timestamp: string;
  commentType?: CommentInsightType;
}

export interface InteractionCadenceConfig {
  minAuthorInteractionIntervalMinutes: number;
  maxInteractionsPerAuthorPer24H: number;
  maxTotalCommentsPer6H: number;
  maxTotalCommentsPer24H: number;
}

export class InteractionGovernanceEngine {
  private static config: InteractionCadenceConfig = {
    minAuthorInteractionIntervalMinutes: 30,
    maxInteractionsPerAuthorPer24H: 3,
    maxTotalCommentsPer6H: 5,
    maxTotalCommentsPer24H: 12,
  };

  private static memory: ConversationMemoryRecord[] = [];
  private static traces: InteractionTraceRecord[] = [];
  private static lastAuthorInteractionMap: Map<string, number> = new Map();

  public static getConfig(): InteractionCadenceConfig {
    return { ...this.config };
  }

  public static updateConfig(newConfig: Partial<InteractionCadenceConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public static getMemory(): ConversationMemoryRecord[] {
    return [...this.memory];
  }

  public static getTraces(): InteractionTraceRecord[] {
    return [...this.traces];
  }

  private static calculateSemanticSimilarity(text1: string, text2: string): number {
    const words1 = new Set((text1 || '').toLowerCase().match(/[\wก-๙]+/g) || []);
    const words2 = new Set((text2 || '').toLowerCase().match(/[\wก-๙]+/g) || []);
    if (words1.size === 0 || words2.size === 0) return 0;
    let intersection = 0;
    for (const w of words1) {
      if (words2.has(w)) intersection++;
    }
    const union = new Set([...words1, [...words2]]).size;
    return union === 0 ? 0 : intersection / union;
  }

  public static classifyRelevance(content: string, topic: string): { score: number; category: ObservedPostRecord['relevanceCategory'] } {
    const coreKeywords = ['ai', 'governance', 'agency', 'ethics', 'autonomy', 'epistemic', 'safety', 'model', 'human', 'ปัญญาประดิษฐ์', 'ธรรมาภิบาล', 'มนุษย์', 'ความปลอดภัย', 'จริยธรรม'];
    const text = (content + ' ' + topic).toLowerCase();
    
    let matches = 0;
    for (const kw of coreKeywords) {
      if (text.includes(kw)) matches++;
    }

    const score = Math.min(100, Math.max(10, matches * 25 + (text.length > 50 ? 15 : 5)));
    let category: ObservedPostRecord['relevanceCategory'] = 'IRRELEVANT';
    if (score >= 70) category = 'RELEVANT';
    else if (score >= 45) category = 'PARTIALLY_RELEVANT';
    else if (score >= 30) category = 'UNCERTAIN';

    return { score, category };
  }

  public static evaluateInteraction(
    postId: string,
    authorId: string,
    authorName: string,
    content: string,
    topic: string,
    existingComments: Array<{ authorId?: string; content: string }> = []
  ): InteractionDecisionEvaluation {
    const now = new Date();

    // 1. Cadence & Author Frequency Check
    const lastAuthorTime = this.lastAuthorInteractionMap.get(authorId) || 0;
    const minutesSinceLastAuthor = (now.getTime() - lastAuthorTime) / (1000 * 60);
    if (lastAuthorTime > 0 && minutesSinceLastAuthor < this.config.minAuthorInteractionIntervalMinutes) {
      return {
        decision: 'DEFER',
        action: 'NONE',
        relevanceScore: 50,
        confidence: 0.9,
        riskLevel: 'LOW',
        reasoning: `Author interaction cadence limit active. Last interaction was ${Math.round(minutesSinceLastAuthor)} mins ago.`,
        deferReason: 'CADENCE_AUTHOR_INTERVAL',
      };
    }

    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const comments6h = this.memory.filter(m => m.interactionType === 'COMMENT' && new Date(m.timestamp) >= sixHoursAgo);
    const comments24h = this.memory.filter(m => m.interactionType === 'COMMENT' && new Date(m.timestamp) >= twentyFourHoursAgo);

    if (comments6h.length >= this.config.maxTotalCommentsPer6H) {
      return {
        decision: 'DEFER',
        action: 'NONE',
        relevanceScore: 60,
        confidence: 0.95,
        riskLevel: 'LOW',
        reasoning: `Reached max total comments per 6 hours limit (${comments6h.length}/${this.config.maxTotalCommentsPer6H}).`,
        deferReason: 'CADENCE_LIMIT_6H',
      };
    }

    if (comments24h.length >= this.config.maxTotalCommentsPer24H) {
      return {
        decision: 'DEFER',
        action: 'NONE',
        relevanceScore: 60,
        confidence: 0.95,
        riskLevel: 'LOW',
        reasoning: `Reached max total comments per 24 hours limit (${comments24h.length}/${this.config.maxTotalCommentsPer24H}).`,
        deferReason: 'CADENCE_LIMIT_24H',
      };
    }

    // 2. Author daily limit check
    const authorInteractions24h = this.memory.filter(m => m.authorId === authorId && new Date(m.timestamp) >= twentyFourHoursAgo);
    if (authorInteractions24h.length >= this.config.maxInteractionsPerAuthorPer24H) {
      return {
        decision: 'NO_ACTION',
        action: 'NONE',
        relevanceScore: 55,
        confidence: 0.88,
        riskLevel: 'LOW',
        reasoning: `Reached max interactions per author limit for ${authorName} in 24h.`,
      };
    }

    // 3. Relevance & Context Check
    const { score: relevanceScore, category } = this.classifyRelevance(content, topic);
    if (category === 'IRRELEVANT' || relevanceScore < 45) {
      return {
        decision: 'NO_ACTION',
        action: 'NONE',
        relevanceScore,
        confidence: 0.85,
        riskLevel: 'LOW',
        reasoning: `Post relevance score (${relevanceScore}) is below threshold for meaningful engagement.`,
      };
    }

    // 4. Check if already commented by agent on this post
    const alreadyCommented = this.memory.some(m => m.postId === postId && m.interactionType === 'COMMENT');
    if (alreadyCommented) {
      return {
        decision: 'NO_ACTION',
        action: 'NONE',
        relevanceScore,
        confidence: 0.95,
        riskLevel: 'LOW',
        reasoning: 'Agent has already commented on this post. Avoiding redundant engagement.',
      };
    }

    // 5. Check semantic similarity with previous agent comments
    const draftComment = this.generateContextualComment(content, topic);
    for (const pastMem of this.memory) {
      if (pastMem.commentContent) {
        const sim = this.calculateSemanticSimilarity(draftComment.content, pastMem.commentContent);
        if (sim > 0.35) {
          return {
            decision: 'DEFER',
            action: 'NONE',
            relevanceScore,
            confidence: 0.8,
            riskLevel: 'LOW',
            reasoning: `Generated comment has high semantic overlap (${Math.round(sim * 100)}%) with past commentary.`,
            deferReason: 'SEMANTIC_OVERLAP',
          };
        }
      }
    }

    // 6. Decision: Comment or Like
    if (relevanceScore >= 75) {
      return {
        decision: 'COMMENT',
        action: 'COMMENT',
        relevanceScore,
        confidence: 0.88,
        riskLevel: 'LOW',
        reasoning: `Post discusses core governance/agency domain with high relevance (${relevanceScore}). Contributing valuable insight.`,
        commentType: draftComment.type,
        commentContent: draftComment.content,
      };
    } else if (relevanceScore >= 55) {
      return {
        decision: 'LIKE',
        action: 'LIKE',
        relevanceScore,
        confidence: 0.75,
        riskLevel: 'LOW',
        reasoning: `Post touches relevant epistemic themes. Acknowledging with a Like to support constructive discourse.`,
      };
    }

    return {
      decision: 'NO_ACTION',
      action: 'NONE',
      relevanceScore,
      confidence: 0.7,
      riskLevel: 'LOW',
      reasoning: 'Insufficient epistemic leverage for active engagement.',
    };
  }

  private static generateContextualComment(content: string, topic: string): { type: CommentInsightType; content: string } {
    const lower = (content + ' ' + topic).toLowerCase();
    if (lower.includes('question') || lower.includes('how') || lower.includes('what') || lower.includes('ไหม') || lower.includes('อย่างไร')) {
      return {
        type: 'ASK_CLARIFYING_QUESTION',
        content: `มุมมองนี้น่าสนใจมากครับ ในมิติของ Governance ระหว่างการกระจายอำนาจของ Agent กับภาระความรับผิดชอบ (Accountability) เราควรออกแบบ boundary อย่างไรให้รัดกุมที่สุด?`,
      };
    } else if (lower.includes('risk') || lower.includes('danger') || lower.includes('unrestricted') || lower.includes('ความเสี่ยง')) {
      return {
        type: 'PROVIDE_COUNTERPOINT',
        content: `เห็นพ้องในประเด็นความเสี่ยงครับ แต่อีกมุมหนึ่ง Autonomy ที่ปราศจาก Epistemic Integrity อาจนำไปสู่ hallucinated policy ได้เช่นกัน การมี Guard จึงเป็นสิ่งจำเป็น`,
      };
    } else {
      return {
        type: 'ADD_INSIGHT',
        content: `นี่คือหัวใจสำคัญของการสร้าง Human Agency ร่วมกับ Autonomous Systems ครับ ความโปร่งใสของ Decision Trace ช่วยลดช่องว่างความไม่ไว้วางใจได้อย่างมีนัยสำคัญ`,
      };
    }
  }

  public static recordInteraction(
    postId: string,
    authorId: string,
    topic: string,
    decision: InteractionDecisionType,
    action: 'LIKE' | 'COMMENT' | 'SAVE' | 'NONE',
    commentContent?: string,
    commentType?: CommentInsightType
  ) {
    const now = new Date();
    if (action === 'COMMENT' || action === 'LIKE') {
      this.lastAuthorInteractionMap.set(authorId, now.getTime());
    }

    const memoryRecord: ConversationMemoryRecord = {
      authorId,
      postId,
      interactionType: decision,
      commentContent,
      timestamp: now.toISOString(),
      conversationTopic: topic,
      conversationState: 'ACTIVE',
    };
    this.memory.unshift(memoryRecord);
    if (this.memory.length > 50) this.memory.pop();

    const traceRecord: InteractionTraceRecord = {
      observedPostId: postId,
      decision,
      relevanceScore: 80,
      reasoning: `Executed action ${action} under governance compliance.`,
      confidence: 0.88,
      riskLevel: 'LOW',
      action: action === 'NONE' ? 'SAVE' : action,
      timestamp: now.toISOString(),
      commentType,
    };
    this.traces.unshift(traceRecord);
    if (this.traces.length > 50) this.traces.pop();
  }
}
