import { SimulatedPost, SimulatedComment, PublishLifecycleStatus, SocialPlatformAdapter, PublishPostOptions } from '../types';
import { IdempotencyGuard } from '../idempotencyGuard';
import { CadencePolicyManager } from '../cadencePolicy';
import { auth } from '../../lib/firebase';

export class RealXAdapter implements SocialPlatformAdapter {
  platformName = 'X (Twitter) API v2 (Real Production)';
  isConnected = false;

  private apiKey: string;
  private apiSecret: string;
  private accessToken: string;
  private accessSecret: string;
  private posts: SimulatedPost[];

  constructor(initialPosts: SimulatedPost[], apiKey?: string, apiSecret?: string, accessToken?: string, accessSecret?: string) {
    this.posts = this.deduplicatePosts([...initialPosts]);
    this.apiKey = apiKey || '';
    this.apiSecret = apiSecret || '';
    this.accessToken = accessToken || '';
    this.accessSecret = accessSecret || '';
    this.isConnected = Boolean(this.accessToken);
  }

  public updateCredentials(apiKey: string, apiSecret: string, accessToken: string, accessSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.accessToken = accessToken;
    this.accessSecret = accessSecret;
    this.isConnected = Boolean(this.accessToken);
  }

  private deduplicatePosts(postsList: SimulatedPost[]): SimulatedPost[] {
    const seenIds = new Set<string>();
    const seenDecisionIds = new Set<string>();
    const seenHashes = new Set<string>();
    const result: SimulatedPost[] = [];

    for (const post of postsList) {
      if (post.id && seenIds.has(post.id)) continue;
      if (post.decisionId && seenDecisionIds.has(post.decisionId)) continue;
      
      // If published with xTweetId, ensure only one instance of that tweet
      if (post.xTweetId && seenIds.has(`tweet_${post.xTweetId}`)) continue;

      if (post.id) seenIds.add(post.id);
      if (post.xTweetId) seenIds.add(`tweet_${post.xTweetId}`);
      if (post.decisionId) seenDecisionIds.add(post.decisionId);
      
      result.push(post);
    }
    return result;
  }

  async fetchRecentFeed(): Promise<SimulatedPost[]> {
    this.posts = this.deduplicatePosts(this.posts);
    return [...this.posts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async publishPost(content: string, mediaPrompt?: string, tags: string[] = [], options?: PublishPostOptions): Promise<SimulatedPost> {
    const fullText = (tags && tags.length > 0) ? `${content.trim()}\n\n${tags.join(' ')}` : content.trim();
    const decisionId = options?.decisionId || `dec_x_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const contentHash = options?.contentHash || IdempotencyGuard.generateContentHash(fullText);

    // 0. Hard Pacing / Cooldown Gate evaluation
    const hardGate = CadencePolicyManager.checkPacingHardGate();
    if (!hardGate.isAllowed) {
      console.log(`[FK:PUBLISH] decisionId=${decisionId} contentHash=${contentHash} action=COOLDOWN_SKIPPED status=SKIPPED xTweetId=none reason="${hardGate.reason}"`);
      return {
        id: `skipped_${Date.now()}`,
        decisionId,
        contentHash,
        publishStatus: 'SKIPPED',
        xTweetId: undefined,
        publishError: hardGate.reason,
        author: {
          id: 'firekeeper_x',
          name: 'FIRE KEEPER · Autonomous Intelligence',
          handle: '@firekeeper_ai',
          avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
          isSelf: true,
          badge: `Pacing Active (${hardGate.remainingMinutes}m remaining)`,
        },
        content: fullText,
        mediaType: mediaPrompt ? 'image_prompt' : 'text',
        mediaDescription: mediaPrompt || 'Autonomous Strategic Concept',
        timestamp: new Date().toISOString(),
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        tags: tags.length > 0 ? tags : ['#AIGovernance', '#FireKeeperX'],
        isGoverned: true,
        governanceDecision: 'SKIPPED',
        governanceReason: hardGate.reason,
        apiStatus: 'SANDBOX',
        platform: 'x',
        comments: [],
      };
    }

    // 1. Idempotency Check: 1 Decision = 1 Canonical Record
    const existingByDecision = this.posts.find(p => p.decisionId === decisionId);
    if (existingByDecision) {
      if (existingByDecision.publishStatus === 'PUBLISHED' && existingByDecision.xTweetId) {
        console.log(`[FK:PUBLISH] decisionId=${decisionId} contentHash=${contentHash} action=ALREADY_PUBLISHED status=PUBLISHED xTweetId=${existingByDecision.xTweetId}`);
        return existingByDecision;
      }
      if (existingByDecision.publishStatus === 'PUBLISHING') {
        console.log(`[FK:PUBLISH] decisionId=${decisionId} contentHash=${contentHash} action=ALREADY_IN_FLIGHT status=PUBLISHING xTweetId=none`);
        return existingByDecision;
      }
    }

    // 2. Deduplication Check by Content Hash for self-posts
    const existingByContent = this.posts.find(p => p.author.isSelf && p.contentHash === contentHash && p.publishStatus === 'PUBLISHED' && p.xTweetId);
    if (existingByContent) {
      console.log(`[FK:PUBLISH] decisionId=${decisionId} contentHash=${contentHash} action=DUPLICATE_CONTENT_PREVENTED status=BLOCKED xTweetId=${existingByContent.xTweetId}`);
      return existingByContent;
    }

    let tweetId: string | undefined = undefined;
    let localPostId = `sandbox_post_${Date.now()}`;
    let publishStatus: PublishLifecycleStatus = this.isConnected ? 'PUBLISHING' : 'GOVERNANCE_PASSED';
    let governanceDecision: 'PASSED' | 'BLOCKED' | 'GUARDED' | 'SKIPPED' = 'PASSED';
    let governanceReason = '';
    let apiStatus: 'CONNECTED' | 'DISCONNECTED' | 'OFFLINE' | 'SANDBOX' = this.isConnected ? 'CONNECTED' : 'SANDBOX';
    let badgeText = this.isConnected ? 'Publishing to X...' : 'Sandbox Generated (Not on X)';
    let publishError: string | undefined = undefined;

    if (this.isConnected) {
      console.log(`[FK:PUBLISH] decisionId=${decisionId} contentHash=${contentHash} action=START_PUBLISH status=PUBLISHING xTweetId=none`);
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        
        // Pass Firebase ID Token if signed in
        if (auth.currentUser) {
          try {
            const token = await auth.currentUser.getIdToken();
            if (token) headers['Authorization'] = `Bearer ${token}`;
          } catch (tokenErr) {
            console.warn('[Real X Adapter] Could not obtain Firebase ID token:', tokenErr);
          }
        }

        const res = await fetch('/api/x/publish', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            text: fullText,
            apiKey: this.apiKey || undefined,
            apiSecret: this.apiSecret || undefined,
            accessToken: this.accessToken === 'PERSISTENT_BACKEND_TOKEN' ? undefined : this.accessToken,
            accessSecret: this.accessSecret || undefined,
          }),
        });

        const data = await res.json() as any;
        if (res.ok && data.success && data.tweetId) {
          // X Real is the Single Source of Truth for Published Status
          tweetId = String(data.tweetId);
          localPostId = tweetId;
          publishStatus = 'PUBLISHED';
          governanceDecision = 'PASSED';
          apiStatus = 'CONNECTED';
          badgeText = `Live on Real X (${tweetId})`;
          console.log(`[FK:PUBLISH] decisionId=${decisionId} contentHash=${contentHash} action=PUBLISH_SUCCESS status=PUBLISHED xTweetId=${tweetId}`);
        } else {
          const isDuplicate = data.status === 'DUPLICATE_CONTENT_BLOCKED' || /duplicate/i.test(data.message || data.detail || data.reason || '');
          const isPacingCooldown = data.status === 'PACING_COOLDOWN_ACTIVE' || data.status === 'DAILY_QUOTA_EXCEEDED' || /cooldown|interval|quota/i.test(data.message || data.reason || '');
          if (isDuplicate) {
            publishStatus = 'BLOCKED';
            governanceDecision = 'BLOCKED';
            governanceReason = 'Duplicate content detected';
            apiStatus = 'CONNECTED';
            badgeText = 'Governance: BLOCKED (Duplicate content)';
            publishError = 'Duplicate content detected';
            console.log(`[FK:PUBLISH] decisionId=${decisionId} contentHash=${contentHash} action=BLOCKED status=BLOCKED xTweetId=none reason="Duplicate content"`);
          } else if (isPacingCooldown) {
            publishStatus = 'SKIPPED';
            governanceDecision = 'SKIPPED';
            governanceReason = data.reason || data.message || 'Pacing Cooldown Active';
            apiStatus = data.apiStatus || 'CONNECTED';
            badgeText = `Pacing: SKIPPED (${data.reason || 'Cooldown'})`;
            publishError = governanceReason;
            console.log(`[FK:PUBLISH] decisionId=${decisionId} contentHash=${contentHash} action=COOLDOWN_SKIPPED status=SKIPPED xTweetId=none reason="${governanceReason}"`);
          } else if (res.status === 401 || data.status === 'TOKEN_EXPIRED') {
            publishStatus = 'FAILED';
            governanceDecision = 'GUARDED';
            governanceReason = 'Token Expired';
            apiStatus = 'DISCONNECTED';
            badgeText = 'X Token Expired (Reauthorization Required)';
            publishError = 'Token Expired';
            console.log(`[FK:PUBLISH] decisionId=${decisionId} contentHash=${contentHash} action=AUTH_FAILED status=FAILED xTweetId=none`);
          } else {
            publishStatus = 'FAILED';
            governanceDecision = data.governanceDecision || 'GUARDED';
            governanceReason = data.reason || data.message || 'Governance Intercepted';
            apiStatus = data.apiStatus || 'CONNECTED';
            badgeText = data.message || `X Publish Failed: ${data.reason || 'Protected'}`;
            publishError = governanceReason;
            console.log(`[FK:PUBLISH] decisionId=${decisionId} contentHash=${contentHash} action=PUBLISH_ERROR status=FAILED xTweetId=none error="${governanceReason}"`);
          }
        }
      } catch (err: any) {
        publishStatus = 'FAILED';
        governanceDecision = 'GUARDED';
        governanceReason = 'Network Offline';
        apiStatus = 'OFFLINE';
        badgeText = 'X API Offline';
        publishError = err.message;
        console.log(`[FK:PUBLISH] decisionId=${decisionId} contentHash=${contentHash} action=NETWORK_ERROR status=FAILED xTweetId=none error="${err.message}"`);
      }
    } else {
      // Sandbox mode: Governance passed locally, but explicitly not published to Real X
      publishStatus = 'GOVERNANCE_PASSED';
      governanceDecision = 'PASSED';
      apiStatus = 'SANDBOX';
      badgeText = 'Sandbox Simulation (Local Only - Not on X)';
      console.log(`[FK:PUBLISH] decisionId=${decisionId} contentHash=${contentHash} action=SANDBOX_SIMULATION status=GOVERNANCE_PASSED xTweetId=none`);
    }

    const newPost: SimulatedPost = {
      id: localPostId,
      decisionId,
      contentHash,
      publishStatus,
      xTweetId: tweetId,
      publishedAt: tweetId ? new Date().toISOString() : undefined,
      publishError,
      author: {
        id: 'firekeeper_x',
        name: 'FIRE KEEPER · Autonomous Intelligence',
        handle: '@firekeeper_ai',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
        isSelf: true,
        badge: badgeText,
      },
      content: fullText,
      mediaType: mediaPrompt ? 'image_prompt' : 'text',
      mediaDescription: mediaPrompt || 'Autonomous Strategic Concept',
      timestamp: new Date().toISOString(),
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      tags: tags.length > 0 ? tags : ['#AIGovernance', '#FireKeeperX'],
      isGoverned: true,
      governanceDecision,
      governanceReason,
      apiStatus,
      platform: 'x',
      comments: [],
    };

    // Update existing record if decisionId matched, or prepend new record
    const existingIndex = this.posts.findIndex(p => p.decisionId === decisionId);
    if (existingIndex >= 0) {
      this.posts[existingIndex] = newPost;
    } else {
      this.posts.unshift(newPost);
    }

    this.posts = this.deduplicatePosts(this.posts);
    return newPost;
  }

  async postComment(postId: string, commentText: string, inReplyToCommentId?: string): Promise<SimulatedComment> {
    const targetPost = this.posts.find((p) => p.id === postId);
    const targetTweetId = inReplyToCommentId || targetPost?.xTweetId || (postId.match(/^\d+$/) ? postId : undefined);

    let replyTweetId = `tweet_reply_${Date.now()}`;
    let isRealPosted = false;

    if (this.isConnected && targetTweetId) {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (auth.currentUser) {
          try {
            const token = await auth.currentUser.getIdToken();
            if (token) headers['Authorization'] = `Bearer ${token}`;
          } catch {}
        }

        const res = await fetch('/api/x/publish', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            text: commentText.trim(),
            inReplyToTweetId: targetTweetId,
            apiKey: this.apiKey || undefined,
            apiSecret: this.apiSecret || undefined,
            accessToken: this.accessToken === 'PERSISTENT_BACKEND_TOKEN' ? undefined : this.accessToken,
            accessSecret: this.accessSecret || undefined,
          }),
        });

        const data = await res.json() as any;
        if (res.ok && data.success && data.tweetId) {
          replyTweetId = String(data.tweetId);
          isRealPosted = true;
          console.log(`[FK:REPLY] Successfully replied to X tweet ${targetTweetId}, reply ID: ${replyTweetId}`);
        } else {
          console.warn('[FK:REPLY] Failed to post reply to Real X, saved to local state:', data.message);
        }
      } catch (err: any) {
        console.warn('[FK:REPLY] Network error replying to Real X:', err.message);
      }
    }

    const newComment: SimulatedComment = {
      id: replyTweetId,
      postId,
      author: {
        id: 'firekeeper_x',
        name: 'FIRE KEEPER · Autonomous Intelligence',
        handle: '@firekeeper_ai',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
        isSelf: true,
      },
      content: commentText,
      timestamp: new Date().toISOString(),
      likesCount: 0,
      sentiment: 'constructive',
    };

    if (targetPost) {
      targetPost.comments.push(newComment);
      targetPost.commentsCount += 1;
    }

    return newComment;
  }

  async likePost(postId: string): Promise<boolean> {
    const target = this.posts.find((p) => p.id === postId);
    if (target) {
      target.likesCount += 1;
      return true;
    }
    return false;
  }

  async getAccountProfile() {
    return {
      handle: '@firekeeper_ai',
      displayName: 'FIRE KEEPER · X (Twitter) API v2',
      followersCount: 2540,
      followingCount: 310,
      postsCount: this.posts.filter((p) => p.author.isSelf && p.publishStatus === 'PUBLISHED' && p.xTweetId).length,
    };
  }
}
