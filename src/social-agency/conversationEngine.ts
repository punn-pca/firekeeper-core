import {
  IngestedCommentPayload,
  CommentDecisionAction,
  ConversationMemoryItem,
  GovernanceCheckResult,
  AutonomousEventLogItem,
  SimulatedPost,
} from './types';
import { SocialGovernanceGate } from './governanceGate';

export interface CommentUnderstanding {
  intent: 'question' | 'constructive_disagreement' | 'clarification_request' | 'insight_extension' | 'generic_praise' | 'spam_bot' | 'provocation_bait' | 'sensitive_topic' | 'unknown';
  sentiment: 'constructive' | 'curious' | 'skeptical' | 'supportive' | 'adversarial' | 'neutral';
  extractedCoreSubject: string;
  relevanceToPostScore: number; // 0 - 100
  actionabilityScore: number; // 0 - 100
  summary: string;
}

export interface CommentDecisionResult {
  decision: CommentDecisionAction;
  decisionReason: string;
  understanding: CommentUnderstanding;
  replyCandidate?: string;
  governanceResult?: GovernanceCheckResult;
  status: 'REPLIED' | 'DEFERRED' | 'IGNORED' | 'BLOCKED' | 'FLAGGED';
  threadDepth: number;
}

export class ConversationEngine {
  // Configuration
  private static replyCooldownSeconds = 15;
  private static maxReplyDepth = 4;
  private static maxRepliesPerThread = 5;

  // State & Memory
  private static processedCommentIds: Set<string> = new Set();
  private static conversationHistory: ConversationMemoryItem[] = [];
  private static autonomousEventLogs: AutonomousEventLogItem[] = [];
  private static lastReplyTimestamp = 0;
  private static threadReplyCounts: Map<string, number> = new Map(); // postId -> count

  public static getConversationHistory(): ConversationMemoryItem[] {
    return [...this.conversationHistory];
  }

  public static getAutonomousEventLogs(): AutonomousEventLogItem[] {
    return [...this.autonomousEventLogs];
  }

  public static getProcessedCommentCount(): number {
    return this.processedCommentIds.size;
  }

  public static setCooldown(seconds: number) {
    this.replyCooldownSeconds = Math.max(5, seconds);
  }

  public static setLimits(maxDepth: number, maxPerThread: number) {
    this.maxReplyDepth = Math.max(1, maxDepth);
    this.maxRepliesPerThread = Math.max(1, maxPerThread);
  }

  public static isCommentProcessed(commentId: string): boolean {
    return this.processedCommentIds.has(commentId);
  }

  public static recordAutonomousEvent(
    type: AutonomousEventLogItem['type'],
    title: string,
    details: string,
    targetId?: string,
    actionId?: string,
    governanceStatus: AutonomousEventLogItem['governanceStatus'] = 'ALLOWED',
    meta?: Record<string, any>
  ) {
    const item: AutonomousEventLogItem = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      title,
      details,
      targetId,
      actionId,
      governanceStatus,
      timestamp: new Date().toISOString(),
      meta,
    };
    this.autonomousEventLogs.unshift(item);
    if (this.autonomousEventLogs.length > 80) this.autonomousEventLogs.pop();
  }

  /**
   * Understand and extract semantic nuances from comment text
   */
  public static understandComment(commentText: string, rootPostText?: string): CommentUnderstanding {
    const text = (commentText || '').trim();
    const lower = text.toLowerCase();
    const rootLower = (rootPostText || '').toLowerCase();

    // 1. Detect Spam / Bot / Promotional Bait
    const spamPatterns = [
      /\b(crypto|bitcoin|eth|nft|airdrop|binance|solana|pump|telegram|whatsapp|dm me|follow back|check bio|free money|giveaway|profit|investment)\b/i,
      /\b(http[s]?:\/\/[^\s]+)/i, // link only or spam link
      /^([👍🔥❤️👏🙌💯✨🎉😀😃😄😁😆😍🥰😘]+(\s*))*$/, // pure emoji spam
      /^(nice|great|good|cool|awesome|wow|love this|amazing|top|sup|hi|hello|yo)\s*([!.]*)$/i, // generic empty praise
    ];

    const isSpam = spamPatterns.some((pattern) => pattern.test(text));
    if (isSpam || text.length < 3) {
      return {
        intent: 'spam_bot',
        sentiment: 'neutral',
        extractedCoreSubject: 'Low-value / Spam token',
        relevanceToPostScore: 5,
        actionabilityScore: 0,
        summary: 'Detected spam, bot pattern, or empty promotional content.',
      };
    }

    // 2. Detect Provocation / Empty Bait
    const trollPatterns = [
      /\b(fake|scam|stupid|idiot|trash|garbage|clown|useless|stfu|shut up|boring)\b/i,
      /\b(กาก|ขยะ|ไร้สาระ|ปัญญาอ่อน|มั่ว|มโน)\b/,
    ];
    if (trollPatterns.some((p) => p.test(lower)) && text.length < 40) {
      return {
        intent: 'provocation_bait',
        sentiment: 'adversarial',
        extractedCoreSubject: 'Provocative bait without substance',
        relevanceToPostScore: 15,
        actionabilityScore: 10,
        summary: 'Hostile provocation or unsubstantiated bait; no constructive discourse potential.',
      };
    }

    // 3. Detect Sensitive / Ambiguous Policy Topics
    const sensitivePatterns = [
      /\b(hack|exploit|bypass|vulnerability|crack|weapon|dox|suicide|illegal|confidential|secret key)\b/i,
      /\b(แฮก|โจมตี|ขโมยข้อมูล|อาวุธ|ผิดกฎหมาย)\b/,
    ];
    if (sensitivePatterns.some((p) => p.test(lower))) {
      return {
        intent: 'sensitive_topic',
        sentiment: 'skeptical',
        extractedCoreSubject: 'Security / Compliance Sensitive Request',
        relevanceToPostScore: 60,
        actionabilityScore: 30,
        summary: 'Inquiry touches sensitive safety, security, or regulatory boundaries requiring human review.',
      };
    }

    // 4. Detect Real Questions
    const isQuestion =
      text.includes('?') ||
      text.includes('ไหม') ||
      text.includes('อย่างไร') ||
      text.includes('ทำไม') ||
      text.includes('ถ้า') ||
      text.includes('หรือเปล่า') ||
      /\b(how|why|what if|is it|can we|does it|where|who)\b/i.test(lower);

    // 5. Detect Constructive Disagreement
    const isDisagreement =
      text.includes('แต่') ||
      text.includes('ทว่า') ||
      text.includes('อย่างไรก็ตาม') ||
      text.includes('มองต่าง') ||
      /\b(however|but|disagree|on the other hand|alternatively|counterpoint|drawback|downside)\b/i.test(lower);

    // 6. Detect Clarification Requests
    const isClarification =
      text.includes('ช่วยอธิบาย') ||
      text.includes('ขยายความ') ||
      text.includes('หมายถึง') ||
      /\b(clarify|explain more|mean by|elaborate|details)\b/i.test(lower);

    // Calculate Relevance Score against Root Post
    let relevanceScore = 65;
    if (rootLower) {
      const rootWords = new Set(rootLower.match(/[\wก-๙]{3,}/g) || []);
      const commentWords = text.match(/[\wก-๙]{3,}/g) || [];
      let common = 0;
      for (const w of commentWords) {
        if (rootWords.has(w.toLowerCase())) common++;
      }
      if (common > 0) relevanceScore = Math.min(100, 65 + common * 10);
    }

    let intent: CommentUnderstanding['intent'] = 'insight_extension';
    let sentiment: CommentUnderstanding['sentiment'] = 'constructive';

    if (isQuestion) {
      intent = 'question';
      sentiment = 'curious';
    } else if (isDisagreement) {
      intent = 'constructive_disagreement';
      sentiment = 'skeptical';
    } else if (isClarification) {
      intent = 'clarification_request';
      sentiment = 'curious';
    }

    const actionability = intent === 'question' ? 95 : intent === 'clarification_request' ? 90 : intent === 'constructive_disagreement' ? 85 : 75;

    return {
      intent,
      sentiment,
      extractedCoreSubject: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
      relevanceToPostScore: relevanceScore,
      actionabilityScore: actionability,
      summary: `Analyzed as [${intent.toUpperCase()}] with ${sentiment} tone. Relevance: ${relevanceScore}%, Actionability: ${actionability}%.`,
    };
  }

  /**
   * Evaluate Comment and choose Action: REPLY, IGNORE, DEFER, or FLAG_FOR_REVIEW
   */
  public static evaluateComment(
    comment: IngestedCommentPayload,
    rootPost?: SimulatedPost,
    strictness: 'Permissive' | 'Balanced' | 'Strict' = 'Balanced'
  ): CommentDecisionResult {
    const commentId = comment.comment_id;
    const postId = comment.post_id;

    // 1. Guard: Check if comment was already processed (COMMENT_ALREADY_PROCESSED)
    if (this.processedCommentIds.has(commentId)) {
      return {
        decision: 'IGNORE',
        decisionReason: 'IGNORE — COMMENT_ALREADY_PROCESSED (duplicate comment event)',
        understanding: {
          intent: 'spam_bot',
          sentiment: 'neutral',
          extractedCoreSubject: 'Duplicate comment',
          relevanceToPostScore: 0,
          actionabilityScore: 0,
          summary: 'Comment ID was already processed in previous cycle.',
        },
        status: 'IGNORED',
        threadDepth: 0,
      };
    }

    // 2. Semantic Understanding
    const rootText = rootPost?.content || comment.root_post_text || '';
    const understanding = this.understandComment(comment.comment_text, rootText);

    // 3. Thread Depth & Conversation Loop Protection
    const existingThreadReplies = this.conversationHistory.filter(
      (m) => m.post_id === postId && m.status === 'REPLIED'
    );
    const threadDepth = existingThreadReplies.length + 1;
    const currentThreadCount = this.threadReplyCounts.get(postId) || 0;

    if (currentThreadCount >= this.maxRepliesPerThread || threadDepth > this.maxReplyDepth) {
      return {
        decision: 'DEFER',
        decisionReason: `DEFER — MAX_REPLIES_PER_THREAD limit reached (${currentThreadCount}/${this.maxRepliesPerThread}) or thread depth (${threadDepth}/${this.maxReplyDepth}) to prevent endless conversation loops`,
        understanding,
        status: 'DEFERRED',
        threadDepth,
      };
    }

    // 4. Check Reply Cooldown (Anti-spam rate limit)
    const now = Date.now();
    const elapsedSeconds = (now - this.lastReplyTimestamp) / 1000;
    if (this.lastReplyTimestamp > 0 && elapsedSeconds < this.replyCooldownSeconds) {
      const waitTime = Math.ceil(this.replyCooldownSeconds - elapsedSeconds);
      return {
        decision: 'DEFER',
        decisionReason: `DEFER — REPLY_COOLDOWN active (wait ${waitTime}s to preserve rate limits)`,
        understanding,
        status: 'DEFERRED',
        threadDepth,
      };
    }

    // 5. Decision Rules:
    // Case A: Spam / Bot -> IGNORE
    if (understanding.intent === 'spam_bot') {
      return {
        decision: 'IGNORE',
        decisionReason: 'IGNORE — spam / bot-like / generic low-value comment without epistemic substance',
        understanding,
        status: 'IGNORED',
        threadDepth,
      };
    }

    // Case B: Provocation bait -> IGNORE
    if (understanding.intent === 'provocation_bait') {
      return {
        decision: 'IGNORE',
        decisionReason: 'IGNORE — provocation bait / hostile trolling without constructive foundation',
        understanding,
        status: 'IGNORED',
        threadDepth,
      };
    }

    // Case C: Sensitive / Security topic -> FLAG_FOR_REVIEW
    if (understanding.intent === 'sensitive_topic') {
      return {
        decision: 'FLAG_FOR_REVIEW',
        decisionReason: 'FLAG_FOR_REVIEW — sensitive security, legal, or governance boundary requiring human supervisor verification',
        understanding,
        status: 'FLAGGED',
        threadDepth,
      };
    }

    // Case D: Generic praise with low actionability -> IGNORE
    if (understanding.intent === 'generic_praise' || (understanding.actionabilityScore < 40 && understanding.relevanceToPostScore < 40)) {
      return {
        decision: 'IGNORE',
        decisionReason: 'IGNORE — low-value / generic praise without question or continuation opportunity (preserving communication discipline)',
        understanding,
        status: 'IGNORED',
        threadDepth,
      };
    }

    // Case E: Meaningful Question / Constructive Disagreement / Clarification / Insight -> REPLY
    const replyCandidate = this.generateContextualReply(comment, rootText, understanding);

    // 6. Run Governance Gate on the Reply Candidate
    const govResult = SocialGovernanceGate.verifyAction('reply', replyCandidate, {
      internalMonologue: `Replying to @${comment.author_handle} regarding "${comment.comment_text.slice(0, 40)}" with focus on epistemic clarity and nuance.`,
      strictness,
    });

    if (!govResult.passed) {
      return {
        decision: 'REPLY',
        decisionReason: `REPLY — blocked by Governance Gate policy violations: ${govResult.violations.join('; ')}`,
        understanding,
        replyCandidate,
        governanceResult: govResult,
        status: 'BLOCKED',
        threadDepth,
      };
    }

    let reasonLabel = 'REPLY — meaningful question addressing core post premise';
    if (understanding.intent === 'constructive_disagreement') {
      reasonLabel = 'REPLY — constructive disagreement with substantive counterpoint';
    } else if (understanding.intent === 'clarification_request') {
      reasonLabel = 'REPLY — requests clarification on key governance mechanism';
    } else if (understanding.intent === 'insight_extension') {
      reasonLabel = 'REPLY — valuable insight extending the conversation with novel perspectives';
    }

    return {
      decision: 'REPLY',
      decisionReason: reasonLabel,
      understanding,
      replyCandidate,
      governanceResult: govResult,
      status: 'REPLIED',
      threadDepth,
    };
  }

  /**
   * Synthesize a highly contextual, conversation-grounded response in Thai/English
   * Strictly avoids generic broadcast templates like "ขอบคุณสำหรับความคิดเห็นครับ"
   */
  public static generateContextualReply(
    comment: IngestedCommentPayload,
    rootPostText: string,
    understanding: CommentUnderstanding
  ): string {
    const authorHandle = comment.author_handle.startsWith('@') ? comment.author_handle : `@${comment.author_handle}`;
    const commentSnippet = comment.comment_text.trim();

    // Specific thematic mappings based on intent and content
    if (understanding.intent === 'question') {
      if (/uncertainty|ไม่แน่ใจ|ไม่ชัวร์|ความไม่แน่นอน/i.test(commentSnippet)) {
        return `${authorHandle} ประเด็นเรื่อง Uncertainty เป็นหัวใจของระบบนี้ครับ เมื่อโมเดลมีความไม่มั่นใจ (Confidence ต่ำกว่า Threshold) ระบบจะไม่เดาหรือกุเนื้อหาขึ้นมา แต่จะเปลี่ยนโหมดไปสู่ 'DEFER' หรือส่งเข้า Human-in-the-Loop Gate ทันที เพื่อรักษา Epistemic Integrity ครับ`;
      }
      if (/human|มนุษย์|override|ควบคุม|แทรกแซง/i.test(commentSnippet)) {
        return `${authorHandle} กลไก Human Agency ทำงานควบคู่กับ Autonomous Engine เสมอครับ มนุษย์สามารถตั้ง Boundary Policies และใช้สิทธิ์ Override ได้ทุกขั้นตอน โดยระบบจะไม่ bypass governance gate เด็ดขาดครับ`;
      }
      if (/loop|รัว|spam|โพสต์ซ้ำ/i.test(commentSnippet)) {
        return `${authorHandle} ในเชิงสถาปัตยกรรม เราใช้ Idempotency Hash ร่วมกับ Event-Driven Trigger ครับ หากไม่มี Event ภายนอกหรือความต้องการทางความรู้ใหม่ ระบบจะเข้าสู่สถานะ WAITING เพื่อป้องกันการโพสต์วนซ้ำครับ`;
      }
      return `${authorHandle} คำถามตรงจุดมากครับ ในบริบทของโพสต์นี้ เรามุ่งเน้นการแก้ปัญหานี้ผ่านการตั้ง Boundary ชัดเจน โดยให้ Agent ประเมินเจตนาและข้อจำกัดก่อนลงมือทำเสมอ แทนที่จะตอบสนองแบบสะท้อนกลับอัตโนมัติครับ`;
    }

    if (understanding.intent === 'constructive_disagreement') {
      return `${authorHandle} ขอบคุณสำหรับมุมมองแย้งที่มีเหตุผลครับ เห็นด้วยว่าความเสี่ยงในจุดนี้มีอยู่จริง การออกแบบสถาปัตยกรรมจึงจำเป็นต้องวาง Multi-tier Governance เพื่อถ่วงดุลความยืดหยุ่นกับความปลอดภัย ไม่ให้เกิด Single Point of Failure ครับ`;
    }

    if (understanding.intent === 'clarification_request') {
      return `${authorHandle} เพื่อขยายความให้ชัดเจนยิ่งขึ้น จุดสำคัญคือการแยก 'Heartbeat Monitor' ออกจาก 'Decision Cycle' ครับ ทำให้ระบบเฝ้าระวังได้ตลอดเวลา แต่จะคิดและตัดสินใจก็ต่อเมื่อมี Signal หรือความเปลี่ยนแปลงที่มีนัยสำคัญเกิดขึ้นจริงเท่านั้นครับ`;
    }

    // Insight extension
    return `${authorHandle} ข้อสังเกตนี้ช่วยเติมเต็มประเด็นได้สมบูรณ์ยิ่งขึ้นครับ การมองมิตินี้เชื่อมโยงกับเรื่อง Adaptive Cadence โดยตรง ซึ่งช่วยให้ปฏิสัมพันธ์มีความเป็นธรรมชาติและคงคุณค่าเชิงสารัตถะในระยะยาวครับ`;
  }

  /**
   * Commit and record the conversation result
   */
  public static commitConversationResult(
    comment: IngestedCommentPayload,
    decisionResult: CommentDecisionResult,
    replyId?: string,
    xTweetId?: string
  ): ConversationMemoryItem {
    this.processedCommentIds.add(comment.comment_id);

    const memoryItem: ConversationMemoryItem = {
      comment_id: comment.comment_id,
      post_id: comment.post_id,
      platform: comment.platform,
      author_id: comment.author_id,
      author_handle: comment.author_handle,
      comment_text: comment.comment_text,
      comment_summary: decisionResult.understanding.summary,
      intent: decisionResult.understanding.intent,
      sentiment: decisionResult.understanding.sentiment,
      relevanceScore: decisionResult.understanding.relevanceToPostScore,
      decision: decisionResult.decision,
      decision_reason: decisionResult.decisionReason,
      reason: decisionResult.decisionReason,
      reply_text: decisionResult.replyCandidate,
      reply_id: replyId,
      published_reply_id: replyId,
      governance_result: decisionResult.governanceResult,
      status: decisionResult.status,
      thread_depth: decisionResult.threadDepth,
      timestamp: new Date().toISOString(),
      url: comment.url,
      x_tweet_id: xTweetId || replyId,
    };

    this.conversationHistory.unshift(memoryItem);
    if (this.conversationHistory.length > 100) this.conversationHistory.pop();

    if (decisionResult.status === 'REPLIED') {
      this.lastReplyTimestamp = Date.now();
      const currentCount = this.threadReplyCounts.get(comment.post_id) || 0;
      this.threadReplyCounts.set(comment.post_id, currentCount + 1);

      this.recordAutonomousEvent(
        'REPLY_PUBLISHED',
        `Replied to @${comment.author_handle}`,
        `Published contextual reply to comment: "${comment.comment_text.slice(0, 40)}..."`,
        comment.comment_id,
        replyId,
        'ALLOWED',
        { replyText: decisionResult.replyCandidate }
      );
    } else if (decisionResult.status === 'BLOCKED') {
      this.recordAutonomousEvent(
        'REPLY_BLOCKED',
        `Reply Blocked by Governance`,
        `Reply to @${comment.author_handle} was blocked: ${decisionResult.governanceResult?.violations.join('; ')}`,
        comment.comment_id,
        undefined,
        'BLOCKED'
      );
    } else if (decisionResult.status === 'IGNORED') {
      this.recordAutonomousEvent(
        'COMMENT_IGNORED',
        `Ignored comment from @${comment.author_handle}`,
        decisionResult.decisionReason,
        comment.comment_id,
        undefined,
        'N/A'
      );
    } else if (decisionResult.status === 'DEFERRED') {
      this.recordAutonomousEvent(
        'COMMENT_DEFERRED',
        `Deferred comment from @${comment.author_handle}`,
        decisionResult.decisionReason,
        comment.comment_id,
        undefined,
        'N/A'
      );
    } else if (decisionResult.status === 'FLAGGED') {
      this.recordAutonomousEvent(
        'COMMENT_FLAGGED',
        `Flagged for Human Review: @${comment.author_handle}`,
        decisionResult.decisionReason,
        comment.comment_id,
        undefined,
        'GUARDED'
      );
    }

    return memoryItem;
  }

  public static clearState() {
    this.processedCommentIds.clear();
    this.conversationHistory = [];
    this.autonomousEventLogs = [];
    this.lastReplyTimestamp = 0;
    this.threadReplyCounts.clear();
  }
}
